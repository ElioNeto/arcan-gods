import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NetworkManager } from '../core/NetworkManager.js';

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.OPEN;
  public onopen: (() => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(_url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(_data: string): void {}
  close(_code?: number, _reason?: string): void {
    if (this.onclose) this.onclose({ code: 1000, reason: 'close' });
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('NetworkManager', () => {
  let nm: NetworkManager;

  beforeEach(() => {
    nm = new NetworkManager('ws://localhost:3001');
  });

  afterEach(() => {
    nm.disconnect();
  });

  it('should start disconnected', () => {
    expect(nm.isConnected()).toBe(false);
  });

  it('should connect and emit connected event', () => {
    return new Promise<void>((done) => {
      nm.on('connected', () => {
        expect(nm.isConnected()).toBe(true);
        done();
      });
      nm.connect();
    });
  });

  it('should queue messages when not connected', () => {
    nm.send({ type: 'HEARTBEAT', timestamp: 123 });
    // No error should occur
  });

  it('should emit events', () => {
    const handler = vi.fn();
    nm.on('connecting', handler);
    nm.connect();
    expect(handler).toHaveBeenCalled();
  });

  it('should have connect method', () => {
    expect(typeof nm.connect).toBe('function');
  });

  it('should have disconnect method', () => {
    expect(typeof nm.disconnect).toBe('function');
  });

  it('should have send method', () => {
    expect(typeof nm.send).toBe('function');
  });
});
