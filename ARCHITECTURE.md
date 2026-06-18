# Arquitetura — Arcan Gods

> **Status:** Rascunho inicial · Versão 0.1

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

---

## 7. Escalabilidade (visão futura)

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
