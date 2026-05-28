'use strict';

/**
 * Sequelize CLI config (CommonJS).
 * The project uses ESM ("type": "module") but sequelize-cli requires CJS.
 * This file reads DATABASE_URL from env and builds config objects directly.
 */

require('dotenv/config');

const parseUrl = (url) => {
  if (!url) return null;
  const parsed = new URL(url);
  return {
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 5432,
    ssl: parsed.searchParams.get('sslmode') !== 'disable',
  };
};

const createConfig = (url, options = {}) => {
  const conn = parseUrl(url);
  if (!conn) {
    if (options.optional) return { dialect: 'postgres' };
    throw new Error(`Invalid database URL for ${options.env || 'unknown'} environment`);
  }

  return {
    ...conn,
    dialect: 'postgres',
    logging: options.logging || false,
    define: { timestamps: true, underscored: true },
    ...(conn.ssl && {
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    }),
    ...(options.pool && { pool: options.pool }),
  };
};

module.exports = {
  development: createConfig(
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staffclock',
    { env: 'development' }
  ),
  test: createConfig(
    process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staffclock_test',
    { env: 'test' }
  ),
  production: createConfig(
    process.env.DATABASE_URL,
    { env: 'production', pool: { max: 5, min: 0, acquire: 30000, idle: 5000 }, optional: !process.env.DATABASE_URL }
  ),
};
