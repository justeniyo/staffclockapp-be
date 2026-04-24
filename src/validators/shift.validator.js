import { body, param, query } from 'express-validator';

export const createShiftValidator = [
  body('userId').isInt().withMessage('User ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time required (HH:MM)'),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time required (HH:MM)'),
  body('breakMinutes').optional().isInt({ min: 0 }).withMessage('Break minutes must be positive'),
  body('locationId').optional().isInt().withMessage('Location ID must be an integer'),
  body('notes').optional().isString().trim(),
];

export const createBulkShiftValidator = [
  body('shifts').isArray({ min: 1 }).withMessage('Shifts array is required'),
  body('shifts.*.userId').isInt().withMessage('User ID is required'),
  body('shifts.*.date').isISO8601().withMessage('Valid date is required'),
  body('shifts.*.startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time required'),
  body('shifts.*.endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time required'),
];

export const shiftIdValidator = [
  param('id').isInt().withMessage('Invalid shift ID'),
];

export const shiftQueryValidator = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status').optional().isIn(['scheduled', 'completed', 'missed', 'cancelled']).withMessage('Invalid status'),
  query('userId').optional().isInt().withMessage('Invalid user ID'),
  query('locationId').optional().isInt().withMessage('Invalid location ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

export const updateShiftValidator = [
  param('id').isInt().withMessage('Invalid shift ID'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time required'),
  body('endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time required'),
  body('breakMinutes').optional().isInt({ min: 0 }).withMessage('Break minutes must be positive'),
  body('notes').optional().isString().trim(),
];

export const weekScheduleValidator = [
  query('startDate').isISO8601().withMessage('Start date is required'),
  query('userId').optional().isInt().withMessage('Invalid user ID'),
  query('locationId').optional().isInt().withMessage('Invalid location ID'),
];
