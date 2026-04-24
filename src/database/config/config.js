import 'dotenv/config';

const parseUrl = (url) => {
  if (!url) return null;
  const parsed = new URL(url);
  return {
    username: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 5432,
    ssl: parsed.searchParams.get('sslmode') !== 'disable',
  };
};

const createConfig = (url, options = {}) => {
  const conn = parseUrl(url);
  if (!conn) throw new Error(`Invalid database URL for ${options.env || 'unknown'} environment`);

  return {
    ...conn,
    dialect: 'postgres',
    logging: options.logging ?? false,
    define: { timestamps: true, underscored: true },
    ...(conn.ssl && {
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    }),
    ...(options.pool && { pool: options.pool }),
  };
};

const productionPool = { max: 20, min: 5, acquire: 60000, idle: 10000 };

export default {
  development: createConfig(
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staffclock',
    { env: 'development', logging: console.log }
  ),
  test: createConfig(
    process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staffclock_test',
    { env: 'test' }
  ),
  production: createConfig(
    process.env.DATABASE_URL,
    { env: 'production', pool: productionPool }
  ),
};
