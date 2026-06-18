# 📜 Sistema de Quests — Arcan Gods

> **Versão:** 1.0.0  
> **Data:** 2026-06-18  
> **Total de quests planejadas:** 25+ (distribuídas por milestones)

---

## 1. Estrutura de uma Quest

```yaml
id: quest_001
title: "O Despertar"
type: "main" | "side" | "daily" | "repeatable"
level_required: 1
level_max: 999
start_npc: "NPC_Elf_Guardian"
end_npc: "NPC_Elf_Guardian"
map: "lorencia"

objectives:
  - type: "kill" | "collect" | "talk" | "deliver" | "explore" | "escort"
    target: "monster_buddy" | "item_wood" | "npc_elder"
    amount: 10
    description: "Mate 10 Buddy Buddy"

rewards:
  experience: 500
  gold: 200
  items:
    - id: "potion_hp_small"
      amount: 5
    - id: "potion_mp_small"
      amount: 3

prerequisites:
  - quest: "quest_000"   # Quest anterior (para main quests)
  - level: 5             # Nível mínimo

dialogue:
  start: "Bem-vindo, aventureiro. Precisamos de sua ajuda."
  progress: "Ainda não terminou? Volte quando completar."
  complete: "Excelente trabalho! Você merece esta recompensa."
```

---

## 2. Tipos de Quest

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Main** | Missão principal da história | "Colete as 7 Arcan Gems" |
| **Side** | Missão secundária opcional | "Ajude o ferreiro local" |
| **Daily** | Resetam diariamente | "Mate 20 monstros hoje" |
| **Repeatable** | Podem ser repetidas sempre | "Entregue madeira para o carpinteiro" |
| **Class** | Específica da classe | "Aprenda a skill Energy Ball" |
| **Party** | Requer grupo | "Derrote o chefe da floresta" |

---

## 3. Main Quests — A Jornada Principal

### Ato I: O Despertar (Níveis 1-10)
*Ambientação em Lorencia*

| # | Quest | NPC | Requisito | Recompensa |
|---|-------|-----|-----------|------------|
| 1 | **O Despertar** | Guardião Elfo | Falar com o Guardião | 50 XP, Poção HP x3 |
| 2 | **A Ameaça Cresce** | Guardião Elfo | Mate 10 Buddy Buddy | 200 XP, 100 Gold |
| 3 | **Prova de Fogo** | Mestre de Armas | Mate 5 Spider | 400 XP, Arma Iniciante |
| 4 | **A Primeira Skill** | Mestre de Magia | Use uma skill 5x | 300 XP, Poção MP x3 |
| 5 | **Suprimentos para Lorencia** | Mercador Viajante | Colete 8 Madeiras | 500 XP, 200 Gold |
| 6 | **O Portal de Noria** | Guardião Elfo | Atravesse o portal | 600 XP, Armadura Leve |

### Ato II: A Floresta Encantada (Níveis 10-30)
*Aventuras em Noria*

| # | Quest | NPC | Requisito | Recompensa |
|---|-------|-----|-----------|------------|
| 7 | **Bem-vindo a Noria** | Guia Sylph | Explore a floresta | 800 XP |
| 8 | **Corrupção na Floresta** | Druida Velho | Mate 15 Elite Goblins | 1.500 XP, Anel de Agilidade |
| 9 | **A Fonte da Vida** | Druida Velho | Colete 10 Águas da Fonte | 2.000 XP, Poção HP Grande x5 |
| 10 | **O Sumiço da Guardiã** | Rainha Sylva | Encontre a Guardiã Perdida | 3.000 XP, Arco de Noria |
| 11 | **Raízes do Mal** | Rainha Sylva | Derrote o Treant Corrompido (boss) | 5.000 XP, 1.000 Gold |
| 12 | **Portal para Devias** | Rainha Sylva | Atravesse o portal | 4.000 XP | 

### Ato III: As Montanhas de Gelo (Níveis 30-50)
*Desafios em Devias*

| # | Quest | NPC | Requisito | Recompensa |
|---|-------|-----|-----------|------------|
| 13 | **A Fortaleza de Gelo** | Guarda de Devias | Entre em Devias | 5.000 XP |
| 14 | **Cristais Arcanos** | Minerador Ancião | Colete 15 Cristais de Gelo | 8.000 XP, 2.000 Gold |
| 15 | **Caçada nas Montanhas** | Caçador de Gelo | Mate 20 Yetis | 10.000 XP |
| 16 | **O Segredo do Mestre** | Mestre de Gelo | Sobreviva à prova de fogo | 15.000 XP, Cajado de Gelo |
| 17 | **A Ira do Golem** | Mestre de Gelo | Derrote o Golem de Cristal (boss) | 20.000 XP, Gema Bless |

### Ato IV: O Templo Perdido (Níveis 50+)
*Confronto final*

| # | Quest | NPC | Requisito | Recompensa |
|---|-------|-----|-----------|------------|
| 18 | **As Ruínas Antigas** | Sábio Erante | Entre no Templo Perdido | 25.000 XP |
| 19 | **Os Lacaios de Negrus** | Sábio Erante | Derrote 30 Cultistas | 35.000 XP, 3.000 Gold |
| 20 | **A Última Gema** | Sábio Erante | Colete a Gem of Creation | 50.000 XP |
| 21 | **O Despertar de Negrus (FINAL)** | — | Derrote o Arcanos Negrus | 100.000 XP, Título de God |

---

## 4. Side Quests (Secundárias)

### Lorencia (Níveis 1-15)

| Quest | NPC | Requisito | Recompensa |
|-------|-----|-----------|------------|
| **Entregas do Ferreiro** | Ferreiro Brund | Entregue 5 Minérios | 300 XP, 150 Gold |
| **O Gato Perdido** | Menina Lili | Encontre o gato na floresta | 200 XP, Amuleto da Sorte |
| **Treinamento de Combate** | Instrutor de Guerra | Complete 3 combates | 500 XP, Poção HP x5 |
| **Poções para Viagem** | Alquimista Zen | Colete 5 Ervas Raras | 400 XP, Poção MP x5 |
| **Limpando as Ruas** | Capitão da Guarda | Mate 10 Monstros na periferia | 600 XP, 300 Gold |

### Noria (Níveis 10-30)

| Quest | NPC | Requisito | Recompensa |
|-------|-----|-----------|------------|
| **Sementes da Vida** | Jardineira Flora | Plante 10 sementes mágicas | 1.500 XP |
| **Caça aos Poachers** | Guarda Florestal | Derrote 5 Caçadores Ilegais | 2.000 XP, Arco Leve |
| **O Mel de Noria** | Apicultor Mel | Colete 10 Méis de Fada | 1.800 XP, Poção HP x5 |
| **Penas de Fênix** | Artesã de Plumas | Colete 5 Penas Brilhantes | 2.500 XP, Cape de Noria |

### Devias (Níveis 30-50)

| Quest | NPC | Requisito | Recompensa |
|-------|-----|-----------|------------|
| **Peles de Ursos** | Peleteiro | Colete 8 Peles de Urso Polar | 5.000 XP, 1.000 Gold |
| **Cerveja de Gelo** | Bartender | Entregue 10 Águas Glaciais | 4.000 XP |
| **Escalada Perigosa** | Alpinista | Explore o Pico Norte | 6.000 XP, Poção MP Grande x5 |
| **O Yeti Albino** | Caçador | Mate o Yeti Raro (mini-boss) | 8.000 XP, Gema Soul |

---

## 5. Class Quests

### Dark Knight

| Nível | Quest | Habilidade |
|-------|-------|------------|
| 1 | A Força do Guerreiro | Twisting Slash |
| 30 | A Armadura Arcana | Rage Strike |
| 60 | A Fúria do Cavaleiro | Combo Skill |

### Dark Wizard

| Nível | Quest | Habilidade |
|-------|-------|------------|
| 1 | O Primeiro Feitiço | Energy Ball |
| 30 | O Livro do Fogo | Flame |
| 60 | O Grimório do Gelo | Ice Storm |

### Elf

| Nível | Quest | Habilidade |
|-------|-------|------------|
| 1 | A Primeira Flecha | Triple Shot |
| 30 | A Bênção da Floresta | Heal |
| 60 | A Fúria da Natureza | Summon Elfo |

### Summoner

| Nível | Quest | Habilidade |
|-------|-------|------------|
| 1 | O Pacto | Summon Goblin |
| 30 | O Selo Negro | Debuff Enfraquecer |
| 60 | A Legião | Summon Demon |

### Magic Gladiator

| Nível | Quest | Habilidade |
|-------|-------|------------|
| 1 | O Equilíbrio | Flame Slash |
| 30 | A Fusão | Power-Up Físico + Mágico |
| 60 | O Despertar Híbrido | Combo Mágico-Físico |

---

## 6. Daily Quests

| Quest | Requisito | Recompensa | Reset |
|-------|-----------|------------|-------|
| **Caçada Diária (Fácil)** | Mate 20 monstros ≤ seu nível | 5.000 XP, 500 Gold | 24h |
| **Caçada Diária (Médio)** | Mate 15 monstros do seu nível | 10.000 XP, 1.000 Gold | 24h |
| **Caçada Diária (Difícil)** | Mate 10 monstros > seu nível | 20.000 XP, 3.000 Gold | 24h |
| **Coleta Diária** | Colete 20 recursos | 3.000 XP, Poção Aleatória | 24h |
| **Defesa da Cidade** | Derrote invasores | 8.000 XP, Gem Aleatória | 24h |

---

## 7. Repeatable Quests

| Quest | NPC | Requisito | Recompensa |
|-------|-----|-----------|------------|
| **Suprimentos Infinitos** | Mercador | Entregue 50 Madeiras | 2.000 XP, 500 Gold |
| **Pele em Pele** | Peleteiro | Entregue 20 Peles | 3.000 XP, 800 Gold |
| **Minérios Raros** | Ferreiro | Entregue 30 Minérios | 4.000 XP, Arma Aleatória |
| **Cristais de Poder** | Alquimista | Entregue 10 Cristais Arcanos | 10.000 XP, Gem Aleatória |

---

## 8. Event Quests (Futuro)

| Quest | Evento | Recompensa |
|-------|--------|------------|
| **Invasão das Trevas** | Monstros extras spawnam | XP em dobro |
| **Caça ao Tesouro** | Tesouro escondido no mapa | Item raro |
| **Guerra de Guilds** | Guild vs Guild | Título + Gem |
| **Blood Castle** | Dungeon temporária | Item lendário |
| **Devil Square** | Arena sobrevivência | XP massivo |

---

## 9. Progressão de Quests por Milestone

| Milestone | Quests Main | Quests Side | Total |
|-----------|-------------|-------------|-------|
| M1 (Fundação) | — | — | 0 |
| M2 (Movimento) | — | — | 0 |
| M3 (Combate) | 6 (Ato I) | 8 | **14** |
| M4 (Inventário) | 6 (Ato II) | 5 | **25** |
| M5 (Mundo Vivo) | 6 (Ato III) | 5 | **36** |
| M6 (Beta) | 3 (Ato IV) | 3 | **42** |

---

## 10. Sistema de Recompensas

### Fórmulas

```
XP Reward = base_xp * (1 + (level / 100))
Gold Reward = base_gold * (1 + (level / 50))

Item Drop Rate em Quest:
- Item comum: 100%
- Item mágico: 30%
- Item raro: 10%
- Item único: 2%
- Item lendário: 0.5%
```

### Tipos de Recompensa

| Tipo | Exemplos |
|------|----------|
| **Experiência** | XP direto para level up |
| **Gold** | Moeda do jogo |
| **Poções** | HP, MP, Stamina |
| **Equipamento** | Melhor que o atual |
| **Gems** | Bless, Soul, Chaos |
| **Skills** | Novas habilidades |
| **Títulos** | "God Slayer", "Savior of Noria" |
| **Pets** | Companheiros (futuro) |
