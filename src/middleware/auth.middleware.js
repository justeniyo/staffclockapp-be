import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import { getAllowedRoles } from '../config/permissions.js';
import { ApiResponse, AppError } from '../utils/index.js';
import { USER_STATUS, ROLE_HIERARCHY } from '../config/constants.js';

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

export const can = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Not authenticated');
    }

    const allowedRoles = getAllowedRoles(resource, action);

    // Direct role match
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Staff managers inherit manager-level permissions (users.list, leaves.approve, etc.)
    // but NOT admin-only actions (users.create, users.delete, departments.delete)
    if (req.user.isManager && req.user.role === 'staff') {
      const managerActions = {
        users:      ['list', 'read', 'listByRole'],
        leaves:     ['list', 'read', 'approve', 'reject'],
        attendance: ['viewAll', 'viewByUser'],
        shifts:     ['list', 'read', 'create', 'update'],
      };
      const allowed = managerActions[resource];
      if (allowed && allowed.includes(action)) {
        return next();
      }
    }

    return ApiResponse.forbidden(res, 'Insufficient permissions');
  };
};

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
