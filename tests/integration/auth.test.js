import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express from 'express';
import { createServices } from '../../../src/services/index.js';
import { createControllers } from '../../../src/controllers/index.js';
import createApp from '../../../src/app.js';
import {
  createMockUser,
  createMockAdmin,
  hashPassword,
  createTestToken,
} from '../../setup.js';
import { USER_STATUS, ROLES } from '../../../src/config/constants.js';

describe('Auth API Integration', () => {
  let app;
  let mockDb;
  let sandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    const hashedPassword = await hashPassword('Password123');

    mockDb = {
      User: {
        findOne: sandbox.stub(),
        findByPk: sandbox.stub(),
      },
      Department: {},
      Location: {},
    };

    const services = createServices(mockDb);
    const controllers = createControllers(services);

    app = await createApp({ db: mockDb, services, controllers });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await hashPassword('Password123');
      const mockUser = {
        ...createMockUser({ password: hashedPassword }),
        validatePassword: sandbox.stub().resolves(true),
        update: sandbox.stub().resolves(),
        toSafeObject: () => ({ id: 1, email: 'test@mtn-company.rw', role: ROLES.STAFF }),
      };

      mockDb.User.findOne.resolves(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@mtn-company.rw',
          password: 'Password123',
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('token');
      expect(res.body.data).to.have.property('user');
    });

    it('should reject invalid credentials', async () => {
      mockDb.User.findOne.resolves(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@email.com',
          password: 'wrongpassword',
        });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid credentials');
    });

    it('should reject missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors).to.be.an('array');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const mockUser = {
        ...createMockUser(),
        isAdmin: () => false,
        isCeo: () => false,
      };
      const token = createTestToken(mockUser);

      mockDb.User.findByPk.resolves(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('email');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        ...createMockUser(),
        validatePassword: sandbox.stub().resolves(true),
        update: sandbox.stub().resolves(),
        isAdmin: () => false,
        isCeo: () => false,
      };
      const token = createTestToken(mockUser);

      mockDb.User.findByPk.resolves(mockUser);

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('should reject mismatched passwords', async () => {
      const mockUser = createMockUser();
      const token = createTestToken(mockUser);

      mockDb.User.findByPk.resolves(mockUser);

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
          confirmPassword: 'DifferentPassword123',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should reject weak password', async () => {
      const mockUser = createMockUser();
      const token = createTestToken(mockUser);

      mockDb.User.findByPk.resolves(mockUser);

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'weak',
          confirmPassword: 'weak',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const mockUser = {
        ...createMockUser(),
        isAdmin: () => false,
        isCeo: () => false,
      };
      const token = createTestToken(mockUser);

      mockDb.User.findByPk.resolves(mockUser);

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.valid).to.be.true;
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        ...createMockUser(),
        isAdmin: () => false,
        isCeo: () => false,
      };
      const token = createTestToken(mockUser);

      mockDb.User.findByPk.resolves(mockUser);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});
