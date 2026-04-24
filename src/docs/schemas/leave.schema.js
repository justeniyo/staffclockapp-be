export default {
  Leave: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      userId: { type: 'integer', example: 1 },
      type: { type: 'string', enum: ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'], example: 'annual' },
      startDate: { type: 'string', format: 'date', example: '2024-01-15' },
      endDate: { type: 'string', format: 'date', example: '2024-01-19' },
      totalDays: { type: 'number', example: 5 },
      reason: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'], example: 'pending' },
      reviewedBy: { type: 'integer', nullable: true },
      reviewedAt: { type: 'string', format: 'date-time', nullable: true },
      reviewNotes: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      user: { $ref: '#/components/schemas/UserSummary' },
      reviewer: { $ref: '#/components/schemas/UserSummary' },
    },
  },

  LeaveCreate: {
    type: 'object',
    required: ['type', 'startDate', 'endDate'],
    properties: {
      type: { type: 'string', enum: ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'], example: 'annual' },
      startDate: { type: 'string', format: 'date', example: '2024-01-15' },
      endDate: { type: 'string', format: 'date', example: '2024-01-19' },
      reason: { type: 'string', example: 'Family vacation' },
    },
  },

  LeaveReview: {
    type: 'object',
    properties: {
      notes: { type: 'string', example: 'Approved. Enjoy your time off.' },
    },
  },

  LeaveBalance: {
    type: 'object',
    properties: {
      year: { type: 'integer', example: 2024 },
      used: {
        type: 'object',
        properties: {
          annual: { type: 'number', example: 5 },
          sick: { type: 'number', example: 2 },
          personal: { type: 'number', example: 1 },
        },
      },
      pending: { type: 'integer', example: 1 },
    },
  },
};
