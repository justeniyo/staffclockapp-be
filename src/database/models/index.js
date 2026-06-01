import { Sequelize } from 'sequelize';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import config from '../../config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      ? { max: 5, min: 0, acquire: 30000, idle: 5000, evict: 1000 }
      : { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true },
  }
);

const db = { sequelize, Sequelize };

// Auto-discovers every *.js in this directory (except index.js), initialises it,
// then wires up associate() once everything is loaded.
const initializeModels = async () => {
  const modelFiles = readdirSync(__dirname).filter(
    (file) => file !== 'index.js' && file.endsWith('.js')
  );

  for (const file of modelFiles) {
    const modelPath = pathToFileURL(join(__dirname, file)).href;
    const { default: model } = await import(modelPath);
    if (model && typeof model.initialize === 'function') {
      model.initialize(sequelize);
      db[model.name] = model;
    }
  }

  for (const modelName of Object.keys(db)) {
    if (typeof db[modelName].associate === 'function') {
      db[modelName].associate(db);
    }
  }

  return db;
};

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

const syncDatabase = async (options = {}) => {
  await sequelize.sync(options);
  console.log('✓ Database synchronized');
};

const closeConnection = async () => {
  await sequelize.close();
  console.log('✓ Database connection closed');
};

export { sequelize, Sequelize, initializeModels, testConnection, syncDatabase, closeConnection };
export default db;
