# Arquitetura — Arcan Gods

> **Status:** Atualizado · Versão 0.2 · Ciclo 04: Monster AI + HUD + Combat Feedback + Stamina

---

## 1. Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Cliente (PixiJS + Vite)             │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────────────┐  │   │
│  │  │  Core   │ │ Entities │ │     Systems     │  │   │
│  │  │ Engine  │ │ Player   │ │ Combat          │  │   │
│  │  │ Input   │ │ Monster  │ │ Inventory       │  │   │
│  │  │ Camera  │ │ NPC      │ │ Skills          │  │   │
│  │  │ Audio   │ │ Projectile││ Quests          │  │   │
│  │  └────┬────┘ └────┬─────┘ └────────┬────────┘  │   │
│  │       │           │                │            │   │
│  │  ┌────▼───────────▼────────────────▼────────┐   │   │
│  │  │         Network Manager (WebSocket)       │   │   │
│  │  └────────────────┬─────────────────────────┘   │   │
│  └───────────────────┼─────────────────────────────┘   │
└──────────────────────┼─────────────────────────────────┘
                       │ WebSocket (JSON/TCP)
┌──────────────────────┼─────────────────────────────────┐
│  ┌───────────────────▼──────────────────────────────┐  │
│  │              Servidor (Node.js)                   │  │
│  │                                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │  │
│  │  │ Network    │  │ Game Loop  │  │ Services   │  │  │
│  │  │ WebSocket  │  │ Tick 10Hz  │  │ Auth       │  │  │
│  │  │ Auth       │  │ Entities   │  │ Social     │  │  │
│  │  │ Session    │  │ Maps       │  │ Economy    │  │  │
│  │  └────────────┘  └─────┬──────┘  └──────┬─────┘  │  │
│  │                        │                 │         │  │
│  │  ┌─────────────────────▼─────────────────▼──────┐  │  │
│  │  │            Database Layer                     │  │  │
│  │  │  PostgreSQL (persist) + Redis (cache/session) │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Stack Detalhada

### 2.1 Cliente

| Tecnologia | Finalidade |
|------------|------------|
| **TypeScript** | Strict mode, tipagem forte |
| **PixiJS 8** | Renderização 2D via WebGL/Canvas |
| **Vite** | Build tool, hot-reload em desenvolvimento |
| **Colyseus** (ou similar) | Cliente WebSocket com room/state sync |
| **Howler.js** | Áudio |

### 2.2 Servidor

| Tecnologia | Finalidade |
|------------|------------|
| **Node.js + TypeScript** | Runtime |
| **Colyseus** (ou uWebSockets.js) | WebSocket server + room management |
| **PostgreSQL** | Dados persistentes (contas, chars, itens, guilds) |
| **Redis** | Sessões, cache, filas |
| **Zod** | Validação de schemas |
| **Vitest** | Testes |

### 2.3 Compartilhado

| Tecnologia | Finalidade |
|------------|------------|
| **shared/** | Tipos, enums, constantes, fórmulas duplicadas |

---

## 3. Decisões Técnicas

### 3.1 Server-Authoritative

Todo cálculo que afeta o estado do jogo (dano, drop, movimento) é validado no servidor. O cliente é apenas uma "janela" — ele envia intenções, o servidor executa e retorna o resultado.

```
Cliente:  INPUT(mouse_click[100, 200])
Servidor: VALIDA → Move entity x,y → BROADCASTA(posição)
Cliente:  RECEBE → Atualiza render
```

### 3.2 Tick Rate vs. Interpolação

Servidor roda a 10 ticks/s (100ms). Cliente interpola posições entre updates para parecer fluido (60 FPS).

### 3.3 Networking: WebSocket vs. Raw TCP

Usaremos WebSocket com mensagens JSON compactadas. Em versões futuras, podemos migrar para formato binário (msgpack ou protocol buffers) para reduzir overhead.

### 3.4 Mapas: Tiled

Mapas serão criados no [Tiled Editor](https://www.mapeditor.org/) e exportados como JSON. O cliente carrega e renderiza os layers.

---

## 4. Fluxos Principais

### 4.1 Login → Mundo

```
Cliente                          Servidor                   DB
  │                                │                         │
  │── POST /auth/login ──────────►│                         │
  │                                │── SELECT user ────────►│
  │                                │◄── user data ──────────│
  │◄── { token, characters } ────│                         │
  │── WS /game ──────────────────►│                         │
  │── { type: "select_char" } ──►│                         │
  │                                │── LOAD char + invent ─►│
  │                                │◄── data ──────────────│
  │                                │── ADD to world ────────│
  │◄── WORLD_STATE ──────────────│                         │
```

### 4.2 Combate

```
Cliente                          Servidor
  │                                │
  │── ATTACK(target_id) ─────────►│
  │                                ├── Valida: alvo vivo, range, cooldown
  │                                ├── Calcula dano (fórmula server-side)
  │                                ├── Aplica dano no HP do alvo
  │                                ├── Se HP ≤ 0: kill, drop, XP
  │── DAMAGE(target, amount) ────►│
  │── SE killer: DROP_ITEMS ─────►│
  │── SE killed: DEATH ──────────►│
```

---

## 5. Modelo de Dados (Entidades)

```
Account
  id: UUID
  email: string
  password_hash: string
  created_at: timestamp

Character
  id: UUID
  account_id: UUID → Account
  name: string
  class: DarkKnight | DarkWizard | Elf | Summoner | MagicGladiator
  level: number
  experience: number
  strength, agility, energy, vitality: number
  hp, mp: number
  map_id: string
  pos_x, pos_y: number
  created_at: timestamp

Inventory
  id: UUID
  character_id: UUID → Character
  slots: JSON (item_id × position)

Item
  id: UUID
  template_id: string
  level: number (upgrade)
  options: JSON (stats extras)
  owner_id: UUID → Character

Guild
  id: UUID
  name: string
  tag: string
  master_id: UUID → Character
  members: UUID[] → Character
```

---

## 6. Segurança

- Senhas hashadas com **bcrypt** (cost 12)
- JWT para autenticação HTTP inicial
- Toda mensagem WebSocket carrega token de sessão
- Validação server-side de TODAS as ações
- Rate limiting por conexão
- Sanitização de input em chat e comandos
- Anti-speedhack: servidor valida timestamps de movimento

## 7. Sistemas Adicionados no Ciclo 04

### 7.1 Monster AI (Server)

```
Server Tick (100ms) — MonsterAISystem.update()
  │
  ├── Stagger: processa 1/3 dos monstros por tick (3 grupos)
  │
  └── Para cada monstro: MonsterFSM.update()
        │
        ├── IDLE  → scan players no aggroRange
        │           ├── player encontrado → AGGRO
        │           └── sem player → patrol idle (3-5s)
        │
        ├── AGGRO → calcula path A* para o alvo → CHASE
        │
        ├── CHASE → recálculo de path a cada 500ms
        │           ├── dist ≤ attackRange → ATTACK
        │           ├── dist > leash → RETURN
        │           └── target morto → RETURN
        │
        ├── ATTACK → cooldown respeitado?
        │           ├── sim → processMonsterAttack() + broadcast
        │           └── não → idle até cooldown
        │
        └── RETURN → path A* para spawn
                      ├── chegou → IDLE
                      └── player re-aggro → CHASE
```

**Arquitetura:**
- `MonsterFSM` — máquina de estados pura, testável em isolamento (24 testes)
- `MonsterAISystem` — orquestração com stagger e performance monitoring
- Dados de AI no `Monster` entity: `currentState`, `aggroTargetId`, `aiPath`, `aiMoveRemainder`
- Tipos compartilhados em `shared/src/types/ai.ts` (`MonsterAIState`, `MonsterAIConfig`)
- Ataques processados via `CombatSystem.processMonsterAttack()` com validação server-side

### 7.2 HUD (Client)

```
Client Frame (60fps) — Game.update()
  │
  ├── HUD.update(localPlayerData)
  │     ├── HP Bar  (vermelho, 200×20px)
  │     ├── MP Bar  (azul, 200×20px)
  │     ├── XP Bar  (dourado, 200×12px)
  │     ├── Level Text ("Lv. X")
  │     └── Name Text
  │
  └── CombatFeedbackManager.update(deltaSec)
        ├── DamageNumber[] → drift (-30px/s) + fade (1.5s)
        └── EntityHealthBar[] → posição sync + proporção HP
```

**Arquitetura:**
- `HUD` — container PixiJS com Graphics para barras e Text para labels
- `DamageNumber` — Text com drift/fade lifecycle, auto-remove via isDead()
- `EntityHealthBar` — Graphics 30×4px sobre entidades (Y_OFFSET = -8)
- `CombatFeedbackManager` — orquestrador com container próprio, cleanup automático
- Toda lógica é client-side (render-only), consistente com server-authoritative

### 7.3 Stamina (Server-side)

```
GameEngine.tick()
  ├── MovementSystem.update()
  │     └── player.consumeStamina(STAMINA_COST_PER_TILE) — 1 por tile
  │
  └── Se player parado: player.regenStamina(STAMINA_REGEN_PER_TICK) — 1 por tick

Player entity
  ├── stamina: number (inicial: BASE_STAMINA = 100)
  ├── maxStamina: number (inicial: 100)
  ├── consumeStamina(amount) → clamp [0, max]
  └── regenStamina(amount) → clamp [0, max]
```

**Nota:** Stamina é atualizada no servidor mas o packet `ENTITY_UPDATE` (que levaria os dados ao cliente) **não é enviado** — bug crítico #62.

---

## 8. Escalabilidade (visão futura)

```
                     ┌──────────┐
                     │  Redis   │
                     │  (cache) │
                     └────┬─────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │  Game   │      │  Game   │      │  Game   │
   │Server 1 │◄────►│Server 2 │◄────►│Server N │
   │         │      │         │      │         │
   └────┬────┘      └────┬────┘      └────┬────┘
        │                 │                 │
   ┌────▼─────────────────▼─────────────────▼────┐
   │              PostgreSQL (Primary)            │
   │         + Read Replicas (futuro)             │
   └──────────────────────────────────────────────┘
```

Por enquanto, arquitetura monólito. A separação em micro-serviços será considerada quando houver necessidade real.
