import { HTTP_STATUS } from '../config/constants.js';

/**
 * Standardized API response builder
 */
class ApiResponse {
  /**
   * Creates a success response
   * @param {Object} res - Express response object
   * @param {Object} options - Response options
   * @returns {Object} JSON response
   */
  static success(res, { data = null, message = 'Success', statusCode = HTTP_STATUS.OK }) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Creates a created response (201)
   * @param {Object} res - Express response object
   * @param {Object} options - Response options
   * @returns {Object} JSON response
   */
  static created(res, { data = null, message = 'Created successfully' }) {
    return this.success(res, {
      data,
      message,
      statusCode: HTTP_STATUS.CREATED,
    });
  }

  /**
   * Creates an error response
   * @param {Object} res - Express response object
   * @param {Object} options - Response options
   * @returns {Object} JSON response
   */
  static error(res, { message = 'An error occurred', statusCode = HTTP_STATUS.BAD_REQUEST, errors = null }) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Creates a paginated response
   * @param {Object} res - Express response object
   * @param {Object} options - Response options
   * @returns {Object} JSON response
   */
  static paginated(res, { data, pagination, message = 'Success' }) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  /**
   * Creates a not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, {
      message,
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  /**
   * Creates an unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, {
      message,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  /**
   * Creates a forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, {
      message,
      statusCode: HTTP_STATUS.FORBIDDEN,
    });
  }

  /**
   * Creates a conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} JSON response
   */
  static conflict(res, message = 'Resource already exists') {
    return this.error(res, {
      message,
      statusCode: HTTP_STATUS.CONFLICT,
    });
  }

  /**
   * Creates a validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   * @returns {Object} JSON response
   */
  static validationError(res, errors) {
    return this.error(res, {
      message: 'Validation failed',
      statusCode: HTTP_STATUS.BAD_REQUEST,
      errors,
    });
  }
}

export default ApiResponse;
