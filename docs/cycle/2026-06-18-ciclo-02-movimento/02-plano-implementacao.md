# 📋 Plano de Implementação — Ciclo 02: Movimento e Mundo

**Data:** 2026-06-18
**Agente:** planner
**Status:** ✅ Plano concluído

---

## Ordem de Implementação

```
Fase 0: Shared Types (30min)
  └── Tipos de tilemap, colisão, movimento; atualizar packets

Fase 1: Tilemap + Pathfinding (4h) — PARALELIZÁVEL
  ├── P0.2: Tilemap Loader + CollisionGrid + MapManager
  └── P0.1: Pathfinding A* + BinaryHeap + PathCache

Fase 2: Movimento + Colisão (3h)
  ├── P0.5: CollisionSystem
  ├── P0.3: MovementSystem (server-authoritative com A*)
  └── P0.6: Broadcast multi-player

Fase 3: Cliente (2h)
  ├── P0.4: MovementInterpolator
  └── P0.7: Camera verification

Fase 4: P1 (4h) — PARALELIZÁVEL
  ├── P1.4: HUD (HP/MP/XP bars)
  └── P1.5: Auth JWT + PostgreSQL
```

## Estimativas

| Tarefa | Complexidade | Tempo | Depende |
|--------|:-----------:|:-----:|---------|
| P0.1 Pathfinding | Alta | 2h | P0.2 |
| P0.2 Tilemap Loader | Alta | 2h | — |
| P0.3 Movimento Auth | Alta | 1.5h | P0.1, P0.2 |
| P0.4 Interpolação | Média | 1h | P0.3 |
| P0.5 Colisão | Média | 1h | P0.2 |
| P0.6 Broadcast | Baixa | 0.5h | P0.3 |
| P0.7 Câmera | Baixa | 0.5h | P0.4 |
| P1.4 HUD | Média | 1h | — |
| P1.5 Auth | Alta | 3h | — |
| **Total** | | **12.5h** | |
