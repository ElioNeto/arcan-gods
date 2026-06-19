/**
 * Story Engine — server implementation (#66)
 *
 * Gerencia quests (ciclo de vida completo), diálogo de NPCs,
 * e progressão de história.
 *
 * Implementa IStoryEngine de shared/.
 */

import type {
  IStoryEngine, IQuestConfig, IQuestObjective, IQuestReward,
  IDialogueNode, IDialogueOption, IDialogueCondition, IDialogueAction,
  QuestState, ObjectiveType,
} from '@arcan-gods/shared';
import type { World } from '../game/World.js';

/**
 * Estado interno de uma quest para um personagem.
 */
interface QuestProgress {
  questId: string;
  state: Exclude<QuestState, 'locked' | 'available'>;
  objectives: IQuestObjective[];
  startedAt: number;
}

export class StoryEngine implements IStoryEngine {
  private world: World;
  private quests: Map<string, IQuestConfig> = new Map();
  private dialogues: Map<string, IDialogueNode> = new Map();
  private npcDialogues: Map<string, string[]> = new Map(); // npcId → nodeIds
  private progress: Map<string, Map<string, QuestProgress>> = new Map(); // characterId → Map<questId, progress>

  constructor(world: World) {
    this.world = world;
    this.loadDefaultQuests();
    this.loadDefaultDialogues();
  }

  // ─── Quest Lifecycle ────────────────────────────────────────

  getQuestConfig(questId: string): IQuestConfig | undefined {
    return this.quests.get(questId);
  }

  getQuestState(characterId: string, questId: string): QuestState {
    const charProgress = this.progress.get(characterId);
    if (!charProgress) {
      // Check if quest exists and prerequisites are met
      const quest = this.quests.get(questId);
      if (!quest) return 'locked';
      if (this.canStartQuest(characterId, questId).allowed) return 'available';
      return 'locked';
    }
    const prog = charProgress.get(questId);
    if (!prog) return 'locked';
    return prog.state;
  }

  canStartQuest(characterId: string, questId: string): { allowed: boolean; reason?: string } {
    const quest = this.quests.get(questId);
    if (!quest) return { allowed: false, reason: 'Quest not found' };

    // Check if already started
    const charProgress = this.progress.get(characterId);
    if (charProgress?.has(questId)) {
      return { allowed: false, reason: 'Quest already started or completed' };
    }

    // Check prerequisites
    for (const prereq of quest.prerequisites) {
      const pState = this.getQuestState(characterId, prereq);
      if (pState !== 'delivered') {
        return { allowed: false, reason: `Complete "${prereq}" first` };
      }
    }

    // Check level requirement
    if (quest.levelRequired) {
      const player = this.world.getPlayer(characterId);
      if (player && player.level < quest.levelRequired) {
        return { allowed: false, reason: `Level ${quest.levelRequired} required` };
      }
    }

    return { allowed: true };
  }

  startQuest(characterId: string, questId: string): boolean {
    const check = this.canStartQuest(characterId, questId);
    if (!check.allowed) return false;

    const quest = this.quests.get(questId)!;
    const progress: QuestProgress = {
      questId,
      state: 'active',
      objectives: quest.objectives.map(obj => ({ ...obj, current: 0 })),
      startedAt: Date.now(),
    };

    if (!this.progress.has(characterId)) {
      this.progress.set(characterId, new Map());
    }
    this.progress.get(characterId)!.set(questId, progress);
    return true;
  }

  advanceObjective(characterId: string, questId: string, objectiveType: ObjectiveType, targetId: string, count: number = 1): void {
    const charProgress = this.progress.get(characterId);
    if (!charProgress) return;
    const prog = charProgress.get(questId);
    if (!prog || prog.state !== 'active') return;

    for (const obj of prog.objectives) {
      if (obj.type === objectiveType && obj.targetId === targetId && obj.current < obj.required) {
        obj.current = Math.min(obj.current + count, obj.required);
      }
    }

    // Check if all objectives are complete
    const allDone = prog.objectives.every(obj => obj.current >= obj.required);
    if (allDone) {
      prog.state = 'completed';
    }
  }

  completeQuest(characterId: string, questId: string): IQuestReward | null {
    const charProgress = this.progress.get(characterId);
    if (!charProgress) return null;
    const prog = charProgress.get(questId);
    if (!prog || prog.state !== 'completed') return null;

    prog.state = 'delivered';
    return this.quests.get(questId)?.rewards ?? null;
  }

  deliverQuest(characterId: string, questId: string): IQuestReward | null {
    return this.completeQuest(characterId, questId);
  }

  // ─── Quest Queries ──────────────────────────────────────────

  getActiveQuests(characterId: string): string[] {
    const charProgress = this.progress.get(characterId);
    if (!charProgress) return [];
    return Array.from(charProgress.values())
      .filter(p => p.state === 'active')
      .map(p => p.questId);
  }

  getCompletedQuests(characterId: string): string[] {
    const charProgress = this.progress.get(characterId);
    if (!charProgress) return [];
    return Array.from(charProgress.values())
      .filter(p => p.state === 'delivered')
      .map(p => p.questId);
  }

  getAvailableQuests(characterId: string): string[] {
    return Array.from(this.quests.keys())
      .filter(qId => this.canStartQuest(characterId, qId).allowed);
  }

  getQuestProgress(characterId: string, questId: string): IQuestObjective[] {
    const charProgress = this.progress.get(characterId);
    if (!charProgress) return [];
    return charProgress.get(questId)?.objectives ?? [];
  }

  // ─── Dialogue ───────────────────────────────────────────────

  getDialogueNode(nodeId: string): IDialogueNode | undefined {
    return this.dialogues.get(nodeId);
  }

  getNpcDialogueStart(npcId: string): string | null {
    const nodes = this.npcDialogues.get(npcId);
    return nodes?.[0] ?? null;
  }

  getDialogueOptions(characterId: string, nodeId: string): IDialogueOption[] {
    const node = this.dialogues.get(nodeId);
    if (!node) return [];
    return node.options.filter(opt => {
      if (!opt.conditions || opt.conditions.length === 0) return true;
      return this.evaluateConditions(characterId, opt.conditions);
    });
  }

  selectDialogueOption(characterId: string, nodeId: string, optionIndex: number): string | null {
    const node = this.dialogues.get(nodeId);
    if (!node) return null;
    const option = node.options[optionIndex];
    if (!option) return null;

    // Execute actions for the selected option
    if (option.conditions) {
      if (!this.evaluateConditions(characterId, option.conditions)) return null;
    }

    // Find the node that has actions and execute them
    const actionNode = this.dialogues.get(nodeId);
    if (actionNode?.actions) {
      this.executeActions(characterId, actionNode.actions);
    }

    // If the selected option has actions, execute them
    // (actions are stored on the node, not the option)
    // For now, return next node
    return option.nextNodeId;
  }

  evaluateConditions(_characterId: string, conditions: IDialogueCondition[]): boolean {
    const player = this.world.getPlayer(_characterId);
    if (!player) return false;

    for (const cond of conditions) {
      switch (cond.type) {
        case 'level':
          if (cond.value !== undefined && player.level < Number(cond.value)) return false;
          break;
        case 'has_quest':
          if (cond.targetId && !this.progress.get(_characterId)?.has(cond.targetId)) return false;
          break;
        case 'quest_completed':
          if (cond.targetId) {
            const state = this.getQuestState(_characterId, cond.targetId);
            if (state !== 'delivered') return false;
          }
          break;
        case 'quest_active':
          if (cond.targetId) {
            const state = this.getQuestState(_characterId, cond.targetId);
            if (state !== 'active') return false;
          }
          break;
        default:
          break;
      }
    }
    return true;
  }

  executeActions(characterId: string, actions: IDialogueAction[]): void {
    for (const action of actions) {
      switch (action.type) {
        case 'give_quest':
          if (action.targetId) this.startQuest(characterId, action.targetId);
          break;
        case 'complete_quest':
          if (action.targetId) this.completeQuest(characterId, action.targetId);
          break;
        case 'give_xp':
          // Would need to find player and add XP
          break;
        case 'give_gold':
          // Would need to add gold to player inventory
          break;
        default:
          break;
      }
    }
  }

  talkToNpc(_characterId: string, npcId: string): string | null {
    return this.getNpcDialogueStart(npcId);
  }

  // ─── Update ─────────────────────────────────────────────────

  update(_deltaMs: number): void {
    // Future: check quest timers, auto-advance, etc.
  }

  // ─── Default Data ───────────────────────────────────────────

  private loadDefaultQuests(): void {
    // Tutorial quest
    this.quests.set('tutorial_01', {
      id: 'tutorial_01',
      name: 'Primeiros Passos',
      description: 'Mate 5 Spiders e colete 10 Gold para provar seu valor!',
      objectives: [
        { type: 'kill', targetId: 'spider', targetName: 'Spider', required: 5, current: 0 },
      ],
      rewards: {
        experience: 100,
        gold: 50,
        items: [],
      },
      prerequisites: [],
      category: 'main',
      levelRequired: 1,
    });

    this.quests.set('tutorial_02', {
      id: 'tutorial_02',
      name: 'Caçador de Buddy',
      description: 'Elimine 10 Buddy Buddy para ganhar experiência.',
      objectives: [
        { type: 'kill', targetId: 'buddy_buddy', targetName: 'Buddy Buddy', required: 10, current: 0 },
      ],
      rewards: {
        experience: 250,
        gold: 100,
        items: [],
      },
      prerequisites: ['tutorial_01'],
      chainId: 'tutorial',
      chainOrder: 2,
      category: 'main',
      levelRequired: 1,
    });
  }

  private loadDefaultDialogues(): void {
    // Merchant NPC dialogue
    this.dialogues.set('merchant_greeting', {
      id: 'merchant_greeting',
      npcId: 'merchant',
      text: 'Bem-vindo, aventureiro! Precisa de equipamentos?',
      options: [
        { text: 'Sim, quero ver seus produtos!', nextNodeId: 'merchant_shop' },
        { text: 'Tenho itens para vender.', nextNodeId: 'merchant_sell' },
        { text: 'Apenas passando.', nextNodeId: null },
      ],
    });

    this.dialogues.set('merchant_shop', {
      id: 'merchant_shop',
      npcId: 'merchant',
      text: 'Ótima escolha! (Loja abriria aqui)',
      options: [
        { text: 'Voltar', nextNodeId: 'merchant_greeting' },
        { text: 'Sair', nextNodeId: null },
      ],
      actions: [{ type: 'give_quest', targetId: 'tutorial_01' }],
    });

    this.dialogues.set('merchant_sell', {
      id: 'merchant_sell',
      npcId: 'merchant',
      text: 'Mostre o que tem! (Venda abriria aqui)',
      options: [
        { text: 'Voltar', nextNodeId: 'merchant_greeting' },
        { text: 'Sair', nextNodeId: null },
      ],
    });

    this.npcDialogues.set('merchant', ['merchant_greeting']);
  }
}
