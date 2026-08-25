import pg from 'pg';
import env from '../config/env.js';

const { Client } = pg;

/**
 * Connects to the default 'postgres' database and verifies if the target database
 * exists. If it does not, it executes a CREATE DATABASE query to initialize it.
 */
export const ensureDatabaseExists = async () => {
  const client = new Client({
    user: env.db.user,
    password: env.db.password,
    host: env.db.host,
    port: env.db.port,
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();
    
    // Check if target database exists
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [env.db.database]
    );

    if (res.rowCount === 0) {
      console.log(`[Database] Target database "${env.db.database}" does not exist. Creating...`);
      // CREATE DATABASE cannot run with parameters, safe environment injection
      await client.query(`CREATE DATABASE "${env.db.database}"`);
      console.log(`[Database] Target database "${env.db.database}" created successfully.`);
    } else {
      console.log(`[Database] Target database "${env.db.database}" verified.`);
    }
  } catch (error) {
    console.warn(`[Database] Could not verify/create target database:`, error.message);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup error
    }
  }
};

export default ensureDatabaseExists;
