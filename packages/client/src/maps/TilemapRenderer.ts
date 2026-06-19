/**
 * TilemapRenderer — desenha o mapa com tiles coloridos e detalhes visuais.
 *
 * Cria um mapa com:
 * - Grama (verde) como base
 * - Caminhos de pedra (marrom claro)
 * - Muralhas e paredes (cinza escuro)
 * - Árvores e decorações
 * - Um charco d'água (azul)
 * - Bordas do mapa (escuras)
 */

import { Container, Graphics } from 'pixi.js';

// Cores dos tiles
const GRASS = 0x3a7d32;
const DARK_GRASS = 0x2d6b27;
const PATH = 0x8d7955;
const DARK_PATH = 0x7a6848;
const WATER = 0x1976d2;
const WATER_DARK = 0x1565c0;
const TREE_TRUNK = 0x5d4037;
const TREE_LEAVES = 0x2e7d32;
const FLOWER = 0xc62828;
const FLOWER_YELLOW = 0xf9a825;
const BORDER = 0x1a1a2e;
const BRIDGE = 0x8d6e63;

export class TilemapRenderer {
  private container: Container;
  private tileSize: number;
  private graphics: Graphics[] = [];

  constructor(container: Container, tileSize: number = 32) {
    this.container = container;
    this.tileSize = tileSize;
  }

  /**
   * Renderiza um mapa bonito com o grid de colisão fornecido.
   * Usa o grid apenas para saber onde é walkable vs wall.
   */
  renderCollisionGrid(grid: boolean[][]): void {
    this.clear();
    const h = grid.length;
    if (h === 0) return;
    const w = grid[0].length;
    const ts = this.tileSize;

    // Primeiro: chão (camada base)
    const ground = new Graphics();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isWalkable = grid[y][x];
        if (isWalkable) {
          // Grama com variação
          const isPath = this.isOnPath(x, y, w, h);
          if (isPath) {
            ground.rect(x * ts, y * ts, ts, ts);
            ground.fill({ color: (x + y) % 3 === 0 ? PATH : DARK_PATH });
          } else {
            ground.rect(x * ts, y * ts, ts, ts);
            ground.fill({ color: (x + y) % 2 === 0 ? GRASS : DARK_GRASS });
          }
        } else {
          // Parede/muralha
          ground.rect(x * ts, y * ts, ts, ts);
          ground.fill({ color: BORDER });
        }
      }
    }
    this.container.addChild(ground);
    this.graphics.push(ground);

    // Decorações: árvores, flores, água
    const decor = new Graphics();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!grid[y][x]) continue;

        // Lago no canto superior direito
        if (x >= 8 && x <= 12 && y >= 2 && y <= 6) {
          decor.rect(x * ts + 1, y * ts + 1, ts - 2, ts - 2);
          decor.fill({ color: (x + y) % 2 === 0 ? WATER : WATER_DARK });
          decor.rect(x * ts, y * ts, ts, 1);
          decor.fill({ color: 0xbbdefb, alpha: 0.3 });
          continue;
        }

        // Árvores espalhadas
        if (this.isTree(x, y, w, h)) {
          // Tronco
          decor.rect(x * ts + 12, y * ts + 16, 8, 12);
          decor.fill({ color: TREE_TRUNK });
          // Copas
          decor.circle(x * ts + 16, y * ts + 10, 10);
          decor.fill({ color: TREE_LEAVES });
          decor.circle(x * ts + 12, y * ts + 14, 7);
          decor.fill({ color: 0x388e3c });
          continue;
        }

        // Flores decorativas
        if (this.isFlower(x, y, w, h)) {
          decor.circle(x * ts + 8, y * ts + 24, 2);
          decor.fill({ color: FLOWER });
          decor.circle(x * ts + 16, y * ts + 20, 2);
          decor.fill({ color: FLOWER_YELLOW });
          decor.circle(x * ts + 24, y * ts + 26, 2);
          decor.fill({ color: 0xe91e63 });
          continue;
        }

        // Bordas do mapa com gradiente
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
          decor.rect(x * ts, y * ts, ts, ts);
          decor.fill({ color: BORDER, alpha: 0.8 });
        }
      }
    }
    this.container.addChild(decor);
    this.graphics.push(decor);

    // Caminho central (horizontal)
    const path = new Graphics();
    for (let x = 12; x < 40; x++) {
      path.rect(x * ts, 18 * ts, ts, ts);
      path.fill({ color: (x % 3 === 0) ? BRIDGE : DARK_PATH });
    }
    // Caminho vertical
    for (let y = 12; y < 30; y++) {
      path.rect(25 * ts, y * ts, ts, ts);
      path.fill({ color: (y % 3 === 0) ? BRIDGE : DARK_PATH });
    }
    // Praça central (encontro dos caminhos)
    path.circle(25 * ts + 16, 18 * ts + 16, 20);
    path.fill({ color: 0xa1887f });
    path.circle(25 * ts + 16, 18 * ts + 16, 14);
    path.fill({ color: 0x8d6e63 });
    path.circle(25 * ts + 16, 18 * ts + 16, 4);
    path.fill({ color: 0xffd54f }); // ponto central dourado
    this.container.addChild(path);
    this.graphics.push(path);
  }

  renderFromMapData(mapData: { width: number; height: number; collisionGrid: boolean[][] }): void {
    this.renderCollisionGrid(mapData.collisionGrid);
  }

  clear(): void {
    for (const g of this.graphics) {
      this.container.removeChild(g);
      g.destroy();
    }
    this.graphics = [];
  }

  getTileSize(): number {
    return this.tileSize;
  }

  // ─── Helpers de layout ─────────────────────────────────────

  private isOnPath(x: number, y: number, _w: number, _h: number): boolean {
    // Caminho horizontal central
    if (y >= 16 && y <= 20 && x >= 8 && x <= 42) return true;
    // Caminho vertical central
    if (x >= 23 && x <= 27 && y >= 8 && y <= 32) return true;
    return false;
  }

  private isTree(x: number, y: number, _w: number, _h: number): boolean {
    // Árvores em posições específicas (não em caminhos)
    if (this.isOnPath(x, y, _w, _h)) return false;
    if (x >= 8 && x <= 12 && y >= 2 && y <= 6) return false; // lake area
    // Seed determinístico baseado em posição
    const seed = (x * 7 + y * 13) % 17;
    return seed === 0 && x > 2 && x < 47 && y > 2 && y < 37;
  }

  private isFlower(x: number, y: number, _w: number, _h: number): boolean {
    if (this.isOnPath(x, y, _w, _h)) return false;
    if (this.isTree(x, y, _w, _h)) return false;
    const seed = (x * 31 + y * 17) % 23;
    return seed === 1 && x > 1 && x < 48 && y > 1 && y < 38;
  }
}
