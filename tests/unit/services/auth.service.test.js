import { expect } from 'chai';
import sinon from 'sinon';
import AuthService from '../../../src/services/auth.service.js';
import { createMockUser, hashPassword } from '../../setup.js';
import { USER_STATUS } from '../../../src/config/constants.js';

describe('AuthService', () => {
  let authService;
  let mockDb;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockDb = {
      User: {
        findOne: sandbox.stub(),
        findByPk: sandbox.stub(),
      },
      Department: {},
      Location: {},
    };

    authService = new AuthService(mockDb);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const hashedPassword = await hashPassword('Password123');
      const mockUser = {
        ...createMockUser({ password: hashedPassword }),
        validatePassword: sandbox.stub().resolves(true),
        update: sandbox.stub().resolves(),
        toSafeObject: sandbox.stub().returns({ id: 1, email: 'test@mtn-company.rw' }),
      };

      mockDb.User.findOne.resolves(mockUser);

      const result = await authService.login('test@mtn-company.rw', 'Password123');

      expect(result).to.have.property('token');
      expect(result).to.have.property('user');
      expect(result.user).to.have.property('email', 'test@mtn-company.rw');
      expect(mockUser.update.calledOnce).to.be.true;
    });

    it('should throw error for invalid email', async () => {
      mockDb.User.findOne.resolves(null);

      try {
        await authService.login('invalid@email.com', 'password');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Invalid credentials');
        expect(error.statusCode).to.equal(401);
      }
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        ...createMockUser(),
        validatePassword: sandbox.stub().resolves(false),
      };

      mockDb.User.findOne.resolves(mockUser);

      try {
        await authService.login('test@mtn-company.rw', 'wrongpassword');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Invalid credentials');
        expect(error.statusCode).to.equal(401);
      }
    });

    it('should throw error for inactive user', async () => {
      const mockUser = createMockUser({ status: USER_STATUS.INACTIVE });
      mockDb.User.findOne.resolves(mockUser);

      try {
        await authService.login('test@mtn-company.rw', 'Password123');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Account is not active');
        expect(error.statusCode).to.equal(403);
      }
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const mockUser = createMockUser();
      const token = authService.generateToken(mockUser);

      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.length(3);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        ...createMockUser(),
        validatePassword: sandbox.stub().resolves(true),
        update: sandbox.stub().resolves(),
      };

      mockDb.User.findByPk.resolves(mockUser);

      const result = await authService.changePassword(1, 'oldPassword', 'newPassword');

      expect(result.message).to.equal('Password changed successfully');
      expect(mockUser.update.calledOnce).to.be.true;
    });

    it('should throw error for wrong current password', async () => {
      const mockUser = {
        ...createMockUser(),
        validatePassword: sandbox.stub().resolves(false),
      };

      mockDb.User.findByPk.resolves(mockUser);

      try {
        await authService.changePassword(1, 'wrongPassword', 'newPassword');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Current password is incorrect');
        expect(error.statusCode).to.equal(400);
      }
    });

    it('should throw error for non-existent user', async () => {
      mockDb.User.findByPk.resolves(null);

      try {
        await authService.changePassword(999, 'oldPassword', 'newPassword');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
        expect(error.statusCode).to.equal(404);
      }
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = createMockUser();
      mockDb.User.findByPk.resolves(mockUser);

      const result = await authService.getProfile(1);

      expect(result).to.deep.equal(mockUser);
    });

    it('should throw error for non-existent user', async () => {
      mockDb.User.findByPk.resolves(null);

      try {
        await authService.getProfile(999);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
        expect(error.statusCode).to.equal(404);
      }
    });
  });
});
