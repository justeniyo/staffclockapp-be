import { HTTP_STATUS } from '../config/constants.js';

/**
 * Custom application error class
 * Provides consistent error handling across the application
 */
class AppError extends Error {
  /**
   * Creates a new AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} errors - Additional error details
   */
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_ERROR, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Creates a bad request error (400)
   * @param {string} message - Error message
   * @param {Array} errors - Validation errors
   * @returns {AppError}
   */
  static badRequest(message = 'Bad request', errors = null) {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  /**
   * Creates an unauthorized error (401)
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * Creates a forbidden error (403)
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static forbidden(message = 'Forbidden') {
    return new AppError(message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * Creates a not found error (404)
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static notFound(message = 'Resource not found') {
    return new AppError(message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * Creates a conflict error (409)
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static conflict(message = 'Resource already exists') {
    return new AppError(message, HTTP_STATUS.CONFLICT);
  }

  /**
   * Creates a validation error (422)
   * @param {string} message - Error message
   * @param {Array} errors - Validation errors
   * @returns {AppError}
   */
  static validation(message = 'Validation failed', errors = null) {
    return new AppError(message, HTTP_STATUS.UNPROCESSABLE, errors);
  }

  /**
   * Creates an internal server error (500)
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static internal(message = 'Internal server error') {
    return new AppError(message, HTTP_STATUS.INTERNAL_ERROR);
  }
}

export default AppError;
