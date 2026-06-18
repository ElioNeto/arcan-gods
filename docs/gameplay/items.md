# Sistema de Itens

## Categorias

| Categoria | Slots |
|-----------|-------|
| Weapon | 1 (mão direita) |
| Shield | 1 (mão esquerda) |
| Armor | 1 (peito) |
| Helm | 1 (cabeça) |
| Pants | 1 (pernas) |
| Boots | 1 (pés) |
| Gloves | 1 (mãos) |
| Wings | 1 (costas) |
| Jewelry | 2 (aneis) + 1 (amuleto) |

## Tiers (Raridade)

| Tier | Cor | Bônus adicional |
|------|-----|----------------|
| Normal | Branco | Stats base |
| Magic | Azul | +1 stat extra |
| Rare | Amarelo | +2 stats extras |
| Unique | Verde | +3 stats extras + slot para option |
| Legend | Vermelho | +4 stats extras + 2 slots para option |

## Upgrade System

```
Levels: +0 até +15
Tabela de chance:

+0 → +1:  95%
+1 → +2:  90%
+2 → +3:  80%
+3 → +4:  70%
+4 → +5:  60%
+5 → +6:  50%
+6 → +7:  45%
+7 → +8:  40%
+8 → +9:  35%
+9 → +10: 30%
+10 → +11: 25%
+11 → +12: 20%
+12 → +13: 15%
+13 → +14: 10%
+14 → +15: 5%

Ao falhar:
  - +0 até +6: volta para +0
  - +7 até +15: item destruído (se não tiver "Luck")

Luck: item com sorte (stat Boolean) adiciona +25% à chance de sucesso
```

## Exemplo de Template

```json
{
  "id": "sword_01",
  "name": "Espada do Guerreiro",
  "category": "weapon",
  "class_req": ["dark_knight", "magic_gladiator"],
  "level_req": 1,
  "strength_req": 30,
  "tier": "normal",
  "min_damage": 12,
  "max_damage": 18,
  "speed": 0,
  "sell_price": 500,
  "max_upgrade": 15
}
```
