export default {
  Shift: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      userId: { type: 'integer', example: 1 },
      date: { type: 'string', format: 'date', example: '2024-01-15' },
      startTime: { type: 'string', example: '09:00' },
      endTime: { type: 'string', example: '17:00' },
      breakMinutes: { type: 'integer', example: 60 },
      locationId: { type: 'integer', example: 1, nullable: true },
      status: { type: 'string', enum: ['scheduled', 'completed', 'missed', 'cancelled'], example: 'scheduled' },
      notes: { type: 'string', nullable: true },
      createdBy: { type: 'integer', example: 2 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      user: { $ref: '#/components/schemas/UserSummary' },
      creator: { $ref: '#/components/schemas/UserSummary' },
      location: { $ref: '#/components/schemas/Location' },
    },
  },

  ShiftCreate: {
    type: 'object',
    required: ['userId', 'date', 'startTime', 'endTime'],
    properties: {
      userId: { type: 'integer', example: 1 },
      date: { type: 'string', format: 'date', example: '2024-01-15' },
      startTime: { type: 'string', example: '09:00', description: 'Format HH:MM' },
      endTime: { type: 'string', example: '17:00', description: 'Format HH:MM' },
      breakMinutes: { type: 'integer', example: 60, default: 0 },
      locationId: { type: 'integer', example: 1 },
      notes: { type: 'string' },
    },
  },

  ShiftBulkCreate: {
    type: 'object',
    required: ['shifts'],
    properties: {
      shifts: {
        type: 'array',
        items: { $ref: '#/components/schemas/ShiftCreate' },
      },
    },
  },

  ShiftUpdate: {
    type: 'object',
    properties: {
      date: { type: 'string', format: 'date' },
      startTime: { type: 'string', example: '09:00' },
      endTime: { type: 'string', example: '17:00' },
      breakMinutes: { type: 'integer' },
      locationId: { type: 'integer' },
      notes: { type: 'string' },
    },
  },
};
