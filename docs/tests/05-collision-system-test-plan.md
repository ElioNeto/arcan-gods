# Plano de Testes: Sistema de Colisão

**Feature ID:** P0.5
**Issue:** #12
**Dependências:** P0.2 (Tilemap/Grid de Colisão)

---

## 1. Escopo

### O que será testado
- Colisão com tiles não-walkable (paredes, obstáculos do tilemap)
- Colisão com objetos estáticos (decorações, barreiras)
- Colisão com bordas do mapa (impedir saida)
- Player para ao colidir (não atravessa)
- Comportamento de "slide" ao colidir em ângulo (deslizar pela parede)
- Colisão entre entidades (player-player, player-monster) — *friction vs overlap*
- Detecção de colisão por tile (bounding box do tile) vs sub-tile (pixel)
- Callback/evento de colisão para sistemas de game (ex: trigger damage)

### O que NÃO será testado
- Pathfinding A* (P0.1)
- Interpolação visual (P0.4)
- Física avançada (impulso, gravidade)
- Projéteis ou skills (ciclo futuro)

---

## 2. Testes Unitários

### 2.1 CollisionService

- [ ] **TC-001: `canMoveTo(x, y, grid)` retorna true para tile walkable**
  - Input: `grid[5][5] === true`, `canMoveTo(5, 5, grid)`
  - Expected: `true`

- [ ] **TC-002: `canMoveTo(x, y, grid)` retorna false para tile non-walkable**
  - Input: `grid[5][5] === false`, `canMoveTo(5, 5, grid)`
  - Expected: `false`

- [ ] **TC-003: `canMoveTo(x, y, grid)` retorna false para out-of-bounds**
  - Input: Grid 100×100, `canMoveTo(-1, 0, grid)` e `canMoveTo(100, 50, grid)`
  - Expected: `false`

- [ ] **TC-004: `canMoveTo(x, y, grid)` com coordenadas fracionadas considera tile inteiro**
  - Input: `canMoveTo(5.4, 5.6, grid)` → testa tile (5, 5) (floor)
  - Expected: Baseado no walkable de (5,5)

### 2.2 Colisão com Objetos Estáticos

- [ ] **TC-005: `addStaticObject(rect)` registra bounding box de objeto estático**
  - Input: `{ x: 100, y: 100, width: 32, height: 64 }`
  - Expected: Objeto adicionado à lista de colliders estáticos

- [ ] **TC-006: `canMoveWithStaticObjects(bbox)` verifica colisão com objetos**
  - Input: Bbox do player sobrepondo objeto estático
  - Expected: `false` (colide)

- [ ] **TC-007: `canMoveWithStaticObjects(bbox)` retorna true sem sobreposição**
  - Input: Bbox do player distante de objetos
  - Expected: `true`

- [ ] **TC-008: Lista de objetos estáticos pode ser limpa (`clearStaticObjects()`)**
  - Input: 10 objetos registrados
  - Steps: `clearStaticObjects()`
  - Expected: Lista vazia

### 2.3 Colisão entre Entidades (Player-Player, Player-Monster)

- [ ] **TC-009: `checkEntityCollision(entityA, entityB)` detecta overlap**
  - Input: A em (100,100), B em (105,102) (ambos 32×32)
  - Expected: `true` (sobreposição)

- [ ] **TC-010: `checkEntityCollision()` retorna false para entidades distantes**
  - Input: A em (100,100), B em (200,200)
  - Expected: `false`

- [ ] **TC-011: Entidades podem ocupar mesmo tile? (conforme design: sim para PvP)**
  - Input: A e B no mesmo tile
  - Expected: `checkEntityCollision()` retorna true, mas movimento não é bloqueado (overlap permitido)

- [ ] **TC-012: Monstro colide com player (player não atravessa monstro)**
  - Input: Player tentando mover para tile ocupado por monstro vivo
  - Expected: `canMoveTo` retorna false para aquele tile (se ocupado)

### 2.4 Comportamento ao Colidir

- [ ] **TC-013: Player para ao colidir com tile não-walkable**
  - Input: Player move em direção a parede, detecta colisão
  - Expected: `player.x, player.y` não mudam, `moving` pode ficar true (recalcula path)

- [ ] **TC-014: Slide ao colidir (movimento horizontal permitido se vertical bloqueado)**
  - Input: Player move diagonal (dx=1, dy=1), tile dy está bloqueado mas dx livre
  - Expected: Player move apenas dx (desliza na parede)

- [ ] **TC-015: Slide ao colidir (movimento vertical permitido se horizontal bloqueado)**
  - Input: Player move diagonal (dx=1, dy=1), tile dx bloqueado, dy livre
  - Expected: Player move apenas dy

- [ ] **TC-016: Ambos eixos bloqueados → player não move**
  - Input: dx e dy ambos bloqueados
  - Expected: Player não move, `canMove` false

### 2.5 Collision Service + A*

- [ ] **TC-017: `isTileBlocked(x, y, grid, staticObjects, entities)` integra todas fontes**
  - Input: Tile walkable no grid mas ocupado por entidade
  - Expected: `true` (bloqueado)

- [ ] **TC-018: `isTileBlocked()` para tile livre**
  - Input: Tile walkable, sem entidades, sem objetos estáticos
  - Expected: `false` (livre)

- [ ] **TC-019: Entidade morta não ocupa tile**
  - Input: Monstro morto (não-alive) em tile
  - Expected: Tile considerado livre

### 2.6 Eventos de Colisão

- [ ] **TC-020: `onCollision(entity, collidedWith)` emite evento quando colisão ocorre**
  - Input: Player colide com monstro
  - Expected: Evento emitido com `{ entity, collidedWith, type: 'entity' }`

- [ ] **TC-021: `onCollision()` com tile wall emite evento `{ type: 'wall' }`**
  - Input: Player colide com parede
  - Expected: Evento emitido com tipo 'wall' e posição

---

## 3. Testes de Integração

### 3.1 CollisionService + Movement (Server)

- [ ] **TC-022: Movimento para tile bloqueado é impedido pelo sistema de colisão**
  - Setup: Servidor com CollisionService + MovementService
  - Steps:
    1. Player tenta mover para tile non-walkable
    2. MovementService consulta `canMoveTo`
  - Expected: Movimento rejeitado, path recalculado

- [ ] **TC-023: Player colide com outro player e para (ou desvia)**
  - Setup: 2 players no servidor
  - Steps:
    1. Player A move para tile de Player B
  - Expected: A para antes de ocupar mesmo tile (conforme regra de overlap)

- [ ] **TC-024: Player não sai dos bounds do mapa**
  - Setup: Player na borda do mapa (x=0)
  - Steps:
    1. Player tenta mover para x=-1
  - Expected: Tile out-of-bounds, movimento impedido

### 3.2 Collision + Tilemap

- [ ] **TC-025: Grid de colisão do tilemap é usado corretamente pelo sistema**
  - Setup: Tilemap com paredes definidas
  - Steps:
    1. Carregar tilemap
    2. Tentar mover player através de parede
  - Expected: Colisão detectada, movimento bloqueado

- [ ] **TC-026: Objetos estáticos do tilemap (object layer) são registrados como colliders**
  - Setup: Tilemap com object layer contendo retângulos de colisão
  - Steps:
    1. `loadMap('lorencia')`
    2. Objetos da layer 'collision' são registrados
  - Expected: Colisão com esses objetos funciona

---

## 4. Casos de Borda

- [ ] **TC-027: Colisão com entidade muito grande (bounding box maior que tile)**
  - Input: Entidade 2×2 tiles tentando mover em corredor de 1 tile
  - Expected: Colisão detectada, entidade não passa

- [ ] **TC-028: Múltiplas colisões no mesmo tick**
  - Input: Player tenta mover e colide com parede E entidade ao mesmo tempo
  - Expected: Ambas colisões detectadas, prioridade definida

- [ ] **TC-029: Colisão no canto (2 tiles bloqueados adjacentes)**
  - Input: Player tentando entrar em canto de 2 tiles bloqueados
  - Expected: Player não move (ambos eixos bloqueados)

- [ ] **TC-030: Tile walkable no grid mas objeto estático ocupando**
  - Input: Grid diz walkable, mas objeto estático está lá
  - Expected: `canMoveTo` retorna false (objeto prevalece)

- [ ] **TC-031: Entidade colide com borda do mapa + obstáculo simultaneamente**
  - Input: Player no canto do mapa tentando sair
  - Expected: Múltiplas fontes de colisão, player permanece

- [ ] **TC-032: Player colide tile que se torna walkable durante colisão (porta abrindo)**
  - Input: Tile previamente bloqueado agora walkable
  - Expected: Path recalculado, player pode prosseguir

---

## 5. E2E Tests

- [ ] **TC-033: Jogador tenta andar através de parede e é impedido**
  - Setup: Servidor + Cliente, tilemap com parede
  - Steps:
    1. Cliente clica do outro lado da parede
    2. A* calcula path contornando
    3. Se não há contorno, jogador não se move (ou anda até a parede e para)
  - Expected: Jogador não atravessa parede

- [ ] **TC-034: Jogador não sai dos limites do mapa**
  - Setup: Servidor + Cliente
  - Steps:
    1. Cliente clica em posição fora dos bounds do mapa
    2. Servidor valida e impede
  - Expected: Jogador fica na última posição válida

- [ ] **TC-035: Dois jogadores tentam ocupar mesmo tile**
  - Setup: 2 clientes, servidor
  - Steps:
    1. Ambos movem para mesmo tile
    2. Servidor resolve colisão
  - Expected: Ambos param antes ou um ocupa (conforme regra definida)

---

## 6. Regressão

- Testes de A* (plano #01) — Colisão afeta walkable grid
- Testes de Movimento (plano #03) — MovementService chama CollisionService
- Testes de Tilemap (plano #02) — Grid de colisão é input principal
- Testes de Player — posição é modificada por colisão

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 21 | 10h |
| Integration | 5 | 5h |
| Casos de Borda | 6 | 3h |
| E2E | 3 | 5h |
| **Total** | **35** | **23h** |
