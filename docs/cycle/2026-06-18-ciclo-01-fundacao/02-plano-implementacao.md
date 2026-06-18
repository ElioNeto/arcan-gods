task_id: ses_123c11f6bffeISosoG0sq0YuTP (for resuming to continue this task if needed)

<task_result>
O plano foi elaborado com sucesso. Note que meu ambiente não possui ferramenta de escrita direta de arquivos — o conteúdo precisa ser salvo pelo **Executor** ou **god agent** no caminho `docs/cycle/2026-06-18-ciclo-01-fundacao/02-plano-implementacao.md`.

Abaixo está o plano completo para execução:

---

## 📋 Plano de Implementação — Ciclo 01: Fundação

### Sumário

| Campo | Valor |
|-------|-------|
| **Ciclo** | `2026-06-18-ciclo-01-fundacao` |
| **Milestone** | M1 — Conexão |
| **Estimativa Total** | **7h45min** (P0: 3h15min + P1: 4h30min) |
| **Complexidade** | Média |

---

### Dependências entre Tarefas

```
P0.1 (monorepo) ────────────────────────────────────► P0.2 (shared)
                                                           │
P0.1 ───┬──► P0.3 (servidor) ◄── P0.2 ────────────────────┤
        │                                                  │
        └──► P0.4 (cliente)  ◄── P0.2 ────────────────────┤
                                                           │
P0.3 ───────────────────────────────► P1.1 (auth)         │
                                                           │
P0.4 ───────────────────────────────► P1.2 (tilemap)      │
                                                           │
P0.3 + P0.4 ✔ ─────────────────────► P1.3 (CI)            │
                                                           │
P0.3 + P1.1 ✔ ─────────────────────► P1.4 (Docker)        │
```

---

## 🟥 Tarefas P0 — Essenciais (Obrigatórias)

---

### Tarefa P0.1: Setup monorepo (Issue #1)

| Campo | Valor |
|-------|-------|
| **Complexidade** | média |
| **Estimativa** | 30min |
| **Dependências** | nenhuma |

| ID | Descrição | Arquivos | Critério de Aceite |
|----|-----------|----------|-------------------|
| P0.1.1 | Criar `package.json` raiz com `private: true`, `workspaces: ["packages/*"]`, scripts dev/build/lint/test | `package.json` | `npm install` instala workspaces |
| P0.1.2 | Configurar `tsconfig.base.json` — strict mode, ES2022 target, moduleResolution bundler, paths `@arcan-gods/*` | `tsconfig.base.json` | `tsc --noEmit` funciona |
| P0.1.3 | Configurar ESLint — `@typescript-eslint`, proibir `any` e `enum`, ordenação imports | `.eslintrc.yml` | `npm run lint` passa |
| P0.1.4 | Criar estrutura de diretórios: `packages/shared/`, `packages/server/`, `packages/client/` com `package.json` mínimo | 3× `package.json` | `npm ls --workspaces` lista 3 |
| P0.1.5 | Configurar `.env.example` com variáveis: SERVER_PORT, WS_PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, TICK_RATE | `.env.example` | Presente com valores default |
| P0.1.6 | Atualizar `.gitignore` — adicionar `dist/`, `*.tsbuildinfo`, `.env` | `.gitignore` | `git status` limpo após build |
| P0.1.7 | Configurar scripts raiz — `dev` (concorrente server+client), `build`, `lint`, `test` (--workspaces) | `package.json` (scripts) | Scripts executáveis |
| P0.1.8 | Adicionar `.editorconfig` — indent 2 spaces, utf-8, lf | `.editorconfig` | Carregado pelo VS Code |

---

### Tarefa P0.2: Shared package — tipos e constantes (Issue #8)

| Campo | Valor |
|-------|-------|
| **Complexidade** | média |
| **Estimativa** | 45min |
| **Dependências** | P0.1 |

| ID | Descrição | Arquivos |
|----|-----------|----------|
| P0.2.1 | Configurar `tsconfig.json` do shared — estender base, composite: true | `packages/shared/tsconfig.json` |
| P0.2.2 | Criar tipos de entidades: `IEntity`, `IPlayer`, `IMonster`, `INPC`, `IAccount`, `ICharacter` | `packages/shared/src/types/entities.ts` |
| P0.2.3 | Criar tipos de rede: `Packet` union type discriminada por `type` | `packages/shared/src/types/packets.ts` |
| P0.2.4 | Criar constantes do jogo: `GAME_CONSTANTS` (TILE_SIZE, TICK_RATE, MAX_LEVEL, etc.) | `packages/shared/src/constants/game.ts` |
| P0.2.5 | Criar constantes de rede: `NETWORK_EVENTS` (CONNECT, AUTH_LOGIN, MOVE, CHAT, etc.) | `packages/shared/src/constants/network.ts` |
| P0.2.6 | Criar enums como union types: `CharacterClass`, `MapId`, `EntityType`, `Direction` | `packages/shared/src/types/enums.ts` |
| P0.2.7 | Criar schemas Zod para validação de pacotes (login, register, move) | `packages/shared/src/validation/schemas.ts` |
| P0.2.8 | Criar `index.ts` barrel re-exportando tudo | `packages/shared/src/index.ts` |
| P0.2.9 | Configurar `package.json` — `name: "@arcan-gods/shared"`, `main`, `types` | `packages/shared/package.json` |
| P0.2.10 | Testes: validar constantes, schemas Zod (payload válido/inválido) | `packages/shared/src/**/*.test.ts` |
| P0.2.11 | Build e verificação — `tsc --build` gera `dist/` com `.js` + `.d.ts` | — |

**Verificação:** `import { GAME_CONSTANTS, type IPlayer } from '@arcan-gods/shared'` compila em outro pacote

---

### Tarefa P0.3: Setup servidor (Issue #2)

| Campo | Valor |
|-------|-------|
| **Complexidade** | média |
| **Estimativa** | 1h |
| **Dependências** | P0.1, P0.2 |

| ID | Descrição | Arquivos |
|----|-----------|----------|
| P0.3.1 | Configurar `tsconfig.json` do server — estender base, target ES2022 | `packages/server/tsconfig.json` |
| P0.3.2 | Configurar `package.json` — deps: `ws`, `dotenv`, `@arcan-gods/shared`; devDeps: `@types/ws`, `vitest`, `tsx` | `packages/server/package.json` |
| P0.3.3 | Criar `src/config/env.ts` — carregar `.env` com dotenv, exportar objeto tipado | `packages/server/src/config/env.ts` |
| P0.3.4 | Criar `src/config/constants.ts` — constantes específicas do servidor | `packages/server/src/config/constants.ts` |
| P0.3.5 | Criar `src/utils/logger.ts` — logger estruturado com níveis (debug, info, warn, error) | `packages/server/src/utils/logger.ts` |
| P0.3.6 | Criar `src/network/server.ts` — servidor HTTP + WebSocket (ws), CORS, upgrade handler | `packages/server/src/network/server.ts` |
| P0.3.7 | Criar `src/network/handlers/connection.ts` — handlers connection/message/close/error com roteamento | `packages/server/src/network/handlers/connection.ts` |
| P0.3.8 | Criar `src/game/GameEngine.ts` — classe com tick loop (setInterval 100ms), start/stop | `packages/server/src/game/GameEngine.ts` |
| P0.3.9 | Criar `src/game/World.ts` — gestão de entidades (add, remove, getById), broadcastState() | `packages/server/src/game/World.ts` |
| P0.3.10 | Criar `src/game/entities/Player.ts` — id, posição (x,y), estado online/offline, toJSON() | `packages/server/src/game/entities/Player.ts` |
| P0.3.11 | Criar `src/game/entities/Monster.ts` — id, templateId, posição, hp, maxHp | `packages/server/src/game/entities/Monster.ts` |
| P0.3.12 | Criar `src/index.ts` — entry point: carrega env, cria servidor, instancia GameEngine | `packages/server/src/index.ts` |
| P0.3.13 | Testes: GameEngine tick, World CRUD, Player/Monster criação | `packages/server/src/**/*.test.ts` |
| P0.3.14 | Adicionar script `dev`: `tsx watch src/index.ts` | `packages/server/package.json` (scripts) |

**Verificação:** `npm run dev` no server sobe, aceita conexão WS, loga "Server listening on port 3001"

---

### Tarefa P0.4: Setup cliente (Issue #3)

| Campo | Valor |
|-------|-------|
| **Complexidade** | média |
| **Estimativa** | 1h |
| **Dependências** | P0.1, P0.2 |

| ID | Descrição | Arquivos |
|----|-----------|----------|
| P0.4.1 | Configurar `tsconfig.json` do client — incluir lib DOM, module ESNext | `packages/client/tsconfig.json` |
| P0.4.2 | Configurar `package.json` — deps: `pixi.js@^8`, `@arcan-gods/shared`; devDeps: `vite`, `vitest` | `packages/client/package.json` |
| P0.4.3 | Criar `vite.config.ts` — porta 5173, proxy WS | `packages/client/vite.config.ts` |
| P0.4.4 | Criar `index.html` — div#app, script module /src/main.ts | `packages/client/index.html` |
| P0.4.5 | Criar `src/main.ts` — inicializa PixiJS Application, instancia Game | `packages/client/src/main.ts` |
| P0.4.6 | Criar `src/core/Game.ts` — game loop RAF, fases: init→loading→menu→world | `packages/client/src/core/Game.ts` |
| P0.4.7 | Criar `src/core/NetworkManager.ts` — WebSocket client, reconnect, fila de mensagens | `packages/client/src/core/NetworkManager.ts` |
| P0.4.8 | Criar `src/core/InputManager.ts` — mouse (click, move) + teclado (keydown/up) | `packages/client/src/core/InputManager.ts` |
| P0.4.9 | Criar `src/core/Camera.ts` — câmera que segue alvo (x,y), transform no container | `packages/client/src/core/Camera.ts` |
| P0.4.10 | Criar `src/ui/MenuScreen.ts` — tela inicial com fundo gradiente, botão "Conectar" | `packages/client/src/ui/MenuScreen.ts` |
| P0.4.11 | Criar `src/core/AssetManager.ts` — carregador de assets, gera placeholders | `packages/client/src/core/AssetManager.ts` |
| P0.4.12 | Criar `src/ui/PlaceholderGraphics.ts` — factory de quadrados coloridos (player=azul, monster=vermelho, tile=cinza) | `packages/client/src/ui/PlaceholderGraphics.ts` |
| P0.4.13 | Integrar NetworkManager ao Game — handshake, world state | `packages/client/src/core/Game.ts` (atualizar) |
| P0.4.14 | Testes: NetworkManager (mock WS), InputManager, Camera | `packages/client/src/**/*.test.ts` |
| P0.4.15 | Adicionar script `dev`: `vite` | `packages/client/package.json` (scripts) |

**Verificação:** `npm run dev` sobe client + server, tela com botão "Conectar" funciona via WS

---

## 🟧 Tarefas P1 — Importantes (Stretch Goals)

---

### Tarefa P1.1: Autenticação JWT + PostgreSQL (Issue #5)

| Campo | Valor |
|-------|-------|
| **Complexidade** | alta |
| **Estimativa** | 2h |
| **Dependências** | P0.3 |

| ID | Descrição | Arquivos |
|----|-----------|----------|
| P1.1.1 | Adicionar deps: `pg`, `bcryptjs`, `jsonwebtoken` + `@types/*` | `packages/server/package.json` |
| P1.1.2 | Criar `src/db/connection.ts` — pool PostgreSQL via `pg`, helper `query()` | `packages/server/src/db/connection.ts` |
| P1.1.3 | Criar migração `001_create_accounts.sql` (id UUID, email, password_hash, timestamps) | `packages/server/src/db/migrations/001_create_accounts.sql` |
| P1.1.4 | Criar migração `002_create_characters.sql` (id UUID, account_id FK, name, class, stats, map_id, pos) | `packages/server/src/db/migrations/002_create_characters.sql` |
| P1.1.5 | Criar `src/db/migrate.ts` — lê SQL de migrations/ e executa em ordem | `packages/server/src/db/migrate.ts` |
| P1.1.6 | Criar `src/db/models/Account.ts` — create, findByEmail, findById | `packages/server/src/db/models/Account.ts` |
| P1.1.7 | Criar `src/services/AuthService.ts` — register (hash+insert+JWT), login (verify+JWT), validateToken | `packages/server/src/services/AuthService.ts` |
| P1.1.8 | Criar `src/network/auth.ts` — middleware JWT para WebSocket | `packages/server/src/network/auth.ts` |
| P1.1.9 | Criar `src/network/handlers/auth.ts` — handlers AUTH_LOGIN e AUTH_REGISTER | `packages/server/src/network/handlers/auth.ts` |
| P1.1.10 | Criar `src/db/seed/index.ts` — conta admin (admin@arcan.com / admin123) | `packages/server/src/db/seed/index.ts` |
| P1.1.11 | Atualizar `.env.example` — DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN | `.env.example` |
| P1.1.12 | Testes: AuthService (register duplicado, login inválido, token), Account model | `packages/server/src/**/*.test.ts` |
| P1.1.13 | Integrar auth ao cliente — NetworkManager envia token, MenuScreen com campos email+senha | `packages/client/src/core/NetworkManager.ts`, `packages/client/src/ui/MenuScreen.ts` |

**Verificação:** Registro → Login → JWT → Conexão WS com token → Servidor valida

---

### Tarefa P1.2: Tilemap loader (Issue #4)

| Campo | Valor |
|-------|-------|
| **Complexidade** | média |
| **Estimativa** | 1h30min |
| **Dependências** | P0.4 |

| ID | Descrição | Arquivos |
|----|-----------|----------|
| P1.2.1 | Criar tipos de tilemap no shared (formato Tiled JSON) | `packages/shared/src/types/tilemap.ts` |
| P1.2.2 | Criar tilemap de exemplo — `maps/lorencia.json` 20x15, 2 layers (chão, colisão) | `packages/client/public/maps/lorencia.json` |
| P1.2.3 | Criar `src/maps/Tilemap.ts` — carrega JSON, parseia layers, cria containers PixiJS | `packages/client/src/maps/Tilemap.ts` |
| P1.2.4 | Criar `src/maps/Layer.ts` — renderiza layer individual com sprites placeholder | `packages/client/src/maps/Layer.ts` |
| P1.2.5 | Criar `src/maps/Collision.ts` — carrega layer de colisão, isWalkable(x,y) | `packages/client/src/maps/Collision.ts` |
| P1.2.6 | Integrar ao Game — estado "world" carrega tilemap e adiciona ao stage | `packages/client/src/core/Game.ts` |
| P1.2.7 | Testes: Tilemap parsing, Layer rendering, Collision detection | `packages/client/src/**/*.test.ts` |

**Verificação:** Cliente conecta → entra no mundo → vê grid de tiles (chão verde, paredes cinza)

---

### Tarefa P1.3: Pipeline CI (Issue #6)

| Campo | Valor |
|-------|-------|
| **Complexidade** | baixa |
| **Estimativa** | 30min |
| **Dependências** | P0.3 + P0.4 compilando |

| ID | Descrição | Arquivos |
|----|-----------|----------|
| P1.3.1 | Criar workflow `ci.yml` — trigger push/PR main, matrix Node 20.x/22.x | `.github/workflows/ci.yml` |
| P1.3.2 | Job lint: `npm ci` → `npm run lint` | `.github/workflows/ci.yml` |
| P1.3.3 | Job type-check: `npm run build` (ou `tsc --noEmit`) | `.github/workflows/ci.yml` |
| P1.3.4 | Job test: `npm run test` com Vitest, relatório de cobertura | `.github/workflows/ci.yml` |
| P1.3.5 | Adicionar badges ao README — build status, coverage | `README.md` |

**Verificação:** Push → GitHub Actions executa 3 jobs → todos verdes ✅

---

### Tarefa P1.4: Docker Compose (Issue #7)

| Campo | Valor |
|-------|-------|
| **Complexidade** | baixa |
| **Estimativa** | 30min |
| **Dependências** | P0.3 + P1.1 |

| ID | Descrição | Arquivos |
|----|-----------|----------|
| P1.4.1 | Criar `docker-compose.yml` — postgres:16-alpine, redis:7-alpine | `docker-compose.yml` |
| P1.4.2 | Criar Dockerfile server — multi-stage (builder + runner node:20-alpine) | `packages/server/Dockerfile` |
| P1.4.3 | Criar Dockerfile client — Vite build → nginx:alpine | `packages/client/Dockerfile` |
| P1.4.4 | Adicionar serviço `server` ao compose (depends_on: postgres, redis) | `docker-compose.yml` |
| P1.4.5 | Adicionar serviço `client` ao compose (depends_on: server) | `docker-compose.yml` |
| P1.4.6 | Criar `.dockerignore` | `.dockerignore` |

**Verificação:** `docker compose up --build` → servidor + banco rodando

---

## 📊 Resumo de Esforço

| Tarefa | Issue | Complexidade | Estimativa | Depende de |
|--------|-------|:-----------:|:----------:|------------|
| **P0.1** Setup monorepo | #1 | média | 30min | — |
| **P0.2** Shared package | #8 | média | 45min | P0.1 |
| **P0.3** Setup servidor | #2 | média | 1h | P0.1, P0.2 |
| **P0.4** Setup cliente | #3 | média | 1h | P0.1, P0.2 |
| **P1.1** Autenticação | #5 | alta | 2h | P0.3 |
| **P1.2** Tilemap loader | #4 | média | 1h30min | P0.4 |
| **P1.3** Pipeline CI | #6 | baixa | 30min | P0.3, P0.4 |
| **P1.4** Docker Compose | #7 | baixa | 30min | P0.3, P1.1 |
| | | **Total P0** | **3h15min** | |
| | | **Total P1** | **4h30min** | |
| | | **Total Geral** | **7h45min** | |

---

## 📁 Arquivos a Criar (82 arquivos no total)

### Raiz (8)
`package.json`, `tsconfig.base.json`, `.eslintrc.yml`, `.env.example`, `.editorconfig`, `.dockerignore`, `docker-compose.yml`, `.gitignore` (atualizar)

### 📦 packages/shared/ (12)
`package.json`, `tsconfig.json`, `src/index.ts`, `src/types/entities.ts`, `src/types/packets.ts`, `src/types/enums.ts`, `src/types/tilemap.ts`, `src/constants/game.ts`, `src/constants/network.ts`, `src/validation/schemas.ts`, `src/__tests__/constants.test.ts`, `src/__tests__/schemas.test.ts`

### 📦 packages/server/ (22)
`package.json`, `tsconfig.json`, `Dockerfile`, `src/index.ts`, `src/config/env.ts`, `src/config/constants.ts`, `src/utils/logger.ts`, `src/network/server.ts`, `src/network/auth.ts`, `src/network/handlers/connection.ts`, `src/network/handlers/auth.ts`, `src/game/GameEngine.ts`, `src/game/World.ts`, `src/game/entities/Player.ts`, `src/game/entities/Monster.ts`, `src/db/connection.ts`, `src/db/migrate.ts`, `src/db/migrations/001_create_accounts.sql`, `src/db/migrations/002_create_characters.sql`, `src/db/models/Account.ts`, `src/db/seed/index.ts`, `src/services/AuthService.ts` + testes

### 📦 packages/client/ (19)
`package.json`, `tsconfig.json`, `vite.config.ts`, `Dockerfile`, `index.html`, `public/maps/lorencia.json`, `src/main.ts`, `src/core/Game.ts`, `src/core/NetworkManager.ts`, `src/core/InputManager.ts`, `src/core/Camera.ts`, `src/core/AssetManager.ts`, `src/ui/MenuScreen.ts`, `src/ui/PlaceholderGraphics.ts`, `src/maps/Tilemap.ts`, `src/maps/Layer.ts`, `src/maps/Collision.ts` + testes

---

## 🔄 Ordem de Execução Recomendada

```
Fase 1 — Fundação (sequencial)
  └── P0.1 (monorepo) → P0.2 (shared)

Fase 2 — Núcleo (paralelo, após P0.2)
  ├── P0.3 (servidor)
  └── P0.4 (cliente)

Fase 3 — Conexão (sequencial, após P0.3 + P0.4)
  └── Integração: cliente conecta no servidor via WS
      ├── shared/types/packets.ts define handshake
      ├── server aceita conexão, registra player
      └── cliente recebe world state com entidades

Fase 4 — Stretch (paralelo opcional)
  ├── P1.1 (auth) — após P0.3
  ├── P1.2 (tilemap) — após P0.4
  ├── P1.3 (CI) — após P0.3 + P0.4 compilarem
  └── P1.4 (Docker) — após P0.3 + P1.1
```

---

## ✅ Critérios de Aceite do Ciclo

Após implementar **P0 completo** e **P1 desejável**:

- [x] `npm install` instala todos os workspaces sem erro
- [x] `npm run build` compila shared + server + client
- [x] `npm run test` executa todos os testes e passa
- [x] `npm run dev` sobe servidor (WS) + cliente (Vite) simultaneamente
- [x] Cliente abre no navegador, mostra tela inicial
- [x] Cliente conecta ao servidor via WebSocket
- [x] Servidor aceita conexão e loga evento
- [ ] **[P1]** Registro + Login funcional via WS + JWT
- [ ] **[P1]** Tilemap JSON carregado e renderizado no cliente
- [ ] **[P1]** CI pipeline verde (lint + build + test)
- [ ] **[P1]** `docker compose up` levanta todo o stack

---

> **Nota:** O arquivo `02-plano-implementacao.md` precisa ser salvo no diretório `docs/cycle/2026-06-18-ciclo-01-fundacao/` pelo Executor ou god agent. O conteúdo completo em formato YAML está descrito acima.
</task_result>