import { WebSocket } from 'ws';
import type { SocketData } from '../server.js';
import type { ClientPacket, ServerPacket } from '@arcan-gods/shared';
import { MoveSchema, ChatSchema } from '@arcan-gods/shared';
import { SERVER_CONSTANTS } from '../../config/constants.js';
import { World } from '../../game/World.js';
import { handleAuth } from './auth.js';

export function handleConnection(ws: WebSocket, socketData: SocketData, world: World): void {
  // Store socket data reference
  (ws as any).__socketData = socketData;

  // Send initial CONNECTED packet
  const connectedPacket: ServerPacket = {
    type: 'CONNECTED',
    message: 'Welcome to Arcan Gods',
  };
  sendMessage(ws, connectedPacket);

  ws.on('message', (data: Buffer) => {
    // Rate limiting
    const now = Date.now();
    if (now - socketData.rateLimitStart > 1000) {
      socketData.messageCount = 0;
      socketData.rateLimitStart = now;
    }
    socketData.messageCount++;

    if (socketData.messageCount > SERVER_CONSTANTS.MAX_MESSAGES_PER_SECOND) {
      const errorPacket: ServerPacket = {
        type: 'ERROR',
        message: 'Rate limited. Slow down.',
        code: 'RATE_LIMIT',
      };
      sendMessage(ws, errorPacket);
      return;
    }

    let packet: ClientPacket;
    try {
      const text = data.toString('utf-8');
      packet = JSON.parse(text);
    } catch {
      const errorPacket: ServerPacket = {
        type: 'ERROR',
        message: 'Invalid JSON',
        code: 'INVALID_JSON',
      };
      sendMessage(ws, errorPacket);
      return;
    }

    if (!packet.type) {
      const errorPacket: ServerPacket = {
        type: 'ERROR',
        message: 'Missing packet type',
        code: 'MISSING_TYPE',
      };
      sendMessage(ws, errorPacket);
      return;
    }

    // Route packet to appropriate handler
    routePacket(ws, socketData, packet, world);
  });
}

function routePacket(ws: WebSocket, socketData: SocketData, packet: ClientPacket, world: World): void {
  switch (packet.type) {
    case 'AUTH_LOGIN':
    case 'AUTH_REGISTER':
      handleAuth(ws, socketData, packet, world);
      break;

    case 'PLAYER_MOVE':
      handlePlayerMove(ws, socketData, packet, world);
      break;

    case 'PLAYER_ATTACK':
      handlePlayerAttack(ws, socketData, packet, world);
      break;

    case 'PLAYER_CHAT':
      handlePlayerChat(ws, socketData, packet, world);
      break;

    case 'HEARTBEAT':
      handleHeartbeat(ws, socketData, packet);
      break;

    case 'LOGOUT':
      handleLogout(ws, socketData, world);
      break;

    default:
      sendMessage(ws, { type: 'ERROR', message: `Unknown packet type`, code: 'UNKNOWN_TYPE' });
  }
}

const MAX_MOVE_DISTANCE = 5; // tiles per move packet

function handlePlayerMove(ws: WebSocket, socketData: SocketData, packet: ClientPacket & { type: 'PLAYER_MOVE' }, world: World): void {
  const player = world.getPlayerBySocket(socketData.id);
  if (!player) {
    sendMessage(ws, { type: 'ERROR', message: 'Not authenticated', code: 'NOT_AUTH' });
    return;
  }

  // Validate coordinates with Zod schema
  const parsed = MoveSchema.safeParse({ x: packet.x, y: packet.y });
  if (!parsed.success) {
    sendMessage(ws, {
      type: 'ERROR',
      message: 'Invalid coordinates: ' + parsed.error.errors.map(e => e.message).join(', '),
      code: 'MOVE_INVALID',
    });
    return;
  }

  // Anti-teleport validation: client can't move more than MAX_MOVE_DISTANCE per packet
  const dx = Math.abs(packet.x - player.x);
  const dy = Math.abs(packet.y - player.y);
  if (dx > MAX_MOVE_DISTANCE || dy > MAX_MOVE_DISTANCE) {
    sendMessage(ws, {
      type: 'ERROR',
      message: 'Movement rejected: distance too large (possible speedhack)',
      code: 'MOVE_TOO_FAR',
    });
    // Send current position to correct client
    const correctionPacket: ServerPacket = {
      type: 'PLAYER_MOVED',
      id: player.id,
      x: player.x,
      y: player.y,
      direction: player.direction,
    };
    sendMessage(ws, correctionPacket);
    return;
  }

  // Validate coordinates are within map bounds (0-255 for now)
  if (packet.x < 0 || packet.x > 255 || packet.y < 0 || packet.y > 255) {
    sendMessage(ws, {
      type: 'ERROR',
      message: 'Movement rejected: out of bounds',
      code: 'MOVE_OUT_OF_BOUNDS',
    });
    return;
  }

  player.x = packet.x;
  player.y = packet.y;

  // TODO: Broadcast to other players in the same map
  // This will be implemented with proper socket tracking

  const movedPacket: ServerPacket = {
    type: 'PLAYER_MOVED',
    id: player.id,
    x: player.x,
    y: player.y,
    direction: player.direction,
  };
  sendMessage(ws, movedPacket);
}

function handlePlayerAttack(ws: WebSocket, _socketData: SocketData, _packet: ClientPacket & { type: 'PLAYER_ATTACK' }, _world: World): void {
  sendMessage(ws, {
    type: 'ERROR',
    message: 'Combat not yet implemented',
    code: 'NOT_IMPLEMENTED',
  });
}

function handlePlayerChat(ws: WebSocket, socketData: SocketData, packet: ClientPacket & { type: 'PLAYER_CHAT' }, world: World): void {
  const player = world.getPlayerBySocket(socketData.id);
  if (!player) {
    sendMessage(ws, { type: 'ERROR', message: 'Not authenticated', code: 'NOT_AUTH' });
    return;
  }

  // Validate chat message with Zod schema
  const parsed = ChatSchema.safeParse({ message: packet.message, channel: packet.channel });
  if (!parsed.success) {
    sendMessage(ws, {
      type: 'ERROR',
      message: 'Invalid chat data: ' + parsed.error.errors.map(e => e.message).join(', '),
      code: 'CHAT_INVALID',
    });
    return;
  }

  const chatPacket: ServerPacket = {
    type: 'CHAT_MESSAGE',
    id: player.id,
    name: player.name,
    message: packet.message,
    channel: packet.channel,
  };

  // For now, just send back to sender
  // TODO: Broadcast to all players in the same map/party/guild
  sendMessage(ws, chatPacket);
}

function handleHeartbeat(ws: WebSocket, _socketData: SocketData, _packet: ClientPacket & { type: 'HEARTBEAT' }): void {
  const ack: ServerPacket = {
    type: 'HEARTBEAT_ACK',
    timestamp: Date.now(),
  };
  sendMessage(ws, ack);
}

function handleLogout(ws: WebSocket, socketData: SocketData, world: World): void {
  world.setPlayerOffline(socketData.id);
  ws.close(1000, 'Player logged out');
}

function sendMessage(ws: WebSocket, packet: ServerPacket): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(packet));
  }
}
