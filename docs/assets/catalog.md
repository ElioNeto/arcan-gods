# 📦 Catálogo de Assets — Arcan Gods

> **Versão:** 2.0.0  
> **Data:** 2026-06-18  
> **Fonte:** CraftPix.net (27 pacotes)  
> **Localização:** `client/public/assets/`  
> **Total:** 2.900 PNGs

---

## Estrutura de Diretórios

```
client/public/assets/
├── characters/           → Personagens jogáveis (9 kits × múltiplas variações)
│   ├── cyberpunk/        → 3 chars: biker, punk, cyborg
│   ├── shinobi/          → 3 chars: shinobi, samurai, fighter
│   ├── vampire/          → 3 chars: converted, countess, girl
│   ├── elf/              → 🆕 Elfa arqueira (210 sprites)
│   ├── wizard/           → 🆕 Mago de gelo + relâmpago (116 sprites)
│   ├── fairy/            → 🆕 Fada mágica (240 sprites)
│   ├── assassin/         → 🆕 Assassino/Mago/Viking (116 sprites)
│   ├── elf-warrior/      → 🆕 Elfo guerreiro (627 sprites)
│   └── dark-elf/         → 🆕 Elfo sombrio (96 sprites)
├── npcs/                 → NPCs interativos
├── monsters/             → Inimigos e criaturas (5 categorias)
├── tilesets/             → Tilesets para mapas
├── items/                → Ícones de itens
├── ui/                   → 🆕 Interface do usuário
│   ├── avatars/          → 🆕 Avatares de personagem (50)
│   ├── boot-icons/       → 🆕 Ícones de botas (50)
│   ├── skill-icons/      → 🆕 Ícones de habilidades (50)
│   └── roguelike/        → 🆕 Elementos GUI (214)
├── vehicles/trucks/      → Peças de veículos
├── effects/graffiti/     → Decals e efeitos visuais
├── maps/                 → Mapas Tiled (futuro)
├── licenses/             → Licenças dos pacotes
└── manifest.json         → Índice completo para o AssetManager
```

---

## 1. Personagens Jogáveis

### 1.1 Cyberpunk — 3 personagens, 12 animações cada

**Sprite size:** ~48px height  
**Estilo:** Cyberpunk futurista  
**Origem:** `craftpix-net-856554`

| Variante | Arquivo | Animações |
|----------|---------|-----------|
| 🏍️ **Biker** | `cyberpunk/biker/` | idle, run, run_attack, jump, doublejump, climb, punch, hurt, death, attack1/2/3 |
| 🧑‍🎤 **Punk** | `cyberpunk/punk/` | idle, run, run_attack, jump, doublejump, climb, punch, hurt, death, attack1/2/3 |
| 🤖 **Cyborg** | `cyberpunk/cyborg/` | idle, run, run_attack, jump, doublejump, climb, punch, hurt, death, attack1/2/3 |

**Indicado para:** Dark Knight (Biker), Magic Gladiator (Cyborg), classes ágeis

---

### 1.2 Shinobi — 3 personagens, 10 animações cada

**Sprite size:** ~48-64px height  
**Estilo:** Japão feudal / Ninja  
**Origem:** `craftpix-net-453698`

| Variante | Animações |
|----------|-----------|
| 🗡️ **Shinobi** | Idle, Walk, Run, Jump, Attack_1/2/3, Shield, Hurt, Dead |
| ⚔️ **Samurai** | Idle, Walk, Run, Jump, Attack_1/2/3, Shield, Hurt, Dead |
| 👊 **Fighter** | Idle, Walk, Run, Jump, Attack_1/2/3, Shield, Hurt, Dead |

**Indicado para:** Dark Knight (Samurai), classes marciais

---

### 1.3 Vampire — 3 personagens, 10-14 animações cada

**Sprite size:** ~64-96px height  
**Estilo:** Fantasia gótica / Vampiro  
**Origem:** `craftpix-net-506778`

| Variante | Animações |
|----------|-----------|
| 🧛 **Converted** | Idle, Walk, Run, Jump, Attack_1/2/3, Protect, Hurt, Dead |
| 👸 **Countess** | Idle, Walk, Run, Jump, Attack_1/2/3/4, Blood_Charge_1/2/3/4, Hurt, Dead |
| 🧛‍♀️ **Girl** | Idle, Walk, Run, Jump, Attack_1/2/3/4, Hurt, Dead |

**Indicado para:** Dark Wizard (Converted), Elf/Summoner (Girl, Countess)

---

### 1.4 Elf Archer — 210 sprites 🆕

**Sprite size:** Vários (SCML skeleton + PNG)  
**Estilo:** Fantasia medieval — Elfa com arco  
**Origem:** `craftpix-392011`

| Variação | Animações |
|----------|-----------|
| Personagem 1, 2, 3 | Idle, Walk, Attack (arco), Hurt, Death + partes do corpo separadas (SCML) |

**Indicado para:** **Classe Elf** — finalmente temos uma arqueira!

### 1.5 Wizard — 2 variações, 116 sprites 🆕

**Sprite size:** Frames individuais  
**Estilo:** Fantasia — Mago de Gelo + Mago de Relâmpago  
**Origem:** `craftpix-577002` (gelo) + `craftpix-529677` (relâmpago)

| Variante | Animações |
|----------|-----------|
| 🧊 **Ice Wizard** | Idle, Walk, Run, Jump, Attack, Hurt, Die |
| ⚡ **Lightning Mage** | Idle, Walk, Run, Jump, Attack_1, Charge, Light_ball, Light_charge, Hurt, Dead |

**Indicado para:** **Classe Dark Wizard**

### 1.6 Fairy — 240 sprites 🆕

**Sprite size:** Vários (SCML skeleton + PNG)  
**Estilo:** Fantasia — Fada com asas e magia  
**Origem:** `craftpix-733001`

**Indicado para:** Summoner, efeitos especiais, NPC

### 1.7 Assassin/Mage/Viking — 3 heróis, 116 sprites 🆕

**Sprite size:** Frames individuais  
**Estilo:** Fantasia medieval  
**Origem:** `craftpix-891165`

| Classe | Animações |
|--------|-----------|
| 🗡️ **Assassin** | Idle, Walk, Attack, Hurt, Death |
| 🔮 **Mage** | Idle, Walk, Attack (Fire), Hurt, Death |
| 🪓 **Viking** | Idle, Walk, Attack, Hurt, Death |

**Indicado para:** Dark Knight (Viking), Dark Wizard (Mage), classes ágeis (Assassin)

### 1.8 Elf Warrior — 627 sprites 🆕

**Sprite size:** Frames individuais  
**Estilo:** Fantasia — Elfo guerreiro com espada  
**Origem:** `craftpix-933170`

| Variação | Animações |
|----------|-----------|
| Elves 1-8 | idle, walk, attack, hurt, death (múltiplos frames cada) |

**Indicado para:** Dark Knight, Magic Gladiator, variantes de elfo

### 1.9 Dark Elf — 96 sprites 🆕

**Sprite size:** Rostos/ícones  
**Estilo:** Fantasia sombria — Elfo negro  
**Origem:** `craftpix-636003`

| Categoria | Conteúdo |
|-----------|----------|
| Dark_Elves | 8 personagens × 4 faces cada |
| Dark_Elves_faces | Rostos em close |
| Dark_Elves_faces_transparent | Rostos com fundo transparente |

**Indicado para:** Classe Summoner, NPCs élficos sombrios, avatares de personagem

---

## 2. NPCs

### 2.1 Townspeople Cyberpunk — 12 NPCs

**Sprite size:** ~48px height  
**Origem:** `craftpix-net-481510`

| NPCs | Animações |
|------|-----------|
| npc_1 a npc_12 | **Idle** + **Walk** (todos) + **Special** (alguns: fumar, beber, etc.) |

**Uso:** Civis em cidades cyberpunk, mercadores, quest givers

### 2.2 Schoolgirls — 3 NPCs

**Sprite size:** ~64px height  
**Origem:** `craftpix-net-242415`

| Variante | Animações |
|----------|-----------|
| Girl 1 | Idle, Walk, Dialogue, Attack, Book, Protection |
| Girl 2 | Idle, Walk, Dialogue, Attack, Protection |
| Girl 3 | Idle, Walk, Dialogue, Attack, Protection |

**Uso:** NPCs especiais, quest givers, personagens da história

---

## 3. Monstros

### 3.1 City Enemies — 6 inimigos

**Sprite size:** ~48px height  
**Origem:** `craftpix-net-223841`

| Inimigo | Animações |
|---------|-----------|
| enemy_1 a enemy_5 | Idle, Walk, Attack, Hurt, Death |
| enemy_6 (mago) | + Ball1, Ball2 (projéteis) |

**Uso:** Inimigos urbanos comuns (gangsters, mutants)

### 3.2 Bosses — 3 chefes

**Sprite size:** ~64-96px height  
**Origem:** `craftpix-net-261169`

| Boss | Animações |
|------|-----------|
| boss_1 (ogro/demon) | Idle/2/3, Walk/2, Hurt/2, Death/2, Attack, Out |
| boss_2 (caveira) | Idle, Walk, Attack1/2/3/4, Hurt, Death, Sneer, Bullet |
| boss_3 (planta) | Idle, Walk, Attack1/2/3/4, Hurt, Death, Sneer, Ball |

**Uso:** Chefes de fase, mini-bosses, elite mobs

### 3.3 Ghosts — 3 espíritos

**Sprite size:** ~48-64px height  
**Estilo:** Folclore japonês / Horror  
**Origem:** `craftpix-net-872297`

| Fantasma | Animações |
|----------|-----------|
| Gotoku | Idle, Walk, Run, Attack_1/2/3, Hurt, Scream, Dead, Jump |
| Onre | Idle, Walk, Run, Attack_1/2/3, Hurt, Scream, Dead, Flight |
| Yurei | Idle, Walk, Run, Attack_1/2/3/4, Charge_1/2, Hurt, Scream, Dead |

**Uso:** Monstros espectrais, áreas assombradas

### 3.4 Street Animals — 8 animais

**Sprite size:** ~32-48px height  
**Origem:** `craftpix-net-610575`

| Animais | Animações |
|---------|-----------|
| Dog 1/2, Cat 1/2, Rat 1/2, Bird 1/2 | Idle, Walk, Hurt, Death (+Attack para cães/gatos) |

**Uso:** Animais de rua, mobs passivos, cenário

### 3.5 Drones — 5 drones

**Sprite size:** ~48px height  
**Origem:** `craftpix-net-902201`

| Drone | Animações |
|-------|-----------|
| Drone 1/5 | idle, fly, attack, hurt, death |

**Uso:** Inimigos aéreos, sentinelas mecânicos

---

## 4. Tilesets

### 4.1 Industrial Zone — 143 tiles

**Tile size:** 32×32 px  
**Origem:** `craftpix-net-314143`

| Categoria | Quantidade | Conteúdo |
|-----------|-----------|----------|
| Tiles | 81 | Chãos, paredes, escadas, plataformas |
| Background | 6 | Cenários de fundo (320×180) |
| Objects | 44 | Barris, armários, cercas, tubulações |
| Animated | 12 | Monitores, luzes piscando, esteiras |

**Uso:** Mapas urbanos/industriais — Lorencia cyberpunk, fábricas, esgotos

### 4.2 Green Zone — 192 tiles

**Tile size:** 32×32 px  
**Origem:** `craftpix-net-846754`

| Categoria | Quantidade | Conteúdo |
|-----------|-----------|----------|
| Tiles | 96 | Grama, terra, água, pedras, flores |
| Background | 1 | Overlay de iluminação |
| Objects | 84 | Arbustos, cercas, bancos, fontes, skates, flores |
| Animated | 5 | Plantas animadas, fontes |
| Spritesheet | 1 | `Tileset.png` — spritesheet completa do tileset |

**Uso:** Mapas naturais/públicos — Noria, parques, áreas verdes

---

## 5. UI e Interface

### 5.1 Avatares de Personagem — 50 ícones 🆕

**Size:** ~256×256 px  
**Origem:** `craftpix-net-414604` + `craftpix-net-988902`

Retratos de personagens estilo RPG fantasia para:
- Tela de seleção de personagem
- Mini-retrato no HUD
- Perfil do jogador

### 5.2 Skill Icons — 50 ícones 🆕

**Size:** ~64×64 px  
**Origem:** `craftpix-net-640404`

Ícones de habilidades Aeromancer:
- Feitiços de vento, ar, tempestade
- Ataques especiais
- Buffs e debuffs

**Uso:** Hotbar de skills, árvore de talentos, UI de combate

### 5.3 Boot Icons — 50 ícones 🆕

**Size:** ~64×64 px  
**Origem:** `craftpix-net-138688`

Ícones de botas e calçados para equipamento:
- Botas de couro, metal, mágicas
- Variações por tier (comum → lendário)

### 5.4 Roguelike GUI — 214 elementos 🆕

**Origem:** `craftpix-net-436971`

Elementos de interface:
- Botões (múltiplos estilos)
- Janelas e molduras
- Ícones diversos

## 6. Itens

### Cyberpunk Icons — 40 ícones

**Size:** 32×32 px  
**Origem:** `craftpix-net-184808`

Ícones de recursos cyberpunk com estilo neon:
- Poções de HP/MP
- Moedas/credits
- Armas corpo-a-corpo e à distância
- Escudos, capacetes, armaduras
- Chaves, chips, dispositivos
- Gemas, cristais, power-ups

**Uso:** Ícones de inventário, HUD, shop, loot

---

## 7. Veículos

### Truck Constructor — 105 peças

**Origem:** `craftpix-net-312671`

| Categoria | Peças |
|-----------|-------|
| Bodies | 39 cabines/caçambas |
| Chassis | 12 chassis |
| Additions | 9 acessórios |
| Patches | 39+18 adesivos/decaIs |

**Uso:** Veículos no mapa, quests de transporte, decoração

---

## 8. Efeitos

### Graffiti Constructor — 342 decals

**Origem:** `craftpix-net-920510`

| Categoria | Conteúdo |
|-----------|----------|
| Fonts | Letras e números graffiti |
| Decorations | Sprays, setas, raios, caveiras, corações, asas, estrelas |
| Transitions | Gradientes, máscaras |
| Examples | Composições prontas |

**Uso:** Decoração de mapas, marcas no chão, placas, efeitos de parede

---

## 9. Licenças

Todos os assets são de `craftpix.net` e estão sob licença **Free License** que permite:
- ✅ Uso em projetos comerciais e não-comerciais
- ✅ Modificação dos assets
- ❌ Revenda direta dos assets (apenas como parte do jogo completo)

Licenças individuais em `client/public/assets/licenses/`
