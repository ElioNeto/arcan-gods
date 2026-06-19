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

const MAX_MOVE_DISTANCE = 5; // tiles per move packet (for initial validation)

function handlePlayerMove(ws: WebSocket, socketData: SocketData, packet: ClientPacket & { type: 'PLAYER_MOVE' }, world: World): void {
  const player = world.getPlayerBySocket(socketData.id);
  if (!player) {
    sendMessage(ws, { type: 'ERROR', message: 'Not authenticated', code: 'NOT_AUTH' });
    return;
  }

  // Validate destination with Zod schema
  const parsed = MoveSchema.safeParse({ destX: packet.destX, destY: packet.destY });
  if (!parsed.success) {
    sendMessage(ws, {
      type: 'ERROR',
      message: 'Invalid destination: ' + parsed.error.errors.map(e => e.message).join(', '),
      code: 'MOVE_INVALID',
    });
    return;
  }

  // Delegate to MovementSystem if available, otherwise do basic teleport
  if (world.getMovementSystem()) {
    const result = world.getMovementSystem()!.startPlayerMove(player.id, packet.destX, packet.destY);
    if (!result.success) {
      sendMessage(ws, {
        type: 'ERROR',
        message: result.error || 'Cannot move to destination',
        code: 'MOVE_FAILED',
      });
      return;
    }
    if (result.path && result.path.length > 0) {
      const pathPacket: ServerPacket = {
        type: 'PLAYER_PATH',
        id: player.id,
        path: result.path,
      };
      sendMessage(ws, pathPacket);
    }
    return;
  }

  // Fallback: basic teleport with validation (legacy)
  const dx = Math.abs(packet.destX - player.x);
  const dy = Math.abs(packet.destY - player.y);
  if (dx > MAX_MOVE_DISTANCE || dy > MAX_MOVE_DISTANCE) {
    sendMessage(ws, {
      type: 'ERROR',
      message: 'Movement rejected: distance too large (possible speedhack)',
      code: 'MOVE_TOO_FAR',
    });
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

  player.x = packet.destX;
  player.y = packet.destY;

  const movedPacket: ServerPacket = {
    type: 'PLAYER_MOVED',
    id: player.id,
    x: player.x,
    y: player.y,
    direction: player.direction,
  };
  sendMessage(ws, movedPacket);
}

function handlePlayerAttack(ws: WebSocket, socketData: SocketData, packet: ClientPacket & { type: 'PLAYER_ATTACK' }, world: World): void {
  const player = world.getPlayerBySocket(socketData.id);
  if (!player) {
    sendMessage(ws, { type: 'ERROR', message: 'Not authenticated', code: 'NOT_AUTH' });
    return;
  }

  const combatSystem = world.getCombatSystem();
  if (!combatSystem) {
    sendMessage(ws, { type: 'ERROR', message: 'Combat system unavailable', code: 'COMBAT_UNAVAILABLE' });
    return;
  }

  const result = combatSystem.processAttack(player.id, packet.targetId);

  if (!result.success) {
    sendMessage(ws, { type: 'ERROR', message: result.error || 'Attack failed', code: 'ATTACK_FAILED' });
    return;
  }

  // Build ENTITY_DAMAGED packet
  const damagePacket: ServerPacket = {
    type: 'ENTITY_DAMAGED',
    attackerId: player.id,
    targetId: result.targetId!,
    damage: result.damage!,
    isCritical: result.isCritical!,
    isBlocked: result.isBlocked!,
    targetHp: result.targetHp!,
    targetMaxHp: result.targetMaxHp!,
    killed: result.killed!,
    expGain: result.expGain,
    goldGain: result.goldGain,
  };

  // Send to attacker
  sendMessage(ws, damagePacket);

  // Broadcast to all players in the map (#63 fix)
  world.broadcastToMap(player.mapId, damagePacket);
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
