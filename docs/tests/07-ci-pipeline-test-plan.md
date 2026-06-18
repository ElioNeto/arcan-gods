# Plano de Testes: CI Pipeline (Issue #6)

## 1. Escopo

### O que será testado
- Workflow YAML do GitHub Actions está sintaticamente correto
- Stages: lint, build, test
- Cache de node_modules entre runs
- Matrix de Node.js version (se aplicável)
- Trigger em push e pull_request para main/develop
- Stage de fail rápido (fast-fail)
- Upload de artefatos de build (se aplicável)
- Notificações de falha
- Tempo total de execução < 10 minutos

### O que NÃO será testado
- Deploy (será em ciclo futuro)
- Testes de carga
- Integração com serviços externos (Docker, cloud)

---

## 2. Unit Tests (Validação de Configuração)

### 2.1 Workflow Syntax

- [ ] TC-001: Workflow YAML é válido (parse sem erros)
  - Input: `.github/workflows/ci.yml`
  - Expected: YAML válido (validado via `yaml-lint` ou GitHub Actions schema)

- [ ] TC-002: Workflow tem `name` definido
  - Input: `.github/workflows/ci.yml`
  - Expected: `name: CI` ou `name: Continuous Integration`

- [ ] TC-003: Workflow tem `on` trigger configurado
  - Input: `.github/workflows/ci.yml`
  - Expected: `on.push.branches` contém `main` e `develop` (ou branches definidos)
  - Expected: `on.pull_request` também configurado

- [ ] TC-004: Workflow tem pelo menos um `job`
  - Input: `.github/workflows/ci.yml`
  - Expected: `jobs` contém pelo menos `ci` ou `build`

### 2.2 Stage: Install

- [ ] TC-005: Job instala dependências com `npm ci`
  - Input: Job steps
  - Expected: Step com `run: npm ci` (install limpo para CI)

- [ ] TC-006: Cache de `node_modules` está configurado
  - Input: Job steps
  - Expected: Step `actions/cache` com `path: node_modules` e `key` baseada em `package-lock.json`

### 2.3 Stage: Lint

- [ ] TC-007: Job roda `npm run lint`
  - Input: Job steps
  - Expected: Step com `run: npm run lint`

- [ ] TC-008: Lint stage falha se ESLint encontrar erros
  - Input: Código com erro intencional de ESLint
  - Expected: Workflow retorna exit code != 0, job marked as failed

### 2.4 Stage: Build

- [ ] TC-009: Job roda `npm run build`
  - Input: Job steps
  - Expected: Step com `run: npm run build`

- [ ] TC-010: Build stage falha se TypeScript não compilar
  - Input: Código com erro intencional de TypeScript
  - Expected: Workflow retorna exit code != 0, job marked as failed

### 2.5 Stage: Test

- [ ] TC-011: Job roda `npm run test`
  - Input: Job steps
  - Expected: Step com `run: npm run test`

- [ ] TC-012: Test stage falha se testes unitários quebrarem
  - Input: Teste intencionalmente falho (`expect(true).toBe(false)`)
  - Expected: Workflow retorna exit code != 0

### 2.6 Node.js Version

- [ ] TC-013: Workflow define `node-version` (18 ou 20+)
  - Input: Matrix ou `node-version` no setup-node
  - Expected: `node-version: '20'` ou matrix com `[18, 20]`

- [ ] TC-014: Matrix strategy para múltiplas versões (se configurado)
  - Input: `strategy.matrix.node-version`
  - Expected: Array de versões LTS suportadas

### 2.7 OS

- [ ] TC-015: Workflow roda em `ubuntu-latest`
  - Input: `runs-on`
  - Expected: `ubuntu-latest`

### 2.8 Concurrency

- [ ] TC-016: Workflow usa `concurrency` para cancelar runs duplicadas
  - Input: `concurrency.group`
  - Expected: Group baseado em branch + workflow name

### 2.9 Timeout

- [ ] TC-017: Workflow tem `timeout-minutes` definido (default 30 ou menos)
  - Input: Job level `timeout-minutes`
  - Expected: Valor entre 10 e 30 minutos

---

## 3. Integration Tests (Simulação Local)

### 3.1 Act (GitHub Actions local)

- [ ] TC-018: Workflow roda localmente com `act` (ferramenta de simulação)
  - Setup: `act` instalado, Docker rodando
  - Steps:
    1. `act push` (simula push event)
  - Expected: Todos os stages passam (lint, build, test)

- [ ] TC-019: `act` falha com código quebrado
  - Setup: Erro intencional de TypeScript
  - Steps:
    1. `act push`
  - Expected: Job falha na stage de build

### 3.2 Dependências

- [ ] TC-020: `npm ci` funciona no ambiente CI (simulado via Docker)
  - Setup: Docker container Ubuntu + Node.js 20
  - Steps:
    1. `npm ci`
  - Expected: node_modules criado, mesmas versões do lockfile

---

## 4. Edge Cases

- [ ] TC-021: Workflow não roda em branches que não sejam main/develop
  - Input: Push para branch `feature/test`
  - Expected: Workflow não dispara (se configurado apenas para main/develop)

- [ ] TC-022: Workflow roda em pull_request de fork
  - Input: PR de fork externo
  - Expected: Workflow dispara (se `pull_request` configurado)

- [ ] TC-023: Cache miss (primeira run) não impede o workflow
  - Input: Primeira execução em branch nova
  - Expected: Cache step mostra "Cache not found", workflow continua

- [ ] TC-024: Workflow falha rapidamente em caso de erro de sintaxe
  - Input: Erro de sintaxe no YAML
  - Expected: GitHub Actions reporta erro de validação antes de executar

- [ ] TC-025: Secrets não são expostos em logs
  - Input: Workflow usa `${{ secrets.JWT_SECRET }}`
  - Expected: Log mostra `***` em vez do valor real

- [ ] TC-026: Artefatos de build são gerados (se configurado)
  - Input: Job com step `actions/upload-artifact`
  - Expected: Artefato ZIP disponível na página do workflow

---

## 5. E2E Tests

- [ ] TC-027: Pipeline completa passa no GitHub Actions
  - Setup: Repositório no GitHub, código válido
  - Steps:
    1. Fazer push para `main`
    2. Aguardar workflow completar (monitorar via API ou UI)
  - Expected: ✅ Check verde, todas as stages passam em < 10 min

- [ ] TC-028: Pipeline falha e notifica corretamente
  - Setup: Código com erro de lint
  - Steps:
    1. Fazer push para branch de teste
    2. Aguardar workflow falhar
  - Expected: ❌ Check vermelho, commit marcado como failed, email/notificação enviada (se configurado)

---

## 6. Regressão

- Pipeline CI impacta todos os outros pacotes — se falhar, nada é integrado
- Testes de build e lint são gatekeepers para todo o projeto

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit (validação) | 17 | 3h |
| Integration | 3 | 2h |
| Edge Cases | 6 | 2h |
| E2E | 2 | 4h |
| **Total** | **28** | **11h** |
```

---
