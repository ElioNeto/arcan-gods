# Protocolo WebSocket

## Visão Geral

A comunicação cliente-servidor usa **WebSocket** com mensagens **JSON**. Cada mensagem é um objeto com um campo `type` que identifica o tipo do pacote.

- **Porta:** 3001
- **Formato:** JSON stringify/parse
- **Heartbeat:** A cada 3 segundos (configurável em `NETWORK_CONFIG.HEARTBEAT_INTERVAL`)

## Pacotes do Cliente → Servidor

### `AUTH_LOGIN`

Login com email e senha.

```typescript
{ type: 'AUTH_LOGIN'; email: string; password: string }
```

**Validação:** `LoginSchema` (Zod) — email formato válido, senha 6-100 caracteres.

**Respostas possíveis:** `AUTH_SUCCESS` + `WORLD_STATE`, ou `AUTH_ERROR`

---

### `AUTH_REGISTER`

Registrar nova conta.

```typescript
{ type: 'AUTH_REGISTER'; email: string; password: string; username: string }
```

**Validação:** `RegisterSchema` (Zod) — email válido, senha 6-100, username 3-20 caracteres.

**Respostas possíveis:** `AUTH_SUCCESS` + `WORLD_STATE`, ou `AUTH_ERROR`

---

### `PLAYER_MOVE`

Move o jogador para uma posição no mapa.

```typescript
{ type: 'PLAYER_MOVE'; x: number; y: number }
```

**Validação:**
- `MoveSchema` (Zod): x e y inteiros entre 0 e 255
- Anti-teleporte: distância máxima de 5 tiles por pacote
- Bounds do mapa: 0-255

**Respostas possíveis:** `PLAYER_MOVED` (sucesso), `ERROR` com código `MOVE_TOO_FAR` ou `MOVE_INVALID`

---

### `PLAYER_ATTACK`

Ataca um alvo.

```typescript
{ type: 'PLAYER_ATTACK'; targetId: string }
```

**Status:** ⚠️ Retorna `ERROR` com código `NOT_IMPLEMENTED` (será implementado no Ciclo 02).

---

### `PLAYER_CHAT`

Envia mensagem no chat.

```typescript
{ type: 'PLAYER_CHAT'; message: string; channel: ChatChannel }
```

`ChatChannel` = `'global' | 'party' | 'guild' | 'whisper'`

**Validação:** `ChatSchema` (Zod) — mensagem 1-200 caracteres, canal válido.

**Respostas possíveis:** `CHAT_MESSAGE` (eco para todos no canal)

---

### `HEARTBEAT`

Keepalive para manter conexão ativa.

```typescript
{ type: 'HEARTBEAT'; timestamp: number }
```

**Resposta:** `HEARTBEAT_ACK` com o mesmo timestamp.

O cliente envia heartbeat a cada 3 segundos. Se o servidor não receber heartbeat por 10 segundos, a conexão é fechada.

---

### `LOGOUT`

Desconexão voluntária.

```typescript
{ type: 'LOGOUT' }
```

---

## Pacotes do Servidor → Cliente

### `CONNECTED`

Enviado imediatamente após a abertura da conexão WebSocket.

```typescript
{ type: 'CONNECTED'; message: string }
```

---

### `AUTH_SUCCESS`

Login ou registro bem-sucedido.

```typescript
{ type: 'AUTH_SUCCESS'; token: string; player: IPlayer }
```

No modo dev, o token é um mock `test-token-{playerId}`.

---

### `AUTH_ERROR`

Falha na autenticação.

```typescript
{ type: 'AUTH_ERROR'; message: string }
```

---

### `WORLD_STATE`

Estado completo do mundo enviado após autenticação.

```typescript
{ type: 'WORLD_STATE'; entities: IEntity[]; mapId: string }
```

Contém todos os jogadores e monstros no mapa atual. Atualmente envia 10 monstros + 1+ jogadores.

---

### `ENTITY_UPDATE`

Atualização de uma entidade específica.

```typescript
{ type: 'ENTITY_UPDATE'; entity: IEntity }
```

---

### `ENTITY_REMOVE`

Remoção de uma entidade (ex: monstro morto).

```typescript
{ type: 'ENTITY_REMOVE'; id: string }
```

---

### `PLAYER_MOVED`

Notificação de movimento de um jogador.

```typescript
{ type: 'PLAYER_MOVED'; id: string; x: number; y: number; direction: Direction }
```

`Direction` = `'down' | 'left' | 'right' | 'up'`

Enviado para todos os jogadores no mesmo mapa quando alguém se move.

---

### `CHAT_MESSAGE`

Mensagem de chat de outro jogador.

```typescript
{ type: 'CHAT_MESSAGE'; id: string; name: string; message: string; channel: ChatChannel }
```

---

### `ERROR`

Erro genérico do servidor.

```typescript
{ type: 'ERROR'; message: string; code: string }
```

**Códigos de erro:**
| Código | Significado |
|--------|-------------|
| `NOT_IMPLEMENTED` | Funcionalidade ainda não implementada |
| `MOVE_TOO_FAR` | Distância de movimento excede o limite |
| `MOVE_INVALID` | Coordenadas inválidas |
| `UNKNOWN_TYPE` | Tipo de pacote desconhecido |
| `RATE_LIMIT` | Excedeu limite de requisições |

---

### `HEARTBEAT_ACK`

Resposta ao heartbeat do cliente.

```typescript
{ type: 'HEARTBEAT_ACK'; timestamp: number }
```

---

## Fluxo Completo de uma Sessão

```
Cliente                          Servidor
  │                                 │
  │── CONNECT (WebSocket open) ───►│
  │◄── CONNECTED ◄───────────────│
  │                                 │
  │── AUTH_LOGIN {email, pass} ───►│
  │◄── AUTH_SUCCESS {token,player}│
  │◄── WORLD_STATE {entities} ────│
  │                                 │
  │── PLAYER_MOVE {x:50, y:60} ───►│
  │◄── PLAYER_MOVED {id,x,y,dir}─│
  │                                 │
  │── PLAYER_CHAT "Hello!" ───────►│
  │◄── CHAT_MESSAGE {eco} ────────│
  │                                 │
  │── HEARTBEAT {ts} ─────────────►│
  │◄── HEARTBEAT_ACK {ts} ────────│
  │                                 │
  │── LOGOUT ─────────────────────►│
  │◄── (WebSocket close) ─────────│
```

## Rate Limiting

O servidor aplica rate limiting por conexão:

- **Máximo:** 100 mensagens por janela de 10 segundos
- **Bloqueio:** Conexão fechada se exceder o limite
- **Abrange:** Todos os tipos de pacote

## Reconexão

O cliente tenta reconectar automaticamente em caso de queda:

- **Atraso inicial:** 1 segundo
- **Máximo de tentativas:** 5
- **Eventos emitidos:** `reconnecting`, `reconnect_failed`
- **Fila de mensagens:** Mensagens enviadas durante desconexão são enfileiradas e enviadas quando reconectar
