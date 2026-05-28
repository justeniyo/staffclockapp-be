'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const users = await queryInterface.sequelize.query(
      "SELECT id, email, role, manager_id FROM users WHERE status = 'active' AND role IN ('staff', 'ceo')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const managers = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE status = 'active' AND role IN ('admin', 'ceo')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!users.length) return;

    const now = new Date();
    const leaves = [];

    const types = ['annual', 'sick', 'personal', 'annual', 'annual', 'sick']; // weighted toward annual
    const reasons = {
      annual: null,
      sick: 'Not feeling well, need rest',
      personal: 'Personal matters to attend to',
      unpaid: 'Extended personal leave',
    };

    // Past approved leaves
    for (let i = 0; i < Math.min(users.length, 5); i++) {
      const user = users[i];
      if (user.role === 'ceo') continue;

      const startDay = new Date(now);
      startDay.setDate(startDay.getDate() - 30 - Math.floor(Math.random() * 60));
      // Align to weekday
      while (startDay.getDay() === 0 || startDay.getDay() === 6) startDay.setDate(startDay.getDate() + 1);

      const endDay = new Date(startDay);
      endDay.setDate(endDay.getDate() + 1 + Math.floor(Math.random() * 4));
      // Skip weekends for end date
      while (endDay.getDay() === 0 || endDay.getDay() === 6) endDay.setDate(endDay.getDate() + 1);

      const type = types[i % types.length];
      const reviewerId = managers.length ? managers[0].id : null;
      const totalDays = Math.max(1, Math.ceil((endDay - startDay) / (1000 * 60 * 60 * 24)));

      leaves.push({
        user_id: user.id,
        type,
        start_date: startDay.toISOString().split('T')[0],
        end_date: endDay.toISOString().split('T')[0],
        total_days: totalDays,
        reason: reasons[type] || null,
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date(startDay.getTime() - 2 * 24 * 60 * 60000),
        review_notes: type === 'sick' ? 'Approved. Get well soon.' : null,
        created_at: new Date(startDay.getTime() - 7 * 24 * 60 * 60000),
        updated_at: new Date(startDay.getTime() - 2 * 24 * 60 * 60000),
      });
    }

    // Pending leaves (future dates)
    for (let i = 0; i < Math.min(users.length, 3); i++) {
      const user = users[i];
      if (user.role === 'ceo') continue;

      const startDay = new Date(now);
      startDay.setDate(startDay.getDate() + 7 + Math.floor(Math.random() * 21));
      while (startDay.getDay() === 0 || startDay.getDay() === 6) startDay.setDate(startDay.getDate() + 1);

      const endDay = new Date(startDay);
      endDay.setDate(endDay.getDate() + 1 + Math.floor(Math.random() * 3));
      while (endDay.getDay() === 0 || endDay.getDay() === 6) endDay.setDate(endDay.getDate() + 1);

      const type = types[(i + 2) % types.length];
      const totalDays = Math.max(1, Math.ceil((endDay - startDay) / (1000 * 60 * 60 * 24)));

      leaves.push({
        user_id: user.id,
        type,
        start_date: startDay.toISOString().split('T')[0],
        end_date: endDay.toISOString().split('T')[0],
        total_days: totalDays,
        reason: reasons[type] || null,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        created_at: new Date(now.getTime() - Math.floor(Math.random() * 5) * 24 * 60 * 60000),
        updated_at: new Date(now.getTime() - Math.floor(Math.random() * 5) * 24 * 60 * 60000),
      });
    }

    // One rejected leave
    if (users.length >= 2) {
      const user = users[users.length - 1];
      const startDay = new Date(now);
      startDay.setDate(startDay.getDate() - 14);
      while (startDay.getDay() === 0 || startDay.getDay() === 6) startDay.setDate(startDay.getDate() + 1);
      const endDay = new Date(startDay);
      endDay.setDate(endDay.getDate() + 5);

      leaves.push({
        user_id: user.id,
        type: 'annual',
        start_date: startDay.toISOString().split('T')[0],
        end_date: endDay.toISOString().split('T')[0],
        total_days: 5,
        reason: null,
        status: 'rejected',
        reviewed_by: managers.length ? managers[0].id : null,
        reviewed_at: new Date(startDay.getTime() - 3 * 24 * 60 * 60000),
        review_notes: 'Insufficient team coverage during requested period.',
        created_at: new Date(startDay.getTime() - 10 * 24 * 60 * 60000),
        updated_at: new Date(startDay.getTime() - 3 * 24 * 60 * 60000),
      });
    }

    if (leaves.length) {
      await queryInterface.bulkInsert('leaves', leaves);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('leaves', null, {});
  },
};
