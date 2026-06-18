# Roadmap — Arcan Gods

> **Linha do tempo estimada.** Este roadmap é um plano vivo e será atualizado conforme o projeto avança.

```
Fase 0: Fundação         ████████░░░░░░░░░░░░  3-4 semanas
Fase 1: Mundo e Movim.   ██████████████░░░░░░  6-8 semanas
Fase 2: Combate          ████████████████████  8-12 semanas
Fase 3: Itens e Upgrades ████████████████████  8-12 semanas
Fase 4: Social/Quests    ██████████████░░░░░░  6-8 semanas
Fase 5: Conteúdo/Polish  ████████████████████  8-12 semanas
Fase 6: Lançamento       ████████░░░░░░░░░░░░  4 semanas
```

---

## Fase 0 — Fundação (Semanas 1-4)

**Objetivo:** infraestrutura mínima para rodar cliente + servidor se comunicando.

- [ ] Setup do monorepo (npm workspaces)
- [ ] Servidor: setup Node.js + TypeScript + ESLint + Vitest
- [ ] Cliente: setup Vite + PixiJS + TypeScript
- [ ] WebSocket: conexão cliente-servidor com handshake JWT
- [ ] Banco: migrações PostgreSQL + schemas iniciais
- [ ] Redis: sessão e cache básicos
- [ ] Pipeline CI (lint + test + build)
- [ ] Script de dev (docker-compose com banco)
- [ ] Renderização: tilemap estático carregado de JSON (Tiled)
- [ ] Asset placeholder (sprites quadrados coloridos)
- **Entrega:** Cliente conecta ao servidor, vê um tilemap, consegue mover um quadrado.

## Fase 1 — Mundo e Movimentação (Semanas 5-12)

- [ ] Pathfinding A* no servidor
- [ ] Movimento autoritativo (cliente envia destino, servidor move)
- [ ] Interpolação de movimento no cliente (movimento suave)
- [ ] Colisão com tiles sólidos e objetos
- [ ] Câmera segue player com smooth scroll
- [ ] Múltiplos mapas com transição (portais)
- [ ] Múltiplos jogadores visíveis simultaneamente
- [ ] Minimapa
- **Entrega:** Vários jogadores andam pelo mesmo mapa, se veem, trocam de mapa.

## Fase 2 — Combate (Semanas 13-22)

- [ ] Sistema de atributos (STR, AGI, ENE, VIT) e fórmulas de dano
- [ ] Classe Dark Knight (habilidade básica)
- [ ] Monstros com AI (patrulha, aggro, chase, ataque, respawn)
- [ ] Combate com clique (auto-attack)
- [ ] Animações de ataque e morte
- [ ] Sistema de XP e level up
- [ ] Classes adicionais (DW, Elf, SUM, MG)
- [ ] Sistema de skills com hotkeys
- [ ] Efeitos visuais de skills (partículas)
- [ ] Área segura vs. área PvP
- **Entrega:** Jogador entra no mapa, mata monstros, sobe de level, usa skills.

## Fase 3 — Itens e Upgrades (Semanas 23-34)

- [ ] Inventário com grade drag-and-drop
- [ ] Sistema de equipamento (armas, armaduras, acessórios)
- [ ] Drop de loot com rarity (Normal → Magic → Rare → Unique → Legend)
- [ ] Sistema de upgrade (até +15, chance de falha)
- [ ] NPC loja (comprar/vender)
- [ ] Trade entre jogadores
- [ ] Sistema de wings
- [ ] Cash shop (cosméticos)
- **Entrega:** Jogador mata monstro, dropa item, equipa, upa, troca com outros.

## Fase 4 — Social e Quests (Semanas 35-42)

- [ ] Chat global, party, guild, whisper
- [ ] Party system (compartilhamento de XP)
- [ ] Guild system (criar, convidar, lista de membros)
- [ ] Quest system (kill quests, fetch quests)
- [ ] NPCs com diálogo
- [ ] Quest log
- [ ] Friends list
- **Entrega:** Jogadores formam party, completam quests, conversam, criam guild.

## Fase 5 — Conteúdo e Polish (Semanas 43-52)

- [ ] Mapa completo de Lorencia, Devias, Noria (estilo MU)
- [ ] 20+ tipos de monstros
- [ ] 50+ itens únicos
- [ ] 15+ quests
- [ ] Efeitos sonoros e trilha sonora
- [ ] Sistema de ranking
- [ ] Suporte a mobile (layout responsivo)
- [ ] Otimização de performance
- [ ] Testes de carga (500+ jogadores simultâneos)
- [ ] i18n (pt-BR, en-US)
- **Entrega:** Jogo jogável do começo ao mid-game.

## Fase 6 — Lançamento e Operação (Semanas 53+)

- [ ] Infraestrutura de produção (VPS/CDN)
- [ ] Domínio e SSL
- [ ] Landing page
- [ ] Discord/community
- [ ] Beta fechado → Beta aberto → Lançamento
- [ ] Monitoramento e alerts
- [ ] Iteração baseada em feedback
- **Entrega:** Jogo no ar com comunidade ativa.

---

## O que NÃO está no escopo (por enquanto)

- Sistema de castle siege (GvG)
- Ilusão de Tarkan, Karutan, etc. (expansões)
- Sistema de pets
- Jogabilidade mobile completa (nativo)
- Blockchain/NFT — **Não e nunca**
