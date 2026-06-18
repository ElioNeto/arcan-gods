# 📋 Scoping — Ciclo 03: Combate (M3)

**Data:** 2026-06-18
**Status:** ✅ Análise concluída

---

## Prioridades

### 🟥 P0 — Fundação do Combate
| ID | Issue | Tarefa | Complexidade |
|----|-------|--------|:-----------:|
| P0.1 | #51 | Fórmulas de Dano (calculateDamage em shared/) | Média |
| P0.2 | #50 | CombatSystem (validação, dano, kill, broadcast) | Alta |
| P0.3 | #52 | XP e Level Up por Kill | Média |

### 🟧 P1 — AI e UX de Combate
| ID | Issue | Tarefa | Depende |
|----|-------|--------|---------|
| P1.1 | #49 | Monster AI (FSM: idle/aggro/chase/attack) | P0.2 |
| P1.2 | — | Client: ataque via clique + hit-test | P0.2 |
| P1.3 | — | Client: feedback visual (damage numbers, health bars) | P0.2 |

### 🟨 P2 — Skills e Conteúdo
| ID | Issue | Tarefa |
|----|-------|--------|
| P2.1 | #56 | Skills básicas (Twisting Slash, Energy Ball) |
| P2.2 | — | Drop de gold |
| P2.3 | #55 | Classe Elf |

## Dependências
```
P0.1 (Fórmulas) → P0.2 (CombatSystem) → P0.3 (XP/Kill)
                                       ├→ P1.1 (Monster AI)
                                       ├→ P1.2 (Client Attack)
                                       └→ P1.3 (Feedback)
```

## Testes
206 atuais → estimado +80 novos testes de combate.
