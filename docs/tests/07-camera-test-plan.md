# Plano de Testes: Câmera (Verificação)

**Feature ID:** P0.7
**Issue:** #14
**Status:** ✅ Câmera já implementada — verificar e fechar issue

---

## 1. Escopo

### O que será testado (verificação)
- **Follow target**: câmera segue entidade designada
- **Smooth interpolation**: movimento suave entre posição atual e target (lerp)
- **Resize de tela**: `setScreenSize()` ajusta viewport corretamente
- **Snap to target**: `snapToTarget()` posiciona câmera instantaneamente
- **Unfollow**: `unfollow()` para de seguir
- **Update loop**: `update()` chamado no game loop a cada frame
- **Múltiplas entidades**: câmera pode trocar de target dinamicamente
- **Bounds/culling**: câmera não mostra área além do mapa (opcional)

### O que NÃO será testado
- Interpolação de movimento de entidades (P0.4)
- Renderização de tilemap (P0.2)
- Minimapa (P1.3)

---

## 2. Testes Unitários

### 2.1 Camera Class

- [ ] **TC-001: `follow(target)` define o target da câmera**
  - Input: `target = { x: 100, y: 100 }`
  - Expected: `camera.target === target`

- [ ] **TC-002: `unfollow()` remove o target**
  - Input: Camera seguindo target
  - Steps: `camera.unfollow()`
  - Expected: `camera.target === null`

- [ ] **TC-003: `update()` não faz nada sem target**
  - Input: `camera.target = null`, chamar `update()`
  - Expected: Container position inalterado

- [ ] **TC-004: `update()` centraliza container no target**
  - Input: `target = { x: 200, y: 150 }`, screen = 800×600
  - Steps: `camera.snapToTarget()` (simula target posicionado)
  - Expected: `container.x = -200 + 400 = 200`, `container.y = -150 + 300 = 150`

- [ ] **TC-005: Smooth interpolation: `update()` move gradualmente**
  - Input: Container em (0,0), target em (100,0), smoothFactor = 0.1
  - Steps: 1 chamada de `update()`
  - Expected: `container.x` ≈ 10 (0 + (100-0) * 0.1), não 100 instantaneamente

- [ ] **TC-006: Após N chamadas de update, container converge ao target**
  - Input: smoothFactor = 0.5, 10 chamadas
  - Expected: `container.x ≈ targetX` (dentro de tolerância 0.01)

- [ ] **TC-007: `snapToTarget()` posiciona instantaneamente**
  - Input: Container em (0,0), target em (500,300)
  - Steps: `snapToTarget()`
  - Expected: `container.x = -500 + screenWidth/2`, `container.y = -300 + screenHeight/2`

- [ ] **TC-008: `snapToTarget()` sem target não crasha**
  - Input: `target = null`
  - Steps: `snapToTarget()`
  - Expected: Nada acontece, sem erro

### 2.2 Screen Resize

- [ ] **TC-009: `setScreenSize(width, height)` atualiza dimensões**
  - Input: `width = 1920`, `height = 1080`
  - Steps: `setScreenSize(1920, 1080)`
  - Expected: Câmera usa novas dimensões no próximo `update()`

- [ ] **TC-010: Resize mantém centralização correta**
  - Input: Screen muda de 800×600 para 1024×768
  - Expected: Após resize + update, container reposicionado para centro correto

- [ ] **TC-011: `setScreenSize()` com valores negativos**
  - Input: `width = -100`, `height = -100`
  - Expected: Ignorado ou tratado como 0 (sem crash)

- [ ] **TC-012: `setScreenSize(0, 0)`**
  - Input: Dimensões zero
  - Expected: Tratado, sem divisão por zero

### 2.3 Container Position

- [ ] **TC-013: `getContainer()` retorna container do PixiJS**
  - Input: Camera criada com container
  - Expected: `getContainer()` === container do constructor

- [ ] **TC-014: Container é movido corretamente (valores negativos)**
  - Input: `snapToTarget()` com target em (50, 75), screen 800×600
  - Expected: `container.x = -50 + 400 = 350`, `container.y = -75 + 300 = 225`

- [ ] **TC-015: Smooth factor configurável**
  - Input: `smoothFactor = 0.05` (mais lento)
  - Expected: Movimento mais suave (menor incremento por frame)

### 2.4 Múltiplos Targets

- [ ] **TC-016: Trocar target durante follow**
  - Input: Seguindo target A, chamar `follow(targetB)`
  - Expected: `camera.target === targetB`

- [ ] **TC-017: Target removido (null) durante follow**
  - Input: `follow(null)` ou target fica null
  - Expected: Camera para (unfollow implícito)

- [ ] **TC-018: Target que não é entidade (objeto simples com x,y)**
  - Input: `follow({ x: 50, y: 60 })`
  - Expected: Funciona normalmente (só precisa de x, y)

### 2.5 Bounds (Clamping opcional)

- [ ] **TC-019: Camera não mostra área além do mapa (se bounds configurados)**
  - Input: `mapWidth = 8000`, `mapHeight = 6000`, screen = 800×600
  - Steps: Target na borda do mapa
  - Expected: Container não permite mostrar área preta além do mapa

- [ ] **TC-020: Camera bounds são atualizados ao trocar de mapa**
  - Input: Mapa 100×100 → mapa 200×200
  - Expected: Bounds atualizados, câmera respeita novo limite

---

## 3. Testes de Integração

### 3.1 Camera + Game Loop

- [ ] **TC-021: Camera.update() é chamada a cada frame no game loop**
  - Setup: Game instanciado, estado = 'world'
  - Steps:
    1. `game.app.ticker.add(update)` chamado
    2. Camera.update() executado
  - Expected: Camera atualiza a cada frame

- [ ] **TC-022: Camera não trava se game loop roda sem target**
  - Setup: Estado 'world', camera sem target
  - Steps:
    1. Vários frames executam
  - Expected: Nenhum erro, container imóvel

### 3.2 Camera + Resize

- [ ] **TC-023: Resize da janela ajusta câmera corretamente**
  - Setup: Cliente rodando, câmera seguindo target
  - Steps:
    1. Window resize de 1920×1080 para 1280×720
  - Expected: Camera centraliza no novo viewport, sem distorção

- [ ] **TC-024: Resize durante movimento do target**
  - Setup: Target movendo, resize ocorre
  - Steps:
    1. Target move
    2. Resize dispara
    3. Próximo update
  - Expected: Câmera mantém seguimento suave mesmo com resize

### 3.3 Camera + PlaceholderGraphics

- [ ] **TC-025: Câmera segue container do player corretamente**
  - Setup: PlaceholderGraphics criou player container em (100,100)
  - Steps:
    1. `camera.follow(playerContainer)`
    2. Camera update
  - Expected: Container do mundo posicionado centralizando player

---

## 4. Casos de Borda

- [ ] **TC-026: smoothFactor = 0 (sem interpolação — movimento instantâneo)**
  - Input: `smoothFactor = 0`
  - Expected: `update()` equivale a `snapToTarget()`

- [ ] **TC-027: smoothFactor = 1 (sem interpolação — todo movimento de uma vez)**
  - Input: `smoothFactor = 1`
  - Expected: `container.x = targetX` em 1 frame

- [ ] **TC-028: smoothFactor negativo**
  - Input: `smoothFactor = -0.1`
  - Expected: Tratado como 0 ou valor absoluto (sem oscilação)

- [ ] **TC-029: Target com coordenadas NaN**
  - Input: `follow({ x: NaN, y: 100 })`
  - Expected: Camera inoperante ou NaN tratado

- [ ] **TC-030: Target com coordenadas negativas**
  - Input: `follow({ x: -100, y: -100 })`
  - Expected: Camera segue para área negativa (fora do mapa)

- [ ] **TC-031: Container nulo no constructor**
  - Input: `new Camera(null, 800, 600)`
  - Expected: Erro tratado ou fallback

- [ ] **TC-032: Múltiplos resizes rápidos (debounce)**
  - Input: 10 resizes em 100ms
  - Expected: Último resize prevalece, sem flicker

---

## 5. E2E Tests

- [ ] **TC-033: Cliente inicia, câmera segue player, resize mantém centralização**
  - Setup: Cliente rodando em janela 1920×1080
  - Steps:
    1. Client inicia e entra no mundo
    2. Camera.follow(player) é chamado
    3. Player move-se
    4. Janela é redimensionada para 1280×720
  - Expected: Câmera segue player suavemente, centralização correta após resize

---

## 6. Regressão

- Testes de Game.ts (cliente) — `camera.update()` no game loop
- Testes de PlaceholderGraphics — containers referenciados pela câmera
- Testes de InputManager — clique converte coordenadas considerando câmera

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 20 | 6h |
| Integration | 5 | 3h |
| Casos de Borda | 7 | 2h |
| E2E | 1 | 2h |
| **Total** | **33** | **13h** |
