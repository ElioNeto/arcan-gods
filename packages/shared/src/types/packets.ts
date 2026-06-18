import type { IEntity, IPlayer } from './entities.js';
import type { ChatChannel, Direction } from './enums.js';

export type ClientPacket =
  | { type: 'AUTH_LOGIN'; email: string; password: string }
  | { type: 'AUTH_REGISTER'; email: string; password: string; username: string }
  | { type: 'PLAYER_MOVE'; x: number; y: number }
  | { type: 'PLAYER_ATTACK'; targetId: string }
  | { type: 'PLAYER_CHAT'; message: string; channel: ChatChannel }
  | { type: 'HEARTBEAT'; timestamp: number }
  | { type: 'LOGOUT' };

export type ServerPacket =
  | { type: 'AUTH_SUCCESS'; token: string; player: IPlayer }
  | { type: 'AUTH_ERROR'; message: string }
  | { type: 'WORLD_STATE'; entities: IEntity[]; mapId: string }
  | { type: 'ENTITY_UPDATE'; entity: IEntity }
  | { type: 'ENTITY_REMOVE'; id: string }
  | { type: 'PLAYER_MOVED'; id: string; x: number; y: number; direction: Direction }
  | { type: 'CHAT_MESSAGE'; id: string; name: string; message: string; channel: ChatChannel }
  | { type: 'ERROR'; message: string; code: string }
  | { type: 'HEARTBEAT_ACK'; timestamp: number }
  | { type: 'CONNECTED'; message: string };
