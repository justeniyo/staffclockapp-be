import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dynamically loads all schema files from the schemas directory
 * @returns {Promise<Object>} Combined schemas object
 */
const loadSchemas = async () => {
  const schemasDir = join(__dirname, 'schemas');
  const schemaFiles = readdirSync(schemasDir).filter(
    (file) => file.endsWith('.schema.js')
  );

  const schemas = {};

  for (const file of schemaFiles) {
    const schemaPath = pathToFileURL(join(schemasDir, file)).href;
    const schemaModule = await import(schemaPath);
    Object.assign(schemas, schemaModule.default);
  }

  return schemas;
};

/**
 * Dynamically loads all path files from the paths directory
 * @returns {Promise<Object>} Combined paths object
 */
const loadPaths = async () => {
  const pathsDir = join(__dirname, 'paths');
  const pathFiles = readdirSync(pathsDir).filter(
    (file) => file.endsWith('.path.js')
  );

  const paths = {};

  for (const file of pathFiles) {
    const pathFilePath = pathToFileURL(join(pathsDir, file)).href;
    const pathModule = await import(pathFilePath);
    Object.assign(paths, pathModule.default);
  }

  return paths;
};

/**
 * Builds the complete OpenAPI specification
 * @returns {Promise<Object>} OpenAPI specification
 */
const buildSwaggerSpec = async () => {
  const schemas = await loadSchemas();
  const paths = await loadPaths();

  return {
    openapi: '3.0.0',
    info: {
      title: 'StaffClock API',
      version: '1.0.0',
      description: 'Employee Management System API with role-based access control',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas,
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'No token provided',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  {
                    field: 'email',
                    message: 'Invalid email format',
                  },
                ],
              },
            },
          },
        },
      },
    },
  };
};

export { loadSchemas, loadPaths, buildSwaggerSpec };
