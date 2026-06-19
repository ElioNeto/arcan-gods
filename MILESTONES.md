# Milestones — Arcan Gods

> **Marcos de entrega** com critérios de aceite objetivos.
> **Atualizado:** 2026-06-19 (após Ciclo 04) · **Nova prioridade:** Arquitetura de Engines

---

## ✅ Milestone 1: 「Conexão」 (Fase 0) — CONCLUÍDO

**Tempo real:** 1 dia (18/jun)
**Status:** ✅ **Concluído** (Ciclo 01)

### Critérios de aceite
- [x] Cliente Vite + PixiJS abre no navegador
- [x] Servidor Node.js + WebSocket aceita conexão
- [x] Tilemap carregado de JSON (Tiled) e renderizado
- [x] Cliente envia clique, servidor move entidade com A*
- [x] Login JWT funcional com PostgreSQL (bcrypt + JWT + migrations)
- [x] CI passa (lint + build + testes unitários) — GitHub Actions
- [x] docker-compose levanta o stack inteiro

### Issues alocadas
- #1 Setup monorepo, #2 Setup servidor, #3 Setup cliente
- #4 Tilemap loader, #5/#53 Auth JWT+PostgreSQL, #6/#54 CI pipeline
- #7 Docker Compose, #8 shared types

---

## ✅ Milestone 2: 「Movimento」 (Fase 1) — CONCLUÍDO

**Tempo real:** 1 dia (18/jun)
**Status:** ✅ **Concluído** (Ciclo 02)

### Critérios de aceite
- [x] Pathfinding A* funcional no servidor
- [x] Movimento suave com interpolação no cliente
- [x] Colisão com tiles (CollisionGrid, sliding)
- [ ] ~~2+ mapas conectados por portais~~ → ⏳ #47
- [x] 10+ jogadores simultâneos no mesmo mapa
- [ ] ~~Minimapa~~ → ⏳ #48
- [x] Câmera com smooth follow

---

## ✅ Milestone 3: 「Combate」 (Fase 2) — COMPLETO

**Tempo real:** 2 dias (18-19/jun)
**Status:** ✅ **Completo** (Ciclos 03 + 04)

### Critérios de aceite
- [x] Dark Knight funcional com auto-attack
- [x] Dano calculado server-side com atributos
- [x] XP e level up com stat points
- [x] **AI de monstros (FSM: idle/aggro/chase/attack/return)** — ✅ #51
- [x] **HUD com HP/MP/XP bars** — ✅ #55
- [x] **Combat Feedback (damage numbers + health bars)** — ✅ P0.3
- [x] **Stamina (regen/consumo)** — ✅ #57
- [x] Respawn de monstros
- [ ] ~~2 classes jogáveis adicionais~~ → ⏳ #65 (Gameplay Engine)
- [ ] ~~Skills por classe~~ → ⏳ #65
- [ ] ~~Drop de itens~~ → ⏳ #65

### Métricas
- 357 testes, 26 arquivos de teste
- 5 features implementadas no Ciclo 04
- 31 issues fechadas no total

---

## 🔜 Milestone 4: 「Engines」 (Fase 3) — PRIORIDADE MÁXIMA

**Previsão:** Próximo ciclo
**Status:** 🔴 **Prioridade máxima**

### Objetivo
Reestruturar a arquitetura do jogo em engines modulares antes de expandir features.
Substituir código espalhado por engines dedicadas e bem definidas.

### Critérios de aceite

#### Graphics Engine (#64)
- [ ] Sistema de sprite sheets com animação (idle/walk/attack)
- [ ] Sistema de partículas (skills, damage, level up)
- [ ] Camadas de renderização (chão/entidades/efeitos/UI)
- [ ] Câmera com zoom e bounds clamping
- [ ] Hit flash em entidades ao tomar dano

#### Gameplay Engine (#65)
- [ ] Skill system base (Energy Ball + Twisting Slash)
- [ ] Sistema de classes (DK, DW, Elf)
- [ ] Buff/debuff system
- [ ] Loot e drop tables
- [ ] Inventário e equipamento
- [ ] NPC shop

#### Story & Quests Engine (#66)
- [ ] Sistema de quests (kill/collect/talk)
- [ ] NPC dialogue tree
- [ ] Quest log UI
- [ ] 1 quest chain funcional (5 missões)

### Issues obrigatórias
- **#64 Graphics Engine** — Pré-requisito para qualquer melhoria visual
- **#65 Gameplay Engine** — Pré-requisito para skills, loot, classes
- **#66 Story & Quests Engine** — Pré-requisito para narrativa

### Bugs críticos (devem ser corrigidos junto)
- **#62** — ENTITY_UPDATE nunca enviado (bloqueia sync de stamina/HP)
- **#63** — PLAYER_ATTACK sem broadcast (bloqueia multiplayer)

---

## 🔜 Milestone 5: 「Mundo Vivo」 (Fase 4)

**Previsão:** Após M4 completo
**Status:** ⏳ **Aguardando**

### Issues
- #31 Chat, #32 Party, #33 Guild, #37 Friends
- #47 Portais, #48 Minimapa
- #38 Mapas, #39 Monstros, #40 Itens

---

## 🔜 Milestone 6: 「Beta」 (Fase 5)

**Previsão:** Após M5 completo
**Status:** ⏳ **Aguardando**

### Issues
- #41 Quests (expansão), #42 Som, #43 Ranking
- #44 Infra, #45 Carga, #46 Landing
- 50+ itens, 20+ monstros, 15+ quests

---

## 📊 Status Consolidado

| Milestone | Status | Issues fechadas | Issues abertas |
|-----------|:------:|:---------------:|:--------------:|
| M1: Conexão | ✅ Completo | 9/9 | 0 |
| M2: Movimento | ✅ Completo | 5/7 | 2 (#47, #48) |
| M3: Combate | ✅ Completo | 12/12 | 0 |
| **M4: Engines** | 🔴 **Prioridade** | 0/12 | **12** |
| M5: Mundo Vivo | ⏳ | 0/7 | 7 |
| M6: Beta | ⏳ | 0/8 | 8 |
| **Total** | | **31 fechadas** | **29 abertas** |
