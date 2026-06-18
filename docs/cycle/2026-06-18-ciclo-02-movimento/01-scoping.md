# 📋 Relatório de Scoping — Ciclo 02: Movimento e Mundo

**Data:** 2026-06-18
**Agente:** scoper
**Status:** ✅ Análise concluída

---

## 1. Estado Atual

### ✅ Reusável diretamente
- WebSocket Server, GameEngine (10Hz), World, Player/Monster entities
- Camera (smooth follow) — já implementada
- InputManager (clique), NetworkManager (WS client)
- Shared: packets (PLAYER_MOVE/MOVED), MoveSchema, GAME_CONSTANTS (TILE_SIZE=32)
- PlaceholderGraphics para entidades

### ⚠️ Reusável com adaptações
- `handlePlayerMove` — de teleporte validado para pathfinding A*
- Game.ts — cliente precisa de interpolação
- World — suporte a múltiplos mapas

### ❌ Tudo novo
- Pathfinding A*, colisão, portais, broadcast, minimapa, tilemap loader

## 2. Prioridades

### 🟥 P0 — Essencial
| ID | Tarefa | Issue | Complexidade |
|----|--------|-------|:-----------:|
| P0.1 | Pathfinding A* (servidor) | #9 | Alta |
| P0.2 | Tilemap loader + Grid colisão | #4 | Alta |
| P0.3 | Movimento server-authoritative com A* | #10 | Alta |
| P0.4 | Interpolação de movimento (cliente) | #11 | Média |
| P0.5 | Sistema de colisão | #12 | Média |
| P0.6 | Broadcast multi-player | — | Baixa |
| P0.7 | Câmera (fechar issue) | #14 | Baixa |

### 🟧 P1 — Importante
| ID | Tarefa | Depende |
|----|--------|---------|
| P1.1 | Mapa vazio fallback | P0.2 |
| P1.2 | Portais/transição | P0.5 |
| P1.3 | Minimapa | P0.2 |
| P1.4 | HUD básico (HP/MP/XP) | — |
| P1.5 | Auth JWT + PostgreSQL | — |

### 🟨 P2 — Futuro
- Camadas de mapa, áreas seguras/PvP, CI Pipeline, Docker

## 3. Dependências
```
P0.2 ──┬── P0.1 ── P0.3 ──┬── P0.4 ── P0.7
       │                   └── P0.6
       └── P0.5 ── P1.2

P1.4, P1.5 → independentes (paralelizáveis)
```

## 4. Riscos
- Tilemap ausente → usar grid mock para A*
- Performance A* em grids grandes → cache de caminhos
- Cliente sem interpolação → movimento parece travado
