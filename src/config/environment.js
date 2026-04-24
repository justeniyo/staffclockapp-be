import 'dotenv/config';

const env = process.env.NODE_ENV || 'development';

const parseUrl = (url) => {
  if (!url) return null;
  const parsed = new URL(url);
  return {
    username: parsed.username,
    password: parsed.password,
    name: parsed.pathname.slice(1),
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 5432,
    ssl: parsed.searchParams.get('sslmode') !== 'disable',
  };
};

const getDbConfig = () => {
  const url = env === 'test'
    ? (process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staffclock_test')
    : (process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staffclock');

  const conn = parseUrl(url);
  return {
    ...conn,
    dialect: 'postgres',
    logging: env === 'development' ? console.log : false,
    dialectOptions: conn.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  };
};

const config = {
  env,
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  database: getDbConfig(),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@staffclock.com',
  },
  app: {
    name: process.env.APP_NAME || 'StaffClock',
    url: process.env.APP_URL || 'http://localhost:3000',
  },
  verification: {
    tokenExpiry: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY, 10) || 24, // hours
  },
  isProduction: env === 'production',
  isDevelopment: env === 'development',
  isTest: env === 'test',
};

if (config.isProduction) {
  const missing = ['JWT_SECRET', 'DATABASE_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required: ${missing.join(', ')}`);
}

export default config;
