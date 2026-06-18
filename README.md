# Arcan Gods

**Cliente/servidor de MMORPG 2D para browser** inspirado em MU Online.

> [!WARNING]
> Este projeto está em desenvolvimento ativo. Nada aqui está pronto para produção.

## Sobre

Arcan Gods é um MMORPG 2D que roda diretamente no navegador, inspirado pelo clássico MU Online. O projeto busca recriar a experiência de grind, drops, upgrades e PvP em uma stack 100% web — sem instalação, sem downloads.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Cliente** | TypeScript + PixiJS + Vite |
| **Servidor** | Node.js + TypeScript |
| **Banco de dados** | PostgreSQL + Redis |
| **Networking** | WebSocket |
| **Auth** | JWT + bcrypt |
| **Infra** | Docker + GitHub Actions |

## Funcionalidades (planejadas)

- [x] Nenhuma ainda
- [ ] Renderização 2D baseada em tiles com spritesheets
- [ ] Movimentação com clique do mouse (andar até o destino)
- [ ] Sistema de classes (Dark Knight, Dark Wizard, Elf, etc.)
- [ ] Combate PvE e PvP em tempo real
- [ ] Sistema de skills com árvore de talentos
- [ ] Drop de loot e upgrade de itens
- [ ] Quest system com NPCs
- [ ] Party system, guild system, trading
- [ ] Chat global e canais
- [ ] Ranking online

## Começando

```bash
# Clone
git clone https://github.com/ElioNeto/arcan-gods.git
cd arcan-gods

# Server
cd server
npm install
cp .env.example .env
npm run dev

# Client (outro terminal)
cd client
npm install
npm run dev
```

## Estrutura

```
arcan-gods/
├── client/          # Frontend (PixiJS + Vite)
│   ├── src/
│   │   ├── core/        # Engine loop, input, câmera
│   │   ├── entities/    # Player, NPCs, Monsters
│   │   ├── systems/     # Combate, skills, inventário
│   │   └── ui/          # HUD, menus, chat
│   └── public/          # Assets (sprites, tiles, sons)
├── server/          # Backend (Node.js)
│   ├── src/
│   │   ├── game/        # Lógica de jogo (combate, drops)
│   │   ├── network/     # WebSocket handlers
│   │   └── db/          # Models, migrations, seed
│   └── tests/
├── shared/          # Código compartilhado (types, formulas)
└── docs/            # Documentação
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Requisitos funcionais e não-funcionais |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura do sistema, fluxos e decisões |
| [ROADMAP.md](./ROADMAP.md) | Roadmap de desenvolvimento |
| [MILESTONES.md](./MILESTONES.md) | Marcos e entregas |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guia de contribuição |
| [SECURITY.md](./SECURITY.md) | Política de segurança |
| [docs/](./docs/) | Documentação detalhada (gameplay, dev, etc.) |

## Licença

MIT — veja [LICENSE](./LICENSE).
