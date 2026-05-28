'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const staffUsers = await queryInterface.sequelize.query(
      "SELECT id, email, location_id FROM users WHERE status = 'active' AND role = 'staff'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const admins = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE status = 'active' AND role IN ('admin', 'ceo') LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!staffUsers.length || !admins.length) return;

    const creatorId = admins[0].id;
    const now = new Date();
    const shifts = [];

    const shiftPatterns = [
      { start: '08:00', end: '16:00', breakMin: 60 },
      { start: '09:00', end: '17:00', breakMin: 60 },
      { start: '07:00', end: '15:00', breakMin: 45 },
      { start: '10:00', end: '18:00', breakMin: 60 },
    ];

    // Generate shifts for the current and next week
    for (let dayOffset = -7; dayOffset <= 7; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() + dayOffset);

      // Skip weekends
      if (day.getDay() === 0 || day.getDay() === 6) continue;

      const dateStr = day.toISOString().split('T')[0];
      const isPast = dayOffset < 0;

      for (let i = 0; i < staffUsers.length; i++) {
        const user = staffUsers[i];
        const pattern = shiftPatterns[i % shiftPatterns.length];

        let status = 'scheduled';
        if (isPast) {
          // Past shifts: 85% completed, 15% missed
          status = Math.random() > 0.15 ? 'completed' : 'missed';
        }

        shifts.push({
          user_id: user.id,
          date: dateStr,
          start_time: pattern.start,
          end_time: pattern.end,
          break_minutes: pattern.breakMin,
          location_id: user.location_id,
          status,
          notes: status === 'missed' ? 'No show - unexcused' : null,
          created_by: creatorId,
          created_at: new Date(day.getTime() - 14 * 24 * 60 * 60000),
          updated_at: isPast ? day : new Date(day.getTime() - 14 * 24 * 60 * 60000),
        });
      }
    }

    if (shifts.length) {
      await queryInterface.bulkInsert('shifts', shifts);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('shifts', null, {});
  },
};
