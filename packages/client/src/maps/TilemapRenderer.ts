import { Container, Graphics } from 'pixi.js';

export class TilemapRenderer {
  private container: Container;
  private tileSize: number;
  private tiles: Graphics[] = [];

  constructor(container: Container, tileSize: number = 32) {
    this.container = container;
    this.tileSize = tileSize;
  }

  /** Renderiza o grid de colisão como tiles coloridos */
  renderCollisionGrid(collisionGrid: boolean[][]): void {
    this.clear();
    const height = collisionGrid.length;
    if (height === 0) return;
    const width = collisionGrid[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = new Graphics();
        const isWalkable = collisionGrid[y][x];
        if (isWalkable) {
          tile.rect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
          tile.fill({ color: 0x2d5a27 }); // green for walkable
        } else {
          tile.rect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
          tile.fill({ color: 0x555555 }); // gray for walls
        }
        this.container.addChild(tile);
        this.tiles.push(tile);
      }
    }
  }

  /** Renderiza a partir de IMapData */
  renderFromMapData(mapData: { width: number; height: number; tileSize: number; collisionGrid: boolean[][] }): void {
    this.renderCollisionGrid(mapData.collisionGrid);
  }

  /** Limpa o tilemap */
  clear(): void {
    for (const tile of this.tiles) {
      this.container.removeChild(tile);
      tile.destroy();
    }
    this.tiles = [];
  }

  getTileSize(): number {
    return this.tileSize;
  }
}
