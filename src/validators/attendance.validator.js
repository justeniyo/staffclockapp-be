import { body, param, query } from 'express-validator';

export const clockInValidator = [
  body('locationId').optional().isInt().withMessage('Location ID must be an integer'),
  body('notes').optional().isString().trim(),
];

export const attendanceIdValidator = [
  param('id').isInt().withMessage('Invalid attendance ID'),
];

export const attendanceQueryValidator = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status').optional().isIn(['clocked_in', 'on_break', 'clocked_out']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

export const updateAttendanceValidator = [
  param('id').isInt().withMessage('Invalid attendance ID'),
  body('notes').optional().isString().trim(),
  body('clockIn').optional().isISO8601().withMessage('Invalid clock in time'),
  body('clockOut').optional().isISO8601().withMessage('Invalid clock out time'),
];
