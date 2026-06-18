# Plano de Testes: Autenticação JWT (Issue #5)

## 1. Escopo

### O que será testado
- Registro de conta (email + senha)
- Login com credenciais válidas
- Geração e validação de token JWT
- Middleware de autenticação para WebSocket
- Proteção de rotas HTTP
- Hash de senha com bcrypt
- Validação de dados de entrada (email, senha)
- Rate limiting de login
- Refresh token (se implementado)
- Logout

### O que NÃO será testado
- Criação de personagem (será em outro ciclo)
- Autorização baseada em papéis (admin, player)

---

## 2. Unit Tests

### 2.1 AuthService

- [ ] TC-001: `register(email, password)` cria conta com email e senha hashada
  - Input: `email = 'test@example.com'`, `password = 'SecurePass123'`
  - Expected: Retorna `{ id, email }` sem expor `password_hash`

- [ ] TC-002: `register()` com email duplicado lança erro
  - Input: `email = 'existing@example.com'`
  - Expected: Erro `EMAIL_ALREADY_EXISTS` ou similar

- [ ] TC-003: `register()` com senha fraca lança erro de validação
  - Input: `password = '123'` (muito curta)
  - Expected: Erro `WEAK_PASSWORD` (mínimo 6 caracteres ou conforme regra)

- [ ] TC-004: `register()` com email inválido lança erro
  - Input: `email = 'not-an-email'`
  - Expected: Erro `INVALID_EMAIL`

- [ ] TC-005: `login(email, password)` retorna token JWT para credenciais válidas
  - Input: `email = 'test@example.com'`, `password = 'SecurePass123'`
  - Expected: Retorna `{ token, user: { id, email } }`

- [ ] TC-006: `login()` com senha incorreta lança erro
  - Input: `email = 'test@example.com'`, `password = 'WrongPassword'`
  - Expected: Erro `INVALID_CREDENTIALS`

- [ ] TC-007: `login()` com email inexistente lança erro
  - Input: `email = 'nonexistent@example.com'`, `password = 'any'`
  - Expected: Erro `INVALID_CREDENTIALS` (mesmo erro que senha errada, para não vazar info)

- [ ] TC-008: `login()` com conta deletada (soft delete) retorna erro
  - Input: Conta com `deleted_at` setado
  - Expected: Erro `ACCOUNT_DISABLED`

### 2.2 Password Hashing

- [ ] TC-009: `hashPassword(password)` retorna hash bcrypt
  - Input: `'SecurePass123'`
  - Expected: Hash começa com `$2b$12$` (cost 12)

- [ ] TC-010: `verifyPassword(password, hash)` retorna true para senha correta
  - Input: `password = 'SecurePass123'`, `hash = bcrypt('SecurePass123')`
  - Expected: `true`

- [ ] TC-011: `verifyPassword(password, hash)` retorna false para senha incorreta
  - Input: `password = 'WrongPass'`, `hash = bcrypt('SecurePass123')`
  - Expected: `false`

### 2.3 JWT Token

- [ ] TC-012: `generateToken(payload)` retorna string JWT válida
  - Input: `payload = { accountId: 'uuid-123', email: 'test@test.com' }`
  - Expected: String no formato `xxxxx.yyyyy.zzzzz`

- [ ] TC-013: `verifyToken(token)` retorna payload decodificado para token válido
  - Input: Token gerado com `generateToken`
  - Expected: `{ accountId, email, iat, exp }`

- [ ] TC-014: `verifyToken(token)` lança erro para token expirado
  - Input: Token com `exp` no passado
  - Expected: Erro `TOKEN_EXPIRED`

- [ ] TC-015: `verifyToken(token)` lança erro para token malformado
  - Input: `'invalid.token.string'`
  - Expected: Erro `INVALID_TOKEN`

- [ ] TC-016: `verifyToken(token)` lança erro para token com assinatura inválida
  - Input: Token gerado com chave secreta diferente
  - Expected: Erro `INVALID_SIGNATURE`

- [ ] TC-017: `generateToken()` inclui `iat` (issued at) e `exp` (expiration)
  - Input: Payload sem timestamps
  - Expected: Token decodificado contém `iat` e `exp` numéricos

- [ ] TC-018: Token expira conforme `JWT_EXPIRES_IN` configurado (default 2h)
  - Input: Gerar token com `JWT_EXPIRES_IN = '1h'`
  - Expected: `exp - iat === 3600` segundos

### 2.4 Auth Middleware (WebSocket)

- [ ] TC-019: `authMiddleware(socket, next)` chama `next()` para token válido
  - Input: `socket.upgradeReq.headers['authorization'] = 'Bearer <valid_token>'`
  - Expected: `next()` chamado sem argumentos

- [ ] TC-020: `authMiddleware(socket, next)` rejeita conexão sem token
  - Input: Sem header `Authorization`
  - Expected: `next(new Error('Token required'))`

- [ ] TC-021: `authMiddleware(socket, next)` rejeita token inválido
  - Input: `Authorization: 'Bearer invalid-token'`
  - Expected: `next(new Error('Invalid token'))`

- [ ] TC-022: `authMiddleware(socket, next)` rejeita token expirado
  - Input: Token expirado
  - Expected: `next(new Error('Token expired'))`

- [ ] TC-023: Middleware anexa `accountId` e `email` ao socket em caso de sucesso
  - Input: Token válido
  - Expected: `socket.accountId` e `socket.email` populados

### 2.5 Rate Limiting

- [ ] TC-024: `rateLimiter(ip)` retorna true se abaixo do limite
  - Input: IP nunca visto antes
  - Expected: `{ allowed: true, remaining: 4 }` (se limite = 5/min)

- [ ] TC-025: `rateLimiter(ip)` retorna false após exceder limite
  - Input: 5 requisições seguidas do mesmo IP em 1 minuto
  - Expected: `{ allowed: false, remaining: 0, retryAfter: 60 }`

- [ ] TC-026: Rate limit é resetado após 1 minuto
  - Input: IP rate-limited, esperar 60s
  - Expected: `{ allowed: true }`

---

## 3. Integration Tests

### 3.1 Auth HTTP Endpoints

- [ ] TC-027: POST `/auth/register` cria conta e retorna token
  - Setup: Servidor rodando com PostgreSQL
  - Steps:
    1. `POST /auth/register` com `{ email: 'new@test.com', password: 'Pass123' }`
  - Expected: Status 201, `{ token, user: { id, email } }`

- [ ] TC-028: POST `/auth/login` retorna token para credenciais válidas
  - Setup: Conta existente
  - Steps:
    1. `POST /auth/login` com `{ email: 'test@test.com', password: 'Pass123' }`
  - Expected: Status 200, `{ token, user: { id, email } }`

- [ ] TC-029: POST `/auth/login` retorna 401 para credenciais inválidas
  - Setup: Conta existente
  - Steps:
    1. `POST /auth/login` com `{ email: 'test@test.com', password: 'wrong' }`
  - Expected: Status 401, `{ error: 'INVALID_CREDENTIALS' }`

- [ ] TC-030: POST `/auth/register` retorna 409 para email duplicado
  - Setup: Conta já registrada
  - Steps:
    1. `POST /auth/register` com mesmo email
  - Expected: Status 409, `{ error: 'EMAIL_ALREADY_EXISTS' }`

### 3.2 Auth + WebSocket

- [ ] TC-031: Conexão WebSocket com token válido é aceita
  - Setup: Servidor rodando, token JWT válido
  - Steps:
    1. `new WebSocket('ws://localhost:3001?token=<valid_token>')`
  - Expected: `open` event dispara

- [ ] TC-032: Conexão WebSocket sem token é rejeitada
  - Setup: Servidor rodando
  - Steps:
    1. `new WebSocket('ws://localhost:3001')` sem token
  - Expected: Conexão fechada com código 4001

- [ ] TC-033: Conexão WebSocket com token expirado é rejeitada
  - Setup: Token expirado
  - Steps:
    1. `new WebSocket('ws://localhost:3001?token=<expired_token>')`
  - Expected: Conexão fechada com código 4001

- [ ] TC-034: Mensagens após autenticação carregam `accountId` no handler
  - Setup: Conexão autenticada
  - Steps:
    1. Enviar mensagem `{ type: 'PING' }`
    2. Handler verifica `socket.accountId`
  - Expected: `accountId` está presente e é UUID válido

### 3.3 Sessão e Token Refresh (se aplicável)

- [ ] TC-035: `POST /auth/refresh` com token válido retorna novo token
  - Setup: Token válido
  - Steps:
    1. `POST /auth/refresh` com `Authorization: Bearer <token>`
  - Expected: Status 200, novo token com exp futuro

- [ ] TC-036: `POST /auth/refresh` com token expirado retorna 401
  - Setup: Token expirado
  - Steps:
    1. `POST /auth/refresh` com token expirado
  - Expected: Status 401

---

## 4. Edge Cases

- [ ] TC-037: Registro com email contendo caracteres especiais (acentos, Unicode)
  - Input: `email = 'usúário@exämple.com'`
  - Expected: Rejeitado se domínio não suportar, ou aceito conforme regra

- [ ] TC-038: Senha com caracteres especiais e Unicode
  - Input: `password = 'Pässwörd!@#$%'`
  - Expected: Aceito e hash bcrypt gerado corretamente

- [ ] TC-039: Token JWT com payload grande (> 10 campos)
  - Input: Payload com 20 claims customizadas
  - Expected: Token gerado e verificado sem perda de dados

- [ ] TC-040: Dois logins simultâneos da mesma conta
  - Input: Mesma conta faz login duas vezes
  - Expected: Ambos retornam tokens válidos (ou o primeiro é invalidado, conforme política)

- [ ] TC-041: SQL injection via email ou senha
  - Input: `email = "' OR 1=1; --"`
  - Expected: Query parametrizada, login rejeitado (credencial inválida)

- [ ] TC-042: Timing attack: login com email existente vs inexistente demora similar
  - Input: Medir tempo de resposta para email existente vs não existente
  - Expected: Diferença < 50ms (bcrypt cost 12 domina o tempo)

---

## 5. E2E Tests

- [ ] TC-043: Fluxo completo: registrar → login → conectar WS → enviar mensagem
  - Setup: Servidor rodando com banco
  - Steps:
    1. `POST /auth/register` criar conta
    2. `POST /auth/login` obter token
    3. Conectar WebSocket com token
    4. Enviar mensagem autenticada
    5. Servidor processa com accountId
  - Expected: Fluxo completo sem erros, mensagem processada no contexto do usuário

- [ ] TC-044: Fluxo de erro: login inválido → tentar WS sem token → rejeitado
  - Setup: Servidor rodando
  - Steps:
    1. Tentar login com credenciais erradas (recebe 401)
    2. Tentar conectar WS sem token (recebe close 4001)
    3. Tentar conectar WS com token inválido (recebe close 4001)
  - Expected: Todas as tentativas falham com mensagens de erro apropriadas

---

## 6. Regressão

- Testes de conexão WS (plano #3) — middleware auth impacta handshake
- Testes de shared package — schemas de validação de auth

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 26 | 10h |
| Integration | 10 | 8h |
| Edge Cases | 6 | 3h |
| E2E | 2 | 3h |
| **Total** | **44** | **24h** |
```

---
