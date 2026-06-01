import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import { createServices } from '../../../src/services/index.js';
import { createControllers } from '../../../src/controllers/index.js';
import createApp from '../../../src/app.js';
import {
  createMockUser,
  createMockAdmin,
  createMockCeo,
  createTestToken,
} from '../../setup.js';
import { ROLES, USER_STATUS } from '../../../src/config/constants.js';

describe('User API Integration', () => {
  let app;
  let mockDb;
  let sandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    mockDb = {
      User: {
        findOne: sandbox.stub(),
        findByPk: sandbox.stub(),
        findAll: sandbox.stub(),
        findAndCountAll: sandbox.stub(),
        create: sandbox.stub(),
      },
      Department: {
        findByPk: sandbox.stub(),
      },
      Location: {
        findByPk: sandbox.stub(),
      },
    };

    const services = createServices(mockDb);
    const controllers = createControllers(services);

    app = await createApp({ db: mockDb, services, controllers });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /api/users', () => {
    const newUserData = {
      email: 'new@mtn-company.rw',
      password: 'Password123',
      firstName: 'New',
      lastName: 'User',
      role: 'staff',
    };

    it('should create user when admin', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      const createdUser = { id: 10, ...newUserData };

      mockDb.User.findByPk.onFirstCall().resolves(mockAdmin);
      mockDb.User.findOne.resolves(null); // No existing user
      mockDb.User.create.resolves(createdUser);
      mockDb.User.findByPk.onSecondCall().resolves(createdUser);

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('email', 'new@mtn-company.rw');
    });

    it('should reject when staff tries to create user', async () => {
      const mockStaff = {
        ...createMockUser(),
        isAdmin: () => false,
        isCeo: () => false,
      };
      const token = createTestToken(mockStaff);

      mockDb.User.findByPk.resolves(mockStaff);

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData);

      expect(res.status).to.equal(403);
      expect(res.body.success).to.be.false;
    });

    it('should reject duplicate email', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.resolves(mockAdmin);
      mockDb.User.findOne.resolves(createMockUser()); // Existing user

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData);

      expect(res.status).to.equal(409);
      expect(res.body.message).to.equal('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.resolves(mockAdmin);

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...newUserData, email: 'invalid-email' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /api/users', () => {
    it('should return paginated users for admin', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      const users = [createMockUser(), createMockAdmin()];

      mockDb.User.findByPk.resolves(mockAdmin);
      mockDb.User.findAndCountAll.resolves({
        count: 2,
        rows: users,
      });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array');
      expect(res.body.pagination).to.have.property('total', 2);
    });

    it('should filter users by role', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.resolves(mockAdmin);
      mockDb.User.findAndCountAll.resolves({
        count: 1,
        rows: [createMockAdmin()],
      });

      const res = await request(app)
        .get('/api/users')
        .query({ role: 'admin' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.length(1);
    });

    it('should reject for staff user', async () => {
      const mockStaff = {
        ...createMockUser(),
        isAdmin: () => false,
        isCeo: () => false,
      };
      const token = createTestToken(mockStaff);

      mockDb.User.findByPk.resolves(mockStaff);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const targetUser = createMockUser();
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.onFirstCall().resolves(mockAdmin);
      mockDb.User.findByPk.onSecondCall().resolves(targetUser);

      const res = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('id', 1);
    });

    it('should return 404 for non-existent user', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.onFirstCall().resolves(mockAdmin);
      mockDb.User.findByPk.onSecondCall().resolves(null);

      const res = await request(app)
        .get('/api/users/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user when admin', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const targetUser = {
        ...createMockUser(),
        update: sandbox.stub().resolves(),
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.onFirstCall().resolves(mockAdmin);
      mockDb.User.findByPk.onSecondCall().resolves(targetUser);
      mockDb.User.findByPk.onThirdCall().resolves({ ...targetUser, firstName: 'Updated' });

      const res = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Updated' });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('should reject when non-CEO tries to assign CEO role', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const targetUser = {
        ...createMockUser(),
        update: sandbox.stub(),
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.onFirstCall().resolves(mockAdmin);
      mockDb.User.findByPk.onSecondCall().resolves(targetUser);

      const res = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ceo' });

      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Only CEO can assign CEO role');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user when admin', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const targetUser = {
        ...createMockUser(),
        destroy: sandbox.stub().resolves(),
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.onFirstCall().resolves(mockAdmin);
      mockDb.User.findByPk.onSecondCall().resolves(targetUser);

      const res = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('should reject when non-CEO tries to delete CEO', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const targetCeo = createMockCeo();
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.onFirstCall().resolves(mockAdmin);
      mockDb.User.findByPk.onSecondCall().resolves(targetCeo);

      const res = await request(app)
        .delete('/api/users/3')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(403);
      expect(res.body.message).to.equal('Only CEO can delete CEO users');
    });
  });

  describe('GET /api/users/:id/direct-reports', () => {
    it('should return direct reports', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      const directReports = [
        createMockUser({ id: 10, managerId: 1 }),
        createMockUser({ id: 11, managerId: 1 }),
      ];

      mockDb.User.findByPk.resolves(mockAdmin);
      mockDb.User.findAll.resolves(directReports);

      const res = await request(app)
        .get('/api/users/1/direct-reports')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.length(2);
    });
  });

  describe('GET /api/users/role/:role', () => {
    it('should return users by role', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      const securityUsers = [
        createMockUser({ id: 10, role: ROLES.SECURITY }),
        createMockUser({ id: 11, role: ROLES.SECURITY }),
      ];

      mockDb.User.findByPk.resolves(mockAdmin);
      mockDb.User.findAll.resolves(securityUsers);

      const res = await request(app)
        .get('/api/users/role/security')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.length(2);
    });

    it('should reject invalid role', async () => {
      const mockAdmin = {
        ...createMockAdmin(),
        isAdmin: () => true,
        isCeo: () => false,
      };
      const token = createTestToken(mockAdmin);

      mockDb.User.findByPk.resolves(mockAdmin);

      const res = await request(app)
        .get('/api/users/role/invalid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(400);
    });
  });
});
