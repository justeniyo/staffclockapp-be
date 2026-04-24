export default {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Error message' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },

  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: { type: 'object' },
    },
  },

  Pagination: {
    type: 'object',
    properties: {
      total: { type: 'integer', example: 100 },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      totalPages: { type: 'integer', example: 5 },
      hasNext: { type: 'boolean', example: true },
      hasPrev: { type: 'boolean', example: false },
    },
  },

  PaginatedResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: { type: 'array', items: {} },
      pagination: { $ref: '#/components/schemas/Pagination' },
    },
  },
};
