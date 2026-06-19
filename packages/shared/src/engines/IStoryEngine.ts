/**
 * Story & Quests Engine Interface (#66)
 *
 * Defines the contract for narrative systems: quests, dialogue trees,
 * quest log, and story progression.
 *
 * Implementations: server/src/engines/StoryEngine.ts
 * This interface is pure — NO runtime dependencies.
 */

// ─── Quests ───────────────────────────────────────────────────────

export type ObjectiveType = 'kill' | 'collect' | 'talk' | 'reach';

export interface IQuestObjective {
  type: ObjectiveType;
  targetId: string;   // monsterId, itemId, npcId, or mapId depending on type
  targetName: string;
  required: number;
  current: number;
}

export interface IQuestReward {
  experience: number;
  gold: number;
  items: Array<{ templateId: string; quantity: number }>;
  skillUnlocks?: string[];
}

export interface IQuestConfig {
  id: string;
  name: string;
  description: string;
  objectives: IQuestObjective[];
  rewards: IQuestReward;
  prerequisites: string[];       // quest IDs that must be completed
  chainId?: string;              // quest chain identifier
  chainOrder?: number;           // position in chain (1-based)
  levelRequired?: number;
  autoStart?: boolean;           // auto-accept when conditions met
  repeatable?: boolean;
  category?: 'main' | 'side' | 'daily' | 'event';
}

export type QuestState = 'locked' | 'available' | 'active' | 'completed' | 'delivered';

// ─── Dialogue ─────────────────────────────────────────────────────

export interface IDialogueCondition {
  type: 'has_quest' | 'quest_completed' | 'quest_active' | 'level' | 'has_item' | 'class' | 'reputation';
  targetId?: string;
  value?: number | string;
}

export interface IDialogueAction {
  type: 'give_quest' | 'complete_objective' | 'complete_quest' | 'give_item'
      | 'remove_item' | 'give_xp' | 'give_gold' | 'teleport' | 'open_shop';
  targetId?: string;
  value?: number | string;
}

export interface IDialogueOption {
  text: string;
  nextNodeId: string | null;  // null = end dialogue
  conditions?: IDialogueCondition[];
}

export interface IDialogueNode {
  id: string;
  npcId: string;
  text: string;
  options: IDialogueOption[];
  conditions?: IDialogueCondition[];
  actions?: IDialogueAction[];
}

// ─── Engine Interface ─────────────────────────────────────────────

export interface IStoryEngine {
  // Quest lifecycle
  getQuestConfig(questId: string): IQuestConfig | undefined;
  getQuestState(characterId: string, questId: string): QuestState;
  canStartQuest(characterId: string, questId: string): { allowed: boolean; reason?: string };
  startQuest(characterId: string, questId: string): boolean;
  advanceObjective(characterId: string, questId: string, objectiveType: ObjectiveType, targetId: string, count?: number): void;
  completeQuest(characterId: string, questId: string): IQuestReward | null;
  deliverQuest(characterId: string, questId: string): IQuestReward | null;

  // Quest queries
  getActiveQuests(characterId: string): string[];
  getCompletedQuests(characterId: string): string[];
  getAvailableQuests(characterId: string): string[];
  getQuestProgress(characterId: string, questId: string): IQuestObjective[];

  // Dialogue
  getDialogueNode(nodeId: string): IDialogueNode | undefined;
  getNpcDialogueStart(npcId: string): string | null;    // returns first nodeId
  getDialogueOptions(characterId: string, nodeId: string): IDialogueOption[];
  selectDialogueOption(characterId: string, nodeId: string, optionIndex: number): string | null;  // returns next nodeId or null

  // NPC interactions
  talkToNpc(characterId: string, npcId: string): string | null;  // returns first dialogue nodeId

  // Update (process ongoing quests, timers, etc.)
  update(deltaMs: number): void;
}
