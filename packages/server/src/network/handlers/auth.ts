import { WebSocket } from 'ws';
import type { SocketData } from '../server.js';
import type { ClientPacket, ServerPacket } from '@arcan-gods/shared';
import { LoginSchema, RegisterSchema } from '@arcan-gods/shared';
import { logger } from '../../utils/logger.js';
import { World } from '../../game/World.js';
import { Player } from '../../game/entities/Player.js';
import { AuthService } from '../../services/AuthService.js';

export async function handleAuth(
  ws: WebSocket,
  socketData: SocketData,
  packet: ClientPacket & { type: 'AUTH_LOGIN' | 'AUTH_REGISTER' },
  world: World
): Promise<void> {
  if (packet.type === 'AUTH_LOGIN') {
    await handleLogin(ws, socketData, packet, world);
  } else {
    await handleRegister(ws, socketData, packet, world);
  }
}

async function handleLogin(
  ws: WebSocket,
  socketData: SocketData,
  packet: ClientPacket & { type: 'AUTH_LOGIN' },
  world: World
): Promise<void> {
  const parsed = LoginSchema.safeParse({ email: packet.email, password: packet.password });
  if (!parsed.success) {
    sendError(ws, 'Invalid login data: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  // Try real auth, fallback to dev mode if DB unavailable
  let result;
  try {
    result = await AuthService.login(packet.email, packet.password);
  } catch (err: any) {
    logger.warn('Auth DB unavailable, using dev mode', { error: err.message });
    // Dev mode fallback
    const player = new Player(packet.email.split('@')[0] || 'Player', 'dark_knight');
    player.socketId = socketData.id;
    world.addPlayer(player);
    sendSuccess(ws, 'dev-token-' + player.id, player, world);
    return;
  }

  if (!result.success) {
    sendError(ws, result.error || 'Login failed');
    return;
  }

  // Create player entity for authenticated user
  const player = new Player(result.account!.username, 'dark_knight');
  player.socketId = socketData.id;
  world.addPlayer(player);

  sendSuccess(ws, result.token!, player, world);
  logger.info('Player logged in', { playerId: player.id, name: player.name });
}

async function handleRegister(
  ws: WebSocket,
  socketData: SocketData,
  packet: ClientPacket & { type: 'AUTH_REGISTER' },
  world: World
): Promise<void> {
  const parsed = RegisterSchema.safeParse({
    email: packet.email,
    password: packet.password,
    username: packet.username,
  });
  if (!parsed.success) {
    sendError(ws, 'Invalid registration data: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  // Try real register, fallback to dev mode
  let result;
  try {
    result = await AuthService.register(packet.email, packet.username, packet.password);
  } catch (err: any) {
    logger.warn('Auth DB unavailable, using dev mode', { error: err.message });
    const player = new Player(packet.username, 'dark_knight');
    player.socketId = socketData.id;
    world.addPlayer(player);
    sendSuccess(ws, 'dev-token-' + player.id, player);
    return;
  }

  if (!result.success) {
    sendError(ws, result.error || 'Registration failed');
    return;
  }

  const player = new Player(result.account!.username, 'dark_knight');
  player.socketId = socketData.id;
  world.addPlayer(player);

  sendSuccess(ws, result.token!, player);
  logger.info('Player registered', { playerId: player.id, name: player.name });
}

function sendSuccess(ws: WebSocket, token: string, player: Player, world?: World): void {
  const successPacket: ServerPacket = {
    type: 'AUTH_SUCCESS',
    token,
    player: player.toJSON(),
  };
  sendMessage(ws, successPacket);

  if (world) {
    const worldStatePacket = world.getWorldStatePacket(player.mapId);
    sendMessage(ws, worldStatePacket);
  }
}

function sendMessage(ws: WebSocket, packet: ServerPacket): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(packet));
  }
}

function sendError(ws: WebSocket, message: string): void {
  sendMessage(ws, { type: 'AUTH_ERROR', message });
}
