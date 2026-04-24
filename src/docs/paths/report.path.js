const auth = [{ bearerAuth: [] }];
const tags = ['Reports'];

const commonParams = [
  { in: 'query', name: 'format', schema: { type: 'string', enum: ['csv', 'excel'], default: 'csv' }, description: 'Export format' },
  { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' }, description: 'Filter from date' },
  { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' }, description: 'Filter to date' },
  { in: 'query', name: 'userId', schema: { type: 'integer' }, description: 'Filter by user ID' },
  { in: 'query', name: 'departmentId', schema: { type: 'integer' }, description: 'Filter by department ID' },
  { in: 'query', name: 'locationId', schema: { type: 'integer' }, description: 'Filter by location ID' },
];

export default {
  '/reports/attendance': {
    get: {
      summary: 'Export attendance report',
      description: 'Download attendance records as CSV or Excel. Includes employee info, clock times, work/break durations.',
      tags,
      security: auth,
      parameters: commonParams,
      responses: {
        200: {
          description: 'File download',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
          },
        },
        403: { description: 'Forbidden - Admin access required' },
      },
    },
  },

  '/reports/attendance/summary': {
    get: {
      summary: 'Export attendance summary',
      description: 'Download aggregated attendance summary per employee. Includes total days, hours worked, averages.',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'format', schema: { type: 'string', enum: ['csv', 'excel'], default: 'csv' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' }, description: 'Filter from date' },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' }, description: 'Filter to date' },
        { in: 'query', name: 'departmentId', schema: { type: 'integer' }, description: 'Filter by department' },
      ],
      responses: {
        200: {
          description: 'File download',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
          },
        },
        403: { description: 'Forbidden - Admin access required' },
      },
    },
  },

  '/reports/shifts': {
    get: {
      summary: 'Export shifts report',
      description: 'Download shift schedule data as CSV or Excel. Includes assigned employees, times, locations, status.',
      tags,
      security: auth,
      parameters: [
        ...commonParams,
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['scheduled', 'completed', 'missed', 'cancelled'] }, description: 'Filter by status' },
      ],
      responses: {
        200: {
          description: 'File download',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
          },
        },
        403: { description: 'Forbidden - Admin access required' },
      },
    },
  },

  '/reports/leaves': {
    get: {
      summary: 'Export leaves report',
      description: 'Download leave/PTO data as CSV or Excel. Includes employee info, dates, type, status, reviewer.',
      tags,
      security: auth,
      parameters: [
        ...commonParams,
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'] }, description: 'Filter by status' },
        { in: 'query', name: 'type', schema: { type: 'string', enum: ['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other'] }, description: 'Filter by leave type' },
      ],
      responses: {
        200: {
          description: 'File download',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
          },
        },
        403: { description: 'Forbidden - Admin access required' },
      },
    },
  },
};
