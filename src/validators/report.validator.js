import { query } from 'express-validator';

export const reportQueryValidator = [
  query('format').optional().isIn(['csv', 'excel', 'pdf']).withMessage('Format must be csv, excel, or pdf'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('userId').optional().isInt().withMessage('Invalid user ID'),
  query('departmentId').optional().isInt().withMessage('Invalid department ID'),
  query('locationId').optional().isInt().withMessage('Invalid location ID'),
  query('status').optional().isString(),
  query('type').optional().isString(),
];
