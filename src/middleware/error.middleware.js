import config from '../config/environment.js';
import { HTTP_STATUS } from '../config/constants.js';
import { AppError } from '../utils/index.js';

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

/**
 * Handles Sequelize validation errors
 * @param {Error} err - Sequelize error
 * @returns {Object} Formatted error response
 */
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map((e) => ({
    field: e.path,
    message: e.message,
  }));

  return {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'Validation error',
    errors,
  };
};

/**
 * Handles Sequelize unique constraint errors
 * @param {Error} err - Sequelize error
 * @returns {Object} Formatted error response
 */
const handleSequelizeUniqueError = (err) => {
  const errors = err.errors.map((e) => ({
    field: e.path,
    message: e.message,
  }));

  return {
    statusCode: HTTP_STATUS.CONFLICT,
    message: 'Resource already exists',
    errors,
  };
};

/**
 * Handles JWT errors
 * @param {Error} err - JWT error
 * @returns {Object} Formatted error response
 */
const handleJwtError = (err) => {
  const messages = {
    TokenExpiredError: 'Token has expired',
    JsonWebTokenError: 'Invalid token',
    NotBeforeError: 'Token not active',
  };

  return {
    statusCode: HTTP_STATUS.UNAUTHORIZED,
    message: messages[err.name] || 'Authentication error',
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (config.env === 'development') {
    console.error('Error:', err);
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(config.env === 'development' && { stack: err.stack }),
    });
  }

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const { statusCode, message, errors } = handleSequelizeValidationError(err);
    return res.status(statusCode).json({ success: false, message, errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const { statusCode, message, errors } = handleSequelizeUniqueError(err);
    return res.status(statusCode).json({ success: false, message, errors });
  }

  // Handle JWT errors
  if (['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
    const { statusCode, message } = handleJwtError(err);
    return res.status(statusCode).json({ success: false, message });
  }

  // Default error response
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const message = config.env === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper to catch errors in async routes
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
