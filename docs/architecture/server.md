# Arquitetura do Servidor

## Visão Geral

Servidor Node.js + TypeScript com WebSocket (Colyseus).

```
src/
├── index.ts                 # Entry point (HTTP + WebSocket)
├── config/
│   ├── env.ts              # Variáveis de ambiente
│   └── constants.ts        # Constantes do jogo
├── network/
│   ├── server.ts           # Setup do WebSocket server
│   ├── auth.ts             # JWT middleware para WS
│   └── rooms/
│       ├── LobbyRoom.ts    # Sala de seleção de personagem
│       └── GameRoom.ts     # Sala do jogo (um mapa)
├── game/
│   ├── GameEngine.ts       # Game loop (tick 10Hz)
│   ├── World.ts            # Gerenciamento de entidades no mapa
│   ├── entities/
│   │   ├── Player.ts       # Estado do jogador
│   │   ├── Monster.ts      # Estado do monstro
│   │   ├── NPC.ts          # Estado do NPC
│   │   └── Drop.ts         # Item no chão
│   ├── systems/
│   │   ├── MovementSystem.ts    # Pathfinding + colisão
│   │   ├── CombatSystem.ts      # Dano, morte, XP
│   │   ├── SkillSystem.ts       # Skills, cooldowns, buffs
│   │   ├── DropSystem.ts        # Loot generation
│   │   ├── InventorySystem.ts   # Itens, equip, trade
│   │   ├── QuestSystem.ts       # Progresso de quests
│   │   ├── PartySystem.ts       # Grupos de jogadores
│   │   ├── GuildSystem.ts       # Guildas
│   │   └── SpawnSystem.ts       # Respawn de monstros
│   └── ai/
│       ├── StateMachine.ts      # FSM da AI
│       ├── IdleState.ts         # Patrulha/parado
│       ├── ChaseState.ts        # Persegue alvo
│       └── AttackState.ts       # Ataca alvo
├── db/
│   ├── connection.ts       # Pool PostgreSQL
│   ├── redis.ts            # Cliente Redis
│   ├── migrations/         # Migrations
│   ├── models/
│   │   ├── Account.ts      # CRUD de contas
│   │   ├── Character.ts    # CRUD de personagens
│   │   ├── Inventory.ts    # CRUD de inventário
│   │   ├── Item.ts         # CRUD de itens
│   │   └── Guild.ts        # CRUD de guildas
│   └── seed/               # Dados iniciais
├── services/
│   ├── AuthService.ts      # Login, JWT, refresh
│   ├── SocialService.ts    # Chat, friends
│   └── RankingService.ts   # Cálculo de ranking
├── utils/
│   ├── formulas.ts         # Fórmulas de dano, XP, upgrade
│   └── validators.ts       # Validação de input
└── tests/
    ├── combat.test.ts
    ├── formulas.test.ts
    ├── movement.test.ts
    └── ...
```

## Game Loop (Tick)

```
setInterval(100ms) → tick()
    ├── world.update(dt)
    │   ├── players.forEach → processInput() → move()
    │   ├── monsters.forEach → ai.update() → move/attack
    │   ├── checkCollisions()
    │   ├── checkCombat() → applyDamage()
    │   ├── checkDrops() → spawnItems()
    │   ├── removeDead()
    │   ├── spawnNewMonsters()
    │   └── broadcastState()
    └── db.flush() (save a cada 30s)
```

## Salas (Rooms)

Cada mapa é uma **GameRoom**. Jogadores em mapas diferentes estão em rooms diferentes.

```
LobbyRoom (seleção de personagem)
    └── ao escolher → entra em GameRoom do mapa inicial
GameRoom (Lorencia)
    └── ao passar portal → sai de Lorencia, entra em GameRoom(Devias)
```

## Anti-Cheat

- **Velocidade:** servidor valisa distância/tempo do movimento
- **Dano:** servidor recalcula o dano ignorando o cliente
- **Cooldown:** servidor mantém o state real de cooldowns
- **Itens:** servidor valisa existencia do item antes de equipar
