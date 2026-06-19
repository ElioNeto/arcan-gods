# 📋 Test Plans Summary — Ciclo 04: Monster AI + HUD (M3 Completion Sprint)

**Data:** 2026-06-19
**Agente:** Test Planner
**Ciclo:** 04 — Monster AI + HUD + Combat Feedback + Bugs

---

## 1. Sumário dos Planos de Teste

| # | Plano | Feature | Issue | Prioridade | Testes Unitários | Testes Integração | Casos Borda | E2E | **Total** |
|:-:|-------|---------|:-----:|:----------:|:----------------:|:-----------------:|:-----------:|:---:|:---------:|
| 10 | [Monster AI FSM](10-monster-ai-fsm-test-plan.md) | P0.1 — Monster AI | #51 | **P0** | 30 | 5 | 8 | 2 | **45** |
| 11 | [HUD Básico](11-hud-basic-test-plan.md) | P0.2 — HUD HP/MP/XP | #55 | **P0** | 26 | 7 | 9 | 2 | **44** |
| 12 | [Combat Feedback](12-combat-feedback-test-plan.md) | P0.3 — Damage Numbers + Health Bars | (novo) | **P0** | 20 | 7 | 8 | 2 | **37** |
| 13 | [Stamina](13-stamina-test-plan.md) | P1.2 — Bug: Adicionar Stamina | #57 | **P1** | 16 | 5 | 4 | 1 | **26** |
| 14 | [ChatSchema](14-chatschema-tests-test-plan.md) | P1.3 — Bug: ChatSchema Tests | #58 | **P1** | 16 | 3 | 5 | 0 | **24** |
| | **Total** | | | | **108** | **27** | **34** | **7** | **176** |

**Meta do ciclo:** +50 novos testes **→ Superado: +176 testes planejados** ✅

---

## 2. Alocação de Testes por Área

| Área | Testes | Responsável Sugerido |
|------|:------:|:-------------------:|
| **Servidor** | 71 (AI 45 + Stamina 26) | Dev B (AI) / Dev C (Stamina) |
| **Cliente** | 81 (HUD 44 + Combat 37) | Dev A (HUD) / Dev B (Combat) |
| **Shared** | 24 (ChatSchema) | Dev C |

---

## 3. Distribuição por Tipo de Teste

```
Unitários:    108 (61.4%)  ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
Integração:    27 (15.3%)  ⬛⬛⬛⬛
Casos Borda:   34 (19.3%)  ⬛⬛⬛⬛⬛
E2E:            7 ( 4.0%)  ⬛
```

---

## 4. Dependências entre Testes

```
P1.3 ChatSchema (#58)
  └── Independente → pode testar AGORA

P1.2 Stamina (#57)
  └── Independente → pode testar AGORA

P0.2 HUD Básico (#55)
  └── Independente → pode testar AGORA (mocar NetworkManager)

P0.1 Monster AI (#51)
  └── Depende de Pathfinding A* (já testado)
  └── Depende de Grid de Colisão (já testado)
  └── Pode testar AGORA com mocks

P0.3 Combat Feedback (novo)
  └── Depende de P0.1 (precisa de monstros com AI para E2E)
  └── Unit/Integration podem testar com mocks ANTES de P0.1 ficar pronto
```

---

## 5. Estratégia de Mocking

### Servidor (Monster AI + Stamina)
| Dependência | Estratégia |
|-------------|-----------|
| `World` | Mock → injetar players/monstros controlados |
| `Grid` | Mock de grid simples (10×10 sem obstáculos) |
| `Pathfinding` | Mock → retornar caminho pré-definido |
| `CombatSystem` | Spy → verificar se `processAttack()` foi chamado |
| `MovementSystem` | Spy → verificar consumo de stamina |

### Cliente (HUD + Combat Feedback)
| Dependência | Estratégia |
|-------------|-----------|
| `PixiJS Application` | Headless render ou mock de stage |
| `NetworkManager` | Mock → emitir eventos simulados |
| `Camera` | Mock → viewport fixo para testes |
| `Game.worldContainer` | Container real para verificar children |

### Shared (ChatSchema)
| Dependência | Estratégia |
|-------------|-----------|
| Nenhuma | Teste puro de schema Zod — sem mocks |

---

## 6. Testes de Regressão Recomendados

### Ao implementar P0.1 (Monster AI)
- [ ] `packages/server/src/game/__tests__/game-engine.test.ts` — tick executa AI
- [ ] `packages/server/src/game/entities/__tests__/monster.test.ts` — novas propriedades (estado, target)
- [ ] `packages/server/src/game/entities/__tests__/player.test.ts` — player como target
- [ ] Pathfinding A* tests — AI usa pathfinding intensivamente

### Ao implementar P0.2 (HUD)
- [ ] `packages/client/src/__tests__/network-manager.test.ts` — handlers de ENTITY_UPDATE
- [ ] `packages/client/src/__tests__/game.test.ts` — state machine (menu/world)

### Ao implementar P0.3 (Combat Feedback)
- [ ] `packages/server/src/game/systems/__tests__/combat-system.test.ts` — ENTITY_DAMAGED packet

### Ao implementar P1.2 (Stamina)
- [ ] `packages/server/src/game/systems/__tests__/movement-system.test.ts` — consumo de stamina
- [ ] `packages/shared/src/__tests__/schemas.test.ts` — stamina nos tipos

---

## 7. Thresholds de Qualidade

| Critério | Mínimo | Ideal |
|----------|:-----:|:-----:|
| Cobertura de código (features ciclo 04) | 70% | 85%+ |
| Testes unitários passando | 100% | 100% |
| Testes de integração passando | 100% | 100% |
| Performance AI (100 monstros) | < 50ms/tick | < 20ms/tick |
| Performance HUD (30 updates/s) | 30 FPS | 60 FPS |
| Performance Combat (50 damage numbers) | 30 FPS | 60 FPS |

---

## 8. Arquivos de Teste Esperados

### Novos arquivos a serem criados

| Arquivo | Feature |
|---------|---------|
| `packages/server/src/game/systems/__tests__/monster-ai.test.ts` | #51 Monster AI FSM |
| `packages/client/src/ui/__tests__/hud.test.ts` | #55 HUD Básico |
| `packages/client/src/ui/__tests__/damage-numbers.test.ts` | P0.3 Damage Numbers |
| `packages/client/src/ui/__tests__/monster-health-bar.test.ts` | P0.3 Health Bars |
| `packages/shared/src/__tests__/schemas.test.ts` (expandir) | #58 ChatSchema Tests |

### Arquivos existentes a expandir

| Arquivo | Feature |
|---------|---------|
| `packages/server/src/game/__tests__/game-engine.test.ts` | #51 AI tick integration |
| `packages/server/src/game/entities/__tests__/player.test.ts` | #57 Stamina |
| `packages/client/src/__tests__/game.test.ts` | #55 HUD integration |

---

## 9. Estimativa de Esforço Total

| Atividade | Horas |
|-----------|:-----:|
| Monster AI FSM (#51) | 32h |
| HUD Básico (#55) | 24h |
| Combat Feedback (P0.3) | 21h |
| Stamina (#57) | 11h |
| ChatSchema Tests (#58) | 4h |
| **Total** | **92h** |

> **Nota:** Esforço considera implementação dos testes + setup de mocks + debugging. Testes unitários são mais rápidos; testes E2E e de integração consomem mais tempo devido ao setup de ambiente.
