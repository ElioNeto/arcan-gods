# 📋 Relatório de Scoping — Ciclo 02: Movimento (Continuação)

**Data:** 2026-06-18
**Agente:** scoper
**Status:** ✅ Análise concluída

---

## 1. Estado Atual

### ✅ Implementado (Fases 0 e 1)
- Shared types: tilemap, collision, movement, packets atualizados
- TilemapLoader, CollisionGrid, MapManager — 47 testes
- Pathfinding A*, BinaryHeap, PathCache — 18 testes
- CollisionSystem — 17 testes

### ❌ Pendente (Fases 2, 3 e P1)
- MovementSystem + Broadcast + integração GameEngine
- TilemapRenderer + MovementInterpolator (cliente)
- Portais, HUD, Minimapa, Auth JWT+PG

## 2. Prioridades

### 🟥 P0 — Essencial
| ID | Tarefa | Complexidade | Est. |
|----|--------|:-----------:|:----:|
| P0.1 | Infra broadcast (World + sockets) | Média | 1h |
| P0.2 | MovementSystem (A* contínuo) | Alta | 2h |
| P0.3 | Refatorar handlePlayerMove | Média | 0.5h |
| P0.4 | Broadcast de movimento | Média | 0.5h |
| P0.5 | Integrar no GameEngine.tick() | Baixa | 0.5h |
| P0.6 | TilemapRenderer (cliente) | Alta | 2h |
| P0.7 | MovementInterpolator (cliente) | Média | 1.5h |
| P0.8 | Atualizar Game.ts (cliente) | Média | 1h |

### 🟧 P1 — Importante
| ID | Tarefa | Depende |
|----|--------|---------|
| P1.1 | Portais/transição | P0.2 |
| P1.2 | HUD (HP/MP/XP) | P0.8 |
| P1.3 | Minimapa | P0.6 |
| P1.4 | Auth JWT + PostgreSQL | — |

## 3. Paralelização
```
Grupo 1 (paralelo): P0.1 + P0.2 + P0.6 + P1.4
Grupo 2 (após P0.2): P0.3 + P0.5
Grupo 3 (após P0.1+P0.3): P0.4
Grupo 4 (após P0.4+P0.6): P0.7 + P0.8
Grupo 5 (após P0.8): P1.1, P1.2, P1.3
```
