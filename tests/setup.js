import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../src/config/environment.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';

export const createMockSequelize = () =>
  new Sequelize('sqlite::memory:', { logging: false });

export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@staffclock.com',
  password: '$2a$10$hashedpassword',
  firstName: 'Test',
  lastName: 'User',
  role: ROLES.STAFF,
  status: USER_STATUS.ACTIVE,
  isVerified: true,
  isManager: false,
  phone: '+1234567890',
  departmentId: 1,
  locationId: 1,
  managerId: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAdmin = (overrides = {}) =>
  createMockUser({
    id: 2, email: 'admin@staffclock.com',
    firstName: 'Admin', lastName: 'User', role: ROLES.ADMIN,
    ...overrides,
  });

export const createMockCeo = (overrides = {}) =>
  createMockUser({
    id: 3, email: 'ceo@staffclock.com',
    firstName: 'CEO', lastName: 'User', role: ROLES.CEO,
    ...overrides,
  });

export const createTestToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

export const hashPassword = (password) => bcrypt.hash(password, 10);

export const createMockDepartment = (overrides = {}) => ({
  id: 1, name: 'IT', description: 'Information Technology',
  isActive: true, createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

export const createMockLocation = (overrides = {}) => ({
  id: 1, name: 'Headquarters', address: '123 Main St',
  isActive: true, createdAt: new Date(), updatedAt: new Date(),
  ...overrides,
});

export const createMockRequest = (options = {}) => ({
  body: {}, params: {}, query: {}, headers: {},
  user: null, app: { get: () => ({}) },
  ...options,
});

export const createMockResponse = () => {
  const res = { statusCode: 200, data: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

export const createMockNext = () => {
  const next = (error) => { next.called = true; next.error = error; };
  next.called = false;
  next.error = null;
  return next;
};
