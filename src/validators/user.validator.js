import { body, param, query } from 'express-validator';
import { VALID_ROLES, VALID_STATUSES } from '../config/constants.js';

export const createUserValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),

  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name too long'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name too long'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('Invalid phone format'),

  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),

  body('locationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid location ID'),

  body('managerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid manager ID'),
];

export const updateUserValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be 1-100 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be 1-100 characters'),

  body('role')
    .optional()
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),

  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('Invalid phone format'),

  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),

  body('locationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid location ID'),

  body('managerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid manager ID'),
];

export const getUserValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
];

export const listUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('role')
    .optional()
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),

  query('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  query('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),

  query('locationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid location ID'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters'),
];

export const roleParamValidator = [
  param('role')
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
];
