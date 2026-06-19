import type { IEntity, IPlayer } from './entities.js';
import type { ChatChannel, Direction } from './enums.js';
import type { IMapData } from './tilemap.js';
import type { Waypoint } from './movement.js';
import type { MonsterAIState } from './ai.js';

export type ClientPacket =
  | { type: 'AUTH_LOGIN'; email: string; password: string }
  | { type: 'AUTH_REGISTER'; email: string; password: string; username: string }
  | { type: 'PLAYER_MOVE'; destX: number; destY: number; timestamp?: number }
  | { type: 'PLAYER_ATTACK'; targetId: string }
  | { type: 'PLAYER_CHAT'; message: string; channel: ChatChannel }
  | { type: 'HEARTBEAT'; timestamp: number }
  | { type: 'LOGOUT' }
  | { type: 'REQUEST_MAP_DATA' };

export type ServerPacket =
  | { type: 'AUTH_SUCCESS'; token: string; player: IPlayer }
  | { type: 'AUTH_ERROR'; message: string }
  | { type: 'WORLD_STATE'; entities: IEntity[]; mapId: string }
  | { type: 'MAP_DATA'; map: IMapData }
  | { type: 'ENTITY_UPDATE'; entity: IEntity }
  | { type: 'ENTITY_REMOVE'; id: string }
  | { type: 'PLAYER_MOVED'; id: string; x: number; y: number; direction: Direction; path?: Waypoint[] }
  | { type: 'PLAYER_PATH'; id: string; path: Waypoint[] }
  | { type: 'CHAT_MESSAGE'; id: string; name: string; message: string; channel: ChatChannel }
  | { type: 'ERROR'; message: string; code: string }
  | { type: 'HEARTBEAT_ACK'; timestamp: number }
  | { type: 'CONNECTED'; message: string }
  | { type: 'ENTITY_DAMAGED'; attackerId: string; targetId: string; damage: number; isCritical: boolean; isBlocked: boolean; targetHp: number; targetMaxHp: number; killed: boolean; expGain?: number; goldGain?: number }
  | { type: 'MONSTER_AI_STATE'; monsterId: string; state: MonsterAIState; targetId?: string };
