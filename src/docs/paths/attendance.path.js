const auth = [{ bearerAuth: [] }];
const tags = ['Attendance'];

export default {
  '/attendance/clock-in': {
    post: {
      summary: 'Clock in',
      description: 'Start a new work session',
      tags,
      security: auth,
      requestBody: {
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ClockInRequest' } } },
      },
      responses: {
        201: { description: 'Clocked in successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/Attendance' } } } },
        409: { description: 'Already clocked in' },
      },
    },
  },

  '/attendance/clock-out': {
    post: {
      summary: 'Clock out',
      description: 'End current work session',
      tags,
      security: auth,
      responses: {
        200: { description: 'Clocked out successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/Attendance' } } } },
        400: { description: 'Not currently clocked in' },
      },
    },
  },

  '/attendance/break/start': {
    post: {
      summary: 'Start break',
      description: 'Start a break during work session',
      tags,
      security: auth,
      responses: {
        200: { description: 'Break started', content: { 'application/json': { schema: { $ref: '#/components/schemas/Attendance' } } } },
        400: { description: 'Not clocked in or already on break' },
      },
    },
  },

  '/attendance/break/end': {
    post: {
      summary: 'End break',
      description: 'End current break',
      tags,
      security: auth,
      responses: {
        200: { description: 'Break ended', content: { 'application/json': { schema: { $ref: '#/components/schemas/Attendance' } } } },
        400: { description: 'Not on break' },
      },
    },
  },

  '/attendance/status': {
    get: {
      summary: 'Get current status',
      description: 'Get current clock-in status',
      tags,
      security: auth,
      responses: {
        200: { description: 'Status retrieved', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceStatus' } } } },
      },
    },
  },

  '/attendance/my': {
    get: {
      summary: 'Get own attendance history',
      description: 'Get paginated attendance records for current user',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Attendance records', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/attendance/my/summary': {
    get: {
      summary: 'Get own attendance summary',
      description: 'Get work time summary for current user',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' }, required: true },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' }, required: true },
      ],
      responses: {
        200: { description: 'Summary retrieved', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceSummary' } } } },
      },
    },
  },

  '/attendance': {
    get: {
      summary: 'Get all attendance records',
      description: 'Admin: Get paginated attendance records',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'userId', schema: { type: 'integer' } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['clocked_in', 'on_break', 'clocked_out'] } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Attendance records', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
        403: { description: 'Forbidden' },
      },
    },
  },

  '/attendance/{id}': {
    get: {
      summary: 'Get attendance by ID',
      description: 'Admin: Get single attendance record',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Attendance record', content: { 'application/json': { schema: { $ref: '#/components/schemas/Attendance' } } } },
        404: { description: 'Not found' },
      },
    },
    put: {
      summary: 'Update attendance',
      description: 'Admin: Update attendance record',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      requestBody: {
        content: { 'application/json': { schema: { type: 'object', properties: { notes: { type: 'string' }, clockIn: { type: 'string' }, clockOut: { type: 'string' } } } } },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Attendance' } } } },
      },
    },
    delete: {
      summary: 'Delete attendance',
      description: 'CEO only: Delete attendance record',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Deleted' },
        403: { description: 'Forbidden' },
      },
    },
  },

  '/attendance/user/{userId}': {
    get: {
      summary: 'Get user attendance',
      description: 'Admin: Get attendance records for specific user',
      tags,
      security: auth,
      parameters: [
        { in: 'path', name: 'userId', required: true, schema: { type: 'integer' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Attendance records', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/attendance/user/{userId}/summary': {
    get: {
      summary: 'Get user attendance summary',
      description: 'Admin: Get work time summary for specific user',
      tags,
      security: auth,
      parameters: [
        { in: 'path', name: 'userId', required: true, schema: { type: 'integer' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' }, required: true },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' }, required: true },
      ],
      responses: {
        200: { description: 'Summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttendanceSummary' } } } },
      },
    },
  },
};
