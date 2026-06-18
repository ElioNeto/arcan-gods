# Setup de Desenvolvimento

## Pré-requisitos

- Node.js 20+
- npm 9+
- Docker + Docker Compose (para PostgreSQL e Redis)
- Git

## Primeiros passos

```bash
# Clone
git clone https://github.com/ElioNeto/arcan-gods.git
cd arcan-gods

# Instale dependências do root (workspaces)
npm install

# Copie o arquivo de ambiente
cp .env.example .env

# Suba os serviços de infraestrutura
docker compose up -d

# Rode as migrações do banco
npm run db:migrate

# (Opcional) Popule com dados de seed
npm run db:seed

# Inicie servidor + cliente em modo dev
npm run dev
```

## Estrutura de Commands

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe servidor + cliente em paralelo |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint em todos os pacotes |
| `npm run test` | Vitest em todos os pacotes |
| `npm run db:migrate` | Roda migrations pendentes |
| `npm run db:seed` | Popula banco com dados iniciais |
| `docker compose up` | Sobe PostgreSQL + Redis |

## Variáveis de Ambiente

```env
# Server
SERVER_PORT=3000
WS_PORT=3001

# Database
DATABASE_URL=postgresql://arcan:arcan@localhost:5432/arcan_gods

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=2h

# Game
TICK_RATE=100
MAX_PLAYERS_PER_MAP=100
```

## Docker Compose (dev)

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
