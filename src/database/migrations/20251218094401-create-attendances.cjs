'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      clock_in: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      clock_out: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      break_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      break_end: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      break_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Total break time in minutes',
      },
      work_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total work time in minutes',
      },
      status: {
        type: Sequelize.ENUM('clocked_in', 'on_break', 'clocked_out'),
        allowNull: false,
        defaultValue: 'clocked_in',
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
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

    await queryInterface.addIndex('attendances', ['user_id', 'clock_in']);
    await queryInterface.addIndex('attendances', ['status']);
    await queryInterface.addIndex('attendances', ['clock_in']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('attendances');
  },
};
