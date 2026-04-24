import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import config from './config/environment.js';
import { buildSwaggerSpec } from './docs/index.js';
import createRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/index.js';

/**
 * Creates and configures Express application
 * @param {Object} options - App configuration options
 * @param {Object} options.db - Database models
 * @param {Object} options.services - Service instances
 * @param {Object} options.controllers - Controller instances
 * @returns {Promise<Express>} Configured Express app
 */
const createApp = async ({ db, services, controllers }) => {
  const app = express();

  // Store db instance for middleware access
  app.set('db', db);

  // Trust proxy for production (Heroku, etc.)
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false,
  }));

  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Build dynamic Swagger spec
  const swaggerSpec = await buildSwaggerSpec();

  // API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'StaffClock API Docs',
  }));

  // Swagger JSON endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api', createRoutes(controllers));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
