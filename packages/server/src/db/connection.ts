import pg from 'pg';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

export async function query(text: string, params?: any[]): Promise<pg.QueryResult<any>> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('DB query', { text: text.slice(0, 80), duration, rows: result.rowCount });
  return result;
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('DB pool closed');
}

export { pool };
