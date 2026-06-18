export type CollisionType = 'tile' | 'object' | 'entity' | 'boundary' | 'portal';

export interface CollisionResult {
  collided: boolean;
  collisionType?: CollisionType;
  collidedWith?: string; // entity ID or object name
  blockedX: boolean;
  blockedY: boolean;
  newX: number;
  newY: number;
}

export interface CollisionEvent {
  type: 'collision_enter' | 'collision_stay' | 'collision_exit';
  entityId: string;
  otherId?: string;
  collisionType: CollisionType;
  timestamp: number;
}
