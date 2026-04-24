'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('departments', [
      {
        name: 'Executive',
        description: 'Executive leadership and C-suite',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'IT',
        description: 'Information Technology and software development',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Human Resources',
        description: 'HR, recruitment, and employee relations',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Sales',
        description: 'Sales and business development',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Operations',
        description: 'Day-to-day business operations',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Finance',
        description: 'Financial management and accounting',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Administration',
        description: 'Administrative support services',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Security',
        description: 'Physical and facility security',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('departments', null, {});
  },
};
