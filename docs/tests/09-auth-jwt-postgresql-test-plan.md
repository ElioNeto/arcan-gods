# Plano de Testes: Auth JWT + PostgreSQL

**Feature ID:** P1.5
**Issue:** #5 (expansão)
**Dependências:** Nenhuma (independente, paralelizável)

> **Nota:** Este plano substitui e expande o `05-auth-jwt-test-plan.md` anterior, adicionando a integração com PostgreSQL.
> O plano anterior focava em auth isolada; este adiciona banco de dados real, migrations, queries e conexão.

---

## 1. Escopo

### O que será testado
- Registro de conta (email + senha) com persistência em PostgreSQL
- Hash de senha com bcrypt (cost 12)
- Login com verificação de credenciais no banco
- Geração e validação de token JWT
- Conexão PostgreSQL via pool de conexões
- Migrations (criação de tabela accounts)
- Queries parametrizadas (proteção SQL injection)
- Tratamento de erro de conexão com banco (failover graceful)
- Token JWT com expiração configurável
- Integração: auth HTTP/REST + WebSocket
- Rate limiting por IP
- Email duplicado
- Cleanup: deletar contas (soft delete)

### O que NÃO será testado
- Criação de personagem (outro ciclo)
- Guildas, party ou outras entidades
- Redis (será adicionado depois)

---

## 2. Testes Unitários

### 2.1 AuthService

- [ ] **TC-001: `register(email, password)` cria conta com hash bcrypt**
  - Input: `email = 'test@example.com'`, `password = 'SecurePass123'`
  - Expected: `{ id, email }` sem expor `password_hash`

- [ ] **TC-002: `register()` com email duplicado retorna erro**
  - Input: `email = 'existing@example.com'` já registrado
  - Expected: Erro `EMAIL_ALREADY_EXISTS` (HTTP 409)

- [ ] **TC-003: `register()` com senha fraca retorna erro de validação**
  - Input: `password = '123'` (muito curta)
  - Expected: Erro `WEAK_PASSWORD` ou erro de schema Zod

- [ ] **TC-004: `register()` com email inválido retorna erro**
  - Input: `email = 'not-an-email'`
  - Expected: Erro `INVALID_EMAIL`

- [ ] **TC-005: `register()` com email muito longo (>254 chars)**
  - Input: Email com 300 caracteres
  - Expected: Erro `EMAIL_TOO_LONG`

- [ ] **TC-006: `login(email, password)` retorna token JWT para credenciais válidas**
  - Input: Conta existente, senha correta
  - Expected: `{ token, user: { id, email } }`

- [ ] **TC-007: `login()` com senha incorreta retorna erro (mesmo para email existente e inexistente)**
  - Input: Email existente + senha errada, e email inexistente
  - Expected: Mesmo erro `INVALID_CREDENTIALS` em ambos (não vazar qual está errado)

- [ ] **TC-008: `login()` com conta soft-deletada retorna erro**
  - Input: Conta com `deleted_at` setado
  - Expected: Erro `ACCOUNT_DISABLED`

### 2.2 Password Hashing

- [ ] **TC-009: `hashPassword(password)` retorna hash bcrypt cost 12**
  - Input: `'SecurePass123'`
  - Expected: Hash começa com `$2b$12$`

- [ ] **TC-010: `verifyPassword(password, hash)` retorna true para senha correta**
  - Input: Senha correta + hash correspondente
  - Expected: `true`

- [ ] **TC-011: `verifyPassword(password, hash)` retorna false para senha incorreta**
  - Input: Senha errada + hash de outra senha
  - Expected: `false`

- [ ] **TC-012: Hash de senha com caracteres especiais/unicode**
  - Input: `password = 'Pässwörd!@#$%'`
  - Expected: Hash gerado corretamente, verificação bem-sucedida

### 2.3 JWT Token

- [ ] **TC-013: `generateToken(accountId, email)` retorna string JWT**
  - Input: `accountId = 'uuid-123'`, `email = 'test@test.com'`
  - Expected: String no formato `xxxxx.yyyyy.zzzzz`

- [ ] **TC-014: `verifyToken(token)` retorna payload decodificado**
  - Input: Token gerado com `generateToken`
  - Expected: `{ accountId, email, iat, exp }`

- [ ] **TC-015: `verifyToken(token)` lança erro para token expirado**
  - Input: Token com `exp` no passado
  - Expected: Erro `TOKEN_EXPIRED`

- [ ] **TC-016: `verifyToken(token)` lança erro para token malformado**
  - Input: `'invalid.token.string'`
  - Expected: Erro `INVALID_TOKEN`

- [ ] **TC-017: `verifyToken(token)` lança erro para assinatura inválida**
  - Input: Token gerado com chave secreta diferente
  - Expected: Erro `INVALID_SIGNATURE`

- [ ] **TC-018: Token expira conforme `JWT_EXPIRES_IN` configurado**
  - Input: `JWT_EXPIRES_IN = '1h'`
  - Expected: `exp - iat === 3600` segundos

- [ ] **TC-019: `generateToken()` inclui `iat` e `exp`**
  - Input: Payload sem timestamps
  - Expected: Token decodificado contém `iat` e `exp` numéricos

### 2.4 Database Repository

- [ ] **TC-020: `AccountRepository.findByEmail(email)` retorna conta ou null**
  - Input: `email = 'test@example.com'` (existente e não existente)
  - Expected: Conta para existente, `null` para não existente

- [ ] **TC-021: `AccountRepository.create(data)` insere e retorna conta**
  - Input: `{ email: 'new@test.com', passwordHash: '$2b$12$...' }`
  - Expected: Conta criada com `id`, `email`, `created_at`

- [ ] **TC-022: `AccountRepository.create()` com email duplicado lança erro**
  - Input: Email já existente
  - Expected: Erro de unique constraint violado

- [ ] **TC-023: `AccountRepository.softDelete(id)` seta deleted_at**
  - Input: `accountId` válido
  - Expected: `deleted_at` não-nulo, `findByEmail` não retorna (ou retorna com flag)

- [ ] **TC-024: Queries parametrizadas previnem SQL injection**
  - Input: `email = "' OR 1=1; --"`
  - Expected: Query segura, retorna null (não lista todos)

### 2.5 Migration

- [ ] **TC-025: Migration `001_create_accounts` cria tabela com colunas corretas**
  - Input: Executar migration UP
  - Expected: Tabela `accounts` com `id UUID`, `email VARCHAR UNIQUE`, `password_hash VARCHAR`, `created_at`, `updated_at`, `deleted_at`

- [ ] **TC-026: Migration DOWN dropa tabela**
  - Input: Executar migration DOWN
  - Expected: Tabela `accounts` removida

- [ ] **TC-027: Migration é idempotente (pode rodar múltiplas vezes)**
  - Input: Rodar migration UP 2×
  - Expected: Segunda execução não causa erro (IF NOT EXISTS)

---

## 3. Testes de Integração

### 3.1 Auth HTTP Endpoints (com PostgreSQL real)

- [ ] **TC-028: POST /auth/register → 201 + token + conta no banco**
  - Setup: PostgreSQL rodando, migration executada
  - Steps:
    1. `POST /auth/register` com `{ email: 'new@test.com', password: 'Pass123', username: 'Player1' }`
    2. Verificar resposta
    3. Consultar banco diretamente
  - Expected: Status 201, `{ token, user }`, conta existe no banco

- [ ] **TC-029: POST /auth/register → 409 para email duplicado**
  - Setup: Conta já registrada
  - Steps:
    1. `POST /auth/register` com mesmo email
  - Expected: Status 409, `{ error: 'EMAIL_ALREADY_EXISTS' }`

- [ ] **TC-030: POST /auth/login → 200 + token**
  - Setup: Conta existente
  - Steps:
    1. `POST /auth/login` com `{ email, password }`
  - Expected: Status 200, `{ token, user: { id, email } }`

- [ ] **TC-031: POST /auth/login → 401 para senha errada**
  - Setup: Conta existente
  - Steps:
    1. `POST /auth/login` com `{ email, password: 'wrong' }`
  - Expected: Status 401, `{ error: 'INVALID_CREDENTIALS' }`

- [ ] **TC-032: POST /auth/login → 401 para email inexistente**
  - Setup: Nenhuma conta
  - Steps:
    1. `POST /auth/login` com email aleatório
  - Expected: Status 401, `{ error: 'INVALID_CREDENTIALS' }` (mesmo erro)

- [ ] **TC-033: POST /auth/login → 403 para conta soft-deletada**
  - Setup: Conta com deleted_at setado
  - Steps:
    1. `POST /auth/login` com credenciais corretas
  - Expected: Status 403, `{ error: 'ACCOUNT_DISABLED' }`

### 3.2 Auth + WebSocket

- [ ] **TC-034: Conexão WebSocket com token JWT válido no header**
  - Setup: Servidor HTTP+WS rodando, token válido
  - Steps:
    1. `new WebSocket('ws://localhost:3001?token=<valid_token>')`
  - Expected: Conexão aceita, `open` dispara

- [ ] **TC-035: Conexão WebSocket sem token é rejeitada**
  - Setup: Servidor rodando
  - Steps:
    1. `new WebSocket('ws://localhost:3001')` sem token
  - Expected: Conexão fechada com código 4001

- [ ] **TC-036: Conexão WebSocket com token expirado é rejeitada**
  - Setup: Token expirado
  - Steps:
    1. `new WebSocket('ws://localhost:3001?token=<expired_token>')`
  - Expected: Conexão fechada com código 4001

- [ ] **TC-037: Token inválido na query string → rejeitado**
  - Steps:
    1. `new WebSocket('ws://localhost:3001?token=invalid')`
  - Expected: Close 4001

### 3.3 Database Connection

- [ ] **TC-038: Pool de conexão PostgreSQL inicializa sem erro**
  - Setup: `DATABASE_URL` configurada
  - Steps:
    1. `new Pool({ connectionString: DATABASE_URL })`
    2. `pool.query('SELECT 1')`
  - Expected: `{ rows: [{ 1: 1 }] }`

- [ ] **TC-039: Pool fecha gracefulmente**
  - Setup: Pool ativo
  - Steps: `await pool.end()`
  - Expected: Sem erros, conexões fechadas

- [ ] **TC-040: Conexão recusada (banco offline) retorna erro tratado**
  - Setup: `DATABASE_URL` apontando para banco inexistente
  - Steps:
    1. Tentar `pool.query('SELECT 1')`
  - Expected: Erro `CONNECTION_REFUSED`, servidor não crasha

- [ ] **TC-041: Query timeout após N segundos**
  - Setup: Query lenta
  - Steps:
    1. `pool.query('SELECT pg_sleep(10)', { timeout: 1000 })`
  - Expected: Timeout error após 1s

### 3.4 Rate Limiting

- [ ] **TC-042: 5 requisições de login por minuto por IP**
  - Setup: Servidor HTTP
  - Steps:
    1. 5× POST /auth/login do mesmo IP
    2. Sexta requisição
  - Expected: Status 429, `{ error: 'RATE_LIMIT' }`

- [ ] **TC-043: Rate limit reseta após 1 minuto**
  - Setup: IP rate-limited
  - Steps:
    1. Aguardar 60s
    2. Nova requisição
  - Expected: Status 200 (ou 401, mas não 429)

---

## 4. Casos de Borda

- [ ] **TC-044: Registro com email contendo caracteres especiais (+, ., acentos)**
  - Input: `email = 'user+tag@example.com'`, `email = 'usúário@exämple.com'`
  - Expected: Aceito conforme RFC ou rejeitado com validação explícita

- [ ] **TC-045: Senha com 100+ caracteres**
  - Input: `password = 'A'.repeat(200)`
  - Expected: Rejeitado (max 100) ou hashado sem erro (depende da regra)

- [ ] **TC-046: SQL injection via campos de texto**
  - Input: `email = "' OR 1=1; DROP TABLE accounts; --"`
  - Expected: Query parametrizada, comando não executado

- [ ] **TC-047: Token JWT com payload adicional (metadata)**
  - Input: `generateToken({ accountId, email, role: 'admin' })`
  - Expected: Token gerado, verify retorna todos campos

- [ ] **TC-048: Dois logins simultâneos da mesma conta**
  - Input: Mesma conta faz login de dois dispositivos
  - Expected: Ambos tokens válidos (ou política de single-session)

- [ ] **TC-049: Timing attack: login com email existente vs inexistente**
  - Input: Medir tempo de resposta
  - Expected: Diferença < 50ms (bcrypt cost 12 domina)

- [ ] **TC-050: Migration aplicada em banco vazio vs banco com dados**
  - Input: Banco vazio e banco com tabelas existentes
  - Expected: Migration funciona em ambos (idempotente)

- [ ] **TC-051: Pool de conexão exaure (max connections)**
  - Setup: Pool com max=1
  - Steps:
    1. Ocupar única conexão
    2. Nova query
  - Expected: Queue ou erro `TIMEOUT`, servidor não crasha

---

## 5. E2E Tests

- [ ] **TC-052: Fluxo completo: registrar → login → conectar WS → jogar**
  - Setup: Servidor com PostgreSQL rodando
  - Steps:
    1. `POST /auth/register` — criar conta
    2. `POST /auth/login` — obter token JWT
    3. Conectar WebSocket com token no header
    4. Enviar `PLAYER_MOVE` autenticado
    5. Servidor processa com accountId do token
  - Expected: Fluxo completo sem erros

- [ ] **TC-053: Fluxo de erro: todas as tentativas de acesso negado**
  - Setup: Servidor rodando
  - Steps:
    1. POST /auth/register com email inválido (400)
    2. POST /auth/login com senha errada (401)
    3. Conectar WS sem token (close 4001)
    4. Conectar WS com token expirado (close 4001)
  - Expected: Todos os acessos negados com mensagens apropriadas

- [ ] **TC-054: Restart do servidor mantém dados de conta no banco**
  - Setup: Conta criada, servidor restart
  - Steps:
    1. Criar conta
    2. Restartar servidor
    3. Login com mesmas credenciais
  - Expected: Login bem-sucedido (dados persistentes)

---

## 6. Regressão

- Testes de WebSocket Server (plano #03-server-websocket) — auth middleware integrado
- Testes de Schemas (`schemas.test.ts`) — LoginSchema, RegisterSchema
- Testes de helpers (`helpers.test.ts`) — validação de email
- Testes de Player — criação de player após auth bem-sucedido

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 27 | 12h |
| Integration | 16 | 12h |
| Casos de Borda | 8 | 4h |
| E2E | 3 | 5h |
| **Total** | **54** | **33h** |
