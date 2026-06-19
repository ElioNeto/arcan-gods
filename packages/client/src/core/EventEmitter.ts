/**
 * Lightweight browser-compatible EventEmitter.
 * Replaces Node.js 'events' module for client-side usage.
 */
type Handler = (...args: any[]) => void;

export class EventEmitter {
  private listeners: Map<string, Handler[]> = new Map();

  on(event: string, handler: Handler): this {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.push(handler);
    } else {
      this.listeners.set(event, [handler]);
    }
    return this;
  }

  off(event: string, handler: Handler): this {
    const handlers = this.listeners.get(event);
    if (!handlers) return this;

    const idx = handlers.indexOf(handler);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.length === 0) return false;

    for (const handler of handlers) {
      handler(...args);
    }
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}
