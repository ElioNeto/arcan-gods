# Milestones — Arcan Gods

> **Marcos de entrega** com critérios de aceite objetivos.
> **Atualizado:** 2026-06-18 (após Ciclo 03)

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
- [ ] ~~CI passa (lint + build + testes unitários)~~ → ⏳ Pendente (#54)
- [x] docker-compose levanta o stack inteiro

### Issues alocadas
- [x] Setup monorepo
- [x] Setup servidor (Node.js + TS + WebSocket)
- [x] Setup cliente (Vite + PixiJS + TS)
- [x] Tilemap loader
- [x] Auth (JWT + PostgreSQL) — bcrypt + JWT + migrations + seed
- [ ] CI pipeline → ⏳ #54
- [x] Docker Compose

---

## ✅ Milestone 2: 「Movimento」 (Fase 1) — CONCLUÍDO

**Tempo real:** 1 dia (18/jun)
**Status:** ✅ **Concluído** (Ciclo 02)

### Critérios de aceite
- [x] Pathfinding A* funcional no servidor (Manhattan, BinaryHeap, cache LRU)
- [x] Movimento suave com interpolação no cliente (MovementInterpolator)
- [x] Colisão com tiles (CollisionGrid, sliding)
- [ ] ~~2+ mapas conectados por portais~~ → ⏳ Pendente (#47)
- [x] 10+ jogadores simultâneos no mesmo mapa (broadcast infra)
- [ ] ~~Minimapa funcionando~~ → ⏳ Pendente (#48)
- [x] Câmera com smooth follow

### Issues alocadas
- [x] Pathfinding A*
- [x] Movimento autoritativo
- [x] Interpolação cliente
- [x] Colisão
- [ ] Múltiplos mapas e portais → ⏳ #47
- [x] Câmera
- [ ] Minimapa → ⏳ #48

---

## 🟡 Milestone 3: 「Combate」 (Fase 2) — EM ANDAMENTO

**Tempo real:** 1 dia (18/jun)
**Status:** 🟡 **Parcial** — Núcleo do combate implementado. Faltam: AI, skills, classes, loot, efeitos

### Critérios de aceite
- [ ] ~~5 tipos de monstros com AI~~ → ⏳ 2 templates existem, AI (FSM chase) está pendente
- [x] Dark Knight funcional com auto-attack (via CombatSystem)
- [x] Dano calculado server-side com atributos (STR/AGI/ENE/VIT)
- [x] XP e level up (com stat points por nível)
- [ ] ~~2 classes jogáveis adicionais~~ → ⏳ Pendente
- [ ] ~~3 skills por classe~~ → ⏳ Pendente (#52)
- [x] Respawn de monstros (já funcionava desde Ciclo 01)
- [ ] ~~Drop de gold e itens básicos~~ → ⏳ Gold funciona, itens pendentes

### Issues alocadas
- [ ] AI de monstros (FSM) → 📌 #51
- [x] Sistema de combate (CombatSystem)
- [x] Fórmulas de dano (damage-formulas.ts)
- [x] Sistema de XP/Level (com stat points)
- [ ] Classes: Dark Knight, Dark Wizard, Elf → ⏳ Pendente
- [ ] Skills básicas → 📌 #52
- [ ] Drop loot → 📌 Gold implementado, itens pendentes
- [ ] Efeitos visuais de combate → 📌 #23 (fechada, pendente)

---

## 🔜 Milestone 4: 「Inventário」 (Fase 3)

**Previsão:** Após M3 completo
**Status:** ⏳ **Não iniciado**

### Critérios de aceite
- [ ] Grade de inventário 8x5 funcional
- [ ] Equipamento visual no personagem
- [ ] 10+ tipos de item com stats
- [ ] Sistema de upgrade até +5
- [ ] NPC loja funcional
- [ ] Trade entre jogadores
- [ ] Sistema de wings (visual)

### Issues
- #24 Inventário UI, #25 Equipamento, #26 Templates, #27 Upgrade, #28 NPC Shop, #29 Trade, #30 Wings

---

## 🔜 Milestone 5: 「Mundo Vivo」 (Fase 4)

**Previsão:** Após M4 completo
**Status:** ⏳ **Não iniciado**

### Issues
- #31 Chat, #32 Party, #33 Guild, #34 Quests, #35 NPC Dialogue, #36 Quest Log, #37 Friends

---

## 🔜 Milestone 6: 「Beta」 (Fase 5 + 6)

**Previsão:** Após M5 completo
**Status:** ⏳ **Não iniciado**

### Issues
- #38 Mapas, #39 Monstros, #40 Itens, #41 Quests, #42 Som, #43 Ranking, #44 Infra, #45 Carga, #46 Landing

---

## Acompanhamento

Cada milestone vira uma **Milestone no GitHub Projects**. As issues são associadas à milestone correspondente.

### Status atual dos milestones

| Milestone | Status | Issues fechadas | Issues abertas |
|-----------|--------|:---------------:|:--------------:|
| M1: Conexão | ✅ Completo | 8/9 | 1 (#54) |
| M2: Movimento | ✅ Completo | 5/7 | 2 (#47, #48) |
| M3: Combate | 🟡 Parcial | 5/10 | 5 |
| M4: Inventário | ⏳ | 0/7 | 7 |
| M5: Mundo Vivo | ⏳ | 0/7 | 7 |
| M6: Beta | ⏳ | 0/8 | 8 |
| **Total** | | **26 fechadas** | **30 abertas** |
