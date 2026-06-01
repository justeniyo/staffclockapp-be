import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils/index.js';

/**
 * Middleware to process validation results from express-validator
 * Returns validation errors if any, otherwise continues to next middleware
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return ApiResponse.validationError(res, formattedErrors);
  }

  next();
};

export const withValidation = (validators) => {
  return [...validators, validate];
};
