import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuid } from 'uuid';
import { config } from '../config/env.js';
import { SERVER_CONSTANTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { World } from '../game/World.js';
import { handleConnection } from './handlers/connection.js';

export interface SocketData {
  id: string;
  isAlive: boolean;
  lastPong: number;
  messageCount: number;
  rateLimitStart: number;
}

export class Server {
  public httpServer: http.Server;
  public wss: WebSocketServer;
  public world: World;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(world: World) {
    this.world = world;
    this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
    this.wss = new WebSocketServer({ server: this.httpServer, maxPayload: SERVER_CONSTANTS.MAX_MESSAGE_SIZE });
    this.setupWebSocket();
    this.startHeartbeat();
  }

  private handleHttpRequest(_req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(426, { 'Content-Type': 'text/plain' });
    res.end('Upgrade Required');
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      const socketId = uuid();
      const socketData: SocketData = {
        id: socketId,
        isAlive: true,
        lastPong: Date.now(),
        messageCount: 0,
        rateLimitStart: Date.now(),
      };

      logger.info('WebSocket client connected', { socketId, ip: req.socket.remoteAddress });

      handleConnection(ws, socketData, this.world);

      ws.on('close', (code: number, reason: Buffer) => {
        logger.info('WebSocket client disconnected', { socketId, code, reason: reason.toString() });
        this.world.setPlayerOffline(socketId);
      });

      ws.on('error', (error: Error) => {
        logger.error('WebSocket client error', { socketId, error: error.message });
      });

      ws.on('pong', () => {
        socketData.lastPong = Date.now();
        socketData.isAlive = true;
      });
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const socketData = (ws as any).__socketData as SocketData | undefined;
        if (socketData && Date.now() - socketData.lastPong > SERVER_CONSTANTS.HEARTBEAT_TIMEOUT) {
          logger.debug('Heartbeat timeout, terminating connection', { socketId: socketData.id });
          ws.terminate();
          return;
        }
        ws.ping();
      });
    }, SERVER_CONSTANTS.HEARTBEAT_INTERVAL);
  }

  start(): void {
    this.httpServer.listen(config.serverPort, () => {
      logger.info('Server listening', { port: config.serverPort, env: config.nodeEnv });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close all WebSocket connections
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });

      this.wss.close(() => {
        this.httpServer.close(() => {
          logger.info('Server stopped');
          resolve();
        });
      });
    });
  }
}
