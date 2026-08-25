import { Sequelize } from 'sequelize';
import env from './env.js';

const sequelize = new Sequelize(env.db.database, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true, // Maps camelCase fields (e.g. ownerId) to snake_case column names (e.g. owner_id)
    timestamps: true, // Automatically manages created_at and updated_at columns
  },
});

export default sequelize;
