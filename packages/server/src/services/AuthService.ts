import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AccountModel } from '../db/models/Account.js';
import { logger } from '../utils/logger.js';

const BCRYPT_ROUNDS = 12;

export interface AuthResult {
  success: boolean;
  token?: string;
  account?: { id: string; email: string; username: string };
  error?: string;
}

export const AuthService = {
  async register(email: string, username: string, password: string): Promise<AuthResult> {
    // Validate input
    if (!email || !username || !password) {
      return { success: false, error: 'Email, username and password are required' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    if (username.length < 3 || username.length > 20) {
      return { success: false, error: 'Username must be 3-20 characters' };
    }

    // Check duplicates
    const emailExists = await AccountModel.emailExists(email);
    if (emailExists) return { success: false, error: 'Email already registered' };

    const userExists = await AccountModel.usernameExists(username);
    if (userExists) return { success: false, error: 'Username already taken' };

    // Create account
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const account = await AccountModel.create(email, username, passwordHash);

    // Generate JWT
    const token = generateToken(account.id, account.email);

    logger.info('Account registered', { accountId: account.id, email });
    return {
      success: true,
      token,
      account: { id: account.id, email: account.email, username: account.username },
    };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const account = await AccountModel.findByEmail(email);
    if (!account) {
      return { success: false, error: 'Invalid email or password' };
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      return { success: false, error: 'Invalid email or password' };
    }

    const token = generateToken(account.id, account.email);
    logger.info('Account logged in', { accountId: account.id, email });

    return {
      success: true,
      token,
      account: { id: account.id, email: account.email, username: account.username },
    };
  },

  validateToken(token: string): { id: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
      return decoded;
    } catch {
      return null;
    }
  },
};

function generateToken(id: string, email: string): string {
  return jwt.sign({ id, email }, config.jwtSecret, { expiresIn: '24h' });
}
