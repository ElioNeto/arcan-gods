# Arcan Gods

**Cliente/servidor de MMORPG 2D para browser** inspirado em MU Online.

> [!WARNING]
> Este projeto está em desenvolvimento ativo. Nada aqui está pronto para produção.
>
> **Ciclo atual:** Ciclo 03 — Combate (2026-06-18)
> **Status:** 🟡 Núcleo de combate implementado — 247 testes, 26 issues fechadas, 30 abertas

## Sobre

Arcan Gods é um MMORPG 2D que roda diretamente no navegador, inspirado pelo clássico MU Online. O projeto busca recriar a experiência de grind, drops, upgrades e PvP em uma stack 100% web — sem instalação, sem downloads.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Cliente** | TypeScript + PixiJS 8 + Vite |
| **Servidor** | Node.js + TypeScript + WebSocket |
| **Banco de dados** | PostgreSQL + Redis (configurados no Docker) |
| **Networking** | WebSocket (JSON) |
| **Auth** | JWT + bcrypt (placeholder, pendente PostgreSQL) |
| **Testes** | Vitest (247 testes) |
| **Infra** | Docker + Docker Compose |

## O que funciona

### ✅ Ciclo 01 — Fundação (Completo)

- **Monorepo**: npm workspaces (shared, server, client)
- **Servidor**: Node.js + TypeScript + WebSocket na porta 3001, heartbeat, rate limiting, graceful shutdown
- **Cliente**: PixiJS 8 + Vite na porta 5173, game loop 60fps, renderização placeholders
- **Tipos Compartilhados**: Entidades, enums, pacotes de rede (discriminated unions), constantes do jogo (TILE_SIZE=32, MAX_LEVEL=400, XP_TABLE)
- **Validação**: Schemas Zod para login, registro, movimento e chat
- **Utilitários**: `calculateLevel`, `xpForLevel`, `validateEmail`, `validateCharacterName`
- **Autenticação (dev mode)**: Login/Register via WebSocket com auto-login
- **Chat**: Mensagens com validação server-side
- **Câmera**: Smooth follow com interpolação
- **Logging**: Logger estruturado JSON (debug/info/warn/error)
- **Testes**: 73 testes iniciais

### ✅ Ciclo 02 — Movimento e Mundo (Completo)

- **Tilemap Loader**: Parse de mapas Tiled JSON, grid de colisão, portais, spawn points
- **Pathfinding A***: Algoritmo Manhattan com BinaryHeap, cache LRU com TTL (< 50ms em grid 50x40)
- **CollisionSystem**: Colisão tile-based com wall-sliding
- **MovementSystem**: Movimento contínuo server-authoritative com A*, acúmulo fracionário, direções cardinais
- **Broadcast**: Infraestrutura para múltiplos jogadores no mesmo mapa
- **TilemapRenderer (cliente)**: Renderização do grid de colisão como tiles coloridos
- **MovementInterpolator (cliente)**: Interpolação suave entre waypoints
- **Mapa mock**: Lorencia 50×40 tiles com paredes, obstáculos e portais
- **Testes**: +112 testes (total: 206)

### ✅ Ciclo 03 — Combate (Núcleo Completo)

- **Damage Formulas**: 9 fórmulas em `shared/` — dano físico (STR), mágico (ENE), defesa, crítico (1.5x), hit rate (20%-95%)
- **CombatSystem**: Validação de range/cooldown/alvo, aplicação de dano, kill com XP e Gold
- **XP Progression**: `addExperience` com multiplier por diferença de nível, stat points por level
- **Monster Respawn**: Respawn automático após timer configurável
- **Packet**: `ENTITY_DAMAGED` com dados completos do ataque
- **Bug fixes**: Stat points no level up (RF-024)
- **Testes**: +41 testes (total: 247)

### 🔄 Em desenvolvimento (próximo ciclo)

| Prioridade | Feature | Issue |
|:----------:|---------|:-----:|
| 🔴 P0 | AI de monstros (FSM: idle/aggro/chase/attack) | #51 |
| 🔴 P0 | Skills básicas por classe (Energy Ball, Twisting Slash) | #52 |
| 🟡 P1 | HUD básico (HP/MP/XP bars) | #55 |
| 🟡 P1 | Portais e transição entre mapas | #47 |
| 🟡 P1 | Minimapa | #48 |
| 🟢 P2 | Auth JWT + PostgreSQL | #53 |
| 🟢 P2 | Pipeline CI (GitHub Actions) | #54 |

### 📋 Roadmap completo

Consulte [ROADMAP.md](./ROADMAP.md) para a visão geral das fases e [MILESTONES.md](./MILESTONES.md) para os marcos de entrega com status atualizado.

## Começando

```bash
# Clone
git clone https://github.com/ElioNeto/arcan-gods.git
cd arcan-gods

# Instale dependências (todos os workspaces)
npm install

# Copie o arquivo de ambiente
cp .env.example .env

# Suba servidor + cliente em modo dev (paralelo)
npm run dev
```

O servidor WebSocket sobe em `ws://localhost:3001` e o cliente Vite em `http://localhost:5173`.

Abra o navegador em `http://localhost:5173`, clique em "Conectar" e veja o jogo funcionando!

### Docker

```bash
# Produção (postgres + redis + server + client)
docker compose up -d

# Desenvolvimento com hot-reload
docker compose -f docker-compose.dev.yml up
```

### Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe servidor + cliente em paralelo |
| `npm run build` | Build de produção (shared → server → client) |
| `npm run test` | Executa todos os testes (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run lint` | ESLint em todos os pacotes |

## Estrutura

```
arcan-gods/
├── packages/
│   ├── shared/              # Código compartilhado (types, enums, constants, validation, formulas)
│   │   └── src/
│   │       ├── types/           # IEntity, IPlayer, ITileMap, Waypoint, packets, enums
│   │       ├── constants/       # GAME_CONSTANTS, XP_TABLE, NETWORK_CONFIG, damage formulas
│   │       ├── validation/      # Zod schemas (Login, Register, Move, Chat)
│   │       └── utils/           # Helpers (calculateLevel, validateEmail, etc.)
│   │
│   ├── server/              # Backend Node.js + WebSocket
│   │   └── src/
│   │       ├── config/          # Env, constants
│   │       ├── network/         # WebSocket server, handlers (connection, auth)
│   │       ├── game/            # GameEngine, World, entities, tilemap, pathfinding, systems
│   │       │   ├── tilemap/     # TilemapLoader, CollisionGrid, MapManager, maps/
│   │       │   ├── pathfinding/ # A*, BinaryHeap, PathCache
│   │       │   ├── systems/     # CollisionSystem, MovementSystem, CombatSystem
│   │       │   └── entities/    # Player, Monster
│   │       └── utils/           # Logger estruturado
│   │
│   └── client/              # Frontend PixiJS + Vite
│       └── src/
│           ├── core/            # Game loop, NetworkManager, InputManager, Camera, AssetManager
│           ├── maps/            # TilemapRenderer
│           ├── systems/         # MovementInterpolator
│           └── ui/              # MenuScreen, PlaceholderGraphics
│
├── assets/                  # Sprites fonte craftpix.net (organizados em client/public/assets/)
├── docs/                    # Documentação completa
│   ├── changelog/           # Histórico de versões
│   ├── cycle/               # Relatórios dos 3 ciclos
│   ├── development/         # Guias (setup, protocolo, arquitetura)
│   ├── assets/              # Catálogo e missing sprites
│   ├── gameplay/            # Lore, quests, combate, skills, itens
│   └── tests/               # 9 planos de teste
│
├── package.json             # Raiz do monorepo (npm workspaces)
├── tsconfig.base.json       # Config TypeScript strict mode
├── vitest.config.ts         # Config Vitest (206 testes)
├── docker-compose.yml       # Stack produção
├── docker-compose.dev.yml   # Stack dev com hot-reload
└── .github/                 # GitHub Actions (pendente #54)
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Requisitos funcionais e não-funcionais |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura do sistema, fluxos e decisões |
| [ROADMAP.md](./ROADMAP.md) | Roadmap com progresso por fase |
| [MILESTONES.md](./MILESTONES.md) | Marcos e entregas com status |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guia de contribuição |
| [docs/assets/catalog.md](./docs/assets/catalog.md) | Catálogo completo dos 2900 sprites |
| [docs/development/websocket-protocol.md](./docs/development/websocket-protocol.md) | Protocolo de rede |

## Licença

MIT — veja [LICENSE](./LICENSE).
