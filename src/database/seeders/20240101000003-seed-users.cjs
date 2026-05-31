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
      is_manager: false,
      created_at: now,
      updated_at: now,
      ...overrides,
    });

    // Insert CEO first
    await queryInterface.bulkInsert('users', [
      baseUser({
        email: 'ceo@mtn-company.co.rw',
        first_name: 'John',
        last_name: 'Executive',
        role: 'ceo',
        phone: '+250788315901',
        department_id: getDeptId('Executive'),
        location_id: getLocId('Headquarters'),
        manager_id: null,
        is_manager: true,
      }),
    ]);

    const [ceo] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'ceo@mtn-company.co.rw'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert Admin
    await queryInterface.bulkInsert('users', [
      baseUser({
        email: 'admin@mtn-company.co.rw',
        first_name: 'Sarah',
        last_name: 'Administrator',
        role: 'admin',
        phone: '+250788314181',
        department_id: getDeptId('Human Resources'),
        location_id: getLocId('Headquarters'),
        manager_id: ceo.id,
        is_manager: true,
      }),
    ]);

    const [admin] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@mtn-company.co.rw'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert IT Manager
    await queryInterface.bulkInsert('users', [
      baseUser({
        email: 'it.manager@mtn-company.co.rw',
        first_name: 'David',
        last_name: 'TechLead',
        role: 'staff',
        phone: '+250788312277',
        department_id: getDeptId('IT'),
        location_id: getLocId('Technical Support'),
        manager_id: ceo.id,
        is_manager: true,
      }),
    ]);

    const [itManager] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'it.manager@mtn-company.co.rw'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert remaining users
    await queryInterface.bulkInsert('users', [
      baseUser({ email: 'security1@mtn-company.co.rw', first_name: 'Mike', last_name: 'Guard', role: 'security', phone: '+250783443211', department_id: getDeptId('Security'), location_id: getLocId('Headquarters'), manager_id: admin.id }),
      baseUser({ email: 'security2@mtn-company.co.rw', first_name: 'Tom', last_name: 'Watchman', role: 'security', phone: '+250782117836', department_id: getDeptId('Security'), location_id: getLocId('Branch Office'), manager_id: admin.id }),
      baseUser({ email: 'developer1@mtn-company.co.rw', first_name: 'Alice', last_name: 'Developer', role: 'staff', phone: '+250788313922', department_id: getDeptId('IT'), location_id: getLocId('Technical Support'), manager_id: itManager.id }),
      baseUser({ email: 'developer2@mtn-company.co.rw', first_name: 'Bob', last_name: 'Coder', role: 'staff', phone: '+250788316735', department_id: getDeptId('IT'), location_id: getLocId('Technical Support'), manager_id: itManager.id }),
      baseUser({ email: 'sales1@mtn-company.co.rw', first_name: 'Emma', last_name: 'Seller', role: 'staff', phone: '+250788312666', department_id: getDeptId('Sales'), location_id: getLocId('Branch Office'), manager_id: admin.id }),
      baseUser({ email: 'inactive@mtn-company.co.rw', first_name: 'Inactive', last_name: 'User', role: 'staff', status: 'inactive', phone: '+250788319956', department_id: getDeptId('Administration'), location_id: getLocId('Headquarters'), manager_id: admin.id }),
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
