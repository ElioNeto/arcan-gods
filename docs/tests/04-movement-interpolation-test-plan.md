# Plano de Testes: Interpolação de Movimento (Cliente)

**Feature ID:** P0.4
**Issue:** #11
**Dependências:** P0.3 (Movimento Server-Authoritative)

---

## 1. Escopo

### O que será testado
- Smooth movement entre posições recebidas do servidor (interpolação linear)
- Buffer de posições (position buffer) para suavizar variações de latência
- Dead reckoning: estimar posição atual entre updates do servidor
- Tratamento de pacotes atrasados (late packets): descartar ou corrigir
- Correção de posição quando servidor envia update divergente
- Snap (correção brusca) vs lerp (correção suave) em caso de diferença grande
- Interpolação visual apenas para entidades remotas (outros players/monsters)
- Player local usa posição confirmada pelo servidor (sem interpolação)

### O que NÃO será testado
- Movimento server-side (será P0.3)
- Broadcast de posições (será P0.6)
- Colisão visual no cliente (será P0.5)

---

## 2. Testes Unitários

### 2.1 MovementInterpolator

- [ ] **TC-001: `pushPosition(entityId, x, y, timestamp)` adiciona ao buffer**
  - Input: `entityId = 'player-1'`, `x=100, y=100, timestamp=1000`
  - Expected: Buffer contém 1 entrada para player-1

- [ ] **TC-002: `getInterpolatedPosition(entityId, now)` retorna posição entre 2 pontos**
  - Input: Buffer com posições em t=1000 (x=100) e t=1100 (x=110), consulta em t=1050
  - Expected: `x ≈ 105` (50% do caminho)

- [ ] **TC-003: `getInterpolatedPosition()` sem buffer retorna null**
  - Input: entityId nunca visto
  - Expected: `null` ou undefined

- [ ] **TC-004: `getInterpolatedPosition()` com 1 entrada apenas retorna essa posição**
  - Input: Buffer com 1 posição em t=1000
  - Expected: Posição fixa (parado)

- [ ] **TC-005: Interpolação linear entre (100,100) e (200,100) em t**
  - Input: P1=(100,100)@t=0, P2=(200,100)@t=1000, consulta t=500
  - Expected: `{ x: 150, y: 100 }`

- [ ] **TC-006: Interpolação diagonal entre (0,0) e (100,100)**
  - Input: P1=(0,0)@t=0, P2=(100,100)@t=1000, consulta t=250
  - Expected: `{ x: 25, y: 25 }`

### 2.2 Position Buffer

- [ ] **TC-007: Buffer mantém máximo de N entradas (evitar memory leak)**
  - Input: 1000 entradas para mesma entidade, `maxBufferSize = 20`
  - Expected: Buffer tem no máximo 20 entradas

- [ ] **TC-008: Entradas antigas são removidas do buffer (TTL)**
  - Input: Entradas com timestamp > 2000ms atrás
  - Expected: Removidas na próxima limpeza

- [ ] **TC-009: Buffer aceita entradas fora de ordem (reorder)**
  - Input: Push t=1100, depois t=1000
  - Expected: Buffer ordena por timestamp

- [ ] **TC-010: Buffer com timestamps idênticos mantém ambas ou substitui**
  - Input: Push t=1000 (x=100), push t=1000 (x=105)
  - Expected: Substitui ou mantém a mais recente (sem crash)

- [ ] **TC-011: Limpeza do buffer (`clear()`) remove todas entradas**
  - Input: Buffer com 10 entradas
  - Steps: `buffer.clear('player-1')`
  - Expected: Buffer vazio para player-1

### 2.3 Dead Reckoning

- [ ] **TC-012: `estimateCurrentPosition(entityId, now)` extrapola entre último update e now**
  - Input: Última posição (100,100)@t=1000, velocidade 1 tile/100ms
  - Steps: Chamar em t=1050
  - Expected: `(105, 100)`

- [ ] **TC-013: Dead reckoning cessa se não há updates recentes (> timeout)**
  - Input: Último update há 5000ms (timeout = 2000ms)
  - Expected: `estimateCurrentPosition` retorna última posição conhecida (parado)

- [ ] **TC-014: Velocidade de dead reckoning é baseada no intervalo entre os 2 últimos updates**
  - Input: P1=(0,0)@t=0, P2=(10,0)@t=1000 → velocidade = 10 tiles/s
  - Expected: Estimativa em t=1200 = (12, 0)

### 2.4 Correção de Posição (Snap vs Lerp)

- [ ] **TC-015: Diferença pequena (< threshold) → lerp suave**
  - Input: Servidor envia update com posição 5 tiles diferente da prevista
  - Expected: Transição suave em vez de snap

- [ ] **TC-016: Diferença grande (≥ threshold) → snap direto**
  - Input: Servidor envia update com posição 50 tiles diferente
  - Expected: Snap instantâneo para nova posição

- [ ] **TC-017: Threshold configurável (`SNAP_THRESHOLD = 10 tiles`)**
  - Input: Config com threshold = 10 tiles
  - Expected: 9 tiles → lerp, 10 tiles → snap

- [ ] **TC-018: Snap gera evento `ENTITY_SNAPPED` para uso por sistemas visuais**
  - Input: Snap ocorre
  - Expected: Evento emitido com entityId, oldPos, newPos

### 2.5 Late Packet Handling

- [ ] **TC-019: Pacote com timestamp anterior ao último processado é ignorado**
  - Input: Buffer tem t=2000, chega pacote com t=1500
  - Expected: Pacote descartado (já obsoleto)

- [ ] **TC-020: Pacote com timestamp igual ao último é ignorado (duplicata)**
  - Input: Mesmo timestamp e posição
  - Expected: Duplicata ignorada

- [ ] **TC-021: Pacote com timestamp muito futuro (> 1000ms à frente) é rejeitado**
  - Input: `serverTime = 5000`, pacote com `timestamp = 7000`
  - Expected: Rejeitado como inválido (possível cheat)

### 2.6 Interpolação por Tipo de Entidade

- [ ] **TC-022: Player local NÃO é interpolado (usa posição exata do servidor)**
  - Input: `entityId === localPlayerId`
  - Expected: `getInterpolatedPosition` retorna última posição exata (sem lerp)

- [ ] **TC-023: Outros players são interpolados**
  - Input: `entityId = 'other-player'`
  - Expected: Interpolação entre pontos do buffer

- [ ] **TC-024: Monsters são interpolados**
  - Input: `entityId = 'monster-1'`
  - Expected: Interpolação normal

- [ ] **TC-025: NPCs (parados) não são interpolados (só 1 posição)**
  - Input: NPC com só 1 entrada no buffer
  - Expected: Posição fixa retornada

---

## 3. Testes de Integração

### 3.1 Interpolator + NetworkManager

- [ ] **TC-026: `PLAYER_MOVED` packet alimenta o buffer de interpolação**
  - Setup: NetworkManager + Interpolator ligados
  - Steps:
    1. Servidor envia `PLAYER_MOVED { id, x, y }`
    2. NetworkManager emite evento
    3. Handler chama `interpolator.pushPosition(id, x, y)`
  - Expected: Buffer populado

- [ ] **TC-027: `WORLD_STATE` inicial popula buffer com posições de todas entidades**
  - Setup: Cliente recebe WORLD_STATE ao entrar
  - Steps:
    1. WORLD_STATE chega com 5 entidades
  - Expected: Cada entidade tem 1 entrada no buffer

- [ ] **TC-028: ENTITY_REMOVE limpa buffer da entidade removida**
  - Setup: Entidade no buffer
  - Steps:
    1. ENTITY_REMOVE recebido
  - Expected: Buffer daquela entidade é limpo

### 3.2 Interpolator + Game Loop (Cliente)

- [ ] **TC-029: `update(deltaTime)` atualiza posição visual de todas entidades**
  - Setup: Game loop rodando a 60 FPS, entidades no buffer
  - Steps:
    1. `game.update()` chamado ~16ms
  - Expected: Posições visuais atualizadas via interpolação

- [ ] **TC-030: Latência de 200ms simulada não quebra interpolação**
  - Setup: Simular latência de rede de 200ms
  - Steps:
    1. Servidor envia posições
    2. Atraso de 200ms antes de entrar no buffer
  - Expected: Movimento visual contínuo, sem travamentos

- [ ] **TC-031: Perda de pacote (1 de 3) não causa snap**
  - Setup: 3 pacotes enviados, 1 perdido
  - Steps:
    1. Pacotes t=1000, t=1200 recebidos (t=1100 perdido)
  - Expected: Interpolação suave entre t=1000 e t=1200

---

## 4. Casos de Borda

- [ ] **TC-032: Entidade teletransportada (grande diferença entre updates)**
  - Input: P1=(100,100)@t=1000, P2=(5000,5000)@t=1100
  - Expected: Snap em vez de interpolação lenta

- [ ] **TC-033: Muitas entidades no buffer (50+) não causa queda de FPS**
  - Input: 50 entidades, cada uma com 10 posições no buffer
  - Expected: `update()` completa em < 2ms

- [ ] **TC-034: Clock do cliente e servidor dessincronizados**
  - Input: Server timestamp 1000, client clock 1500
  - Expected: Interpolação usa diff clock para normalizar

- [ ] **TC-035: Entidade nunca recebe update (offline) — buffer vazio**
  - Input: entityId sem nenhum push
  - Expected: `getInterpolatedPosition` retorna null

- [ ] **TC-036: Renderiza posição visual negativa ou fora da tela**
  - Input: Entidade move para (-100, -100)
  - Expected: Interpolação funciona, mas visualmente fora da tela (câmera gerencia)

---

## 5. E2E Tests

- [ ] **TC-037: Jogador vê outro jogador movendo suavemente em tempo real**
  - Setup: 2 clientes conectados ao mesmo servidor, mesmo mapa
  - Steps:
    1. Cliente A move personagem para destino distante
    2. Servidor calcula path e envia PLAYER_MOVED a cada tick
    3. Cliente B recebe updates e interpola
  - Expected: Cliente B vê personagem de A movendo suavemente

- [ ] **TC-038: Cliente com lag de 500ms não vê snaps nem travamentos**
  - Setup: Cliente com latência artificial de 500ms
  - Steps:
    1. Mover personagem remoto
    2. Observar movimento visual
  - Expected: Movimento contínuo, sem congelamentos ou saltos

---

## 6. Regressão

- Testes de Game.ts (cliente) — update loop roda interpolação
- Testes de Camera — câmera segue posição interpolada
- Testes de NetworkManager — eventos PLAYER_MOVED alimentam buffer
- Testes de PlaceholderGraphics — containers têm posição atualizada

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 25 | 10h |
| Integration | 6 | 5h |
| Casos de Borda | 5 | 3h |
| E2E | 2 | 4h |
| **Total** | **38** | **22h** |
