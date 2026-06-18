import bcrypt from 'bcryptjs';
import { AccountModel } from '../models/Account.js';
import { logger } from '../../utils/logger.js';

export async function seed(): Promise<void> {
  // Create admin account if not exists
  const admin = await AccountModel.findByEmail('admin@arcan.com');
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 12);
    await AccountModel.create('admin@arcan.com', 'Admin', hash);
    logger.info('Seed: admin account created (admin@arcan.com / admin123)');
  }

  // Create test player account
  const test = await AccountModel.findByEmail('test@arcan.com');
  if (!test) {
    const hash = await bcrypt.hash('test123', 12);
    await AccountModel.create('test@arcan.com', 'TestPlayer', hash);
    logger.info('Seed: test account created (test@arcan.com / test123)');
  }
}
