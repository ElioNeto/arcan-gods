import { query } from '../connection.js';

export interface AccountRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export const AccountModel = {
  async create(email: string, username: string, passwordHash: string): Promise<AccountRow> {
    const { rows } = await query(
      `INSERT INTO accounts (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *`,
      [email, username, passwordHash]
    );
    return rows[0] as AccountRow;
  },

  async findByEmail(email: string): Promise<AccountRow | null> {
    const { rows } = await query(
      `SELECT * FROM accounts WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return (rows[0] as AccountRow) || null;
  },

  async findById(id: string): Promise<AccountRow | null> {
    const { rows } = await query(
      `SELECT * FROM accounts WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (rows[0] as AccountRow) || null;
  },

  async emailExists(email: string): Promise<boolean> {
    const { rows } = await query('SELECT 1 FROM accounts WHERE email = $1', [email]);
    return rows.length > 0;
  },

  async usernameExists(username: string): Promise<boolean> {
    const { rows } = await query('SELECT 1 FROM accounts WHERE username = $1', [username]);
    return rows.length > 0;
  },

  async softDelete(id: string): Promise<void> {
    await query('UPDATE accounts SET deleted_at = NOW() WHERE id = $1', [id]);
  },
};
