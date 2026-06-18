import { WebSocket } from 'ws';
import type { SocketData } from '../server.js';
import type { ClientPacket, ServerPacket } from '@arcan-gods/shared';
import { LoginSchema, RegisterSchema } from '@arcan-gods/shared';
import { logger } from '../../utils/logger.js';
import { World } from '../../game/World.js';
import { Player } from '../../game/entities/Player.js';

export function handleAuth(
  ws: WebSocket,
  socketData: SocketData,
  packet: ClientPacket & { type: 'AUTH_LOGIN' | 'AUTH_REGISTER' },
  world: World
): void {
  if (packet.type === 'AUTH_LOGIN') {
    handleLogin(ws, socketData, packet, world);
  } else {
    handleRegister(ws, socketData, packet, world);
  }
}

function handleLogin(
  ws: WebSocket,
  socketData: SocketData,
  packet: ClientPacket & { type: 'AUTH_LOGIN' },
  world: World
): void {
  const parsed = LoginSchema.safeParse({ email: packet.email, password: packet.password });
  if (!parsed.success) {
    sendError(ws, 'Invalid login data: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  // For now, accept any valid-format login with a test player
  // TODO: Integrate with PostgreSQL in P1.1
  const player = new Player(packet.email.split('@')[0] || 'Player', 'dark_knight');
  player.socketId = socketData.id;
  world.addPlayer(player);

  const successPacket: ServerPacket = {
    type: 'AUTH_SUCCESS',
    token: 'test-token-' + player.id,
    player: player.toJSON(),
  };
  sendMessage(ws, successPacket);

  // Send world state after successful auth
  const worldStatePacket = world.getWorldStatePacket(player.mapId);
  sendMessage(ws, worldStatePacket);

  logger.info('Player logged in', { playerId: player.id, name: player.name });
}

function handleRegister(
  ws: WebSocket,
  socketData: SocketData,
  packet: ClientPacket & { type: 'AUTH_REGISTER' },
  world: World
): void {
  const parsed = RegisterSchema.safeParse({
    email: packet.email,
    password: packet.password,
    username: packet.username,
  });
  if (!parsed.success) {
    sendError(ws, 'Invalid registration data: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  // For now, auto-login on register
  // TODO: Store in PostgreSQL in P1.1
  const player = new Player(packet.username, 'dark_knight');
  player.socketId = socketData.id;
  world.addPlayer(player);

  const successPacket: ServerPacket = {
    type: 'AUTH_SUCCESS',
    token: 'test-token-' + player.id,
    player: player.toJSON(),
  };
  sendMessage(ws, successPacket);

  // Send world state after successful registration
  const worldStatePacket = world.getWorldStatePacket(player.mapId);
  sendMessage(ws, worldStatePacket);

  logger.info('Player registered', { playerId: player.id, name: player.name });
}

function sendMessage(ws: WebSocket, packet: ServerPacket): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(packet));
  }
}

function sendError(ws: WebSocket, message: string): void {
  sendMessage(ws, { type: 'AUTH_ERROR', message });
}
