import { Sequelize } from 'sequelize';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import config from '../../config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Sequelize instance configured for the current environment
 */
const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    dialectOptions: config.database.dialectOptions || {},
    pool: config.isProduction
      ? { max: 20, min: 5, acquire: 60000, idle: 10000 }
      : { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const db = {
  sequelize,
  Sequelize,
};

/**
 * Dynamically loads and initializes all models
 * @returns {Promise<Object>} Database object with all models
 */
const initializeModels = async () => {
  const modelFiles = readdirSync(__dirname).filter(
    (file) => file !== 'index.js' && file.endsWith('.js')
  );

  // Import and initialize each model
  for (const file of modelFiles) {
    const modelPath = pathToFileURL(join(__dirname, file)).href;
    const modelModule = await import(modelPath);
    const model = modelModule.default;

    if (model && typeof model.initialize === 'function') {
      model.initialize(sequelize);
      db[model.name] = model;
    }
  }

  // Run associations after all models are loaded
  for (const modelName of Object.keys(db)) {
    if (db[modelName].associate && typeof db[modelName].associate === 'function') {
      db[modelName].associate(db);
    }
  }

  return db;
};

/**
 * Tests database connection
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Syncs database models
 * @param {Object} options - Sequelize sync options
 * @returns {Promise<void>}
 */
const syncDatabase = async (options = {}) => {
  await sequelize.sync(options);
  console.log('✓ Database synchronized');
};

/**
 * Closes database connection
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
  await sequelize.close();
  console.log('✓ Database connection closed');
};

export {
  sequelize,
  Sequelize,
  initializeModels,
  testConnection,
  syncDatabase,
  closeConnection,
};

export default db;
