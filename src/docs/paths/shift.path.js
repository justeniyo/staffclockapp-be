const auth = [{ bearerAuth: [] }];
const tags = ['Shifts'];

export default {
  '/shifts': {
    post: {
      summary: 'Create shift',
      description: 'Admin: Create a new shift',
      tags,
      security: auth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ShiftCreate' } } },
      },
      responses: {
        201: { description: 'Shift created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shift' } } } },
        409: { description: 'Shift already exists for this date' },
      },
    },
    get: {
      summary: 'Get all shifts',
      description: 'Admin: Get paginated shifts',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'userId', schema: { type: 'integer' } },
        { in: 'query', name: 'locationId', schema: { type: 'integer' } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['scheduled', 'completed', 'missed', 'cancelled'] } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Shifts list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/shifts/bulk': {
    post: {
      summary: 'Create multiple shifts',
      description: 'Admin: Create shifts in bulk',
      tags,
      security: auth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ShiftBulkCreate' } } },
      },
      responses: {
        201: { description: 'Bulk operation results', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array' } } } } } },
      },
    },
  },

  '/shifts/my': {
    get: {
      summary: 'Get own shifts',
      description: 'Get shifts for current user',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['scheduled', 'completed', 'missed', 'cancelled'] } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Shifts list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/shifts/week': {
    get: {
      summary: 'Get week schedule',
      description: 'Admin: Get shifts for a week',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'startDate', required: true, schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'userId', schema: { type: 'integer' } },
        { in: 'query', name: 'locationId', schema: { type: 'integer' } },
      ],
      responses: {
        200: { description: 'Week schedule', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Shift' } } } } },
      },
    },
  },

  '/shifts/user/{userId}': {
    get: {
      summary: 'Get user shifts',
      description: 'Admin: Get shifts for specific user',
      tags,
      security: auth,
      parameters: [
        { in: 'path', name: 'userId', required: true, schema: { type: 'integer' } },
        { in: 'query', name: 'status', schema: { type: 'string' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
      ],
      responses: {
        200: { description: 'Shifts list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/shifts/{id}': {
    get: {
      summary: 'Get shift by ID',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Shift details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shift' } } } },
        404: { description: 'Not found' },
      },
    },
    put: {
      summary: 'Update shift',
      description: 'Admin: Update shift details',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      requestBody: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ShiftUpdate' } } },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shift' } } } },
        400: { description: 'Cannot modify completed shift' },
      },
    },
    delete: {
      summary: 'Delete shift',
      description: 'Admin: Delete shift',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Deleted' },
      },
    },
  },

  '/shifts/{id}/cancel': {
    post: {
      summary: 'Cancel shift',
      description: 'Admin: Cancel a scheduled shift',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Cancelled', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shift' } } } },
        400: { description: 'Only scheduled shifts can be cancelled' },
      },
    },
  },
};
