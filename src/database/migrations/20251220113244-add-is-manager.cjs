'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_manager', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Set is_manager = true for CEO (always a manager)
    await queryInterface.sequelize.query(
      "UPDATE users SET is_manager = true WHERE role = 'ceo'"
    );

    // Set is_manager = true for anyone who has direct reports
    await queryInterface.sequelize.query(`
      UPDATE users SET is_manager = true
      WHERE id IN (SELECT DISTINCT manager_id FROM users WHERE manager_id IS NOT NULL)
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'is_manager');
  },
};
