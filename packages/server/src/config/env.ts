import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export interface ServerConfig {
  serverPort: number;
  wsPort: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  tickRate: number;
  nodeEnv: string;
}

function parsePort(val: string | undefined, defaultVal: number): number {
  const num = Number(val);
  if (isNaN(num) || num < 1 || num > 65535) {
    return defaultVal;
  }
  return num;
}

export const config: ServerConfig = {
  serverPort: parsePort(process.env.SERVER_PORT, 3001),
  wsPort: parsePort(process.env.WS_PORT, 3001),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://arcan:arcan@localhost:5432/arcan_gods',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  tickRate: parsePort(process.env.TICK_RATE, 100),
  nodeEnv: process.env.NODE_ENV || 'development',
};
