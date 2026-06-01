import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import config from './config/environment.js';
import { buildSwaggerSpec } from './docs/index.js';
import createRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/index.js';

const createApp = async ({ db, services, controllers }) => {
  const app = express();

  app.set('db', db);
  if (config.isProduction) app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: config.isProduction ? undefined : false }));
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const swaggerSpec = await buildSwaggerSpec();
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'StaffClock API Docs',
  }));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health probe — 200 when DB is reachable, 503 otherwise. Used by uptime monitors.
  app.get('/health', async (req, res) => {
    const startedAt = Date.now();
    const checks = { app: 'ok', database: 'unknown' };

    try {
      await db.sequelize.authenticate();
      checks.database = 'ok';
    } catch (err) {
      checks.database = 'error';
      checks.databaseError = err.message;
    }

    const healthy = checks.database === 'ok';
    const mem = process.memoryUsage();

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  app.use('/api', createRoutes(controllers));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
