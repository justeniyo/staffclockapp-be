'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('locations', [
      {
        name: 'Headquarters',
        address: '123 Main Street, Business District, City',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Technical Support',
        address: '456 Tech Lane, Innovation Park, City',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Remote',
        address: 'Remote Location',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Branch Office',
        address: '789 Branch Road, Suburban Area, Town',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Field Office',
        address: '321 Field Avenue, Industrial Zone, Village',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', null, {});
  },
};
