# Plano de Testes: Client Combat Feedback

**Feature ID:** P0.3
**Issue:** (novo) — Damage Numbers + Health Bars sobre Monstros
**Dependências:** P0.1 (Monster AI), P0.2 (HUD Básico)
**Estimativa Total:** 20 testes + 2 integração + 2 E2E

---

## 1. Escopo

### O que será testado
- **Damage Numbers**: Texto flutuante que aparece ao causar dano, anima para cima e fade out em 1-2s
- **Health Bars sobre monstros**: Barra de HP vermelha acima de cada monstro, atualizada via `ENTITY_UPDATE`
- Posicionamento: damage numbers acima do alvo, health bars acima do sprite do monstro
- Cores: damage numbers em branco/vermelho (crítico em amarelo), health bar vermelha com fundo escuro
- Pooling/reutilização de objetos de texto para performance
- Remoção automática após animação completar
- Apenas monstros visíveis (dentro da câmera, não off-screen)
- Health bars opcionais: só no monstro alvo ou em todos (conforme design)
- Recebimento de `ENTITY_DAMAGED` e `ENTITY_UPDATE` packets

### O que NÃO será testado
- HUD do jogador (já coberto no plano #11)
- Cálculo de dano (já testado em damage-formulas e CombatSystem)
- Monster AI (já coberto no plano #10)
- Efeitos visuais de skills (#52)
- Som/música (não implementado)
- Partículas ou VFX (futuro)

---

## 2. Testes Unitários

### 2.1 DamageNumbers — Criação e Animação

- [ ] **TC-001: `DamageNumber.create(damage, x, y)` cria Text no container**
  - Input: `damage = 42`, `x = 100`, `y = 200`
  - Expected: Text com `text = '42'` adicionado ao container de damage numbers

- [ ] **TC-002: Damage number com cor padrão (branco) para dano normal**
  - Input: `damage = 42`, `isCritical = false`
  - Expected: Text com `fill = 0xffffff` (branco)

- [ ] **TC-003: Damage number crítico em amarelo**
  - Input: `damage = 99`, `isCritical = true`
  - Expected: Text com `fill = 0xffff00` (amarelo) e talvez '!' ou tamanho maior

- [ ] **TC-004: Damage número anima para cima (offsetY negativo) ao longo do tempo**
  - Input: Damage number criado em (100, 200)
  - Steps:
    1. Frame 0: y = 200
    2. Frame 1 (Δt=16ms): y = 198
    3. Frame 60 (Δt=960ms): y ≈ 140 (60px para cima)
  - Expected: Posição Y diminui (sobe) gradualmente

- [ ] **TC-005: Damage number faz fade out (alpha diminui)**
  - Input: Damage number com alpha=1.0
  - Steps:
    1. Frame 0: alpha = 1.0
    2. Frame 30 (Δt=500ms): alpha ≈ 0.5
    3. Frame 60 (Δt=1000ms): alpha ≈ 0.0
  - Expected: Alpha diminui linearmente até 0

- [ ] **TC-006: Damage number é removido após animação completar (~1-2s)**
  - Input: Damage number criado
  - Steps: Avançar 2000ms
  - Expected: Text removido do container, não mais renderizado

- [ ] **TC-007: Damage number é removido mesmo se jogo fica paused**
  - Input: Damage number criado, animation duration = 1500ms
  - Steps:
    1. Avançar 1000ms
    2. Pausar (delta = 0) por 5000ms
    3. Avançar 1000ms
  - Expected: Damage number removido após total de 1500ms animados (não tempo real)

### 2.2 DamageNumbers — Pooling e Performance

- [ ] **TC-008: Text objects são reutilizados (pooling) para evitar garbage collection**
  - Input: 50 damage numbers criados e removidos
  - Steps: Verificar contagem de Text objects criados
  - Expected: Pool recicla objetos, criação total < 10-15 objetos (não 50)

- [ ] **TC-009: Pool tem tamanho máximo configurável**
  - Input: `DAMAGE_NUMBER_POOL_SIZE = 20`
  - Steps: Criar 30 damage numbers simultaneamente
  - Expected: Apenas 20 objetos no pool, excedentes são criados (ou descartados conforme design)

- [ ] **TC-010: Múltiplos damage numbers simultâneos não sobrepõem (offset vertical)**
  - Input: 5 damage numbers na mesma posição (x, y) no mesmo frame
  - Expected: Cada um tem offsetY diferente (ex: -10, -20, -30, -40, -50)

### 2.3 Monster Health Bars — Criação e Atualização

- [ ] **TC-011: `HealthBar.create(monsterId)` cria barra acima do monstro**
  - Input: `monsterId = 'monster-1'`, monstro em (100, 100)
  - Expected: Barra (Graphics) posicionada em (100, 88) — 12px acima do monstro

- [ ] **TC-012: Health bar tem fundo escuro e fill vermelho**
  - Input: Health bar criada
  - Expected: Dois Graphics: bg escuro (0x333333) e fill vermelho (0xff4444)

- [ ] **TC-013: `updateHealthBar(monsterId, hp, maxHp)` atualiza largura do fill**
  - Input: Health bar com 32px largura, `hp = 30`, `maxHp = 50`
  - Expected: Fill ocupa 60% = 19.2px (arredondado)

- [ ] **TC-014: `updateHealthBar()` com hp = 0 mostra barra vazia**
  - Input: `hp = 0`, `maxHp = 50`
  - Expected: Fill com largura = 0 (ou 1px mínimo)

- [ ] **TC-015: `updateHealthBar()` com hp = maxHp mostra barra cheia**
  - Input: `hp = 50`, `maxHp = 50`
  - Expected: Fill com largura = 100%

- [ ] **TC-016: Health bar segue o monstro (atualiza posição se monstro move)**
  - Input: Monstro move de (100,100) para (105,100)
  - Steps: `updateHealthBarPosition('monster-1', 105, 100)`
  - Expected: Barra posicionada em (105, 88)

- [ ] **TC-017: Health bar é removida quando monstro morre**
  - Input: Monstro morre, `ENTITY_REMOVE` recebido
  - Steps: Handler remove health bar
  - Expected: Health bar removida do container, objeto retornado ao pool

- [ ] **TC-018: Health bar opcional (só no monstro alvo)**
  - Input: Config `HEALTH_BARS_ON_TARGET_ONLY = true`
  - Steps: 3 monstros visíveis, jogador ataca 1
  - Expected: Apenas monstro atacado tem health bar visível

- [ ] **TC-019: Health bars em todos os monstros (configurável)**
  - Input: Config `HEALTH_BARS_ON_TARGET_ONLY = false`
  - Steps: 3 monstros visíveis
  - Expected: Todos têm health bars visíveis

- [ ] **TC-020: Health bar é oculta se monstro está fora da tela (culling)**
  - Input: Monstro fora do viewport da câmera
  - Expected: Health bar com `visible = false` (não renderizada)

---

## 3. Testes de Integração

### 3.1 Combat Feedback + NetworkManager

- [ ] **TC-021: `ENTITY_DAMAGED` cria damage number na posição do alvo**
  - Setup: NetworkManager mockado, entidade alvo em (150, 200)
  - Steps:
    1. Emitir `ENTITY_DAMAGED { targetId: 'monster-1', damage: 42, isCritical: false, ... }`
    2. Handler processa
  - Expected: Damage number '42' criado em (150, 200), cor branca

- [ ] **TC-022: `ENTITY_DAMAGED` com isCritical=true cria damage number amarelo**
  - Input: `ENTITY_DAMAGED { targetId: 'monster-1', damage: 99, isCritical: true }`
  - Expected: Damage number '99' em amarelo, possivelmente com fonte maior

- [ ] **TC-023: `ENTITY_UPDATE` atualiza health bar do monstro**
  - Setup: Health bar existente para 'monster-1'
  - Steps:
    1. Emitir `ENTITY_UPDATE { entity: { id: 'monster-1', hp: 20, maxHp: 50 } }`
  - Expected: Health bar de 'monster-1' atualizada para 40%

- [ ] **TC-024: `ENTITY_REMOVE` remove health bar do monstro**
  - Setup: Health bar existente para 'monster-1'
  - Steps:
    1. Emitir `ENTITY_REMOVE { id: 'monster-1' }`
  - Expected: Health bar removida do container

- [ ] **TC-025: `ENTITY_DAMAGED` sem entidade alvo no cliente é ignorado**
  - Setup: Alvo não renderizado no cliente (fora do view range)
  - Steps:
    1. Emitir `ENTITY_DAMAGED` para entidade desconhecida
  - Expected: Nenhum damage number criado, log de aviso

### 3.2 Combat Feedback + Game Loop

- [ ] **TC-026: Game tick atualiza animações de damage numbers**
  - Setup: Damage number criado, game loop rodando
  - Steps:
    1. Tick do game loop executa
  - Expected: Damage number move para cima, alpha diminui

- [ ] **TC-027: Game tick atualiza posição das health bars com movimento do monstro**
  - Setup: Monstro com health bar, monstro movendo via interpolação
  - Steps:
    1. Tick executa update de posição
  - Expected: Health bar segue posição interpolada do monstro

---

## 4. Casos de Borda

- [ ] **TC-028: Dano = 0 (block/miss) — mostrar "0" ou "BLOCK"**
  - Input: `damage = 0`, `isBlocked = true`
  - Expected: Texto "BLOCK" ou "0" em cor cinza/clara

- [ ] **TC-029: Dano negativo (cura) — mostrar em verde**
  - Input: `damage = -50` (healing)
  - Expected: Damage number em verde (#44ff44) com '+' sinal: "+50"

- [ ] **TC-030: Múltiplos danos no mesmo frame (combo rápido)**
  - Input: 3 `ENTITY_DAMAGED` no mesmo frame para mesmo alvo
  - Expected: 3 damage numbers com offsets Y diferentes, todos animando

- [ ] **TC-031: Dano > 9999 (5 dígitos) — texto não cortado**
  - Input: `damage = 12345`
  - Expected: Texto "12345" completamente visível, sem truncar

- [ ] **TC-032: Health bar com valores NaN ou negativos**
  - Input: `hp = NaN` ou `hp = -10`
  - Expected: Tratado como 0 ou valor anterior mantido, sem crash

- [ ] **TC-033: Performance: 50 monstros visíveis com health bars**
  - Input: 50 monstros, todos com health bars
  - Steps: Tick do game loop
  - Expected: FPS mantido acima de 30, sem lag perceptível

- [ ] **TC-034: Performance: 20 damage numbers simultâneos**
  - Input: 20 damage numbers criados no mesmo frame
  - Expected: Todos animam corretamente, sem queda de FPS

- [ ] **TC-035: Damage number com duração configurável**
  - Input: `DAMAGE_NUMBER_DURATION = 3000`
  - Expected: Damage number leva 3s para sumir (vs default 1-2s)

---

## 5. E2E Tests

- [ ] **TC-036: Jogador ataca monstro → damage number aparece sobre o monstro**
  - Setup: Servidor rodando, cliente conectado, monstro próximo
  - Steps:
    1. Jogador ataca monstro (PLAYER_ATTACK)
    2. Servidor processa dano, envia ENTITY_DAMAGED
    3. Cliente recebe ENTITY_DAMAGED
    4. Damage number criado na posição do monstro
    5. Número flutua para cima e fade out após 1-2s
  - Expected: Feedback visual completo de dano

- [ ] **TC-037: Monstro toma dano → health bar atualiza → monstro morre → barra some**
  - Setup: Cliente conectado, monstro com HP visível
  - Steps:
    1. Jogador ataca monstro repetidamente
    2. Entity_UPDATE atualiza health bar a cada golpe
    3. Último golpe mata monstro
    4. ENTITY_DAMAGED com killed=true
    5. ENTITY_REMOVE enviado
    6. Health bar removida
  - Expected: Health bar diminui proporcionalmente até 0, depois some

---

## 6. Regressão

- Testes de Game.ts (cliente) — handlers de ENTITY_DAMAGED, ENTITY_UPDATE, ENTITY_REMOVE
- Testes de NetworkManager (`network-manager.test.ts`) — eventos de rede
- Testes de PlaceholderGraphics — containers de monstros usados como referência
- Testes de CombatSystem (`combat-system.test.ts`) — geração de ENTITY_DAMAGED
- Testes de Monster AI (plano #10) — monstros vivos são necessários

---

## 7. Mocking Strategy

### O que mockar
- **PixiJS Application/Stage**: Mockar para testar criação de Text/Graphics sem render real
- **NetworkManager**: Mockar eventos `on()` para simular packets
- **Game.worldContainer**: Mockar para verificar adição/remoção de children
- **Camera**: Mockar viewport para testar culling

### O que NÃO mockar
- **PixiJS Text e Graphics**: Usar implementação real para testar posicionamento, cor, alpha
- **Lógica de animação**: Testar com ticker mockado mas lógica real
- **Pooling**: Testar com implementação real de objeto pool

---

## 8. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 20 | 8h |
| Integration | 7 | 5h |
| Casos de Borda | 8 | 4h |
| E2E | 2 | 4h |
| **Total** | **37** | **21h** |
