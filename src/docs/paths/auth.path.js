export default {
  '/auth/signup': {
    post: {
      summary: 'Register new account',
      description: 'Create a new user account. A verification email will be sent.',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SignupRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Registration successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Registration successful. Please check your email to verify your account.' },
                },
              },
            },
          },
        },
        409: { description: 'Email already registered' },
        400: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },

  '/auth/verify-email': {
    get: {
      summary: 'Verify email address',
      description: 'Verify user email with token sent via email',
      tags: ['Authentication'],
      parameters: [
        { in: 'query', name: 'token', required: true, schema: { type: 'string' }, description: 'Verification token' },
      ],
      responses: {
        200: {
          description: 'Email verified successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Email verified successfully. You can now log in.' },
                },
              },
            },
          },
        },
        400: { description: 'Invalid or expired token' },
      },
    },
  },

  '/auth/resend-verification': {
    post: {
      summary: 'Resend verification email',
      description: 'Resend the verification email to the user',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EmailRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Verification email sent (if account exists)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'If an account exists, a verification email has been sent.' },
                },
              },
            },
          },
        },
      },
    },
  },

  '/auth/forgot-password': {
    post: {
      summary: 'Request password reset',
      description: 'Send password reset email to user',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EmailRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Reset email sent (if account exists)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'If an account exists, a password reset email has been sent.' },
                },
              },
            },
          },
        },
      },
    },
  },

  '/auth/reset-password': {
    post: {
      summary: 'Reset password',
      description: 'Reset password using token from email',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Password reset successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Password reset successful. You can now log in.' },
                },
              },
            },
          },
        },
        400: { description: 'Invalid or expired token' },
      },
    },
  },

  '/auth/login': {
    post: {
      summary: 'Authenticate user',
      description: 'Login with email and password to receive JWT token',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginResponse' },
            },
          },
        },
        401: { description: 'Invalid credentials' },
        403: { description: 'Email not verified or account inactive' },
        400: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },

  '/auth/logout': {
    post: {
      summary: 'Logout user',
      description: 'Invalidate current session',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Logout successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Logout successful' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/auth/me': {
    get: {
      summary: 'Get current user profile',
      description: 'Retrieve the authenticated user\'s profile',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Profile retrieved',
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
      },
    },
  },

  '/auth/password': {
    put: {
      summary: 'Change password',
      description: 'Change the authenticated user\'s password',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ChangePassword' },
          },
        },
      },
      responses: {
        200: {
          description: 'Password changed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Password changed successfully' },
                },
              },
            },
          },
        },
        400: { description: 'Current password incorrect' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/auth/verify': {
    get: {
      summary: 'Verify token',
      description: 'Check if JWT token is valid',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Token is valid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TokenVerification' },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },
};
