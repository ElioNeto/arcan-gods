# Protocolo WebSocket

## Visão Geral

A comunicação cliente-servidor usa **WebSocket** com mensagens **JSON**. Cada mensagem é um objeto com um campo `type` que identifica o tipo do pacote.

- **Porta:** 3001
- **Formato:** JSON stringify/parse
- **Heartbeat:** A cada 3 segundos (configurável em `NETWORK_CONFIG.HEARTBEAT_INTERVAL`)
- **Anti-flood:** Máximo 30 mensagens/segundo por conexão
- **Anti-speedhack:** Movimento validado com distância máxima de 5 tiles/packet

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

Solicita movimento para um destino. O servidor calcula pathfinding A* e move o jogador continuamente.

```typescript
{ type: 'PLAYER_MOVE'; destX: number; destY: number; timestamp?: number }
```

**Validação:**
- `MoveSchema` (Zod): destX/destY inteiros entre 0 e 4095
- Anti-teleporte: distância máxima de 5 tiles por pacote (fallback)
- Walkable validation via CollisionGrid
- Pathfinding A* com cache LRU

**Respostas possíveis:**
- `PLAYER_PATH` com array de waypoints (início do movimento)
- `PLAYER_MOVED` a cada tick enquanto move
- `ERROR` com código `MOVE_FAILED`, `MOVE_INVALID`, `MOVE_TOO_FAR`

---

### `PLAYER_ATTACK`

Ataca um alvo (monstro ou jogador).

```typescript
{ type: 'PLAYER_ATTACK'; targetId: string }
```

**Validação:**
- Alvo existe e está vivo
- Alcance: distância Manhattan ≤ 2 tiles
- Cooldown: 500ms entre ataques

**Respostas possíveis:**
- `ENTITY_DAMAGED` com dados do ataque
- `ERROR` com código `ATTACK_FAILED`, `TARGET_DEAD`, `OUT_OF_RANGE`, `ON_COOLDOWN`

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

### `PLAYER_PATH`

Caminho A* calculado para o jogador (enviado ao iniciar movimento).

```typescript
{ type: 'PLAYER_PATH'; id: string; path: Waypoint[] }
```

`Waypoint` = `{ x: number; y: number }`

---

### `PLAYER_MOVED`

Notificação de movimento de um jogador (enviado a cada tick enquanto move).

```typescript
{ type: 'PLAYER_MOVED'; id: string; x: number; y: number; direction: Direction; path?: Waypoint[] }
```

`Direction` = `'down' | 'left' | 'right' | 'up'`

Enviado para todos os jogadores no mesmo mapa quando alguém se move.

---

### `MAP_DATA`

Dados do tilemap enviado ao entrar em um novo mapa.

```typescript
{ type: 'MAP_DATA'; map: IMapData }
```

`IMapData` = `{ mapId, width, height, tileSize, layers: ITileLayer[], collisionGrid: boolean[][] }`

---

### `ENTITY_DAMAGED`

Resultado de um ataque (enviado após PLAYER_ATTACK).

```typescript
{ type: 'ENTITY_DAMAGED'; attackerId: string; targetId: string; damage: number; isCritical: boolean; isBlocked: boolean; targetHp: number; targetMaxHp: number; killed: boolean; expGain?: number; goldGain?: number }
```

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
| `NOT_AUTH` | Ação requer autenticação |
| `MOVE_TOO_FAR` | Distância de movimento excede o limite |
| `MOVE_INVALID` | Coordenadas inválidas |
| `MOVE_FAILED` | Pathfinding não encontrou caminho |
| `MOVE_OUT_OF_BOUNDS` | Fora dos limites do mapa |
| `ATTACK_FAILED` | Ataque inválido (range/cooldown/alvo) |
| `TARGET_DEAD` | Alvo já está morto |
| `OUT_OF_RANGE` | Alvo fora do alcance |
| `ON_COOLDOWN` | Ação em cooldown |
| `CHAT_INVALID` | Mensagem de chat inválida |
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
  │◄── MAP_DATA {map} ───────────│
  │                                 │
  │── PLAYER_MOVE {destX,destY} ──►│
  │◄── PLAYER_PATH {path[]} ─────│
  │  (servidor move tick a tick)    │
  │◄── PLAYER_MOVED {id,x,y,dir}─│
  │                                 │
  │── PLAYER_ATTACK {targetId} ───►│
  │◄── ENTITY_DAMAGED {dano,hp} ──│
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
