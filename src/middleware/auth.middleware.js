import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import { getAllowedRoles } from '../config/permissions.js';
import { ApiResponse, AppError } from '../utils/index.js';
import { USER_STATUS, ROLE_HIERARCHY } from '../config/constants.js';

/**
 * Extracts JWT token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

/**
 * Middleware to authenticate user via JWT
 * Attaches user to request object on success
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    // Get User model from the initialized db
    const { User } = req.app.get('db');

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return ApiResponse.forbidden(res, 'Account is not active');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    next(error);
  }
};

/**
 * Middleware factory to authorize based on allowed roles
 * @param {...string} allowedRoles - Roles that can access the resource
 * @returns {Function} Express middleware
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware factory to authorize based on resource permissions
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Function} Express middleware
 */
export const can = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Not authenticated');
    }

    const allowedRoles = getAllowedRoles(resource, action);

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware factory to check minimum role level
 * @param {string} minRole - Minimum required role
 * @returns {Function} Express middleware
 */
export const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Not authenticated');
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return ApiResponse.forbidden(res, 'Insufficient role level');
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or has elevated permissions
 * @param {Function} getResourceUserId - Function to extract resource owner ID
 * @returns {Function} Express middleware
 */
export const ownerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Not authenticated');
    }

    // Admins and CEOs can access any resource
    if (req.user.isAdmin() || req.user.isCeo()) {
      return next();
    }

    const resourceUserId = await getResourceUserId(req);

    if (req.user.id === resourceUserId) {
      return next();
    }

    return ApiResponse.forbidden(res, 'Access denied');
  };
};
