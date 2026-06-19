# 📋 Implementation Plan — Cycle 04: Monster AI + HUD

**Data:** 2026-06-19
**Agente:** Planner
**Ciclo:** 04

---

## 1. Visão Geral

```yaml
cycle:
  name: "Ciclo 04 - Monster AI + HUD"
  date: "2026-06-19"
  goal: >
    Completar o M3 (Combate) com Monster AI reativa, HUD funcional e feedback visual de combate,
    transformando o combate de "cálculo matemático invisível" em experiência jogável.
  test_target: "+50 novos testes"
```

## 2. Tasks

## Task P0.1 — Monster AI FSM (#51)

**Complexidade:** alta  
**Depende de:** nada  
**Arquivos novos:** 4  
**Arquivos modificados:** 7

### Design / Architecture

```
MonsterAISystem (game loop, stagger)
    └── MonsterFSM (state machine per monster)
         ├── IdleState    — parado ou patrol curto (2-3 tiles)
         ├── AggroState   — transição se player em aggroRange
         ├── ChaseState   — A* pathfind até attackRange do alvo
         ├── AttackState  — auto-attack c/ cooldown próprio do monstro
         └── ReturnState  — pathfind de volta ao spawn se player fugiu (leash)
```

**Decisões arquiteturais:**

1. **MonsterAISystem** — Novo system no servidor. Processa subset de monstros a cada tick (stagger: ex. 1/3 dos monstros por tick a 10Hz = cada monstro processado ~3x/s).
2. **FSM separada** — Lógica de estados em classe própria (`MonsterFSM`) para testabilidade.
3. **Movimento** — Monstros usam A* (`findPath`) diretamente, com acumulador fracionário similar ao `MovementSystem`, mas gerenciado internamente no `MonsterAISystem`. Não reusa `MovementSystem` (que é só para players).
4. **Ataque monstro→player** — Novo método `processMonsterAttack` no `CombatSystem` (ou estender o existente).
5. **Broadcast** — Monstros atacando precisam enviar `ENTITY_DAMAGED` para **todos os players no mesmo mapa**, não só o atacante.
6. **Coordenadas** — Monstros operam em tiles (já é o padrão: `Monster.x/y` são tiles compatíveis com pathfinding).

### Steps

```yaml
- id: "P0.1.1"
  description: >
    Criar enum `MonsterAIState` e interface `MonsterAIConfig` em shared.
    `MonsterAIState = 'idle' | 'aggro' | 'chase' | 'attack' | 'return'`
    `MonsterAIConfig` com `aggroRange`, `attackRange`, `leashMultiplier` (default 2),
    `attackCooldown` (default 2000ms), `patrolRadius` (default 3), `moveSpeed` (default 3 tiles/s).
    Adicionar `MONSTER_AI_STATE` packet opcional em `ServerPacket` para futura depuração.
  files_created:
    - "packages/shared/src/types/ai.ts"
  files_modified:
    - "packages/shared/src/types/packets.ts"   # add MONSTER_AI_STATE packet type
    - "packages/shared/src/index.ts"            # export ai.ts
  complexity: "baixa"

- id: "P0.1.2"
  description: >
    Expandir classe `Monster` com propriedades de AI:
    - `currentState: MonsterAIState = 'idle'`
    - `lastAttackTime: number = 0`
    - `aggroTargetId: string | null = null`
    - `aiMovePath: Waypoint[]` (caminho atual de chase/return)
    - `aiMoveIndex: number` (índice no caminho)
    - `aiMoveRemainder: number` (acumulador fracionário)
    - Adicionar `attackCooldown`, `moveSpeed`, `leashMultiplier`, `patrolRadius` no `MonsterTemplate`
    - Atualizar `toJSON()` para exportar `currentState` (útil para debug)
    - Atualizar `respawn()` para resetar estado da AI
  files_created: []
  files_modified:
    - "packages/server/src/game/entities/Monster.ts"
    - "packages/server/src/index.ts"            # atualizar MONSTER_TEMPLATES c/ novos campos
    - "packages/shared/src/types/entities.ts"   # opcional: IMonster pode ganhar currentState
  complexity: "baixa"

- id: "P0.1.3"
  description: >
    Criar `MonsterFSM` — classe pura de máquina de estados.
    Responsabilidades:
    - `update(monster, playersInMap, grid, deltaMs) → { attacked, attackTarget, damage }`
    - Implementar cada estado:
      * **idle**: Parado. A cada ~3s, patrol curto (2-3 tiles aleatórios ao redor do spawn).
        Se player entra em `aggroRange` → transição para 'aggro'.
      * **aggro**: Estado de transição. Define `aggroTargetId`, calcula path de chase. → 'chase'.
      * **chase**: Avança no path (A*) tile a tile. Se player sai de `aggroRange × leashMultiplier` → 'return'.
        Se chega em `attackRange` do alvo → 'attack'.
      * **attack**: Se cooldown passou → causa dano. Se player sai do `attackRange` → 'chase'.
        Se player sai do leash → 'return'.
      * **return**: Pathfind de volta ao spawn. Ao chegar → 'idle'.
    - Usar `findPath()` do pathfinding existente.
    - Usar distância Manhattan para checagens de range.
    - Retornar informações de ataque para o sistema processar.
  files_created:
    - "packages/server/src/game/ai/MonsterFSM.ts"
    - "packages/server/src/game/ai/index.ts"
  files_modified: []
  complexity: "alta"

- id: "P0.1.4"
  description: >
    Criar `MonsterAISystem` — sistema orquestrador.
    - Construtor recebe `World`, `MapManager`, `CollisionSystem`, opções de stagger.
    - `update(deltaMs)`: Processa subset de monstros vivos a cada tick.
      Stagger: dividir monsters em N grupos (ex: 3), processar grupo = tickCount % N.
    - Para cada monstro no grupo:
      1. Obter `MonsterFSM.update()` → resultado de ação.
      2. Se monstro atacou: usar `CombatSystem.processMonsterAttack()`.
      3. Atualizar posição do monstro no path (avançar no waypoint).
    - Monitorar performance (log se AI de um tick levar > 50ms).
  files_created:
    - "packages/server/src/game/systems/MonsterAISystem.ts"
  files_modified:
    - "packages/server/src/game/systems/index.ts"  # export MonsterAISystem
  complexity: "média"

- id: "P0.1.5"
  description: >
    Adicionar suporte a ataque monstro→player no `CombatSystem`.
    Criar método `processMonsterAttack(monsterId, targetPlayerId) → AttackResult`:
    - Validar range do monstro vs player (usa `monster.template.attackRange`)
    - Usar stats do monstro (`template.damageMin/Max`) como base de dano
    - Aplicar `player.takeDamage()`
    - Se player morrer, notificar (futuro: respawn)
    - Usar calculadora de dano existente (passar stats apropriados)
    - Checar cooldown próprio do monstro (`monster.lastAttackTime`)
  files_created: []
  files_modified:
    - "packages/server/src/game/systems/CombatSystem.ts"
  complexity: "média"

- id: "P0.1.6"
  description: >
    Criar mecanismo de broadcast de pacotes.
    - Adicionar método `Server.broadcastToMap(mapId, packet)` que envia pacote
      para todos os WebSockets conectados cujo player está no mapa.
    - O servidor precisa conseguir mapear playerId → socket. Já existe `playerSocketMap`
      no World (socketId → playerId). Será necessário um mapa reverso ou iterar.
    - Alternativa: adicionar `broadcastToMap` no World/Server que usa a conexão.
  files_created: []
  files_modified:
    - "packages/server/src/network/server.ts"    # add broadcastToMap()
    - "packages/server/src/game/World.ts"        # opcional: add broadcast helper
  complexity: "média"

- id: "P0.1.7"
  description: >
    Integrar `MonsterAISystem` no `GameEngine`.
    - Adicionar `monsterAISystem` como propriedade
    - Chamar `monsterAISystem.update(deltaMs)` no tick (após respawn, antes do movement)
    - Quando monstro ataca, pegar o resultado e:
      * Aplicar dano via CombatSystem
      * Broadcastar `ENTITY_DAMAGED` para todos no mapa
    - O broadcast deve usar o Server; o GameEngine precisa de referência ao Server
      (ou a um callback de broadcast).
  files_created: []
  files_modified:
    - "packages/server/src/game/GameEngine.ts"
  complexity: "média"

- id: "P0.1.8"
  description: >
    Conectar tudo no server `index.ts`:
    - Instanciar `MonsterAISystem` com dependências
    - Setar no GameEngine
    - Atualizar `MONSTER_TEMPLATES` com novos campos (attackCooldown, moveSpeed, etc.)
  files_created: []
  files_modified:
    - "packages/server/src/index.ts"
  complexity: "baixa"

- id: "P0.1.9"
  description: >
    Escrever testes unitários para `MonsterFSM`.
    - Testar cada estado individualmente:
      * idle → aggro (player entra no range)
      * aggro → chase (path é calculado)
      * chase → attack (player em attackRange)
      * chase → return (player sai do leash)
      * attack → chase (player sai do attackRange mas está no leash)
      * return → idle (monstro chegou no spawn)
    - Usar `vi.useFakeTimers` para controlar cooldown
    - Mockar `findPath` para retornar caminhos previsíveis
    - Mockar grid para sempre walkable
  files_created:
    - "packages/server/src/game/ai/__tests__/MonsterFSM.test.ts"
  files_modified: []
  complexity: "alta"

- id: "P0.1.10"
  description: >
    Escrever testes para `MonsterAISystem`.
    - Testar stagger (que só subset de monstros é processado por tick)
    - Testar que monstro morto não é processado
    - Testar que monstro ataca player quando em range
    - Testar que monstro chase calcula path corretamente
  files_created:
    - "packages/server/src/game/systems/__tests__/monster-ai-system.test.ts"
  files_modified: []
  complexity: "média"

- id: "P0.1.11"
  description: >
    Escrever testes para `processMonsterAttack` no CombatSystem.
    - Testar dano monstro→player
    - Testar cooldown do monstro
    - Testar range validation
  files_created: []
  files_modified:
    - "packages/server/src/game/systems/__tests__/combat-system.test.ts"  # add new describe block
  complexity: "baixa"
```

## Task P0.2 — HUD Básico (#55)

**Complexidade:** média  
**Depende de:** nada  
**Arquivos novos:** 1  
**Arquivos modificados:** 2

### Design / Architecture

```
HUD (Container)
 ├── hpBar: Graphics (red, top-left 10px)
 ├── mpBar: Graphics (blue, below HP)
 ├── xpBar: Graphics (gold, below MP)
 ├── levelText: Text ("Lv. 1")
 └── nameText: Text ("PlayerName")
```

- Tamanho das barras: 200×20px (padrão MU-like)
- Padding: 10px do canto superior esquerdo
- Atualizado via `ENTITY_DAMAGED` packet (para HP) e `WORLD_STATE` inicial
- Para XP, usar dados iniciais do `AUTH_SUCCESS` + eventos futuros
- Classe expõe método `update(playerData)` chamado pelo GameEngine
- Responsivo a resize via callback do window

### Steps

```yaml
- id: "P0.2.1"
  description: >
    Criar diretório e classe `HUD` em `packages/client/src/ui/hud/HUD.ts`.
    - Construtor recebe o `uiContainer` da Game
    - Cria container próprio para o HUD
    - Desenha HP bar (Graphics vermelho, cantos arredondados)
    - Desenha MP bar (Graphics azul)
    - Desenha XP bar (Graphics dourado)
    - Cria Text para level e nome
    - Método `update(playerData: IPlayer)` que atualiza largura das barras
      proporcional a hp/maxHp, mp/maxMp, experience/experienceToNext
    - Método `resize(width, height)` para reposicionar (fixo top-left 10px)
  files_created:
    - "packages/client/src/ui/hud/HUD.ts"
  files_modified: []
  complexity: "média"

- id: "P0.2.2"
  description: >
    Integrar HUD no `Game.ts` do cliente.
    - Importar `HUD`
    - Instanciar após `enterWorld()` (quando tem playerData)
    - Chamar `hud.update(playerData)` sempre que receber `ENTITY_DAMAGED`
      que envolva o player local
    - Chamar `hud.update(playerData)` também após `WORLD_STATE` inicial
    - No loop `update()`, atualizar HUD se state === 'world'
    - Chamar `hud.resize()` no evento `resize` do window
    - Adicionar `hud` como propriedade da classe Game
  files_created: []
  files_modified:
    - "packages/client/src/core/Game.ts"
  complexity: "média"

- id: "P0.2.3"
  description: >
    Escrever testes unitários para o HUD.
    - Criar HUD com dados mockados
    - Verificar que as barras têm largura correta (100% quando cheio, 50% quando metade HP)
    - Verificar que level text mostra "Lv. 1"
    - Verificar que resize reposiciona corretamente
    - Usar `jsdom` + `pixi.js` headless (como já configurado no projeto)
  files_created:
    - "packages/client/src/ui/hud/__tests__/HUD.test.ts"
  files_modified: []
  complexity: "média"
```

## Task P0.3 — Client Combat Feedback

**Complexidade:** média  
**Depende de:** P0.1 (para testes de integração, mas implementação pode começar em paralelo — ENTITY_DAMAGED já existe)  
**Arquivos novos:** 4  
**Arquivos modificados:** 2

### Design / Architecture

```
CombatFeedbackManager
 ├── damageNumbers: DamageNumber[]     — floating text collection
 └── healthBars: Map<entityId, EntityHealthBar>  — HP bars above entities
```

- **DamageNumber**: Text do PixiJS que aparece na posição da entidade, anima para cima (drift -0.5px/frame), fade out após 1.5s, auto-remove.
- **EntityHealthBar**: Graphics vermelho/verde (30×4px) acima de cada monstro, atualizado a cada ENTITY_DAMAGED.
- **CombatFeedbackManager**: Gerencia coleções, integra com Game.ts.

### Steps

```yaml
- id: "P0.3.1"
  description: >
    Criar `DamageNumber` — floating damage text.
    - Classe que recebe `(x, y, damage, isCritical, container)`
    - Cria `Text` do PixiJS com valor do dano
    - Cor: vermelho (0xff4444) para normal, amarelo (0xffff44) para crítico
    - Tamanho: 14px normal, 18px crítico (bold)
    - Método `update(deltaSec)`: move para cima (-30px/s), reduz alpha (fade em 1.5s)
    - Método `isDead()`: true se alpha <= 0
    - Método `destroy()`: remove do container pai
  files_created:
    - "packages/client/src/ui/combat/DamageNumber.ts"
  complexity: "baixa"

- id: "P0.3.2"
  description: >
    Criar `EntityHealthBar` — HP bar sobre entidades.
    - Construtor recebe `(entityId, initialHp, maxHp, container)`
    - Desenha barra de fundo (30×4px, cinza escuro 0x333333)
    - Desenha barra de HP (30×4px, vermelho 0xff4444), largura proporcional
    - Posicionada acima da entidade (offset: -8px no eixo Y)
    - Método `update(hp, maxHp)`: atualiza largura da barra
    - Método `setPosition(x, y)`: reposiciona
    - Método `destroy()`: remove do container
  files_created:
    - "packages/client/src/ui/combat/EntityHealthBar.ts"
  complexity: "baixa"

- id: "P0.3.3"
  description: >
    Criar `CombatFeedbackManager` — gerencia damage numbers e health bars.
    - Construtor recebe `worldContainer` (onde desenhar)
    - `onEntityDamaged(packet)`: 
      * Cria DamageNumber na posição do target
      * Atualiza/cria EntityHealthBar para o target
    - `update(deltaSec)`: atualiza todos damage numbers, remove mortos
    - `removeEntity(id)`: remove health bar da entidade removida
    - `clear()`: limpa tudo
  files_created:
    - "packages/client/src/ui/combat/CombatFeedbackManager.ts"
    - "packages/client/src/ui/combat/index.ts"
  complexity: "média"

- id: "P0.3.4"
  description: >
    Integrar `CombatFeedbackManager` no `Game.ts`.
    - Instanciar após `enterWorld()`
    - Escutar `ENTITY_DAMAGED` no networkManager → `combatFeedbackManager.onEntityDamaged()`
    - Escutar `ENTITY_REMOVE` → `combatFeedbackManager.removeEntity()`
    - No `update()`, chamar `combatFeedbackManager.update(deltaSec)`
  files_created: []
  files_modified:
    - "packages/client/src/core/Game.ts"
  complexity: "baixa"

- id: "P0.3.5"
  description: >
    Escrever testes unitários para DamageNumber, EntityHealthBar, CombatFeedbackManager.
    - DamageNumber: verificar drift, fade, auto-remove
    - EntityHealthBar: verificar largura proporcional
    - CombatFeedbackManager: verificar criação em ENTITY_DAMAGED
  files_created:
    - "packages/client/src/ui/combat/__tests__/CombatFeedbackManager.test.ts"
    - "packages/client/src/ui/combat/__tests__/DamageNumber.test.ts"
    - "packages/client/src/ui/combat/__tests__/EntityHealthBar.test.ts"
  files_modified: []
  complexity: "média"
```

## Task P1.2 — Bug: Add Stamina to Player (#57)

**Complexidade:** baixa  
**Depende de:** nada  
**Arquivos novos:** 0  
**Arquivos modificados:** 4

### Steps

```yaml
- id: "P1.2.1"
  description: >
    Adicionar `stamina` e `maxStamina` ao `IPlayer` shared type.
    Default: 100, max: 100.
  files_created: []
  files_modified:
    - "packages/shared/src/types/entities.ts"   # add stamina, maxStamina to IPlayer
  complexity: "baixa"

- id: "P1.2.2"
  description: >
    Adicionar `stamina` e `maxStamina` ao `Player` entity no servidor.
    - Inicializar: stamina = 100, maxStamina = 100
    - Adicionar constante `STAMINA_COST_PER_TILE = 1`, `STAMINA_REGEN_PER_TICK = 1`
      em `GAME_CONSTANTS` no shared
    - Adicionar no `toJSON()` para enviar ao cliente
  files_created: []
  files_modified:
    - "packages/shared/src/constants/game.ts"   # add STAMINA_COST, STAMINA_REGEN
    - "packages/server/src/game/entities/Player.ts"
  complexity: "baixa"

- id: "P1.2.3"
  description: >
    Implementar lógica de stamina no game tick.
    - No `GameEngine.updateStamina()` (ou dentro do tick):
      * Se player está parado (não tem movimento ativo): regenera 1 de stamina/tick
      * Se player se moveu: consome 1 de stamina por tile percorrido
      * Stamina nunca abaixo de 0 nem acima de maxStamina
    - A stamina pode ser consultada no futuro para bloquear corrida
  files_created: []
  files_modified:
    - "packages/server/src/game/GameEngine.ts"  # add stamina update logic in tick
  complexity: "média"

- id: "P1.2.4"
  description: >
    Escrever testes para stamina.
    - Testar regeneração quando parado
    - Testar consumo ao mover
    - Testar que stamina não ultrapassa limites
  files_created: []
  files_modified:
    - "packages/server/src/game/__tests__/game-engine.test.ts"  # add stamina describe block
  complexity: "baixa"
```

## Task P1.3 — Bug: ChatSchema Tests (#58)

**Complexidade:** baixa  
**Depende de:** nada  
**Arquivos novos:** 0  
**Arquivos modificados:** 1

### Steps

```yaml
- id: "P1.3.1"
  description: >
    Adicionar testes para `ChatSchema` no arquivo existente.
    Testar:
    - Mensagem válida (string 1-200 chars, channel 'global')
    - Mensagem muito curta (0 chars → invalid)
    - Mensagem muito longa (201 chars → invalid)
    - Channel inválido (not in enum → invalid)
    - Mensagem com caracteres especiais/unicode (válido)
    - Todos os 4 channels são aceitos
  files_created: []
  files_modified:
    - "packages/shared/src/__tests__/schemas.test.ts"  # add ChatSchema describe block
  complexity: "baixa"
```

---

## 3. Dependencies Graph

```
                        ┌──────────────────────────────────────┐
                        │          P0.1 — Monster AI           │
                        │  ┌─────┐ ┌──────┐ ┌──────┐ ┌─────┐  │
                        │  │types│→│ FSM  │→│System│→│Integ │  │
                        │  └─────┘ └──────┘ └──────┘ └─────┘  │
                        └──────────────────────────────────────┘
                                     │
                                     ▼
                        ┌──────────────────────────────────────┐
                        │     P0.3 — Combat Feedback           │
                        │  (precisa de monstros vivos p/ test) │
                        └──────────────────────────────────────┘

P0.2 — HUD ─────────────────────────────────────────────────── (independente)

P1.2 — Stamina ─────────────────────────────────────────────── (independente)

P1.3 — ChatSchema Tests ────────────────────────────────────── (independente)
```

**Paralelização recomendada (3 devs):**

| Dev | Tarefas | Ordem |
|:---|:--------|:------|
| Dev A | P0.2 (HUD) → P0.3 (Combat Feedback) | P0.2 primeiro, P0.3 depois (parcialmente independente) |
| Dev B | P0.1 (Monster AI) — steps P0.1.1 a P0.1.8 | Sequencial |
| Dev C | P1.2 (Stamina) + P1.3 (ChatSchema tests) + testes P0.1.9-11 + P0.2.3 + P0.3.5 | Paralelo, quick wins + testes |

---

## 4. Riscos

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:-----------:|:-------:|-----------|
| R1 | **FSM complexa demais para um ciclo** | Média | Alto | Começar com FSM mínima (idle→chase→attack→return). Patrulha pode ser adiada. |
| R2 | **Stagger mal implementado causa atraso na AI** | Baixa | Médio | Começar sem stagger (processar todos). Otimizar depois se necessário. |
| R3 | **Broadcast de ENTITY_DAMAGED para mapa inteiro pode ser pesado** | Média | Médio | Filtrar por VIEW_RANGE (15 tiles). Player só recebe dano de monstros próximos. |
| R4 | **HUD sem teste visual por falta de assets** | Baixa | Baixo | Cores sólidas funcionam bem. Testes unitários com PixiJS headless. |
| R5 | **Monster AI + Combat Feedback podem conflitar no Game.ts** | Baixa | Baixo | Módulos separados (ai/ no server, combat/ no client). Sem overlap. |

---

## 5. Resumo de Arquivos

### Novos arquivos (11)

| Arquivo | Task |
|---------|:----:|
| `packages/shared/src/types/ai.ts` | P0.1.1 |
| `packages/server/src/game/ai/MonsterFSM.ts` | P0.1.3 |
| `packages/server/src/game/ai/index.ts` | P0.1.3 |
| `packages/server/src/game/systems/MonsterAISystem.ts` | P0.1.4 |
| `packages/client/src/ui/hud/HUD.ts` | P0.2.1 |
| `packages/client/src/ui/combat/DamageNumber.ts` | P0.3.1 |
| `packages/client/src/ui/combat/EntityHealthBar.ts` | P0.3.2 |
| `packages/client/src/ui/combat/CombatFeedbackManager.ts` | P0.3.3 |
| `packages/client/src/ui/combat/index.ts` | P0.3.3 |

### Arquivos modificados (15)

| Arquivo | Task |
|---------|:----:|
| `packages/shared/src/types/packets.ts` | P0.1.1 |
| `packages/shared/src/types/entities.ts` | P0.1.2, P1.2.1 |
| `packages/shared/src/index.ts` | P0.1.1 |
| `packages/shared/src/constants/game.ts` | P1.2.2 |
| `packages/server/src/game/entities/Monster.ts` | P0.1.2 |
| `packages/server/src/game/entities/Player.ts` | P1.2.2 |
| `packages/server/src/game/systems/CombatSystem.ts` | P0.1.5 |
| `packages/server/src/game/systems/index.ts` | P0.1.4 |
| `packages/server/src/game/GameEngine.ts` | P0.1.7, P1.2.3 |
| `packages/server/src/network/server.ts` | P0.1.6 |
| `packages/server/src/index.ts` | P0.1.8 |
| `packages/client/src/core/Game.ts` | P0.2.2, P0.3.4 |
| `packages/shared/src/__tests__/schemas.test.ts` | P1.3.1 |
| `packages/server/src/game/systems/__tests__/combat-system.test.ts` | P0.1.11 |
| `packages/server/src/game/__tests__/game-engine.test.ts` | P1.2.4 |

### Novos arquivos de teste (6)

| Arquivo | Task |
|---------|:----:|
| `packages/server/src/game/ai/__tests__/MonsterFSM.test.ts` | P0.1.9 |
| `packages/server/src/game/systems/__tests__/monster-ai-system.test.ts` | P0.1.10 |
| `packages/client/src/ui/hud/__tests__/HUD.test.ts` | P0.2.3 |
| `packages/client/src/ui/combat/__tests__/DamageNumber.test.ts` | P0.3.5 |
| `packages/client/src/ui/combat/__tests__/EntityHealthBar.test.ts` | P0.3.5 |
| `packages/client/src/ui/combat/__tests__/CombatFeedbackManager.test.ts` | P0.3.5 |

---

## 6. Exemplos de Código / Estruturas Sugeridas

### MonsterFSM — Estrutura da classe

```typescript
// packages/server/src/game/ai/MonsterFSM.ts

import { Monster } from '../entities/Monster.js';
import type { Player } from '../entities/Player.js';
import type { MonsterAIState } from '@arcan-gods/shared';
import { findPath } from '../pathfinding/Pathfinding.js';
import type { Grid } from '../pathfinding/Pathfinding.js';

export interface FSMUpdateResult {
  attacked: boolean;
  targetId?: string;
  damage?: number;
}

export class MonsterFSM {
  update(
    monster: Monster,
    players: Player[],
    grid: Grid,
    deltaMs: number,
    now: number,
  ): FSMUpdateResult {
    const target = this.findTarget(monster, players);
    
    switch (monster.currentState) {
      case 'idle':
        return this.handleIdle(monster, target, grid);
      case 'aggro':
        return this.handleAggro(monster, target, grid);
      case 'chase':
        return this.handleChase(monster, target, grid, deltaMs);
      case 'attack':
        return this.handleAttack(monster, target, grid, deltaMs, now);
      case 'return':
        return this.handleReturn(monster, grid, deltaMs);
    }
  }

  private findTarget(monster: Monster, players: Player[]): Player | null { ... }
  private handleIdle(monster: Monster, target: Player | null, grid: Grid): FSMUpdateResult { ... }
  private handleAggro(...): FSMUpdateResult { ... }
  private handleChase(...): FSMUpdateResult { ... }
  private handleAttack(...): FSMUpdateResult { ... }
  private handleReturn(...): FSMUpdateResult { ... }
}
```

### CombatFeedbackManager — Estrutura

```typescript
// packages/client/src/ui/combat/CombatFeedbackManager.ts

import { Container } from 'pixi.js';
import { DamageNumber } from './DamageNumber.js';
import { EntityHealthBar } from './EntityHealthBar.js';

export class CombatFeedbackManager {
  private damageNumbers: DamageNumber[] = [];
  private healthBars: Map<string, EntityHealthBar> = new Map();
  private container: Container;

  constructor(worldContainer: Container) {
    this.container = new Container();
    worldContainer.addChild(this.container);
  }

  onEntityDamaged(packet: {
    targetId: string; damage: number; isCritical: boolean;
    targetHp: number; targetMaxHp: number;
    x: number; y: number;
  }): void { ... }

  update(deltaSec: number): void { ... }
  removeEntity(entityId: string): void { ... }
  clear(): void { ... }
}
```

### HUD — Estrutura

```typescript
// packages/client/src/ui/hud/HUD.ts

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { IPlayer } from '@arcan-gods/shared';

const BAR_WIDTH = 200;
const BAR_HEIGHT = 20;
const PADDING = 10;
const GAP = 4;

export class HUD {
  private container: Container;
  private hpBar: Graphics;
  private mpBar: Graphics;
  private xpBar: Graphics;
  private levelText: Text;
  private nameText: Text;

  constructor() {
    this.container = new Container();
    // ... create bars and text
  }

  update(playerData: IPlayer): void {
    // Update bar widths based on ratios
    this.hpBar.width = BAR_WIDTH * (playerData.hp / playerData.maxHp);
    this.mpBar.width = BAR_WIDTH * (playerData.mp / playerData.maxMp);
    // XP bar = experience / experienceToNext
    this.levelText.text = `Lv. ${playerData.level}`;
  }

  getContainer(): Container { return this.container; }
  resize(width: number, height: number): void { /* position top-left */ }
}
```

---

## 7. Critérios de Aceitação por Task

### P0.1 — Monster AI
- [ ] Monstros ficam idle no spawn (com patrol curto opcional)
- [ ] Monstros detectam player em `aggroRange` e transitam para chase
- [ ] Monstros perseguem player via A* até `attackRange`
- [ ] Monstros atacam player a cada `attackCooldown` ms causando dano
- [ ] Se player sai do leash (aggroRange × 2), monstro retorna ao spawn
- [ ] ENTITY_DAMAGED é broadcastado para todos players no mapa
- [ ] Stagger funciona (não processa todos monstros no mesmo tick)
- [ ] Monstro morto não executa AI
- [ ] Monstro respawnado volta ao estado idle
- [ ] **20+ testes unitários** passando

### P0.2 — HUD
- [ ] HP bar (vermelho) visível no canto superior esquerdo
- [ ] MP bar (azul) visível abaixo do HP
- [ ] XP bar (dourado) visível abaixo do MP
- [ ] Level text ("Lv. 1") visível
- [ ] Nome do personagem visível
- [ ] Barras atualizam quando HP/MP/XP mudam
- [ ] Resize funciona (barras mantêm posição)
- [ ] **15+ testes unitários** passando

### P0.3 — Combat Feedback
- [ ] Damage numbers aparecem na posição do monstro ao receber dano
- [ ] Damage numbers flutuam para cima e somem após 1.5s
- [ ] Critical hits aparecem em amarelo com fonte maior
- [ ] Health bars aparecem sobre monstros
- [ ] Health bars atualizam proporcionalmente ao HP
- [ ] **8+ testes unitários** passando

### P1.2 — Stamina
- [ ] Player tem `stamina` (100) e `maxStamina` (100)
- [ ] Regenera 1/tick quando parado
- [ ] Consome 1 por tile de movimento
- [ ] Stamina não vai abaixo de 0 nem acima de max
- [ ] **3+ testes** passando

### P1.3 — ChatSchema Tests
- [ ] Testa mensagem válida (1-200 chars)
- [ ] Testa mensagem vazia (inválida)
- [ ] Testa mensagem muito longa (inválida)
- [ ] Testa channel inválido
- [ ] Testa todos os 4 channels válidos
- [ ] **4+ testes** passando
