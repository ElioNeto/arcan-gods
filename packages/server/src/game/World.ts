import { Player } from './entities/Player.js';
import { Monster } from './entities/Monster.js';
import type { ServerPacket } from '@arcan-gods/shared';
import type { MovementSystem } from './systems/MovementSystem.js';

export class World {
  private players: Map<string, Player> = new Map();
  private monsters: Map<string, Monster> = new Map();
  private playerSocketMap: Map<string, string> = new Map(); // socketId -> playerId
  private movementSystem: MovementSystem | null = null;

  // --- Player Management ---

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    if (player.socketId) {
      this.playerSocketMap.set(player.socketId, player.id);
    }
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player?.socketId) {
      this.playerSocketMap.delete(player.socketId);
    }
    this.players.delete(playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  getPlayerBySocket(socketId: string): Player | undefined {
    const playerId = this.playerSocketMap.get(socketId);
    if (!playerId) return undefined;
    return this.players.get(playerId);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayersInMap(mapId: string): Player[] {
    return this.getAllPlayers().filter((p) => p.mapId === mapId);
  }

  // --- Monster Management ---

  addMonster(monster: Monster): void {
    this.monsters.set(monster.id, monster);
  }

  removeMonster(monsterId: string): void {
    this.monsters.delete(monsterId);
  }

  getMonster(monsterId: string): Monster | undefined {
    return this.monsters.get(monsterId);
  }

  getAllMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }

  getMonstersInMap(mapId: string): Monster[] {
    return this.getAllMonsters().filter((m) => m.mapId === mapId && m.isAlive());
  }

  // --- Query ---

  getEntityById(id: string): Player | Monster | undefined {
    return this.players.get(id) || this.monsters.get(id);
  }

  // --- State ---

  /** Returns a WORLD_STATE ServerPacket for the given map */
  getWorldStatePacket(mapId: string): ServerPacket {
    const players = this.getPlayersInMap(mapId).map((p) => p.toJSON());
    const monsters = this.getMonstersInMap(mapId).map((m) => m.toJSON());
    return {
      type: 'WORLD_STATE',
      mapId,
      entities: [...players, ...monsters],
    };
  }

  // --- Movement System ---

  setMovementSystem(ms: MovementSystem): void {
    this.movementSystem = ms;
  }

  getMovementSystem(): MovementSystem | null {
    return this.movementSystem;
  }

  // --- Cleanup ---

  setPlayerOffline(socketId: string): void {
    const player = this.getPlayerBySocket(socketId);
    if (player) {
      player.online = false;
      player.socketId = null;
    }
  }
}
