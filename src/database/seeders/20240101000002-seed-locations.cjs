'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('locations', [
      {
        name: 'Headquarters',
        address: 'MTN Centre, KG 9 Ave, Kigali',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Technical Support',
        address: 'KG 11 Ave, Kigali',
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
        address: 'Union Trade Center (UTC), 2nd Floor, KN 4 Ave, Kigali',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Field Site',
        address: 'KG 43D Ave, Kigali',
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
