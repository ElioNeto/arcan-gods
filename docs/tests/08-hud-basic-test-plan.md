# Plano de Testes: HUD Básico (HP/MP/XP)

**Feature ID:** P1.4
**Dependências:** Nenhuma (independente, paralelizável)

---

## 1. Escopo

### O que será testado
- Barra de HP (Health Points): proporcional ao maxHp, cor vermelha
- Barra de MP (Mana Points): proporcional ao maxMp, cor azul
- Barra de XP (Experience): proporcional ao XP total, cor amarela/verde
- Atualização em tempo real via packets `ENTITY_UPDATE` do servidor
- Animações de transição nas barras (suavidade)
- Texto informativo: "HP: 150/200", "MP: 50/100", "Level: 5"
- Posicionamento no canto superior esquerdo da tela
- Redimensionamento ao mudar resolução
- Ocultar durante loading/menu

### O que NÃO será testado
- Skills, inventário, ou outros elementos de UI
- Minimapa (P1.3)
- Chat (já implementado)

---

## 2. Testes Unitários

### 2.1 HUD Component

- [ ] **TC-001: `updateHP(current, max)` atualiza largura da barra de HP**
  - Input: `current = 75`, `max = 100`
  - Expected: Barra de HP ocupa 75% da largura total

- [ ] **TC-002: `updateHP(0, max)` barra vazia**
  - Input: `current = 0`, `max = 100`
  - Expected: Largura = 0 (ou mínimo visível)

- [ ] **TC-003: `updateHP(max, max)` barra cheia**
  - Input: `current = 100`, `max = 100`
  - Expected: Largura = 100%

- [ ] **TC-004: `updateHP()` com valores negativos**
  - Input: `current = -10`, `max = 100`
  - Expected: Tratado como 0 (barra vazia)

- [ ] **TC-005: `updateHP()` com current > max**
  - Input: `current = 150`, `max = 100`
  - Expected: Tratado como 100% (overflow protegido)

- [ ] **TC-006: `updateMP(current, max)` funciona analogamente ao HP**
  - Input: `current = 40`, `max = 100`
  - Expected: Barra de MP ocupa 40%

- [ ] **TC-007: `updateXP(current, max)` atualiza barra de XP**
  - Input: `current = 500`, `max = 1000`
  - Expected: Barra de XP ocupa 50%

- [ ] **TC-008: `updateLevel(level)` atualiza texto do nível**
  - Input: `level = 5`
  - Expected: Texto "Level: 5" exibido

- [ ] **TC-009: `updateName(name)` atualiza nome do jogador no HUD**
  - Input: `name = 'Aragorn'`
  - Expected: Nome exibido no HUD

### 2.2 Atualização por Pacote

- [ ] **TC-010: `handleEntityUpdate(packet)` atualiza HP/MP/XP**
  - Input: `ENTITY_UPDATE { entity: { hp: 80, maxHp: 100, mp: 30, maxMp: 60, experience: 500, experienceToNext: 1000 } }`
  - Expected: Barras de HP (80%), MP (50%), XP (50%) atualizadas

- [ ] **TC-011: `handleEntityUpdate()` com dados parciais (só HP)**
  - Input: Entity update com apenas `hp` e `maxHp`
  - Expected: Apenas barra de HP atualizada, MP e XP inalterados

- [ ] **TC-012: `handleEntityUpdate()` packet não é do próprio jogador**
  - Input: ENTITY_UPDATE com id !== localPlayerId
  - Expected: HUD ignora (não atualiza)

### 2.3 Animações

- [ ] **TC-013: Mudança de HP tem animação suave (lerp)**
  - Input: HP vai de 100 para 50 instantaneamente
  - Expected: Barra diminui gradualmente ao longo de ~200ms (não snap)

- [ ] **TC-014: Animação de dano (flash vermelho) ao perder HP**
  - Input: HP diminui
  - Expected: Barra pisca vermelho antes de atualizar

- [ ] **TC-015: Animação de XP ao subir de nível**
  - Input: `experience` ultrapassa `experienceToNext`
  - Expected: Barra de XP enche, texto de level pisca, efeito visual

### 2.4 Layout e Posicionamento

- [ ] **TC-016: HUD está no canto superior esquerdo**
  - Input: Container do HUD
  - Expected: `container.x ≈ 10`, `container.y ≈ 10`

- [ ] **TC-017: HUD redimensiona com a tela**
  - Input: Screen resize de 1920×1080 para 1280×720
  - Expected: HUD mantém proporção e posição relativa

- [ ] **TC-018: Barras têm tamanho fixo configurável (ex: 200px largura)**
  - Input: Config `BAR_WIDTH = 200`
  - Expected: Barras têm 200px de largura

- [ ] **TC-019: Texto "HP: 75/100" é exibido dentro/sobre a barra**
  - Input: HP 75/100
  - Expected: Texto visível com formato correto

### 2.5 Visibilidade

- [ ] **TC-020: HUD invisível durante tela de menu**
  - Input: `game.state === 'menu'`
  - Expected: `hudContainer.visible === false`

- [ ] **TC-021: HUD visível durante gameplay**
  - Input: `game.state === 'world'`
  - Expected: `hudContainer.visible === true`

- [ ] **TC-022: HUD invisível durante loading**
  - Input: `game.state === 'loading'`
  - Expected: `hudContainer.visible === false`

---

## 3. Testes de Integração

### 3.1 HUD + NetworkManager

- [ ] **TC-023: ENTITY_UPDATE do servidor atualiza HUD em tempo real**
  - Setup: Cliente rodando, conectado ao servidor
  - Steps:
    1. Servidor envia `ENTITY_UPDATE { id: localPlayer.id, hp: 50, maxHp: 100 }`
    2. NetworkManager emite evento
    3. HUD handler processa
  - Expected: Barra de HP atualiza para 50%

- [ ] **TC-024: AUTH_SUCCESS com player data inicializa HUD**
  - Setup: Cliente autentica
  - Steps:
    1. `AUTH_SUCCESS { player: { hp, maxHp, mp, maxMp, experience, level } }`
    2. HUD é criado com dados iniciais
  - Expected: Barras refletem estado inicial do personagem

- [ ] **TC-025: HUD não atualiza se packet é de entidade remota**
  - Setup: ENTITY_UPDATE de outro player
  - Steps:
    1. Recebe ENTITY_UPDATE com `id !== localPlayerId`
  - Expected: HUD inalterado

### 3.2 HUD + Game State

- [ ] **TC-026: HUD é destruído ao sair do mundo (voltar ao menu)**
  - Setup: Cliente no mundo, HUD visível
  - Steps:
    1. Desconectar ou voltar ao menu
  - Expected: HUD removido da cena

- [ ] **TC-027: HUD recriado ao reconectar**
  - Setup: Cliente reconecta
  - Steps:
    1. AUTH_SUCCESS recebido novamente
  - Expected: Novo HUD criado com dados atualizados

---

## 4. Casos de Borda

- [ ] **TC-028: HP máximo é 0 (divisão por zero)**
  - Input: `maxHp = 0`
  - Expected: Barra vazia, sem divisão por zero

- [ ] **TC-029: Valores muito grandes (ex: HP = 65.535)**
  - Input: `hp = 50000`, `maxHp = 65535`
  - Expected: Porcentagem calculada corretamente (≈76%)

- [ ] **TC-030: Atualizações muito frequentes (30 por segundo)**
  - Input: 30 ENTITY_UPDATE por segundo
  - Expected: HUD atualiza suavemente, sem queda de FPS

- [ ] **TC-031: HUD com resolução muito baixa (800×600)**
  - Input: Screen 800×600
  - Expected: HUD visível, não cortado, proporcional

- [ ] **TC-032: HUD com resolução ultra-wide (3440×1440)**
  - Input: Screen 3440×1440
  - Expected: HUD no canto, legível, sem esticar

- [ ] **TC-033: Nome do jogador muito longo (> 20 caracteres)**
  - Input: `name = 'VeryLongPlayerNameHere'`
  - Expected: Texto truncado ou redimensionado para caber

- [ ] **TC-034: XP ultrapassa o máximo (level up)**
  - Input: EXP = 1200, max = 1000 (deveria ter levelado)
  - Expected: Barra de XP mostra 100%, level atualizado

- [ ] **TC-035: HP ou MP = 0 (jogador morto)**
  - Input: `hp = 0`, `maxHp = 100`
  - Expected: Barra vazia, possível indicador de morte (cor cinza)

---

## 5. E2E Tests

- [ ] **TC-036: Jogador toma dano → HUD reflete redução de HP**
  - Setup: Cliente no mundo, monstro ataca jogador
  - Steps:
    1. Monstro causa dano ao jogador
    2. Servidor envia ENTITY_UPDATE com HP reduzido
    3. HUD atualiza barra de HP
  - Expected: Barra de HP diminui proporcionalmente

- [ ] **TC-037: Jogador ganha XP → barra de XP enche → level up**
  - Setup: Cliente no mundo, monstro morre
  - Steps:
    1. Monstro morre, jogador ganha XP
    2. Servidor envia ENTITY_UPDATE com novo XP
    3. Se level up, HP/MP também aumentam
  - Expected: Barra de XP atualiza, level incrementa, barras de HP/MP recalculadas

---

## 6. Regressão

- Testes de Game.ts (cliente) — HUD integrado ao state machine
- Testes de NetworkManager — eventos ENTITY_UPDATE e AUTH_SUCCESS
- Testes de Player (server) — toJSON() inclui hp, mp, xp

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 22 | 8h |
| Integration | 5 | 4h |
| Casos de Borda | 8 | 3h |
| E2E | 2 | 3h |
| **Total** | **37** | **18h** |
