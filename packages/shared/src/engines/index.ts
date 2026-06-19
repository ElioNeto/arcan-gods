/**
 * Engines barrel — re-exports all engine interfaces.
 *
 * These interfaces define the contracts for the 4 core engines:
 * - GraphicsEngine (#64): rendering, sprites, camera, particles
 * - GameplayEngine (#65): combat, skills, classes, loot, inventory
 * - StoryEngine (#66): quests, dialogue, narrative
 * - MapEngine (#67): maps, collision, portals, editor
 */

export type {
  // IGraphicsEngine
  AnimationFrame, AnimationConfig, ISpriteHandle,
  ICameraState, ICamera,
  ParticleConfig, IParticleEffect,
  HitFlashConfig, DamageNumberConfig,
  IGraphicsEngine,
  RenderLayer,
} from './IGraphicsEngine.js';

export type {
  // IGameplayEngine
  ICombatResult, ICombatConfig,
  SkillTargetType, ISkillConfig,
  IClassStats, IClassGrowth,
  BuffType, IBuffConfig,
  IDropEntry, IDropTable, IInventorySlot, IItemStats, IItemTemplate,
  IMoveResult,
  IGameplayEngine,
} from './IGameplayEngine.js';

export type {
  // IStoryEngine
  ObjectiveType, IQuestObjective, IQuestReward, IQuestConfig, QuestState,
  IDialogueCondition, IDialogueAction, IDialogueOption, IDialogueNode,
  IStoryEngine,
} from './IStoryEngine.js';

export type {
  // IMapEngine
  ITileRenderLayerInfo, IPortalDef, IMapDescriptor, IMapEditor, IMapEngine,
} from './IMapEngine.js';
