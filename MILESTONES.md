# Milestones — Arcan Gods

> **Marcos de entrega** com critérios de aceite objetivos.

---

## Milestone 1: 「Conexão」 (Fase 0)

**Tempo estimado:** 4 semanas

### Critérios de aceite
- [ ] Cliente Vite + PixiJS abre no navegador
- [ ] Servidor Node.js + WebSocket aceita conexão
- [ ] Tilemap carregado de JSON (Tiled) e renderizado
- [ ] Cliente envia clique, servidor move entidade, todos veem
- [ ] Login JWT funcional com PostgreSQL
- [ ] CI passa (lint + build + testes unitários)
- [ ] docker-compose levanta o stack inteiro

### Issues alocadas
- Setup monorepo
- Setup servidor (Node.js + TS + WebSocket)
- Setup cliente (Vite + PixiJS + TS)
- Tilemap loader
- Auth (JWT + PostgreSQL)
- CI pipeline
- Docker Compose

---

## Milestone 2: 「Movimento」 (Fase 1)

**Tempo estimado:** 8 semanas após M1

### Critérios de aceite
- [ ] Pathfinding A* funcional no servidor
- [ ] Movimento suave com interpolação no cliente
- [ ] Colisão com tiles e objetos
- [ ] 2+ mapas conectados por portais
- [ ] 10+ jogadores simultâneos se movendo no mesmo mapa
- [ ] Minimapa funcionando
- [ ] Câmera com smooth follow

### Issues alocadas
- Pathfinding A*
- Movimento autoritativo
- Interpolação cliente
- Colisão
- Múltiplos mapas e portais
- Câmera
- Minimapa

---

## Milestone 3: 「Combate」 (Fase 2)

**Tempo estimado:** 10 semanas após M2

### Critérios de aceite
- [ ] 5 tipos de monstros com AI
- [ ] Dark Knight funcional com auto-attack
- [ ] Dano calculado server-side com atributos
- [ ] XP e level up
- [ ] 2 classes jogáveis adicionais
- [ ] 3 skills por classe
- [ ] Respawn de monstros
- [ ] Drop de gold e itens básicos

### Issues alocadas
- AI de monstros
- Sistema de combate
- Fórmulas de dano
- Sistema de XP/Level
- Classes: Dark Knight, Dark Wizard, Elf
- Skills básicas
- Drop loot
- Efeitos visuais de combate

---

## Milestone 4: 「Inventário」 (Fase 3)

**Tempo estimado:** 12 semanas após M3

### Critérios de aceite
- [ ] Grade de inventário 8x5 funcional
- [ ] Equipamento visual no personagem
- [ ] 10+ tipos de item com stats
- [ ] Sistema de upgrade até +5
- [ ] NPC loja funcional
- [ ] Trade entre jogadores
- [ ] Sistema de wings (visual)

### Issues alocadas
- Inventário UI
- Sistema de equipamento
- Templates de item
- Upgrade system
- NPC shop
- Trade system
- Wings

---

## Milestone 5: 「Mundo Vivo」 (Fase 4)

**Tempo estimado:** 8 semanas após M4

### Critérios de aceite
- [ ] Chat global, party, guild, whisper
- [ ] Party com compartilhamento de XP
- [ ] Guild funcional (criar, entrar, chat)
- [ ] 5+ quests implementadas
- [ ] 5+ NPCs com diálogo
- [ ] Quest log
- [ ] Friends list

### Issues alocadas
- Chat system
- Party system
- Guild system
- Quest system
- NPC dialogue
- Quest log UI
- Friends list

---

## Milestone 6: 「Beta」 (Fase 5 + 6)

**Tempo estimado:** 12 semanas após M5

### Critérios de aceite
- [ ] 3 mapas completos (Lorencia, Devias, Noria)
- [ ] 20+ tipos de monstro
- [ ] 50+ itens
- [ ] 15+ quests
- [ ] Ranking funcional
- [ ] Som e música
- [ ] Beta aberto para comunidade
- [ ] Suporte a 500+ jogadores simultâneos

### Issues alocadas
- Mapas completos
- Monstros restantes
- Itens restantes
- Quests restantes
- Efeitos sonoros
- Ranking
- Infra de produção
- Testes de carga

---

## Acompanhamento

Cada milestone vira uma **Milestone no GitHub Projects**. As issues são associadas à milestone correspondente.

Progresso atual: **Milestone 1**
