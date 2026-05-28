'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'verification_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'verification_expires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'password_reset_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'password_reset_expires', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('users', ['verification_token'], {
      name: 'users_verification_token_idx',
    });

    await queryInterface.addIndex('users', ['password_reset_token'], {
      name: 'users_password_reset_token_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_verification_token_idx');
    await queryInterface.removeIndex('users', 'users_password_reset_token_idx');
    await queryInterface.removeColumn('users', 'is_verified');
    await queryInterface.removeColumn('users', 'verification_token');
    await queryInterface.removeColumn('users', 'verification_expires');
    await queryInterface.removeColumn('users', 'password_reset_token');
    await queryInterface.removeColumn('users', 'password_reset_expires');
  },
};
