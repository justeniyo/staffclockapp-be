const auth = [{ bearerAuth: [] }];
const tags = ['Locations'];

export default {
  '/locations': {
    post: {
      summary: 'Create location',
      description: 'Admin: Create a new location',
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
                name: { type: 'string', example: 'Main Office' },
                address: { type: 'string', example: '123 Business St' },
                isActive: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Location' } } } },
        409: { description: 'Name already exists' },
      },
    },
    get: {
      summary: 'Get all locations',
      tags,
      security: auth,
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' } },
        { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Locations list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
      },
    },
  },

  '/locations/{id}': {
    get: {
      summary: 'Get location by ID',
      tags,
      security: auth,
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Location', content: { 'application/json': { schema: { $ref: '#/components/schemas/Location' } } } },
        404: { description: 'Not found' },
      },
    },
    put: {
      summary: 'Update location',
      description: 'Admin: Update location',
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
                address: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Location' } } } },
        409: { description: 'Name already exists' },
      },
    },
    delete: {
      summary: 'Delete location',
      description: 'CEO only: Delete location (must have no users)',
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
