const auth = [{ bearerAuth: [] }];
const tags = ['Departments'];

export default {
  '/departments': {
    post: {
      summary: 'Create department',
      description: 'Admin: Create a new department',
      tags,
      security: auth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Engineering' },
                description: { type: 'string', example: 'Software development team' },
                isActive: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } },
        409: { description: 'Name already exists' },
      },
    },
    get: {
      summary: 'Get all departments',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' } },
        { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Departments list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/departments/{id}': {
    get: {
      summary: 'Get department by ID',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Department', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } },
        404: { description: 'Not found' },
      },
    },
    put: {
      summary: 'Update department',
      description: 'Admin: Update department',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } },
        409: { description: 'Name already exists' },
      },
    },
    delete: {
      summary: 'Delete department',
      description: 'CEO only: Delete department (must have no users)',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Deleted' },
        409: { description: 'Cannot delete with assigned users' },
      },
    },
  },
};
