import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import config from '../../config/environment.js';
import { VALID_ROLES, VALID_STATUSES, ROLES, USER_STATUS, ROLE_HIERARCHY } from '../../config/constants.js';

class User extends Model {
  static initialize(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: {
            msg: 'Email address is already registered',
          },
          validate: {
            isEmail: { msg: 'Invalid email format' },
            notEmpty: { msg: 'Email cannot be empty' },
          },
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: 'Password cannot be empty' },
            len: {
              args: [8, 255],
              msg: 'Password must be at least 8 characters',
            },
          },
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'first_name',
          validate: {
            notEmpty: { msg: 'First name cannot be empty' },
          },
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'last_name',
          validate: {
            notEmpty: { msg: 'Last name cannot be empty' },
          },
        },
        role: {
          type: DataTypes.ENUM(...VALID_ROLES),
          allowNull: false,
          defaultValue: ROLES.STAFF,
          validate: {
            isIn: {
              args: [VALID_ROLES],
              msg: `Role must be one of: ${VALID_ROLES.join(', ')}`,
            },
          },
        },
        status: {
          type: DataTypes.ENUM(...VALID_STATUSES),
          allowNull: false,
          defaultValue: USER_STATUS.ACTIVE,
          validate: {
            isIn: {
              args: [VALID_STATUSES],
              msg: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
            },
          },
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        departmentId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'department_id',
        },
        locationId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'location_id',
        },
        managerId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'manager_id',
        },
        isManager: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_manager',
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_login_at',
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: 'is_verified',
        },
        verificationToken: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'verification_token',
        },
        verificationExpires: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'verification_expires',
        },
        passwordResetToken: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'password_reset_token',
        },
        passwordResetExpires: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'password_reset_expires',
        },
      },
      {
        sequelize,
        tableName: 'users',
        modelName: 'User',
        timestamps: true,
        underscored: true,
        hooks: {
          beforeCreate: async (user) => {
            if (user.password) {
              user.password = await bcrypt.hash(user.password, config.bcrypt.rounds);
            }
          },
          beforeUpdate: async (user) => {
            if (user.changed('password')) {
              user.password = await bcrypt.hash(user.password, config.bcrypt.rounds);
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'location_id',
      as: 'location',
    });

    this.belongsTo(models.User, {
      foreignKey: 'manager_id',
      as: 'manager',
    });

    this.hasMany(models.User, {
      foreignKey: 'manager_id',
      as: 'directReports',
    });
  }

  /**
   * Validates password against stored hash
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>}
   */
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  /**
   * Returns user data without sensitive fields
   * @returns {Object}
   */
  toSafeObject() {
    const values = this.toJSON();
    delete values.password;
    delete values.verificationToken;
    delete values.verificationExpires;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    return values;
  }

  /**
   * Gets user's full name
   * @returns {string}
   */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Checks if user has specified role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  hasRole(role) {
    return this.role === role;
  }

  /**
   * Checks if user is CEO
   * @returns {boolean}
   */
  isCeo() {
    return this.role === ROLES.CEO;
  }

  /**
   * Checks if user is Admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === ROLES.ADMIN;
  }

  /**
   * Checks if user is Security
   * @returns {boolean}
   */
  isSecurity() {
    return this.role === ROLES.SECURITY;
  }

  /**
   * Checks if user is active
   * @returns {boolean}
   */
  isActive() {
    return this.status === USER_STATUS.ACTIVE;
  }

  /**
   * Gets user's role level from hierarchy
   * @returns {number}
   */
  getRoleLevel() {
    return ROLE_HIERARCHY[this.role] || 0;
  }

  /**
   * Checks if user has higher or equal role level than target
   * @param {string} targetRole - Role to compare against
   * @returns {boolean}
   */
  hasMinimumRole(targetRole) {
    return this.getRoleLevel() >= (ROLE_HIERARCHY[targetRole] || 0);
  }

  /**
   * Checks if user can manage another user
   * @param {User} targetUser - User to check
   * @returns {boolean}
   */
  canManage(targetUser) {
    if (this.isCeo()) return true;
    if (this.isAdmin() && targetUser.role !== ROLES.CEO) return true;
    return this.id === targetUser.managerId;
  }
}

export default User;
