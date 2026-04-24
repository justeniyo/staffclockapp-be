import { body, param, query } from 'express-validator';

export const createLocationValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('address').optional().isString().trim().isLength({ max: 500 }).withMessage('Address too long'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

export const updateLocationValidator = [
  param('id').isInt().withMessage('Invalid location ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('address').optional().isString().trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

export const locationIdValidator = [
  param('id').isInt().withMessage('Invalid location ID'),
];

export const locationQueryValidator = [
  query('search').optional().isString().trim(),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];
