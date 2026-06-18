# Plano de Testes: Cliente Vite + PixiJS (Issue #3)

## 1. Escopo

### O que será testado
- Vite dev server inicia e serve o cliente
- Tela/canvas do PixiJS abre no navegador
- AssetManager carrega sprites e tiles placeholder
- NetworkManager conecta ao servidor WebSocket
- Game loop (requestAnimationFrame) roda sem travamentos
- HUD placeholder (HP/MP bars) renderiza
- Tratamento de erros: falha de asset load, falha de conexão
- Responsividade básica da tela

### O que NÃO será testado
- Funcionalidades de jogo (movimento, combate)
- UI complexa (inventário, skills)

---

## 2. Unit Tests

### 2.1 Application Setup

- [ ] TC-001: `createGame()` retorna instância de `Game` com `app: Application`
  - Input: `createGame()`
  - Expected: Objeto com `app` (instanceof `PIXI.Application`)

- [ ] TC-002: PixiJS Application é criado com resolução padrão (1920x1080)
  - Input: `new Application({ width, height })`
  - Expected: `app.screen.width === 1920`, `app.screen.height === 1080`

- [ ] TC-003: Canvas element é inserido no DOM
  - Input: `Game.start()`
  - Expected: `document.querySelector('canvas')` não é null

- [ ] TC-004: Config carrega `WS_URL` de env var com fallback
  - Input: Process.env sem variáveis
  - Expected: `config.WS_URL === 'ws://localhost:3001'`

### 2.2 Asset Manager

- [ ] TC-005: `AssetManager.init()` carrega assets placeholder (quadrados coloridos)
  - Input: `assetManager.init()`
  - Expected: Retorna Promise que resolve com lista de { name, texture }

- [ ] TC-006: `AssetManager.getTexture(name)` retorna `Texture` para asset carregado
  - Input: `assetManager.getTexture('player_placeholder')`
  - Expected: Retorna instância de `PIXI.Texture`

- [ ] TC-007: `AssetManager.getTexture(name)` retorna `undefined` para asset inexistente
  - Input: `assetManager.getTexture('non_existent')`
  - Expected: Retorna `undefined` ou texture de fallback

- [ ] TC-008: Asset faltante não trava o jogo
  - Input: Tentar carregar URL inválida
  - Expected: `AssetManager` loga warning e continua sem crash

### 2.3 Network Manager

- [ ] TC-009: `NetworkManager.connect(url)` tenta conectar ao servidor
  - Input: `networkManager.connect('ws://localhost:3001')`
  - Expected: Conexão WebSocket é iniciada (readyState = CONNECTING)

- [ ] TC-010: `NetworkManager.send(message)` serializa para JSON
  - Input: `networkManager.send({ type: 'MOVE', x: 100, y: 200 })`
  - Expected: Socket envia string `'{"type":"MOVE","x":100,"y":200}'`

- [ ] TC-011: `NetworkManager.onMessage(callback)` registra handler
  - Input: `networkManager.onMessage(handler)`
  - Expected: Quando mensagem chega, handler é chamado com objeto parseado

- [ ] TC-012: `NetworkManager.disconnect()` fecha conexão
  - Input: `networkManager.disconnect()`
  - Expected: Socket.readyState transiciona para CLOSING/CLOSED

- [ ] TC-013: `NetworkManager` emite evento `connected` quando conexão abre
  - Input: Conexão estabelecida com sucesso
  - Expected: Handler registrado para `connected` é chamado

- [ ] TC-014: `NetworkManager` emite evento `disconnected` quando conexão fecha
  - Input: Conexão fechada
  - Expected: Handler registrado para `disconnected` é chamado

- [ ] TC-015: `NetworkManager` emite evento `error` em erro de rede
  - Input: Tentar conectar a servidor inexistente
  - Expected: Handler de `error` é chamado com objeto Error

### 2.4 Game Loop

- [ ] TC-016: `Game.update(dt)` incrementa contador de frames
  - Input: `game.update(16)` (simula 60 FPS)
  - Expected: `game.frameCount` incrementa

- [ ] TC-017: Game loop não lança exceção em tick normal
  - Input: `game.update(16)` com estado válido
  - Expected: Nenhuma exceção lançada

### 2.5 Camera

- [ ] TC-018: `Camera.follow(entity)` centraliza entidade na tela
  - Input: `camera.follow(player)` onde `player.x = 500, player.y = 500`
  - Expected: `container.x === -500 + screen.width/2`

### 2.6 HUD Placeholder

- [ ] TC-019: `HUD.create()` adiciona containers de HP bar e MP bar ao stage
  - Input: `hud.create()`
  - Expected: `app.stage` contém sprites/gráficos com labels 'HP' e 'MP'

- [ ] TC-020: `HUD.update({ hp, maxHp, mp, maxMp })` atualiza barras
  - Input: `hud.update({ hp: 50, maxHp: 100, mp: 30, maxMp: 50 })`
  - Expected: Barra de HP tem largura 50% da largura máxima

---

## 3. Integration Tests

### 3.1 Vite Dev Server

- [ ] TC-021: Vite dev server inicia sem erros
  - Setup: Projeto cliente configurado
  - Steps:
    1. Executar `npm run dev` no workspace client
  - Expected: Servidor Vite sobe em `localhost:5173` (porta padrão)

- [ ] TC-022: Página HTML principal carrega sem erros 404
  - Setup: Vite rodando
  - Steps:
    1. Fazer GET para `http://localhost:5173`
  - Expected: Status 200, HTML contém `<div id="game">`

### 3.2 PixiJS Canvas

- [ ] TC-023: PixiJS renderiza frame inicial sem erro
  - Setup: Vite rodando, browser abre
  - Steps:
    1. Inicializar Game
    2. Chamar `app.renderer.render(app.stage)`
  - Expected: Renderização concluída sem erros WebGL/Canvas

- [ ] TC-024: Resize da janela ajusta o canvas
  - Setup: Game rodando
  - Steps:
    1. Disparar evento `resize` com window.innerWidth = 1024
    2. Verificar `app.renderer.width`
  - Expected: Canvas redimensionado proporcionalmente

### 3.3 Client-Server WebSocket

- [ ] TC-025: Client conecta ao servidor via WebSocket
  - Setup: Servidor rodando em `ws://localhost:3001`, Vite rodando
  - Steps:
    1. Client chama `networkManager.connect()`
    2. Aguardar evento `connected`
  - Expected: Conexão estabelecida, client.onConnected chamado

- [ ] TC-026: Client envia mensagem validada por shared schema
  - Setup: Server + client rodando
  - Steps:
    1. Client envia `{ type: 'MOVE', x: 100, y: 200 }`
    2. Server recebe e valida com `MoveMessageSchema`
  - Expected: Mensagem validada com sucesso

---

## 4. Edge Cases

- [ ] TC-027: Servidor WebSocket offline não trava client
  - Input: Client tenta conectar com servidor parado
  - Expected: Evento `error` emitido, client continua rodando (modo offline)

- [ ] TC-028: Conexão perdida durante jogo não crasha
  - Input: Client conectado, servidor cai
  - Expected: Evento `disconnected` emitido, HUD mostra "Reconnecting..."

- [ ] TC-029: Asset corrompido é ignorado
  - Input: URL de asset retorna 404 ou arquivo inválido
  - Expected: AssetManager loga erro, carrega fallback, não trava

- [ ] TC-030: Tab oculta (requestAnimationFrame pausado) não quebra o loop
  - Input: Document.hidden = true, esperar 10s, voltar
  - Expected: Game.deltaTime não acumula (PixiJS 8 já trata), jogo retoma normal

- [ ] TC-031: Múltiplas instâncias do client na mesma aba
  - Input: Chamar `createGame()` duas vezes
  - Expected: Segunda chamada retorna instância existente ou erro tratado

- [ ] TC-032: Canvas não encontrado (elemento removido do DOM)
  - Input: Jogo iniciado, canvas removido via DOM API
  - Expected: Game detecta e tenta recriar ou loga erro sem crash

- [ ] TC-033: Performance com 60 FPS sustentados
  - Input: Game rodando sem entidades
  - Expected: `requestAnimationFrame` chamado ~60 vezes/segundo

---

## 5. E2E Tests

- [ ] TC-034: Fluxo completo: abrir jogo → canvas renderiza → conecta servidor → HUD aparece
  - Setup: Servidor rodando, Vite dev server rodando
  - Steps:
    1. Navegador abre `http://localhost:5173`
    2. Aguardar canvas PixiJS aparecer
    3. Aguardar conexão WebSocket estabelecer
    4. Verificar HUD placeholder (HP/MP bars) visível
    5. Fechar aba
  - Expected: Tela abre sem erros no console, conexão estabelecida, HUD renderiza

- [ ] TC-035: Teste de assets: loading com fallback visual
  - Setup: Servidor de assets mockado com delays
  - Steps:
    1. Iniciar jogo com assets reais apontando para URLs lentas
    2. Verificar placeholder aparece enquanto carrega
    3. Verificar assets carregados substituem placeholders
  - Expected: Jogo não fica preso em loading screen infinito

---

## 6. Regressão

- Testes de conexão WS impactam todas as features que usam rede
- Testes de asset loading impactam tilemap loader
- Testes de HUD impactam UI components futuros

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 20 | 8h |
| Integration | 6 | 6h |
| Edge Cases | 7 | 4h |
| E2E | 2 | 3h |
| **Total** | **35** | **21h** |
```

---
