# Plano de Testes: Setup Monorepo (Issue #1)

## 1. Escopo

### O que será testado
- Estrutura de npm workspaces (packages/shared, packages/server, packages/client)
- TypeScript compilando em todos os pacotes (strict mode)
- ESLint passando em todos os pacotes sem erros
- Dependências entre workspaces (shared → server, shared → client)
- Scripts npm do root (dev, build, lint, test)
- tsconfig com `strict: true` e sem `any` implícito
- `npm install` no root instala dependências de todos os workspaces

### O que NÃO será testado
- Lógica de runtime (testado em planos específicos de cada feature)
- Publicação de pacotes npm
- Compatibilidade com versões antigas do Node.js

---

## 2. Unit Tests

### 2.1 Estrutura de Workspaces

- [ ] TC-001: Root `package.json` define `workspaces` com os 3 pacotes
  - Input: `package.json` do root
  - Expected: `workspaces` array contendo `packages/shared`, `packages/server`, `packages/client`

- [ ] TC-002: Cada workspace tem `package.json` com `name` e `version` válidos
  - Input: `packages/*/package.json`
  - Expected: Cada pacote possui `name` (formato `@arcan-gods/<name>`) e `version` semântica

- [ ] TC-003: Workspaces se enxergam via `@arcan-gods/shared`, `@arcan-gods/server`, `@arcan-gods/client`
  - Input: Import `@arcan-gods/shared` de dentro de `packages/server`
  - Expected: Resolução funciona sem erros (node_modules hoisting)

- [ ] TC-004: Dependência shared → server está declarada
  - Input: `packages/server/package.json`
  - Expected: `dependencies` contém `@arcan-gods/shared`

- [ ] TC-005: Dependência shared → client está declarada
  - Input: `packages/client/package.json`
  - Expected: `dependencies` contém `@arcan-gods/shared`

### 2.2 TypeScript Configuration

- [ ] TC-006: Tsconfig root referencia os pacotes via `references`
  - Input: `tsconfig.json` do root
  - Expected: `references` array contendo `packages/shared`, `packages/server`, `packages/client`

- [ ] TC-007: Cada workspace tsconfig tem `strict: true`
  - Input: `packages/*/tsconfig.json`
  - Expected: `compilerOptions.strict === true`

- [ ] TC-008: Cada workspace tsconfig define `outDir` e `rootDir` corretos
  - Input: `packages/*/tsconfig.json`
  - Expected: `outDir` aponta para `dist`, `rootDir` aponta para `src`

- [ ] TC-009: `noImplicitAny` está habilitado em todos os tsconfigs
  - Input: `packages/*/tsconfig.json`
  - Expected: `compilerOptions.noImplicitAny === true` (ou herdado de strict)

- [ ] TC-010: `strictNullChecks` está habilitado
  - Input: `packages/*/tsconfig.json`
  - Expected: `compilerOptions.strictNullChecks === true`

### 2.3 ESLint Configuration

- [ ] TC-011: ESLint config no root aplica a todos os pacotes
  - Input: `.eslintrc.*` ou `eslint.config.*` no root
  - Expected: Config cobre `packages/*/src/**/*.ts`

- [ ] TC-012: Regra `@typescript-eslint/no-explicit-any` está configurada como erro
  - Input: Config do ESLint
  - Expected: `no-explicit-any` rule = `error`

- [ ] TC-013: Regra `@typescript-eslint/strict` está ativa
  - Input: Config do ESLint
  - Expected: strict ruleset aplicado

### 2.4 Scripts npm

- [ ] TC-014: Root `package.json` tem script `build` que compila todos os workspaces
  - Input: `package.json` scripts
  - Expected: `build` executa `tsc --build` ou equivalente em todos os pacotes

- [ ] TC-015: Root `package.json` tem script `lint` que roda ESLint em todos os pacotes
  - Input: `package.json` scripts
  - Expected: `lint` cobre `packages/*/src/**/*.ts`

- [ ] TC-016: Root `package.json` tem script `test` que roda Vitest em todos os pacotes
  - Input: `package.json` scripts
  - Expected: `test` executa `vitest run` ou equivalente nos workspaces

- [ ] TC-017: Root `package.json` tem script `dev` que sobe servidor + cliente em paralelo
  - Input: `package.json` scripts
  - Expected: `dev` usa `concurrently` ou similar para rodar server + client em dev mode

---

## 3. Integration Tests

### 3.1 Build Pipeline

- [ ] TC-018: `npm run build` compila todos os pacotes sem erros
  - Setup: Repositório limpo, `npm install` executado
  - Steps:
    1. Executar `npm run build`
  - Expected: Exit code 0, diretórios `dist/` criados em cada workspace

- [ ] TC-019: `npm run lint` passa sem erros em código inicial vazio
  - Setup: Repositório com arquivos TypeScript placeholder mínimos
  - Steps:
    1. Executar `npm run lint`
  - Expected: Exit code 0, sem warnings de configuração

- [ ] TC-020: Mudança em shared é refletida em server sem build manual
  - Setup: `npm run build` executado, server rodando
  - Steps:
    1. Modificar um tipo em `packages/shared/src/types.ts`
    2. Executar `npm run build` no root
    3. Verificar que `packages/server/src/index.ts` que importa o tipo compila
  - Expected: Compilação bem-sucedida, sem erros de tipo

### 3.2 Workspace Resolution

- [ ] TC-021: Import entre workspaces funciona em runtime
  - Setup: `npm install` e `npm run build` executados
  - Steps:
    1. Criar arquivo de teste que importa `@arcan-gods/shared` de dentro de server
    2. Executar com Node.js
  - Expected: Import resolvido, módulo encontrado

- [ ] TC-022: `npm install` no root instala dependências de todos os pacotes
  - Setup: Diretório node_modules deletado
  - Steps:
    1. Executar `npm install` no root
  - Expected: `node_modules` contém dependências de shared, server e client (ex: ws, pixi.js, vite)

---

## 4. Edge Cases

- [ ] TC-023: Workspace com nome duplicado causa erro
  - Setup: Dois workspaces com mesmo `name` no `package.json`
  - Expected: npm install falha com erro de conflito

- [ ] TC-024: Dependência circular entre workspaces é detectada
  - Setup: server depende de client, client depende de server
  - Expected: tsc ou Node.js lança erro de dependência circular

- [ ] TC-025: TypeScript `strict: true` bloqueia código com `any` implícito
  - Setup: Arquivo .ts com função sem tipo de retorno explícito
  - Expected: `tsc` falha com erro `noImplicitAny`

- [ ] TC-026: ESLint bloqueia `console.log` em produção (se regra configurada)
  - Setup: Código com `console.log` em arquivo .ts
  - Expected: `eslint` reporta erro

- [ ] TC-027: Build falha se algum workspace tiver erro de sintaxe
  - Setup: Arquivo .ts com erro de sintaxe em packages/client
  - Expected: `npm run build` falha com exit code != 0 e mensagem apontando o arquivo

---

## 5. E2E Tests

- [ ] TC-028: Setup completo do zero (clone → install → build → lint → test)
  - Setup: Diretório temporário vazio
  - Steps:
    1. Clonar repositório
    2. `npm install`
    3. `npm run build`
    4. `npm run lint`
    5. `npm run test` (quando houver testes)
  - Expected: Todos os comandos executam com sucesso, exit code 0

---

## 6. Regressão

- N/A (primeiro ciclo, sem código prévio)

---

## 7. Estimativa de Esforço

| Tipo | Quantidade | Esforço |
|------|-----------|---------|
| Unit | 17 | 4h |
| Integration | 4 | 3h |
| Edge Cases | 5 | 2h |
| E2E | 1 | 1h |
| **Total** | **27** | **10h** |
```

---
