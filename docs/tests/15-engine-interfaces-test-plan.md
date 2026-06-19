# Plano de Testes: Engine Interfaces & Implementations (Ciclo 05)

**Feature:** Engines Architecture — Interfaces em shared/ + Implementações P1 + Bug Fixes
**Issues:** #64, #65, #66, #67, #62, #63
**Dependências:** Types shared/ (entities, tilemap, movement, collision, packets)
**Estimativa Total:** ~76 testes + 10 integração + 4 E2E

---

## 1. Escopo

### O que será testado

- **Interfaces em `shared/`**: `IGraphicsEngine`, `IGameplayEngine`, `IStoryEngine`, `IMapEngine` como contratos puramente tipados
- **Tipos auxiliares**: `EngineCameraState`, `VisualEffect`, `AttackResult`, `MoveResult`, `CollisionCheckResult`, `QuestDefinition`, `QuestState`, `DialogueNode`, etc.
- **Implementações P1**:
  - `GraphicsEngine` (client) — encapsula Camera, AssetManager, TilemapRenderer, CombatFeedbackManager, MovementInterpolator
  - `GameplayEngine` (server) — encapsula CombatSystem, MovementSystem, CollisionSystem
  - `MapEngine` (server) — encapsula MapManager, CollisionGrid
  - `StoryEngine` (server) — quests, diálogos, estado por player
- **Bug #62**: ENTITY_UPDATE broadcast após dano, movimento, respawn
- **Bug #63**: PLAYER_ATTACK broadcast para todos no mapa
- **Exportação**: `@arcan-gods/shared` exporta corretamente todas as interfaces
- **Strangler Fig**: Engines são adicionadas sem quebrar compatibilidade existente
- **Editor methods** em IMapEngine lançam `NotImplementedError`

### O que NÃO será testado

- Implementação interna de sistemas já testados (CombatSystem, MovementSystem, etc.) — testamos apenas a delegação via engine
- Persistência de quests em banco de dados — P3 futuro
- Skills, buffs, loot, inventário — slots futuros nas interfaces
- Performance com centenas de engines rodando simultaneamente
- Testes de UI/HUD específicos (já cobertos em ciclos anteriores)

---

## 2. Testes Unitários — Interfaces (shared/)

### 2.1 IGraphicsEngine → Mock Contract Verification

> **Propósito**: Verificar que a interface `IGraphicsEngine` define corretamente todos os métodos com tipos compatíveis. Testes com mock implementation garantem que o contrato é implementável sem dependências de runtime.

- [ ] **UI-GE-001: Mock implementa IGraphicsEngine sem erros de tipo**
  - Input: Criar classe mock `class MockGraphicsEngine implements IGraphicsEngine`
  - Expected: Compilação TypeScript passa (strict mode), todos os métodos obrigatórios implementados

- [ ] **UI-GE-002: Camera methods retornam tipos corretos**
  - Input: Mock onde `follow('player-1')`, `unfollow()`, `screenToWorld(100, 200)`, `getCameraState()`, `snapToTarget()`, `setScreenSize(1920, 1080)`
  - Expected: `getCameraState()` retorna `EngineCameraState { x, y, zoom }`, `screenToWorld` retorna `{ x: number, y: number }`

- [ ] **UI-GE-003: Asset management methods aceitam e retornam tipos corretos**
  - Input: `init()` retorna `Promise<void>`, `preloadAssets(['tile1', 'tile2'])` retorna `Promise<void>`, `getAsset('someAsset')` retorna `unknown`
  - Expected: Tipos correspondem exatamente ao contrato

- [ ] **UI-GE-004: Entity rendering methods aceitam IEntity e coordenadas**
  - Input: `addEntity(mockPlayer as IEntity)`, `updateEntityPosition('player-1', 100, 200)`, `removeEntity('player-1')`, `clearEntities()`
  - Expected: Nenhum erro de tipo, métodos aceitam os parâmetros definidos

- [ ] **UI-GE-005: Combat feedback methods aceitam damage params completos**
  - Input: `showDamage('target-1', 50, true, 100, 200, 30, 100)`, `showHealthBar('id', 75, 100)`, `updateHealthBarPosition('id', 50, 60)`, `removeHealthBar('id')`
  - Expected: Todos os parâmetros obrigatórios aceitos, sem erro de tipo

- [ ] **UI-GE-006: RenderMap aceita IMapData e { collisionGrid }**
  - Input: `renderMap(mockMapData as IMapData)`, `renderMap({ collisionGrid: [[true, false]] })`
  - Expected: Ambos os overloads/signatures compilam

- [ ] **UI-GE-007: Update method aceita deltaSeconds**
  - Input: `update(0.016)` (≈ 60fps), `update(0)`, `update(-1)` (negativo)
  - Expected: Parâmetro `deltaSec: number` aceito, retorno `void`

- [ ] **UI-GE-008: Interface NÃO importa tipos de runtime (PixiJS, cliente)**
  - Input: Inspecionar `IGraphicsEngine.ts` e seus imports
  - Expected: Apenas tipos de `shared/src/types/` e tipos primitivos. NENHUM import de `pixi.js`, `@pixi/*`, ou módulos de client/server

- [ ] **UI-GE-009: EngineCameraState tem shape correto**
  - Input: Criar `EngineCameraState { x: 0, y: 0, zoom: 1 }`
  - Expected: `x: number`, `y: number`, `zoom: number`

- [ ] **UI-GE-010: VisualEffect tem shape correto**
  - Input: Criar `VisualEffect { id: 'vfx-1', type: 'explosion', x: 100, y: 200, duration: 1000, elapsed: 0 }`
  - Expected: 6 campos com tipos corretos (id, type, x, y, duration, elapsed — todos number exceto id/type string)

---

### 2.2 IGameplayEngine → Mock Contract Verification

- [ ] **UI-GP-001: Mock implementa IGameplayEngine sem erros**
  - Input: `class MockGameplayEngine implements IGameplayEngine`
  - Expected: Compilação TypeScript strict passa

- [ ] **UI-GP-002: AttackResult tem shape correto**
  - Input: `AttackResult { success: true, damage: 50, isCritical: true, targetId: 'monster-1', targetHp: 30, targetMaxHp: 100, killed: true, expGain: 20, goldGain: 5 }`
  - Expected: Todos os campos opcionais aceitam undefined. `success: boolean` é obrigatório. `error?: string` aceita undefined

- [ ] **UI-GP-003: MoveResult tem shape correto**
  - Input: `MoveResult { success: true, path: [{ x: 0, y: 0 }, { x: 5, y: 0 }] }` e `MoveResult { success: false, error: 'Path blocked' }`
  - Expected: Ambos os shapes compilam. `path?: Waypoint[]` é opcional

- [ ] **UI-GP-004: CollisionCheckResult tem shape correto**
  - Input: `CollisionCheckResult { walkable: true, inBounds: true }`
  - Expected: Ambos os campos são `boolean` obrigatórios

- [ ] **UI-GP-005: Combat methods delegam tipos corretamente**
  - Input: `processAttack('player-1', 'monster-1')` retorna `AttackResult`, `processMonsterAttack('monster-1', 'player-1')` retorna `AttackResult`, `getAttackCooldownRemaining('player-1')` retorna `number`
  - Expected: Tipos de retorno correspondem ao contrato

- [ ] **UI-GP-006: Movement methods aceitam parâmetros corretos**
  - Input: `startMove('player-1', 100, 200, 'lorencia')` → `MoveResult`, `stopMove('player-1')` → `void`, `isMoving('player-1')` → `boolean`, `getActivePath('player-1')` → `Waypoint[] | undefined`
  - Expected: Tipos de entrada e saída exatos

- [ ] **UI-GP-007: Collision methods aceitam parâmetros corretos**
  - Input: `canMoveTo('lorencia', 10, 20)` → `boolean`, `tryMove('lorencia', 5, 5, 10, 10)` → `CollisionResult`, `isPathWalkable('lorencia', [{x:0,y:0},{x:1,y:1}])` → `boolean`
  - Expected: `tryMove` usa `CollisionResult` de `shared/src/types/collision.ts`, não um tipo próprio

- [ ] **UI-GP-008: Update method aceita deltaMs e tickCount**
  - Input: `update(16, 1000)` (16ms, tick 1000)
  - Expected: `deltaMs: number`, `tickCount: number`

- [ ] **UI-GP-009: Interface NÃO importa World, GameEngine ou runtime do servidor**
  - Input: Inspecionar imports de `IGameplayEngine.ts`
  - Expected: Apenas types de `shared/` (`entities`, `movement`, `collision`, `damage-formulas`). Nenhum import de `server/` ou `game/`

- [ ] **UI-GP-010: Métodos aceitam entityId como string genérica**
  - Input: `processAttack('any-string-id', 'any-target-id')`
  - Expected: Não há restrição de formato de ID — qualquer string é aceita

---

### 2.3 IStoryEngine → Mock Contract Verification

- [ ] **UI-SE-001: Mock implementa IStoryEngine sem erros**
  - Input: `class MockStoryEngine implements IStoryEngine`
  - Expected: Compilação TypeScript strict passa

- [ ] **UI-SE-002: QuestDefinition tem shape correto**
  - Input: `QuestDefinition { id: 'q_001', name: 'Test', description: '...', levelRequired: 1, prerequisites: [], objectives: [{ id: 'obj1', type: 'kill', targetId: 'spider', quantity: 5, description: 'Kill 5' }], rewards: { experience: 100, gold: 50 } }`
  - Expected: `nextQuestId?: string` opcional. `rewards.items?: Array<{itemId, quantity}>` opcional. `prerequisites` pode ser vazio

- [ ] **UI-SE-003: QuestState tem shape correto**
  - Input: `QuestState { questId: 'q_001', status: 'active', objectives: [{ objectiveId: 'obj1', current: 3, complete: false }], startedAt: 1000, completedAt: 2000 }`
  - Expected: `completedAt?: number` opcional. `status` é `QuestStatus`. `objectives` nunca vazio

- [ ] **UI-SE-004: QuestStatus aceita todos os 5 estados**
  - Input: `'locked' | 'available' | 'active' | 'completed' | 'failed'`
  - Expected: Todos os 5 são válidos. Qualquer outra string causa erro de tipo

- [ ] **UI-SE-005: ObjectiveType aceita todos os 5 tipos**
  - Input: `'kill' | 'collect' | 'talk' | 'explore' | 'escort'`
  - Expected: Todos os 5 são válidos. `'gather'` ou `'defend'` causam erro de tipo

- [ ] **UI-SE-006: Quest management methods retornam QuestResult**
  - Input: `getQuestDefinition('q_001')` → `QuestDefinition | null`, `getAvailableQuests('player-1')` → `QuestDefinition[]`, `startQuest('player-1', 'q_001')` → `QuestResult`, `advanceObjective('player-1', 'q_001', 'obj1', 1)` → `QuestResult`, `completeQuest('player-1', 'q_001')` → `QuestResult`
  - Expected: QuestResult contém `success`, `error?`, `questState?`, `rewards?`

- [ ] **UI-SE-007: Quest query methods retornam arrays**
  - Input: `getActiveQuests('player-1')` → `QuestState[]`, `getCompletedQuests('player-1')` → `QuestState[]`, `getQuestProgress('player-1', 'q_001')` → `QuestState | null`
  - Expected: Arrays podem ser vazios. `getQuestProgress` pode retornar `null` para quest não encontrada

- [ ] **UI-SE-008: DialogueNode e DialogueOption têm shapes corretos**
  - Input: `DialogueNode { id: 'd1', npcId: 'npc_guild', text: 'Hello!', options: [{ id: 'opt1', text: 'Tell me more', nextDialogueId: 'd2', requirements: { level: 5 }, actions: [{ type: 'start_quest', target: 'q_001' }] }] }`
  - Expected: `DialogueOption.nextDialogueId?` opcional, `requirements?` opcional, `actions?` opcional

- [ ] **UI-SE-009: Dialogue methods retornam DialogueNode | null**
  - Input: `getDialogue('npc_guild')` → `DialogueNode | null`, `selectDialogueOption('npc_guild', 'opt1')` → `DialogueNode | null`
  - Expected: Ambos podem retornar `null` (npc sem diálogo, opção inválida)

- [ ] **UI-SE-010: Interface NÃO depende de runtime**
  - Input: Inspecionar imports
  - Expected: Tipos inline definidos no próprio arquivo. NENHUM import externo (além de tipos primitivos)

---

### 2.4 IMapEngine → Mock Contract Verification

- [ ] **UI-ME-001: Mock implementa IMapEngine sem erros**
  - Input: `class MockMapEngine implements IMapEngine`
  - Expected: Compilação TypeScript strict passa

- [ ] **UI-ME-002: Loading methods aceitam mapId string**
  - Input: `loadMap('lorencia')` → `boolean`, `isMapLoaded('lorencia')` → `boolean`, `getLoadedMaps()` → `string[]`, `unloadMap('lorencia')` → `void`
  - Expected: `loadMap` retorna `boolean` (sucesso/falha). `getLoadedMaps` pode retornar `[]`

- [ ] **UI-ME-003: Data access methods retornam dados do mapa**
  - Input: `getMapData('lorencia')` → `ITileMap | null`, `getCollisionGrid('lorencia')` → `ICollisionGrid | null`
  - Expected: Ambos retornam `null` para mapa não carregado. `ITileMap` e `ICollisionGrid` são de `shared/src/types/tilemap.ts`

- [ ] **UI-ME-004: Spawn point methods retornam coordenadas**
  - Input: `getDefaultSpawn('lorencia')` → `{ x: number, y: number } | null`, `getSpawnPoints('lorencia')` → `ISpawnPoint[]`
  - Expected: `getDefaultSpawn` retorna `null` se não há spawn configurado

- [ ] **UI-ME-005: Portal query aceita coordenadas**
  - Input: `getPortalAt('lorencia', 50, 100)` → `IPortal | null`
  - Expected: Retorna `null` se não há portal na posição. `IPortal` de `shared/src/types/tilemap.ts`

- [ ] **UI-ME-006: Collision queries retornam boolean**
  - Input: `isInBounds('lorencia', 10, 20)` → `boolean`, `isWalkable('lorencia', 10, 20)` → `boolean`
  - Expected: Ambos retornam boolean. Posição negativa: `isInBounds` deve retornar `false`

- [ ] **UI-ME-007: Editor methods NÃO estão implementados (NotImplementedError)**
  - Input: `setTile('lorencia', 0, 0, true)`, `addPortal('lorencia', mockPortal)`, `removePortal('lorencia', 'portal-1')`
  - Expected: Todos lançam `Error('Not implemented')` (ou similar). Tipos estão definidos, runtime lança erro

- [ ] **UI-ME-008: Interface usa ICollisionGrid de tilemap.ts**
  - Input: Verificar que `getCollisionGrid` retorna `ICollisionGrid` (que tem `width`, `height`, `data`)
  - Expected: `ICollisionGrid.width: number`, `.height: number`, `.data: boolean[][]`

- [ ] **UI-ME-009: Métodos são resilientes a mapId inválido**
  - Input: `loadMap('')`, `loadMap('non_existent')`, `getMapData('')`, `isWalkable('', 0, 0)`
  - Expected: Métodos retornam `false`/`null` sem lançar exceções (tratamento seguro)

- [ ] **UI-ME-010: Interface NÃO importa MapManager ou runtime do servidor**
  - Input: Inspecionar imports
  - Expected: Apenas tipos de `shared/src/types/tilemap.ts`. Nenhum import de `server/` ou `game/`

---

### 2.5 Exportação do shared/

- [ ] **UI-EX-001: `@arcan-gods/shared` exporta todas as interfaces**
  - Input: `import type { IGraphicsEngine, IGameplayEngine, IStoryEngine, IMapEngine } from '@arcan-gods/shared'`
  - Expected: Todos os 4 tipos são exportados. `import type { EngineCameraState, VisualEffect } from '@arcan-gods/shared'` também funciona

- [ ] **UI-EX-002: `@arcan-gods/shared` exporta tipos auxiliares das engines**
  - Input: `import type { AttackResult, MoveResult, CollisionCheckResult, QuestDefinition, QuestState, DialogueNode } from '@arcan-gods/shared'`
  - Expected: Todos os tipos auxiliares exportados

- [ ] **UI-EX-003: `@arcan-gods/shared` exporta QuestStatus e ObjectiveType**
  - Input: `import type { QuestStatus, ObjectiveType, ObjectiveProgress, QuestReward, QuestResult } from '@arcan-gods/shared'`
  - Expected: `QuestStatus` é união de strings, `ObjectiveProgress` tem `objectiveId`, `current`, `complete`

- [ ] **UI-EX-004: Barrel export não quebra exports existentes**
  - Input: Importar tipos antigos junto com os novos: `import type { IPlayer, IMonster, IEntity, IGraphicsEngine } from '@arcan-gods/shared'`
  - Expected: Todos os tipos antigos continuam disponíveis. Nenhum conflito de nome

---

## 3. Testes Unitários — Bug Fixes

### 3.1 Bug #62: ENTITY_UPDATE Broadcast

- [ ] **BU-62-001: MovementSystem.getRecentlyMoved() retorna IDs de players que se moveram**
  - Input: Player-1 move de (0,0) para (5,0), Player-2 não move
  - Steps: Executar `movementSystem.update()`, chamar `getRecentlyMoved()`
  - Expected: `['player-1']` no array, Player-2 não incluso

- [ ] **BU-62-002: GameEngine.tick() broadcast ENTITY_UPDATE para players que se moveram**
  - Input: GameEngine com server mock, player-1 move
  - Steps: 1 tick do engine
  - Expected: `server.broadcastToMap` chamado com `{ type: 'ENTITY_UPDATE', entity: player.toJSON() }`

- [ ] **BU-62-003: GameEngine.tick() broadcast ENTITY_UPDATE para monstro que tomou dano**
  - Input: Monstro sofre dano via combatSystem, HP alterado
  - Steps: 1 tick do engine após o dano
  - Expected: `server.broadcastToMap` chamado com ENTITY_UPDATE do monstro (novo HP)

- [ ] **BU-62-004: GameEngine.tick() broadcast ENTITY_UPDATE após respawn de monstro**
  - Input: Monstro morto com `shouldRespawn() === true`
  - Steps: Tick do engine, `monster.respawn()` executado
  - Expected: `server.broadcastToMap` chamado com ENTITY_UPDATE do monstro respawnado

- [ ] **BU-62-005: ENTITY_UPDATE não é broadcast para entidades que não mudaram**
  - Input: Tick sem nenhuma entidade modificada
  - Steps: Executar tick
  - Expected: `server.broadcastToMap` NÃO é chamado para ENTITY_UPDATE (sem broadcast desnecessário)

- [ ] **BU-62-006: ENTITY_UPDATE é broadcast apenas no mapa correto**
  - Input: Player-1 em 'lorencia' move, Player-2 em 'devias' não move
  - Steps: Tick do engine
  - Expected: `broadcastToMap('lorencia', ...)` chamado, `broadcastToMap('devias', ...)` NÃO chamado

- [ ] **BU-62-007: Múltiplas entidades sujas em um tick geram múltiplos broadcasts**
  - Input: 3 players se movem + 2 monstros tomam dano
  - Steps: 1 tick do engine
  - Expected: 5 chamadas de `broadcastToMap` para ENTITY_UPDATE

- [ ] **BU-62-008: Dirty entities set é limpo após broadcast**
  - Input: Tick com sujeira, broadcast executado
  - Steps: Próximo tick (sem mudanças), verificar broadcast
  - Expected: Nenhum broadcast extra no segundo tick

### 3.2 Bug #63: PLAYER_ATTACK Broadcast

- [ ] **BU-63-001: handlePlayerAttack broadcast ENTITY_DAMAGED para todos no mapa**
  - Input: Player-1 ataca monstro M em 'lorencia', Player-2 também em 'lorencia'
  - Steps: Processar `PLAYER_ATTACK` packet
  - Expected: `server.broadcastToMap('lorencia', packet)` chamado com `{ type: 'ENTITY_DAMAGED', ... }`

- [ ] **BU-63-002: ENTITY_DAMAGED contém todos os campos obrigatórios**
  - Input: Ataque bem-sucedido, dano = 50, crítico
  - Steps: Verificar packet broadcast
  - Expected: Packet contém `attackerId`, `targetId`, `damage`, `isCritical`, `isBlocked`, `targetHp`, `targetMaxHp`, `killed`, `expGain?`, `goldGain?`

- [ ] **BU-63-003: ENTITY_UPDATE para o alvo também é broadcast**
  - Input: Player-1 ataca monstro M (HP muda)
  - Steps: Após handlePlayerAttack
  - Expected: `broadcastToMap` chamado 2×: ENTITY_DAMAGED + ENTITY_UPDATE do monstro

- [ ] **BU-63-004: Ataque sem sucesso NÃO broadcast ENTITY_DAMAGED**
  - Input: `AttackResult.success = false` (ex: atacante morto, cooldown)
  - Steps: handlePlayerAttack processa
  - Expected: Apenas `sendMessage(ws, { type: 'ERROR', ... })` — NENHUM broadcast

- [ ] **BU-63-005: Ataque bem-sucedido também envia ENTITY_DAMAGED ao atacante**
  - Input: Player-1 (atacante) em 'lorencia'
  - Steps: Verificar que broadcastToMap inclui todos inclusive o atacante
  - Expected: Player-1 também recebe ENTITY_DAMAGED (via broadcast — atacante está no mesmo mapa)

- [ ] **BU-63-006: Performance: broadcast é O(n) por mapa, não O(n) global**
  - Input: 100 players em 'lorencia', ataque ocorre
  - Steps: Medir broadcast
  - Expected: `broadcastToMap` é chamado uma vez com o mapa — servidor itera apenas players em 'lorencia'

- [ ] **BU-63-007: ENTITY_UPDATE é broadcast também quando alvo é player (PvP futuro)**
  - Input: Player-1 ataca Player-3 (futuro PvP)
  - Steps: handlePlayerAttack
  - Expected: `broadcastToMap` com ENTITY_UPDATE de Player-3

---

## 4. Testes Unitários — Implementações (P1)

### 4.1 GraphicsEngine (Client)

- [ ] **IM-GE-001: GraphicsEngine implementa IGraphicsEngine**
  - Input: `class GraphicsEngine implements IGraphicsEngine`
  - Expected: TypeScript strict compila sem erros

- [ ] **IM-GE-002: Constructor recebe dependências por injeção**
  - Input: `new GraphicsEngine(worldContainer, camera, assetManager, tilemapRenderer, combatFeedbackManager, movementInterpolator)`
  - Expected: Todas as 6 dependências armazenadas como campos privados. Nenhuma criada via `new` dentro do constructor

- [ ] **IM-GE-003: init() delega para assetManager.init()**
  - Input: AssetManager mock com `init` spy
  - Steps: `await graphicsEngine.init()`
  - Expected: `assetManager.init()` chamado 1×

- [ ] **IM-GE-004: follow(entityId) delega para camera.follow(entity)**
  - Input: Camera mock, worldContainer com entity child
  - Steps: Se entity existe, `graphicsEngine.follow('player-1')`
  - Expected: `camera.follow()` chamado com o container da entidade

- [ ] **IM-GE-005: follow(entityId) com entidade inexistente não crasha**
  - Input: Nenhuma entidade com id 'invalid-id' no worldContainer
  - Steps: `graphicsEngine.follow('invalid-id')`
  - Expected: Nenhuma exceção — método é seguro (no-op ou log de warning)

- [ ] **IM-GE-006: screenToWorld delega para camera.screenToWorld**
  - Input: Camera mock, `camera.screenToWorld(100, 200)` retorna `{ x: 50, y: 100 }`
  - Steps: `graphicsEngine.screenToWorld(100, 200)`
  - Expected: Retorno idêntico ao da camera

- [ ] **IM-GE-007: renderMap delega para tilemapRenderer.renderFromMapData**
  - Input: TilemapRenderer mock, mapData arbitrário
  - Steps: `graphicsEngine.renderMap(mapData)`
  - Expected: `tilemapRenderer.renderFromMapData(mapData)` chamado 1×

- [ ] **IM-GE-008: clearScene delega para tilemapRenderer.clear()**
  - Input: TilemapRenderer mock
  - Steps: `graphicsEngine.clearScene()`
  - Expected: `tilemapRenderer.clear()` chamado 1×

- [ ] **IM-GE-009: addEntity cria container via PlaceholderGraphics e adiciona ao worldContainer**
  - Input: `IEntity` mock (player ou monster), `PlaceholderGraphics.createPlayer/Monster/NPC` retorna Container
  - Steps: `graphicsEngine.addEntity(entity)`
  - Expected: Container da entidade adicionado a `worldContainer`. Entidade registrada no `playerEntities` Map

- [ ] **IM-GE-010: updateEntityPosition atualiza container e notifica CombatFeedbackManager**
  - Input: Entity container em (0,0), nova posição (100, 200)
  - Steps: `graphicsEngine.updateEntityPosition('player-1', 100, 200)`
  - Expected: Container.x === 100, Container.y === 200. `combatFeedbackManager.updateEntityPosition('player-1', 100, 200)` chamado

- [ ] **IM-GE-011: removeEntity remove container e limpa health bar**
  - Input: Entity container existente
  - Steps: `graphicsEngine.removeEntity('player-1')`
  - Expected: Container removido de `worldContainer`. `combatFeedbackManager.removeEntity('player-1')` chamado

- [ ] **IM-GE-012: showDamage delega para CombatFeedbackManager**
  - Input: CombatFeedbackManager mock
  - Steps: `graphicsEngine.showDamage('monster-1', 50, true, 100, 200, 30, 100)`
  - Expected: `combatFeedbackManager.onEntityDamaged(...)` chamado com params corretos

- [ ] **IM-GE-013: update(deltaSec) executa MovementInterpolator e Camera**
  - Input: `movementInterpolator.update` spy, `camera.update` spy
  - Steps: `graphicsEngine.update(0.016)`
  - Expected: `movementInterpolator.update(0.016)` chamado, `camera.update()` chamado

- [ ] **IM-GE-014: update(deltaSec) com deltaSec = 0 não crasha**
  - Input: deltaSec = 0
  - Steps: `graphicsEngine.update(0)`
  - Expected: Nenhuma exceção. Interpolator e camera chamados com 0 normalmente

- [ ] **IM-GE-015: clearEntities remove todos os containers e limpa health bars**
  - Input: 3 entidades adicionadas
  - Steps: `graphicsEngine.clearEntities()`
  - Expected: worldContainer.children.length === 0 (apenas filhos da engine). `combatFeedbackManager.removeEntity` chamado 3×

### 4.2 GameplayEngine (Server)

- [ ] **IM-GP-001: GameplayEngine implementa IGameplayEngine**
  - Input: `class GameplayEngine implements IGameplayEngine`
  - Expected: TypeScript strict compila

- [ ] **IM-GP-002: Constructor recebe World + 3 sistemas por injeção**
  - Input: `new GameplayEngine(world, combatSystem, movementSystem, collisionSystem)`
  - Expected: 4 dependências armazenadas como campos privados

- [ ] **IM-GP-003: processAttack delega para combatSystem.processAttack**
  - Input: CombatSystem mock, `processAttack('p1', 'm1')` retorna `AttackResult`
  - Steps: `gameplayEngine.processAttack('p1', 'm1')`
  - Expected: Retorno idêntico. `combatSystem.processAttack('p1', 'm1')` chamado 1×

- [ ] **IM-GP-004: processMonsterAttack delega para combatSystem.processMonsterAttack**
  - Input: CombatSystem mock
  - Steps: `gameplayEngine.processMonsterAttack('m1', 'p1')`
  - Expected: `combatSystem.processMonsterAttack('m1', 'p1')` chamado

- [ ] **IM-GP-005: getAttackCooldownRemaining calcula corretamente**
  - Input: CombatSystem mock, `lastAttackTime` configurado
  - Steps: Calcular cooldown restante
  - Expected: Retorna número em ms (> 0 se em cooldown, <= 0 se disponível)

- [ ] **IM-GP-006: startMove delega para movementSystem.startPlayerMove**
  - Input: MovementSystem mock
  - Steps: `gameplayEngine.startMove('p1', 100, 200, 'lorencia')`
  - Expected: `movementSystem.startPlayerMove('p1', 100, 200)` chamado. `MoveResult` retornado

- [ ] **IM-GP-007: isMoving e getActivePath delegam para MovementSystem**
  - Input: MovementSystem mock, player movendo ou parado
  - Steps: `gameplayEngine.isMoving('p1')`, `gameplayEngine.getActivePath('p1')`
  - Expected: Retornos idênticos aos do MovementSystem

- [ ] **IM-GP-008: canMoveTo e tryMove delegam para CollisionSystem**
  - Input: CollisionSystem mock
  - Steps: `gameplayEngine.canMoveTo('lorencia', 10, 20)`, `gameplayEngine.tryMove('lorencia', 0, 0, 10, 10)`
  - Expected: Delegação correta para collisionSystem

- [ ] **IM-GP-009: isPathWalkable delega para collisionSystem.isPathWalkable**
  - Input: CollisionSystem mock, path curto
  - Steps: `gameplayEngine.isPathWalkable('lorencia', [{x:0,y:0},{x:1,y:0}])`
  - Expected: `collisionSystem.isPathWalkable('lorencia', path)` chamado

- [ ] **IM-GP-010: update(deltaMs, tickCount) executa movementSystem.update + stamina regen**
  - Input: MovementSystem mock, World com players
  - Steps: `gameplayEngine.update(16, 1000)`
  - Expected: `movementSystem.update()` chamado. Players parados têm stamina regenerada

### 4.3 MapEngine (Server)

- [ ] **IM-ME-001: MapEngine implementa IMapEngine**
  - Input: `class MapEngine implements IMapEngine`
  - Expected: TypeScript strict compila

- [ ] **IM-ME-002: Constructor recebe MapManager por injeção**
  - Input: `new MapEngine(mapManager)`
  - Expected: `mapManager` armazenado como campo privado

- [ ] **IM-ME-003: loadMap delega para mapManager.loadMap e retorna boolean**
  - Input: MapManager mock, `loadMap` sucesso
  - Steps: `mapEngine.loadMap('lorencia')`
  - Expected: Retorna `true`. `mapManager.loadMap('lorencia')` chamado

- [ ] **IM-ME-004: loadMap retorna false em caso de erro**
  - Input: MapManager mock, `loadMap` lança exceção
  - Steps: `mapEngine.loadMap('invalid')`
  - Expected: Retorna `false` (não propaga exceção)

- [ ] **IM-ME-005: isMapLoaded consulta MapManager corretamente**
  - Input: MapManager mock, `getLoadedMaps()` retorna `['lorencia']`
  - Steps: `mapEngine.isMapLoaded('lorencia')` vs `mapEngine.isMapLoaded('devias')`
  - Expected: `true` para lorencia, `false` para devias

- [ ] **IM-ME-006: getCollisionGrid constrói ICollisionGrid a partir do CollisionGrid do MapManager**
  - Input: MapManager mock, CollisionGrid com width=10, height=10, data boolean[][]
  - Steps: `mapEngine.getCollisionGrid('lorencia')`
  - Expected: Retorna `{ width: 10, height: 10, data: [...] }` com shape de `ICollisionGrid`

- [ ] **IM-ME-007: getDefaultSpawn retorna null quando não configurado**
  - Input: MapManager mock, `getDefaultSpawn` lança ou retorna undefined
  - Steps: `mapEngine.getDefaultSpawn('lorencia')`
  - Expected: Retorna `null` (não lança exceção)

- [ ] **IM-ME-008: getPortalAt retorna portal correto na posição**
  - Input: MapManager mock, portal em (50,50)
  - Steps: `mapEngine.getPortalAt('lorencia', 50, 50)`
  - Expected: Retorna `IPortal` com targetMap/targetX/targetY

- [ ] **IM-ME-009: isWalkable e isInBounds delegam para CollisionGrid**
  - Input: CollisionGrid mock com walkable definido
  - Steps: `mapEngine.isWalkable('lorencia', 5, 5)`, `mapEngine.isInBounds('lorencia', -1, -1)`
  - Expected: Boolean conforme grid. Fora dos bounds retorna `false`

- [ ] **IM-ME-010: Editor methods lançam Error('Not implemented')**
  - Input: Quaisquer parâmetros
  - Steps: Chamar `setTile`, `addPortal`, `removePortal`
  - Expected: `new Error('Not implemented')` lançado em todos

### 4.4 StoryEngine (Server)

- [ ] **IM-SE-001: StoryEngine implementa IStoryEngine**
  - Input: `class StoryEngine implements IStoryEngine`
  - Expected: TypeScript strict compila

- [ ] **IM-SE-002: Constructor carrega quest definitions e dialogue trees**
  - Input: StoryEngine com quests.ts e dialogues.ts mockados
  - Steps: `new StoryEngine()`
  - Expected: Quest definitions registradas. Dialogue trees populadas. Nenhuma exceção

- [ ] **IM-SE-003: registerQuest adiciona definição**
  - Input: `QuestDefinition` válida
  - Steps: `storyEngine.registerQuest(questDef)`
  - Expected: `storyEngine.getQuestDefinition(questDef.id)` retorna a definição

- [ ] **IM-SE-004: startQuest cria QuestState com status 'active'**
  - Input: QuestDefinition registrada, playerId válido
  - Steps: `storyEngine.startQuest('player-1', 'q_001')`
  - Expected: `QuestResult.success === true`. `questState.status === 'active'`. `objectives` com progress = 0

- [ ] **IM-SE-005: startQuest com quest inexistente retorna erro**
  - Input: questId que não existe no registro
  - Steps: `storyEngine.startQuest('player-1', 'invalid_quest')`
  - Expected: `QuestResult.success === false`, `QuestResult.error === 'Quest not found'`

- [ ] **IM-SE-006: startQuest com quest já ativa retorna erro**
  - Input: Quest já iniciada pelo mesmo player
  - Steps: `storyEngine.startQuest('player-1', 'q_001')` 2×
  - Expected: Segunda chamada retorna `success: false, error: 'Quest already started or completed'`

- [ ] **IM-SE-007: advanceObjective incrementa progresso**
  - Input: Quest ativa com objective 'obj1' (quantity=5)
  - Steps: `storyEngine.advanceObjective('player-1', 'q_001', 'obj1', 2)`
  - Expected: ObjectiveProgress.current === 2. Se current >= quantity, complete === true

- [ ] **IM-SE-008: advanceObjective completa objective ao atingir quantidade**
  - Input: Quest ativa, objective current=4, quantity=5
  - Steps: `storyEngine.advanceObjective('player-1', 'q_001', 'obj1', 1)`
  - Expected: `objective.complete === true`. `objective.current === 5`

- [ ] **IM-SE-009: completeQuest falha se objectives não estão completos**
  - Input: Quest ativa, pelo menos 1 objective não completo
  - Steps: `storyEngine.completeQuest('player-1', 'q_001')`
  - Expected: `QuestResult.success === false`. Quest permanece 'active'

- [ ] **IM-SE-010: completeQuest concede recompensas e muda status**
  - Input: Quest com todos objectives completos
  - Steps: `storyEngine.completeQuest('player-1', 'q_001')`
  - Expected: `QuestResult.success === true`. `questState.status === 'completed'`. `rewards` presente com XP e gold

- [ ] **IM-SE-011: Estado de quests é isolado por player**
  - Input: Player-1 completa quest. Player-2 inicia mesma quest
  - Steps: Verificar estado de ambos
  - Expected: Player-1: status 'completed'. Player-2: status 'active'. Não há interferência

- [ ] **IM-SE-012: getAvailableQuests filtra por level e prerequisites**
  - Input: QuestDefinition com levelRequired=10, player level=5
  - Steps: `storyEngine.getAvailableQuests('player-1')`
  - Expected: Quest não aparece na lista (requisito de level não atendido)

- [ ] **IM-SE-013: getAvailableQuests não retorna quests já completadas**
  - Input: Quest completada por player
  - Steps: `storyEngine.getAvailableQuests('player-1')`
  - Expected: Quest não aparece na lista

- [ ] **IM-SE-014: getDialogue retorna DialogueNode para NPC existente**
  - Input: Dialogue tree registrada para 'npc_guild'
  - Steps: `storyEngine.getDialogue('npc_guild')`
  - Expected: `DialogueNode` com `id`, `npcId`, `text`, `options` array

- [ ] **IM-SE-015: getDialogue retorna null para NPC sem diálogo**
  - Input: NPC id sem diálogo registrado
  - Steps: `storyEngine.getDialogue('npc_unknown')`
  - Expected: `null`

- [ ] **IM-SE-016: selectDialogueOption navega para próximo diálogo**
  - Input: DialogueNode com option que tem `nextDialogueId`
  - Steps: `storyEngine.selectDialogueOption('npc_guild', 'opt_accept')`
  - Expected: Retorna próximo `DialogueNode` (ou `null` se não há próximo)

- [ ] **IM-SE-017: selectDialogueOption executa actions (ex: start_quest)**
  - Input: DialogueOption com `actions: [{ type: 'start_quest', target: 'q_001' }]`
  - Steps: `storyEngine.selectDialogueOption('npc_guild', 'opt_accept')`
  - Expected: Quest 'q_001' é iniciada para o player (verificar via getQuestProgress)

- [ ] **IM-SE-018: selectDialogueOption com option inválida retorna null**
  - Input: optionId que não existe no DialogueNode
  - Steps: `storyEngine.selectDialogueOption('npc_guild', 'non_existent_option')`
  - Expected: `null`

- [ ] **IM-SE-019: update(deltaMs) não lança exceção (no-op por enquanto)**
  - Input: Qualquer deltaMs
  - Steps: `storyEngine.update(16)`
  - Expected: Nenhuma exceção. Nenhum efeito colateral (futuro: timed quests)

- [ ] **IM-SE-020: Quest definitions de exemplo estão registradas (quests.ts)**
  - Input: Importar `QUEST_DEFINITIONS` de `data/quests.ts`
  - Expected: Array não-vazio com ao menos 1 quest definition válida (ex: 'intro_kill_spiders')

- [ ] **IM-SE-021: Dialogue trees de exemplo estão registradas (dialogues.ts)**
  - Input: Verificar `data/dialogues.ts`
  - Expected: Ao menos 1 dialogue tree com NPC id, texto e opções

---

## 5. Testes de Integração

- [ ] **IT-001: GraphicsEngine + Game.ts (Strangler Fig) — jogo inicia sem erro**
  - Setup: `Game` modificado com `graphicsEngine` injetado
  - Steps: Inicializar Game com GraphicsEngine
  - Expected: `Game` inicia, câmera e asset manager funcionam. Nenhum crash

- [ ] **IT-002: GameEngine.tick() com e sem gameplayEngine (backward compat)**
  - Setup: GameEngine com `gameplayEngine = null` (legado) vs com `gameplayEngine` setado
  - Steps: Executar tick em ambos
  - Expected: Ambos funcionam. Comportamento idêntico. Testes existentes passam

- [ ] **IT-003: MapEngine + GameEngine — mapas carregam e colisão funciona**
  - Setup: MapEngine injetada, servidor rodando com tilemap
  - Steps: `loadMap('lorencia')`, verificar collision queries, spawn points
  - Expected: Mapa carregado, colisão funcional, spawn point retornado

- [ ] **IT-004: StoryEngine + GameEngine — quest é iniciada via dialogue action**
  - Setup: StoryEngine registrada, dialogue tree com action 'start_quest'
  - Steps: `selectDialogueOption('npc_guild', 'opt_accept')`
  - Expected: Quest ativa para player, progresso mensurável

- [ ] **IT-005: Bug #62 + #63 — Fluxo completo: ataque → broadcast para mapa**
  - Setup: Servidor mock, 2 players no mesmo mapa, 1 monstro
  - Steps:
    1. Player-1 ataca monstro
    2. Verificar broadcasts
  - Expected: Ambos players recebem ENTITY_DAMAGED + ENTITY_UPDATE. Player-2 vê HP do monstro atualizado

- [ ] **IT-006: Bug #62 — ENTITY_UPDATE após AI monster mover**
  - Setup: Servidor mock, monstro com AI, player no aggro range
  - Steps:
    1. Tick do engine (monstro chaseia)
    2. Verificar broadcasts
  - Expected: ENTITY_UPDATE broadcast com nova posição do monstro

- [ ] **IT-007: Strangler Fig — World.ts setters deprecated ainda funcionam**
  - Setup: World.setMovementSystem(), World.setCombatSystem() ainda chamados
  - Steps: Verificar que métodos marcados `@deprecated` ainda operam
  - Expected: Warnings em console mas funcionalidade intacta

- [ ] **IT-008: GameEngine com gameplayEngine — delegate correto para cada operação**
  - Setup: GameplayEngine mock com spies
  - Steps: Executar tick, ataque, movimento
  - Expected: GameEngine chama gameplayEngine para combate/movimento/colisão (não sistemas diretamente)

- [ ] **IT-009: GraphicsEngine + combatFeedback — dano aparece e health bar atualiza**
  - Setup: GraphicsEngine com CombatFeedbackManager real (não mock)
  - Steps: `graphicsEngine.showDamage(...)`, `graphicsEngine.showHealthBar(...)`
  - Expected: Health bar visível, dano flutuante aparece na tela

- [ ] **IT-010: MapEngine é stateless (opera sobre MapManager)**
  - Setup: MapEngine + MapManager real
  - Steps: `loadMap('lorencia')` 2×, verificar estado
  - Expected: Segunda carga não duplica dados. `getLoadedMaps()` retorna `['lorencia']` (não duplicado)

---

## 6. Testes E2E

- [ ] **E2E-001: Cliente conecta, vê mundo, entidades aparecem e se movem**
  - Setup: Servidor + cliente rodando, GraphicsEngine injetada no Game
  - Steps:
    1. Conectar ao servidor
    2. Receber WORLD_STATE
    3. Entidades renderizadas via GraphicsEngine
    4. Mover player, verificar movimento
  - Expected: Jogo funciona, entidades visíveis, movimento suave. Nenhum erro no console

- [ ] **E2E-002: Combate completo com broadcast para múltiplos players**
  - Setup: 2 clients conectados, mesmo mapa, monstro spawnado
  - Steps:
    1. Player-1 ataca monstro
    2. Observar pacotes no client-2
  - Expected: Client-2 recebe ENTITY_DAMAGED + ENTITY_UPDATE. Monstro atualizado visualmente

- [ ] **E2E-003: Quest flow — NPC dialogue → start quest → advance → complete**
  - Setup: Servidor com StoryEngine, cliente conectado
  - Steps:
    1. Falar com NPC (getDialogue)
    2. Aceitar quest (selectDialogueOption)
    3. Matar monstros (advanceObjective)
    4. Retornar ao NPC (completeQuest)
  - Expected: Quest inicia, objetivos avançam, recompensas concedidas ao completar

- [ ] **E2E-004: Múltiplos monstros com AI ativa — ENTITY_UPDATEs em tempo real**
  - Setup: Servidor com 5 monstros com AI, 2 players no mapa
  - Steps:
    1. Players entram no aggro range de monstros diferentes
    2. Observar fluxo de ENTITY_UPDATE
  - Expected: Cada monstro envia ENTITY_UPDATE quando move/ataca/toma dano. Sem broadcast excessivo

---

## 7. Casos de Erro e Borda

### 7.1 Interfaces (shared/)

- [ ] **BE-001: AttackResult com todos os campos undefined (apenas success)**
  - Input: `AttackResult { success: true }` (sem damage, sem targetId, sem killed)
  - Expected: Compila sem erro. Todos os campos opcionais são `undefined`

- [ ] **BE-002: QuestReward sem items (apenas XP e gold)**
  - Input: `QuestReward { experience: 100, gold: 50 }`
  - Expected: `items` é opcional. Compila sem erro

- [ ] **BE-003: QuestDefinition com prerequisites vazio** (validação de array vazio)
  - Input: `prerequisites: []`
  - Expected: Compila. Interface não exige mínimo de prerequisites

- [ ] **BE-004: DialogueNode.options vazio** (NPC fala mas não oferece opções)
  - Input: `DialogueNode { id: 'd1', npcId: 'npc_bartender', text: 'Welcome.', options: [] }`
  - Expected: Compila. Options pode ser array vazio

- [ ] **BE-005: VisualEffect com duração = 0** (efeito instantâneo)
  - Input: `VisualEffect { duration: 0, elapsed: 0 }`
  - Expected: Compila. Runtime deve tratar como efeito que desaparece no mesmo frame

- [ ] **BE-006: CollisionCheckResult com inBounds = false, walkable = true** (fora dos limites)
  - Input: Posição fora do grid
  - Expected: `inBounds: false` deve ter precedência sobre `walkable`

### 7.2 Implementações

- [ ] **BE-007: GraphicsEngine.update() com deltaSec negativo**
  - Input: `graphicsEngine.update(-0.016)`
  - Expected: Nenhum crash. MovementInterpolator pode ignorar ou tratar

- [ ] **BE-008: GraphicsEngine.removeEntity() com ID inexistente**
  - Input: `graphicsEngine.removeEntity('non-existent')`
  - Expected: No-op. Nenhuma exceção

- [ ] **BE-009: GameplayEngine.processAttack() com attackerId ou targetId vazio**
  - Input: `gameplayEngine.processAttack('', '')`
  - Expected: Delega para CombatSystem (que deve tratar). Engine não adiciona validação extra

- [ ] **BE-010: MapEngine.getCollisionGrid() sem mapa carregado**
  - Input: `mapEngine.getCollisionGrid('not_loaded')`
  - Expected: Retorna `null` (não lança exceção). Método trata `try/catch`

- [ ] **BE-011: StoryEngine.advanceObjective() para quest não ativa**
  - Input: Quest em status 'completed' ou 'locked'
  - Steps: `storyEngine.advanceObjective('player-1', 'q_001', 'obj1', 1)`
  - Expected: `QuestResult.success === false`, erro indicando quest não está ativa

- [ ] **BE-012: StoryEngine.completeQuest() para quest não encontrada**
  - Input: questId que não existe no registro
  - Steps: `storyEngine.completeQuest('player-1', 'invalid')`
  - Expected: `success: false, error: 'Quest not found'`

- [ ] **BE-013: StoryEngine.getQuestProgress() para player sem quests**
  - Input: playerId que nunca iniciou nenhuma quest
  - Steps: `storyEngine.getQuestProgress('new-player', 'q_001')`
  - Expected: `null`

- [ ] **BE-014: Bug #62 — ENTITY_UPDATE para player que saiu do mapa**
  - Input: Player move de 'lorencia' para 'devias'
  - Steps: Tick do engine após troca de mapa
  - Expected: Nenhum broadcast ENTITY_UPDATE para player no mapa antigo (broadcastToMap correto)

- [ ] **BE-015: Bug #63 — Ataque em mapa vazio (apenas atacante)**
  - Input: Player ataca monstro, é o único player no mapa
  - Steps: handlePlayerAttack
  - Expected: `broadcastToMap` chamado normalmente. Apenas 1 receptor (o próprio atacante). Sem crash

---

## 8. Regressão

### Áreas que podem ser afetadas pelas mudanças

| Área | Risco | Testes de Regressão Recomendados |
|------|-------|----------------------------------|
| **Game.ts** (client) | Alto — GraphicsEngine injetada, Strangler Fig | `movement-interpolator.test.ts`, `tilemap-renderer.test.ts`, testes manuais de inicialização |
| **GameEngine.ts** (server) | Alto — GameplayEngine injetada, ENTITY_UPDATE adicionado | `game-engine.test.ts` (tick, processAttack, movimento) |
| **World.ts** (server) | Médio — markDirty adicionado, setters deprecated | `world.test.ts` (add/remove entities, toJSON) |
| **connection.ts** (server) | Alto — PLAYER_ATTACK broadcast modificado | Testes de broadcast multiplayer |
| **server.ts** (server) | Médio — server passado para handleConnection | Testes de WebSocket/network existentes |
| **shared/index.ts** | Baixo — novo barrel export | Testes de importação (compilação) |
| **Player.ts** (server) | Médio — stamina, markDirty | `player.test.ts` |
| **Monster.ts** (server) | Baixo — markDirty | `monster.test.ts` |
| **MovementSystem** (server) | Médio — getRecentlyMoved() novo método | `movement-system.test.ts` |
| **CollisionGrid** (server) | Baixo — getWidth/getHeight/getData | `collision-grid.test.ts` |

### Testes de Regressão a Executar

- [ ] **RG-001:** Executar `packages/server/src/game/__tests__/game-engine.test.ts` — deve passar sem alterações
- [ ] **RG-002:** Executar `packages/server/src/game/__tests__/world.test.ts` — compatibilidade mantida
- [ ] **RG-003:** Executar `packages/server/src/game/systems/__tests__/combat-system.test.ts` — sem impacto
- [ ] **RG-004:** Executar `packages/server/src/game/systems/__tests__/movement-system.test.ts` — getRecentlyMoved adicionado
- [ ] **RG-005:** Executar `packages/server/src/game/systems/__tests__/collision.test.ts` — sem impacto
- [ ] **RG-006:** Executar `packages/client/src/__tests__/movement-interpolator.test.ts` — GraphicsEngine usa internamente
- [ ] **RG-007:** Executar `packages/client/src/ui/combat/__tests__/CombatFeedbackManager.test.ts` — permanece igual
- [ ] **RG-008:** Executar `packages/shared/src/__tests__/schemas.test.ts` — barrel exports não quebram
- [ ] **RG-009:** Executar `packages/shared/src/__tests__/constants.test.ts` — sem impacto
- [ ] **RG-010:** Executar todos os testes com `npm test` — zero falhas

---

## 9. Mocking Strategy

| Engine | O que mockar | Como |
|--------|-------------|------|
| **IGraphicsEngine** (interface) | Tudo — é contrato | `class MockGraphicsEngine implements IGraphicsEngine` com implementações dummy |
| **IGameplayEngine** (interface) | Tudo — é contrato | `class MockGameplayEngine implements IGameplayEngine` |
| **IStoryEngine** (interface) | Tudo — é contrato | `class MockStoryEngine implements IStoryEngine` |
| **IMapEngine** (interface) | Tudo — é contrato | `class MockMapEngine implements IMapEngine` |
| **GraphicsEngine** (impl) | Camera, AssetManager, TilemapRenderer, CombatFeedbackManager, MovementInterpolator | `vi.mock()` ou passar mocks no constructor (injeção já permite) |
| **GameplayEngine** (impl) | CombatSystem, MovementSystem, CollisionSystem | Passar mocks no constructor |
| **MapEngine** (impl) | MapManager (e seus grids) | Passar mock de MapManager |
| **StoryEngine** (impl) | Quests/data — mockar `loadDefinitions`/`loadDialogues` ou sobrescrever via `registerQuest` | Injetar quests via método público |
| **Bug #62** | server.broadcastToMap | `vi.fn()` spy no server mock |
| **Bug #63** | server.broadcastToMap, sendMessage | `vi.fn()` spies |

**Regra geral**: Nenhum teste de engine deve depender de sistemas reais (PixiJS, World real). Sempre injetar dependências mockadas.

---

## 10. Estimativa de Esforço

| Categoria | Quantidade | Esforço (h) |
|-----------|:----------:|:-----------:|
| UI — Interface IGraphicsEngine | 10 | 3 |
| UI — Interface IGameplayEngine | 10 | 3 |
| UI — Interface IStoryEngine | 10 | 3 |
| UI — Interface IMapEngine | 10 | 3 |
| UI — Exportação shared/ | 4 | 1 |
| BU — Bug #62 | 8 | 3 |
| BU — Bug #63 | 7 | 2.5 |
| IM — GraphicsEngine (client) | 15 | 6 |
| IM — GameplayEngine (server) | 10 | 4 |
| IM — MapEngine (server) | 10 | 3.5 |
| IM — StoryEngine (server) | 21 | 8 |
| IT — Integração | 10 | 6 |
| E2E | 4 | 8 |
| BE — Casos de Borda/Erro | 15 | 4 |
| RG — Regressão | 10 | 4 |
| **Total** | **~154** | **~62h** |

---

## 11. Artefatos de Teste

### Arquivos de teste a criar

| Arquivo | Propósito | Testes |
|---------|-----------|:------:|
| `packages/shared/src/engines/__tests__/IGraphicsEngine.test.ts` | Mock contract verification | 10 |
| `packages/shared/src/engines/__tests__/IGameplayEngine.test.ts` | Mock contract verification | 10 |
| `packages/shared/src/engines/__tests__/IStoryEngine.test.ts` | Mock contract verification | 10 |
| `packages/shared/src/engines/__tests__/IMapEngine.test.ts` | Mock contract verification | 10 |
| `packages/shared/src/engines/__tests__/exports.test.ts` | Barrel export verification | 4 |
| `packages/client/src/engines/__tests__/GraphicsEngine.test.ts` | Implementation tests | 15 |
| `packages/server/src/engines/__tests__/GameplayEngine.test.ts` | Implementation tests | 10 |
| `packages/server/src/engines/__tests__/MapEngine.test.ts` | Implementation tests | 10 |
| `packages/server/src/engines/__tests__/StoryEngine.test.ts` | Implementation tests | 21 |
| `packages/server/src/engines/__tests__/bugs-62-63.test.ts` | Bug fix verification | 15 |
| `packages/server/src/engines/__tests__/integration.test.ts` | Integration tests | 10 |
| `packages/client/src/engines/__tests__/e2e.test.ts` | E2E scenarios | 4 |

---

*Plano gerado pelo Test Planner em 2026-06-19. Total de ~154 cenários de teste, ~62h de esforço estimado.*
