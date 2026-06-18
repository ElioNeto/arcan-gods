# Sistema de Combate

## Alvo

Combate em tempo real. Jogador clica no alvo (monstro ou outro player) e o personagem ataca automaticamente até o alvo morrer ou sair de range.

## Fórmula de Dano (Física)

```
Dano Base = (STR * 1.5) + (AGI * 0.5) + WeaponDamage
Dano Final = Dano Base - TargetDefense
```

Onde:
- **STR:** Força do atacante
- **AGI:** Agilidade do atacante (contribui menos)
- **WeaponDamage:** Dano aleatório entre min_damage e max_damage da arma
- **TargetDefense:** Defesa do alvo

## Fórmula de Dano (Mágico)

```
Dano Base = (ENE * 2.0) + WeaponMagicDamage
Dano Final = Dano Base - TargetMagicDefense
```

## Chance de Acerto

```
Chance = 90% + (AGI_attacker - AGI_target) * 0.1%
Cap: 95% max, 5% min
```

## Chance de Crítico

```
Chance = AGI / 1000
Dano crítico = Dano * 1.5
```

## Defesa

```
Defense = (VIT * 0.5) + ArmorDefense + ShieldDefense
```

## HP máximo

```
HP = 80 + (VIT * 2) + Level * 5 + Bônus de itens
```

## MP máximo

```
MP = 20 + (ENE * 1.5) + Level * 3 + Bônus de itens
```

## XP

```
XP necessária para level N = 1000 * N^1.5
XP do monstro = MonsterLevel * 50 + Bonus
XP em party = XP_total * (1 + 0.3 * (members - 1)) / members
```

## Drop

```
Chance de drop:
  - Gold: 100% (GoldDrop = MonsterLevel * random(10, 50))
  - Item comum: 40%
  - Item mágico: 15%
  - Item raro: 5%
  - Item único: 1%
  - Item lendário: 0.1%

Cada monstro tem uma drop table configurável em JSON.
```
