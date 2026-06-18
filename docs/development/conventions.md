# Convenções de Código

## TypeScript

- **Strict mode** habilitado (`strict: true` no tsconfig)
- **Sem `any`** — usar `unknown` quando o tipo não for conhecido
- **Enums** são proibidos; usar `union types` com const strings
- **Null vs undefined:** usar `null` para valores intencionalmente vazios, `undefined` para não-inicializado
- **Imports:** ordenados (built-in → externo → interno), sem default exports (exceto componentes UI)

## Nomenclatura

| Item | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos | camelCase | `combatSystem.ts` |
| Classes | PascalCase | `class CombatSystem` |
| Funções | camelCase | `function calculateDamage()` |
| Variáveis | camelCase | `const playerHp = 100` |
| Constantes | UPPER_SNAKE | `const MAX_LEVEL = 400` |
| Tipos | PascalCase | `type DamageResult = {...}` |
| Interfaces | PascalCase | `interface IInventory {...}` |

## Testes

- Vitest como framework
- Arquivos de teste: `*.test.ts` ao lado do arquivo testado
- Nomenclatura: `describe('CombatSystem')` / `it('calculates damage correctly')`
- Mínimo de 80% de cobertura em funções de lógica (game systems, formulas)

## Git

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` nova funcionalidade
  - `fix:` correção de bug
  - `docs:` documentação
  - `refactor:` refatoração sem mudança de comportamento
  - `test:` testes
  - `chore:` tarefas de build/CI/config
- **Branches:** `feat/nome-da-feature` ou `fix/nome-do-bug`
- **PRs:** título descritivo, referência à issue, screenshots se visual

## Estrutura de Pacotes (npm workspaces)

```
arcan-gods/
  package.json          # Root workspace
  packages/
    shared/             # Tipos, constantes, fórmulas
    server/             # Servidor Node.js
    client/             # Cliente PixiJS
```

## UI

- Toda UI usa **PixiJS** (sem HTML/CSS overlay exceto login/menu inicial)
- Janelas são Containers com drag support
- Cores e fontes definidas em `ui/styles.ts`
- Suporte a resoluções: 1920x1080, 1366x768, 1024x768
