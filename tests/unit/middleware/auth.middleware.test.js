import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import {
  authenticate,
  authorize,
  can,
  requireMinRole,
} from '../../../src/middleware/auth.middleware.js';
import {
  createMockUser,
  createMockAdmin,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestToken,
} from '../../setup.js';
import config from '../../../src/config/environment.js';
import { ROLES, USER_STATUS } from '../../../src/config/constants.js';

describe('Auth Middleware', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const mockUser = {
        ...createMockUser(),
        status: USER_STATUS.ACTIVE,
      };
      const token = createTestToken(mockUser);

      const mockDb = {
        User: {
          findByPk: sandbox.stub().resolves(mockUser),
        },
      };

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
        app: { get: () => mockDb },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticate(req, res, next);

      expect(next.called).to.be.true;
      expect(next.error).to.be.null;
      expect(req.user).to.deep.equal(mockUser);
    });

    it('should reject request without token', async () => {
      const req = createMockRequest({
        headers: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticate(req, res, next);

      expect(res.statusCode).to.equal(401);
      expect(res.data.message).to.equal('No token provided');
    });

    it('should reject invalid token format', async () => {
      const req = createMockRequest({
        headers: { authorization: 'InvalidFormat token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticate(req, res, next);

      expect(res.statusCode).to.equal(401);
      expect(res.data.message).to.equal('No token provided');
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@test.com', role: ROLES.STAFF },
        config.jwt.secret,
        { expiresIn: '-1h' }
      );

      const req = createMockRequest({
        headers: { authorization: `Bearer ${expiredToken}` },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticate(req, res, next);

      expect(res.statusCode).to.equal(401);
      expect(res.data.message).to.equal('Token expired');
    });

    it('should reject inactive user', async () => {
      const mockUser = {
        ...createMockUser(),
        status: USER_STATUS.INACTIVE,
      };
      const token = createTestToken(mockUser);

      const mockDb = {
        User: {
          findByPk: sandbox.stub().resolves(mockUser),
        },
      };

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
        app: { get: () => mockDb },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticate(req, res, next);

      expect(res.statusCode).to.equal(403);
      expect(res.data.message).to.equal('Account is not active');
    });
  });

  describe('authorize', () => {
    it('should allow authorized role', () => {
      const mockUser = createMockAdmin();
      const req = createMockRequest({ user: mockUser });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize(ROLES.ADMIN, ROLES.CEO);
      middleware(req, res, next);

      expect(next.called).to.be.true;
      expect(next.error).to.be.null;
    });

    it('should reject unauthorized role', () => {
      const mockUser = createMockUser(); // Staff role
      const req = createMockRequest({ user: mockUser });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize(ROLES.ADMIN, ROLES.CEO);
      middleware(req, res, next);

      expect(res.statusCode).to.equal(403);
      expect(res.data.message).to.equal('Insufficient permissions');
    });

    it('should reject unauthenticated request', () => {
      const req = createMockRequest({ user: null });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authorize(ROLES.ADMIN);
      middleware(req, res, next);

      expect(res.statusCode).to.equal(401);
      expect(res.data.message).to.equal('Not authenticated');
    });
  });

  describe('can', () => {
    it('should allow permitted action', () => {
      const mockUser = createMockAdmin();
      const req = createMockRequest({ user: mockUser });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = can('users', 'create');
      middleware(req, res, next);

      expect(next.called).to.be.true;
    });

    it('should reject non-permitted action', () => {
      const mockUser = createMockUser(); // Staff role
      const req = createMockRequest({ user: mockUser });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = can('users', 'create');
      middleware(req, res, next);

      expect(res.statusCode).to.equal(403);
    });
  });

  describe('requireMinRole', () => {
    it('should allow user with higher role level', () => {
      const mockAdmin = createMockAdmin();
      const req = createMockRequest({ user: mockAdmin });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireMinRole(ROLES.SECURITY);
      middleware(req, res, next);

      expect(next.called).to.be.true;
    });

    it('should allow user with same role level', () => {
      const mockAdmin = createMockAdmin();
      const req = createMockRequest({ user: mockAdmin });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireMinRole(ROLES.ADMIN);
      middleware(req, res, next);

      expect(next.called).to.be.true;
    });

    it('should reject user with lower role level', () => {
      const mockUser = createMockUser(); // Staff role
      const req = createMockRequest({ user: mockUser });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireMinRole(ROLES.ADMIN);
      middleware(req, res, next);

      expect(res.statusCode).to.equal(403);
      expect(res.data.message).to.equal('Insufficient role level');
    });
  });
});
