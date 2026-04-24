/**
 * User management API paths
 */
export default {
  '/users': {
    post: {
      summary: 'Create a new user',
      description: 'Create a new user account. Only Admin and CEO can create users.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserCreate',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User created successfully' },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        409: {
          description: 'Email already registered',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    get: {
      summary: 'List all users',
      description: 'Retrieve paginated list of users with optional filtering. Admin and CEO only.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Items per page',
        },
        {
          in: 'query',
          name: 'role',
          schema: { type: 'string', enum: ['staff', 'admin', 'security', 'ceo'] },
          description: 'Filter by role',
        },
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
          description: 'Filter by status',
        },
        {
          in: 'query',
          name: 'departmentId',
          schema: { type: 'integer' },
          description: 'Filter by department',
        },
        {
          in: 'query',
          name: 'locationId',
          schema: { type: 'integer' },
          description: 'Filter by location',
        },
        {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Search by name or email',
        },
      ],
      responses: {
        200: {
          description: 'Users retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
      },
    },
  },

  '/users/role/{role}': {
    get: {
      summary: 'Get users by role',
      description: 'Retrieve all users with a specific role. Admin and CEO only.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'role',
          required: true,
          schema: { type: 'string', enum: ['staff', 'admin', 'security', 'ceo'] },
          description: 'User role to filter by',
        },
      ],
      responses: {
        200: {
          description: 'Users retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
      },
    },
  },

  '/users/{id}': {
    get: {
      summary: 'Get user by ID',
      description: 'Retrieve a specific user\'s details. Admin and CEO can view any user.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'User ID',
        },
      ],
      responses: {
        200: {
          description: 'User retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    put: {
      summary: 'Update user',
      description: 'Update a user\'s details. Admin and CEO only. Only CEO can modify CEO users.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'User ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserUpdate' },
          },
        },
      },
      responses: {
        200: {
          description: 'User updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User updated successfully' },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
        409: { description: 'Email already registered' },
      },
    },
    delete: {
      summary: 'Delete user',
      description: 'Delete a user account. Admin and CEO only. Only CEO can delete CEO users.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'User ID',
        },
      ],
      responses: {
        200: {
          description: 'User deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User deleted successfully' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/users/{id}/direct-reports': {
    get: {
      summary: 'Get direct reports',
      description: 'Get all users who report directly to the specified user.',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'Manager\'s user ID',
        },
      ],
      responses: {
        200: {
          description: 'Direct reports retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },
};
