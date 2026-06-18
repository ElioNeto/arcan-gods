# Plano de Testes: Servidor WebSocket (Issue #2)

## 1. Escopo

### O que será testado
- Servidor HTTP + WebSocket escutando nas portas configuradas
- Handshake WebSocket (upgrade de HTTP para WS)
- Heartbeat/ping-pong (keepalive)
- Envio e recebimento de mensagens JSON
- Tratamento de mensagens malformadas
- Desconexão graciosa (client-side e server-side)
- Reconexão
- Múltiplas conexões simultâneas
- Rate limiting de mensagens
- Configuração via variáveis de ambiente (SERVER_PORT, WS_PORT, etc.)
- Graceful shutdown (SIGTERM)

### O que NÃO será testado
- Lógica de jogo (auth, movimento, combate)
- Integração com banco de dados

---

## 2. Unit Tests

### 2.1 Server Setup

- [ ] TC-001: `createServer()` retorna objeto com `httpServer` e `wss` (WebSocketServer)
  - Input: `createServer()`
  - Expected: Objeto com `httpServer` (instanceof http.Server) e `wss` (instanceof WebSocketServer)

- [ ] TC-002: Server escuta na porta definida em `SERVER_PORT` (default 3000)
  - Input: `server.start()`
  - Expected: `server.address().port === SERVER_PORT`

- [ ] TC-003: WebSocket escuta na porta `WS_PORT` ou na mesma porta com path separado
  - Input: `wss.address()`
  - Expected: Porta correta

- [ ] TC-004: Config carrega variáveis de ambiente com fallback
  - Input: Process.env sem variáveis
  - Expected: `config.SERVER_PORT === 3000`, `config.WS_PORT === 3001`

- [ ] TC-005: Config valida porta (1–65535)
  - Input: `SERVER_PORT=0`
  - Expected: Erro de configuração

### 2.2 WebSocket Connection Handling

- [ ] TC-006: `connection` event é emitido quando cliente conecta
  - Input: Cliente WebSocket conecta ao servidor
  - Expected: Callback de `wss.on('connection', ...)` é chamado

- [ ] TC-007: Conexão recebe `id` único (UUID)
  - Input: Cliente conecta
  - Expected: `socket.id` é string UUID v4 válida

- [ ] TC-008: `close` event é emitido quando cliente desconecta
  - Input: Cliente desconecta
  - Expected: Callback de `socket.on('close', ...)` é chamado

- [ ] TC-009: `error` event é tratado sem crash
  - Input: Erro de socket simulado
  - Expected: Evento logado, servidor continua rodando

### 2.3 Message Handling

- [ ] TC-010: `message` event recebe e faz parse de JSON
  - Input: `'{"type":"PING"}'`
  - Expected: Objeto `{ type: 'PING' }` é passado ao handler

- [ ] TC-011: Mensagem binária (Buffer) é convertida para string UTF-8 antes do parse
  - Input: Buffer com `{"type":"PING"}`
  - Expected: Parse bem-sucedido

- [ ] TC-012: Mensagem JSON inválida retorna erro ao cliente
  - Input: `'not json'`
  - Expected: Socket recebe `{ type: 'ERROR', message: 'Invalid JSON' }`

- [ ] TC-013: Mensagem sem campo `type` retorna erro
  - Input: `'{"foo":"bar"}'`
  - Expected: Socket recebe `{ type: 'ERROR', message: 'Missing type' }`

### 2.4 Heartbeat (Ping/Pong)

- [ ] TC-014: Servidor envia `PING` a cada `HEARTBEAT_INTERVAL` ms
  - Input: Cliente conectado, `HEARTBEAT_INTERVAL = 30000`
  - Expected: Cliente recebe `{"type":"PING"}` dentro de 30s

- [ ] TC-015: Cliente que não responde `PONG` em `HEARTBEAT_TIMEOUT` é desconectado
  - Input: Cliente conecta, não envia PONG
  - Expected: Socket é fechado após `HEARTBEAT_TIMEOUT` ms

- [ ] TC-016: Heartbeat time é resetado a cada mensagem recebida
  - Input: Cliente envia dados periodicamente sem responder PING
  - Expected: Conexão mantida (desde que atividade contínua)

- [ ] TC-017: `PONG` do cliente é recebido e registrado
  - Input: Cliente envia `{"type":"PONG"}`
  - Expected: `lastPong` timestamp é atualizado, sem resposta do servidor

### 2.5 Rate Limiting

- [ ] TC-018: Cliente que excede `MAX_MESSAGES_PER_SECOND` é temporariamente bloqueado
  - Input: Cliente envia 100+ mensagens em 1 segundo
  - Expected: Socket recebe `{ type: 'ERROR', message: 'Rate limited' }` e mensagens são ignoradas por 5s

- [ ] TC-019: Rate limit é resetado após o período de penalidade
  - Input: Cliente rate-limited, espera 5s, envia 1 mensagem
  - Expected: Mensagem é processada normalmente

### 2.6 Graceful Shutdown

- [ ] TC-020: `stop()` fecha todas as conexões ativas
  - Input: 3 clientes conectados, `server.stop()` chamado
  - Expected: Todos os sockets recebem close code 1001 (going away)

- [ ] TC-021: `stop()` para de aceitar novas conexões
  - Input: `server.stop()` chamado, novo cliente tenta conectar
  - Expected: Conexão rejeitada

- [ ] TC-022: SIGTERM/SIGINT inicia graceful shutdown
  - Input: Processo recebe SIGTERM
  - Expected: `server.stop()` é chamado, processo termina após limpeza

---

## 3. Integration Tests

### 3.1 Conexão e Handshake

- [ ] TC-023: Cliente WebSocket real conecta ao servidor
  - Setup: Servidor rodando em `ws://localhost:3001`
  - Steps:
    1. Criar `new WebSocket('ws://localhost:3001')`
    2. Aguardar evento `open`
  - Expected: `open` event disparado, `socket.readyState === OPEN`

- [ ] TC-024: Múltiplos clientes conectam simultaneamente
  - Setup: Servidor rodando
  - Steps:
    1. 10 clientes conectam em paralelo
  - Expected: Todos conectam, `wss.clients.size === 10`

- [ ] TC-025: Conexão HTTP pura recebe 400 (upgrade required)
  - Setup: Servidor rodando
  - Steps:
    1. Fazer requisição HTTP GET para `http://localhost:3000` (porta HTTP)
  - Expected: Resposta HTTP 400 ou 426 (Upgrade Required)

### 3.2 Mensagens Round-Trip

- [ ] TC-026: Cliente envia mensagem, servidor responde
  - Setup: Servidor configurado para ecoar mensagens
  - Steps:
    1. Cliente envia `{"type":"ECHO","data":"hello"}`
    2. Cliente aguarda resposta
  - Expected: Cliente recebe `{"type":"ECHO","data":"hello"}`

- [ ] TC-027: Broadcast para todos os clientes
  - Setup: 3 clientes conectados
  - Steps:
    1. Servidor faz broadcast de `{"type":"ANNOUNCEMENT","text":"Hi all"}`
  - Expected: Todos os 3 clientes recebem a mensagem

### 3.3 Reconexão

- [ ] TC-028: Cliente desconectado reconecta e mantém sessão (se suportado)
  - Setup: Servidor com suporte a reconnect
  - Steps:
    1. Cliente conecta
    2. Cliente desconecta (simular queda de rede)
    3. Cliente reconecta com token de sessão dentro de `RECONNECT_TIMEOUT`
  - Expected: Reconexão aceita, sessão anterior restaurada (se aplicável)

---

## 4. Edge Cases

- [ ] TC-029: Conexão com payload gigante (> 1MB) é rejeitada
  - Input: Cliente envia mensagem de 2MB
  - Expected: Conexão fechada ou mensagem rejeitada com código 1009

- [ ] TC-030: Conexão de IP bloqueado (blacklist) é rejeitada
  - Input: Cliente com IP em blacklist tenta conectar
  - Expected: `connection` event não dispara, socket fechado imediatamente

- [ ] TC-031: 1000+ clientes conectam (teste de limite)
  - Input: 1000 conexões simultâneas
  - Expected: Servidor mantém estabilidade, sem crash, latência aceitável

- [ ] TC-032: Cliente envia mensagem após desconexão
  - Input: Socket já fechado, `socket.send()` chamado
  - Expected: Erro `WebSocket is not open` (não crash)

- [ ] TC-033: Servidor com `WS_PORT` igual a `SERVER_PORT`
  - Input: WS_PORT = 3000, SERVER_PORT = 3000 (com path /ws)
  - Expected: Funciona, upgrade via path `/ws`

- [ ] TC-034: Cliente envia `null` ou `undefined` como mensagem
  - Input: `socket.send(null)`
  - Expected: Tratado sem crash

---

## 5. E2E Tests

- [ ] TC-035: Fluxo completo: conectar → mensagem → desconectar → reconectar
  - Setup: Servidor rodando com heartbeat configurado
  - Steps:
    1. Cliente conecta
    2. Cliente envia 5 mensagens JSON válidas
    3. Servidor responde a cada uma
    4. Cliente desconecta (fecha)
    5. Servidor registra close event
    6. Cliente reconecta em 2s
  - Expected: Todas as mensagens são trocadas, ambos os lados registram close/open corretamente

---

## 6. Regressão

- Testes de conexão impactam auth (depende de WS)
- Testes de heartbeat impactam manutenção de sessão
- Rate limiting impacta anti-cheat

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 22 | 8h |
| Integration | 6 | 6h |
| Edge Cases | 6 | 4h |
| E2E | 1 | 2h |
| **Total** | **35** | **20h** |
```

---
