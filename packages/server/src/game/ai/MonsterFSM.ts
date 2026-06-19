import { Monster } from '../entities/Monster.js';
import type { Player } from '../entities/Player.js';
import { findPath, type Grid } from '../pathfinding/Pathfinding.js';

/**
 * Result returned by MonsterFSM.update() for each monster processed.
 */
export interface FSMUpdateResult {
  /** The ID of the monster that produced this result */
  monsterId: string;
  /** Whether the monster initiated an attack this tick */
  attacked: boolean;
  /** Target player ID if attacked */
  targetId?: string;
}

/**
 * Finite State Machine for monster AI behavior.
 *
 * States: idle → aggro → chase → attack → return
 *
 * - **idle**: Monster stands still or patrols near its spawn point.
 * - **aggro**: Transition state — target acquired, path calculated.
 * - **chase**: Follow A* path toward target player.
 * - **attack**: Auto-attack target player within attack range.
 * - **return**: Pathfind back to spawn when target is lost or out of leash.
 */
export class MonsterFSM {
  /**
   * Main entry point. Evaluates the monster's current state and advances it.
   *
   * @param monster - The monster entity (in/out — position & state are mutated)
   * @param players - All connected players (used for target acquisition)
   * @param grid    - The collision grid for the monster's current map
   * @param deltaMs - Time elapsed since last tick in ms
   * @param now     - Current timestamp (ms) for cooldown checks
   */
  update(
    monster: Monster,
    players: Player[],
    grid: Grid,
    deltaMs: number,
    now: number,
  ): FSMUpdateResult {
    if (!monster.isAlive()) {
      return { monsterId: monster.id, attacked: false };
    }

    const target = this.findTarget(monster, players);

    switch (monster.currentState) {
      case 'idle':
        return this.handleIdle(monster, target, grid, deltaMs, now);
      case 'aggro':
        return this.handleAggro(monster, target, grid, now);
      case 'chase':
        return this.handleChase(monster, target, grid, deltaMs, now);
      case 'attack':
        return this.handleAttack(monster, target, grid, deltaMs, now);
      case 'return':
        return this.handleReturn(monster, grid, deltaMs, now);
      default:
        return { monsterId: monster.id, attacked: false };
    }
  }

  // ---------------------------------------------------------------------------
  // State handlers
  // ---------------------------------------------------------------------------

  /**
   * IDLE state:
   * - If target is in aggro range → transition to AGGRO.
   * - Otherwise, perform random patrol movement every ~3-5 seconds.
   */
  private handleIdle(
    monster: Monster,
    target: Player | null,
    grid: Grid,
    deltaMs: number,
    now: number,
  ): FSMUpdateResult {
    // If a player is in aggro range, transition to aggro
    if (target) {
      monster.currentState = 'aggro';
      monster.aggroTargetId = target.id;
      return this.handleAggro(monster, target, grid, now);
    }

    // Patrol behavior: move to a random point around spawn every ~3-5 seconds
    if (!monster.aiMovePath || monster.aiMovePath.length === 0) {
      if (!monster.lastPatrolTime || now - monster.lastPatrolTime > 3000 + Math.random() * 2000) {
        this.startPatrol(monster, grid);
        monster.lastPatrolTime = now;
      }
    }

    // Follow patrol path if one exists
    this.advanceAlongPath(monster, deltaMs);

    return { monsterId: monster.id, attacked: false };
  }

  /**
   * AGGRO state (one-shot transition):
   * - Validates the target is still valid.
   * - Calculates the initial A* chase path.
   * - Transitions to CHASE.
   */
  private handleAggro(
    monster: Monster,
    target: Player | null,
    grid: Grid,
    now: number,
  ): FSMUpdateResult {
    if (!target || !target.isAlive()) {
      monster.currentState = 'idle';
      monster.aggroTargetId = null;
      monster.aiMovePath = [];
      return { monsterId: monster.id, attacked: false };
    }

    const dist = Math.abs(monster.x - target.x) + Math.abs(monster.y - target.y);
    const attackRange = monster.template.attackRange;

    // If already in attack range, skip chase and go directly to attack
    if (dist <= attackRange) {
      monster.currentState = 'attack';
      monster.aiMovePath = [];
      return { monsterId: monster.id, attacked: false };
    }

    // Calculate initial chase path
    const path = findPath(grid, monster.x, monster.y, target.x, target.y);
    if (path.length > 0) {
      monster.aiMovePath = path;
      monster.aiMoveIndex = 0;
      monster.aiMoveRemainder = 0;
    }
    monster.lastPathRecalcTime = now;
    monster.currentState = 'chase';

    return { monsterId: monster.id, attacked: false };
  }

  /**
   * CHASE state:
   * - Follows the A* path tile by tile.
   * - Periodically recalculates the path to the target's current position.
   * - If target is within attack range → ATTACK.
   * - If target is out of leash range → RETURN.
   * - If target is null/dead → RETURN to spawn.
   */
  private handleChase(
    monster: Monster,
    target: Player | null,
    grid: Grid,
    deltaMs: number,
    now: number,
  ): FSMUpdateResult {
    // Target lost — return to spawn
    if (!target || !target.isAlive()) {
      monster.aggroTargetId = null;
      return this.startReturn(monster, grid, now);
    }

    const dist = Math.abs(monster.x - target.x) + Math.abs(monster.y - target.y);
    const leashRange = monster.template.aggroRange * monster.template.leashMultiplier;

    // Out of leash range — return to spawn
    if (dist > leashRange) {
      monster.aggroTargetId = null;
      return this.startReturn(monster, grid, now);
    }

    const attackRange = monster.template.attackRange;

    // Within attack range — transition to attack
    if (dist <= attackRange) {
      monster.currentState = 'attack';
      monster.aiMovePath = [];
      return { monsterId: monster.id, attacked: false };
    }

    // Periodically recalculate path toward target
    if (now - monster.lastPathRecalcTime >= monster.template.pathRecalcInterval) {
      const path = findPath(grid, monster.x, monster.y, target.x, target.y);
      if (path.length > 0) {
        monster.aiMovePath = path;
        monster.aiMoveIndex = 0;
        monster.aiMoveRemainder = 0;
      }
      monster.lastPathRecalcTime = now;
    }

    // Advance along the chase path
    this.advanceAlongPath(monster, deltaMs);

    return { monsterId: monster.id, attacked: false };
  }

  /**
   * ATTACK state:
   * - If target is out of attack range → CHASE.
   * - If target is out of leash range → RETURN.
   * - If target is null/dead → RETURN to spawn.
   * - Otherwise, attack if cooldown has elapsed.
   */
  private handleAttack(
    monster: Monster,
    target: Player | null,
    grid: Grid,
    _deltaMs: number,
    now: number,
  ): FSMUpdateResult {
    // Target lost — return to spawn
    if (!target || !target.isAlive()) {
      monster.aggroTargetId = null;
      return this.startReturn(monster, grid, now);
    }

    const dist = Math.abs(monster.x - target.x) + Math.abs(monster.y - target.y);
    const leashRange = monster.template.aggroRange * monster.template.leashMultiplier;
    const attackRange = monster.template.attackRange;

    // Out of leash range — return to spawn
    if (dist > leashRange) {
      monster.aggroTargetId = null;
      return this.startReturn(monster, grid, now);
    }

    // Out of attack range but still in leash — chase
    if (dist > attackRange) {
      monster.currentState = 'chase';
      monster.lastPathRecalcTime = 0; // Force path recalculation on next chase tick
      return { monsterId: monster.id, attacked: false };
    }

    // Check attack cooldown
    if (now - monster.lastAttackTime >= monster.template.attackCooldown) {
      return {
        monsterId: monster.id,
        attacked: true,
        targetId: target.id,
      };
    }

    return { monsterId: monster.id, attacked: false };
  }

  /**
   * RETURN state:
   * - Follows A* path back to spawn point.
   * - When spawn is reached → IDLE.
   */
  private handleReturn(
    monster: Monster,
    grid: Grid,
    deltaMs: number,
    now: number,
  ): FSMUpdateResult {
    const distToSpawn =
      Math.abs(monster.x - monster.spawnX) + Math.abs(monster.y - monster.spawnY);

    // Arrived at spawn — transition to idle
    if (distToSpawn === 0) {
      monster.currentState = 'idle';
      monster.aggroTargetId = null;
      monster.aiMovePath = [];
      monster.lastPatrolTime = now; // Start patrol timer from now
      return { monsterId: monster.id, attacked: false };
    }

    // Calculate or recalculate path to spawn
    if (
      !monster.aiMovePath ||
      monster.aiMovePath.length === 0 ||
      now - monster.lastPathRecalcTime >= monster.template.pathRecalcInterval
    ) {
      const path = findPath(grid, monster.x, monster.y, monster.spawnX, monster.spawnY);
      if (path.length > 0) {
        monster.aiMovePath = path;
        monster.aiMoveIndex = 0;
        monster.aiMoveRemainder = 0;
      }
      monster.lastPathRecalcTime = now;
    }

    // Follow return path
    this.advanceAlongPath(monster, deltaMs);

    return { monsterId: monster.id, attacked: false };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Finds the nearest alive player within aggro range.
   * If the monster already has a target, returns that player (if still valid).
   * Otherwise scans all players in the same map.
   */
  private findTarget(monster: Monster, players: Player[]): Player | null {
    const aggroRange = monster.template.aggroRange;

    // If aggro range is 0, monster never aggros
    if (aggroRange <= 0) return null;

    // If monster already has a target, check if it's still valid
    if (monster.aggroTargetId) {
      const current = players.find(
        (p) => p.id === monster.aggroTargetId && p.isAlive() && p.mapId === monster.mapId,
      );
      if (current) return current;
      // Target is dead or no longer in the same map
      monster.aggroTargetId = null;
    }

    // Scan for nearest alive player in aggro range
    let nearest: Player | null = null;
    let nearestDist = Infinity;

    for (const player of players) {
      if (!player.isAlive() || player.mapId !== monster.mapId) continue;
      const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
      if (dist <= aggroRange && dist < nearestDist) {
        nearest = player;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  /**
   * Initiates a return to spawn: sets state to 'return', clears target,
   * and calculates the A* path back to spawn.
   */
  private startReturn(monster: Monster, grid: Grid, now: number): FSMUpdateResult {
    monster.currentState = 'return';
    monster.aggroTargetId = null;
    monster.aiMovePath = [];
    monster.aiMoveIndex = 0;
    monster.aiMoveRemainder = 0;

    const path = findPath(grid, monster.x, monster.y, monster.spawnX, monster.spawnY);
    if (path.length > 0) {
      monster.aiMovePath = path;
    }
    monster.lastPathRecalcTime = now;

    return { monsterId: monster.id, attacked: false };
  }

  /**
   * Starts a random patrol: picks a walkable tile within patrolRadius of spawn
   * and calculates an A* path to it.
   */
  private startPatrol(monster: Monster, grid: Grid): void {
    const patrolRadius = monster.template.patrolRadius;

    // Try up to 20 times to find a walkable patrol destination
    for (let attempt = 0; attempt < 20; attempt++) {
      const dx = Math.floor(Math.random() * (patrolRadius * 2 + 1)) - patrolRadius;
      const dy = Math.floor(Math.random() * (patrolRadius * 2 + 1)) - patrolRadius;
      const patrolX = monster.spawnX + dx;
      const patrolY = monster.spawnY + dy;

      // Skip if it's the current position or not walkable
      if (patrolX === monster.x && patrolY === monster.y) continue;
      if (!grid.isWalkable(patrolX, patrolY)) continue;

      const path = findPath(grid, monster.x, monster.y, patrolX, patrolY);
      if (path.length > 0) {
        monster.aiMovePath = path;
        monster.aiMoveIndex = 0;
        monster.aiMoveRemainder = 0;
        return;
      }
    }
  }

  /**
   * Advances the monster along its current AI movement path by the
   * appropriate number of tiles for the elapsed time and monster speed.
   *
   * Uses a fractional accumulator so that low speeds still progress
   * smoothly across multiple ticks.
   */
  private advanceAlongPath(monster: Monster, deltaMs: number): void {
    if (!monster.aiMovePath || monster.aiMovePath.length === 0) return;

    const speed = monster.template.moveSpeed;
    // Prevent teleportation after extreme lag spikes (cap at 10 tiles)
    const maxTilesPerTick = 10;
    monster.aiMoveRemainder = Math.min(
      monster.aiMoveRemainder + (speed * deltaMs) / 1000,
      maxTilesPerTick,
    );

    while (monster.aiMoveRemainder >= 1 && monster.aiMoveIndex < monster.aiMovePath.length - 1) {
      const next = monster.aiMovePath[monster.aiMoveIndex + 1];
      monster.x = next.x;
      monster.y = next.y;
      monster.aiMoveIndex++;
      monster.aiMoveRemainder -= 1;
    }

    // Path completed
    if (monster.aiMoveIndex >= monster.aiMovePath.length - 1) {
      monster.aiMovePath = [];
      monster.aiMoveRemainder = 0;
    }
  }
}
