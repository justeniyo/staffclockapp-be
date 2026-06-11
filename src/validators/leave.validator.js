import { body, param, query } from 'express-validator';
import { isEndDateAfterStart } from './patterns.js';
import { LEAVE_TYPE, LEAVE_TYPES_REQUIRING_REASON, LEAVE_STATUS } from '../config/constants.js';

const LEAVE_TYPE_VALUES = Object.values(LEAVE_TYPE);
const LEAVE_STATUS_VALUES = Object.values(LEAVE_STATUS);

// Single source of truth for the reason-required policy lives in config/constants.js.
// Frontend leaveTypes.js mirrors it; do not redefine the list here.
const reasonRequiresIt = (req) => LEAVE_TYPES_REQUIRING_REASON.includes(req.body?.type);

export const createLeaveValidator = [
  body('type')
    .isIn(LEAVE_TYPE_VALUES).withMessage(`Type must be one of: ${LEAVE_TYPE_VALUES.join(', ')}`),
  body('startDate')
    .isISO8601({ strict: true }).withMessage('Valid start date is required (YYYY-MM-DD)'),
  body('endDate')
    .isISO8601({ strict: true }).withMessage('Valid end date is required (YYYY-MM-DD)')
    .custom(isEndDateAfterStart),
  // Reason policy:
  //  - For types in LEAVE_TYPES_REQUIRING_REASON: must be present and 1-1000 chars.
  //  - For all other types: optional. If present, max 1000 chars.
  body('reason')
    .customSanitizer((value) => (typeof value === 'string' ? value.trim() : value))
    .custom((value, { req }) => {
      const required = reasonRequiresIt(req);
      if (required && (!value || value.length === 0)) {
        throw new Error('Please provide a reason for this leave type');
      }
      if (value && typeof value !== 'string') {
        throw new Error('Reason must be text');
      }
      if (value && value.length > 1000) {
        throw new Error('Reason cannot exceed 1000 characters');
      }
      return true;
    }),
];

export const leaveIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid leave ID'),
];

export const leaveQueryValidator = [
  query('status').optional().isIn(LEAVE_STATUS_VALUES).withMessage('Invalid status'),
  query('type').optional().isIn(LEAVE_TYPE_VALUES).withMessage('Invalid type'),
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

export const updateLeaveValidator = createLeaveValidator;
