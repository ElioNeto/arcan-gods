# Plano de Testes: Tilemap Loader + Grid de Colisão

**Feature ID:** P0.2
**Issue:** #4
**Dependências:** Nenhuma (pode ser testado isoladamente no servidor)

> **Nota:** Este plano substitui e expande o `06-tilemap-loader-test-plan.md` anterior, focando especificamente no
> parse server-side do tilemap e geração do grid de colisão para uso pelo A\*.

---

## 1. Escopo

### O que será testado
- Parse de JSON exportado do Tiled Editor (formato `.tmj`/`.json`)
- Extração de `width`, `height`, `tilewidth`, `tileheight` do mapa
- Extração de tilesets (firstgid, name, image)
- Decodificação de camadas de tiles (`data`) — CSV e base64 (gzip/zlib)
- Geração de grid booleano walkable/non-walkable a partir de tiles com propriedade `collision`
- Carregamento assíncrono de arquivos de mapa
- Cache de grids de colisão por mapId
- Tratamento de erros: JSON inválido, arquivo ausente, tileset ausente
- Fallback para mapa vazio (grid totalmente walkable) quando arquivo não encontrado

### O que NÃO será testado
- Renderização visual de tilemaps no cliente (PixiJS)
- Sprites, texturas, ou assets visuais
- Objetos interativos (NPCs, portais) — serão testados em P1.2

---

## 2. Testes Unitários

### 2.1 Tilemap JSON Parser

- [ ] **TC-001: `parseTilemap(json)` retorna objeto com metadados do mapa**
  - Input: JSON Tiled válido com `{ width: 100, height: 100, tilewidth: 32, tileheight: 32, orientation: 'orthogonal' }`
  - Expected: Objeto `TilemapData` com `{ width, height, tileWidth, tileHeight, orientation }` correspondentes

- [ ] **TC-002: `parseTilemap(json)` extrai tilesets com firstgid correto**
  - Input: JSON com 2 tilesets: `{ firstgid: 1, name: 'tileset1' }` e `{ firstgid: 100, name: 'tileset2' }`
  - Expected: Array com 2 entradas, `tilesets[0].firstgid === 1`, `tilesets[1].firstgid === 100`

- [ ] **TC-003: `parseTilemap(json)` extrai layers na ordem correta**
  - Input: JSON com layers `['ground', 'objects', 'top']` na ordem
  - Expected: `layers[0].name === 'ground'`, `layers[1].name === 'objects'`, `layers[2].name === 'top'`

- [ ] **TC-004: `parseTilemap(json)` decodifica layer data em formato CSV**
  - Input: Layer com `data` sendo string CSV de 4 tiles: `"1,2,3,4"`
  - Expected: Array 2D `[[1, 2], [3, 4]]` para largura=2

- [ ] **TC-005: `parseTilemap(json)` decodifica layer data em base64 (gzip)**
  - Input: Layer com `encoding: 'base64'`, `compression: 'gzip'`, data base64 comprimido
  - Expected: Array 2D de GIDs decodificado corretamente

- [ ] **TC-006: `parseTilemap(json)` decodifica layer data em base64 (zlib)**
  - Input: Layer com `encoding: 'base64'`, `compression: 'zlib'`, data base64 comprimido
  - Expected: Array 2D de GIDs decodificado corretamente

- [ ] **TC-007: Layer type 'objectgroup' é identificada e não processada como tile grid**
  - Input: Layer com `type: 'objectgroup'` e `objects: [...]`
  - Expected: `parseTilemap` retorna layer do tipo objeto separadamente

- [ ] **TC-008: Layer com visible=false é processada mas marcada como não-visível**
  - Input: Layer com `visible: false`
  - Expected: `layer.visible === false`

- [ ] **TC-009: Tile GID 0 (vazio/sem tile) é representado como null no array**
  - Input: Layer data com GIDs `[0, 1, 0, 2]`
  - Expected: Array 2D com `null` onde GID=0

### 2.2 Collision Grid

- [ ] **TC-010: `buildCollisionGrid(tilemapData)` retorna matriz booleana 2D**
  - Input: TilemapData com layer 'collision' ou tiles com propriedade collision
  - Expected: Grid `boolean[][]` com `true` = walkable, `false` = bloqueado

- [ ] **TC-011: Tile com propriedade "collision: true" é non-walkable**
  - Input: Tileset com tile GID 5 tendo `properties: [{ name: 'collision', value: true }]`
  - Expected: `isTileWalkable(5)` retorna `false`

- [ ] **TC-012: Tile sem propriedade collision é walkable (default)**
  - Input: Tile GID 10 sem nenhuma propriedade
  - Expected: `isTileWalkable(10)` retorna `true`

- [ ] **TC-013: Collision grid usa maior layer com colisão (priority: top > objects > ground)**
  - Input: Mapa com 3 layers, apenas 'objects' tem tiles com collision
  - Expected: Grid combina tiles não-walkable da layer 'objects'

- [ ] **TC-014: Bordas do mapa são implicitamente non-walkable (out-of-bounds)**
  - Input: Consultar `isWalkable(-1, 0)`, `isWalkable(0, -1)`, `isWalkable(width, 0)`, `isWalkable(0, height)`
  - Expected: Todas retornam `false`

- [ ] **TC-015: Grid de colisão tem dimensões exatas do mapa (width × height)**
  - Input: Mapa 50×30
  - Expected: Grid tem 30 linhas, cada linha com 50 colunas

### 2.3 TilemapLoader (Serviço)

- [ ] **TC-016: `loadMap(mapId)` carrega JSON do arquivo e retorna TilemapData**
  - Input: `mapId = 'lorencia'`
  - Expected: Promise resolve com `TilemapData` de `maps/lorencia.json`

- [ ] **TC-017: `getCollisionGrid(mapId)` retorna cache após primeira carga**
  - Input: `getCollisionGrid('lorencia')` chamado 2×
  - Expected: Segunda chamada retorna mesmo grid (referência ou deep equal), sem re-parse

- [ ] **TC-018: `loadMap(mapId)` com mapId inválido lança erro**
  - Input: `mapId = 'nonexistent_map'`
  - Expected: Promise rejeitada com erro `MAP_NOT_FOUND`

- [ ] **TC-019: `getCollisionGrid(mapId)` sem load prévio faz load automático**
  - Input: Chamar `getCollisionGrid('lorencia')` sem chamar `loadMap` antes
  - Expected: Load executado automaticamente, grid retornado

- [ ] **TC-020: Fallback para grid vazio (tudo walkable) quando mapa não encontrado**
  - Input: Config com `fallbackEmptyMap: true`, mapId inexistente
  - Expected: Grid `true[][]` com tamanho default (256×256) retornado sem erro

### 2.4 Tratamento de Erros

- [ ] **TC-021: JSON malformado (syntax error)**
  - Input: String `'{ invalid json }'`
  - Expected: Erro `INVALID_TILEMAP_JSON` com detalhe do parse

- [ ] **TC-022: JSON sem campos obrigatórios**
  - Input: `{}` (objeto vazio)
  - Expected: Erro `MISSING_REQUIRED_FIELDS`: width, height, tilewidth, tileheight

- [ ] **TC-023: Layer data com tamanho inconsistente (width×height mismatch)**
  - Input: Mapa 10×10, layer data com 90 valores (esperado 100)
  - Expected: Erro `INVALID_LAYER_DATA` ou padding automático

- [ ] **TC-024: Encoding base64 com dados corrompidos**
  - Input: Layer data base64 inválido `'%%invalid%%'`
  - Expected: Erro `DECODE_ERROR` com mensagem

- [ ] **TC-025: Arquivo de mapa retorna HTTP 404**
  - Input: URL/file path que não existe
  - Expected: Erro `MAP_FILE_NOT_FOUND` ou `FILE_READ_ERROR`

- [ ] **TC-026: Tileset referenciado não encontrado**
  - Input: JSON com `tilesets[0].image = 'missing.png'`
  - Expected: Aviso logado, tileset ignorado, mapa carregado sem tiles desse set

---

## 3. Testes de Integração

### 3.1 TilemapLoader + World

- [ ] **TC-027: World.getCollisionGrid(mapId) retorna grid do tilemap carregado**
  - Setup: World inicializado com TilemapLoader
  - Steps:
    1. `world.loadMap('lorencia')`
    2. `grid = world.getCollisionGrid('lorencia')`
  - Expected: Grid não-nulo, dimensões positivas

- [ ] **TC-028: Múltiplos mapas carregados simultaneamente**
  - Setup: World com TilemapLoader
  - Steps:
    1. `world.loadMap('lorencia')`
    2. `world.loadMap('devias')`
    3. Grids diferentes para cada mapId
  - Expected: Grids independentes, sem interferência

- [ ] **TC-029: Tilemap atualmente carregado pode ser descartado**
  - Steps:
    1. Carregar mapa
    2. `world.unloadMap('lorencia')`
    3. Tentar acessar grid
  - Expected: Grid não mais disponível (ou recarregado autom.)

### 3.2 TilemapLoader + A*

- [ ] **TC-030: A* usa grid de colisão do tilemap para pathfinding**
  - Setup: TilemapLoader com `lorencia.json`, A* configurado
  - Steps:
    1. Carregar tilemap de Lorencia
    2. Obter `collisionGrid`
    3. Executar `findPath((50,50), (55,55), grid)`
  - Expected: Path respeita tiles não-walkable do mapa real

---

## 4. Casos de Borda

- [ ] **TC-031: Mapa com 0 tiles (width=0, height=0)**
  - Input: JSON com `width: 0, height: 0`
  - Expected: Erro `INVALID_MAP_SIZE` ou grid vazio `[]`

- [ ] **TC-032: Mapa com 1 tile (width=1, height=1)**
  - Input: Mapa 1×1 com 1 tile walkable
  - Expected: Grid `[[true]]`

- [ ] **TC-033: Layer data com todos GIDs iguais a 0 (mapa vazio)**
  - Input: Layer data 10×10 com todos zeros
  - Expected: Grid `true[][]` (tudo walkable, sem tiles)

- [ ] **TC-034: Tileset com tilewidth/tileheight diferente do map**
  - Input: `map.tilewidth=32`, `tileset.tilewidth=64`
  - Expected: Parse executado, tileset tratado conforme especificação Tiled

- [ ] **TC-035: Propriedade "collision" com string em vez de booleano**
  - Input: Tile property `{ name: 'collision', value: 'true' }` (string)
  - Expected: `isTileWalkable` converte string 'true' para boolean true

- [ ] **TC-036: Arquivo JSON com BOM (Byte Order Mark)**
  - Input: JSON começando com `\ufeff`
  - Expected: BOM removido, parse executado normalmente

- [ ] **TC-037: Tilemap com encoding 'base64' mas sem 'compression' (raw base64)**
  - Input: Layer com `encoding: 'base64'`, sem `compression`
  - Expected: Decodifica base64 → bytes → array de GIDs

---

## 5. E2E Tests

- [ ] **TC-038: Servidor carrega tilemap na inicialização e expõe grid**
  - Setup: Servidor inicia com `DEFAULT_MAP_ID = 'lorencia'`
  - Steps:
    1. Servidor inicializa TilemapLoader
    2. `lorencia.json` é carregado
    3. Grid de colisão disponível via `world.getCollisionGrid('lorencia')`
  - Expected: Grid populado, servidor operacional

- [ ] **TC-039: Cliente recebe mapa e colisão via WebSocket ao entrar no mundo**
  - Setup: Servidor com tilemap, cliente conecta e autentica
  - Steps:
    1. Cliente envia AUTH_LOGIN
    2. Servidor responde AUTH_SUCCESS + WORLD_STATE
    3. Servidor envia MAP_DATA com grid de colisão
  - Expected: Cliente tem grid para pathfinding local (preview)

---

## 6. Regressão

- Testes de A* (plano #01) — A* depende do grid de colisão
- Testes de Player (`player.test.ts`) — posição inicial depende do spawn definido no tilemap
- Testes de World (`world.test.ts`) — World usará TilemapLoader

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 26 | 12h |
| Integration | 4 | 5h |
| Casos de Borda | 7 | 4h |
| E2E | 2 | 4h |
| **Total** | **39** | **25h** |
