/**
 * PlaceholderGraphics — cria representações visuais para entidades.
 *
 * Usa sprites animados do GraphicsEngine quando disponíveis.
 * Fallback para retângulos coloridos quando sprite não carregou.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GraphicsEngine } from '../engines/GraphicsEngine.js';

export class PlaceholderGraphics {
  static createPlayer(x: number, y: number, name: string, engine?: GraphicsEngine): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    if (engine) {
      try {
        const handle = engine.createSprite('player', 0, 0);
        handle.playAnimation('idle');
        const spriteContainer = (handle as any).container;
        if (spriteContainer) container.addChild(spriteContainer);
        else addFallbackPlayer(container);
      } catch {
        addFallbackPlayer(container);
      }
    } else {
      addFallbackPlayer(container);
    }

    addLabel(container, name, 10, 0xffffff, -40);
    return container;
  }

  static createMonster(x: number, y: number, name: string, engine?: GraphicsEngine): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    if (engine) {
      const sheetKey = getMonsterSheet(name);
      try {
        const handle = engine.createSprite(sheetKey, 0, 0);
        handle.playAnimation('walk');
        const spriteContainer = (handle as any).container;
        if (spriteContainer) container.addChild(spriteContainer);
        else addFallbackMonster(container);
      } catch {
        addFallbackMonster(container);
      }
    } else {
      addFallbackMonster(container);
    }

    addLabel(container, name, 9, 0xff8888, -8);
    return container;
  }

  static createNPC(x: number, y: number, name: string): Container {
    const container = new Container();
    container.x = x;
    container.y = y;
    const body = new Graphics();
    body.circle(16, 16, 16);
    body.fill({ color: 0x44ff44 });
    container.addChild(body);
    addLabel(container, name, 9, 0x88ff88, -12);
    return container;
  }

  static createTile(x: number, y: number, tileSize: number, color: number): Graphics {
    const tile = new Graphics();
    tile.rect(x, y, tileSize, tileSize);
    tile.fill({ color });
    return tile;
  }
}

function addFallbackPlayer(container: Container): void {
  const body = new Graphics();
  body.rect(-16, -32, 32, 32);
  body.fill({ color: 0x4488ff });
  body.rect(-15.5, -31.5, 31, 31);
  body.stroke({ color: 0xffffff, alpha: 0.2, width: 1 });
  container.addChild(body);
}

function addFallbackMonster(container: Container): void {
  const body = new Graphics();
  body.rect(-16, -32, 32, 32);
  body.fill({ color: 0xff4444 });
  body.rect(-15.5, -31.5, 31, 31);
  body.stroke({ color: 0xffffff, alpha: 0.2, width: 1 });
  container.addChild(body);
}

function addLabel(container: Container, text: string, fontSize: number, color: number, yOffset: number): void {
  const label = new Text({
    text,
    style: new TextStyle({ fontSize, fill: color, fontFamily: 'monospace' }),
  });
  label.x = 0;
  label.y = yOffset;
  label.anchor.set(0.5, 1);
  container.addChild(label);
}

function getMonsterSheet(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ['monster_dog', 'monster_cat', 'monster_bird'][hash % 3];
}
