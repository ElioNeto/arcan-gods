# Arquitetura Cliente-Servidor

## Princípios

### Server-Authoritative

Todo cálculo que afeta o estado do jogo (movimento, dano, drop) é **validado e executado no servidor**. O cliente é apenas uma "janela" — ele envia intenções e o servidor responde com o estado autoritativo.

```
Cliente:  INPUT(mouse_click[100, 200])
             │
             ▼  Envia PLAYER_MOVE { x: 100, y: 200 }
             │
Servidor:  ──┤  VALIDA: distância, bounds, colisão
             │  ATUALIZA: posição do player no tick
             │  BROADCASTA: PLAYER_MOVED para todos
             │
Cliente:  ──┤  RECEBE: atualiza renderização
```

### Tick Rate vs. Renderização

| Componente | Frequência | Finalidade |
|------------|-----------|------------|
| **Servidor** | 10 Hz (100ms) | Game loop: processa inputs, atualiza entidades, broadcast |
| **Cliente (render)** | 60 FPS (~16ms) | RAF: interpola posições, desenha tudo |
| **Cliente (network)** | ~3s heartbeat | Keepalive, reconexão |

O cliente interpola as posições entre os snapshots do servidor para parecer fluido.

## Fluxo de Conexão

```
Browser                          Servidor
  │                                 │
  │── 1. Abre WebSocket ──────────►│
  │                                 │── Cria socketData (id)
  │◄── 2. CONNECTED ──────────────│
  │                                 │
  │── 3. AUTH_LOGIN {email,pass} ─►│
  │                                 │── Valida com LoginSchema (Zod)
  │                                 │── Cria Player (auto-login dev mode)
  │                                 │── Adiciona ao World
  │◄── 4. AUTH_SUCCESS {token,player}│
  │◄── 5. WORLD_STATE {entities} ──│
  │                                 │
  │── 6. PLAYER_MOVE {x,y} ───────►│
  │                                 │── Valida com MoveSchema (Zod)
  │                                 │── Valida anti-teleport (max 5 tiles)
  │                                 │── Atualiza posição no tick
  │◄── 7. PLAYER_MOVED {id,x,y} ──│
```

## Game Loop do Cliente

O cliente opera em **phases** gerenciadas pela classe `Game`:

```
INIT ──► LOADING ──► MENU ──► WORLD
  │         │           │         │
  │         ▼           ▼         ▼
  │    Carrega      Mostra    Conectado
  │    assets       tela     + renderiza
  │    PixiJS       inicial   mundo
```

Cada frame (RAF):

```
requestAnimationFrame
  ├── network.processIncoming()   # Processa pacotes recebidos
  ├── input.update()              # Captura input do frame
  ├── entities.update(dt)         # Atualiza posições (interpolação)
  ├── camera.update()             # Segue o player suavemente
  ├── systems.update(dt)          # Cooldowns, efeitos visuais
  ├── ui.update()                 # HUD, janelas
  └── renderer.render()           # PixiJS render
```

## Game Loop do Servidor

```
setInterval(100ms) → tick()
  ├── processIncomingMessages()    # Fila de mensagens dos clientes
  │   ├── PLAYER_MOVE → valida move
  │   ├── PLAYER_ATTACK → valida ataque
  │   ├── PLAYER_CHAT → valida chat
  │   └── HEARTBEAT → responde HEARTBEAT_ACK
  │
  ├── world.update()
  │   ├── players.update()        # Regeneração HP/MP
  │   ├── monsters.update()       # AI futura
  │   └── checkRespawns()         # Monstros mortos respawnam
  │
  ├── checkCollisions()           # Futuro
  ├── checkCombat()               # Futuro
  │
  └── broadcastState()            # Envia WORLD_STATE para todos
```

## Componentes do Cliente

| Componente | Responsabilidade |
|------------|-----------------|
| `Game` | Game loop principal, máquina de estados (phases) |
| `NetworkManager` | Conexão WS, heartbeat, reconexão, fila de mensagens |
| `InputManager` | Rastreia mouse (click, posição) e teclado |
| `Camera` | Smooth follow no jogador com transform |
| `AssetManager` | Gera placeholders via Canvas API |
| `MenuScreen` | Tela inicial com botão de conectar |
| `PlaceholderGraphics` | Factory: player=azul, monster=vermelho, NPC=verde |

## Componentes do Servidor

| Componente | Responsabilidade |
|------------|-----------------|
| `GameEngine` | Tick loop 10Hz, start/stop |
| `World` | CRUD de entidades, broadcast de estado |
| `Player` | Entidade jogador: HP, XP, level up, dano |
| `Monster` | Entidade monstro: template, dano, defesa, respawn |
| `server.ts` | Servidor HTTP + WS, CORS, upgrade handler |
| `connection.ts` | Roteamento de mensagens, rate limiting |
| `auth.ts` | Login/Register handlers |

## Segurança

- **Rate limiting:** Máximo de mensagens por segundo por conexão
- **Anti-speedhack:** Servidor valida distância máxima por tick (5 tiles)
- **Validação Zod:** Todos os pacotes de input validados no servidor
- **Bounds:** Coordenadas limitadas a 0-255
- **Server-authoritative:** Cliente não decide posição final nem dano
