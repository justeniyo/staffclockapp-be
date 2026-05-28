import { body, param, query } from 'express-validator';
import { isEndDateAfterStart } from './patterns.js';

const LEAVE_TYPES = ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'];

export const createLeaveValidator = [
  body('type')
    .isIn(LEAVE_TYPES).withMessage(`Type must be one of: ${LEAVE_TYPES.join(', ')}`),
  body('startDate')
    .isISO8601({ strict: true }).withMessage('Valid start date is required (YYYY-MM-DD)'),
  body('endDate')
    .isISO8601({ strict: true }).withMessage('Valid end date is required (YYYY-MM-DD)')
    .custom(isEndDateAfterStart),
  body('reason')
    .optional()
    .isString().trim()
    .isLength({ min: 1, max: 1000 }).withMessage('Reason must be 1-1000 characters'),
];

export const leaveIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid leave ID'),
];

export const leaveQueryValidator = [
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']).withMessage('Invalid status'),
  query('type').optional().isIn(LEAVE_TYPES).withMessage('Invalid type'),
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

export const reviewLeaveValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid leave ID'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

export const balanceQueryValidator = [
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
];
