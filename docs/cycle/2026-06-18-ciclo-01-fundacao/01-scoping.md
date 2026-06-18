# 📋 Relatório de Scoping — Ciclo 01: Fundação

**Data:** 2026-06-18
**Agente:** scoper
**Status:** ✅ CONCLUÍDO

---

## 1. Contexto do Projeto

- **Milestone atual:** M1 — Conexão (Fase 0: Fundação)
- **Progresso:** 0% — Nenhum código implementado
- **Repositório:** 46 issues abertas, 0 bugs, 0 labels aplicados
- **Branch:** `main`

## 2. Documentos Analisados

| Documento | Status | Observações |
|-----------|--------|-------------|
| REQUIREMENTS.md | ✅ Lido | 59 RFs + 11 RNFs, versão 0.1 |
| ARCHITECTURE.md | ✅ Lido | Stack definida, decisões técnicas |
| ROADMAP.md | ✅ Lido | 6 fases, Fase 0 = Fundação |
| MILESTONES.md | ✅ Lido | M1: Conexão como milestone atual |
| GitHub Issues | ✅ Lido | 46 issues abertas, nenhuma priorizada |

## 3. Issues Analisadas

### Issues sem label (todas as 46)
Nenhuma issue possui label de prioridade. Todas estão no estado OPEN sem classificação.

**Distribuição por Milestone/Fase:**

| Fase | Issues | Count |
|------|--------|-------|
| Fase 0 — Fundação (M1) | #1 ao #8 | 8 issues |
| Fase 1 — Movimento (M2) | #9 ao #15 | 7 issues |
| Fase 2 — Combate (M3) | #16 ao #23 | 8 issues |
| Fase 3 — Itens (M4) | #24 ao #30 | 7 issues |
| Fase 4 — Social (M5) | #31 ao #37 | 7 issues |
| Fase 5 — Conteúdo (M6) | #38 ao #46 | 9 issues |

## 4. Prioridades Definidas para Este Ciclo

### 🟥 P0 — Essencial (implementar neste ciclo)
| ID | Issue | RF | Descrição |
|----|-------|----|-----------|
| P0.1 | #1 | — | Setup monorepo npm workspaces |
| P0.2 | #2 | — | Setup servidor Node.js + TypeScript + WebSocket |
| P0.3 | #3 | — | Setup cliente Vite + PixiJS + TypeScript |
| P0.4 | #8 | — | shared: tipos e constantes compartilhadas |

### 🟧 P1 — Importante (se der tempo)
| ID | Issue | RF | Descrição |
|----|-------|----|-----------|
| P1.1 | #5 | RF-001, RF-002, RF-003 | Sistema de autenticação JWT + PostgreSQL |
| P1.2 | #4 | RF-010 | Tilemap loader (Tiled JSON) |
| P1.3 | #6 | RNF-009 | Pipeline CI (GitHub Actions) |
| P1.4 | #7 | — | Docker Compose para desenvolvimento |

### 🟨 P2 — Futuro (próximo ciclo)
| ID | Issue | RF | Descrição |
|----|-------|----|-----------|
| P2.1 | #9-15 | RF-011 a RF-016 | Movimento, pathfinding, colisão, câmera |
| P2.2 | #16+ | RF-030+ | Combate e demais fases |

## 5. Dependências

```
#1 (monorepo) ─┬── #2 (servidor) ── #5 (auth)
               │
               └── #3 (cliente) ─── #4 (tilemap)
               │
               └── #8 (shared)
```

- **#1 (monorepo)** é pré-requisito de todos — sem ele, pacotes não se enxergam
- **#8 (shared)** pode ser feito após #1, em paralelo com #2 e #3
- **#2 (servidor)** e **#3 (cliente)** podem ser paralelizados (dependem apenas de #1)
- **#5 (auth)** depende de #2 (servidor rodando)
- **#4 (tilemap)** depende de #3 (cliente renderizando)
- **#6 (CI)** pode ser feito após #2 e #3 compilem
- **#7 (Docker)** pode ser feito após #2 e #5

## 6. Paralelização

```
Bloco A (sequencial obrigatório):
  └── #1 Setup monorepo → #8 shared

Bloco B (paralelo — pode rodar com A):
  └── Nada (precisa #1)

Bloco C (paralelo — depois de A):
  ├── #2 Servidor
  └── #3 Cliente

Bloco D (paralelo — depois de #2):
  └── #5 Auth

Bloco E (paralelo — depois de #3):
  └── #4 Tilemap

Bloco F (paralelo — depois de #2 + #3):
  ├── #6 CI Pipeline
  └── #7 Docker Compose
```

## 7. Riscos e Ambiguidades

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Aprendizado da stack (PixiJS 8, Colyseus) | Alta | Médio | Usar exemplos oficiais, começar simples |
| Dependências quebradas entre workspaces | Média | Alto | Testar após cada adição |
| Configuração do PostgreSQL | Média | Médio | Docker Compose já previsto |
| Falta de assets gráficos (sprites) | Alta | Médio | Usar shapes geométricos como placeholder |
| Escopo grande para primeiro ciclo | Média | Médio | Priorizar P0, P1 são bônus |

## 8. Recomendações

1. **Foco no P0** — monorepo, servidor, cliente, shared. Isso estabelece a base.
2. **Usar placeholders visuais** — quadrados coloridos em vez de sprites na Fase 0.
3. **Pular Colyseus por enquanto** — usar `ws` diretamente para WebSocket, simplifica o setup inicial.
4. **Adicionar labels às issues** — classificar prioridade já no GitHub.
5. **CI desde o início** — mesmo que mínima (lint + build).
6. **Configurar GitHub Projects** — associar issues ao milestone M1.

## 9. Decisão

✅ **Escopo OK para ciclo 1.** Iniciar planejamento com P0 obrigatório e P1 como stretch goals.

---
