# 🎯 Sprites Faltantes — Arcan Gods

> **Data:** 2026-06-18  
> **Status:** Inventário de lacunas visuais  
> **Prioridades:** P0 (essencial) → P1 (importante) → P2 (futuro)

---

## Legenda

| Marca | Significado |
|-------|-------------|
| 🔴 **P0** | Necessário para MVP / Próximo ciclo |
| 🟡 **P1** | Importante para beta |
| 🟢 **P2** | Futuro / Pós-lançamento |
| ✅ | Já temos (referência) |

---

## 1. Personagens Jogáveis

### 1.1 Mapa de Classes × Assets

| Classe | O que temos | O que falta | Prio |
|--------|-------------|-------------|------|
| **Dark Knight** | ✅ Biker, Samurai, Fighter | — | |
| **Dark Wizard** | ⚠️ Converted (vampire) serve | 🔴 Capa de mago com cajado/cristal | **P0** |
| **Elf** | ⚠️ Schoolgirl, Vampire Girl | 🔴 Arqueira com arco, armadura leve | **P0** |
| **Summoner** | 🟡 Countess (vampire) | 🔴 Túnica de summoner com livro/orbe | **P0** |
| **Magic Gladiator** | ✅ Cyborg | — | |

**Total faltando:** 3 spritesheets de classe completos (DW, Elf, Summoner)

### 1.2 Animações que faltam por classe

| Animação | Temos? | Observação |
|----------|--------|------------|
| **Idle** (parado) | ✅ | Todos os personagens têm |
| **Walk** (andar) | ✅ | Todos |
| **Run** (correr) | ✅ | Cyberpunk, Shinobi, Vampire |
| **Attack** (ataque) | ✅ | 2-4 variações por personagem |
| **Skill Cast** (magia) | ❌ **FALTA** | Animação de conjurar magia |
| **Hurt** (dano) | ✅ | Todos |
| **Death** (morrer) | ✅ | Todos |
| **Shield/Block** (bloquear) | ⚠️ Só Shinobi | Falta para classes mágicas |
| **Jump** (pular) | ✅ | Maioria |
| **Climb** (escalar) | ✅ | Só Cyberpunk |
| **Swim** (nadar) | ❌ **FALTA** | Para mapas aquáticos |
| **Sit/Emote** (sentar) | ❌ **FALTA** | Para interação social |
| **Victory** (comemorar) | ❌ **FALTA** | Level up, quest complete |
| **Stun** (atordoado) | ❌ **FALTA** | Para status effects |

---

## 2. Skills e Efeitos Mágicos

### 2.1 Efeitos de Skill por Classe

| Skill | Tipo | O que falta | Prio |
|-------|------|-------------|------|
| **Energy Ball** (DW) | Projétil | 🔴 Esfera de energia azul | **P0** |
| **Flame** (DW) | Projétil | 🔴 Bola de fogo | **P0** |
| **Twisting Slash** (DK) | Slash | 🟡 Corte giratório | **P1** |
| **Triple Shot** (Elf) | Projétil | 🟡 Flecha tripla | **P1** |
| **Heal** (Elf) | Buff | 🟡 Efeito de cura verde | **P1** |
| **Summon** (Summoner) | Evocação | 🔴 Círculo de invocação | **P0** |
| **Meteorite** (DW) | Área | 🟡 Chuva de meteoros | **P1** |
| **Ice Storm** (DW) | Área | 🟡 Tempestade de gelo | **P2** |
| **Lightning** (DW) | Raio | 🟡 Raio do céu | **P1** |
| **Buff skills** | Buff | 🟡 Auras genéricas (vermelha, azul, verde) | **P1** |
| **Debuff skills** | Debuff | 🟡 Purple/roxo para curses | **P2** |

### 2.2 Efeitos Gerais

| Efeito | O que falta | Prio |
|--------|-------------|------|
| 🔴 **Hit/Impact** | Estrela de impacto ao acertar | **P0** |
| 🔴 **Miss** | "Miss" ou desvio | **P0** |
| 🟡 **Level Up** | Efeito de subida de nível (raios, estrelas) | **P1** |
| 🟡 **Death** | Efeito de morte do monstro (poof, dissipar) | **P1** |
| 🟡 **Gold Drop** | Brilho ao dropar ouro | **P1** |
| 🟡 **Item Drop** | Brilho ao dropar item (por rarity) | **P1** |
| 🟢 **Teleport** | Efeito de teletransporte | **P2** |
| 🟢 **Shield** | Bolha de escudo mágico | **P2** |

---

## 3. UI e HUD

### 3.1 Elementos de Interface

| Elemento | O que falta | Prio |
|----------|-------------|------|
| 🔴 **HP Bar** | Barra de vida do personagem | **P0** |
| 🔴 **MP Bar** | Barra de mana | **P0** |
| 🔴 **XP Bar** | Barra de experiência | **P0** |
| 🔴 **Hotbar** | Barra de skills (1-0) | **P0** |
| 🔴 **Minimap** | Mini-mapa no canto | **P0** |
| 🔴 **Inventory Grid** | Grade 8×5 do inventário | **P0** |
| 🟡 **Equipment Slots** | Slots de equipamento (arma, capacete, etc.) | **P1** |
| 🟡 **Chat Window** | Janela de chat com abas | **P1** |
| 🟡 **Quest Log** | Janela de quests | **P1** |
| 🟡 **NPC Dialog** | Caixa de diálogo com NPC | **P1** |
| 🟡 **Party List** | Lista de membros do grupo | **P1** |
| 🟢 **Guild UI** | Interface de guild | **P2** |
| 🟢 **Shop UI** | Loja de NPC | **P2** |
| 🟢 **Trade UI** | Janela de troca | **P2** |
| 🟢 **Ranking** | Tela de ranking | **P2** |
| 🟢 **Settings** | Tela de configurações | **P2** |
| ✅ **Icons** | 40 ícones cyberpunk | ✅ Temos |

### 3.2 Botões e Molduras

| Elemento | O que falta | Prio |
|----------|-------------|------|
| 🔴 **Button** | Botão padrão (normal + hover + click) | **P0** |
| 🔴 **Window Frame** | Moldura de janela arrastável | **P0** |
| 🟡 **Close Button** | Botão fechar (X) | **P0** |
| 🟡 **Scrollbar** | Barra de rolagem | **P1** |
| 🟢 **Tab** | Abas de navegação | **P1** |
| 🟢 **Checkbox** | Caixa de seleção | **P2** |
| 🟢 **Input Field** | Campo de texto | **P1** |

---

## 4. Itens e Equipamentos

### 4.1 Ícones de Item por Categoria

| Categoria | Temos? | O que falta | Prio |
|-----------|--------|-------------|------|
| **Weapons** | 🟡 Parcial | Ícones específicos: espada, cajado, arco, besta | **P0** |
| **Armor** | ❌ FALTA | Peitoral, calças, botas, luvas | **P0** |
| **Helmets** | ❌ FALTA | Capacetes, coroas, chapéus | **P0** |
| **Shields** | ❌ FALTA | Escudos | **P0** |
| **Wings** | ❌ FALTA | Asas (MU Online style) | **P1** |
| **Jewelry** | ❌ FALTA | Anéis, amuletos, brincos | **P1** |
| **Potions** | 🟡 Parcial | Poções de HP/MP (temos alguns icons) | **P0** |
| **Scrolls** | ❌ FALTA | Pergaminhos de skill | **P1** |
| **Quest Items** | ❌ FALTA | Itens específicos de quest | **P1** |
| **Gems/Jewels** | ❌ FALTA | Joias de upgrade (Bless, Soul, Chaos) | **P0** |

### 4.2 Sprites de Equipamento no Chão

| Tipo | O que falta | Prio |
|------|-------------|------|
| 🔴 **Item no chão** | Sprite do item dropado no mapa | **P0** |
| 🟡 **Gold no chão** | Pilha de moedas | **P0** |
| 🟢 **Rarity glow** | Brilho colorido por raridade (Normal → Legend) | **P1** |

---

## 5. Tilesets por Mapa

| Mapa | Estilo | Temos? | O que falta | Prio |
|------|--------|--------|-------------|------|
| **Lorencia** | Cidade medieval | ⚠️ Parcial | Temos industrial/cyberpunk — faltam tiles medievais (pedra, madeira, telhados) | **P0** |
| **Devias** | Neve/Gelo | ❌ **FALTA** | Tileset de inverno completo (neve, gelo, pinheiros) | **P0** |
| **Noria** | Floresta | 🟡 Parcial | Green Zone serve parcialmente — faltam árvores altas, flores, riachos | **P0** |
| **Atlans** | Subaquático | ❌ **FALTA** | Tileset aquático (água, corais, algas, ruínas) | **P1** |
| **LostTower** | Dungeon | ❌ **FALTA** | Tileset de torre/pedra escura | **P1** |
| **Icarus** | Céu/Nuvens | ❌ **FALTA** | Plataformas nas nuvens | **P2** |
| **Kanturu** | Ruínas | ❌ **FALTA** | Ruínas futuristas | **P2** |
| **Aida** | Floresta densa | 🟡 Green Zone cobre parcialmente | **P2** |

### 5.1 Elementos de Mapa Faltantes

| Elemento | O que falta | Prio |
|----------|-------------|------|
| 🔴 **Portais** | Sprite de portal/transição entre mapas | **P0** |
| 🔴 **Safe Zone** | Marcador visual de área segura | **P0** |
| 🟡 **Doors** | Portas que abrem | **P1** |
| 🟡 **Lever/Switch** | Alavancas e botões | **P1** |
| 🟡 **Chests** | Baús (fechado + aberto) | **P1** |
| 🟢 **Signs** | Placas informativas | **P1** |

---

## 6. Efeitos Sonoros e Música

| Tipo | O que falta | Prio |
|------|-------------|------|
| 🔴 **BGM - Lorencia** | Música de fundo da cidade principal | **P1** |
| 🟡 **BGM - Devias** | Música de inverno | **P1** |
| 🟡 **BGM - Noria** | Música de floresta | **P1** |
| 🔴 **SFX - Attack** | Som de ataque corpo-a-corpo | **P0** |
| 🔴 **SFX - Hit** | Som de acerto | **P0** |
| 🔴 **SFX - Death** | Som de morte de monstro | **P0** |
| 🔴 **SFX - Level Up** | Som de level up | **P0** |
| 🔴 **SFX - Click** | Som de clique em botão | **P0** |
| 🟡 **SFX - Magic** | Som de magia | **P1** |
| 🟡 **SFX - Item Drop** | Som de item caindo | **P1** |
| 🟡 **SFX - UI** | Sons de interface (abrir janela, etc.) | **P1** |
| 🟢 **SFX - Ambient** | Sons ambiente (pássaros, vento, cidade) | **P2** |

---

## 7. Prioridades por Ciclo

### Ciclo 02 — Movimento e Mundo (M2)

```
P0 essenciais para o próximo ciclo:
────────────────────────────────────
🔴 Tileset de Lorencia (medieval)   → Para o mapa principal
🔴 Tileset de Noria (floresta)      → Segundo mapa
🔴 Portais entre mapas              → Transição
🔴 Hit/Impact effect                → Feedback visual de combate
🔴 HP/MP/XP bars                    → HUD mínimo
🔴 Hotbar (1-0)                     → Skills
🔴 Minimap                          → Navegação
🔴 Inventory Grid                   → Guardar itens
🔴 Button / Window Frame            → UI básica
🔴 Item icons (weapons, armor)      → Loot aparece no inventário
🔴 Gems (Bless, Soul, Chaos)        → Sistema de upgrade
```

### Ciclo 03 — Combate (M3)

```
P0 essenciais para combate:
────────────────────────────
🔴 Skill animations (Energy Ball, Flame, Twisting Slash)
🔴 Magic effects (fire, ice, lightning)
🔴 Monster death effect
🔴 Damage numbers flutuantes
🔴 Equipment sprites no chão
🔴 SFX: attack, hit, death, magic
```

### Ciclo 04 — Itens e Upgrades (M4)

```
P0 essenciais para inventário:
───────────────────────────────
🔴 Todos os item icons por categoria
🔴 Equipment slots UI
🔴 Upgrade effect (+1 a +15)
🔴 Wings sprites
🔴 NPC Shop UI
🔴 Trade UI
```

---

## 8. Sugestões de Fontes

| Tipo | Sugestão | Custo |
|------|----------|-------|
| **Character sprites** | [itch.io](https://itch.io/game-assets) pixel art characters | Gratuito a $5 |
| **Tilesets** | [CraftPix.net](https://craftpix.net) tileset packs | Gratuito |
| **UI elements** | [Kenney.nl](https://kenney.nl) UI asset packs | Gratuito (CC0) |
| **Sound effects** | [Freesound.org](https://freesound.org) ou [ZapSplat](https://zapsplat.com) | Gratuito |
| **Music** | [Pixabay Music](https://pixabay.com/music/) | Gratuito |
| **Wings** | CraftPix.net tem pacotes de asas pixel art | Grátis/Pago |
| **Item icons** | [Game-Icons.net](https://game-icons.net) | CC0 (gratuito) |
