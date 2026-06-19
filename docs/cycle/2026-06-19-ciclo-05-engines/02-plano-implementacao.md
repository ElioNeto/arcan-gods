# 📋 Plano de Implementação — Ciclo 05: Engines Architecture

**Data:** 2026-06-19
**Agente:** Planner
**Branch:** `main`
**Base:** Scoping Report (`01-scoping.md`)

---

## Sumário

| ID | Tarefa | Complexidade | Depende |
|:--:|--------|:------------:|:-------:|
| P0.1 | `IGraphicsEngine.ts` (interface shared/) | Alta | — |
| P0.2 | `IGameplayEngine.ts` (interface shared/) | Alta | — |
| P0.3 | `IStoryEngine.ts` (interface shared/) | Média | — |
| P0.4 | `IMapEngine.ts` (interface shared/) | Média | — |
| P0.5 | Bug #62: ENTITY_UPDATE nunca enviado | Baixa | — |
| P0.6 | Bug #63: PLAYER_ATTACK sem broadcast | Baixa | — |
| P1.1 | `GraphicsEngine` (client, implementação concreta) | Alta | P0.1 |
| P1.2 | `GameplayEngine` (server, implementação concreta) | Alta | P0.2 |
| P1.3 | `MapEngine` (server, implementação concreta) | Média | P0.4 |
| P1.4 | `StoryEngine` (server, implementação concreta) | Média | P0.3 |
| P2.1 | Testes unitários das engines | Média | P1.x |
| P2.2 | Documentação de arquitetura (engines.md) | Baixa | P1.x |

---

## Diagrama de Dependências

```
P0.1 ────→ P1.1
P0.2 ────→ P1.2
P0.3 ────→ P1.4
P0.4 ────→ P1.3
P0.5 ────┐
         ├──→ (independentes, podem executar em paralelo)
P0.6 ────┘
              ↓
         P2.1 (testes) + P2.2 (docs)
```

### Ordem de Execução Sugerida

```
Fase 1 (paralelo total):
  Dev A: P0.1  |  Dev B: P0.2  |  Dev C: P0.3  |  Dev D: P0.4  |  Dev E: P0.5 + P0.6

Fase 2 (paralelo total, após Fase 1):
  Dev A: P1.1  |  Dev B: P1.2  |  Dev C: P1.3  |  Dev D: P1.4

Fase 3 (após Fase 2):
  Dev A/B/C/D: P2.1 (testes) + P2.2 (docs)
```

---

## 🟥 P0.1 — Interface `IGraphicsEngine` em shared/

### Descrição
Criar a interface de contrato para o sistema de gráfico/rendering. Define os métodos que o cliente deve implementar para gerenciar câmera, assets, entidades visuais, mapa, feedback de combate e effects.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/shared/src/engines/IGraphicsEngine.ts` | 🆕 Criar |
| `packages/shared/src/engines/index.ts` | 🆕 Criar (reexport) |
| `packages/shared/src/index.ts` | ✏️ Modificar (add engines export) |

### Complexidade
**Alta** — Define API extensa de rendering com tipos genéricos (sem dependências de runtime).

### Dependências Técnicas
- `packages/shared/src/types/entities.ts` (IEntity, IPlayer, IMonster, INPC)
- `packages/shared/src/types/tilemap.ts` (IMapData, ICollisionGrid)

### Passos de Implementação

1. **Criar diretório** `packages/shared/src/engines/`
2. **Definir tipos auxiliares** no próprio arquivo ou em `shared/src/engines/types.ts`:
   ```ts
   export interface EngineCameraState {
     x: number;
     y: number;
     zoom: number;
   }

   export interface VisualEffect {
     id: string;
     type: string;
     x: number;
     y: number;
     duration: number;
     elapsed: number;
   }
   ```
3. **Criar `IGraphicsEngine.ts`** com os seguintes grupos de métodos:

   **Camera:**
   - `follow(entityId: string): void`
   - `unfollow(): void`
   - `screenToWorld(screenX: number, screenY: number): { x: number; y: number }`
   - `setScreenSize(width: number, height: number): void`
   - `getCameraState(): EngineCameraState`
   - `snapToTarget(): void`

   **Asset Management:**
   - `init(): Promise<void>`
   - `preloadAssets(assetList?: string[]): Promise<void>`
   - `getAsset(name: string): unknown`

   **Scene / Map:**
   - `renderMap(data: IMapData | { collisionGrid: boolean[][] }): void`
   - `clearScene(): void`

   **Entity Rendering:**
   - `addEntity(entity: IEntity): void`
   - `updateEntityPosition(id: string, x: number, y: number): void`
   - `removeEntity(id: string): void`
   - `clearEntities(): void`

   **Combat Feedback:**
   - `showDamage(targetId: string, damage: number, isCritical: boolean, x: number, y: number, targetHp: number, targetMaxHp: number): void`
   - `showHealthBar(id: string, hp: number, maxHp: number): void`
   - `updateHealthBarPosition(id: string, x: number, y: number): void`
   - `removeHealthBar(id: string): void`

   **Update Loop:**
   - `update(deltaSec: number): void`

   **Future API slots (comentados no código):**
   - Particles
   - Layer management
   - Animation state management

4. **Criar `engines/index.ts`**:
   ```ts
   export type { IGraphicsEngine } from './IGraphicsEngine.js';
   export type { EngineCameraState, VisualEffect } from './IGraphicsEngine.js';
   ```
5. **Modificar `packages/shared/src/index.ts`**: adicionar `export * from './engines/index.js';`

### Critérios de Aceitação
- [ ] Interface exportada corretamente de `@arcan-gods/shared`
- [ ] Nenhuma dependência de PixiJS, cliente ou servidor
- [ ] Tipos genéricos sem import de runtime específico
- [ ] Todos os métodos documentados com JSDoc
- [ `shared/src/index.ts` exporta corretamente

---

## 🟥 P0.2 — Interface `IGameplayEngine` em shared/

### Descrição
Define o contrato para o sistema de gameplay: combate, movimento, colisão (e futuramente skills, buffs, loot, inventário).

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/shared/src/engines/IGameplayEngine.ts` | 🆕 Criar |
| `packages/shared/src/engines/index.ts` | ✏️ Modificar (add export) |

### Complexidade
**Alta** — Deve abstrair CombatSystem, MovementSystem, CollisionSystem com tipos limpos.

### Dependências Técnicas
- `packages/shared/src/types/entities.ts` (IEntity)
- `packages/shared/src/types/movement.ts` (Waypoint, PathResult)
- `packages/shared/src/types/collision.ts` (CollisionResult)
- `packages/shared/src/constants/damage-formulas.ts` (DamageResult)

### Passos de Implementação

1. **Definir tipos auxiliares de resultado** em `IGameplayEngine.ts`:
   ```ts
   export interface AttackResult {
     success: boolean;
     error?: string;
     damage?: number;
     isCritical?: boolean;
     isBlocked?: boolean;
     targetId?: string;
     targetHp?: number;
     targetMaxHp?: number;
     killed?: boolean;
     expGain?: number;
     goldGain?: number;
   }

   export interface MoveResult {
     success: boolean;
     path?: Waypoint[];
     error?: string;
   }

   export interface CollisionCheckResult {
     walkable: boolean;
     inBounds: boolean;
   }
   ```

2. **Criar interface `IGameplayEngine`** com:

   **Combat:**
   - `processAttack(attackerId: string, targetId: string): AttackResult`
   - `processMonsterAttack(monsterId: string, targetPlayerId: string): AttackResult`
   - `getAttackCooldownRemaining(entityId: string): number`

   **Movement:**
   - `startMove(entityId: string, destX: number, destY: number, mapId: string): MoveResult`
   - `stopMove(entityId: string): void`
   - `isMoving(entityId: string): boolean`
   - `getActivePath(entityId: string): Waypoint[] | undefined`

   **Collision:**
   - `canMoveTo(mapId: string, x: number, y: number, entityId?: string): boolean`
   - `tryMove(mapId: string, fromX: number, fromY: number, toX: number, toY: number): CollisionResult`
   - `isPathWalkable(mapId: string, path: Waypoint[]): boolean`

   **Core Loop:**
   - `update(deltaMs: number, tickCount: number): void`

   **Future slots:**
   - Skills
   - Buffs / Debuffs
   - Inventory management
   - Loot drops

3. **Atualizar** `engines/index.ts` com novo export.

### Critérios de Aceitação
- [ ] Interface exportada corretamente
- [ ] Todos os tipos usados são de `shared/` ou definidos inline
- [ ] Nenhuma dependência de `World`, `GameEngine` ou runtime do servidor
- [ ] JSDoc completo

---

## 🟥 P0.3 — Interface `IStoryEngine` em shared/

### Descrição
Define o contrato para quests, diálogos, e narrativa. Será usado pelo servidor para gerenciar o estado das quests e pelo cliente para UI de quest log/diálogo.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/shared/src/engines/IStoryEngine.ts` | 🆕 Criar |
| `packages/shared/src/engines/index.ts` | ✏️ Modificar (add export) |

### Complexidade
**Média** — Conceitos claros (quest definition, quest state, dialogue tree).

### Dependências Técnicas
- Nenhuma (usa tipos próprios inline)

### Passos de Implementação

1. **Definir tipos de quest e diálogo** em `IStoryEngine.ts`:
   ```ts
   export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'failed';
   export type ObjectiveType = 'kill' | 'collect' | 'talk' | 'explore' | 'escort';

   export interface QuestDefinition {
     id: string;
     name: string;
     description: string;
     levelRequired: number;
     prerequisites: string[]; // quest IDs que devem estar completas
     objectives: QuestObjective[];
     rewards: QuestReward;
     nextQuestId?: string; // chain
   }

   export interface QuestObjective {
     id: string;
     type: ObjectiveType;
     targetId: string;
     quantity: number;
     description: string;
   }

   export interface QuestReward {
     experience: number;
     gold: number;
     items?: Array<{ itemId: string; quantity: number }>;
   }

   export interface QuestState {
     questId: string;
     status: QuestStatus;
     objectives: ObjectiveProgress[];
     startedAt: number;
     completedAt?: number;
   }

   export interface ObjectiveProgress {
     objectiveId: string;
     current: number;
     complete: boolean;
   }

   export interface QuestResult {
     success: boolean;
     error?: string;
     questState?: QuestState;
     rewards?: QuestReward;
   }

   export interface DialogueNode {
     id: string;
     npcId: string;
     text: string;
     options: DialogueOption[];
   }

   export interface DialogueOption {
     id: string;
     text: string;
     nextDialogueId?: string;
     requirements?: { questId?: string; questStatus?: QuestStatus; level?: number };
     actions?: Array<{ type: 'start_quest' | 'complete_quest' | 'give_item' | 'teleport'; target: string }>;
   }
   ```

2. **Criar interface `IStoryEngine`**:

   **Quest Management:**
   - `getQuestDefinition(questId: string): QuestDefinition | null`
   - `getAvailableQuests(playerId: string): QuestDefinition[]`
   - `startQuest(playerId: string, questId: string): QuestResult`
   - `advanceObjective(playerId: string, questId: string, objectiveId: string, amount?: number): QuestResult`
   - `completeQuest(playerId: string, questId: string): QuestResult`

   **Quest Queries:**
   - `getActiveQuests(playerId: string): QuestState[]`
   - `getCompletedQuests(playerId: string): QuestState[]`
   - `getQuestProgress(playerId: string, questId: string): QuestState | null`

   **Dialogue:**
   - `getDialogue(npcId: string): DialogueNode | null`
   - `selectDialogueOption(npcId: string, optionId: string): DialogueNode | null`

   **Update:**
   - `update(deltaMs: number): void`

3. **Atualizar** `engines/index.ts`.

### Critérios de Aceitação
- [ ] Interface exportada corretamente
- [ ] Tipos de quest e diálogo bem definidos
- [ ] Nenhuma dependência de runtime

---

## 🟥 P0.4 — Interface `IMapEngine` em shared/

### Descrição
Define o contrato para carregamento de mapas, grid de colisão, portais, spawn points e métodos de editor.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/shared/src/engines/IMapEngine.ts` | 🆕 Criar |
| `packages/shared/src/engines/index.ts` | ✏️ Modificar (add export) |

### Complexidade
**Média** — Abstração direta sobre MapManager.

### Dependências Técnicas
- `packages/shared/src/types/tilemap.ts` (ITileMap, ICollisionGrid, ISpawnPoint, IPortal)

### Passos de Implementação

1. **Criar interface `IMapEngine`**:

   **Loading:**
   - `loadMap(mapId: string): boolean`
   - `isMapLoaded(mapId: string): boolean`
   - `getLoadedMaps(): string[]`
   - `unloadMap(mapId: string): void`

   **Data Access:**
   - `getMapData(mapId: string): ITileMap | null`
   - `getCollisionGrid(mapId: string): ICollisionGrid | null`

   **Spawn Points:**
   - `getDefaultSpawn(mapId: string): { x: number; y: number } | null`
   - `getSpawnPoints(mapId: string): ISpawnPoint[]`

   **Portals:**
   - `getPortalAt(mapId: string, x: number, y: number): IPortal | null`

   **Collision Queries:**
   - `isInBounds(mapId: string, x: number, y: number): boolean`
   - `isWalkable(mapId: string, x: number, y: number): boolean`

   **Editor Methods (esboço para futuro):**
   - `setTile(mapId: string, x: number, y: number, walkable: boolean): void`
   - `addPortal(mapId: string, portal: IPortal): void`
   - `removePortal(mapId: string, portalId: string): void`

2. **Atualizar** `engines/index.ts`.

### Critérios de Aceitação
- [ ] Interface exportada corretamente
- [ ] Métodos de editor incluídos como esboço (lançam `NotImplementedError` ou similar nas implementações)
- [ ] Nenhuma dependência de `MapManager` ou runtime do servidor

---

## 🟥 P0.5 — Bug #62: ENTITY_UPDATE nunca enviado

### Descrição
O servidor nunca envia pacotes `ENTITY_UPDATE` após o `WORLD_STATE` inicial. Quando um monstro toma dano, muda de posição (AI movement), ou resspawna, os outros players no mapa não recebem atualização.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/server/src/game/GameEngine.ts` | ✏️ Modificar |

### Complexidade
**Baixa** — 10-20 linhas de alteração.

### Dependências Técnicas
- `packages/server/src/game/GameEngine.ts`
- `packages/server/src/network/server.ts` (método `broadcastToMap` já existe)

### Passos de Implementação

1. **Identificar pontos de mudança de estado** no `GameEngine.tick()`:
   - Após `monsterAISystem.update()` → monstros podem ter mudado de posição/HP
   - Após `movementSystem.update()` → jogadores podem ter mudado de posição
   - Após respawn de monstros

2. **Estratégia**: Adicionar um conjunto `dirtyEntities` no World (ou no GameEngine) que rastreia entidades modificadas. Ao final do tick, broadcast `ENTITY_UPDATE` para cada entidade suja.

   **Implementação detalhada:**

   a. Em `World.ts`, adicionar:
   ```ts
   private dirtyEntities: Set<string> = new Set();

   markDirty(entityId: string): void {
     this.dirtyEntities.add(entityId);
   }

   getAndClearDirtyEntities(): string[] {
     const entities = Array.from(this.dirtyEntities);
     this.dirtyEntities.clear();
     return entities;
   }
   ```

   b. Modificar `Monster.takeDamage()`, `Monster.respawn()`, `Player.takeDamage()` para chamar `world.markDirty(this.id)` — **mas cuidado**: `Monster` e `Player` não têm referência ao World atualmente.

   **Alternativa mais simples**: No `GameEngine.tick()`, ao final, iterar todos os players e monstros e broadcast `ENTITY_UPDATE` para entidades cujo estado mudou. Porém isso é ineficiente.

   **Abordagem mais prática (sem acoplar entities ao World):** Adicionar marcação suja nos sistemas que alteram estado:

   - Em `CombatSystem.processAttack()`: após aplicar dano, broadcast direto de `ENTITY_UPDATE` (reutilizando lógica similar ao `ENTITY_DAMAGED`).
   - Em `GameEngine.tick()` após `movementSystem.update()`: broadcast `ENTITY_UPDATE` para players que se moveram (tracking pelo MovementSystem).

   **Solução final recomendada (mínimo acoplamento):**

   a. Modificar `MovementSystem` para expor `getRecentlyMoved(): string[]` (ids de players que se moveram no último tick).

   b. Em `GameEngine.tick()`, após `movementSystem.update()`:
   ```ts
   const movedPlayers = this.movementSystem.getRecentlyMoved();
   for (const playerId of movedPlayers) {
     const player = this.world.getPlayer(playerId);
     if (player && this.server) {
       this.server.broadcastToMap(player.mapId, {
         type: 'ENTITY_UPDATE',
         entity: player.toJSON(),
       });
     }
   }
   ```

   c. Em `GameEngine.tick()`, após processar ataques de monstros (já existe broadcast de `ENTITY_DAMAGED`), adicionar broadcast de `ENTITY_UPDATE` para o monstro atacante e player alvo:
   ```ts
   // Após processMonsterAttack result:
   const monster = this.world.getMonster(result.monsterId);
   if (monster && this.server) {
     this.server.broadcastToMap(monster.mapId, {
       type: 'ENTITY_UPDATE',
       entity: monster.toJSON(),
     });
   }
   // Também broadcast ENTITY_UPDATE para o player alvo (HP updated)
   const targetPlayer = this.world.getPlayer(result.targetId);
   if (targetPlayer && this.server) {
     this.server.broadcastToMap(targetPlayer.mapId, {
       type: 'ENTITY_UPDATE',
       entity: targetPlayer.toJSON(),
     });
   }
   ```

   d. Em `handlePlayerAttack` em `connection.ts` (ou no `GameEngine`), após `combatSystem.processAttack()`, broadcast `ENTITY_UPDATE` para o monstro alvo e player atacante.

3. **Importante**: Também broadcast `ENTITY_UPDATE` quando um monstro resspawna (já existe o loop de respawn em `tick()`):
   ```ts
   if (monster.shouldRespawn()) {
     monster.respawn();
     if (this.server) {
       this.server.broadcastToMap(monster.mapId, {
         type: 'ENTITY_UPDATE',
         entity: monster.toJSON(),
       });
     }
   }
   ```

### Critérios de Aceitação
- [ ] Quando um monstro toma dano, todos os players no mesmo mapa recebem `ENTITY_UPDATE` com o novo HP
- [ ] Quando um monstro resspawna, `ENTITY_UPDATE` é broadcast
- [ ] Quando um player se move, `ENTITY_UPDATE` é broadcast para outros players no mapa
- [ ] Teste existente `game-engine.test.ts` continua passando
- [ ] Nenhum loop infinito ou broadcast excessivo

---

## 🟥 P0.6 — Bug #63: PLAYER_ATTACK só envia resultado para o atacante

### Descrição
Quando um jogador ataca, o resultado (`ENTITY_DAMAGED`) é enviado **apenas** para o atacante. Outros jogadores no mesmo mapa não veem o dano, o HP do monstro não atualiza para eles, etc.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/server/src/network/handlers/connection.ts` | ✏️ Modificar |
| `packages/server/src/network/server.ts` | ✏️ Modificar (passar `server` para `handleConnection`) |
| `packages/server/src/index.ts` | ✏️ Modificar (passar `server`) |

### Complexidade
**Baixa** — Adicionar parâmetro `server` e chamar `broadcastToMap`.

### Dependências Técnicas
- `packages/server/src/network/server.ts` (método `broadcastToMap` já existe)
- `packages/server/src/network/handlers/connection.ts`

### Passos de Implementação

1. **Modificar `server.ts`** para passar a referência do servidor ao handler:

   ```ts
   // Em server.ts constructor ou setupWebSocket:
   handleConnection(ws, socketData, this.world, this);
   ```

2. **Modificar `connection.ts`**:
   ```ts
   import { Server } from '../server.js';

   export function handleConnection(ws: WebSocket, socketData: SocketData, world: World, server: Server): void {
     // ... existente, passar server para routePacket e handlePlayerAttack
   }
   ```

3. **Modificar `handlePlayerAttack`** para aceitar `server: Server` e broadcast:

   ```ts
   function handlePlayerAttack(
     ws: WebSocket,
     socketData: SocketData,
     packet: ClientPacket & { type: 'PLAYER_ATTACK' },
     world: World,
     server: Server,  // NOVO
   ): void {
     // ... existente ...

     if (!result.success) {
       sendMessage(ws, { type: 'ERROR', ... });
       return;
     }

     // NOVO: broadcast ENTITY_DAMAGED para todos no mapa
     const damagedPacket: ServerPacket = {
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
     server.broadcastToMap(player.mapId, damagedPacket);

     // Também enviar ENTITY_UPDATE para o alvo (se for monstro, HP mudou)
     const target = world.getMonster(result.targetId!) || world.getPlayer(result.targetId!);
     if (target) {
       server.broadcastToMap(player.mapId, {
         type: 'ENTITY_UPDATE',
         entity: target.toJSON(),
       });
     }
   }
   ```

4. **Atualizar todas as chamadas para `handlePlayerAttack`** na função `routePacket`.

5. **Remover o `sendMessage` individual** que enviava apenas ao atacante (agora substituído pelo `broadcastToMap` — o atacante também está no mapa, então também receberá). Ou manter ambos se quiser garantir entrega imediata ao atacante.

### Critérios de Aceitação
- [ ] Quando player A ataca monstro M, player B (no mesmo mapa) recebe `ENTITY_DAMAGED`
- [ ] Player B também recebe `ENTITY_UPDATE` com o novo HP do monstro
- [ ] A performance não é impactada (broadcast é O(n) por mapa)
- [ ] `ENTITY_DAMAGED` chega também para o atacante

---

## 🟧 P1.1 — GraphicsEngine (implementação cliente)

### Descrição
Implementação concreta de `IGraphicsEngine` no cliente, encapsulando `Camera`, `AssetManager`, `TilemapRenderer`, `PlaceholderGraphics`, `CombatFeedbackManager` e `MovementInterpolator`. Aplica Strangler Fig: o `Game.ts` existente continua funcionando, mas a nova engine é injetada e usada progressivamente.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/client/src/engines/GraphicsEngine.ts` | 🆕 Criar |
| `packages/client/src/engines/index.ts` | 🆕 Criar (reexport) |
| `packages/client/src/core/Game.ts` | ✏️ Modificar (injetar GraphicsEngine) |

### Complexidade
**Alta** — Deve integrar múltiplos sistemas existentes e manter compatibilidade.

### Dependências Técnicas
- `P0.1` (`IGraphicsEngine`)
- `packages/client/src/core/Camera.ts`
- `packages/client/src/core/AssetManager.ts`
- `packages/client/src/maps/TilemapRenderer.ts`
- `packages/client/src/ui/PlaceholderGraphics.ts`
- `packages/client/src/ui/combat/CombatFeedbackManager.ts`
- `packages/client/src/systems/MovementInterpolator.ts`

### Passos de Implementação

1. **Criar `packages/client/src/engines/` diretório**

2. **Criar `GraphicsEngine.ts`**:
   ```ts
   import { Container } from 'pixi.js';
   import type { IGraphicsEngine, IEntity, IMapData } from '@arcan-gods/shared';
   import { Camera } from '../core/Camera.js';
   import { AssetManager } from '../core/AssetManager.js';
   import { TilemapRenderer } from '../maps/TilemapRenderer.js';
   import { PlaceholderGraphics } from '../ui/PlaceholderGraphics.js';
   import { CombatFeedbackManager } from '../ui/combat/CombatFeedbackManager.js';
   import { MovementInterpolator } from '../systems/MovementInterpolator.js';

   export class GraphicsEngine implements IGraphicsEngine {
     private camera: Camera;
     private assetManager: AssetManager;
     private tilemapRenderer: TilemapRenderer;
     private combatFeedbackManager: CombatFeedbackManager;
     private movementInterpolator: MovementInterpolator;
     private worldContainer: Container;
     private playerEntities: Map<string, Container>;

     constructor(
       worldContainer: Container,
       camera: Camera,
       assetManager: AssetManager,
       tilemapRenderer: TilemapRenderer,
       combatFeedbackManager: CombatFeedbackManager,
       movementInterpolator: MovementInterpolator,
     ) {
       // ... store all deps
     }

     // Implementar todos os métodos de IGraphicsEngine delegando para os sistemas internos
   }
   ```

3. **Métodos a implementar** (delegação para sistemas existentes):

   | Método IGraphicsEngine | Delega para |
   |------------------------|-------------|
   | `init()` | `this.assetManager.init()` |
   | `follow(entityId)` | `this.camera.follow(entity)` + lookup |
   | `unfollow()` | `this.camera.unfollow()` |
   | `screenToWorld(x, y)` | `this.camera.screenToWorld(x, y)` |
   | `setScreenSize(w, h)` | `this.camera.setScreenSize(w, h)` |
   | `snapToTarget()` | `this.camera.snapToTarget()` |
   | `renderMap(data)` | `this.tilemapRenderer.renderFromMapData(data)` |
   | `clearScene()` | `this.tilemapRenderer.clear()` |
   | `addEntity(entity)` | Usar `PlaceholderGraphics.createPlayer/Monster/NPC` |
   | `updateEntityPosition(id, x, y)` | Atualizar container + `combatFeedbackManager.updateEntityPosition` |
   | `removeEntity(id)` | Remover container + `combatFeedbackManager.removeEntity` |
   | `showDamage(...)` | `this.combatFeedbackManager.onEntityDamaged(...)` |
   | `showHealthBar(id, hp, maxHp)` | `this.combatFeedbackManager.onEntityDamaged(...)` (com damage 0) |
   | `update(deltaSec)` | `this.movementInterpolator.update(deltaSec)` + `this.camera.update()` |

4. **Modificar `Game.ts`**:
   - Adicionar propriedade `graphicsEngine: GraphicsEngine`
   - Injetar dependências no constructor
   - Substituir chamadas diretas a `camera`, `assetManager`, `tilemapRenderer`, etc. por chamadas `graphicsEngine.*`
   - **Estratégia Strangler Fig**: Manter campos `public` existentes (para não quebrar outros consumers), mas usar a engine internamente

5. **Criar `engines/index.ts`**:
   ```ts
   export { GraphicsEngine } from './GraphicsEngine.js';
   ```

### Critérios de Aceitação
- [ ] `GraphicsEngine` implementa `IGraphicsEngine` (TypeScript strict)
- [ ] Todas as dependências recebidas por injeção no constructor
- [ ] `Game.ts` continua funcionando (jogo inicia, renderiza, responde a inputs)
- [ ] Nenhuma funcionalidade existente quebrada
- [ ] `PlaceholderGraphics.setTextureCache` ainda é chamado

---

## 🟧 P1.2 — GameplayEngine (implementação servidor)

### Descrição
Implementação concreta de `IGameplayEngine` no servidor, encapsulando `CombatSystem`, `MovementSystem`, `CollisionSystem` e lógica de gameplay do `GameEngine`.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/server/src/engines/GameplayEngine.ts` | 🆕 Criar |
| `packages/server/src/engines/index.ts` | 🆕 Criar (reexport) |
| `packages/server/src/game/GameEngine.ts` | ✏️ Modificar (usar IGameplayEngine) |
| `packages/server/src/game/World.ts` | ✏️ Modificar (remover set/get systems duplicados) |
| `packages/server/src/index.ts` | ✏️ Modificar (injetar GameplayEngine) |

### Complexidade
**Alta** — Deve unificar 3 sistemas (Combat, Movement, Collision) em uma única interface.

### Dependências Técnicas
- `P0.2` (`IGameplayEngine`)
- `packages/server/src/game/systems/CombatSystem.ts`
- `packages/server/src/game/systems/MovementSystem.ts`
- `packages/server/src/game/systems/CollisionSystem.ts`
- `packages/server/src/game/World.ts`

### Passos de Implementação

1. **Criar `packages/server/src/engines/GameplayEngine.ts`**:

   ```ts
   import type { IGameplayEngine, AttackResult, MoveResult, CollisionResult, Waypoint } from '@arcan-gods/shared';
   import { CombatSystem } from '../game/systems/CombatSystem.js';
   import { MovementSystem } from '../game/systems/MovementSystem.js';
   import { CollisionSystem } from '../game/systems/CollisionSystem.js';
   import { World } from '../game/World.js';

   export class GameplayEngine implements IGameplayEngine {
     constructor(
       private world: World,
       private combatSystem: CombatSystem,
       private movementSystem: MovementSystem,
       private collisionSystem: CollisionSystem,
     ) {}

     // Implementar todos os métodos delegando
     processAttack(attackerId: string, targetId: string): AttackResult {
       return this.combatSystem.processAttack(attackerId, targetId);
     }
     // ... etc
   }
   ```

2. **Métodos a implementar**:

   | Método | Delega para |
   |--------|-------------|
   | `processAttack` | `combatSystem.processAttack` |
   | `processMonsterAttack` | `combatSystem.processMonsterAttack` |
   | `getAttackCooldownRemaining` | Calcular via `combatSystem.lastAttackTime` (expor método) |
   | `startMove` | `movementSystem.startPlayerMove` |
   | `stopMove` | `movementSystem.stopPlayerMove` |
   | `isMoving` | `movementSystem.isMoving` |
   | `getActivePath` | `movementSystem.getActivePath` |
   | `canMoveTo` | `collisionSystem.canMoveTo` |
   | `tryMove` | `collisionSystem.tryMove` |
   | `isPathWalkable` | `collisionSystem.isPathWalkable` |
   | `update` | `movementSystem.update` + lógica de stamina regen do GameEngine |

3. **Modificar `GameEngine.ts`** (Strangler Fig):
   - Adicionar campo `private gameplayEngine: IGameplayEngine | null = null`
   - Adicionar `setGameplayEngine(engine: IGameplayEngine): void`
   - No `tick()`, substituir chamadas diretas a `movementSystem`, `combatSystem` por `gameplayEngine.*`
   - Manter compatibilidade: se `gameplayEngine` é null, usar caminho antigo

4. **Modificar `World.ts`**:
   - Manter os setters/getters por enquanto (compatibilidade), mas marcar como `@deprecated`
   - Adicionar `@deprecated` JSDoc nos métodos `setMovementSystem`, `setCombatSystem`, etc.

5. **Modificar `packages/server/src/index.ts`**:
   ```ts
   const gameplayEngine = new GameplayEngine(world, combatSystem, movementSystem, collisionSystem);
   engine.setGameplayEngine(gameplayEngine);
   ```

### Critérios de Aceitação
- [ ] `GameplayEngine` implementa `IGameplayEngine`
- [ ] Todas as dependências injetadas no constructor
- [ ] `GameEngine.tick()` funciona com e sem `gameplayEngine` (backward compat)
- [ ] Testes existentes passam
- [ ] Combate, movimento e colisão continuam funcionando (teste manual + integração)

---

## 🟧 P1.3 — MapEngine (implementação servidor)

### Descrição
Implementação concreta de `IMapEngine` no servidor, encapsulando `MapManager`, `CollisionGrid` e `TilemapLoader`.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/server/src/engines/MapEngine.ts` | 🆕 Criar |
| `packages/server/src/engines/index.ts` | ✏️ Modificar (add export) |

### Complexidade
**Média** — Wrapper direto sobre MapManager existente.

### Dependências Técnicas
- `P0.4` (`IMapEngine`)
- `packages/server/src/game/tilemap/MapManager.ts`
- `packages/server/src/game/tilemap/CollisionGrid.ts`

### Passos de Implementação

1. **Criar `MapEngine.ts`**:

   ```ts
   import type { IMapEngine, ITileMap, ICollisionGrid, ISpawnPoint, IPortal } from '@arcan-gods/shared';
   import { MapManager } from '../game/tilemap/MapManager.js';

   export class MapEngine implements IMapEngine {
     constructor(private mapManager: MapManager) {}

     loadMap(mapId: string): boolean {
       try {
         this.mapManager.loadMap(mapId);
         return true;
       } catch {
         return false;
       }
     }

     isMapLoaded(mapId: string): boolean {
       return this.mapManager.getLoadedMaps().includes(mapId);
     }

     getLoadedMaps(): string[] {
       return this.mapManager.getLoadedMaps();
     }

     unloadMap(mapId: string): void {
       // MapManager doesn't support unloading yet - no-op for now
     }

     getMapData(mapId: string): ITileMap | null {
       try {
         return this.mapManager.getMapData(mapId);
       } catch {
         return null;
       }
     }

     getCollisionGrid(mapId: string): ICollisionGrid | null {
       const grid = this.mapManager.getGrid(mapId);
       return {
         width: grid.getWidth(),
         height: grid.getHeight(),
         data: grid.getData(),
       };
     }

     getDefaultSpawn(mapId: string): { x: number; y: number } | null {
       try {
         return this.mapManager.getDefaultSpawn(mapId);
       } catch {
         return null;
       }
     }

     getSpawnPoints(mapId: string): ISpawnPoint[] {
       try {
         const mapData = this.mapManager.getMapData(mapId);
         return mapData.spawnPoints;
       } catch {
         return [];
       }
     }

     getPortalAt(mapId: string, x: number, y: number): IPortal | null {
       return this.mapManager.getPortalAt(mapId, x, y);
     }

     isInBounds(mapId: string, x: number, y: number): boolean {
       const grid = this.mapManager.getGrid(mapId);
       return grid.isInBounds(x, y);
     }

     isWalkable(mapId: string, x: number, y: number): boolean {
       const grid = this.mapManager.getGrid(mapId);
       return grid.isWalkable(x, y);
     }

     // Editor methods - not implemented yet
     setTile(_mapId: string, _x: number, _y: number, _walkable: boolean): void {
       throw new Error('Not implemented');
     }
     addPortal(_mapId: string, _portal: IPortal): void {
       throw new Error('Not implemented');
     }
     removePortal(_mapId: string, _portalId: string): void {
       throw new Error('Not implemented');
     }
   }
   ```

2. **Adicionar métodos necessários ao `CollisionGrid`** (se não existirem):
   - `getWidth(): number`
   - `getHeight(): number`
   - `getData(): boolean[][]`

3. **Atualizar `engines/index.ts`** do servidor.

### Critérios de Aceitação
- [ ] `MapEngine` implementa `IMapEngine`
- [ ] `MapManager` injetado no constructor
- [ ] Mapas carregam e collision grid é acessível
- [ ] Portais e spawn points funcionam
- [ ] Editor methods lançam `Error('Not implemented')` como esperado

---

## 🟧 P1.4 — StoryEngine (implementação servidor)

### Descrição
Implementação concreta de `IStoryEngine` no servidor. Sistema novo de quests e diálogos com estado em memória.

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/server/src/engines/StoryEngine.ts` | 🆕 Criar |
| `packages/server/src/engines/index.ts` | ✏️ Modificar (add export) |
| `packages/server/src/data/quests.ts` | 🆕 Criar (quest definitions) |
| `packages/server/src/data/dialogues.ts` | 🆕 Criar (dialogue trees) |

### Complexidade
**Média** — Implementação nova, sem refatoração de código existente.

### Dependências Técnicas
- `P0.3` (`IStoryEngine`)
- Nenhum sistema existente (é novo)

### Passos de Implementação

1. **Criar `StoryEngine.ts`**:

   ```ts
   import type {
     IStoryEngine,
     QuestDefinition,
     QuestState,
     ObjectiveProgress,
     QuestResult,
     DialogueNode,
     QuestStatus,
   } from '@arcan-gods/shared';

   interface PlayerQuestData {
     playerId: string;
     quests: Map<string, QuestState>;
   }

   export class StoryEngine implements IStoryEngine {
     private questDefinitions: Map<string, QuestDefinition> = new Map();
     private playerQuestData: Map<string, PlayerQuestData> = new Map();
     private dialogueTrees: Map<string, DialogueNode> = new Map();

     constructor() {
       this.loadDefinitions();
       this.loadDialogues();
     }

     // --- Quest Definitions ---
     private loadDefinitions(): void {
       // TODO: load from quests.ts data files
       // For now, register sample quests
       this.registerQuest({ ... });
     }

     registerQuest(definition: QuestDefinition): void {
       this.questDefinitions.set(definition.id, definition);
     }

     getQuestDefinition(questId: string): QuestDefinition | null {
       return this.questDefinitions.get(questId) ?? null;
     }

     getAvailableQuests(playerId: string): QuestDefinition[] {
       const playerData = this.getOrCreatePlayerData(playerId);
       return Array.from(this.questDefinitions.values()).filter(q => {
         // Check level requirement
         // Check prerequisites
         // Check not already active/completed
         return true; // simplified
       });
     }

     // --- Quest Lifecycle ---

     startQuest(playerId: string, questId: string): QuestResult {
       const def = this.questDefinitions.get(questId);
       if (!def) return { success: false, error: 'Quest not found' };

       const playerData = this.getOrCreatePlayerData(playerId);
       if (playerData.quests.has(questId)) {
         return { success: false, error: 'Quest already started or completed' };
       }

       const state: QuestState = {
         questId,
         status: 'active',
         objectives: def.objectives.map(obj => ({
           objectiveId: obj.id,
           current: 0,
           complete: false,
         })),
         startedAt: Date.now(),
       };

       playerData.quests.set(questId, state);
       return { success: true, questState: state };
     }

     advanceObjective(playerId: string, questId: string, objectiveId: string, amount: number = 1): QuestResult {
       // ... find quest, find objective, increment, check completion
     }

     completeQuest(playerId: string, questId: string): QuestResult {
       // ... validate all objectives complete, grant rewards
     }

     // --- Queries ---

     getActiveQuests(playerId: string): QuestState[] {
       // filter status === 'active'
     }

     getCompletedQuests(playerId: string): QuestState[] {
       // filter status === 'completed'
     }

     getQuestProgress(playerId: string, questId: string): QuestState | null {
       return this.getOrCreatePlayerData(playerId).quests.get(questId) ?? null;
     }

     // --- Dialogue ---

     getDialogue(npcId: string): DialogueNode | null {
       return this.dialogueTrees.get(npcId) ?? null;
     }

     selectDialogueOption(npcId: string, optionId: string): DialogueNode | null {
       const node = this.dialogueTrees.get(npcId);
       if (!node) return null;
       const option = node.options.find(o => o.id === optionId);
       if (!option) return null;
       // Execute actions if any
       if (option.actions) {
         for (const action of option.actions) {
           // handle action types
         }
       }
       // Return next node
       return option.nextDialogueId ? this.getDialogue(option.nextDialogueId) : null;
     }

     // --- Update ---
     update(_deltaMs: number): void {
       // Future: check timed quests, auto-fail, etc.
     }

     private getOrCreatePlayerData(playerId: string): PlayerQuestData {
       let data = this.playerQuestData.get(playerId);
       if (!data) {
         data = { playerId, quests: new Map() };
         this.playerQuestData.set(playerId, data);
       }
       return data;
     }
   }
   ```

2. **Criar `packages/server/src/data/quests.ts`** com quest definitions iniciais:
   ```ts
   import type { QuestDefinition } from '@arcan-gods/shared';

   export const QUEST_DEFINITIONS: QuestDefinition[] = [
     {
       id: 'intro_kill_spiders',
       name: 'Caça às Aranhas',
       description: 'Elimine 5 aranhas nos arredores de Lorencia.',
       levelRequired: 1,
       prerequisites: [],
       objectives: [
         {
           id: 'kill_spiders',
           type: 'kill',
           targetId: 'spider',
           quantity: 5,
           description: 'Mate 5 aranhas',
         },
       ],
       rewards: {
         experience: 100,
         gold: 50,
       },
     },
   ];
   ```

3. **Criar `packages/server/src/data/dialogues.ts`** com árvores de diálogo iniciais.

4. **Atualizar `engines/index.ts`** do servidor.

### Critérios de Aceitação
- [ ] `StoryEngine` implementa `IStoryEngine`
- [ ] Quests podem ser registradas, iniciadas e avançadas
- [ ] Diálogos funcionam (navegação por opções)
- [ ] Estado de quests é isolado por player
- [ ] Pelo menos uma quest de exemplo registrada
- [ ] Pelo menos uma árvore de diálogo de exemplo

---

## 🟨 P2.1 — Testes Unitários das Engines

### Descrição
Criar testes unitários para todas as 4 engines (interfaces e implementações).

### Arquivos

| Arquivo | Ação |
|---------|:----:|
| `packages/shared/src/engines/__tests__/IGraphicsEngine.test.ts` | 🆕 Criar |
| `packages/shared/src/engines/__tests__/IGameplayEngine.test.ts` | 🆕 Criar |
| `packages/shared/src/engines/__tests__/IStoryEngine.test.ts` | 🆕 Criar |
| `packages/shared/src/engines/__tests__/IMapEngine.test.ts` | 🆕 Criar |
| `packages/server/src/engines/__tests__/GameplayEngine.test.ts` | 🆕 Criar |
| `packages/server/src/engines/__tests__/MapEngine.test.ts` | 🆕 Criar |
| `packages/server/src/engines/__tests__/StoryEngine.test.ts` | 🆕 Criar |
| `packages/client/src/engines/__tests__/GraphicsEngine.test.ts` | 🆕 Criar |

### Complexidade
**Média**

### Dependências Técnicas
- P1.1, P1.2, P1.3, P1.4

---

## 🟨 P2.2 — Documentação de Arquitetura

### Descrição
Criar documento de arquitetura detalhando o design das engines.

### Arquivo

| Arquivo | Ação |
|---------|:----:|
| `docs/architecture/engines.md` | 🆕 Criar |

### Complexidade
**Baixa**

---

## Checklist de Arquivos Completo

### 🆕 Novos Arquivos (17)
```
packages/shared/src/engines/index.ts
packages/shared/src/engines/IGraphicsEngine.ts
packages/shared/src/engines/IGameplayEngine.ts
packages/shared/src/engines/IStoryEngine.ts
packages/shared/src/engines/IMapEngine.ts
packages/client/src/engines/index.ts
packages/client/src/engines/GraphicsEngine.ts
packages/server/src/engines/index.ts
packages/server/src/engines/GameplayEngine.ts
packages/server/src/engines/MapEngine.ts
packages/server/src/engines/StoryEngine.ts
packages/server/src/data/quests.ts
packages/server/src/data/dialogues.ts
docs/architecture/engines.md
packages/shared/src/engines/__tests__/*.test.ts (4 files)
packages/server/src/engines/__tests__/*.test.ts (3 files)
packages/client/src/engines/__tests__/GraphicsEngine.test.ts
```

### ✏️ Arquivos Modificados (7)
```
packages/shared/src/index.ts               → add engines export
packages/server/src/game/GameEngine.ts      → add ENTITY_UPDATE + GameplayEngine hooks
packages/server/src/game/World.ts           → add markDirty, deprecate old system setters
packages/server/src/index.ts                → inject engines
packages/server/src/network/server.ts       → pass server to handleConnection
packages/server/src/network/handlers/connection.ts → fix PLAYER_ATTACK broadcast + server param
packages/client/src/core/Game.ts            → inject GraphicsEngine
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:-----------:|:-------:|-----------|
| Quebrar compatibilidade com `Game.ts` | Média | Alto | Strangler Fig: manter campos públicos, engine é adicional |
| `GraphicsEngine` depender de PixiJS types na interface | Baixa | Alto | `IGraphicsEngine` usa apenas tipos primitivos/shared |
| Bug #62 causar broadcast excessivo | Média | Médio | Usar `dirtyEntities` set + broadcast apenas no fim do tick |
| `StoryEngine` sem persistência | Alta | Baixo | OK para P1; P3 adiciona DB persistence |
| `CollisionGrid` não expor `getWidth/getHeight/getData` | Baixa | Baixo | Adicionar métodos se necessário |

---

## Notas Finais

- **Strangler Fig**: Todo código existente deve continuar funcionando. As engines são adicionadas lado a lado.
- **Injeção de Dependência**: NENHUMA engine faz `import` direto de implementação concreta. Todas recebem dependências via constructor.
- **TypeScript Strict Mode**: Todos os arquivos novos devem passar com `strict: true`.
- **Paralelismo**: P0.1–P0.6 podem ser feitos em paralelo. P1.1–P1.4 dependem das interfaces P0.1–P0.4 respectivamente.
