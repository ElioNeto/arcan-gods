import { EventEmitter } from './EventEmitter.js';
import type { ClientPacket, ServerPacket } from '@arcan-gods/shared';
import { NETWORK_CONFIG } from '@arcan-gods/shared';

export class NetworkManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: ClientPacket[] = [];
  private connected: boolean = false;

  constructor(url: string = 'ws://localhost:3001') {
    super();
    this.url = url;
  }

  connect(url?: string): void {
    if (url) this.url = url;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.emit('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Flush queued messages
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg) this.send(msg);
      }

      // Start heartbeat
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const packet: ServerPacket = JSON.parse(event.data as string);
        this.emit('message', packet);
        this.emit(packet.type, packet);
      } catch {
        this.emit('error', new Error('Failed to parse server message'));
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.stopHeartbeat();
      this.emit('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this.emit('error', new Error('WebSocket connection error'));
    };
  }

  send(packet: ClientPacket): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
    } else {
      this.messageQueue.push(packet);
    }
  }

  disconnect(): void {
    this.reconnectAttempts = NETWORK_CONFIG.MAX_RECONNECT_ATTEMPTS; // prevent reconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'HEARTBEAT', timestamp: Date.now() });
    }, NETWORK_CONFIG.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= NETWORK_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', { attempt: this.reconnectAttempts });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, NETWORK_CONFIG.RECONNECT_DELAY);
  }
}
