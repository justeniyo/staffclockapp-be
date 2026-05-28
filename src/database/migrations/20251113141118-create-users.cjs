'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enum types first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('staff', 'admin', 'security', 'ceo');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('staff', 'admin', 'security', 'ceo'),
        allowNull: false,
        defaultValue: 'staff',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx',
      unique: true,
    });

    await queryInterface.addIndex('users', ['role'], {
      name: 'users_role_idx',
    });

    await queryInterface.addIndex('users', ['status'], {
      name: 'users_status_idx',
    });

    await queryInterface.addIndex('users', ['department_id'], {
      name: 'users_department_id_idx',
    });

    await queryInterface.addIndex('users', ['location_id'], {
      name: 'users_location_id_idx',
    });

    await queryInterface.addIndex('users', ['manager_id'], {
      name: 'users_manager_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');

    // Drop enum types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS user_role;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS user_status;');
  },
};
