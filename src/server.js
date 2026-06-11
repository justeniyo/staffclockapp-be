import config from './config/environment.js';
import { initializeModels, testConnection, closeConnection } from './database/index.js';
import { createServices } from './services/index.js';
import { createControllers } from './controllers/index.js';
import createApp from './app.js';

let server;

const startServer = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    const db = await initializeModels();
    const services = createServices(db);
    const controllers = createControllers(services);
    const app = await createApp({ db, services, controllers });

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

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') console.error(`Port ${config.port} is already in use`);
      else console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try { await closeConnection(); process.exit(0); }
      catch (error) { console.error('Error during shutdown:', error); process.exit(1); }
    });
    setTimeout(() => { console.error('Could not close in time, forcing shutdown'); process.exit(1); }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); gracefulShutdown('uncaughtException'); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); gracefulShutdown('unhandledRejection'); });

startServer();
