import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class PlaceholderGraphics {
  static createPlayer(x: number, y: number, name: string): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    const body = new Graphics();
    body.rect(0, 0, 32, 32);
    body.fill({ color: 0x4488ff });
    container.addChild(body);

    const label = new Text({
      text: name,
      style: new TextStyle({
        fontSize: 10,
        fill: 0xffffff,
        fontFamily: 'monospace',
      }),
    });
    label.x = 0;
    label.y = -12;
    label.anchor.set(0, 1);
    container.addChild(label);

    return container;
  }

  static createMonster(x: number, y: number, name: string): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    const body = new Graphics();
    body.rect(0, 0, 32, 32);
    body.fill({ color: 0xff4444 });
    container.addChild(body);

    const label = new Text({
      text: name,
      style: new TextStyle({
        fontSize: 9,
        fill: 0xff8888,
        fontFamily: 'monospace',
      }),
    });
    label.x = 0;
    label.y = -12;
    label.anchor.set(0, 1);
    container.addChild(label);

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

    const label = new Text({
      text: name,
      style: new TextStyle({
        fontSize: 9,
        fill: 0x88ff88,
        fontFamily: 'monospace',
      }),
    });
    label.x = 0;
    label.y = -12;
    label.anchor.set(0, 1);
    container.addChild(label);

    return container;
  }

  static createTile(x: number, y: number, tileSize: number, color: number): Graphics {
    const tile = new Graphics();
    tile.rect(x, y, tileSize, tileSize);
    tile.fill({ color });
    return tile;
  }
}
