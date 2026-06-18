# Sistema de Skills

## Visão Geral

Cada classe possui uma árvore de skills única. Skills consomem MP, têm cooldown e podem ser evoluídas com pontos de skill (ganhos a cada 5 levels).

## Classes e Skills (Planejamento Inicial)

### Dark Knight

| Skill | Level req | MP | Cooldown | Descrição |
|-------|-----------|-----|----------|-----------|
| Normal Attack | 1 | 0 | 0s | Ataque básico corpo a corpo |
| Slash | 1 | 4 | 1s | Corte rápido (150% dano) |
| Whirlwind | 15 | 10 | 3s | Ataque em área ao redor (120% dano) |
| Charge | 30 | 15 | 5s | Investida que stuna o alvo por 1s |
| Life Steal | 50 | 20 | 8s | Ataque que recupera 10% do dano como HP |
| Rage Blow | 70 | 30 | 10s | Golpe poderoso (250% dano) |
| Comet | 100 | 50 | 15s | AOE em linha reta (300% dano) |

### Dark Wizard

| Skill | Level req | MP | Cooldown | Descrição |
|-------|-----------|-----|----------|-----------|
| Energy Ball | 1 | 3 | 0.5s | Projétil básico mágico |
| Flame | 1 | 6 | 1s | Bola de fogo (130% dano mágico) |
| Ice Storm | 15 | 12 | 3s | AOE de gelo que lentifica |
| Teleport | 20 | 10 | 5s | Teletransporte para destino (fuga/posicionamento) |
| Meteor | 40 | 25 | 6s | AOE grande (200% dano mágico) |
| Lightning | 60 | 35 | 8s | Raio que atinge 3 alvos |
| Nova | 80 | 60 | 20s | AOE massivo (400% dano mágico) |

### Elf

| Skill | Level req | MP | Cooldown | Descrição |
|-------|-----------|-----|----------|-----------|
| Arrow | 1 | 0 | 0s | Ataque à distância básico |
| Multishot | 1 | 5 | 2s | Dispara 3 flechas (100% dano cada) |
| Heal | 10 | 15 | 4s | Cura aliado alvo (Recupera 30% HP) |
| Summon | 25 | 20 | 10s | Invoca criatura que luta ao lado |
| Buff STR | 30 | 10 | 60s | Buff em área: +10% STR por 60s |
| Buff AGI | 45 | 10 | 60s | Buff em área: +10% AGI por 60s |
| Penetrating Arrow | 60 | 30 | 5s | Flecha que ignora 50% da defesa |

### Summoner

| Skill | Level req | MP | Cooldown | Descrição |
|-------|-----------|-----|----------|-----------|
| Dark Ball | 1 | 4 | 0.5s | Projétil sombrio |
| Curse | 1 | 8 | 3s | Amaldiçoa alvo: reduz defesa em 20% por 10s |
| Chain Lightning | 15 | 15 | 4s | Raio que pula entre 5 alvos |
| Summon Beast | 30 | 25 | 15s | Invoca besta sombria que ataca alvos |
| Mana Shield | 40 | 20 | 30s | 50% do dano vai para MP ao invés de HP |
| Poison Cloud | 55 | 30 | 8s | AOE de veneno (dano ao longo do tempo) |
| Dark Soul | 80 | 45 | 12s | Projétil que causa dano + silence 2s |

### Magic Gladiator

| Skill | Level req | MP | Cooldown | Descrição |
|-------|-----------|-----|----------|-----------|
| Normal Attack | 1 | 0 | 0s | Ataque corpo a corpo |
| Fire Slash | 1 | 5 | 1.5s | Corte com dano físico + mágico |
| Power Up | 15 | 15 | 30s | Buff: +20% dano físico e mágico por 30s |
| Explosion | 35 | 25 | 6s | AOE fogo (200% dano combinado) |
| Whirlwind | 50 | 20 | 4s | Tornado que atrai inimigos |
| Inferno | 70 | 40 | 15s | AOE massivo de fogo |
| Berserker | 90 | 50 | 45s | Buff: +50% dano, -30% defesa, 15s |

## Sistema de Evolução

Cada skill tem nível (0-10). A cada nível:
- Dano aumenta em +10% (multiplicativo)
- MP cost aumenta em +5%
- Cooldown reduz em 3%

Pontos de skill: 1 ponto a cada 5 levels (nível 5, 10, 15, ...).
