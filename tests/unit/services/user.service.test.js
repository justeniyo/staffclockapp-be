import { expect } from 'chai';
import sinon from 'sinon';
import UserService from '../../../src/services/user.service.js';
import { createMockUser, createMockAdmin, createMockCeo } from '../../setup.js';
import { ROLES } from '../../../src/config/constants.js';

describe('UserService', () => {
  let userService;
  let mockDb;
  let sandbox;

  beforeEach(() => {
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

    userService = new UserService(mockDb);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('create', () => {
    const userData = {
      email: 'new@staffclock.com',
      password: 'Password123',
      firstName: 'New',
      lastName: 'User',
      role: ROLES.STAFF,
    };

    it('should create user successfully', async () => {
      const createdUser = { id: 1, ...userData };

      mockDb.User.findOne.resolves(null); // No existing user
      mockDb.User.create.resolves(createdUser);
      mockDb.User.findByPk.resolves(createdUser);

      const result = await userService.create(userData, ROLES.ADMIN);

      expect(result).to.deep.equal(createdUser);
      expect(mockDb.User.create.calledOnce).to.be.true;
    });

    it('should throw error for duplicate email', async () => {
      mockDb.User.findOne.resolves(createMockUser());

      try {
        await userService.create(userData, ROLES.ADMIN);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Email already registered');
        expect(error.statusCode).to.equal(409);
      }
    });

    it('should throw error when non-CEO tries to create CEO', async () => {
      const ceoData = { ...userData, role: ROLES.CEO };
      mockDb.User.findOne.resolves(null);

      try {
        await userService.create(ceoData, ROLES.ADMIN);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Only CEO can create CEO users');
        expect(error.statusCode).to.equal(403);
      }
    });

    it('should allow CEO to create CEO users', async () => {
      const ceoData = { ...userData, role: ROLES.CEO };
      const createdCeo = { id: 1, ...ceoData };

      mockDb.User.findOne.resolves(null);
      mockDb.User.create.resolves(createdCeo);
      mockDb.User.findByPk.resolves(createdCeo);

      const result = await userService.create(ceoData, ROLES.CEO);

      expect(result.role).to.equal(ROLES.CEO);
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      const mockUser = createMockUser();
      mockDb.User.findByPk.resolves(mockUser);

      const result = await userService.findById(1);

      expect(result).to.deep.equal(mockUser);
    });

    it('should throw error for non-existent user', async () => {
      mockDb.User.findByPk.resolves(null);

      try {
        await userService.findById(999);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
        expect(error.statusCode).to.equal(404);
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [createMockUser(), createMockAdmin()];

      mockDb.User.findAndCountAll.resolves({
        count: 2,
        rows: mockUsers,
      });

      const result = await userService.findAll({ page: 1, limit: 10 });

      expect(result.items).to.have.length(2);
      expect(result.pagination.total).to.equal(2);
    });

    it('should filter by role', async () => {
      const mockAdmins = [createMockAdmin()];

      mockDb.User.findAndCountAll.resolves({
        count: 1,
        rows: mockAdmins,
      });

      const result = await userService.findAll({ role: ROLES.ADMIN });

      expect(result.items).to.have.length(1);
      expect(result.items[0].role).to.equal(ROLES.ADMIN);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        ...createMockUser(),
        update: sandbox.stub().resolves(),
      };

      mockDb.User.findByPk
        .onFirstCall().resolves(mockUser)
        .onSecondCall().resolves({ ...mockUser, firstName: 'Updated' });

      const result = await userService.update(1, { firstName: 'Updated' }, ROLES.ADMIN);

      expect(mockUser.update.calledOnce).to.be.true;
    });

    it('should throw error when non-CEO tries to change user to CEO', async () => {
      const mockUser = {
        ...createMockUser(),
        update: sandbox.stub(),
      };

      mockDb.User.findByPk.resolves(mockUser);

      try {
        await userService.update(1, { role: ROLES.CEO }, ROLES.ADMIN);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Only CEO can assign CEO role');
        expect(error.statusCode).to.equal(403);
      }
    });

    it('should throw error when non-CEO tries to demote CEO', async () => {
      const mockCeo = {
        ...createMockCeo(),
        update: sandbox.stub(),
      };

      mockDb.User.findByPk.resolves(mockCeo);

      try {
        await userService.update(3, { role: ROLES.ADMIN }, ROLES.ADMIN);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Only CEO can change CEO role');
        expect(error.statusCode).to.equal(403);
      }
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        ...createMockUser(),
        destroy: sandbox.stub().resolves(),
      };

      mockDb.User.findByPk.resolves(mockUser);

      const result = await userService.delete(1, ROLES.ADMIN);

      expect(result.message).to.equal('User deleted successfully');
      expect(mockUser.destroy.calledOnce).to.be.true;
    });

    it('should throw error when non-CEO tries to delete CEO', async () => {
      const mockCeo = createMockCeo();
      mockDb.User.findByPk.resolves(mockCeo);

      try {
        await userService.delete(3, ROLES.ADMIN);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Only CEO can delete CEO users');
        expect(error.statusCode).to.equal(403);
      }
    });

    it('should throw error for non-existent user', async () => {
      mockDb.User.findByPk.resolves(null);

      try {
        await userService.delete(999, ROLES.ADMIN);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
        expect(error.statusCode).to.equal(404);
      }
    });
  });

  describe('getDirectReports', () => {
    it('should return direct reports', async () => {
      const directReports = [
        createMockUser({ id: 2, managerId: 1 }),
        createMockUser({ id: 3, managerId: 1 }),
      ];

      mockDb.User.findAll.resolves(directReports);

      const result = await userService.getDirectReports(1);

      expect(result).to.have.length(2);
    });
  });

  describe('findByRole', () => {
    it('should return users by role', async () => {
      const admins = [createMockAdmin()];
      mockDb.User.findAll.resolves(admins);

      const result = await userService.findByRole(ROLES.ADMIN);

      expect(result).to.have.length(1);
      expect(result[0].role).to.equal(ROLES.ADMIN);
    });
  });

  describe('validateRelationships', () => {
    it('should throw error for self-reference as manager', async () => {
      try {
        await userService.validateRelationships({ managerId: 1 }, 1);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('User cannot be their own manager');
      }
    });

    it('should throw error for non-existent manager', async () => {
      mockDb.User.findByPk.resolves(null);

      try {
        await userService.validateRelationships({ managerId: 999 });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Manager not found');
      }
    });

    it('should throw error for non-existent department', async () => {
      mockDb.Department.findByPk.resolves(null);

      try {
        await userService.validateRelationships({ departmentId: 999 });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Department not found');
      }
    });

    it('should throw error for non-existent location', async () => {
      mockDb.Location.findByPk.resolves(null);

      try {
        await userService.validateRelationships({ locationId: 999 });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Location not found');
      }
    });
  });
});
