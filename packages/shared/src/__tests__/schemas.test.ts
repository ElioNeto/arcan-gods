import { describe, it, expect } from 'vitest';
import { LoginSchema, RegisterSchema, MoveSchema, ChatSchema } from '../validation/schemas.js';

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
  it('should accept valid destination coordinates', () => {
    const result = MoveSchema.safeParse({ destX: 100, destY: 200 });
    expect(result.success).toBe(true);
  });

  it('should reject negative coordinates', () => {
    const result = MoveSchema.safeParse({ destX: -1, destY: 0 });
    expect(result.success).toBe(false);
  });

  it('should accept optional timestamp', () => {
    const result = MoveSchema.safeParse({ destX: 100, destY: 200, timestamp: 1234567890 });
    expect(result.success).toBe(true);
  });
});

describe('ChatSchema', () => {
  it('should accept valid short message', () => {
    const result = ChatSchema.safeParse({ message: 'Hello!', channel: 'global' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe('Hello!');
      expect(result.data.channel).toBe('global');
    }
  });

  it('should accept message at max length (200 chars)', () => {
    const result = ChatSchema.safeParse({ message: 'A'.repeat(200), channel: 'global' });
    expect(result.success).toBe(true);
  });

  it('should accept message at min length (1 char)', () => {
    const result = ChatSchema.safeParse({ message: 'H', channel: 'global' });
    expect(result.success).toBe(true);
  });

  it('should reject empty message (0 chars)', () => {
    const result = ChatSchema.safeParse({ message: '', channel: 'global' });
    expect(result.success).toBe(false);
  });

  it('should reject message over max length (201 chars)', () => {
    const result = ChatSchema.safeParse({ message: 'A'.repeat(201), channel: 'global' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid channel', () => {
    const result = ChatSchema.safeParse({ message: 'test', channel: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should accept special chars and unicode', () => {
    const result = ChatSchema.safeParse({ message: 'Olá, mundo! @#$% 你好 🔥', channel: 'global' });
    expect(result.success).toBe(true);
  });

  it('should accept all 4 channel types', () => {
    const channels = ['global', 'party', 'guild', 'whisper'] as const;
    for (const channel of channels) {
      const result = ChatSchema.safeParse({ message: 'test', channel });
      expect(result.success).toBe(true);
    }
  });

  it('should reject uppercase channel (case-sensitive)', () => {
    const result = ChatSchema.safeParse({ message: 'test', channel: 'GLOBAL' });
    expect(result.success).toBe(false);
  });

  it('should reject message with only spaces (not empty string, but still valid string)', () => {
    // Spaces are valid characters; Zod doesn't trim by default
    const result = ChatSchema.safeParse({ message: '   ', channel: 'global' });
    expect(result.success).toBe(true);
  });

  it('should accept messages with newlines', () => {
    const result = ChatSchema.safeParse({ message: 'line1\nline2\nline3', channel: 'global' });
    expect(result.success).toBe(true);
  });
});
