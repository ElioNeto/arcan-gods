# 📋 Scoping Report — Ciclo 04: Monster AI + HUD (M3 Completion Sprint)

**Data:** 2026-06-19
**Agente:** Scoper
**Ciclo Anterior:** Ciclo 03 — Combate (2026-06-18)

---

## 1. Current Project State Summary

| Métrica | Valor |
|---------|-------|
| Testes | **247** (20 arquivos) |
| Issues fechadas | **26** |
| Issues abertas | **30** (alguns desatualizados — #53 e #54 estão feitos) |
| F0 Fundação | **100%** ✅ |
| F1 Movimento | **85%** 🟡 (faltam #47 portais, #48 minimapa) |
| F2 Combate | **40%** 🟡 (falta #51 AI, #52 skills, loot, classes) |
| F3+ | **0%** ⏳ |
| Docker | ✅ Multi-stage Dockerfiles + docker-compose stacks |
| Auth | ✅ JWT + PostgreSQL completo (bcrypt cost 12, migrations, fallback dev) |
| CI/CD | ✅ GitHub Actions — lint, build, test matrix (Node 20/22) |

---

## 2. What Changed Since Last Cycle

### Issues #53 (Auth JWT + PostgreSQL) — ✅ FULLY IMPLEMENTED

**Arquivos verificados existentes:**
- `packages/server/src/db/connection.ts` — Pool PostgreSQL com connection string, query logger, graceful shutdown
- `packages/server/src/db/models/Account.ts` — CRUD completo (create, findByEmail, findById, softDelete)
- `packages/server/src/db/migrations/001_create_accounts.sql` — Tabela `accounts` com UUID, bcrypt hash, soft delete
- `packages/server/src/db/migrations/002_create_characters.sql` — Tabela `characters` com FK para accounts, stats, posição
- `packages/server/src/db/migrate.ts` — Runner de migrations com tabela de tracking
- `packages/server/src/services/AuthService.ts` — JWT (jsonwebtoken) + bcrypt (cost 12), login/register/validateToken
- `packages/server/src/network/handlers/auth.ts` — Handlers WebSocket com fallback dev mode se DB offline
- `packages/server/src/config/env.ts` — Config de `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`

**Status:** O REQUIREMENTS.md mostra RF-003 como "⚠️ Parcial (mock, #53)" — **deve ser atualizado para ✅.**

### Issues #54 (CI Pipeline) — ✅ FULLY IMPLEMENTED

**Arquivo verificado:**
- `.github/workflows/ci.yml` — 3 jobs (lint, type-check/build, test) com matrix Node 20/22, cache npm, build compartilhado

**Status:** O REQUIREMENTS.md mostra RNF-009 como "❌ Pendente (#54)" — **deve ser atualizado para ✅.**

### M3 (Combate) — Núcleo implementado

O que está feito:
- ✅ CombatSystem (`processAttack`) com range check, cooldown, dano, kill, XP/gold
- ✅ 9 fórmulas de dano em `shared/` (físico, mágico, crítico, block, XP, gold)
- ✅ XP + level up com stat points (5 pts/nível)
- ✅ ENTITY_DAMAGED packet sendo enviado após ataque
- ✅ Respawn de monstros (já funcionava do Ciclo 01)
- ✅ Monstro toma dano com redução de defesa

O que **NÃO** está feito:
- ❌ Monster AI (GameEngine.ts linha 78-82: placeholder `// Basic patrol - just stand still for now`)
- ❌ Skills (#52) — nenhum código de skill existe
- ❌ HUD (#55) — UI client tem apenas `MenuScreen.ts` e `PlaceholderGraphics.ts`
- ❌ Client combat feedback (damage numbers, health bars) — não existe
- ❌ Stamina (#57) — RF-025 incompleto

---

## 3. Updated Priorities — Ciclo 04

A meta deste ciclo é **completar substancialmente o M3 (Combate)** e estabelecer a base de UI que permite ao jogador sentir o combate.

### 🟥 P0 — Must Have (bloqueia M3)

| ID | Issue | Tarefa | Complexidade | Depende |
|----|-------|--------|:-----------:|:-------:|
| P0.1 | **#51** | **Monster AI (FSM)** — idle/aggro/chase/attack/pathfind-back | **Alta** | — |
| P0.2 | **#55** | **HUD Básico** — HP/MP/XP bars + level display | **Média** | — |
| P0.3 | *(novo)* | **Client Combat Feedback** — damage numbers flutuantes + health bar sobre monstros | **Média** | P0.1 |

**Justificativa:**
- **#51 (Monster AI):** Sem AI, monstros são alvos estáticos. O combate não tem sentido — não há reação, chase, nem perigo. É o maior gap para M3 ser "jogável".
- **#55 (HUD):** Sem HP/MP/XP bars, o jogador não vê seu estado. O feedback de combate é invisível. HUD é pré-requisito para qualquer UX minimamente funcional.
- **Client Combat Feedback:** O servidor já envia `ENTITY_DAMAGED` mas o cliente não mostra nada. Damage numbers e health bars sobre entidades são essenciais para o jogador entender o que está acontecendo.

### 🟧 P1 — Should Have (importante, não bloqueante)

| ID | Issue | Tarefa | Complexidade | Depende |
|----|-------|--------|:-----------:|:-------:|
| P1.1 | **#52** | **Skills básicas** — Twisting Slash (DK) + Energy Ball (DW) com MP/cooldown | **Alta** | P0.2 (HUD mostra MP) |
| P1.2 | **#57** | **Bug: Adicionar Stamina ao Player** (RF-025) | **Baixa** | — |
| P1.3 | **#58** | **Bug: ChatSchema sem testes unitários** | **Baixa** | — |
| P1.4 | — | **Classe Dark Wizard** (como segunda classe jogável) | **Média** | P1.1 |
| P1.5 | — | **Hit-test visual no cliente** (clique no monstro → ataque) | **Média** | P0.3 |

### 🟨 P2 — Nice to Have (se sobrar tempo)

| ID | Issue | Tarefa | Complexidade | Observação |
|----|-------|--------|:-----------:|:----------:|
| P2.1 | **#47** | Portais e transição entre mapas | **Alta** | Usa portal data do CollisionSystem existente |
| P2.2 | **#59** | Substituir Node EventEmitter por implementação própria no cliente | **Média** | Refactor — baixo risco |
| P2.3 | **#60** | Aumentar cobertura de testes do cliente (atual: 4 arquivos de teste) | **Média** | Bom momento — base instável |

---

## 4. Dependencies Graph

```
P0.1 (Monster AI)
     ├── independente de HUD
     └── P0.3 (Combat Feedback) depende de P0.1 (precisa de monstros que andam)

P0.2 (HUD)
     └── independente de tudo — pode começar AGORA

P1.1 (Skills)
     └── depende de P0.2 (HUD precisa mostrar MP/cooldown)

P1.2 (Stamina fix)
     └── independente

P1.3 (ChatSchema tests)
     └── independente

P1.4 (Dark Wizard)
     └── depende de P1.1 (precisa de skill)

P1.5 (Hit-test cliente)
     └── depende de P0.3 (combat feedback)
```

---

## 5. Parallelization Plan

### Grupo 1: Paralelo puro (executar simultaneamente)
| Tarefa | Estimativa | Alocado |
|--------|:----------:|:-------:|
| **P0.2 — HUD Básico (#55)** | Médio | Dev A |
| **P0.1 — Monster AI FSM (#51)** | Alto | Dev B |
| **P1.2 — Bug: Stamina (#57)** | Baixo | Dev C (quick win) |
| **P1.3 — Bug: ChatSchema tests (#58)** | Baixo | Dev C (quick win) |

**Todas independentes entre si** — podem rodar 100% em paralelo.

### Grupo 2: Sequencial (após Grupo 1)
| Tarefa | Depende de |
|--------|:----------:|
| **P0.3 — Combat Feedback (damage numbers, health bars)** | P0.1 (monstros vivos) |
| **P1.5 — Hit-test visual no cliente** | P0.3 |

### Grupo 3: Skills (paralelo ao Grupo 2 ou após)
| Tarefa | Depende de |
|--------|:----------:|
| **P1.1 — Skills básicas (#52)** | P0.2 (HUD mostra MP) |
| **P1.4 — Dark Wizard** | P1.1 |

**Recomendação de alocação (3 devs ideal):**
- **Dev A:** P0.2 (HUD) → P1.1 (Skills)
- **Dev B:** P0.1 (Monster AI) → P0.3 (Combat Feedback) → P1.5 (Hit-test)
- **Dev C:** P1.2 + P1.3 (bugs) → P2.x (conforme disponibilidade)

---

## 6. Risks and Recommendations

### Riscos 🚨

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:-----------:|:-------:|-----------|
| R1 | **Monster AI muito complexa para 1 ciclo** | Média | Alto | Começar com FSM simples (idle→aggro→chase→attack→cooldown). Adiar pathfinding de volta ao spawn. |
| R2 | **HUD no PixiJS sem framework de UI** | Média | Médio | Usar `Graphics` do PixiJS para barras (sem dependências externas). Testar com Vitest + jsdom. |
| R3 | **Skills (#52) podem estourar o ciclo** | Alta | Médio | Skills são P1. Se apertar, priorizar AI+HUD+Feedback (M3 jogável) e adiar skills para Ciclo 05. |
| R4 | **Dependência de assets visuais para skills** | Média | Baixo | Usar placeholders (círculos coloridos) como feito nos Ciclos 01-03. |
| R5 | **Colisão de merge se 3 devs paralelos** | Baixa | Médio | Módulos são disjuntos: HUD (client/src/ui/), AI (server/src/game/), bugs (shared/). Risco mínimo. |
| R6 | **Coordenadas tile vs pixel (#61) pode afetar AI** | Média | Médio | Padronizar: AI opera em coordenadas de tile (grid), mesma convenção do pathfinding. |

### Ambiguidades e Assumptions ⚠️

1. **Sistema de coordenadas:** Atualmente, `Monster.x/y` parece ser em tiles (compatível com pathfinding), mas não há documentação explícita. **Assumir tiles** — validar durante implementação da AI.

2. **Stamina (#57):** RF-025 cita HP/MP/Stamina, mas HP/MP já existem. Stamina não tem fórmula ou uso definido. **Proposta:** Stamina = 100 base, regenera 1/tick ao parar, consome 1 por tile de movimento. Usada para correr (futuro). Implementação mínima para fechar RF-025.

3. **HUD positioning:** Não especificado se é canto superior esquerdo (padrão MU-like) ou configurável. **Assumir** canto superior esquerdo, 10px padding.

4. **Monster AI FSM:**
   - **Idle:** Parado, patrulha curta (2-3 tiles ao redor do spawn) — implementação simples
   - **Aggro:** Quando jogador entra no `aggroRange` → transição para chase
   - **Chase:** Pathfind até `attackRange` do alvo
   - **Attack:** Bate no alvo com cooldown próprio do monstro
   - **Return:** Se alvo sai do `aggroRange` × 2 (leash), retorna ao spawn
   - **Dúvida:** Monstros atacam automaticamente ou por timer? **Assumir** auto-attack a cada 2s (cooldown do monstro).

5. **Damage numbers:** Efeito visual flutuante que some após 1-2s. Implementação puramente client-side (recebe `ENTITY_DAMAGED`, anima texto). **Não precisa** de novo packet.

6. **Health bars sobre monstros:** Opcional para P0.3. Se faltar tempo, mostrar só no hover ou só no monstro alvo.

### Recomendações Estratégicas 💡

1. **Prioridade absoluta:** Monster AI + HUD. Sem esses dois, M3 não é jogável.

2. **Skills podem esperar:** Skills (#52) são P1 porque a mecânica central de combate (auto-attack) já funciona. Skills são incrementais ao combate, não fundacionais.

3. **Dark Wizard é P1 opcional:** Adicionar uma segunda classe (DW) dá variedade mas não é crítica. Adiar se Skills não ficarem prontas.

4. **Testes são barreira de qualidade:** Cada feature nova DEVE ter testes. Alvo para este ciclo: **+50 novos testes** (AI: 20, HUD: 15, Skills: 10, Bugs: 5).

5. **Atualizar documentos:** REQUIREMENTS.md e ROADMAP.md precisam refletir que #53 e #54 estão concluídos. Recomendo atualizar antes do Ciclo 04 começar.

6. **Issue #61 (coordenadas):** Não bloquear ciclo, mas decidir padrão (tile) e documentar. Pode virar bug se ignorado.

---

## 7. Test Plan Summary (Preview)

| Feature | Testes Unitários | Testes Integração | Testes E2E |
|---------|:---------------:|:-----------------:|:----------:|
| Monster AI (FSM) | 20 | 5 | 2 |
| HUD (HP/MP/XP) | 15 | — | 2 |
| Combat Feedback | 8 | — | 1 |
| Skills básicas | 12 | 3 | 2 |
| Stamina fix | 3 | — | — |
| ChatSchema tests | 4 | — | — |
| **Total estimado** | **62** | **8** | **7** |

---

## 8. Closing

**Ciclo 04** é o sprint que transforma combate de "cálculo matemático invisível" em "experiência jogável". Com Monster AI reagindo ao jogador, HUD mostrando estado, e damage numbers dando feedback visual, o jogo terá seu primeiro loop jogável completo:

> ✅ **Monstro spawna → Jogador vê → Anda até ele → Clique ataca → Dano aparece → Monstro reage (chase/attack) → Morre → XP ganha → HUD atualiza**

Issues #53 e #54 estão **equivocadamente marcadas como pendentes** nos documentos — estão 100% implementadas e devem ser atualizadas para ✅ antes do ciclo começar.
