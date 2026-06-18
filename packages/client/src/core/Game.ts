import { Application, Container } from 'pixi.js';
import { NetworkManager } from './NetworkManager.js';
import { InputManager } from './InputManager.js';
import { Camera } from './Camera.js';
import { AssetManager } from './AssetManager.js';
import { MenuScreen } from '../ui/MenuScreen.js';
import { PlaceholderGraphics } from '../ui/PlaceholderGraphics.js';

export type GameState = 'loading' | 'menu' | 'world';

export class Game {
  public app: Application;
  public networkManager: NetworkManager;
  public inputManager: InputManager;
  public camera: Camera;
  public assetManager: AssetManager;

  private worldContainer: Container;
  private uiContainer: Container;
  private menuScreen: MenuScreen | null = null;
  private state: GameState = 'loading';
  private playerEntities: Map<string, Container> = new Map();

  constructor() {
    this.app = new Application();
    this.networkManager = new NetworkManager();
    this.inputManager = new InputManager();
    this.worldContainer = new Container();
    this.uiContainer = new Container();
    this.assetManager = new AssetManager();
    this.camera = new Camera(this.worldContainer, 1920, 1080);
  }

  async init(): Promise<void> {
    // Initialize PixiJS
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x0a0a1a,
      antialias: true,
    });

    const canvas = this.app.canvas as HTMLCanvasElement;
    document.getElementById('app')?.appendChild(canvas);

    // Add containers to stage
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.uiContainer);

    // Initialize systems
    this.inputManager.init(canvas);
    await this.assetManager.init();

    // Handle resize
    window.addEventListener('resize', () => {
      const width = this.app.screen.width;
      const height = this.app.screen.height;
      this.camera.setScreenSize(width, height);
    });

    // Set up network event handlers
    this.setupNetworkHandlers();

    // Go to menu
    this.showMenu();

    // Start game loop
    this.app.ticker.add(() => this.update());
  }

  private setupNetworkHandlers(): void {
    this.networkManager.on('AUTH_SUCCESS', (packet: any) => {
      this.enterWorld(packet.player);
    });

    this.networkManager.on('WORLD_STATE', (packet: any) => {
      this.syncWorldState(packet);
    });

    this.networkManager.on('ENTITY_UPDATE', (packet: any) => {
      this.updateEntity(packet.entity);
    });

    this.networkManager.on('ENTITY_REMOVE', (packet: any) => {
      this.removeEntity(packet.id);
    });

    this.networkManager.on('PLAYER_MOVED', (packet: any) => {
      this.updateEntityPosition(packet.id, packet.x, packet.y);
    });
  }

  private showMenu(): void {
    this.state = 'menu';
    this.menuScreen = new MenuScreen(this.networkManager);
    this.menuScreen.init(() => this.onMenuConnected());
    this.uiContainer.addChild(this.menuScreen.getContainer());
  }

  private onMenuConnected(): void {
    // Send auto-login
    this.networkManager.send({
      type: 'AUTH_LOGIN',
      email: 'test@arcan.com',
      password: 'test123',
    });
  }

  private enterWorld(playerData: any): void {
    this.state = 'world';

    // Remove menu
    if (this.menuScreen) {
      this.menuScreen.destroy();
      this.menuScreen = null;
    }

    // Create local player
    const playerContainer = PlaceholderGraphics.createPlayer(
      playerData.x,
      playerData.y,
      playerData.name
    );
    this.worldContainer.addChild(playerContainer);
    this.playerEntities.set(playerData.id, playerContainer);

    // Camera follows player
    this.camera.follow(playerData);
    this.camera.snapToTarget();
  }

  private syncWorldState(packet: any): void {
    // Add/update entities from world state
    for (const entity of packet.entities) {
      this.updateEntity(entity);
    }
  }

  private updateEntity(entity: any): void {
    if (this.playerEntities.has(entity.id)) return; // skip local player

    const existing = this.playerEntities.get(entity.id);
    if (existing) {
      existing.x = entity.x;
      existing.y = entity.y;
    } else if (entity.type === 'monster') {
      const container = PlaceholderGraphics.createMonster(
        entity.x,
        entity.y,
        entity.name
      );
      this.worldContainer.addChild(container);
      this.playerEntities.set(entity.id, container);
    }
  }

  private removeEntity(id: string): void {
    const container = this.playerEntities.get(id);
    if (container) {
      this.worldContainer.removeChild(container);
      this.playerEntities.delete(id);
    }
  }

  private updateEntityPosition(id: string, x: number, y: number): void {
    const container = this.playerEntities.get(id);
    if (container) {
      container.x = x;
      container.y = y;
    }
  }

  private update(): void {
    if (this.state === 'world') {
      this.camera.update();
    }

    // Reset click state each frame
    this.inputManager.resetClick();
  }
}
