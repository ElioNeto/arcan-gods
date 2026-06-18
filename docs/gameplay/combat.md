# Sistema de Combate

> **Status:** ✅ Implementado (Ciclo 03) — 247 testes

## Visão Geral

O combate é **server-authoritative**. O jogador clica em um alvo (PLAYER_ATTACK), o servidor valida e calcula o dano usando fórmulas matemáticas, e retorna o resultado (ENTITY_DAMAGED).

## Fluxo

```
Cliente                                   Servidor
  │                                          │
  │── PLAYER_ATTACK {targetId} ────────────►│
  │                                          ├── Valida: alvo existe, vivo
  │                                          ├── Valida: distância ≤ 2 tiles (Manhattan)
  │                                          ├── Valida: cooldown ≥ 500ms
  │                                          ├── Calcula: hit rate (AGI + level)
  │                                          ├── Calcula: crítico (10% + 0.5%/AGI)
  │                                          ├── Calcula: dano físico (STR * 2 + level * 1.5)
  │                                          ├── Aplica: defesa (def / 2)
  │                                          ├── Aplica: dano no alvo
  │                                          ├── Se kill: XP + Gold
  │◄── ENTITY_DAMAGED {damage, hp, killed}─│
```

## Fórmulas

### Dano Físico (Dark Knight, Magic Gladiator)

```
Base      = (STR × 2) + (level × 1.5)
Variação  = random(0, weaponDamage)
Dano Bruto = Base + Variação
```

### Dano Mágico (Dark Wizard, Summoner)

```
Base      = (ENE × 2.5) + (level × 2)
Variação  = random(0, skillDamage)
Dano Bruto = Base + Variação
```

### Defesa

```
Redução = defesa ÷ 2
Dano Final = max(1, Dano Bruto - Redução)
```

### Acerto (Hit Rate)

```
Chance = 50 + (AGI × 2) + (atkLevel - defLevel) × 3
Mínimo: 20% | Máximo: 95%
```

### Crítico

```
Chance = 10 + floor(AGI × 0.5)
Multiplicador: 1.5×
```

### Experiência (ao matar monstro)

```
Multiplicador:
  monstro ≥ +5 níveis:  1.5×
  monstro +2 a +4:      1.2×
  monstro -1 a +1:      1.0×
  monstro -2 a -4:      0.8×
  monstro ≤ -5 níveis:  0.5×

XP Final = baseExp × multiplicador
```

### Gold

```
Gold = baseGold × (1 + playerLevel × 0.1)
```

## Constantes

| Parâmetro | Valor | Descrição |
|-----------|:-----:|-----------|
| `ATTACK_RANGE` | 2 | Alcance máximo em tiles |
| `ATTACK_COOLDOWN` | 500ms | Intervalo entre ataques |
| `CRIT_BASE_CHANCE` | 10% | Chance base de crítico |
| `HIT_RATE_MIN` | 20% | Acerto mínimo |
| `HIT_RATE_MAX` | 95% | Acerto máximo |
| `BASE_HP` | 50 | HP inicial |
| `BASE_MP` | 10 | MP inicial |
| `STAT_POINTS_PER_LEVEL` | 5 | Pontos de atributo por level |

## Monster Templates Atuais

| Monstro | Level | HP | Dano | Defesa | EXP | Gold | Aggro |
|---------|:-----:|:--:|:----:|:-----:|:---:|:----:|:-----:|
| Buddy Buddy | 1 | 50 | 5-10 | 2 | 10 | 5 | 4 |
| Spider | 3 | 80 | 8-15 | 3 | 25 | 10 | 5 |

## Pendências

- [ ] AI de monstros (FSM: idle/aggro/chase/attack) — #51
- [ ] Skills por classe (Energy Ball, Twisting Slash) — #52
- [ ] Animações de ataque e morte (cliente)
- [ ] Efeitos visuais (partículas, damage numbers)
- [ ] Drop de itens (apenas gold atualmente)
