const auth = [{ bearerAuth: [] }];
const tags = ['Leaves'];

export default {
  '/leaves': {
    post: {
      summary: 'Request leave',
      description: 'Submit a new leave request',
      tags,
      security: auth,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LeaveCreate' } } },
      },
      responses: {
        201: { description: 'Leave requested', content: { 'application/json': { schema: { $ref: '#/components/schemas/Leave' } } } },
        409: { description: 'Overlapping leave exists' },
      },
    },
    get: {
      summary: 'Get all leave requests',
      description: 'Admin: Get paginated leave requests',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'userId', schema: { type: 'integer' } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'] } },
        { in: 'query', name: 'type', schema: { type: 'string', enum: ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'] } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Leave requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/leaves/my': {
    get: {
      summary: 'Get own leave requests',
      description: 'Get leave requests for current user',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'] } },
        { in: 'query', name: 'type', schema: { type: 'string' } },
        { in: 'query', name: 'year', schema: { type: 'integer' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Leave requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/leaves/my/balance': {
    get: {
      summary: 'Get own leave balance',
      description: 'Get leave usage summary for current user',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'year', schema: { type: 'integer', default: 2024 } },
      ],
      responses: {
        200: { description: 'Leave balance', content: { 'application/json': { schema: { $ref: '#/components/schemas/LeaveBalance' } } } },
      },
    },
  },

  '/leaves/pending': {
    get: {
      summary: 'Get pending requests',
      description: 'Admin: Get all pending leave requests',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Pending requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/leaves/user/{userId}/balance': {
    get: {
      summary: 'Get user leave balance',
      description: 'Admin: Get leave balance for specific user',
      tags,
      security: auth,
      parameters: [
        { in: 'path', name: 'userId', required: true, schema: { type: 'integer' } },
        { in: 'query', name: 'year', schema: { type: 'integer' } },
      ],
      responses: {
        200: { description: 'Leave balance', content: { 'application/json': { schema: { $ref: '#/components/schemas/LeaveBalance' } } } },
      },
    },
  },

  '/leaves/{id}': {
    get: {
      summary: 'Get leave by ID',
      description: 'Admin: Get leave request details',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Leave request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Leave' } } } },
        404: { description: 'Not found' },
      },
    },
  },

  '/leaves/{id}/approve': {
    post: {
      summary: 'Approve leave',
      description: 'Admin: Approve a pending leave request',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      requestBody: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LeaveReview' } } },
      },
      responses: {
        200: { description: 'Approved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Leave' } } } },
        400: { description: 'Only pending requests can be approved' },
      },
    },
  },

  '/leaves/{id}/reject': {
    post: {
      summary: 'Reject leave',
      description: 'Admin: Reject a pending leave request',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      requestBody: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LeaveReview' } } },
      },
      responses: {
        200: { description: 'Rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Leave' } } } },
        400: { description: 'Only pending requests can be rejected' },
      },
    },
  },

  '/leaves/{id}/cancel': {
    post: {
      summary: 'Cancel leave',
      description: 'Cancel own leave request',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Cancelled', content: { 'application/json': { schema: { $ref: '#/components/schemas/Leave' } } } },
        400: { description: 'Cannot cancel started leave' },
        403: { description: 'Can only cancel own requests' },
      },
    },
  },
};
