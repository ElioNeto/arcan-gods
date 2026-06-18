# Estrutura do Projeto

Arcan Gods é um monorepo gerenciado com **npm workspaces**. Possui 3 pacotes principais sob `packages/`.

## Visão Geral

```
arcan-gods/
├── packages/
│   ├── shared/          (@arcan-gods/shared)
│   ├── server/          (@arcan-gods/server)
│   └── client/          (@arcan-gods/client)
├── docs/                # Documentação
├── .github/             # GitHub Actions
└── config files         # tsconfig.base.json, vitest.config.ts, .eslintrc.yml, etc.
```

## Pacotes

### 1. `packages/shared/` — Código Compartilhado

Código usado tanto pelo cliente quanto pelo servidor. Evita duplicação de tipos, constantes e lógica de validação.

```
src/
├── types/
│   ├── entities.ts      # Interfaces: IEntity, IPlayer, IMonster, INPC, IAccount, ICharacter
│   ├── packets.ts       # Discriminated unions: ClientPacket, ServerPacket
│   └── enums.ts         # Union types: CharacterClass, EntityType, Direction, ChatChannel, etc.
├── constants/
│   ├── game.ts          # GAME_CONSTANTS, XP_TABLE, CLASS_BASE_STATS
│   └── network.ts       # NETWORK_CONFIG (heartbeat, timeout, reconnect)
├── validation/
│   └── schemas.ts       # Zod: LoginSchema, RegisterSchema, MoveSchema, ChatSchema
├── utils/
│   └── helpers.ts       # calculateLevel(), xpForLevel(), validateEmail(), validateCharacterName()
├── index.ts             # Barrel export
└── __tests__/           # Testes unitários
```

**Dependências:** zod

### 2. `packages/server/` — Servidor

Responsável por toda a lógica do jogo. Server-authoritative: cliente envia intenções, servidor valida e executa.

```
src/
├── index.ts              # Entry point: inicializa config, servidor WS, game engine
├── config/
│   ├── env.ts            # Carrega .env com dotenv, valida tipos
│   ├── constants.ts      # Constantes específicas do servidor
│   └── __tests__/env.test.ts
├── utils/
│   └── logger.ts         # Logger estruturado JSON (debug/info/warn/error)
├── network/
│   ├── server.ts         # HTTP + WebSocket server, CORS, upgrade handler
│   └── handlers/
│       ├── connection.ts  # Roteamento de mensagens, rate limiting
│       └── auth.ts        # Login/Register handlers (auto-login dev mode)
├── game/
│   ├── GameEngine.ts     # Tick loop (10Hz), start/stop
│   ├── World.ts          # CRUD de players/monsters, broadcast state
│   ├── entities/
│   │   ├── Player.ts     # HP, XP, level up, damage, healing
│   │   └── Monster.ts    # Template-based, damage/defense, death/respawn
│   └── __tests__/        # world.test.ts, game-engine.test.ts, player.test.ts, monster.test.ts
```

**Dependências:** ws, dotenv, @arcan-gods/shared, zod

### 3. `packages/client/` — Cliente

Renderiza o jogo no navegador usando PixiJS 8. Conecta ao servidor via WebSocket.

```
src/
├── main.ts               # Entry point: inicializa PixiJS Application
├── core/
│   ├── Game.ts            # Game loop (phases: init→loading→menu→world), state management
│   ├── NetworkManager.ts  # WebSocket client, reconnect, message queue, heartbeat
│   ├── InputManager.ts    # Mouse + teclado tracking
│   ├── Camera.ts          # Smooth follow camera
│   └── AssetManager.ts    # Placeholder texture generation (Canvas API)
├── ui/
│   ├── MenuScreen.ts      # Tela inicial com gradiente e botão "Conectar"
│   └── PlaceholderGraphics.ts  # Factory de placeholders coloridos
├── __tests__/
│   ├── network-manager.test.ts
│   └── input-manager.test.ts
└── index.ts               # Re-exports
```

**Dependências:** pixi.js@^8, @arcan-gods/shared

## Arquivos de Configuração (Raiz)

| Arquivo | Finalidade |
|---------|------------|
| `package.json` | Workspaces: shared, server, client. Scripts: dev, build, lint, test |
| `tsconfig.base.json` | Strict mode, ES2022, paths `@arcan-gods/*` |
| `vitest.config.ts` | Configuração do Vitest para todos os pacotes |
| `.eslintrc.yml` | Regras TypeScript strict, proibição de any (warn) |
| `.env.example` | Variáveis de ambiente: SERVER_PORT, WS_PORT, TICK_RATE, etc. |
| `.editorconfig` | Indent 2 spaces, UTF-8, LF |
| `.gitignore` | node_modules, dist, .env, etc. |

## Documentação

```
docs/
├── changelog/             # Histórico de versões (v0.1.0.md, etc.)
├── cycle/                 # Relatórios de cada ciclo de desenvolvimento
│   └── 2026-06-18-ciclo-01-fundacao/
├── development/           # Guias de desenvolvimento
│   ├── setup.md           # Setup do ambiente
│   ├── conventions.md     # Convenções de código
│   ├── project-structure.md   # Este arquivo
│   ├── client-server-architecture.md
│   └── websocket-protocol.md
├── architecture/          # Documentação arquitetural
│   ├── server.md
│   ├── client.md
│   └── database.md
├── gameplay/              # Mecânicas do jogo
│   ├── combat.md
│   ├── skills.md
│   ├── items.md
│   └── quests.md
└── tests/                 # Planos de teste
```
