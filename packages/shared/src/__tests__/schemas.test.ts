import { describe, it, expect } from 'vitest';
import { LoginSchema, RegisterSchema, MoveSchema } from '../validation/schemas.js';

describe('LoginSchema', () => {
  it('should accept valid login', () => {
    const result = LoginSchema.safeParse({ email: 'test@test.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'invalid', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = LoginSchema.safeParse({ email: 'test@test.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  it('should accept valid registration', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@test.com',
      password: '123456',
      username: 'player1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject short username', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@test.com',
      password: '123456',
      username: 'ab',
    });
    expect(result.success).toBe(false);
  });
});

describe('MoveSchema', () => {
  it('should accept valid coordinates', () => {
    const result = MoveSchema.safeParse({ x: 10, y: 20 });
    expect(result.success).toBe(true);
  });

  it('should reject negative coordinates', () => {
    const result = MoveSchema.safeParse({ x: -1, y: 0 });
    expect(result.success).toBe(false);
  });
});
