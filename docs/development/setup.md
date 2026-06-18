# Setup — Arcan Gods

## Requisitos

- **Node.js** 20.x ou superior
- **NPM** 10.x
- **Docker** (opcional, para PostgreSQL/Redis)

## Instalação

```bash
git clone https://github.com/ElioNeto/arcan-gods.git
cd arcan-gods
npm install
cp .env.example .env
```

## Desenvolvimento

```bash
# Servidor + cliente em paralelo (hot-reload)
npm run dev

# Apenas servidor (WebSocket na porta 3001)
npm run dev -w packages/server

# Apenas cliente (Vite na porta 5173)
npm run dev -w packages/client
```

## Testes

```bash
# Todos os testes (247)
npm run test

# Modo watch
npm run test:watch

# Testes de um pacote específico
npx vitest run packages/server
npx vitest run packages/shared
npx vitest run packages/client
```

## Build

```bash
# Build completo (shared → server → client)
npm run build
```

## Docker

```bash
# Produção (postgres + redis + server + client)
docker compose up -d

# Desenvolvimento com hot-reload
docker compose -f docker-compose.dev.yml up

# Logs
docker compose logs -f server
```

## Estrutura do Projeto

```
packages/
├── shared/     → Tipos, constantes, fórmulas, schemas Zod
├── server/     → WebSocket, GameEngine, World, Pathfinding, Combat
└── client/     → PixiJS, Vite, NetworkManager, Camera, UI
```

## Debug

O cliente expõe a instância do jogo no console (apenas em DEV):

```js
// No console do navegador:
window.__game          // Instância completa do Game
window.__game.networkManager  // NetworkManager
```
