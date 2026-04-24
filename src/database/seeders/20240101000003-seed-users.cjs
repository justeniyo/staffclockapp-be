'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const defaultPassword = await bcrypt.hash('Password123', 10);

    const departments = await queryInterface.sequelize.query(
      'SELECT id, name FROM departments',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const getDeptId = (name) => departments.find((d) => d.name === name)?.id;

    const locations = await queryInterface.sequelize.query(
      'SELECT id, name FROM locations',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const getLocId = (name) => locations.find((l) => l.name === name)?.id;

    const baseUser = (overrides) => ({
      password: defaultPassword,
      status: 'active',
      is_verified: true,
      created_at: now,
      updated_at: now,
      ...overrides,
    });

    // Insert CEO first
    await queryInterface.bulkInsert('users', [
      baseUser({
        email: 'ceo@staffclock.com',
        first_name: 'John',
        last_name: 'Executive',
        role: 'ceo',
        phone: '+1234567890',
        department_id: getDeptId('Executive'),
        location_id: getLocId('Headquarters'),
        manager_id: null,
      }),
    ]);

    const [ceo] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'ceo@staffclock.com'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert Admin
    await queryInterface.bulkInsert('users', [
      baseUser({
        email: 'admin@staffclock.com',
        first_name: 'Sarah',
        last_name: 'Administrator',
        role: 'admin',
        phone: '+1234567891',
        department_id: getDeptId('Human Resources'),
        location_id: getLocId('Headquarters'),
        manager_id: ceo.id,
      }),
    ]);

    const [admin] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@staffclock.com'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert IT Manager
    await queryInterface.bulkInsert('users', [
      baseUser({
        email: 'it.manager@staffclock.com',
        first_name: 'David',
        last_name: 'TechLead',
        role: 'staff',
        phone: '+1234567894',
        department_id: getDeptId('IT'),
        location_id: getLocId('Technical Support'),
        manager_id: ceo.id,
      }),
    ]);

    const [itManager] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'it.manager@staffclock.com'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert remaining users
    await queryInterface.bulkInsert('users', [
      baseUser({ email: 'security1@staffclock.com', first_name: 'Mike', last_name: 'Guard', role: 'security', phone: '+1234567892', department_id: getDeptId('Security'), location_id: getLocId('Headquarters'), manager_id: admin.id }),
      baseUser({ email: 'security2@staffclock.com', first_name: 'Tom', last_name: 'Watchman', role: 'security', phone: '+1234567893', department_id: getDeptId('Security'), location_id: getLocId('Branch Office'), manager_id: admin.id }),
      baseUser({ email: 'developer1@staffclock.com', first_name: 'Alice', last_name: 'Developer', role: 'staff', phone: '+1234567895', department_id: getDeptId('IT'), location_id: getLocId('Technical Support'), manager_id: itManager.id }),
      baseUser({ email: 'developer2@staffclock.com', first_name: 'Bob', last_name: 'Coder', role: 'staff', phone: '+1234567896', department_id: getDeptId('IT'), location_id: getLocId('Technical Support'), manager_id: itManager.id }),
      baseUser({ email: 'sales1@staffclock.com', first_name: 'Emma', last_name: 'Seller', role: 'staff', phone: '+1234567897', department_id: getDeptId('Sales'), location_id: getLocId('Branch Office'), manager_id: admin.id }),
      baseUser({ email: 'inactive@staffclock.com', first_name: 'Inactive', last_name: 'User', role: 'staff', status: 'inactive', phone: '+1234567898', department_id: getDeptId('Administration'), location_id: getLocId('Headquarters'), manager_id: admin.id }),
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
