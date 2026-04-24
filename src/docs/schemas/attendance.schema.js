export default {
  Attendance: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      userId: { type: 'integer', example: 1 },
      clockIn: { type: 'string', format: 'date-time' },
      clockOut: { type: 'string', format: 'date-time', nullable: true },
      breakStart: { type: 'string', format: 'date-time', nullable: true },
      breakEnd: { type: 'string', format: 'date-time', nullable: true },
      breakDuration: { type: 'integer', example: 30, description: 'Total break minutes' },
      workDuration: { type: 'integer', example: 450, description: 'Total work minutes' },
      status: { type: 'string', enum: ['clocked_in', 'on_break', 'clocked_out'], example: 'clocked_in' },
      locationId: { type: 'integer', example: 1, nullable: true },
      notes: { type: 'string', nullable: true },
      ipAddress: { type: 'string', example: '192.168.1.1', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      user: { $ref: '#/components/schemas/UserSummary' },
      location: { $ref: '#/components/schemas/Location' },
    },
  },

  ClockInRequest: {
    type: 'object',
    properties: {
      locationId: { type: 'integer', example: 1 },
      notes: { type: 'string', example: 'Starting day shift' },
    },
  },

  AttendanceStatus: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['clocked_in', 'on_break', 'clocked_out'], example: 'clocked_in' },
      attendance: { $ref: '#/components/schemas/Attendance' },
      clockedInAt: { type: 'string', format: 'date-time' },
      breakDuration: { type: 'integer', example: 0 },
    },
  },

  AttendanceSummary: {
    type: 'object',
    properties: {
      totalDays: { type: 'integer', example: 22 },
      totalWorkMinutes: { type: 'integer', example: 9900 },
      totalWorkHours: { type: 'number', example: 165.0 },
      totalBreakMinutes: { type: 'integer', example: 660 },
      averageWorkMinutes: { type: 'integer', example: 450 },
    },
  },

  UserSummary: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      email: { type: 'string', format: 'email', example: 'john@example.com' },
    },
  },
};
