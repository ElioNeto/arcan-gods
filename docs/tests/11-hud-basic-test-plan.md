# Plano de Testes: HUD Básico (HP/MP/XP/Level)

**Feature ID:** P0.2
**Issue:** #55
**Dependências:** Nenhuma (independente)
**Estimativa Total:** 28 testes + 6 integração + 2 E2E

---

## 1. Escopo

### O que será testado
- Componente HUD no canto superior esquerdo (10px padding)
- Barra de HP (Health Points): proporcional ao `maxHp`, cor vermelha (#ff4444)
- Barra de MP (Mana Points): proporcional ao `maxMp`, cor azul (#4444ff)
- Barra de XP (Experience): proporcional ao `experience / experienceToNext`, cor amarela (#ffff44)
- Texto informativo: "HP: 150/200", "MP: 50/100", "Level: 5"
- Nome do jogador exibido no topo do HUD
- Atualização em tempo real via handler de `ENTITY_UPDATE`
- Animações de transição suave (lerp) nas barras
- Posicionamento correto e redimensionamento
- Ocultar durante loading/menu
- Criação e destruição do HUD ao entrar/sair do mundo
- Renderização via PixiJS `Graphics` (sem dependências de UI framework)

### O que NÃO será testado
- Skills, inventário, ou outros elementos de UI
- Minimapa (#48)
- Chat (já implementado)
- Health bars sobre monstros (será P0.3)
- Damage numbers flutuantes (será P0.3)

---

## 2. Testes Unitários

### 2.1 HUDComponent — Criação e Renderização

- [ ] **TC-001: `HUD.create()` retorna Container com 3 barras + textos**
  - Input: `HUD.create({ name: 'Player1', level: 1, hp: 50, maxHp: 50, mp: 10, maxMp: 10, experience: 0, experienceToNext: 100 })`
  - Expected: Container com 8+ children (bg, nome, hp bar, hp text, mp bar, mp text, xp bar, xp text, level text)

- [ ] **TC-002: HUD é posicionado no canto superior esquerdo (10px padding)**
  - Input: Container do HUD
  - Expected: `container.x === 10`, `container.y === 10`

- [ ] **TC-003: Barras têm largura fixa configurável (ex: 200px)**
  - Input: `HUD_CONFIG.BAR_WIDTH = 200`
  - Expected: Cada barra têm 200px de largura (Graphics com width = 200)

- [ ] **TC-004: Altura das barras é configurável (ex: 16px)**
  - Input: `HUD_CONFIG.BAR_HEIGHT = 16`
  - Expected: Cada barra têm 16px de altura

- [ ] **TC-005: Espaçamento entre barras é configurável (ex: 4px)**
  - Input: `HUD_CONFIG.BAR_SPACING = 4`
  - Expected: Distância vertical entre barras = 4px

### 2.2 Atualização de Valores

- [ ] **TC-006: `updateHP(75, 100)` atualiza largura da barra de HP para 75%**
  - Input: `current = 75`, `max = 100`
  - Expected: Barra de HP (fill) ocupa 75% de 200px = 150px de largura

- [ ] **TC-007: `updateHP(0, 100)` barra vazia (largura = 0 ou mínimo)**
  - Input: `current = 0`, `max = 100`
  - Expected: Largura = 0 (ou 1px mínimo para visibilidade)

- [ ] **TC-008: `updateHP(100, 100)` barra cheia (largura = 100%)**
  - Input: `current = 100`, `max = 100`
  - Expected: Largura = 200px (100%)

- [ ] **TC-009: `updateHP(-10, 100)` valores negativos são tratados como 0**
  - Input: `current = -10`, `max = 100`
  - Expected: Largura = 0 (tratado como mínimo)

- [ ] **TC-010: `updateHP(150, 100)` current > max é tratado como 100%**
  - Input: `current = 150`, `max = 100`
  - Expected: Largura = 200px (overflow protegido)

- [ ] **TC-011: `updateMP(40, 100)` atualiza largura da barra de MP para 40%**
  - Input: `current = 40`, `max = 100`
  - Expected: Barra de MP ocupa 40%

- [ ] **TC-012: `updateXP(500, 1000)` atualiza largura da barra de XP para 50%**
  - Input: `current = 500`, `max = 1000`
  - Expected: Barra de XP ocupa 50%

- [ ] **TC-013: `updateLevel(5)` atualiza texto do nível**
  - Input: `level = 5`
  - Expected: Texto "Level: 5" visível no HUD

- [ ] **TC-014: `updateName('Aragorn')` atualiza nome do jogador**
  - Input: `name = 'Aragorn'`
  - Expected: Texto "Aragorn" exibido no topo do HUD

### 2.3 Texto das Barras

- [ ] **TC-015: Texto da barra de HP exibe "HP: 75/100"**
  - Input: `hp = 75`, `maxHp = 100`
  - Expected: Texto contém "HP: 75/100"

- [ ] **TC-016: Texto da barra de MP exibe "MP: 40/100"**
  - Input: `mp = 40`, `maxMp = 100`
  - Expected: Texto contém "MP: 40/100"

- [ ] **TC-017: Texto da barra de XP exibe "EXP: 500/1000"**
  - Input: `experience = 500`, `experienceToNext = 1000`
  - Expected: Texto contém "EXP: 500/1000" ou similar

- [ ] **TC-018: Texto é centralizado dentro da barra**
  - Input: Barra com 200px largura, texto HP
  - Expected: `text.anchor.x` configurado para centralizar no retângulo da barra

### 2.4 Animações (Lerp)

- [ ] **TC-019: Mudança de HP tem animação suave (lerp) ao longo do tempo**
  - Input: `updateHP` chamado de 100 para 50 instantaneamente
  - Steps:
    1. Chamar `updateHP(50, 100)`
    2. Render frame 1 (Δt = 16ms)
    3. Render frame 2 (Δt = 16ms)
  - Expected: Largura da barra diminui gradualmente (não snap instantâneo)

- [ ] **TC-020: Animação lerp completa após ~200ms**
  - Input: HP muda de 100 para 50
  - Steps: Avançar 200ms em frames
  - Expected: Barra estabiliza em 50% (±1px de tolerância)

- [ ] **TC-021: Múltiplas atualizações durante animação não causam glitch**
  - Input: HP muda 100→80→60→40 em 100ms
  - Steps: Chamar updateHP 4× durante animação
  - Expected: Barra anima suavemente para o valor final (40), sem saltos

- [ ] **TC-022: XP ao subir de nível: barra enche, texto pisca**
  - Input: `experience = 1200`, `experienceToNext = 1000`
  - Steps:
    1. Update com XP=1200 (level up)
    2. Novo level = 2, `experienceToNext` recalculado
  - Expected: Barra de XP atualizada proporcional ao novo level, texto de level pisca (efeito visual)

### 2.5 Visibilidade e Estado

- [ ] **TC-023: HUD invisível durante `state = 'menu'`**
  - Input: `game.state = 'menu'`
  - Expected: `hudContainer.visible === false`

- [ ] **TC-024: HUD visível durante `state = 'world'`**
  - Input: `game.state = 'world'`
  - Expected: `hudContainer.visible === true`

- [ ] **TC-025: HUD invisível durante `state = 'loading'`**
  - Input: `game.state = 'loading'`
  - Expected: `hudContainer.visible === false`

- [ ] **TC-026: HUD é destruído ao sair do mundo**
  - Input: `game.leaveWorld()`
  - Expected: Container removido do stage, children destruídos

---

## 3. Testes de Integração

### 3.1 HUD + NetworkManager

- [ ] **TC-027: `AUTH_SUCCESS` com player data inicializa HUD corretamente**
  - Setup: NetworkManager mockado, HUD não criado
  - Steps:
    1. Emitir `AUTH_SUCCESS` com `{ player: { name: 'Hero', level: 3, hp: 120, maxHp: 150, mp: 30, maxMp: 60, experience: 500, experienceToNext: 1000 } }`
    2. HUD handler processa
  - Expected: HUD criado com 3 barras, level 3, nome 'Hero'

- [ ] **TC-028: `ENTITY_UPDATE` do próprio jogador atualiza HUD**
  - Setup: HUD existente com HP=150/150
  - Steps:
    1. Emitir `ENTITY_UPDATE { entity: { id: localPlayerId, hp: 75, maxHp: 150 } }`
    2. HUD handler processa
  - Expected: Barra de HP atualiza para 50%

- [ ] **TC-029: `ENTITY_UPDATE` de entidade remota NÃO afeta HUD**
  - Setup: HUD existente
  - Steps:
    1. Emitir `ENTITY_UPDATE { entity: { id: 'other-player', hp: 50 } }`
  - Expected: HUD do jogador local permanece inalterado

- [ ] **TC-030: `ENTITY_UPDATE` com dados parciais (só HP) só atualiza HP**
  - Setup: HUD com HP=100%, MP=100%, XP=50%
  - Steps:
    1. Emitir `ENTITY_UPDATE` com apenas `{ hp: 50, maxHp: 100 }`
  - Expected: Barra de HP atualiza para 50%, MP e XP inalterados

- [ ] **TC-031: `ENTITY_UPDATE` com level up atualiza todas as barras**
  - Setup: HUD com level 1, HP 50/50, XP próximo de level up
  - Steps:
    1. Emitir `ENTITY_UPDATE` com novo level, HP/MP aumentados, XP resetado
  - Expected: Level incrementado, HP/MP bars recalculadas, XP bar mostra % do novo level

- [ ] **TC-032: Múltiplos `ENTITY_UPDATE` em rápida sucessão (30/s)**
  - Setup: HUD ativo
  - Steps:
    1. Emitir 30 `ENTITY_UPDATE` por segundo com variação de HP
  - Expected: HUD atualiza sem queda de FPS, sem memory leak

### 3.2 HUD + Game State

- [ ] **TC-033: HUD recriado ao reconectar (AUTH_SUCCESS após logout)**
  - Setup: HUD destruído, nova conexão
  - Steps:
    1. Emitir `AUTH_SUCCESS` com novos dados
  - Expected: Novo HUD criado, dados refletem novo personagem

---

## 4. Casos de Borda

- [ ] **TC-034: maxHp = 0 (divisão por zero)**
  - Input: `updateHP(50, 0)`
  - Expected: Barra tratada como 100% (cheia) ou 0%, sem divisão por zero

- [ ] **TC-035: maxMp = 0 (divisão por zero)**
  - Input: `updateMP(10, 0)`
  - Expected: Tratamento seguro, sem crash ou NaN

- [ ] **TC-036: Valores muito grandes (HP = 65535, maxHp = 65535)**
  - Input: `hp = 50000`, `maxHp = 65535`
  - Expected: Porcentagem calculada corretamente (≈76.3%)

- [ ] **TC-037: Nome do jogador muito longo (> 20 chars)**
  - Input: `name = 'ExtremelyLongPlayerNameHere'`
  - Expected: Texto truncado com "..." ou font-size reduzido para caber

- [ ] **TC-038: Resolução muito baixa (800×600)**
  - Input: Screen resize para 800×600
  - Expected: HUD visível, não cortado, proporcional

- [ ] **TC-039: Resolução ultra-wide (3440×1440)**
  - Input: Screen 3440×1440
  - Expected: HUD no canto, legível, sem esticar

- [ ] **TC-040: HUD com valores NaN**
  - Input: `updateHP(NaN, 100)`
  - Expected: Tratamento seguro, barra não atualiza (valor anterior mantido) ou mostra 0

- [ ] **TC-041: HUD com valores undefined/null**
  - Input: `updateHP(undefined, 100)`
  - Expected: Tratamento seguro, barra mantém estado anterior

- [ ] **TC-042: Atualizações frequentes não causam memory leak (text objects)**
  - Input: 1000 atualizações de HP
  - Expected: Número de objetos no container não cresce (reutiliza Text/Graphics)

---

## 5. E2E Tests

- [ ] **TC-043: Jogador toma dano de monstro → HUD reflete redução de HP**
  - Setup: Cliente conectado, monstro ataca jogador
  - Steps:
    1. Jogador entra no aggroRange do monstro
    2. Monstro ataca jogador
    3. Servidor envia `ENTITY_UPDATE` com HP reduzido
    4. Cliente recebe e HUD atualiza
  - Expected: Barra de HP diminui proporcionalmente, texto "HP: X/Y" atualizado

- [ ] **TC-044: Jogador ganha XP → barra de XP enche → level up**
  - Setup: Cliente no mundo, monstro morre
  - Steps:
    1. Jogador mata monstro
    2. Servidor envia `ENTITY_UPDATE` com novo XP e possivelmente level up
    3. HUD atualiza barra de XP
    4. Se level up: level texto incrementa, HP/MP bars recalculam
  - Expected: Feedback visual completo de progressão

---

## 6. Regressão

- Testes de Game.ts (cliente) — HUD integrado ao state machine do Game
- Testes de NetworkManager (`network-manager.test.ts`) — eventos ENTITY_UPDATE e AUTH_SUCCESS
- Testes de Player (`player.test.ts`) — toJSON() inclui hp, mp, xp, experience
- Testes de CombatSystem — dano causa ENTITY_UPDATE que HUD processa
- Testes de MenuScreen — HUD é destruído ao voltar ao menu

---

## 7. Mocking Strategy

### O que mockar
- **PixiJS Application**: Mockar `app.stage` e `app.screen` para testar posicionamento
- **NetworkManager**: Mockar eventos `on()` para simular packets
- **Ticker**: Mockar `app.ticker.add()` e `deltaMS` para testar animações lerp

### O que NÃO mockar
- **PixiJS Graphics/Text**: Usar implementação real (ou jsdom + pixi.js headless)
- **Cálculos de porcentagem**: Testar com valores reais

---

## 8. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 26 | 10h |
| Integration | 7 | 6h |
| Casos de Borda | 9 | 4h |
| E2E | 2 | 4h |
| **Total** | **44** | **24h** |
