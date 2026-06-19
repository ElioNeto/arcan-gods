# Plano de Testes: Monster AI FSM

**Feature ID:** P0.1
**Issue:** #51
**Dependências:** P0.1 Pathfinding A\*, Tilemap/Grid de Colisão
**Estimativa Total:** 30 testes + 4 integração + 2 E2E

---

## 1. Escopo

### O que será testado
- Máquina de estados finitos (FSM) do monstro: IDLE, AGGRO, CHASE, ATTACK, RETURN
- Transições entre estados conforme regras (range, leash, timer)
- Auto-attack do monstro a cada 2s no estado ATTACK
- Aggro quando player entra no `aggroRange`
- Chase usando A\* pathfinding
- Return ao spawn quando target sai do leash range (aggroRange × 2)
- Patrol curta (2-3 tiles ao redor do spawn) no estado IDLE
- Respeito a obstáculos durante chase (pathfinding desvia)
- Monstro morto não executa AI (permanece inativo até respawn)
- Múltiplos monstros com AI independente
- Performance com muitos monstros ativos

### O que NÃO será testado
- Spawn/respawn de monstros (já testado em `monster.test.ts`)
- Cálculo de dano (testado em CombatSystem e damage-formulas)
- Broadcast de estado para clientes (será em P0.3)
- Skills de monstro (não implementado ainda)
- Pathfinding A\* em si (testado no plano #01)

---

## 2. Testes Unitários

### 2.1 MonsterAI FSM — Estados e Transições

- [ ] **TC-001: Monstro começa em IDLE**
  - Input: `Monster` criado com `MonsterAI` acoplado
  - Expected: `ai.currentState === 'idle'`, `ai.targetId === null`

- [ ] **TC-002: IDLE → AGGRO quando player entra no aggroRange**
  - Input: Monstro em (10,10), `aggroRange=4`, player em (13,10) (dist=3)
  - Steps: Executar `ai.update()`
  - Expected: `ai.currentState === 'aggro'`, `ai.targetId === player.id`

- [ ] **TC-003: IDLE permanece IDLE se player está fora do aggroRange**
  - Input: Monstro em (10,10), `aggroRange=4`, player em (20,20) (dist=20)
  - Steps: Executar `ai.update()`
  - Expected: `ai.currentState === 'idle'`, nenhum target

- [ ] **TC-004: AGGRO → CHASE após aggro confirmado**
  - Input: Monstro em IDLE, player entra no range
  - Steps:
    1. `ai.update()` → AGGRO
    2. `ai.update()` (próximo tick)
  - Expected: Transição para CHASE, path calculado até player

- [ ] **TC-005: CHASE → ATTACK quando monstro chega no attackRange**
  - Input: Monstro chaseando player, distância ≤ `attackRange=1`
  - Steps: Executar `ai.update()`
  - Expected: `ai.currentState === 'attack'`

- [ ] **TC-006: ATTACK executa auto-attack a cada 2s**
  - Input: Monstro em ATTACK, `lastAttackTime = 0`
  - Steps:
    1. `ai.update()` (tempo atual)
    2. Avançar 2000ms
    3. `ai.update()`
  - Expected: `combatSystem.processAttack()` chamado 1× (no step 3)

- [ ] **TC-007: ATTACK não ataca antes do cooldown de 2s**
  - Input: Monstro em ATTACK, ataque executado há 500ms
  - Steps: `ai.update()`
  - Expected: `combatSystem.processAttack()` NÃO chamado

- [ ] **TC-008: ATTACK → CHASE se player sai do attackRange**
  - Input: Monstro em ATTACK, player move para longe (dist > attackRange)
  - Steps: `ai.update()`
  - Expected: `ai.currentState === 'chase'`

- [ ] **TC-009: CHASE → RETURN quando player sai do leash range (aggroRange × 2)**
  - Input: Monstro em (10,10), `aggroRange=4` (leash=8), player em (19,10) (dist=9 > leash)
  - Steps: `ai.update()`
  - Expected: `ai.currentState === 'return'`, `targetId = null`

- [ ] **TC-010: RETURN move monstro de volta ao spawn**
  - Input: Monstro em (15,20), spawn em (10,10)
  - Steps:
    1. `ai.update()` → RETURN
    2. Avançar N ticks até chegar
  - Expected: Monstro chega em (10,10), `ai.currentState === 'idle'`

- [ ] **TC-011: RETURN → IDLE quando monstro chega ao spawn**
  - Input: Monstro em RETURN, posição = spawn
  - Steps: `ai.update()`
  - Expected: `ai.currentState === 'idle'`, path limpo

- [ ] **TC-012: RETURN interrompe chase (player sai do leash durante chase)**
  - Input: Monstro chaseando, player ultrapassa leash range
  - Steps: `ai.update()`
  - Expected: `ai.currentState === 'return'`, path recalculado para spawn

### 2.2 Patrol (IDLE)

- [ ] **TC-013: IDLE patrol move monstro 2-3 tiles do spawn**
  - Input: Monstro em (10,10), `patrolRange=3`
  - Steps: Executar 10 ticks de IDLE
  - Expected: Monstro moveu-se dentro do range [7-13, 7-13] do spawn

- [ ] **TC-014: IDLE patrol não sai do range de patrol**
  - Input: Monstro em (10,10), `patrolRange=3`
  - Steps: Executar 100 ticks de IDLE
  - Expected: Monstro nunca ultrapassa distância 3 do spawn

- [ ] **TC-015: IDLE patrol para se player entra no aggroRange (prioridade)**
  - Input: Monstro patrulhando, player entra no aggroRange
  - Steps: `ai.update()`
  - Expected: Transição para AGGRO, patrol interrompido

### 2.3 Pathfinding durante Chase

- [ ] **TC-016: CHASE calcula path A\* até posição do player**
  - Input: Monstro em (10,10), player em (15,10), grid sem obstáculos
  - Steps: `ai.update()` no estado CHASE
  - Expected: `ai.currentPath` contém caminho de (10,10) até perto de (15,10)

- [ ] **TC-017: CHASE recalcula path se player moveu**
  - Input: Monstro chaseando, player move de (15,10) para (20,10)
  - Steps: `ai.update()` (recalcular)
  - Expected: Path atualizado para nova posição do player

- [ ] **TC-018: CHASE recalcula path em intervalo (não a cada tick)**
  - Input: Monstro chaseando, path recalc a cada 500ms
  - Steps:
    1. Player move a cada 100ms
    2. Executar 10 ticks
  - Expected: Path recalculado apenas 2× (a cada 500ms), não 10×

- [ ] **TC-019: CHASE desvia de obstáculos**
  - Input: Grid com parede entre monstro e player
  - Steps: `ai.update()` → CHASE
  - Expected: Path contorna obstáculo, monstro chega ao player

- [ ] **TC-020: CHASE com path impossível (player inacessível)**
  - Input: Grid completamente isolado, player inacessível
  - Steps: `ai.update()` → CHASE
  - Expected: `ai.currentPath = []`, estado transita para RETURN ou permanece CHASE (conforme design)

### 2.4 Alvo e Múltiplos Players

- [ ] **TC-021: Monstro seleciona player mais próximo como alvo de aggro**
  - Input: 2 players no aggroRange: P1 a dist 3, P2 a dist 5
  - Steps: `ai.update()`
  - Expected: `ai.targetId === P1.id` (mais próximo)

- [ ] **TC-022: Monstro troca de alvo se target morre**
  - Input: Monstro chaseando P1, P1 morre
  - Steps: `ai.update()`
  - Expected: `ai.targetId = null` → transição para IDLE (ou novo target se outro player no range)

- [ ] **TC-023: Monstro troca de alvo se outro player fica mais próximo**
  - Input: Monstro chaseando P1 (dist 5), P2 entra no range a dist 2
  - Steps: `ai.update()`
  - Expected: `ai.targetId === P2.id`

- [ ] **TC-024: Monstro ignora players mortos**
  - Input: Player morto no aggroRange
  - Steps: `ai.update()`
  - Expected: `ai.targetId` não é o player morto (a menos que seja o único)

### 2.5 Monstro Morto

- [ ] **TC-025: Monstro morto não executa AI**
  - Input: `monster.alive = false`
  - Steps: `ai.update()`
  - Expected: Nenhuma transição de estado, nenhum path calculado

- [ ] **TC-026: Monstro reseta estado ao respawnar**
  - Input: Monstro morto com estado anterior CHASE
  - Steps: `monster.respawn()` + `ai.update()`
  - Expected: `ai.currentState === 'idle'`, target limpo

### 2.6 Interface e Configuração

- [ ] **TC-027: MonsterAI aceita configuração de cooldown de ataque**
  - Input: `aiConfig.attackCooldown = 3000`
  - Steps: Monstro ataca, espera 2s, tenta atacar
  - Expected: Ataque ainda em cooldown (precisa 3s)

- [ ] **TC-028: MonsterAI aceita configuração de recalc interval**
  - Input: `aiConfig.pathRecalcInterval = 1000`
  - Steps: Player move, verificar quantas vezes path recalculou
  - Expected: Path recalculado no máximo 1× por segundo

- [ ] **TC-029: `ai.getState()` retorna estado atual legível**
  - Input: Monstro em IDLE
  - Expected: `ai.getState() === 'idle'`

- [ ] **TC-030: `ai.getTarget()` retorna targetId ou null**
  - Input: Monstro sem target vs com target
  - Expected: `null` vs `'player-123'`

---

## 3. Testes de Integração

### 3.1 MonsterAI + World + GameEngine

- [ ] **TC-031: GameEngine tick executa AI de todos os monstros**
  - Setup: World com 3 monstros, GameEngine rodando
  - Steps:
    1. Adicionar player no aggroRange de 1 monstro
    2. Executar 1 tick do engine
  - Expected: Monstro no range transiciona para AGGRO, outros permanecem IDLE

- [ ] **TC-032: Múltiplos monstros com AI independente no mesmo tick**
  - Setup: 5 monstros em posições diferentes, 2 players
  - Steps:
    1. Tick do engine
  - Expected: Cada monstro executa sua FSM independentemente, sem interferência

- [ ] **TC-033: MonsterAI + CombatSystem: monstro ataca player no estado ATTACK**
  - Setup: CombatSystem registrada no GameEngine
  - Steps:
    1. Monstro em ATTACK com player no attackRange
    2. Cooldown de 2s expirou
    3. Tick do engine
  - Expected: `CombatSystem.processAttack()` invocado para ataque do monstro

- [ ] **TC-034: Monstro chaseando recalcula path quando grid muda (ex: porta fecha)**
  - Setup: Grid inicialmente aberto, monstro chaseando
  - Steps:
    1. Tile no meio do path fica bloqueado
    2. Tick do engine
  - Expected: Path recalculado, monstro desvia

### 3.2 MonsterAI + Pathfinding

- [ ] **TC-035: MonsterAI usa PathCache do MovementSystem (se disponível)**
  - Setup: PathCache populado, monstro chaseando
  - Steps: `ai.update()`
  - Expected: Path obtido do cache (não recalculado do zero)

---

## 4. Casos de Erro e Borda

- [ ] **TC-036: aggroRange = 0 (monstro nunca aggra)**
  - Input: `aggroRange = 0`
  - Steps: Player na mesma tile que o monstro
  - Expected: Monstro permanece IDLE

- [ ] **TC-037: attackRange > aggroRange (config inválida)**
  - Input: `attackRange = 5`, `aggroRange = 3`
  - Steps: Player no attackRange (dist 4)
  - Expected: Monstro aggra quando player entra no aggroRange (dist 3), ataca quando dist ≤ 5
  - Nota: Validar que o comportamento não quebra com ranges invertidos

- [ ] **TC-038: Leash range = 0 (monstro nunca retorna)**
  - Input: `aggroRange = 4`, leash = 0
  - Steps: Player sai para dist 100
  - Expected: Monstro chaseia infinitamente ou comportamento definido (conforme design)

- [ ] **TC-039: Muitos monstros (>100) no mesmo mapa**
  - Input: 100 monstros em IDLE, 10 players
  - Steps: Tick do engine
  - Expected: AI executada para todos em < 50ms (performance)

- [ ] **TC-040: Player desconecta durante chase**
  - Input: Monstro chaseando player, player desconecta
  - Steps: `ai.update()`
  - Expected: `targetId = null`, monstro transita para IDLE (ou RETURN se longe do spawn)

- [ ] **TC-041: Dois monstros chaseiam mesmo player**
  - Input: 2 monstros, 1 player no range de ambos
  - Steps: Tick do engine
  - Expected: Ambos chaseiam independentemente, sem conflito de path

- [ ] **TC-042: Monstro chaseia player que está em tile non-walkable (ex: água)**
  - Input: Player entra em tile bloqueado durante chase
  - Steps: `ai.update()`
  - Expected: Path recalculado para tile mais próximo walkable do player, ou transição para RETURN (conforme design)

- [ ] **TC-043: Monstro spawna em tile non-walkable**
  - Input: `spawnX, spawnY` em tile bloqueado
  - Steps: Criar monstro
  - Expected: Log de erro, monstro permanece ou move para tile walkable mais próximo

---

## 5. E2E Tests

- [ ] **TC-044: Fluxo completo: Player entra no range → monstro aggra → chase → ataca → player morre ou foge**
  - Setup: Servidor rodando com tilemap, player conectado, monstro spawnado
  - Steps:
    1. Player move para dentro do aggroRange do monstro
    2. Monstro transiciona: IDLE → AGGRO → CHASE
    3. Monstro pathfind até o player
    4. Monstro ataca a cada 2s
    5. Player recebe ENTITY_DAMAGED
    6. Player foge → monstro chaseia
    7. Player sai do leash → monstro retorna ao spawn
  - Expected: FSM completa executada corretamente, packets enviados

- [ ] **TC-045: Monstro retorna ao spawn após player sair do leash**
  - Setup: Servidor rodando, monstro em (50,50) com aggroRange=4
  - Steps:
    1. Player em (51,50) → monstro aggra
    2. Player move para (70,50) (fora do leash de 8)
    3. Monstro transita para RETURN
    4. Monstro anda de volta para (50,50)
    5. Monstro em IDLE novamente
  - Expected: Monstro retorna ao spawn exato

---

## 6. Regressão

- Testes de Monster (`monster.test.ts`) — AI usa propriedades do Monster
- Testes de Pathfinding A\* (plano #01) — CHASE depende de pathfinding
- Testes de Grid de Colisão (plano #02) — pathfinding usa grid
- Testes de GameEngine (`game-engine.test.ts`) — tick executará AI
- Testes de CombatSystem (`combat-system.test.ts`) — ATTACK invoca combat
- Testes de MovementSystem (`movement-system.test.ts`) — chase usa movimento incremental
- Testes de World (`world.test.ts`) — World gerencia monstros/players

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit (FSM) | 30 | 16h |
| Integration | 5 | 6h |
| Casos de Borda | 8 | 5h |
| E2E | 2 | 5h |
| **Total** | **45** | **32h** |
