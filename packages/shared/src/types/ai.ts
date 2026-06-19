export type MonsterAIState = 'idle' | 'aggro' | 'chase' | 'attack' | 'return';

export interface MonsterAIConfig {
  aggroRange: number;
  attackRange: number;
  leashMultiplier: number;
  attackCooldown: number;
  patrolRadius: number;
  moveSpeed: number;
  pathRecalcInterval: number;
}
