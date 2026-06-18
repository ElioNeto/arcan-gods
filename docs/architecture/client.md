# Arquitetura do Cliente

## Visão Geral

O cliente é construído com **PixiJS 8** + **Vite** + **TypeScript**.

```
src/
├── core/
│   ├── Game.ts              # Game loop principal (requestAnimationFrame)
│   ├── Camera.ts            # Câmera que segue o player
│   ├── InputManager.ts      # Mouse + teclado
│   ├── AssetManager.ts      # Load de sprites, tiles, áudio
│   └── NetworkManager.ts    # WebSocket client (Colyseus)
├── entities/
│   ├── Entity.ts            # Base class (posição, sprite, animação)
│   ├── Player.ts            # Player controlado (predictive movement)
│   ├── RemotePlayer.ts      # Outros jogadores (interpolados)
│   ├── Monster.ts           # Monstros (sync do servidor)
│   └── NPC.ts               # NPCs interagíveis
├── maps/
│   ├── Tilemap.ts           # Load e renderização de tilemap JSON
│   ├── Layer.ts             # Camada do mapa (ground, object, top)
│   └── Collision.ts         # Detecção de colisão local
├── systems/
│   ├── CombatSystem.ts      # Animação de ataque, damage numbers
│   ├── InventorySystem.ts   # Gerenciamento local do inventário
│   ├── SkillSystem.ts       # Hotkeys, cooldown display, efeitos
│   └── QuestSystem.ts       # Quest log, tracking
├── ui/
│   ├── HUD.ts               # HP/MP/XP bars, minimapa
│   ├── InventoryWindow.ts   # Grade de inventário
│   ├── SkillBar.ts          # Hotbar de skills
│   ├── ChatWindow.ts        # Chat com abas
│   ├── CharacterWindow.ts   # Stats + equipamento
│   ├── ShopWindow.ts        # Loja de NPC
│   ├── QuestLogWindow.ts    # Log de quests
│   └── MenuScreen.ts        # Menu principal (login, select char)
├── effects/
│   ├── Particles.ts         # Sistema de partículas
│   ├── DamageNumber.ts      # Números flutuantes de dano
│   └── Animations.ts        # Animações de skill
├── network/
│   ├── handlers/
│   │   ├── movement.ts      # Handlers de movimento
│   │   ├── combat.ts        # Handlers de combate
│   │   ├── inventory.ts     # Handlers de inventário
│   │   └── social.ts        # Handlers de chat/party/guild
│   └── protocol.ts          # Tipos de mensagem
├── config/
│   ├── constants.ts         # Constantes do jogo
│   └── keybinds.ts          # Configuração de teclas
└── main.ts                  # Entry point
```

## Game Loop

```
requestAnimationFrame
    ├── network.receive()       # Processa mensagens pendentes
    ├── input.update()          # Captura input do frame
    ├── entities.update(dt)     # Atualiza posições, animações
    ├── camera.update()         # Segue player
    ├── systems.update(dt)      # Cooldowns, efeitos visuais
    ├── ui.update()             # HUD, janelas
    └── renderer.render()       # Desenha tudo
```

## Movimento Predictivo

O cliente move o player imediatamente no clique (sem esperar servidor), mas corrige posição quando o servidor responde. Isso evita lag perceptível.

```
Cliente: clique em (x,y)
   ├── Inicia movimento imediato
   ├── Envia MOVE_PACKET para servidor
   └── Quando servidor responde:
       ├── Se posição ≈ prevista → tudo ok
       └── Se posição != prevista → corrige (lerp suave)
```

## State Sync

O servidor envia snapshots periódicos do estado do mundo (players, monstros, posições). O cliente interpola entre snapshots para movimento suave.

- Server tick: 10 Hz (100ms entre snaps)
- Cliente interpola: armazena 2-3 snaps e interpola linearmente
- Extrapolação: se perder conexão, continua na última direção por ~500ms
