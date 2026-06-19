# Requisitos — Arcan Gods

> **Status:** Atualizado · Versão 0.4 · Ciclo 04 concluído (2026-06-19) · 357 testes, 26 issues fechadas

---

## 1. Requisitos Funcionais

### 1.1 Autenticação e Conta

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-001 | Criar conta com email + senha | Alta | ✅ Ciclo 01 (WS, dev mode) |
| RF-002 | Login com credenciais | Alta | ✅ Ciclo 01 (WS, dev mode) |
| RF-003 | JWT em conexão WebSocket | Alta | ✅ Completo (#53) |
| RF-004 | Recuperar senha por email | Média | ❌ Futuro |
| RF-005 | Deletar a própria conta | Baixa | ❌ Futuro |

### 1.2 Mundo e Movimentação

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-010 | Mapa baseado em tiles | Alta | ✅ Ciclo 02 (TilemapLoader, GAME_CONSTANTS) |
| RF-011 | Movimento com pathfinding | Alta | ✅ Ciclo 02 (A* + MovementSystem) |
| RF-012 | Câmera segue jogador | Alta | ✅ Ciclo 01 (Camera.ts) |
| RF-013 | Múltiplos mapas com portais | Alta | ⚠️ Parcial (#47) |
| RF-014 | Colisão com objetos estáticos | Alta | ✅ Ciclo 02 (CollisionSystem) |
| RF-015 | Camadas de mapa | Média | ❌ Futuro |
| RF-016 | Áreas seguras vs PvP | Média | ❌ Futuro |

### 1.3 Personagem

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-020 | Múltiplos personagens por conta | Alta | ❌ Pendente (#53) |
| RF-021 | 5 classes disponíveis | Alta | ✅ Types definidos, 1 funcional (DK) |
| RF-022 | Atributos STR/AGI/ENE/VIT | Alta | ✅ Player entity + fórmulas |
| RF-023 | XP ao matar monstros | Alta | ✅ Ciclo 03 (CombatSystem) |
| RF-024 | Pontos de atributo no level up | Alta | ✅ Ciclo 03 (5 pts/nível) |
| RF-025 | HP, MP, Stamina | Alta | ✅ Completo (Ciclo 04) |
| RF-026 | Morte com perda de XP | Média | ❌ Futuro |

### 1.4 Combate

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-030 | Combate em tempo real | Alta | ✅ Ciclo 03 (CombatSystem + clique) |
| RF-031 | Dano calculado no servidor | Alta | ✅ Ciclo 03 (fórmulas server-side) |
| RF-032 | AI de monstros (aggro/chase/attack) | Alta | ✅ Completo (Ciclo 04) |
| RF-033 | Respawn de monstros | Alta | ✅ Ciclo 01 (Monster.ts) |
| RF-034 | Drop de itens, gold e XP | Alta | ⚠️ Parcial (gold/XP ok, itens #22) |
| RF-035 | PvP em áreas específicas | Média | ❌ Futuro |
| RF-036 | PK com penalidades | Baixa | ❌ Futuro |

### 1.5 Skills

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-040 | Árvore de skills única | Alta | ❌ Pendente (#52) |
| RF-041 | Hotkeys para skills | Alta | ❌ Pendente (#52) |
| RF-042 | Skills consomem MP e cooldown | Alta | ❌ Pendente (#52) |
| RF-043 | Evoluir skills com pontos | Alta | ❌ Futuro |
| RF-044 | Efeitos visuais nas skills | Média | ❌ Fatura |
| RF-045 | Buffs e debuffs | Média | ❌ Futuro |
| RF-046 | Combo skills | Baixa | ❌ Futuro |

### 1.6 Itens e Inventário

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-050 | Inventário 8x5 | Alta | ❌ Pendente (M4) |
| RF-051 | Itens com nome, tier, stats | Alta | ❌ Pendente (M4) |
| RF-052 | Categorias: weapon, armor, etc. | Alta | ⚠️ Types definidos (shared/enums) |
| RF-053 | Drop aleatório | Alta | ⚠️ Gold funciona, itens pendentes |
| RF-054 | Upgrade de itens (+15) | Alta | ❌ Pendente (M4) |
| RF-055 | Trade entre jogadores | Média | ❌ Pendente (M4) |
| RF-056 | Vender para NPC | Média | ❌ Pendente (M4) |
| RF-057 | Cash shop | Baixa | ❌ Futuro |

### 1.7 NPCs e Quests

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-060 | NPCs com diálogo | Alta | ❌ Pendente (M5) |
| RF-061 | NPCs de loja | Alta | ❌ Pendente (M4) |
| RF-062 | Sistema de quests | Alta | ❌ Pendente (M5) |
| RF-063 | Recompensas de quest | Alta | ❌ Pendente (M5) |
| RF-064 | Quest log | Média | ❌ Pendente (M5) |

### 1.8 Social

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-070 | Chat global/party/guild/whisper | Alta | ⚠️ Chat global implementado |
| RF-071 | Party com compartilhamento de XP | Alta | ❌ Pendente (M5) |
| RF-072 | Guild system | Alta | ❌ Pendente (M5) |
| RF-073 | Guild wars | Baixa | ❌ Futuro |
| RF-074 | Friends list | Média | ❌ Pendente (M5) |
| RF-075 | Trade entre jogadores | Média | ❌ Pendente (M4) |

### 1.9 UI/UX

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF-080 | HUD com HP/MP/XP, minimapa, hotbar | Alta | ✅ Completo (Ciclo 04 — HP/MP/XP bars; minimapa/hotbar pendentes como RFs separados) |
| RF-081 | Menu de personagem | Alta | ❌ Pendente |
| RF-082 | Inventário arrastável | Alta | ❌ Pendente (M4) |
| RF-083 | Notificações | Média | ❌ Pendente |
| RF-084 | Ranking | Média | ❌ Pendente (M6) |
| RF-085 | Settings | Média | ❌ Pendente |
| RF-086 | Suporte mobile | Baixa | ❌ Futuro |

---

## 2. Requisitos Não-Funcionais

| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RNF-001 | Latência máxima de 200ms para combate | Alta | ⚠️ Pendente teste de carga |
| RNF-002 | Suporte a 500+ jogadores simultâneos | Alta | ❌ Pendente (#45) |
| RNF-003 | Tick rate do servidor: 10 Hz | Alta | ✅ GameEngine: setInterval(100ms) |
| RNF-004 | Todo cálculo server-side | Alta | ✅ CombatSystem + MovementSystem |
| RNF-005 | Cliente 60 FPS em GPUs integradas | Média | ✅ PixiJS com RAF, aguardando benchmark |
| RNF-006 | Asset total < 50 MB | Média | ✅ 7.3 MB (2900 sprites organizados) |
| RNF-007 | TypeScript strict mode | Alta | ✅ tsconfig.base.json: strict: true |
| RNF-008 | Testes unitários | Alta | ✅ 247 testes (Vitest) |
| RNF-009 | CI/CD via GitHub Actions | Alta | ❌ Pendente (#54) |
| RNF-010 | Logs estruturados | Média | ✅ Logger JSON (debug/info/warn/error) |
| RNF-011 | i18n (pt-BR, en-US) | Baixa | ❌ Futuro |

---

## 3. Casos de Uso (Resumo)

```
Ator: Jogador não-autenticado
  ├── Criar conta
  └── Fazer login

Ator: Jogador autenticado
  ├── Selecionar/criar personagem
  ├── Entrar no mundo
  ├── Movimentar personagem
  ├── Interagir com NPC
  ├── Atacar monstro
  ├── Usar skill
  ├── Pegar loot
  ├── Equipar item
  ├── Upar item
  ├── Formar party
  ├── Conversar no chat
  └── Abrir loja

Ator: Administrador
  ├── Gerenciar contas
  ├── Spawnar monstros/itens
  ├── Visualizar logs
  └── Executar comandos no servidor
```

---

## 4. Glossário

| Termo | Definição |
|-------|-----------|
| **Tick** | Ciclo de atualização do servidor (100ms) |
| **Tile** | Unidade mínima do mapa (ex: 32x32 px) |
| **PK** | Player Killer — jogador que ataca outros |
| **Hotkey** | Tecla de atalho para skill/item |
| **Tier** | Nível do item (ex: Normal, Magic, Rare, Unique, Legend) |
| **Upgrade** | Melhoria de item com chance de sucesso/falha |
| **Respawn** | Reaparecimento de monstro após ser morto |
