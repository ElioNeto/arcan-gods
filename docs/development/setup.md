# Setup de Desenvolvimento

## Pré-requisitos

- Node.js 20+
- npm 9+
- Git

> **Nota:** PostgreSQL e Redis são necessários apenas quando a autenticação com banco for implementada (P1.1). No momento, o servidor roda em modo dev com auto-login.

## Primeiros passos

```bash
# Clone
git clone https://github.com/ElioNeto/arcan-gods.git
cd arcan-gods

# Instale dependências (todos os workspaces: shared, server, client)
npm install

# Copie o arquivo de ambiente
cp .env.example .env

# Inicie servidor + cliente em modo dev
npm run dev
```

O servidor WebSocket sobe em `ws://localhost:3001`.
O cliente Vite sobe em `http://localhost:5173`.

Abra o navegador em `http://localhost:5173`, clique em **"Conectar"** e veja o jogo funcionando!

## Estrutura de Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe servidor + cliente em paralelo (concurrently) |
| `npm run build` | Build de produção (shared → server → client) |
| `npm run lint` | ESLint em todos os pacotes |
| `npm run test` | Vitest em todos os pacotes (73 testes) |
| `npm run test:watch` | Testes em modo watch |

## Testes

```bash
# Executar todos os testes
npm run test

# Executar testes de um pacote específico
npx vitest run packages/shared
npx vitest run packages/server
npx vitest run packages/client

# Modo watch
npm run test:watch
```

## Variáveis de Ambiente

```env
# Server
SERVER_PORT=3000
WS_PORT=3001

# Database (futuro — P1.1)
DATABASE_URL=postgresql://arcan:arcan@localhost:5432/arcan_gods

# Redis (futuro)
REDIS_URL=redis://localhost:6379

# Auth (futuro — P1.1)
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=2h

# Game
TICK_RATE=100         # ms (10 Hz)
MAX_PLAYERS_PER_MAP=100
```

## Docker Compose (futuro)

> O Docker Compose com PostgreSQL + Redis será implementado no **Ciclo 02**. Até lá, o servidor funciona em modo standalone com auto-login.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: arcan
      POSTGRES_PASSWORD: arcan
      POSTGRES_DB: arcan_gods
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## Desenvolvimento

### Estrutura de diretórios

```
packages/
├── shared/   → npm run dev -w packages/shared   (build watch)
├── server/   → npm run dev -w packages/server   (tsx watch)
└── client/   → npm run dev -w packages/client   (vite)
```

### Debug

O objeto global `__game` está disponível no console do navegador **apenas em desenvolvimento** (`import.meta.env.DEV`). Use para inspecionar estado do jogo.

```javascript
// No console do navegador (dev mode apenas)
console.log(__game); // Instância da classe Game
```
