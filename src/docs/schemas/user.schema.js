export default {
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      email: { type: 'string', format: 'email', example: 'user@staffclock.com' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      role: { type: 'string', enum: ['staff', 'admin', 'security', 'ceo'], example: 'staff' },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
      isVerified: { type: 'boolean', example: true },
      phone: { type: 'string', example: '+1234567890' },
      departmentId: { type: 'integer', example: 1 },
      locationId: { type: 'integer', example: 1 },
      managerId: { type: 'integer', example: 2 },
      lastLoginAt: { type: 'string', format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      department: { $ref: '#/components/schemas/Department' },
      location: { $ref: '#/components/schemas/Location' },
    },
  },

  UserCreate: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName', 'role'],
    properties: {
      email: { type: 'string', format: 'email', example: 'newuser@staffclock.com' },
      password: { type: 'string', minLength: 8, example: 'Password123', description: 'Min 8 chars, uppercase, lowercase, number' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      role: { type: 'string', enum: ['staff', 'admin', 'security', 'ceo'], example: 'staff' },
      phone: { type: 'string', example: '+1234567890' },
      departmentId: { type: 'integer', example: 1 },
      locationId: { type: 'integer', example: 1 },
      managerId: { type: 'integer', example: 2 },
    },
  },

  UserUpdate: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      role: { type: 'string', enum: ['staff', 'admin', 'security', 'ceo'] },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
      phone: { type: 'string' },
      departmentId: { type: 'integer' },
      locationId: { type: 'integer' },
      managerId: { type: 'integer' },
    },
  },
};
