# Roadmap — Arcan Gods

> **Linha do tempo estimada.** Este roadmap é um plano vivo e será atualizado conforme o projeto avança.
> **Atualizado:** 2026-06-18 (após 3 ciclos em 1 dia)

```
Fase 0: Fundação         ████████████████████  100% ✅
Fase 1: Mundo e Movim.   ████████████████████  85%  🟡
Fase 2: Combate          ████████░░░░░░░░░░░░  40%  🟡
Fase 3: Itens e Upgrades ░░░░░░░░░░░░░░░░░░░░  0%   ⏳
Fase 4: Social/Quests    ░░░░░░░░░░░░░░░░░░░░  0%   ⏳
Fase 5: Conteúdo/Polish  ░░░░░░░░░░░░░░░░░░░░  0%   ⏳
Fase 6: Lançamento       ░░░░░░░░░░░░░░░░░░░░  0%   ⏳
```

---

## ✅ Fase 0 — Fundação (Completa)

**Status:** ✅ **100% implementado** (Ciclo 01)
**Testes:** 54 | **Arquivos:** 58

- [x] Setup do monorepo (npm workspaces)
- [x] Servidor: setup Node.js + TypeScript + ESLint + Vitest
- [x] Cliente: setup Vite + PixiJS + TypeScript
- [x] WebSocket: conexão cliente-servidor com handshake JWT (mock)
- [ ] ~~Banco: migrações PostgreSQL + schemas iniciais~~ → ⏳ #53
- [ ] ~~Redis: sessão e cache básicos~~ → ⏳ Futuro
- [ ] ~~Pipeline CI (lint + test + build)~~ → ⏳ #54
- [x] Script de dev (npm run dev) + docker-compose
- [x] Renderização: tilemap carregado de JSON (Tiled)
- [x] Asset placeholder (quadrados coloridos + 2900 sprites craftpix)
- **Entrega:** ✅ Cliente conecta ao servidor, vê tilemap, move com A*

---

## 🟡 Fase 1 — Mundo e Movimentação (85%)

**Status:** 🟡 **Maioria implementado** (Ciclo 02)
**Testes:** +112 | **Total:** 206

- [x] Pathfinding A* no servidor (Manhattan, BinaryHeap, cache LRU)
- [x] Movimento autoritativo (cliente envia destino, servidor calcula A* e move)
- [x] Interpolação de movimento no cliente (MovementInterpolator)
- [x] Colisão com tiles e objetos (CollisionGrid, sliding)
- [x] Câmera segue player com smooth scroll
- [ ] ~~Múltiplos mapas com transição (portais)~~ → ⏳ #47
- [x] Múltiplos jogadores visíveis simultaneamente (broadcast infra)
- [ ] ~~Minimapa~~ → ⏳ #48
- **Entrega:** 🟡 Jogadores andam pelo mesmo mapa, A* funcional, colisão ok. Faltam portais e minimapa.

---

## 🟡 Fase 2 — Combate (40%)

**Status:** 🟡 **Núcleo implementado** (Ciclo 03)
**Testes:** +41 | **Total:** 247

- [x] Sistema de atributos (STR, AGI, ENE, VIT) e fórmulas de dano
- [x] Classe Dark Knight (auto-attack via CombatSystem)
- [ ] ~~Monstros com AI (patrulha, aggro, chase, ataque)~~ → 📌 #51
- [x] Combate com clique (PLAYER_ATTACK → CombatSystem → ENTITY_DAMAGED)
- [ ] ~~Animações de ataque e morte~~ → ⏳ Pendente
- [x] Sistema de XP e level up (com stat points por nível)
- [ ] ~~Classes adicionais (DW, Elf, SUM, MG)~~ → ⏳ Pendente
- [ ] ~~Sistema de skills com hotkeys~~ → 📌 #52
- [ ] ~~Efeitos visuais de skills (partículas)~~ → ⏳ Pendente
- [ ] ~~Área segura vs. área PvP~~ → ⏳ Pendente
- **Entrega:** 🟡 Jogador consegue dano/fórmulas/server-side. Falta AI de monstros, skills e classes.

---

## ⏳ Fase 3 — Itens e Upgrades (0%)

**Status:** ⏳ **Não iniciado**

- [ ] Inventário com grade drag-and-drop (8x5) → #24
- [ ] Sistema de equipamento (armas, armaduras, acessórios) → #25
- [ ] Drop de loot com rarity (Normal → Magic → Rare → Unique → Legend) → #22/#26
- [ ] Sistema de upgrade (até +15, chance de falha) → #27
- [ ] NPC loja (comprar/vender) → #28
- [ ] Trade entre jogadores → #29
- [ ] Sistema de wings → #30
- [ ] Cash shop (cosméticos)
- **Entrega:** Jogador mata monstro, dropa item, equipa, upa, troca com outros.

---

## ⏳ Fase 4 — Social e Quests (0%)

**Status:** ⏳ **Não iniciado**

- Chat global, party, guild, whisper → #31
- Party system (compartilhamento de XP) → #32
- Guild system (criar, convidar, lista de membros) → #33
- Quest system (kill quests, fetch quests) → #34
- NPCs com diálogo → #35
- Quest log → #36
- Friends list → #37
- **Entrega:** Jogadores formam party, completam quests, conversam, criam guild.

---

## ⏳ Fase 5 — Conteúdo e Polish (0%)

**Status:** ⏳ **Não iniciado**

- Mapa completo de Lorencia, Devias, Noria → #38
- 20+ tipos de monstros → #39
- 50+ itens únicos → #40
- 15+ quests → #41
- Efeitos sonoros e trilha sonora → #42
- Sistema de ranking → #43
- Suporte a mobile (layout responsivo)
- Otimização de performance
- Testes de carga (500+ jogadores simultâneos) → #45
- i18n (pt-BR, en-US)
- **Entrega:** Jogo jogável do começo ao mid-game.

---

## ⏳ Fase 6 — Lançamento e Operação (0%)

**Status:** ⏳ **Não iniciado**

- Infraestrutura de produção (VPS/CDN) → #44
- Domínio e SSL
- Landing page → #46
- Discord/community
- Beta fechado → Beta aberto → Lançamento
- Monitoramento e alerts
- Iteração baseada em feedback
- **Entrega:** Jogo no ar com comunidade ativa.

---

## O que NÃO está no escopo (por enquanto)

- Sistema de castle siege (GvG)
- Ilusão de Tarkan, Karutan, etc. (expansões)
- Sistema de pets
- Jogabilidade mobile completa (nativo)
- Blockchain/NFT — **Não e nunca**

---

## 📊 Resumo de Progresso

| Fase | % | Status | Testes | Issues abertas |
|------|:-:|:------:|:------:|:--------------:|
| F0: Fundação | 100% | ✅ | 54 | 2 (#53, #54) |
| F1: Movimento | 85% | 🟡 | 206 | 2 (#47, #48) |
| F2: Combate | 40% | 🟡 | 247 | 5 |
| F3: Itens | 0% | ⏳ | — | 7 |
| F4: Social | 0% | ⏳ | — | 7 |
| F5: Conteúdo | 0% | ⏳ | — | 8 |
| F6: Launch | 0% | ⏳ | — | 0 |
| **Total** | | | **247 testes** | **30 issues** |
