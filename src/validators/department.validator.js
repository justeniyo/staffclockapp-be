import { body, param, query } from 'express-validator';

export const createDepartmentValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[\p{L}\p{N}\p{M}\s\-&().]+$/u).withMessage('Name contains invalid characters'),
  body('description')
    .optional()
    .isString().trim()
    .isLength({ max: 500 }).withMessage('Description too long'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean'),
];

export const updateDepartmentValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid department ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[\p{L}\p{N}\p{M}\s\-&().]+$/u).withMessage('Name contains invalid characters'),
  body('description')
    .optional()
    .isString().trim()
    .isLength({ max: 500 }),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be boolean'),
];

export const departmentIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid department ID'),
];

export const departmentQueryValidator = [
  query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];
