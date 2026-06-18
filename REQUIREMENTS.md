# Requisitos — Arcan Gods

> **Status:** Rascunho inicial · Versão 0.1

---

## 1. Requisitos Funcionais

### 1.1 Autenticação e Conta

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-001 | O usuário deve poder criar uma conta com email + senha | Alta |
| RF-002 | O usuário deve poder fazer login com credenciais | Alta |
| RF-003 | O servidor deve validar sessão via JWT em cada conexão WebSocket | Alta |
| RF-004 | O usuário deve poder recuperar senha por email | Média |
| RF-005 | O usuário deve poder deletar a própria conta | Baixa |

### 1.2 Mundo e Movimentação

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-010 | O mapa deve ser baseado em tiles (grid 2D isométrico ou top-down) | Alta |
| RF-011 | O jogador deve se movimentar clicando no destino (pathfinding automático) | Alta |
| RF-012 | A câmera deve seguir o jogador centralizado na tela | Alta |
| RF-013 | Múltiplos mapas devem ser conectados por "portais" (boundaries) | Alta |
| RF-014 | Objetos estáticos (árvores, muros, NPCs) devem colidir com o jogador | Alta |
| RF-015 | O mapa deve ter camadas: chão, objetos, topo (para efeito de profundidade) | Média |
| RF-016 | Devem existir áreas seguras (sem PvP) e áreas de batalha | Média |

### 1.3 Personagem

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-020 | O jogador pode criar múltiplos personagens por conta | Alta |
| RF-021 | Classes disponíveis: Dark Knight, Dark Wizard, Elf, Summoner, Magic Gladiator | Alta |
| RF-022 | Atributos: Level, Experience, Strength, Agility, Energy, Vitality | Alta |
| RF-023 | O personagem ganha XP ao matar monstros e sobe de level | Alta |
| RF-024 | Ao subir de level, o jogador recebe pontos para distribuir em atributos | Alta |
| RF-025 | O personagem possui HP, MP, Stamina | Alta |
| RF-026 | O personagem pode morrer, perder XP e resetar no último checkpoint | Média |

### 1.4 Combate

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-030 | O combate é em tempo real, baseado em clique no alvo | Alta |
| RF-031 | O dano é calculado no servidor (anti-cheat) | Alta |
| RF-032 | Monstros possuem AI com aggro, chase, ataque e patrol | Alta |
| RF-033 | Monstros respawnam após tempo configurável | Alta |
| RF-034 | Monstros drops itens, gold e experiência | Alta |
| RF-035 | O PvP é liberado em áreas específicas | Média |
| RF-036 | Sistema de PK (Player Killer) com penalidades | Baixa |

### 1.5 Skills

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-040 | Cada classe tem uma árvore de skills única | Alta |
| RF-041 | Skills podem ser usadas com teclas de atalho (hotkeys) | Alta |
| RF-042 | Skills consomem MP e possuem cooldown | Alta |
| RF-043 | Skills podem ser evoluídas ao gastar pontos de skill | Alta |
| RF-044 | Efeitos visuais (partículas, animações) devem acompanhar as skills | Média |
| RF-045 | Buffs e debuffs com duração limitada | Média |
| RF-046 | Combo skills (sequência que ativa skill especial) | Baixa |

### 1.6 Itens e Inventário

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-050 | Inventário com grade de slots (8x5) | Alta |
| RF-051 | Itens possuem: nome, tier, stats, requisitos (level/class) | Alta |
| RF-052 | Categorias: weapon, armor, helmet, boots, gloves, shield, wings, jewelry | Alta |
| RF-053 | Drop aleatório baseado em chance do monstro + luck rate | Alta |
| RF-054 | Sistema de upgrade de itens (até +15 com chance de falha) | Alta |
| RF-055 | Itens podem ser trocados entre jogadores | Média |
| RF-056 | Item pode ser vendido para NPC por gold | Média |
| RF-057 | Cash shop com itens cosméticos | Baixa |

### 1.7 NPCs e Quests

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-060 | NPCs com diálogo (talk tree) | Alta |
| RF-061 | NPCs de loja (comprar/vender itens) | Alta |
| RF-062 | Sistema de quests: kill quest, fetch quest, delivery quest | Alta |
| RF-063 | Quests recompensam com XP, gold e itens | Alta |
| RF-064 | Quest log mostrando quests ativas e completas | Média |

### 1.8 Social

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-070 | Chat global, party, guild, whisper | Alta |
| RF-071 | Party system com compartilhamento de XP | Alta |
| RF-072 | Guild system com nome, tag, membros | Alta |
| RF-073 | Guild wars | Baixa |
| RF-074 | Sistema de amizade (friends list) | Média |
| RF-075 | Trade entre jogadores (janela de troca segura) | Média |

### 1.9 UI/UX

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-080 | HUD com HP/MP/XP bar, minimapa, skill hotbar | Alta |
| RF-081 | Menu de personagem (stats, equipamentos) | Alta |
| RF-082 | Janela de inventário arrastável | Alta |
| RF-083 | Notificações de level up, drop, etc. | Média |
| RF-084 | Tela de ranking (top players por level) | Média |
| RF-085 | Settings: áudio, qualidade gráfica, keybinds | Média |
| RF-086 | Suporte a mobile (layout responsivo) | Baixa |

---

## 2. Requisitos Não-Funcionais

| ID | Descrição | Prioridade |
|----|-----------|------------|
| RNF-001 | Latência máxima de 200ms para ações de combate | Alta |
| RNF-002 | Suporte a 500+ jogadores simultâneos por servidor (inicial) | Alta |
| RNF-003 | Tick rate do servidor: 10 Hz | Alta |
| RNF-004 | Todo cálculo crítico (dano, drop) deve ser server-side | Alta |
| RNF-005 | Cliente deve rodar a 60 FPS em GPUs integradas modernas | Média |
| RNF-006 | Asset total inicial < 50 MB (otimizado para carregamento web) | Média |
| RNF-007 | Código em TypeScript com strict mode | Alta |
| RNF-008 | Testes unitários cobrindo lógica de negócio | Alta |
| RNF-009 | CI/CD via GitHub Actions | Alta |
| RNF-010 | Logs estruturados e monitoramento | Média |
| RNF-011 | Suporte a i18n (pt-BR, en-US inicialmente) | Baixa |

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
