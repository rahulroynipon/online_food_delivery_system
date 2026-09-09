import { Sequelize } from 'sequelize';
import env from './env.js';

const sslOptions = env.NODE_ENV === 'production' || (env.DATABASE_URL && !env.DATABASE_URL.includes('localhost'))
  ? { require: true, rejectUnauthorized: false }
  : false;

const sequelize = env.DATABASE_URL
  ? new Sequelize(env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: sslOptions ? { ssl: sslOptions } : {},
      logging: env.NODE_ENV === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        underscored: true,
        timestamps: true,
      },
    })
  : new Sequelize(env.db.database, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      dialect: 'postgres',
      dialectOptions: sslOptions ? { ssl: sslOptions } : {},
      logging: env.NODE_ENV === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        underscored: true,
        timestamps: true,
      },
    });

export default sequelize;
