# 📋 Scoping Report — Ciclo 05: Engines Architecture

**Data:** 2026-06-19
**Agente:** Scoper
**Branch:** `main`
**Ciclo Anterior:** Ciclo 04 — Monster AI + HUD + Combat Feedback + Stamina

---

## 1. Current State Summary

| Métrica | Valor |
|---------|-------|
| Testes | **357** (26 arquivos) |
| Issues fechadas | **31** |
| Issues abertas | **30** |
| F0 Fundação | **100%** ✅ |
| F1 Movimento | **85%** 🟡 |
| F2 Combate | **100%** ✅ |
| **F3 Engines** | **0%** 🔴 PRIORIDADE |
| F4 Mundo Vivo | **0%** ⏳ |
| F5 Beta | **0%** ⏳ |

## 2. O que existe vs o que falta em shared/

### ✅ Existe em shared/
- Types: entities, enums, packets, ai, movement, collision, tilemap
- Constants: GAME_CONSTANTS, damage formulas, network config
- Validation: Zod schemas (MoveSchema, ChatSchema)

### ❌ NÃO existe (GAP crítico)
**NENHUMA interface de engine.** Todos os sistemas estão acoplados ao cliente (PixiJS) ou servidor (World, GameEngine). Não há contratos separados em shared/.

## 3. Priorities (P0/P1/P2)

### 🟥 P0 — Must Have
| ID | Issue | Tarefa | Complexidade |
|----|-------|--------|:-----------:|
| P0.1 | #64 | `IGraphicsEngine.ts` em shared/ | Alta |
| P0.2 | #65 | `IGameplayEngine.ts` em shared/ | Alta |
| P0.3 | #66 | `IStoryEngine.ts` em shared/ | Média |
| P0.4 | #67 | `IMapEngine.ts` em shared/ | Média |
| P0.5 | #62 | Bug: ENTITY_UPDATE nunca enviado | Baixa |
| P0.6 | #63 | Bug: PLAYER_ATTACK sem broadcast | Baixa |

### 🟧 P1 — Should Have
| ID | Tarefa | Depende |
|----|--------|:-------:|
| P1.1 | GraphicsEngine no cliente (refactor) | P0.1 |
| P1.2 | GameplayEngine no servidor (refactor) | P0.2 |
| P1.3 | MapEngine no servidor (refactor) | P0.4 |
| P1.4 | StoryEngine no servidor (criação) | P0.3 |

### 🟨 P2 — Nice to Have
| ID | Tarefa | Depende |
|----|--------|:-------:|
| P2.1-P2.4 | Testes unitários das engines | P1.x |
| P2.5 | MapEngine no cliente | P1.3 |

## 4. Parallelization Plan

### Grupo 1: Interfaces + Bugs (paralelo puro)
| Dev | Tarefas |
|:---:|---------|
| Dev A | P0.1 (IGraphicsEngine) |
| Dev B | P0.2 (IGameplayEngine) |
| Dev C | P0.3 (IStoryEngine) |
| Dev D | P0.4 (IMapEngine) |
| Dev E | P0.5 + P0.6 (bugs #62, #63) |

### Grupo 2: Implementações (após interfaces prontas)
| Dev | Tarefas |
|:---:|---------|
| Dev A | P1.1 (GraphicsEngine client) |
| Dev B | P1.2 (GameplayEngine server) |
| Dev C | P1.4 (StoryEngine server) |
| Dev D | P1.3 (MapEngine server) |

## 5. Files

### 🆕 13 new files
- `packages/shared/src/engines/{index,IGraphicsEngine,IGameplayEngine,IStoryEngine,IMapEngine}.ts`
- `packages/client/src/engines/{index,GraphicsEngine}.ts`
- `packages/server/src/engines/{index,GameplayEngine,MapEngine,StoryEngine}.ts`
- `docs/architecture/engines.md`

### ✏️ 5 modified files
- `packages/shared/src/index.ts` (add engines export)
- `packages/server/src/game/GameEngine.ts` (use IGameplayEngine)
- `packages/server/src/game/World.ts` (remove direct deps)
- `packages/client/src/core/Game.ts` (inject IGraphicsEngine)
- `packages/server/src/index.ts` (inject engines)

### 🐛 2 bug fixes
- #62: ENTITY_UPDATE broadcast in GameEngine.ts
- #63: PLAYER_ATTACK broadcastToMap in connection.ts

---

*Relatório gerado pelo Scoper em 2026-06-19*
