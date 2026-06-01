import crypto from 'crypto';
import { Op } from 'sequelize';
import { AppError, Pagination } from '../utils/index.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import config from '../config/environment.js';
import emailService from '../emails/email.service.js';

class UserService {
  constructor(db) {
    this.db = db;
  }

  async create(userData, creatorRole) {
    const { User, Department, Location } = this.db;

    // Role-based creation restrictions
    if (userData.role === ROLES.CEO && creatorRole !== ROLES.CEO) {
      throw AppError.forbidden('Only CEO can create CEO users');
    }

    // Check email uniqueness
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw AppError.conflict('Email already registered');
    }

    await this.validateRelationships(userData);

    // 6-digit OTP for admin-created users (same flow as self-signup)
    const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const verificationExpires = new Date(
      Date.now() + config.verification.tokenExpiry * 60 * 60 * 1000
    );

    const user = await User.create({
      ...userData,
      status: USER_STATUS.INACTIVE,
      isVerified: false,
      verificationToken: otp,
      verificationExpires,
    });

    try {
      await emailService.sendAccountCreated(user, otp, userData.password);
    } catch (err) {
      console.warn('Failed to send verification email:', err.message);
    }

    return this.findById(user.id);
  }

  async findById(id) {
    const { User, Department, Location } = this.db;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Department, as: 'department' },
        { model: Location, as: 'location' },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  async findAll(options = {}) {
    const { User, Department, Location } = this.db;
    const { page, limit, offset } = Pagination.parse(options);

    const where = this.buildWhereClause(options);

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { model: Department, as: 'department' },
        { model: Location, as: 'location' },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return Pagination.format(rows, count, { page, limit });
  }

  async update(id, updateData, updaterRole) {
    const { User } = this.db;

    const user = await User.findByPk(id);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Role change restrictions
    this.validateRoleChange(user, updateData, updaterRole);

    // Email uniqueness check
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw AppError.conflict('Email already registered');
      }
    }

    // Validate relationships
    await this.validateRelationships(updateData, id);

    await user.update(updateData);

    return this.findById(id);
  }

  async delete(id, deleterRole) {
    const { User } = this.db;

    const user = await User.findByPk(id);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Only CEO can delete CEO users
    if (user.role === ROLES.CEO && deleterRole !== ROLES.CEO) {
      throw AppError.forbidden('Only CEO can delete CEO users');
    }

    await user.destroy();

    return { message: 'User deleted successfully' };
  }

  async getDirectReports(managerId) {
    const { User, Department, Location } = this.db;

    const users = await User.findAll({
      where: { managerId },
      attributes: { exclude: ['password'] },
      include: [
        { model: Department, as: 'department' },
        { model: Location, as: 'location' },
      ],
      order: [
        ['lastName', 'ASC'],
        ['firstName', 'ASC'],
      ],
    });

    return users;
  }

  async findByRole(role) {
    const { User, Department, Location } = this.db;

    const users = await User.findAll({
      where: { role },
      attributes: { exclude: ['password'] },
      include: [
        { model: Department, as: 'department' },
        { model: Location, as: 'location' },
      ],
      order: [
        ['lastName', 'ASC'],
        ['firstName', 'ASC'],
      ],
    });

    return users;
  }

  buildWhereClause(options) {
    const { role, status, departmentId, locationId, search } = options;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (locationId) where.locationId = locationId;

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return where;
  }

  validateRoleChange(user, updateData, updaterRole) {
    // Cannot assign CEO role unless you're CEO
    if (updateData.role === ROLES.CEO && updaterRole !== ROLES.CEO) {
      throw AppError.forbidden('Only CEO can assign CEO role');
    }

    // Cannot demote CEO unless you're CEO
    if (user.role === ROLES.CEO && updateData.role && updateData.role !== ROLES.CEO) {
      if (updaterRole !== ROLES.CEO) {
        throw AppError.forbidden('Only CEO can change CEO role');
      }
    }
  }

  async validateRelationships(data, userId = null) {
    const { User, Department, Location } = this.db;

    if (data.managerId) {
      if (data.managerId === userId) {
        throw AppError.badRequest('User cannot be their own manager');
      }

      const manager = await User.findByPk(data.managerId);
      if (!manager) {
        throw AppError.badRequest('Manager not found');
      }
    }

    if (data.departmentId) {
      const department = await Department.findByPk(data.departmentId);
      if (!department) {
        throw AppError.badRequest('Department not found');
      }
    }

    if (data.locationId) {
      const location = await Location.findByPk(data.locationId);
      if (!location) {
        throw AppError.badRequest('Location not found');
      }
    }
  }
}

export default UserService;
