import config from '../config/environment.js';
import { HTTP_STATUS } from '../config/constants.js';
import { AppError } from '../utils/index.js';

export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  return { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Validation error', errors };
};

const handleSequelizeUniqueError = (err) => {
  const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
  return { statusCode: HTTP_STATUS.CONFLICT, message: 'Resource already exists', errors };
};

const handleJwtError = (err) => {
  const messages = {
    TokenExpiredError: 'Token has expired',
    JsonWebTokenError: 'Invalid token',
    NotBeforeError: 'Token not active',
  };
  return { statusCode: HTTP_STATUS.UNAUTHORIZED, message: messages[err.name] || 'Authentication error' };
};

export const errorHandler = (err, req, res, next) => {
  if (config.env === 'development') console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(config.env === 'development' && { stack: err.stack }),
    });
  }

  if (err.name === 'SequelizeValidationError') {
    const { statusCode, message, errors } = handleSequelizeValidationError(err);
    return res.status(statusCode).json({ success: false, message, errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const { statusCode, message, errors } = handleSequelizeUniqueError(err);
    return res.status(statusCode).json({ success: false, message, errors });
  }

  if (['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
    const { statusCode, message } = handleJwtError(err);
    return res.status(statusCode).json({ success: false, message });
  }

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
