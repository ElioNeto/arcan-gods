# Plano de Testes: Tilemap Loader (Issue #4)

## 1. Escopo

### O que será testado
- Parse de JSON exportado do Tiled Editor
- Criação de tileset a partir do JSON
- Renderização de camadas (ground, objects, top)
- Tratamento de tilesets externos (imagem referenciada)
- Colisão: identifica tiles com propriedade "collision"
- Largura/altura do mapa em tiles e pixels
- Múltiplas camadas com parallax/blend
- Carregamento assíncrono com callback/Promise
- Fallback para tile ausente (tile ID não encontrado no tileset)
- Gerenciamento de memória (descarregar tilemap)

### O que NÃO será testado
- Pathfinding (será em ciclo futuro)
- Interpolação de câmera
- Objetos interativos (NPCs, portais)

---

## 2. Unit Tests

### 2.1 Tilemap JSON Parser

- [ ] TC-001: `parseTilemap(json)` retorna objeto `Tilemap` com `width`, `height`, `tileWidth`, `tileHeight`
  - Input: JSON Tiled válido com `{ width: 100, height: 100, tilewidth: 32, tileheight: 32 }`
  - Expected: Objeto com propriedades correspondentes

- [ ] TC-002: `parseTilemap(json)` extrai `tilesets` corretamente
  - Input: JSON com 2 tilesets
  - Expected: Array de `{ firstgid, name, image, imagewidth, imageheight, tilecount }`

- [ ] TC-003: `parseTilemap(json)` extrai `layers` na ordem correta
  - Input: JSON com 3 layers (ground, objects, top)
  - Expected: Array com 3 elementos, `layer[0].name === 'ground'`, `layer[1].name === 'objects'`, `layer[2].name === 'top'`

- [ ] TC-004: `parseTilemap(json)` decodifica `data` de layers (formato CSV ou base64)
  - Input: Layer com `data` em CSV
  - Expected: Array 2D de tile GIDs
  - Input: Layer com `data` em base64 (zlib comprimido)
  - Expected: Array 2D decodificado corretamente

- [ ] TC-005: Tile GID=0 (vazio/vazio) é ignorado na renderização
  - Input: layer data com GID=0 em posição [5][10]
  - Expected: `getTileAt(10, 5)` retorna `null` ou `undefined`

- [ ] TC-006: `parseTilemap(json)` extrai `tilewidth` e `tileheight` de cada tileset
  - Input: Tileset com tilewidth=32, tileheight=32
  - Expected: Objeto tileset com essas dimensões

### 2.2 Tileset Handling

- [ ] TC-007: `getTileGID(tileset, tileIndex)` retorna o GID global correto
  - Input: `tileset.firstgid = 100`, `tileIndex = 5`
  - Expected: `GID = 105`

- [ ] TC-008: `findTilesetForGID(gid)` retorna o tileset correto
  - Input: `gid = 105`, tilesets com firstgid 1 e 100
  - Expected: Segundo tileset (firstgid=100)

- [ ] TC-009: `findTilesetForGID(gid)` retorna null para GID inválido
  - Input: `gid = 999999` (não pertence a nenhum tileset)
  - Expected: `null`

- [ ] TC-010: `getTileRect(gid)` retorna a região (sx, sy, sw, sh) no tileset image
  - Input: Tileset 8x8 tiles, tile 10 (row 1, col 2)
  - Expected: `{ x: 64, y: 32, w: 32, h: 32 }` (para tile 32x32 em tileset 8 colunas)

### 2.3 Layer Rendering

- [ ] TC-011: `renderLayer(layer)` retorna um `PIXI.Container` com sprites
  - Input: Layer com 10 tiles não-vazios
  - Expected: Container com 10 filhos (`PIXI.Sprite`)

- [ ] TC-012: Sprites são posicionados em `x = col * tileWidth`, `y = row * tileHeight`
  - Input: Tile na row=3, col=5, tileWidth=32, tileHeight=32
  - Expected: Sprite em `{ x: 160, y: 96 }`

- [ ] TC-013: Layer com type "objectgroup" é ignorada ou tratada separadamente
  - Input: Layer do tipo "objectgroup"
  - Expected: Tilemap não tenta renderizar como tile grid

- [ ] TC-014: Propriedade "visible=false" em layer faz com que não seja renderizada
  - Input: Layer com `"visible": false`
  - Expected: `renderLayer()` retorna `null` ou container vazio

### 2.4 Collision Tiles

- [ ] TC-015: Tile com propriedade `"collision": true` é registrado como colidível
  - Input: Tileset com tile 5 tendo `{ "collision": "true" }` nas properties
  - Expected: `isCollisionTile(gid)` retorna `true`

- [ ] TC-016: `getCollisionGrid()` retorna matriz booleana 2D
  - Input: Mapa 10x10 com alguns tiles de colisão
  - Expected: Matriz com `true` onde há colisão, `false` onde não há

- [ ] TC-017: Tile sem propriedade collision é tratado como não-colidível
  - Input: Tile sem `"collision"` nas properties
  - Expected: `isCollisionTile(gid)` retorna `false`

### 2.5 Asset Loading

- [ ] TC-018: `loadTilemap(url)` faz fetch do JSON e parse
  - Input: URL de arquivo .json válido
  - Expected: Promise resolve com objeto `Tilemap`

- [ ] TC-019: `loadTilemap(url)` carrega imagens dos tilesets
  - Input: JSON com `tilesets[0].image = 'tileset.png'`
  - Expected: Imagem carregada via `PIXI.Assets.load('tileset.png')`

- [ ] TC-020: `loadTilemap(url)` rejeita Promise se JSON for inválido
  - Input: URL retorna HTML 404
  - Expected: Promise rejeitada com erro

- [ ] TC-021: `loadTilemap(url)` rejeita Promise se imagem do tileset não carregar
  - Input: JSON OK, imagem retorna 404
  - Expected: Promise rejeitada com erro de asset loading

### 2.6 Memory Management

- [ ] TC-022: `destroy()` remove todos os sprites e libera texturas
  - Input: `tilemap.destroy()`
  - Expected: `tilemap.container.children.length === 0`, texturas destruídas

---

## 3. Integration Tests

### 3.1 Tilemap + PixiJS Renderer

- [ ] TC-023: Tilemap é renderizado no stage do PixiJS
  - Setup: PixiJS Application rodando
  - Steps:
    1. `loadTilemap('maps/lorencia.json')`
    2. Adicionar `tilemap.container` ao `app.stage`
    3. Renderizar um frame
  - Expected: Mapa visível na tela, sem erros WebGL

- [ ] TC-024: Múltiplas camadas renderizam na ordem correta (ground → objects → top)
  - Setup: App rodando
  - Steps:
    1. Carregar tilemap com 3 camadas
    2. Verificar ordem Z dos containers
  - Expected: `ground` no fundo, `objects` no meio, `top` na frente

- [ ] TC-025: Câmera se move sobre o tilemap
  - Setup: Tilemap carregado, camera.follow implementado
  - Steps:
    1. Mover câmera para (500, 500)
  - Expected: Container do tilemap tem posição transladada, tiles visíveis mudam

### 3.2 Collision Grid

- [ ] TC-026: Collision grid é gerada corretamente para mapa real
  - Setup: Tilemap Tiled com tiles de colisão configurados
  - Steps:
    1. Carregar tilemap
    2. Verificar `getCollisionGrid()` posição específica com colisão
  - Expected: Grid tem `true` onde há colisão

- [ ] TC-027: Entidade não atravessa tile colidível (server-side collision mock)
  - Setup: Tilemap com colisão carregado
  - Steps:
    1. Simular tentativa de mover entidade para tile colidível
    2. Verificar `canMoveTo(tileX, tileY)`
  - Expected: `canMoveTo` retorna `false`

---

## 4. Edge Cases

- [ ] TC-028: Tilemap com 0 tiles (mapa vazio) não crasha
  - Input: JSON com `width=1, height=1`, layer sem tiles
  - Expected: Tilemap carregado, container vazio, sem erros

- [ ] TC-029: Tilemap com 1 milhão de tiles não causa OOM
  - Input: JSON com width=1000, height=1000 (1M tiles)
  - Expected: Tilemap carrega, performance aceitável (teste de stress)

- [ ] TC-030: Tileset com um tile só (1x1 no grid)
  - Input: Tileset com 1 tile, image 32x32
  - Expected: `getTileRect` retorna (0, 0, 32, 32)

- [ ] TC-031: Mapa com tileWidth != tileHeight (ex: 64x32 isométrico)
  - Input: JSON com tilewidth=64, tileheight=32
  - Expected: Sprites posicionados corretamente

- [ ] TC-032: Mapa sem camadas (layers array vazio)
  - Input: JSON com `"layers": []`
  - Expected: Tilemap carregado, sem erros, sem renderização

- [ ] TC-033: Tileset image com tamanho inesperado (não múltiplo de tileSize)
  - Input: Tileset 100x100 com tile 32x32
  - Expected: Última coluna/linha parcial é ignorada

- [ ] TC-034: Propriedade customizada desconhecida no tile é ignorada
  - Input: Tile com property `"foo": "bar"` (não conhecida pelo sistema)
  - Expected: Propriedade ignorada, sem erro

- [ ] TC-035: Encoding base64 com zlib compressão falha (dados corrompidos)
  - Input: Layer data base64 malformado
  - Expected: Erro de parse capturado, tilemap rejeita com mensagem clara

---

## 5. E2E Tests

- [ ] TC-036: Fluxo completo: carregar mapa → renderizar → câmera navega → colisão detectada
  - Setup: Client PixiJS rodando, tilemap Tiled real de Lorencia
  - Steps:
    1. Client carrega `maps/lorencia.json`
    2. Mapa renderiza no canvas
    3. Câmera centraliza em posição inicial
    4. Simular clique em tile colidível
    5. Verificar que `canMoveTo` retorna false
  - Expected: Mapa visível, colisão funcional, sem erros no console

---

## 6. Regressão

- Testes de AssetManager (plano #4) — tilemap depende de asset loading
- Testes de Camera (plano #4) — câmera navega sobre tilemap

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 22 | 10h |
| Integration | 5 | 5h |
| Edge Cases | 8 | 4h |
| E2E | 1 | 3h |
| **Total** | **36** | **22h** |
```

---
