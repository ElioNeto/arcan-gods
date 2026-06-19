# Roadmap — Arcan Gods

> **Linha do tempo estimada.** Este roadmap é um plano vivo e será atualizado conforme o projeto avança.
> **Atualizado:** 2026-06-19 (após Ciclo 04) · **357 testes** · **31 issues fechadas**
>
> **🔴 Nova prioridade:** Arquitetura de Engines (Graphics, Gameplay, Story/Quests)

```
Fase 0: Fundação         ████████████████████  100% ✅
Fase 1: Movimento        ████████████████████  85%  ✅
Fase 2: Combate          ████████████████████  100% ✅
Fase 3: Engines          ░░░░░░░░░░░░░░░░░░░░  0%   🔴 PRIORIDADE
Fase 4: Mundo Vivo       ░░░░░░░░░░░░░░░░░░░░  0%   ⏳
Fase 5: Beta             ░░░░░░░░░░░░░░░░░░░░  0%   ⏳
```

---

## ✅ Fase 0 — Fundação (100%)

**Testes:** 54 | **Arquivos:** 58

- [x] Setup monorepo (npm workspaces)
- [x] Servidor: Node.js + TypeScript + ESLint + Vitest
- [x] Cliente: Vite + PixiJS + TypeScript
- [x] WebSocket: conexão com handshake JWT
- [x] PostgreSQL: migrações + seed → ✅ #53
- [x] CI/CD: GitHub Actions (lint + build + test) → ✅ #54
- [x] Docker Compose para dev e produção
- [x] Renderização de tilemap (Tiled JSON)
- [x] Assets placeholder + 2900 sprites craftpix

---

## ✅ Fase 1 — Movimento (85%)

**Testes:** +152 | **Total:** 206

- [x] Pathfinding A* (Manhattan, BinaryHeap, cache LRU)
- [x] Movimento autoritativo server-side
- [x] Interpolação de movimento no cliente
- [x] Colisão com tiles (CollisionGrid, sliding)
- [x] Câmera segue player com smooth scroll
- [x] Broadcast infra para múltiplos jogadores
- [ ] ~~Múltiplos mapas com portais~~ → #47
- [ ] ~~Minimapa~~ → #48

---

## ✅ Fase 2 — Combate (100%)

**Testes:** +151 | **Total:** 357

- [x] Sistema de atributos (STR/AGI/ENE/VIT) e fórmulas de dano
- [x] Classe Dark Knight (auto-attack via CombatSystem)
- [x] **Monster AI (FSM: 5 estados)** → ✅ #51
- [x] **HUD (HP/MP/XP bars)** → ✅ #55
- [x] **Combat Feedback (damage numbers + health bars)** → ✅ P0.3
- [x] **Stamina (regen/consumo)** → ✅ #57
- [x] Combate com clique (PLAYER_ATTACK)
- [x] Sistema de XP e level up (com stat points)
- [x] Respawn de monstros

---

## 🔴 Fase 3 — Engines (0% — PRIORIDADE MÁXIMA)

> **Objetivo:** Reestruturar a arquitetura em engines modulares ANTES de expandir features.
> Cada engine substitui código espalhado por um sistema coeso e testável.

### Graphics Engine (#64) — Base visual do jogo

A Engine que substitui os placeholders por sprites animados, com sistema de partículas, 
camadas de renderização e efeitos visuais.

- [ ] SpriteSheet loader + AnimationController (idle/walk/attack/hurt/death)
- [ ] Sistema de partículas (skills, damage, level up, blood)
- [ ] Camadas de renderização com Y-sorting
- [ ] Câmera com zoom (+/-), screen shake, bounds clamping
- [ ] Hit flash e efeitos de morte
- [ ] Damage numbers animados (substituir implementação atual)

### Gameplay Engine (#65) — Mecânicas do jogo

A Engine que unifica combate, skills, classes, loot, inventário e economia.

- [ ] Skill system (Energy Ball, Twisting Slash) com MP/cooldown/damage formula
- [ ] Class system (Dark Knight, Dark Wizard, Elf)
- [ ] Buff/debuff system (Poison, Bless, Slow)
- [ ] Loot system (drop tables, rarity, gold)
- [ ] Inventory system (grade 8x5, drag-and-drop)
- [ ] Equipment system (weapon, armor, accessories)
- [ ] NPC shop (comprar/vender)
- [ ] Item upgrade (+1 a +15 com chance)

### Story & Quests Engine (#66) — Narrativa e progressão

A Engine que traz o mundo de Arcan Gods à vida com missões, diálogos e história.

- [ ] Quest system (kill/collect/talk/reach)
- [ ] NPC dialogue tree (com condições e ações)
- [ ] Quest log UI
- [ ] 1 quest chain funcional (5 missões)
- [ ] Quest rewards (XP/gold/items/skills)

### Map Engine (#67) — Criação e gerenciamento de mapas

A Engine que unifica criação, carregamento, colisão, portais e eventos de mapa.

- [ ] Editor visual de mapas (ferramenta standalone no navegador)
- [ ] 3 mapas completos (Lorencia, Devias, Noria)
- [ ] Portais conectando mapas com transição suave
- [ ] Spawn points configuráveis por mapa
- [ ] Renderização por camadas (ground/walls/decoration/effects)
- [ ] Grid de colisão gerado automaticamente
- [ ] Música ambiente e iluminação por mapa
- [ ] Eventos de mapa (entrada/saída, clima, batalhas)

### Bugs críticos a corrigir junto
- [ ] **#62** — ENTITY_UPDATE nunca enviado (bloqueia sync de stamina/HP)
- [ ] **#63** — PLAYER_ATTACK sem broadcast (bloqueia multiplayer)

---

## ⏳ Fase 4 — Mundo Vivo (0%)

**Aguardando conclusão das Engines**

- #47 Portais e transição entre mapas
- #48 Minimapa
- #31 Chat global/party/guild/whisper
- #32 Party system (XP share)
- #33 Guild system
- #37 Friends list
- #34-#36 Quests (expansão com quest log UI)
- #38 Mapas completos (Lorencia, Devias, Noria)
- #39 20+ tipos de monstro
- #40 50+ itens únicos

---

## ⏳ Fase 5 — Beta (0%)

- #41 15+ quests implementadas
- #42 Efeitos sonoros e música
- #43 Sistema de Ranking
- #44 Infraestrutura de produção (VPS/CDN)
- #45 Testes de carga (500+ jogadores)
- #46 Landing page e comunidade
- Suporte mobile (layout responsivo)
- i18n (pt-BR, en-US)
- Domínio e SSL
- Beta fechado → Beta aberto → Lançamento

---

## 📊 Resumo de Progresso

| Fase | % | Status | Testes | Issues abertas |
|------|:-:|:------:|:------:|:--------------:|
| F0: Fundação | 100% | ✅ | 54 | 0 |
| F1: Movimento | 85% | ✅ | 206 | 2 (#47, #48) |
| F2: Combate | 100% | ✅ | 357 | 0 |
| **F3: Engines** | **0%** | **🔴 PRIORIDADE** | — | **13** |
| F4: Mundo Vivo | 0% | ⏳ | — | 7 |
| F5: Beta | 0% | ⏳ | — | 8 |
| **Total** | | | **357 testes** | **30 issues** |
