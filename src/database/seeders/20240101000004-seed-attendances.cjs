'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const users = await queryInterface.sequelize.query(
      "SELECT id, email, location_id FROM users WHERE status = 'active' AND role IN ('staff', 'ceo', 'admin')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!users.length) return;

    const records = [];
    const now = new Date();

    // Generate attendance records for the past 7 business days
    for (let dayOffset = 1; dayOffset <= 10; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() - dayOffset);

      // Skip weekends
      if (day.getDay() === 0 || day.getDay() === 6) continue;

      for (const user of users) {
        // 80% chance of having a record on any given day
        if (Math.random() > 0.8) continue;

        const clockInHour = 7 + Math.floor(Math.random() * 3); // 7-9 AM
        const clockInMin = Math.floor(Math.random() * 60);
        const workHours = 7 + Math.floor(Math.random() * 3); // 7-9 hour shifts
        const breakMins = 30 + Math.floor(Math.random() * 31); // 30-60 min break

        const clockIn = new Date(day);
        clockIn.setHours(clockInHour, clockInMin, 0, 0);

        const clockOut = new Date(clockIn);
        clockOut.setHours(clockIn.getHours() + workHours, clockIn.getMinutes() + Math.floor(Math.random() * 30));

        const workDuration = Math.floor((clockOut - clockIn) / 60000) - breakMins;

        records.push({
          user_id: user.id,
          clock_in: clockIn,
          clock_out: clockOut,
          break_start: new Date(clockIn.getTime() + 4 * 60 * 60000), // 4 hours after clock in
          break_end: new Date(clockIn.getTime() + 4 * 60 * 60000 + breakMins * 60000),
          break_duration: breakMins,
          work_duration: workDuration,
          status: 'clocked_out',
          location_id: user.location_id,
          notes: null,
          ip_address: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
          created_at: clockIn,
          updated_at: clockOut,
        });
      }
    }

    if (records.length) {
      await queryInterface.bulkInsert('attendances', records);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('attendances', null, {});
  },
};
