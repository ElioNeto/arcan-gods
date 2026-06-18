import { Container } from 'pixi.js';

export class Camera {
  private container: Container;
  private target: { x: number; y: number } | null = null;
  private screenWidth: number;
  private screenHeight: number;
  private smoothFactor: number = 0.1;

  constructor(container: Container, screenWidth: number, screenHeight: number) {
    this.container = container;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  follow(target: { x: number; y: number }): void {
    this.target = target;
  }

  unfollow(): void {
    this.target = null;
  }

  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  update(): void {
    if (!this.target) return;

    const targetX = -this.target.x + this.screenWidth / 2;
    const targetY = -this.target.y + this.screenHeight / 2;

    // Smooth interpolation
    this.container.x += (targetX - this.container.x) * this.smoothFactor;
    this.container.y += (targetY - this.container.y) * this.smoothFactor;
  }

  snapToTarget(): void {
    if (!this.target) return;
    this.container.x = -this.target.x + this.screenWidth / 2;
    this.container.y = -this.target.y + this.screenHeight / 2;
  }

  getContainer(): Container {
    return this.container;
  }
}
