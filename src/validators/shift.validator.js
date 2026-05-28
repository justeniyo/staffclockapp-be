import { body, param, query } from 'express-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createShiftValidator = [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('date').isISO8601({ strict: true }).withMessage('Valid date is required (YYYY-MM-DD)'),
  body('startTime').matches(TIME_REGEX).withMessage('Valid start time required (HH:MM)'),
  body('endTime').matches(TIME_REGEX).withMessage('Valid end time required (HH:MM)'),
  body('breakMinutes').optional().isInt({ min: 0, max: 480 }).withMessage('Break must be 0-480 minutes'),
  body('locationId').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Invalid location ID'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

export const createBulkShiftValidator = [
  body('shifts').isArray({ min: 1, max: 100 }).withMessage('Shifts array required (1-100 items)'),
  body('shifts.*.userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('shifts.*.date').isISO8601({ strict: true }).withMessage('Valid date is required'),
  body('shifts.*.startTime').matches(TIME_REGEX).withMessage('Valid start time required'),
  body('shifts.*.endTime').matches(TIME_REGEX).withMessage('Valid end time required'),
];

export const shiftIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid shift ID'),
];

export const shiftQueryValidator = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status').optional().isIn(['scheduled', 'completed', 'missed', 'cancelled']).withMessage('Invalid status'),
  query('userId').optional().isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('locationId').optional().isInt({ min: 1 }).withMessage('Invalid location ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

export const updateShiftValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid shift ID'),
  body('date').optional().isISO8601({ strict: true }).withMessage('Valid date is required'),
  body('startTime').optional().matches(TIME_REGEX).withMessage('Valid start time required'),
  body('endTime').optional().matches(TIME_REGEX).withMessage('Valid end time required'),
  body('breakMinutes').optional().isInt({ min: 0, max: 480 }).withMessage('Break must be 0-480 minutes'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

export const weekScheduleValidator = [
  query('startDate').isISO8601().withMessage('Start date is required'),
  query('userId').optional().isInt({ min: 1 }).withMessage('Invalid user ID'),
  query('locationId').optional().isInt({ min: 1 }).withMessage('Invalid location ID'),
];
