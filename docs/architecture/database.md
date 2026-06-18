# Banco de Dados

## Stack

- **PostgreSQL 16** — Dados persistentes
- **Redis 7** — Cache de sessão, filas, leaderboard

## PostgreSQL: Schema

```sql
-- Accounts
CREATE TABLE accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Characters
CREATE TABLE characters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name        VARCHAR(20) UNIQUE NOT NULL,
    class       VARCHAR(20) NOT NULL CHECK (class IN ('dark_knight','dark_wizard','elf','summoner','magic_gladiator')),
    level       INT DEFAULT 1,
    experience  BIGINT DEFAULT 0,
    strength    INT DEFAULT 18,
    agility     INT DEFAULT 18,
    energy      INT DEFAULT 18,
    vitality    INT DEFAULT 18,
    hp          INT DEFAULT 100,
    max_hp      INT DEFAULT 100,
    mp          INT DEFAULT 50,
    max_mp      INT DEFAULT 50,
    map_id      VARCHAR(50) DEFAULT 'lorencia',
    pos_x       FLOAT DEFAULT 100,
    pos_y       FLOAT DEFAULT 100,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Items (templates estáticos)
CREATE TABLE item_templates (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(20) NOT NULL, -- weapon, armor, helm, boots, gloves, shield, wings, jewelry
    class_req   VARCHAR(20)[],       -- [] = any class
    level_req   INT DEFAULT 0,
    strength_req INT DEFAULT 0,
    agility_req  INT DEFAULT 0,
    energy_req   INT DEFAULT 0,
    vitality_req INT DEFAULT 0,
    tier        VARCHAR(20) DEFAULT 'normal', -- normal, magic, rare, unique, legend
    min_damage  INT DEFAULT 0,
    max_damage  INT DEFAULT 0,
    defense     INT DEFAULT 0,
    magic_defense INT DEFAULT 0,
    speed       INT DEFAULT 0,
    hp_bonus    INT DEFAULT 0,
    mp_bonus    INT DEFAULT 0,
    str_bonus   INT DEFAULT 0,
    agi_bonus   INT DEFAULT 0,
    ene_bonus   INT DEFAULT 0,
    vit_bonus   INT DEFAULT 0,
    sell_price  INT DEFAULT 0,
    max_upgrade INT DEFAULT 15
);

-- Items (instâncias)
CREATE TABLE items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     VARCHAR(50) NOT NULL REFERENCES item_templates(id),
    owner_id        UUID REFERENCES characters(id) ON DELETE SET NULL,
    level           INT DEFAULT 0,      -- upgrade level (+0 a +15)
    luck            BOOLEAN DEFAULT FALSE,
    skill_enabled   BOOLEAN DEFAULT FALSE,
    options         JSONB DEFAULT '{}', -- stats adicionais
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory slots
CREATE TABLE inventory_slots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    slot_index  INT NOT NULL,         -- 0-39 (8x5 grid)
    item_id     UUID REFERENCES items(id) ON DELETE SET NULL,
    equip_slot  VARCHAR(20),          -- weapon, armor, helm, etc. (NULL = inventário)
    UNIQUE(character_id, slot_index)
);

-- Guilds
CREATE TABLE guilds (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(30) UNIQUE NOT NULL,
    tag         VARCHAR(6) UNIQUE NOT NULL,
    master_id   UUID NOT NULL REFERENCES characters(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guild_members (
    guild_id    UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    role        VARCHAR(20) DEFAULT 'member', -- master, assistant, member
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (guild_id, character_id)
);

-- Quests
CREATE TABLE quests (
    id          VARCHAR(50) PRIMARY KEY,
    title       VARCHAR(100) NOT NULL,
    description TEXT,
    type        VARCHAR(20) NOT NULL, -- kill, fetch, delivery
    objectives  JSONB NOT NULL,       -- [{type: "kill", monster_id: "xxx", count: 10}]
    rewards     JSONB NOT NULL        -- {xp: 5000, gold: 1000, items: ["xxx"]}
);

CREATE TABLE character_quests (
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quest_id    VARCHAR(50) NOT NULL REFERENCES quests(id),
    progress    JSONB DEFAULT '{}',    -- {monster_id: current_count}
    completed   BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (character_id, quest_id)
);
```

## Redis: Schema

```
session:{token} → { account_id, character_id, map_id }
cooldown:{char_id}:{skill_id} → timestamp
party:{party_id} → { leader_id, members: [...] }
guild:{guild_id} → { name, members: [...] }
ranking:level → SortedSet (character_id → level)
```
