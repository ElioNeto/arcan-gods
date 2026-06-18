# Contribuindo — Arcan Gods

Obrigado por considerar contribuir! 🎉

## Código de Conduta

Este projeto segue o [Contributor Covenant](./CODE_OF_CONDUCT.md). Ao participar, espera-se que você mantenha um ambiente respeitoso e profissional.

## Como contribuir

### 1. Issues
- Antes de começar, veja se já existe uma issue para o que você quer fazer
- Se não existir, crie uma descrevendo a proposta
- Aguarde feedback antes de começar a codificar

### 2. Setup local

```bash
# Clone
git clone https://github.com/ElioNeto/arcan-gods.git
cd arcan-gods

# Instale dependências
npm install

# Copie as variáveis de ambiente
cp .env.example .env

# Suba os serviços (PostgreSQL + Redis)
docker compose up -d

# Rode as migrations
npm run db:migrate

# Inicie em dev
npm run dev
```

### 3. Padrões

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Branches:** `feat/nome-da-feature`, `fix/nome-do-bug`
- **TypeScript:** Strict mode, sem `any` implícito
- **Testes:** Toda função de lógica deve ter teste unitário

### 4. Fluxo de trabalho

```bash
git checkout -b feat/minha-feature
# Faça suas alterações...
npm run lint  # Sem warnings
npm run test  # Todos verdes
npm run build # Compila sem erros
git commit -m "feat: descrição clara"
git push origin feat/minha-feature
# Abra um Pull Request para main
```

### 5. Pull Request

- Título descritivo seguindo Conventional Commits
- Referencie a issue: `Closes #123`
- Descrição clara do que mudou e por quê
- Screenshots para mudanças visuais
- Mantenha PRs pequenos e focados

### 6. O que precisa de ajuda

- Issues marcadas com `good first issue`
- Issues marcadas com `help wanted`
- Documentação e tradução
- Testes
- Assets gráficos (sprites, tiles, UI)

---

## Stack

| Área | Tecnologia |
|------|-----------|
| Frontend | TypeScript + PixiJS + Vite |
| Backend | TypeScript + Node.js + Colyseus |
| Database | PostgreSQL + Redis |
| Testes | Vitest |
| CI/CD | GitHub Actions |

Dúvidas? Abra uma [Discussion](https://github.com/ElioNeto/arcan-gods/discussions).
