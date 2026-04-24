import { body, param, query } from 'express-validator';

const LEAVE_TYPES = ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'];

export const createLeaveValidator = [
  body('type').isIn(LEAVE_TYPES).withMessage(`Type must be one of: ${LEAVE_TYPES.join(', ')}`),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').optional().isString().trim().isLength({ max: 1000 }).withMessage('Reason too long'),
];

export const leaveIdValidator = [
  param('id').isInt().withMessage('Invalid leave ID'),
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
  param('id').isInt().withMessage('Invalid leave ID'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

export const balanceQueryValidator = [
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
];
