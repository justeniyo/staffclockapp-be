import { Op } from 'sequelize';
import { AppError, Pagination } from '../utils/index.js';
import { ROLES } from '../config/constants.js';

/**
 * User service
 * Handles user CRUD operations and related business logic
 */
class UserService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Creates a new user
   * @param {Object} userData - User data
   * @param {string} creatorRole - Role of the creating user
   * @returns {Promise<Object>} Created user
   */
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

    // Validate relationships
    await this.validateRelationships(userData);

    const user = await User.create(userData);

    return this.findById(user.id);
  }

  /**
   * Finds user by ID with associations
   * @param {number} id - User ID
   * @returns {Promise<Object>} User with associations
   */
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

  /**
   * Lists users with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated users
   */
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

  /**
   * Updates user by ID
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @param {string} updaterRole - Role of the updating user
   * @returns {Promise<Object>} Updated user
   */
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

  /**
   * Deletes user by ID
   * @param {number} id - User ID
   * @param {string} deleterRole - Role of the deleting user
   * @returns {Promise<Object>} Deletion result
   */
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

  /**
   * Gets direct reports of a user
   * @param {number} managerId - Manager user ID
   * @returns {Promise<Array>} Direct reports
   */
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

  /**
   * Gets users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} Users with the specified role
   */
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

  /**
   * Builds Sequelize where clause from filter options
   * @param {Object} options - Filter options
   * @returns {Object} Sequelize where clause
   */
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

  /**
   * Validates role change permissions
   * @param {Object} user - Current user
   * @param {Object} updateData - Update data
   * @param {string} updaterRole - Updater's role
   */
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

  /**
   * Validates foreign key relationships
   * @param {Object} data - Data containing relationship IDs
   * @param {number} userId - Current user ID (for self-reference check)
   */
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
