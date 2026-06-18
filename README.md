# Arcan Gods

**Cliente/servidor de MMORPG 2D para browser** inspirado em MU Online.

> [!WARNING]
> Este projeto está em desenvolvimento ativo. Nada aqui está pronto para produção.
>
> **Último ciclo:** Ciclo 01 — Fundação (2026-06-18)
> **Status:** ✅ P0 completo — servidor WebSocket, cliente PixiJS, shared types, autenticação dev mode, movimento, chat

## Sobre

Arcan Gods é um MMORPG 2D que roda diretamente no navegador, inspirado pelo clássico MU Online. O projeto busca recriar a experiência de grind, drops, upgrades e PvP em uma stack 100% web — sem instalação, sem downloads.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Cliente** | TypeScript + PixiJS + Vite |
| **Servidor** | Node.js + TypeScript |
| **Banco de dados** | PostgreSQL + Redis |
| **Networking** | WebSocket |
| **Auth** | JWT + bcrypt |
| **Infra** | Docker + GitHub Actions |

## O que funciona (Ciclo 01 — Fundação)

### ✅ Implementado

- **Monorepo**: npm workspaces com 3 pacotes (shared, server, client)
- **Servidor**: Node.js + TypeScript + WebSocket na porta 3001, heartbeat, rate limiting
- **Cliente**: PixiJS 8 + Vite na porta 5173, game loop, renderização placeholders
- **Tipos Compartilhados**: Entidades, enums, pacotes de rede (discriminated unions), constantes do jogo
- **Validação**: Schemas Zod para login, registro, movimento e chat
- **Utilitários**: `calculateLevel`, `xpForLevel`, `validateEmail`, `validateCharacterName`
- **Autenticação (dev mode)**: Login/Register via WebSocket com auto-login
- **Movimento**: Cliente envia clique, servidor valida e transmite, anti-speedhack
- **Chat**: Mensagens globais com validação server-side
- **Câmera**: Smooth follow no jogador
- **Logging**: Logger estruturado JSON (debug/info/warn/error)
- **Testes**: 73 testes unitários (Vitest), build funcional

### 🔄 Em desenvolvimento (próximo ciclo)

- [ ] Pathfinding A* e movimento autoritativo completo
- [ ] Colisão com tiles e objetos
- [ ] Tilemap loader (Tiled JSON)
- [ ] Autenticação JWT com PostgreSQL
- [ ] Múltiplos jogadores visíveis no mesmo mapa
- [ ] Pipeline CI (GitHub Actions)
- [ ] Docker Compose para desenvolvimento

### 📋 Roadmap completo

Consulte [ROADMAP.md](./ROADMAP.md) para a visão geral das fases e [MILESTONES.md](./MILESTONES.md) para os marcos de entrega.

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
│   ├── shared/          # Código compartilhado (types, enums, constants, validation)
│   │   └── src/
│   │       ├── types/       # IEntity, IPlayer, ServerPacket, ClientPacket, enums
│   │       ├── constants/   # GAME_CONSTANTS, XP_TABLE, NETWORK_CONFIG
│   │       ├── validation/  # Zod schemas (Login, Register, Move, Chat)
│   │       └── utils/       # Helpers (calculateLevel, validateEmail, etc.)
│   │
│   ├── server/          # Backend Node.js + WebSocket
│   │   └── src/
│   │       ├── config/      # Env, constants
│   │       ├── network/     # WebSocket server, handlers (connection, auth)
│   │       ├── game/        # GameEngine, World, entities (Player, Monster)
│   │       └── utils/       # Logger estruturado
│   │
│   └── client/          # Frontend PixiJS + Vite
│       └── src/
│           ├── core/        # Game loop, NetworkManager, InputManager, Camera, AssetManager
│           └── ui/          # MenuScreen, PlaceholderGraphics
│
├── docs/              # Documentação
│   ├── changelog/     # Histórico de versões
│   ├── cycle/         # Relatórios de ciclo
│   ├── development/   # Guias de desenvolvimento
│   ├── architecture/  # Documentação arquitetural
│   ├── gameplay/      # Documentação de gameplay
│   └── tests/         # Planos de teste
│
├── package.json       # Raiz do monorepo (npm workspaces)
├── tsconfig.base.json # Config TypeScript compartilhada
└── vitest.config.ts   # Config Vitest
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Requisitos funcionais e não-funcionais |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura do sistema, fluxos e decisões |
| [ROADMAP.md](./ROADMAP.md) | Roadmap de desenvolvimento |
| [MILESTONES.md](./MILESTONES.md) | Marcos e entregas |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guia de contribuição |
| [SECURITY.md](./SECURITY.md) | Política de segurança |
| [docs/](./docs/) | Documentação detalhada (gameplay, dev, etc.) |

## Licença

MIT — veja [LICENSE](./LICENSE).
