import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './connection.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

export async function runMigrations(): Promise<void> {
  // Create migrations tracking table
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Get all SQL files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    // Check if already executed
    const { rows } = await query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
    if (rows.length > 0) {
      logger.debug('Migration already executed', { file });
      continue;
    }

    // Execute migration
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    try {
      await query(sql);
      await query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      logger.info('Migration executed', { file });
    } catch (err: any) {
      logger.error('Migration failed', { file, error: err.message });
      throw err;
    }
  }

  logger.info('All migrations completed');
}
