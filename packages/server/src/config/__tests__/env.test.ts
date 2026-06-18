import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Server Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('should use default values when env vars are not set', async () => {
    delete process.env.SERVER_PORT;
    delete process.env.WS_PORT;
    delete process.env.JWT_SECRET;

    const { config } = await import('../env.js');
    expect(config.serverPort).toBe(3001);
    expect(config.wsPort).toBe(3001);
    expect(config.jwtSecret).toBe('change-me-in-production');
  });

  it('should use env var values when set', async () => {
    process.env.SERVER_PORT = '4000';
    process.env.WS_PORT = '4001';
    process.env.JWT_SECRET = 'my-secret';
    process.env.NODE_ENV = 'production';

    const { config } = await import('../env.js');
    expect(config.serverPort).toBe(4000);
    expect(config.wsPort).toBe(4001);
    expect(config.jwtSecret).toBe('my-secret');
    expect(config.nodeEnv).toBe('production');
  });

  it('should fallback for invalid port', async () => {
    process.env.SERVER_PORT = 'invalid';
    const { config } = await import('../env.js');
    expect(config.serverPort).toBe(3001);
  });

  it('should reject out of range ports', async () => {
    process.env.SERVER_PORT = '99999';
    const { config } = await import('../env.js');
    expect(config.serverPort).toBe(3001);
  });
});
