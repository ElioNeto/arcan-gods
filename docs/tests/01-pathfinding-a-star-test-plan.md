# Plano de Testes: Pathfinding A\* (Servidor)

**Feature ID:** P0.1
**Issue:** #9
**Dependências:** Nenhuma (pode ser testado isoladamente)

---

## 1. Escopo

### O que será testado
- Algoritmo A\* em grid bidimensional (tile-based)
- Heurística Manhattan
- Cache de caminhos computados
- Grid walkable/non-walkable como input
- Otimizações: early exit, path smoothing, max steps limit
- Interface pública `findPath(start, end, grid)`

### O que NÃO será testado
- Tilemap loader (será testado em P0.2)
- Movimento de entidades (será em P0.3)
- Colisão com objetos (será em P0.5)

---

## 2. Testes Unitários

### 2.1 AStarFinder — Casos Básicos

- [ ] **TC-001: Caminho livre em linha reta horizontal**
  - Input: `start = (0, 0)`, `end = (5, 0)`, grid 10×10 sem obstáculos
  - Expected: Caminho `[(0,0), (1,0), (2,0), (3,0), (4,0), (5,0)]` com 5 steps

- [ ] **TC-002: Caminho livre em linha reta vertical**
  - Input: `start = (0, 0)`, `end = (0, 5)`, grid 10×10 sem obstáculos
  - Expected: Caminho `[(0,0), (0,1), (0,2), (0,3), (0,4), (0,5)]` com 5 steps

- [ ] **TC-003: Caminho diagonal livre (sem obstáculos)**
  - Input: `start = (0, 0)`, `end = (5, 5)`, grid 10×10 sem obstáculos
  - Expected: Caminho existe, otimizado (Manhattan), sem loops

- [ ] **TC-004: Caminho desviando de obstáculo simples**
  - Input: `start = (0, 0)`, `end = (3, 0)` com tile `(1,0)` bloqueado
  - Expected: Caminho `[(0,0), (0,1), (1,1), (2,1), (3,0)]` ou similar válido

- [ ] **TC-005: Caminho em labirinto (U-shape)**
  - Input: Grid com paredes formando um "U", start e end em lados opostos
  - Expected: A* contorna o obstáculo, caminho válido encontrado

### 2.2 AStarFinder — Casos de Borda

- [ ] **TC-006: Destino = Origem (start === end)**
  - Input: `start = (3, 3)`, `end = (3, 3)`
  - Expected: Caminho vazio `[]` (já está no destino)

- [ ] **TC-007: Sem caminho possível (totalmente bloqueado)**
  - Input: `start = (0, 0)`, `end = (2, 2)`, grid 3×3 com todas as borders e interior bloqueados, sem saída
  - Expected: Retorna `null` ou `[]`

- [ ] **TC-008: Destino em tile não-walkable**
  - Input: `start = (0, 0)`, `end = (5, 5)`, tile `(5,5)` bloqueado
  - Expected: Retorna `null` ou erro

- [ ] **TC-009: Start em tile não-walkable**
  - Input: `start = (0, 0)` bloqueado, `end = (5, 5)`
  - Expected: Retorna `null` ou erro

- [ ] **TC-010: Coordenadas fora dos limites do grid**
  - Input: `start = (-1, 0)` ou `end = (100, 100)` em grid 10×10
  - Expected: Erro `OUT_OF_BOUNDS` ou retorno nulo

- [ ] **TC-011: Grid vazio (0×0)**
  - Input: Grid `[]`
  - Expected: Erro `INVALID_GRID`

- [ ] **TC-012: Grid com 1 tile (1×1) walkable, mesmo start e end**
  - Input: Grid `[[true]]`, `start = (0,0)`, `end = (0,0)`
  - Expected: Caminho vazio `[]`

- [ ] **TC-013: Grid 1×1 com tile bloqueado**
  - Input: Grid `[[false]]`, `start = (0,0)`, `end = (0,0)`
  - Expected: Retorna `null` (tile inicial bloqueado)

### 2.3 Heurística e Otimizações

- [ ] **TC-014: Heurística Manhattan é usada e admissível**
  - Input: `start = (0,0)`, `end = (3,4)`
  - Expected: Heurística `h = |3-0| + |4-0| = 7`

- [ ] **TC-015: Max steps / max nodes limit impede loop infinito**
  - Input: Grid grande com caminho muito longo, `maxSteps = 100`
  - Expected: Retorna `null` ou `PATH_TOO_LONG` quando excede limite

- [ ] **TC-016: Path smoothing opcional remove ângulos desnecessários**
  - Input: Caminho zigue-zague que pode ser simplificado
  - Expected: Caminho pós-smooth tem menos waypoints

### 2.4 Path Cache

- [ ] **TC-017: Cache retorna mesmo resultado para mesma consulta**
  - Input: `findPath((0,0)→(5,5))` chamado duas vezes
  - Expected: Segunda chamada retorna do cache (mesmo objeto ou deep equal)

- [ ] **TC-018: Cache é invalidado quando grid muda**
  - Input: Grid alterado (tile antes walkable fica bloqueado)
  - Expected: Cache limpo, nova chamada recalcula caminho

- [ ] **TC-019: Cache tem tamanho máximo (LRU)**
  - Input: Preencher cache com > `maxCacheSize` entradas
  - Expected: Entradas mais antigas são removidas, cache não cresce infinito

- [ ] **TC-020: Cache não retorna stale data para consultas parcialmente sobrepostas**
  - Input: Consultar (0,0)→(3,3) (cached), depois (0,0)→(4,4) (nova)
  - Expected: Nova consulta calcula caminho completo (cache miss)

### 2.5 Performance

- [ ] **TC-021: A* resolve grid 100×100 sem obstáculos em < 10ms**
  - Input: Grid 100×100 vazio, start=(0,0), end=(99,99)
  - Expected: Tempo de execução < 10ms (benchmark)

- [ ] **TC-022: A* resolve grid 500×500 com obstáculos aleatórios em < 100ms**
  - Input: Grid 500×500 com 30% tiles bloqueados
  - Expected: Tempo de execução < 100ms

- [ ] **TC-023: Grid assimétrico retangular (10×1000)**
  - Input: Grid 10×1000 (largura 10, altura 1000), caminho livre
  - Expected: Caminho encontrado, performance aceitável

---

## 3. Testes de Integração

### 3.1 AStar + Grid de Colisão

- [ ] **TC-024: A* usa grid gerado por TilemapLoader**
  - Setup: Grid de colisão gerado a partir de tilemap Tiled real
  - Steps:
    1. Carregar tilemap `lorencia.json`
    2. Extrair `collisionGrid()` → grid booleana 2D
    3. Chamar `findPath((10,10), (20,20), collisionGrid)`
  - Expected: Path respeita tiles não-walkable do mapa

- [ ] **TC-025: A* com grid parcialmente visível (fog of war)**
  - Steps:
    1. Grid com áreas desconhecidas marcadas como walkable (default)
    2. `findPath` através de área desconhecida
  - Expected: Caminho é calculado assumindo walkable

### 3.2 AStar + GameEngine

- [ ] **TC-026: Pathfinding é usado durante tick do GameEngine**
  - Setup: GameEngine rodando, A* disponível como serviço
  - Steps:
    1. `GameEngine` tick simula pedido de path para NPC
    2. A* calcula caminho
  - Expected: Caminho retornado dentro do mesmo tick (< 100ms)

---

## 4. Casos de Erro

- [ ] **TC-027: Grid com tipos inconsistentes (linhas de tamanhos diferentes)**
  - Input: Grid `[[true, true], [true]]` (linha 1 tem 2 cols, linha 2 tem 1)
  - Expected: Erro `INVALID_GRID` ou comportamento tratado

- [ ] **TC-028: Grid com valores não-booleanos**
  - Input: Grid com `[0, 1, "true"]` em vez de booleanos
  - Expected: Conversão segura (truthy/falsy) ou erro

- [ ] **TC-029: Start/end com coordenadas NaN ou Infinity**
  - Input: `start = (NaN, 0)`
  - Expected: Erro `INVALID_COORDINATES`

- [ ] **TC-030: Cache com chave malformada**
  - Input: Tentar consultar cache com parâmetros inválidos
  - Expected: Cache ignora ou retorna undefined, sem crash

---

## 5. E2E Tests

- [ ] **TC-031: Servidor calcula path para jogador e retorna via WebSocket**
  - Setup: Servidor rodando com A*, cliente conectado
  - Steps:
    1. Cliente envia `PLAYER_MOVE { x: 25, y: 30 }`
    2. Servidor calcula A* do `player.x,y` até `(25,30)`
    3. Servidor envia primeiro passo do caminho
  - Expected: Jogador move-se 1 tile por tick na direção do destino

- [ ] **TC-032: Path recalcula se tile intermediário fica bloqueado durante movimento**
  - Setup: Servidor rodando, grid dinâmica
  - Steps:
    1. Jogador inicia path longo
    2. Tile no caminho é bloqueado (ex: outro jogador/evento)
    3. Servidor recalcula path no próximo tick
  - Expected: Jogador desvia do tile bloqueado

---

## 6. Regressão

- Testes de World (`world.test.ts`) — A* pode impactar posicionamento de entidades
- Testes de GameEngine (`game-engine.test.ts`) — tick incluirá pathfinding
- Schemas de movimento (`schemas.test.ts`) — `MoveSchema` usado por A*

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 23 | 12h |
| Integration | 3 | 4h |
| Casos de Erro | 4 | 2h |
| E2E | 2 | 4h |
| **Total** | **32** | **22h** |
