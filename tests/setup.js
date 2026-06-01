import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../src/config/environment.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';

/**
 * Creates a mock Sequelize instance for testing
 * @returns {Sequelize} Mock Sequelize instance
 */
export const createMockSequelize = () => {
  return new Sequelize('sqlite::memory:', {
    logging: false,
  });
};

/**
 * Creates a mock user object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user
 */
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@mtn-company.rw',
  password: '$2a$10$hashedpassword',
  firstName: 'Test',
  lastName: 'User',
  role: ROLES.STAFF,
  status: USER_STATUS.ACTIVE,
  phone: '+1234567890',
  departmentId: 1,
  locationId: 1,
  managerId: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Creates a mock admin user
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock admin user
 */
export const createMockAdmin = (overrides = {}) =>
  createMockUser({
    id: 2,
    email: 'admin@mtn-company.rw',
    firstName: 'Admin',
    lastName: 'User',
    role: ROLES.ADMIN,
    ...overrides,
  });

/**
 * Creates a mock CEO user
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock CEO user
 */
export const createMockCeo = (overrides = {}) =>
  createMockUser({
    id: 3,
    email: 'ceo@mtn-company.rw',
    firstName: 'CEO',
    lastName: 'User',
    role: ROLES.CEO,
    ...overrides,
  });

/**
 * Creates a valid JWT token for testing
 * @param {Object} user - User to create token for
 * @returns {string} JWT token
 */
export const createTestToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

/**
 * Hashes a password for testing
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

/**
 * Creates a mock department
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock department
 */
export const createMockDepartment = (overrides = {}) => ({
  id: 1,
  name: 'IT',
  description: 'Information Technology',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Creates a mock location
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock location
 */
export const createMockLocation = (overrides = {}) => ({
  id: 1,
  name: 'Headquarters',
  address: '123 Main St',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Creates mock request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request
 */
export const createMockRequest = (options = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  app: {
    get: () => ({}),
  },
  ...options,
});

/**
 * Creates mock response object
 * @returns {Object} Mock response with spy methods
 */
export const createMockResponse = () => {
  const res = {
    statusCode: 200,
    data: null,
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data) => {
    res.data = data;
    return res;
  };

  return res;
};

/**
 * Creates mock next function
 * @returns {Function} Mock next function
 */
export const createMockNext = () => {
  const next = (error) => {
    next.called = true;
    next.error = error;
  };
  next.called = false;
  next.error = null;
  return next;
};
