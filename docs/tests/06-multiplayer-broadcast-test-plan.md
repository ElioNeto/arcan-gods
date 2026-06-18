# Plano de Testes: Broadcast Multi-Player

**Feature ID:** P0.6
**Dependências:** P0.3 (Movimento), P0.5 (Colisão), Server WebSocket existente

---

## 1. Escopo

### O que será testado
- Jogador se move → todos no mesmo mapa recebem `PLAYER_MOVED`
- Jogador entra no mapa → outros recebem `ENTITY_UPDATE` ou `WORLD_STATE`
- Jogador sai do mapa (desconecta/muda de mapa) → outros recebem `ENTITY_REMOVE`
- Não enviar packet para o próprio jogador (já tem confirmação individual)
- Broadcast seletivo: apenas entidades no `VIEW_RANGE` do jogador
- Broadcasting de mudanças de estado (HP, level up, etc)
- Gerenciamento de array de sockets por mapa

### O que NÃO será testado
- Interpolação de movimento (P0.4)
- Colisão (P0.5)
- Portais e troca de mapas (P1.2)
- Chat broadcast (já implementado)

---

## 2. Testes Unitários

### 2.1 BroadcastService

- [ ] **TC-001: `broadcastToMap(mapId, packet)` envia para todos no mapa**
  - Input: `mapId = 'lorencia'`, `packet = { type: 'PLAYER_MOVED', ... }`
  - Expected: Todos os sockets de players em lorencia recebem o packet

- [ ] **TC-002: `broadcastToMap(mapId, packet, excludeIds)` exclui jogadores específicos**
  - Input: `excludeIds = ['player-1']`
  - Expected: Todos recebem exceto player-1

- [ ] **TC-003: `broadcastToMap()` com mapa vazio não lança erro**
  - Input: `mapId = 'empty_map'` sem jogadores
  - Expected: Nenhum envio, sem erro

- [ ] **TC-004: `broadcastToMap()` com mapa inexistente**
  - Input: `mapId = 'nonexistent'`
  - Expected: Log de aviso, sem erro

- [ ] **TC-005: `sendToPlayer(playerId, packet)` envia para jogador específico**
  - Input: `playerId = 'player-1'`, packet qualquer
  - Expected: Socket do player-1 recebe

- [ ] **TC-006: `sendToPlayer()` com player offline não lança erro**
  - Input: `playerId` de jogador desconectado
  - Expected: Log de aviso, sem envio

### 2.2 Gerenciamento de Escuta por Mapa

- [ ] **TC-007: `registerPlayerInMap(playerId, mapId)` adiciona ao mapa**
  - Input: `playerId = 'p1'`, `mapId = 'lorencia'`
  - Expected: `getPlayersInMap('lorencia')` contém p1

- [ ] **TC-008: `unregisterPlayerFromMap(playerId, mapId)` remove do mapa**
  - Input: p1 em lorencia, depois remove
  - Expected: `getPlayersInMap('lorencia')` não contém p1

- [ ] **TC-009: Player só pode estar em 1 mapa por vez**
  - Input: p1 registrado em lorencia, registrar em devias
  - Expected: p1 removido de lorencia, adicionado em devias (ou erro)

- [ ] **TC-010: `getAllPlayersInMap(mapId)` retorna lista correta**
  - Input: 5 players em lorencia, 3 em devias
  - Expected: `getAllPlayersInMap('lorencia')` retorna 5

### 2.3 Broadcast por VIEW_RANGE

- [ ] **TC-011: `broadcastToNeighbors(entity, packet, range)` envia só para quem está perto**
  - Input: Player em (100,100), range=15 tiles (480px)
  - Expected: Apenas players com distância ≤ 480px recebem

- [ ] **TC-012: `broadcastToNeighbors()` exclui entidade fonte**
  - Input: Entidade fonte = player-1
  - Expected: player-1 não recebe o broadcast

- [ ] **TC-013: Player fora do range não recebe broadcast**
  - Input: Player em (0,0), outro em (500,500), range=15 tiles
  - Expected: Player distante não recebe

- [ ] **TC-014: Range 0 envia para ninguém (apenas fonte excluída)**
  - Input: range=0
  - Expected: Ninguém recebe

- [ ] **TC-015: Range negativo trata como 0 ou ignorado**
  - Input: range=-1
  - Expected: Nenhum broadcast ou erro tratado

### 2.4 Eventos de Entrada/Saída

- [ ] **TC-016: `onPlayerEnterMap(player)` envia WORLD_STATE para o novo jogador**
  - Input: player entra em lorencia
  - Expected: player recebe `WORLD_STATE` com entidades do mapa

- [ ] **TC-017: `onPlayerEnterMap(player)` envia ENTITY_UPDATE para os outros**
  - Input: player entra em lorencia
  - Expected: Outros em lorencia recebem `ENTITY_UPDATE` com dados do novo player

- [ ] **TC-018: `onPlayerLeaveMap(player)` envia ENTITY_REMOVE para os outros**
  - Input: player sai de lorencia
  - Expected: Outros em lorencia recebem `ENTITY_REMOVE { id: player.id }`

- [ ] **TC-019: `onPlayerLeaveMap()` não envia ENTITY_REMOVE para o próprio**
  - Input: player saindo
  - Expected: player não recebe ENTITY_REMOVE próprio

- [ ] **TC-020: `onPlayerDisconnect()` faz broadcast de ENTITY_REMOVE para o mapa**
  - Input: player desconecta abruptamente
  - Expected: `onPlayerLeaveMap` executado, outros notificados

### 2.5 Broadcast de Estado

- [ ] **TC-021: `broadcastEntityUpdate(entity, excludeId)` envia ENTITY_UPDATE**
  - Input: entity com HP alterado
  - Expected: ENTITY_UPDATE com novos valores enviado para o mapa (excluindo fonte)

- [ ] **TC-022: Atualizações frequentes (> 10/s) são rate-limited ou coalescidas**
  - Input: 20 mudanças de HP em 1 segundo
  - Expected: Apenas últimas N por segundo enviadas ou coalescidas

- [ ] **TC-023: `broadcastEntityUpdate()` com entidade sem mapa associado é ignorada**
  - Input: entidade com `mapId = null`
  - Expected: Nenhum broadcast, log de erro

---

## 3. Testes de Integração

### 3.1 Broadcast + Movement

- [ ] **TC-024: Player move → todos no mapa recebem PLAYER_MOVED (exceto source)**
  - Setup: 3 players em lorencia
  - Steps:
    1. Player A move 1 tile
    2. Servidor processa movimento
    3. BroadcastService envia PLAYER_MOVED para mapa
  - Expected: Players B e C recebem PLAYER_MOVED, A não recebe (já confirmou)

- [ ] **TC-025: Apenas players no VIEW_RANGE do source recebem movimento**
  - Setup: 3 players: A (100,100), B (105,100), C (1000,100)
  - Steps:
    1. A move
  - Expected: B recebe, C não (fora de range)

### 3.2 Broadcast + World

- [ ] **TC-026: Novo jogador conecta → outros recebem ENTITY_UPDATE**
  - Setup: 2 players já em lorencia
  - Steps:
    1. Player C conecta e autentica
    2. World.addPlayer(C)
    3. BroadcastService.notifyPlayerEnter(C)
  - Expected: A e B recebem ENTITY_UPDATE com dados de C

- [ ] **TC-027: Jogador desconecta → outros recebem ENTITY_REMOVE**
  - Setup: 3 players no mapa
  - Steps:
    1. Player A desconecta
    2. Server.handleDisconnect()
  - Expected: B e C recebem ENTITY_REMOVE { id: A.id }

- [ ] **TC-028: Reconexão do mesmo jogador não duplica entidade**
  - Setup: Player A desconecta e reconecta rapidamente
  - Steps:
    1. A sai
    2. A entra novamente
  - Expected: ENTITY_REMOVE não enviado se A já foi removido, ENTITY_UPDATE enviado na entrada

### 3.3 Broadcast + GameEngine Tick

- [ ] **TC-029: Tick do GameEngine broadcasta atualizações de monstros**
  - Setup: GameEngine rodando com BroadcastService
  - Steps:
    1. Tick executa
    2. Monstro que mudou de posição/estado é broadcastado
  - Expected: ENTITY_UPDATE enviado para players no mapa do monstro

- [ ] **TC-030: Tick não broadcasta se nada mudou**
  - Setup: Nenhuma entidade alterada
  - Steps:
    1. Tick executa
  - Expected: Nenhum pacote de broadcast enviado

---

## 4. Casos de Borda

- [ ] **TC-031: 100 jogadores no mesmo mapa — broadcast não causa flooding**
  - Setup: 100 jogadores em lorencia
  - Steps:
    1. Um jogador move
    2. Broadcast para 99 outros
  - Expected: Todos recebem, latência aceitável, sem crash

- [ ] **TC-032: Jogador move-se muito rápido (muda de VIEW_RANGE rapidamente)**
  - Input: Player atravessando vários tiles por tick
  - Expected: Broadcast correto para novos vizinhos, stop para antigos

- [ ] **TC-033: Jogador sai do mapa durante broadcast**
  - Input: Broadcast em andamento, jogador alvo desconecta no meio
  - Expected: Socket close tratado, sem crash no servidor

- [ ] **TC-034: Broadcast para si mesmo é explicitamente bloqueado**
  - Input: broadcastToMap com excludeIds contendo source
  - Expected: source não recebe

- [ ] **TC-035: Socket do jogador está fechado (null) durante broadcast**
  - Input: player.socketId = null mas player ainda no mapa
  - Expected: Broadcast ignora, log de aviso

- [ ] **TC-036: Mapa com 0 jogadores — broadcast é NO-OP**
  - Input: broadcastToMap('empty_map', packet)
  - Expected: Nenhum envio, sem erro

---

## 5. E2E Tests

- [ ] **TC-037: 3 jogadores no mesmo mapa: movimento de um é visto pelos outros**
  - Setup: 3 clientes conectados, todos em lorencia
  - Steps:
    1. Cliente A clica para mover
    2. Servidor broadcasta PLAYER_MOVED
    3. Clientes B e C recebem e interpolação mostra movimento
  - Expected: Todos veem A mover-se em tempo real

- [ ] **TC-038: Jogador entra no mapa e vê jogadores existentes**
  - Setup: Cliente A já em lorencia, Cliente B conecta
  - Steps:
    1. B autentica e entra no mundo
    2. B recebe WORLD_STATE com A
    3. A recebe ENTITY_UPDATE com B
  - Expected: Ambos se veem no mapa

- [ ] **TC-039: Jogador desconecta e desaparece da tela dos outros**
  - Setup: 2 jogadores no mapa
  - Steps:
    1. A fecha o cliente
    2. Servidor detecta close
    3. B recebe ENTITY_REMOVE
  - Expected: Personagem de A some da tela de B

---

## 6. Regressão

- Testes de World (`world.test.ts`) — gerenciamento de players por mapa
- Testes de Movimento (plano #03) — broadcast integrado ao movimento
- Testes de Server WebSocket (plano #03-server-websocket) — conexões gerenciadas
- Testes de Game.ts (cliente) — handlers de ENTITY_UPDATE/REMOVE existentes

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 23 | 10h |
| Integration | 7 | 6h |
| Casos de Borda | 6 | 3h |
| E2E | 3 | 5h |
| **Total** | **39** | **24h** |
