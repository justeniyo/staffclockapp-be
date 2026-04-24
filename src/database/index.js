/**
 * Database module - centralizes all database exports
 */
import db, {
  sequelize,
  Sequelize,
  initializeModels,
  testConnection,
  syncDatabase,
  closeConnection,
} from './models/index.js';

export {
  db as default,
  sequelize,
  Sequelize,
  initializeModels,
  testConnection,
  syncDatabase,
  closeConnection,
};
