import { body, query } from 'express-validator';
import {
  NAME_MIN, NAME_MAX, PASSWORD_MIN, PASSWORD_MAX,
  isValidName,
} from './patterns.js';

const passwordRules = (field = 'password') =>
  body(field)
    .notEmpty().withMessage('Password is required')
    .isLength({ min: PASSWORD_MIN }).withMessage(`Password must be at least ${PASSWORD_MIN} characters`)
    .isLength({ max: PASSWORD_MAX }).withMessage(`Password must be at most ${PASSWORD_MAX} characters`)
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/).withMessage('Password must contain a special character');

const emailRules = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .isLength({ max: 254 }).withMessage('Email too long')
  .normalizeEmail();

export const signupValidator = [
  emailRules,
  passwordRules(),
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
];

export const loginValidator = [
  emailRules,
  body('password').notEmpty().withMessage('Password is required'),
];

export const verifyEmailValidator = [
  query('token')
    .notEmpty().withMessage('Verification token is required')
    .isLength({ min: 32, max: 128 }).withMessage('Invalid token format'),
];

export const resendVerificationValidator = [
  emailRules,
];

export const forgotPasswordValidator = [
  emailRules,
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 32, max: 128 }).withMessage('Invalid token format'),
  passwordRules(),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  passwordRules('newPassword'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error('Passwords do not match');
      return true;
    }),
];
