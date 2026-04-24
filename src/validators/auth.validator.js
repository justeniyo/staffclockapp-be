import { body, query } from 'express-validator';

const passwordRules = body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number');

const emailRules = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail();

export const signupValidator = [
  emailRules,
  passwordRules,
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
];

export const loginValidator = [
  emailRules,
  body('password').notEmpty().withMessage('Password is required'),
];

export const verifyEmailValidator = [
  query('token').notEmpty().withMessage('Verification token is required'),
];

export const resendVerificationValidator = [
  emailRules,
];

export const forgotPasswordValidator = [
  emailRules,
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  passwordRules,
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.newPassword || (() => { throw new Error('Passwords do not match'); })()),
];
