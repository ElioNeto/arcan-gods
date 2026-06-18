# Plano de Testes: Shared Package (Issue #8)

## 1. Escopo

### O que será testado
- Tipos compartilhados (interfaces de Account, Character, Item, etc.)
- Constantes do jogo (MAX_LEVEL, TICK_RATE, class types, etc.)
- Enumerações como union types (CharacterClass, ItemCategory, etc.)
- Funções utilitárias (formulas, validadores)
- Schemas de validação (Zod) para dados compartilhados
- Exportações do pacote (index.ts barrel export)

### O que NÃO será testado
- Lógica de negócio server-side (combate, movimento)
- Implementação de sistemas do jogo

---

## 2. Unit Tests

### 2.1 Tipos e Interfaces

- [ ] TC-001: Interface `IAccount` possui campos `id`, `email`, `password_hash`, `created_at`
  - Input: Objeto tipo `IAccount`
  - Expected: TypeScript compila com todos os campos obrigatórios

- [ ] TC-002: Interface `ICharacter` possui todos os campos do modelo de dados
  - Input: Objeto tipo `ICharacter`
  - Expected: `id`, `account_id`, `name`, `class`, `level`, `experience`, `strength`, `agility`, `energy`, `vitality`, `hp`, `max_hp`, `mp`, `max_mp`, `map_id`, `pos_x`, `pos_y`, `created_at`, `updated_at`

- [ ] TC-003: Union type `CharacterClass` aceita apenas os 5 valores válidos
  - Input: `'dark_knight' | 'dark_wizard' | 'elf' | 'summoner' | 'magic_gladiator'`
  - Expected: TypeScript não permite valor inválido como `'paladin'`

- [ ] TC-004: Interface `IItemTemplate` possui `id`, `name`, `category`, `tier`, stats
  - Input: Objeto tipo `IItemTemplate`
  - Expected: Todos os campos de stats opcionais e category tipado

- [ ] TC-005: Type `ItemCategory` é union de `'weapon' | 'armor' | 'helm' | 'boots' | 'gloves' | 'shield' | 'wings' | 'jewelry'`
  - Input: Valor do tipo `ItemCategory`
  - Expected: TypeScript rejeita `'potion'`

- [ ] TC-006: Interface `IInventorySlot` possui `slot_index`, `item_id`, `equip_slot`
  - Input: Objeto tipo `IInventorySlot`
  - Expected: `equip_slot` opcional (pode ser null para inventário)

### 2.2 Constantes

- [ ] TC-007: `MAX_LEVEL` é 400
  - Input: `MAX_LEVEL` do módulo de constantes
  - Expected: `=== 400`

- [ ] TC-008: `TICK_RATE` é 100 (ms)
  - Input: `TICK_RATE` do módulo de constantes
  - Expected: `=== 100`

- [ ] TC-009: `PLAYER_MAX_SLOTS` é 40 (8x5 grid)
  - Input: `PLAYER_MAX_SLOTS`
  - Expected: `=== 40`

- [ ] TC-010: `EQUIP_SLOTS` contém `weapon`, `armor`, `helm`, `boots`, `gloves`, `shield`, `wings`, `jewelry`
  - Input: `EQUIP_SLOTS` array
  - Expected: Array com 8 entradas, cada uma string não-vazia

- [ ] TC-011: `DEFAULT_STATS` é `{ strength: 18, agility: 18, energy: 18, vitality: 18 }`
  - Input: `DEFAULT_STATS`
  - Expected: Todos os valores === 18

- [ ] TC-012: `BASE_HP` e `BASE_MP` por classe existem
  - Input: `BASE_HP_BY_CLASS` e `BASE_MP_BY_CLASS`
  - Expected: Objetos com chaves para cada `CharacterClass`, valores numéricos > 0

- [ ] TC-013: `ITEM_TIERS` é array com `'normal' | 'magic' | 'rare' | 'unique' | 'legend'`
  - Input: `ITEM_TIERS`
  - Expected: Array de 5 strings, ordem da pior para melhor

### 2.3 Funções Utilitárias (Formulas/Validadores)

- [ ] TC-014: `calculateLevel(xp: number)` retorna level correto baseado em XP
  - Input: XP = 0
  - Expected: level = 1
  - Input: XP = 5000 (valor de threshold L1→L2)
  - Expected: level = 2

- [ ] TC-015: `calculateStatBonus(stat: number)` retorna bônus positivo
  - Input: stat = 100
  - Expected: Bônus calculado conforme fórmula de Mu Online (ex: str/4 para dano mínimo)

- [ ] TC-016: `validateEmail(email: string)` retorna boolean
  - Input: `'test@example.com'`
  - Expected: `true`
  - Input: `'invalid-email'`
  - Expected: `false`
  - Input: `''`
  - Expected: `false`

- [ ] TC-017: `validateCharacterName(name: string)` retorna boolean
  - Input: `'Hero123'`
  - Expected: `true`
  - Input: `'a'` (muito curto)
  - Expected: `false`
  - Input: `'name with spaces'`
  - Expected: `false` (se regra for sem espaços)
  - Input: `'A'.repeat(21)` (muito longo)
  - Expected: `false`

### 2.4 Schemas Zod

- [ ] TC-018: Schema `AccountSchema` valida email e senha
  - Input: `{ email: 'test@test.com', password: '123456' }`
  - Expected: `.parse()` succeed
  - Input: `{ email: 'invalid', password: '123' }`
  - Expected: `.safeParse().success === false`

- [ ] TC-019: Schema `CharacterSchema` valida name, class, stats
  - Input: `{ name: 'Hero', class: 'dark_knight', level: 1, experience: 0 }`
  - Expected: `.parse()` succeed
  - Input: `{ name: '', class: 'invalid' }`
  - Expected: `.safeParse().success === false`

- [ ] TC-020: Schema `MoveMessageSchema` valida direção/clique no mapa
  - Input: `{ type: 'MOVE', x: 100, y: 200 }`
  - Expected: `.parse()` succeed
  - Input: `{ type: 'MOVE', x: -1, y: 200 }`
  - Expected: `.safeParse().success === false` (posição negativa)

### 2.5 Barrel Exports

- [ ] TC-021: `index.ts` exporta todos os tipos, constantes e funções públicas
  - Input: Import `@arcan-gods/shared`
  - Expected: `IAccount`, `ICharacter`, `CharacterClass`, `MAX_LEVEL`, `calculateLevel`, `validateEmail` disponíveis

- [ ] TC-022: Nenhum símbolo interno (helper privado) é exportado
  - Input: Análise do barrel export
  - Expected: Apenas símbolos públicos documentados são exportados

---

## 3. Integration Tests

- [ ] TC-023: Server importa e usa tipos shared corretamente
  - Setup: Server compilado com dependência shared
  - Steps:
    1. Server chama `calculateLevel(100000)` com dados mock
  - Expected: Retorna level > 1, sem erros de tipo

- [ ] TC-024: Client importa e usa constantes shared corretamente
  - Setup: Client compilado com dependência shared
  - Steps:
    1. Client referencia `TICK_RATE` para sincronização
  - Expected: `TICK_RATE === 100`

---

## 4. Edge Cases

- [ ] TC-025: `calculateLevel(0)` retorna level 1 (mínimo)
  - Input: XP = 0
  - Expected: level = 1

- [ ] TC-026: `calculateLevel(Number.MAX_SAFE_INTEGER)` não lança exceção
  - Input: XP = 9_007_199_254_740_991
  - Expected: Retorna valor sem overflow, nivel máximo

- [ ] TC-027: Constantes são readonly (Object.freeze) e não podem ser modificadas em runtime
  - Input: `MAX_LEVEL = 500` (tentativa de reassign)
  - Expected: TypeScript erro em compilação (const) ou runtime no strict mode

- [ ] TC-028: Validador `validateEmail` retorna false para `null`/`undefined`
  - Input: `null`
  - Expected: `false`

---

## 5. E2E Tests

- [ ] TC-029: Shared types usados em mensagem WebSocket entre server e client
  - Setup: Server e client rodando com shared package
  - Steps:
    1. Client envia mensagem tipada com `MoveMessageSchema`
    2. Server recebe e valida com mesmo schema
  - Expected: Mensagem validada em ambos os lados, sem incompatibilidade de tipos

---

## 6. Regressão

- Testes de validação impactam auth e tilemap (que usam shared types)
- Testes de constantes impactam todos os sistemas

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 22 | 6h |
| Integration | 2 | 1h |
| Edge Cases | 4 | 2h |
| E2E | 1 | 1h |
| **Total** | **29** | **10h** |
```

---
