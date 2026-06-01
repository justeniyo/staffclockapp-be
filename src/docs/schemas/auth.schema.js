export default {
  SignupRequest: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName'],
    properties: {
      email: { type: 'string', format: 'email', example: 'newuser@example.com' },
      password: { type: 'string', minLength: 8, example: 'Password123', description: 'Min 8 chars, uppercase, lowercase, number' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'admin@staffclock.com' },
      password: { type: 'string', example: 'Password123' },
    },
  },

  LoginResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Login successful' },
      data: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },

  EmailRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'user@example.com' },
    },
  },

  ResetPasswordRequest: {
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token: { type: 'string', example: 'a1b2c3d4e5f6...' },
      password: { type: 'string', minLength: 8, example: 'NewPassword123' },
    },
  },

  ChangePassword: {
    type: 'object',
    required: ['currentPassword', 'newPassword', 'confirmPassword'],
    properties: {
      currentPassword: { type: 'string', example: 'OldPassword123' },
      newPassword: { type: 'string', example: 'NewPassword123' },
      confirmPassword: { type: 'string', example: 'NewPassword123' },
    },
  },

  TokenVerification: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Token is valid' },
      data: {
        type: 'object',
        properties: {
          valid: { type: 'boolean', example: true },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
};
