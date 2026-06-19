# Plano de Testes: Stamina do Player

**Feature ID:** P1.2
**Issue:** #57 (Bug/Feature: Adicionar Stamina ao Player)
**Dependências:** Nenhuma (independente)
**Estimativa Total:** 12 testes + 2 integração

---

## 1. Escopo

### O que será testado
- Propriedade `stamina` e `maxStamina` na entidade Player
- Regeneração de stamina: +1 por tick quando player está parado (não se movendo)
- Consumo de stamina: -1 por tile percorrido durante movimento
- Stamina não regenera durante movimento
- Stamina não regenera se já estiver no máximo
- Stamina mínima = 0 (não negativa)
- Stamina máxima = maxStamina (não ultrapassa)
- Valor base: `maxStamina = 100` (conforme RF-025)
- Integração com MovementSystem: consumir stamina ao mover
- Atualização de `toJSON()` para incluir stamina nos packets
- Interface `IStamina` ou extensão de `IPlayer` nos tipos compartilhados

### O que NÃO será testado
- Efeitos de stamina zerada (impedir corrida, dano por exaustão) — futuro
- HUD de stamina (será adicionado quando stamina for usada ativamente)
- Consumo de stamina por skills (#52) — futuro
- Potions ou itens de recuperação de stamina — futuro

---

## 2. Testes Unitários

### 2.1 Player — Propriedade Stamina

- [ ] **TC-001: Player é criado com stamina = maxStamina = 100**
  - Input: `new Player('Hero', 'dark_knight')`
  - Expected: `player.stamina === 100`, `player.maxStamina === 100`

- [ ] **TC-002: `player.maxStamina` é configurável via constantes**
  - Input: `GAME_CONSTANTS.BASE_STAMINA = 100`
  - Expected: `Player` usa valor da constante como padrão

- [ ] **TC-003: `player.stamina` não ultrapassa `maxStamina` ao regenerar**
  - Input: `player.stamina = 95`, `player.maxStamina = 100`
  - Steps: Regenerar 10 vezes (+10 stamina)
  - Expected: `player.stamina === 100` (não 105)

- [ ] **TC-004: `player.stamina` não fica negativa ao consumir**
  - Input: `player.stamina = 2`
  - Steps: Consumir 5 stamina (ex: mover 5 tiles)
  - Expected: `player.stamina === 0` (não -3)

### 2.2 Regeneração de Stamina

- [ ] **TC-005: `regenStamina(tickDelta)` regenera +1 quando player está parado**
  - Input: `player.stamina = 80`, `player.moving = false`
  - Steps: `player.regenStamina(1)` (1 tick)
  - Expected: `player.stamina === 81`

- [ ] **TC-006: `regenStamina()` não regenera se player está em movimento**
  - Input: `player.stamina = 80`, `player.moving = true`
  - Steps: `player.regenStamina(1)`
  - Expected: `player.stamina === 80` (inalterado)

- [ ] **TC-007: `regenStamina()` não regenera se stamina já está no máximo**
  - Input: `player.stamina = 100`, `player.moving = false`
  - Steps: `player.regenStamina(1)`
  - Expected: `player.stamina === 100`

- [ ] **TC-008: `regenStamina()` aceita múltiplos ticks de uma vez**
  - Input: `player.stamina = 80`, parado
  - Steps: `player.regenStamina(5)` (5 ticks)
  - Expected: `player.stamina === 85`

- [ ] **TC-009: Regeneração não ultrapassa maxStamina mesmo com múltiplos ticks**
  - Input: `player.stamina = 98`, parado
  - Steps: `player.regenStamina(5)`
  - Expected: `player.stamina === 100` (não 103)

### 2.3 Consumo de Stamina

- [ ] **TC-010: `consumeStamina(amount)` reduz stamina**
  - Input: `player.stamina = 80`
  - Steps: `player.consumeStamina(3)`
  - Expected: `player.stamina === 77`

- [ ] **TC-011: `consumeStamina()` com amount = 0 não altera stamina**
  - Input: `player.stamina = 50`
  - Steps: `player.consumeStamina(0)`
  - Expected: `player.stamina === 50`

- [ ] **TC-012: `consumeStamina()` não aceita valores negativos (que seria regen)**
  - Input: `player.consumeStamina(-5)`
  - Expected: `player.stamina` inalterado ou erro

- [ ] **TC-013: Consumo de 1 stamina por tile de movimento**
  - Input: Player move 5 tiles
  - Expected: `player.stamina === 100 - 5 = 95` (antes da regen do tick)

### 2.4 Serialização e Tipos

- [ ] **TC-014: `player.toJSON()` inclui `stamina` e `maxStamina`**
  - Input: Player com stamina = 75
  - Expected: `player.toJSON().stamina === 75`, `player.toJSON().maxStamina === 100`

- [ ] **TC-015: Interface `IPlayer` (shared) inclui `stamina` e `maxStamina`**
  - Input: Declaração de tipo em `shared/src/types/entities.ts`
  - Expected: `IPlayer` contém `stamina: number` e `maxStamina: number`

- [ ] **TC-016: Interface `IPlayer` em `ENTITY_UPDATE` inclui stamina**
  - Input: Packet `ENTITY_UPDATE` com player data
  - Expected: `entity.stamina` e `entity.maxStamina` presentes

---

## 3. Testes de Integração

### 3.1 Stamina + MovementSystem

- [ ] **TC-017: MovementSystem.startPlayerMove() consome stamina do player**
  - Setup: Player com stamina = 100, MovementSystem configurado
  - Steps:
    1. `movementSystem.startPlayerMove('player-1', 15, 10)` (5 tiles de distância)
    2. Verificar stamina do player
  - Expected: `player.stamina === 95` (consumiu 5)

- [ ] **TC-018: MovementSystem.update() não consome stamina adicional durante movimento**
  - Setup: Player iniciou movimento com 5 tiles, stamina = 95
  - Steps:
    1. Executar 3 ticks de movement update
    2. Verificar stamina
  - Expected: `player.stamina === 95` (stamina já consumida na partida, não por tick)

- [ ] **TC-019: Stamina não impede movimento (apenas monitora)**
  - Setup: Player com stamina = 0
  - Steps: `movementSystem.startPlayerMove('player-1', 10, 10)`
  - Expected: Movimento é permitido (stamina = 0 não bloqueia). Consumo vai para 0 e trava.

- [ ] **TC-020: GameEngine.tick() executa regenStamina para players parados**
  - Setup: GameEngine rodando, player parado com stamina = 80
  - Steps:
    1. 1 tick do engine
  - Expected: `player.stamina === 81`

- [ ] **TC-021: GameEngine.tick() NÃO executa regenStamina para players em movimento**
  - Setup: GameEngine rodando, player se movendo com stamina = 80
  - Steps:
    1. 1 tick do engine
  - Expected: `player.stamina === 80` (inalterado)

---

## 4. Casos de Borda

- [ ] **TC-022: Stamina com valores muito grandes (overflow)**
  - Input: `player.consumeStamina(999999)` (consumo extremo)
  - Expected: `player.stamina === 0` (floor at 0, sem números negativos)

- [ ] **TC-023: Stamina com valores NaN**
  - Input: `player.consumeStamina(NaN)`
  - Expected: Stamina inalterada, log de erro (sem crash)

- [ ] **TC-024: Regeneração durante tick com delta = 0 (pausa)**
  - Input: `player.regenStamina(0)`
  - Expected: Stamina inalterada

- [ ] **TC-025: Movimento de 0 tiles (player já no destino)**
  - Input: Player em (10,10), destino (10,10)
  - Expected: Nenhum stamina consumido

---

## 5. E2E Tests

- [ ] **TC-026: Player move pelo mapa → stamina diminui → para → stamina regenera**
  - Setup: Cliente conectado, servidor rodando com MovementSystem
  - Steps:
    1. Observar stamina inicial (100)
    2. Player move 10 tiles
    3. Verificar stamina no ENTITY_UPDATE (deve ser ~90)
    4. Player para
    5. Após 10 ticks, verificar stamina novamente
  - Expected: Stamina = 100 inicial, diminui durante movimento, regenera quando parado

---

## 6. Regressão

- Testes de Player (`player.test.ts`) — nova propriedade stamina
- Testes de MovementSystem (`movement-system.test.ts`) — consumo de stamina ao iniciar move
- Testes de GameEngine (`game-engine.test.ts`) — regen por tick
- Testes de shared schemas (`schemas.test.ts`) — novos campos stamina
- Testes de World (`world.test.ts`) — toJSON inclui stamina

---

## 7. Mocking Strategy

### O que mockar
- **Nada essencial**: Stamina é lógica pura (matemática), pode ser testada sem mocks
- **MovementSystem.mock()**: Para testar consumo sem pathfinding real

---

## 8. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit (propriedades) | 10 | 3h |
| Unit (regen/consumo) | 6 | 2h |
| Integration | 5 | 3h |
| Casos de Borda | 4 | 1h |
| E2E | 1 | 2h |
| **Total** | **26** | **11h** |
