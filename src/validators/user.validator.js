import { body, param, query } from 'express-validator';
import { VALID_ROLES, VALID_STATUSES } from '../config/constants.js';
import {
  NAME_MIN, NAME_MAX, PASSWORD_MIN, PASSWORD_MAX,
  isValidName, isValidPhone, normalisePhone,
} from './patterns.js';

export const createUserValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 254 }).withMessage('Email too long')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: PASSWORD_MIN }).withMessage(`Password must be at least ${PASSWORD_MIN} characters`)
    .isLength({ max: PASSWORD_MAX }).withMessage(`Password must be at most ${PASSWORD_MAX} characters`)
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/).withMessage('Password must contain a special character'),

  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: NAME_MIN, max: NAME_MAX })
    .withMessage(`First name must be ${NAME_MIN}-${NAME_MAX} characters`)
    .custom(isValidName).withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: NAME_MIN, max: NAME_MAX })
    .withMessage(`Last name must be ${NAME_MIN}-${NAME_MAX} characters`)
    .custom(isValidName).withMessage('Last name contains invalid characters'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .custom(isValidPhone).withMessage('Please enter a valid phone number (e.g. +250 788 123 456 or 0788123456)')
    .customSanitizer((v) => normalisePhone(v) || v),

  body('departmentId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Invalid department ID'),

  body('locationId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Invalid location ID'),

  body('managerId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Invalid manager ID'),
];

export const updateUserValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 254 }).withMessage('Email too long')
    .normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: NAME_MIN, max: NAME_MAX })
    .withMessage(`First name must be ${NAME_MIN}-${NAME_MAX} characters`)
    .custom(isValidName).withMessage('First name contains invalid characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: NAME_MIN, max: NAME_MAX })
    .withMessage(`Last name must be ${NAME_MIN}-${NAME_MAX} characters`)
    .custom(isValidName).withMessage('Last name contains invalid characters'),

  body('role')
    .optional()
    .isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),

  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .custom(isValidPhone).withMessage('Please enter a valid phone number (e.g. +250 788 123 456 or 0788123456)')
    .customSanitizer((v) => normalisePhone(v) || v),

  body('departmentId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Invalid department ID'),

  body('locationId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Invalid location ID'),

  body('managerId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Invalid manager ID'),

  body('isVerified')
    .optional()
    .isBoolean().withMessage('isVerified must be a boolean'),

  body('isManager')
    .optional()
    .isBoolean().withMessage('isManager must be a boolean'),
];

export const getUserValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
];

export const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
  query('status').optional().isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  query('departmentId').optional().isInt({ min: 1 }).withMessage('Invalid department ID'),
  query('locationId').optional().isInt({ min: 1 }).withMessage('Invalid location ID'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
];

export const roleParamValidator = [
  param('role').isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
];
