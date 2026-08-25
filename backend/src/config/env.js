import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const env = {
  PORT: process.env.PORT || 5005,
  NODE_ENV: process.env.NODE_ENV || 'development',
  db: {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'food_delivery_db',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretjwtsecretkeychangeinproduction',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

// Check for missing secret in production
if (
  env.NODE_ENV === 'production' &&
  env.jwt.secret === 'supersecretjwtsecretkeychangeinproduction'
) {
  console.warn('WARNING: JWT_SECRET is using default value in production. Please set it in .env.');
}

export default env;
