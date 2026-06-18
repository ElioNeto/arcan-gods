import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { NetworkManager } from '../core/NetworkManager.js';

export class MenuScreen {
  private container: Container;
  private networkManager: NetworkManager;
  private onConnected: (() => void) | null = null;

  constructor(networkManager: NetworkManager) {
    this.container = new Container();
    this.networkManager = networkManager;
  }

  init(onConnected: () => void): void {
    this.onConnected = onConnected;
    this.createBackground();
    this.createTitle();
    this.createConnectButton();
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.removeFromParent();
    this.container.removeChildren();
  }

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1920, 1080);
    bg.fill({ color: 0x0a0a1a });
    this.container.addChild(bg);

    // Decorative gradient lines
    for (let i = 0; i < 10; i++) {
      const line = new Graphics();
      line.rect(0, 200 + i * 80, 1920, 1);
      line.fill({ color: 0x1a1a3a });
      this.container.addChild(line);
    }
  }

  private createTitle(): void {
    const title = new Text({
      text: 'ARCAN GODS',
      style: new TextStyle({
        fontSize: 64,
        fill: 0xccaaff,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      }),
    });
    title.anchor.set(0.5, 0.5);
    title.x = 960;
    title.y = 300;
    this.container.addChild(title);

    const subtitle = new Text({
      text: 'A browser MMORPG',
      style: new TextStyle({
        fontSize: 18,
        fill: 0x888899,
        fontFamily: 'monospace',
      }),
    });
    subtitle.anchor.set(0.5, 0.5);
    subtitle.x = 960;
    subtitle.y = 360;
    this.container.addChild(subtitle);
  }

  private createConnectButton(): void {
    const btnContainer = new Container();
    btnContainer.x = 960 - 100;
    btnContainer.y = 500;

    const btnBg = new Graphics();
    btnBg.rect(0, 0, 200, 50);
    btnBg.fill({ color: 0x334488 });
    btnContainer.addChild(btnBg);

    const btnText = new Text({
      text: 'Connect',
      style: new TextStyle({
        fontSize: 20,
        fill: 0xffffff,
        fontFamily: 'monospace',
      }),
    });
    btnText.anchor.set(0.5, 0.5);
    btnText.x = 100;
    btnText.y = 25;
    btnContainer.addChild(btnText);

    btnContainer.eventMode = 'static';
    btnContainer.cursor = 'pointer';
    btnContainer.on('pointerdown', () => this.handleConnect());

    this.container.addChild(btnContainer);
  }

  private handleConnect(): void {
    this.networkManager.on('connected', () => {
      if (this.onConnected) {
        this.onConnected();
      }
    });

    this.networkManager.connect();

    // For testing, also emit connected immediately if already connected
    if (this.networkManager.isConnected() && this.onConnected) {
      this.onConnected();
    }
  }
}
