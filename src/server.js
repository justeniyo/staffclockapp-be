import config from './config/environment.js';
import { initializeModels, testConnection, closeConnection } from './database/index.js';
import { createServices } from './services/index.js';
import { createControllers } from './controllers/index.js';
import createApp from './app.js';

let server;

/**
 * Bootstraps and starts the server
 */
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Initialize models and associations
    const db = await initializeModels();

    // Create service instances with db dependency
    const services = createServices(db);

    // Create controller instances with service dependencies
    const controllers = createControllers(services);

    // Create Express app with all dependencies
    const app = await createApp({ db, services, controllers });

    // Start server
    server = app.listen(config.port, config.host, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║           StaffClock Backend API Server               ║
╠═══════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(39)}║
║  Host: ${config.host.padEnd(46)}║
║  Port: ${String(config.port).padEnd(46)}║
║  API:  http://${config.host}:${config.port}/api${' '.repeat(27)}║
║  Docs: http://${config.host}:${config.port}/api/docs${' '.repeat(22)}║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('HTTP server closed');

      try {
        await closeConnection();
        console.log('Database connection closed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

startServer();
