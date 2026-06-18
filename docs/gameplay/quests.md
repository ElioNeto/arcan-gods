# Sistema de Quests

## Tipos de Quest

### Kill Quest
Mate X monstros de determinado tipo.

```json
{
  "id": "kill_wolves_01",
  "type": "kill",
  "objectives": [
    { "type": "kill", "monster_id": "wolf", "count": 10 }
  ],
  "rewards": { "xp": 5000, "gold": 2000, "items": [] }
}
```

### Fetch Quest (Coleta)
Colete X itens que dropam de monstros ou estão no chão.

```json
{
  "id": "fetch_herbs_01",
  "type": "fetch",
  "objectives": [
    { "type": "fetch", "item_id": "herb_red", "count": 5 }
  ],
  "rewards": { "xp": 3000, "gold": 1000, "items": ["potion_hp_01"] }
}
```

### Delivery Quest
Leve um item de NPC A para NPC B.

```json
{
  "id": "delivery_letter_01",
  "type": "delivery",
  "objectives": [
    { "type": "talk", "npc_id": "npc_chief" }
  ],
  "rewards": { "xp": 8000, "gold": 5000, "items": ["ring_01"] }
}
```

## Chain Quests

Quests que formam uma cadeia. A quest 2 só fica disponível após completar a quest 1.

## Interface

- **Quest log:** Aba de quests ativas com progresso (ex: "Wolf: 5/10")
- **Notificação:** Ao completar uma quest, toast no canto da tela
- **Mini guidance:** Seta no minimapa indicando onde entregar a quest
- **NPC markers:** NPC com quest disponível tem ícone "!" acima da cabeça; NPC com quest para entregar tem "?"
