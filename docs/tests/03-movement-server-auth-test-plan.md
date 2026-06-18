# Plano de Testes: Movimento Server-Authoritative com A\*

**Feature ID:** P0.3
**Issue:** #10
**Dependências:** P0.1 (A\*), P0.2 (Tilemap/Grid de Colisão)

---

## 1. Escopo

### O que será testado
- Cliente envia `PLAYER_MOVE { x, y }` (destino), servidor calcula path via A*
- Validação de destino: walkable, dentro dos bounds
- Movimento incremental por tick (1 tile por tick, 10 Hz)
- Encadeamento de múltiplos destinos (waypoints)
- Anti-speedhack: validação de distância máxima entre pacotes
- Correção de posição (position rubber-banding) quando detectado cheat
- Atualização de direção do jogador baseada no movimento
- Parada suave ao chegar no destino

### O que NÃO será testado
- Interpolação visual no cliente (será P0.4)
- Broadcast para outros jogadores (será P0.6)
- Colisão com outros jogadores (será P0.5)
- Portais/transição de mapas (será P1.2)

---

## 2. Testes Unitários

### 2.1 MovementService (Servidor)

- [ ] **TC-001: `processMove(player, destination, grid)` calcula path via A\***
  - Input: `player` em `(10,10)`, `destination = (15,10)`, grid sem obstáculos
  - Expected: Path `[(11,10), (12,10), (13,10), (14,10), (15,10)]`

- [ ] **TC-002: `processMove()` com destino walkable válido**
  - Input: Destino em tile com `grid[y][x] === true`
  - Expected: Path calculado, `player.moving = true`

- [ ] **TC-003: `processMove()` com destino non-walkable retorna erro**
  - Input: Destino em tile com `grid[y][x] === false`
  - Expected: Erro `DESTINATION_NOT_WALKABLE`, player não se move

- [ ] **TC-004: `processMove()` com destino out-of-bounds retorna erro**
  - Input: Destino `(-1, 5)` ou `(999, 999)` em grid 256×256
  - Expected: Erro `OUT_OF_BOUNDS`

- [ ] **TC-005: `processMove()` com destino = posição atual não faz nada**
  - Input: `player.x = 10, player.y = 10`, destino `(10, 10)`
  - Expected: Path vazio, `player.moving = false`, sem erro

- [ ] **TC-006: `processMove()` enquanto já está se movendo encadeia destino**
  - Input: Player movendo para (15,10), novo destino (20,10)
  - Expected: Path atual substituído ou encadeado (conforme design)

### 2.2 Movimento por Tick

- [ ] **TC-007: `tickMovement(player, grid)` move 1 tile por tick**
  - Input: Player com path de 5 tiles, `tickMovement` chamado 1×
  - Expected: `player.x, player.y` avançam 1 tile no path

- [ ] **TC-008: Player chega ao destino após N ticks (N = path length)**
  - Input: Path de 5 tiles
  - Steps: `tickMovement` chamado 5×
  - Expected: `player.x,player.y === destino`, `player.moving = false`

- [ ] **TC-009: `tickMovement()` não move se player não está moving**
  - Input: `player.moving = false`
  - Expected: Posição inalterada

- [ ] **TC-010: Direção do player é atualizada a cada tick**
  - Input: Player move de (10,10) para (11,10) (direita)
  - Expected: `player.direction === 'right'`
  - Input: Player move de (10,10) para (10,11) (baixo)
  - Expected: `player.direction === 'down'`

- [ ] **TC-011: Tick não move se player está em tile non-walkable (ex: após correção)**
  - Input: Player em tile que se tornou bloqueado
  - Expected: Movimento pausado, erro logado, path recalculado

### 2.3 Anti-Speedhack

- [ ] **TC-012: Rejeita movimento com distância > MAX_MOVE_DISTANCE tiles**
  - Input: Player em (10,10), destino (100,10) (distância 90 > 5)
  - Expected: Erro `MOVE_TOO_FAR`, player não move, pacote de correção enviado

- [ ] **TC-013: Aceita movimento dentro do limite de distância**
  - Input: Player em (10,10), destino (14,10) (distância 4 ≤ 5)
  - Expected: Path calculado, movimento aceito

- [ ] **TC-014: Rejeita movimento se player já está em movimento e novo destino é muito longe**
  - Input: Player no meio de path longo, novo destino (999,999)
  - Expected: Erro `MOVE_TOO_FAR`

- [ ] **TC-015: Pacote de correção (rubber-band) envia posição atual correta**
  - Input: Speedhack detectado
  - Expected: Servidor envia `PLAYER_MOVED` com `x,y` atuais do servidor

- [ ] **TC-016: Timestamp anti-speedhack: diferença entre packets < mínimo humano**
  - Input: 2 packets de movimento com intervalo < 50ms (simulando bot)
  - Expected: Segundo packet rejeitado ou ignorado

### 2.4 Path Queue / Waypoints

- [ ] **TC-017: Múltiplos destinos encadeados (waypoints)**
  - Input: Destino A (15,10), antes de chegar, destino B (20,10)
  - Expected: Path completo A + B calculado ou encadeado

- [ ] **TC-018: Waypoint intermediário bloqueado faz path ser recalculado**
  - Input: Path [A, B, C], tile B fica bloqueado após inicio
  - Expected: Path recalculado de A para C

- [ ] **TC-019: Player pode cancelar movimento (parar antes do destino)**
  - Input: Player movendo, envia `PLAYER_MOVE` com destino = posição atual
  - Expected: `player.moving = false`, path limpo

### 2.5 Integração com Player Entity

- [ ] **TC-020: Player.toJSON() reflete posição atualizada após movimento**
  - Input: Player moveu 3 tiles
  - Expected: `player.toJSON().x, .y` = posição mais recente

- [ ] **TC-021: Player.takeDamage() durante movimento não interrompe path**
  - Input: Player tomando dano enquanto se move
  - Expected: Movimento continua normalmente (a menos que HP ≤ 0)

- [ ] **TC-022: Player morre durante movimento → path limpo**
  - Input: HP chega a 0 durante movimento
  - Expected: `player.moving = false`, path descartado

---

## 3. Testes de Integração

### 3.1 MovementService + A\* + TilemapLoader

- [ ] **TC-023: Movimento usa grid de colisão do tilemap atual**
  - Setup: Servidor com tilemap `lorencia` carregado
  - Steps:
    1. Player em posição inicial
    2. Envia destino em área com obstáculos
  - Expected: Path desvia de tiles não-walkable

- [ ] **TC-024: Player não atravessa paredes no tilemap**
  - Setup: Tilemap com parede entre player e destino
  - Steps:
    1. Player tenta mover para tile atrás da parede
  - Expected: Path contorna parede, ou se impossível, retorna erro

### 3.2 MovementService + GameEngine

- [ ] **TC-025: GameEngine.tick() executa tickMovement para todos players moving**
  - Setup: GameEngine rodando a 10Hz, 2 players movendo
  - Steps:
    1. `engine.tick()` chamado
  - Expected: Ambos players avançam 1 tile

- [ ] **TC-026: Player com path concluído no tick tem evento emitido**
  - Setup: Player prestes a chegar
  - Steps:
    1. Tick final do path
  - Expected: Evento `PLAYER_ARRIVED` ou flag `moving = false`

### 3.3 MovementService + WebSocket

- [ ] **TC-027: Handler PLAYER_MOVE processa, calcula e responde**
  - Setup: Cliente conectado e autenticado
  - Steps:
    1. Cliente envia `{ type: 'PLAYER_MOVE', x: 105, y: 100 }`
  - Expected: Servidor responde com `PLAYER_MOVED` (posição após 1º tick ou confirmação)

- [ ] **TC-028: PLAYER_MOVE sem autenticação retorna NOT_AUTH**
  - Setup: Cliente conectado mas não autenticado
  - Steps:
    1. Envia `PLAYER_MOVE`
  - Expected: Erro `NOT_AUTH`

---

## 4. Casos de Borda e Erro

- [ ] **TC-029: Coordenadas NaN no PLAYER_MOVE**
  - Input: `{ type: 'PLAYER_MOVE', x: NaN, y: 100 }`
  - Expected: Erro `MOVE_INVALID` (validação Zod)

- [ ] **TC-030: Coordenadas negativas dentro do limite (ex: -0.5 arredondado)**
  - Input: `x = -0.5` tratado como 0 ou rejeitado
  - Expected: Conforme validação, ou truncado ou erro

- [ ] **TC-031: Path muito longo (> 100 tiles)**
  - Input: Destino a 200 tiles de distância
  - Expected: Path truncado ou executado em etapas

- [ ] **TC-032: Jogador envia PLAYER_MOVE 100× por segundo (flood)**
  - Input: Cliente dispara 100 packets de movimento em 1s
  - Expected: Rate limiting rejeita excesso, movimento processado de forma segura

- [ ] **TC-033: Grid muda enquanto player está se movendo (tile fica bloqueado)**
  - Input: Tile no meio do path muda de walkable para non-walkable
  - Expected: Path recalculado, player desvia

- [ ] **TC-034: Destino em tile com entidade estática (objeto/parede)**
  - Input: Destino igual a posição de objeto estático (cadeira, árvore)
  - Expected: Considerado non-walkable, erro

- [ ] **TC-035: Múltiplos players movendo para mesmo tile no mesmo tick**
  - Input: 2 players com destino para (50,50) exatamente
  - Expected: Ambos chegam ou apenas o primeiro (conforme design de grid)

---

## 5. E2E Tests

- [ ] **TC-036: Fluxo completo: clique no mapa → movimento → chegada**
  - Setup: Cliente conectado, servidor com A\* e tilemap
  - Steps:
    1. Cliente clica em tile distante (ex: x=120, y=100)
    2. InputManager traduz clique em PLAYER_MOVE
    3. Servidor calcula path
    4. Servidor move player tick a tick
    5. Servidor envia PLAYER_MOVED a cada tick
    6. Player chega ao destino
  - Expected: Player move-se suavemente e para no destino

- [ ] **TC-037: Speedhack detectado → correção aplicada**
  - Setup: Cliente modificado tenta enviar destino distante
  - Steps:
    1. Cliente envia PLAYER_MOVE com destino muito longe
    2. Servidor rejeita
    3. Servidor envia PLAYER_MOVED com posição real
  - Expected: Cliente recebe correção, posição volta ao normal

---

## 6. Regressão

- Testes de A\* (plano #01) — MovementService depende de A\*
- Testes de Tilemap (plano #02) — Grid de colisão usado para validação
- Testes de Player (`player.test.ts`) — Movimento modifica posição
- Testes de World (`world.test.ts`) — Players movendo no mundo
- Testes de schemas (`schemas.test.ts`) — MoveSchema validado

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 22 | 12h |
| Integration | 6 | 6h |
| Casos de Borda | 7 | 4h |
| E2E | 2 | 4h |
| **Total** | **37** | **26h** |
