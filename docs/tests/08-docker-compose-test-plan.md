# Plano de Testes: Docker Compose (Issue #7)

## 1. Escopo

### O que será testado
- `docker compose up` sobe todos os serviços sem erros
- PostgreSQL 16 container saudável e aceitando conexões
- Redis 7 container saudável e aceitando conexões
- Servidor Node.js containerizado (se aplicável)
- Cliente Vite containerizado (se aplicável)
- Network entre containers (server ↔ postgres, server ↔ redis)
- Health checks configurados
- Volumes persistentes (pgdata)
- Variáveis de ambiente passadas corretamente
- Cleanup: `docker compose down` remove containers e (se configurado) volumes
- Logs sem erros críticos

### O que NÃO será testado
- Orquestração multi-servidor (Kubernetes, Swarm)
- Build de imagens personalizadas para produção (se for usar imagens oficiais)
- Escalabilidade horizontal

---

## 2. Unit Tests (Validação de Configuração)

### 2.1 docker-compose.yml

- [ ] TC-001: Arquivo `docker-compose.yml` existe no root
  - Input: Listar arquivos do root
  - Expected: `docker-compose.yml` ou `compose.yaml` presente

- [ ] TC-002: YAML é sintaticamente válido
  - Input: `docker-compose.yml`
  - Expected: Parse YAML bem-sucedido (via `docker compose config`)

- [ ] TC-003: Compose file usa version 3.8+ (ou formato mais recente)
  - Input: `version` field ou estrutura do compose
  - Expected: Compatível com Docker Compose V2

### 2.2 PostgreSQL Service

- [ ] TC-004: Serviço `postgres` está definido
  - Input: `services.postgres`
  - Expected: Objeto com `image`, `environment`, `ports`, `volumes`

- [ ] TC-005: Imagem PostgreSQL é `postgres:16-alpine`
  - Input: `services.postgres.image`
  - Expected: `postgres:16-alpine`

- [ ] TC-006: Porta mapeada: host 5432 → container 5432
  - Input: `services.postgres.ports`
  - Expected: `['5432:5432']`

- [ ] TC-007: Variáveis de ambiente definidas: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - Input: `services.postgres.environment`
  - Expected: `POSTGRES_USER=arcan`, `POSTGRES_PASSWORD=arcan`, `POSTGRES_DB=arcan_gods`

- [ ] TC-008: Volume `pgdata` montado em `/var/lib/postgresql/data`
  - Input: `services.postgres.volumes`
  - Expected: `pgdata:/var/lib/postgresql/data`

- [ ] TC-009: Volume `pgdata` declarado em `volumes:`
  - Input: `volumes.pgdata`
  - Expected: Objeto vazio ou com driver definido

- [ ] TC-010: Health check do PostgreSQL está configurado
  - Input: `services.postgres.healthcheck`
  - Expected: `test: ["CMD-SHELL", "pg_isready -U arcan"]` ou similar

### 2.3 Redis Service

- [ ] TC-011: Serviço `redis` está definido
  - Input: `services.redis`
  - Expected: Objeto com `image`, `ports`

- [ ] TC-012: Imagem Redis é `redis:7-alpine`
  - Input: `services.redis.image`
  - Expected: `redis:7-alpine`

- [ ] TC-013: Porta mapeada: host 6379 → container 6379
  - Input: `services.redis.ports`
  - Expected: `['6379:6379']`

- [ ] TC-014: Redis tem health check configurado (opcional)
  - Input: `services.redis.healthcheck`
  - Expected: `test: ["CMD", "redis-cli", "ping"]` ou similar, ou omitido

### 2.4 Server Service (se aplicável no Compose)

- [ ] TC-015: Serviço `server` (se definido) depende de `postgres` e `redis`
  - Input: `services.server.depends_on`
  - Expected: `depends_on` contém `postgres` e `redis`, com `condition: service_healthy`

- [ ] TC-016: Server service usa `build: ./packages/server` ou imagem
  - Input: `services.server.build` ou `services.server.image`
  - Expected: Path válido para Dockerfile ou imagem pública

### 2.5 Client Service (se aplicável no Compose)

- [ ] TC-017: Serviço `client` (se definido) expõe porta 5173 (Vite)
  - Input: `services.client.ports`
  - Expected: `['5173:5173']` ou similar

### 2.6 Network

- [ ] TC-018: Todos os serviços estão na mesma rede (default ou nomeada)
  - Input: `services.*.networks`
  - Expected: Todos compartilham a rede padrão ou uma rede nomeada

---

## 3. Integration Tests

### 3.1 Container Startup

- [ ] TC-019: `docker compose up -d` sobe todos os containers sem erro
  - Setup: Docker + Compose instalados, portas 5432 e 6379 livres
  - Steps:
    1. `docker compose up -d`
  - Expected: Exit code 0, containers status = "Up"

- [ ] TC-020: PostgreSQL container aceita conexão
  - Setup: Container postgres rodando
  - Steps:
    1. `docker compose exec postgres pg_isready -U arcan`
  - Expected: Resposta `localhost:5432 - accepting connections`

- [ ] TC-021: Redis container aceita conexão
  - Setup: Container redis rodando
  - Steps:
    1. `docker compose exec redis redis-cli ping`
  - Expected: `PONG`

### 3.2 Network Connectivity

- [ ] TC-022: Server (host) consegue conectar no PostgreSQL via container name
  - Setup: PostgreSQL rodando no container
  - Steps:
    1. De fora do Docker (host), conectar via `psql -h localhost -U arcan -d arcan_gods`
  - Expected: Conexão estabelecida

- [ ] TC-023: Server consegue conectar no PostgreSQL via hostname do container
  - Setup: Outro container na mesma rede
  - Steps:
    1. `docker compose run --rm server node -e "require('pg').Client({host:'postgres'}).connect()"`
  - Expected: Conexão estabelecida

- [ ] TC-024: Server consegue conectar no Redis via hostname do container
  - Setup: Redis rodando
  - Steps:
    1. `docker compose run --rm server node -e "require('ioredis').Redis({host:'redis'}).ping()"`
  - Expected: `PONG`

### 3.3 Health Checks

- [ ] TC-025: Health check do PostgreSQL retorna "healthy"
  - Setup: Container postgres rodando
  - Steps:
    1. `docker inspect --format='{{.State.Health.Status}}' arcan-gods-postgres-1`
  - Expected: `healthy`

- [ ] TC-026: Servidor só inicia após PostgreSQL estar healthy
  - Setup: `depends_on` com `condition: service_healthy`
  - Steps:
    1. `docker compose up -d server`
    2. Verificar ordem de inicialização nos logs
  - Expected: Server espera postgres ficar healthy antes de iniciar

### 3.4 Persistence

- [ ] TC-027: Dados persistem após restart do container
  - Setup: PostgreSQL rodando, tabela criada com dados
  - Steps:
    1. `docker compose restart postgres`
    2. Verificar dados ainda existem
  - Expected: Dados preservados

- [ ] TC-028: Dados persistem após `down` e `up`
  - Setup: Dados inseridos
  - Steps:
    1. `docker compose down`
    2. `docker compose up -d`
    3. Verificar dados
  - Expected: Dados preservados (porque volume não foi removido)

---

## 4. Edge Cases

- [ ] TC-029: Porta 5432 já em uso no host → erro claro
  - Setup: PostgreSQL host rodando na 5432
  - Steps:
    1. `docker compose up -d`
  - Expected: Erro `port is already allocated`, container não sobe

- [ ] TC-030: `docker compose down -v` remove volume e dados
  - Setup: Dados inseridos
  - Steps:
    1. `docker compose down -v`
    2. `docker compose up -d`
    3. Verificar dados
  - Expected: Dados perdidos (volume deletado)

- [ ] TC-031: Container PostgreSQL para de funcionar (simular crash)
  - Setup: Server conectado ao PostgreSQL
  - Steps:
    1. `docker compose stop postgres`
  - Expected: Server loga erro de conexão, tenta reconectar (se configurado)

- [ ] TC-032: Container Redis para de funcionar
  - Setup: Server conectado ao Redis
  - Steps:
    1. `docker compose stop redis`
  - Expected: Server loga erro de conexão, opera em modo degradado (se possível)

- [ ] TC-033: Variável de ambiente ausente
  - Setup: `.env` ausente ou incompleto
  - Steps:
    1. `docker compose up -d`
  - Expected: Container usa defaults ou falha com mensagem clara

- [ ] TC-034: Múltiplas execuções simultâneas de `docker compose up`
  - Steps:
    1. Executar `docker compose up -d` duas vezes em terminais diferentes
  - Expected: Segunda execução indica que containers já existem, não duplica

---

## 5. E2E Tests

- [ ] TC-035: Fluxo completo: docker compose up → serviços saudáveis → dados persistidos → docker compose down
  - Setup: Sistema limpo (sem containers)
  - Steps:
    1. `docker compose up -d`
    2. Aguardar health checks passarem (30s)
    3. Conectar ao PostgreSQL e criar tabela + inserir dado
    4. Conectar ao Redis e setar chave
    5. `docker compose down`
    6. `docker compose up -d`
    7. Verificar dados no PostgreSQL e Redis
  - Expected: Dados preservados, todos os serviços saudáveis

- [ ] TC-036: Stack completa (postgres + redis + server + client)
  - Setup: Compose com todos os 4 serviços definidos
  - Steps:
    1. `docker compose up -d`
    2. Aguardar todos healthy
    3. Verificar server loga "Server running on port 3000"
    4. Verificar client Vite acessível em `http://localhost:5173`
    5. Testar requisição HTTP para server
  - Expected: Toda a stack funcional

---

## 6. Regressão

- Docker Compose impacta todos os serviços que dependem de banco/cache
- Se quebrar, paralisa desenvolvimento local

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit (validação) | 18 | 2h |
| Integration | 10 | 5h |
| Edge Cases | 6 | 3h |
| E2E | 2 | 3h |
| **Total** | **36** | **13h** |
```

---

# Sumário Consolidado

| # | Arquivo | Feature | Total Testes | Esforço Estimado |
|---|---------|---------|:------------:|:----------------:|
| 1 | `docs/tests/01-monorepo-setup-test-plan.md` | Setup Monorepo (P0) | 27 | 10h |
| 2 | `docs/tests/02-shared-package-test-plan.md` | Shared Package (P0) | 29 | 10h |
| 3 | `docs/tests/03-server-websocket-test-plan.md` | Servidor WebSocket (P0) | 35 | 20h |
| 4 | `docs/tests/04-client-vite-pixi-test-plan.md` | Cliente Vite+PixiJS (P0) | 35 | 21h |
| 5 | `docs/tests/05-auth-jwt-test-plan.md` | Autenticação JWT (P1) | 44 | 24h |
| 6 | `docs/tests/06-tilemap-loader-test-plan.md` | Tilemap Loader (P1) | 36 | 22h |
| 7 | `docs/tests/07-ci-pipeline-test-plan.md` | CI Pipeline (P1) | 28 | 11h |
| 8 | `docs/tests/08-docker-compose-test-plan.md` | Docker Compose (P1) | 36 | 13h |
| | **Total** | | **270** | **131h** |

## Observações Finais

1. **P0 (essencial)** — 126 testes, ~61h estimadas
2. **P1 (importante)** — 144 testes, ~70h estimadas
3. **Cobertura por tipo:**
   - Unitários: ~158 testes (58%)
   - Integração: ~46 testes (17%)
   - Edge Cases: ~47 testes (17%)
   - E2E: ~11 testes (4%)
   - Validação de config: ~8 testes (3%)
4. **Riscos identificados:** testes de WebSocket e auth são os mais complexos; tilemap tem muitas variações de formato Tiled; Docker Compose requer ambiente Docker funcional.
5. **Paralelização possível:** planos #3 (server) e #4 (client) podem ser implementados em paralelo; #5 (auth) depende de #3; #6 (tilemap) depende de #4; #7 e #8 dependem de #3 e #4 compilarem.
</task_result>
