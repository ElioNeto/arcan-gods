import { Application, Container } from 'pixi.js';
import type { IPlayer } from '@arcan-gods/shared';
import { NetworkManager } from './NetworkManager.js';
import { InputManager } from './InputManager.js';
import { Camera } from './Camera.js';
import { AssetManager } from './AssetManager.js';
import { TilemapRenderer } from '../maps/TilemapRenderer.js';
import { MenuScreen } from '../ui/MenuScreen.js';
import { PlaceholderGraphics } from '../ui/PlaceholderGraphics.js';
import { MovementInterpolator } from '../systems/MovementInterpolator.js';
import { HUD } from '../ui/hud/HUD.js';
import { CombatFeedbackManager } from '../ui/combat/CombatFeedbackManager.js';

export type GameState = 'loading' | 'menu' | 'world';

export class Game {
  public app: Application;
  public networkManager: NetworkManager;
  public inputManager: InputManager;
  public camera: Camera;
  public assetManager: AssetManager;

  private worldContainer: Container;
  private uiContainer: Container;
  private tilemapRenderer: TilemapRenderer;
  private menuScreen: MenuScreen | null = null;
  private state: GameState = 'loading';
  private playerEntities: Map<string, Container> = new Map();
  private movementInterpolator: MovementInterpolator = new MovementInterpolator();

  /** HUD overlay (HP/MP/XP bars) */
  private hud: HUD | null = null;

  /** Combat feedback (damage numbers, entity health bars) */
  private combatFeedbackManager: CombatFeedbackManager | null = null;

  /** ID of the local player, for filtering events */
  private localPlayerId: string | null = null;

  /** Cached full player data so we can update HUD from partial updates */
  private localPlayerData: IPlayer | null = null;

  constructor() {
    this.app = new Application();
    this.networkManager = new NetworkManager();
    this.inputManager = new InputManager();
    this.worldContainer = new Container();
    this.uiContainer = new Container();
    this.tilemapRenderer = new TilemapRenderer(this.worldContainer);
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
    // Share loaded textures with PlaceholderGraphics
    PlaceholderGraphics.setTextureCache(this.assetManager.getTextureCache());

    // Handle resize
    window.addEventListener('resize', () => {
      const width = this.app.screen.width;
      const height = this.app.screen.height;
      this.camera.setScreenSize(width, height);
      this.hud?.resize(width, height);
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
      this.onEntityUpdate(packet.entity);
    });

    this.networkManager.on('ENTITY_REMOVE', (packet: any) => {
      this.removeEntity(packet.id);
    });

    this.networkManager.on('ENTITY_DAMAGED', (packet: any) => {
      this.onEntityDamaged(packet);
    });

    this.networkManager.on('PLAYER_MOVED', (packet: any) => {
      // If we have an active interpolation for this entity, let the interpolator handle it.
      // Otherwise, snap directly to the position.
      if (!this.movementInterpolator.hasEntity(packet.id)) {
        this.updateEntityPosition(packet.id, packet.x, packet.y);
      }
    });

    this.networkManager.on('PLAYER_PATH', (packet: any) => {
      if (packet.path && packet.path.length > 0) {
        this.movementInterpolator.startPath(packet.id, packet.path);
      }
    });

    this.networkManager.on('MAP_DATA', (packet: any) => {
      if (packet.map) {
        this.tilemapRenderer.renderFromMapData(packet.map);
      } else {
        this.tilemapRenderer.renderCollisionGrid(packet.collisionGrid);
      }
    });
  }

  /**
   * Handle ENTITY_UPDATE — updates entity positions and HUD for the local player.
   */
  private onEntityUpdate(entity: any): void {
    // If this is the local player, update the HUD
    if (entity.id === this.localPlayerId && this.localPlayerData) {
      // Merge new data into cached player data
      Object.assign(this.localPlayerData, entity);
      this.hud?.update(this.localPlayerData);
    }

    // Update entity container and combat feedback position
    this.updateEntity(entity);
    if (this.combatFeedbackManager) {
      this.combatFeedbackManager.updateEntityPosition(entity.id, entity.x, entity.y);
    }
  }

  /**
   * Handle ENTITY_DAMAGED — update HUD if local player is hit, or spawn
   * combat feedback for other entities (monsters).
   */
  private onEntityDamaged(packet: any): void {
    // If local player was damaged, update HUD
    if (packet.targetId === this.localPlayerId && this.localPlayerData) {
      this.localPlayerData.hp = packet.targetHp;
      this.localPlayerData.maxHp = packet.targetMaxHp;
      this.hud?.update(this.localPlayerData);
    }

    // Look up entity position for combat feedback
    const entityContainer = this.playerEntities.get(packet.targetId);
    const x = entityContainer?.x ?? packet.x ?? 0;
    const y = entityContainer?.y ?? packet.y ?? 0;

    this.combatFeedbackManager?.onEntityDamaged({
      targetId: packet.targetId,
      damage: packet.damage,
      isCritical: packet.isCritical ?? false,
      targetHp: packet.targetHp,
      targetMaxHp: packet.targetMaxHp,
      x,
      y,
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

  private enterWorld(playerData: IPlayer): void {
    this.state = 'world';

    // Remove menu
    if (this.menuScreen) {
      this.menuScreen.destroy();
      this.menuScreen = null;
    }

    // Store local player data
    this.localPlayerId = playerData.id;
    this.localPlayerData = playerData;

    // Request map data for the current map
    this.networkManager.send({ type: 'REQUEST_MAP_DATA' });

    // Create local player
    const playerContainer = PlaceholderGraphics.createPlayer(
      playerData.x,
      playerData.y,
      playerData.name
    );
    this.worldContainer.addChild(playerContainer);
    this.playerEntities.set(playerData.id, playerContainer);

    // Initialize HUD (placed in uiContainer, on top of world)
    this.hud = new HUD();
    this.uiContainer.addChild(this.hud.getContainer());
    this.hud.update(playerData);

    // Initialize combat feedback (placed in worldContainer for world-space position)
    this.combatFeedbackManager = new CombatFeedbackManager(this.worldContainer);

    // Camera follows player
    this.camera.follow(playerData);
    this.camera.snapToTarget();
  }

  private syncWorldState(packet: any): void {
    // Add/update entities from world state
    for (const entity of packet.entities) {
      this.updateEntity(entity);
    }

    // Update HUD from cached player data if available
    if (this.localPlayerData) {
      this.hud?.update(this.localPlayerData);
    }
  }

  private updateEntity(entity: any): void {
    if (this.playerEntities.has(entity.id)) return; // skip local player

    const existing = this.playerEntities.get(entity.id);
    if (existing) {
      existing.x = entity.x;
      existing.y = entity.y;

      // Update combat feedback health bar position and HP
      this.combatFeedbackManager?.updateEntityPosition(entity.id, entity.x, entity.y);
      if (entity.hp !== undefined && entity.maxHp !== undefined) {
        this.combatFeedbackManager?.onEntityDamaged({
          targetId: entity.id,
          damage: 0,
          isCritical: false,
          targetHp: entity.hp,
          targetMaxHp: entity.maxHp,
          x: entity.x,
          y: entity.y,
        });
      }
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

    // Remove combat feedback (health bar) for this entity
    this.combatFeedbackManager?.removeEntity(id);
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
      const deltaSec = this.app.ticker.deltaMS / 1000;

      // Handle click-to-move
      const input = this.inputManager.getState();
      if (input.clicked) {
        // Convert screen coordinates to world coordinates
        const worldPos = this.camera.screenToWorld(input.clickX, input.clickY);
        // Send movement intent to server
        this.networkManager.send({
          type: 'PLAYER_MOVE',
          destX: Math.round(worldPos.x),
          destY: Math.round(worldPos.y),
        });
      }

      this.movementInterpolator.update(deltaSec);

      // Apply interpolated positions to entity containers
      for (const [id, container] of this.playerEntities) {
        const pos = this.movementInterpolator.getPosition(id);
        if (pos) {
          container.x = pos.x;
          container.y = pos.y;
          // Update combat feedback positions to follow interpolated movement
          this.combatFeedbackManager?.updateEntityPosition(id, pos.x, pos.y);
        }
      }

      // Update combat feedback animations (damage numbers, etc.)
      this.combatFeedbackManager?.update(deltaSec);

      this.camera.update();
    }

    // Reset click state each frame
    this.inputManager.resetClick();
  }
}
