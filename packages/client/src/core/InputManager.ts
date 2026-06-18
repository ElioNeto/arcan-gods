export interface InputState {
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  clicked: boolean;
  clickX: number;
  clickY: number;
}

export class InputManager {
  private state: InputState = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false,
    clickX: 0,
    clickY: 0,
  };

  private handlers: Array<() => void> = [];

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  init(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('contextmenu', this.handleContextMenu);

    this.handlers = [
      () => window.removeEventListener('keydown', this.handleKeyDown),
      () => window.removeEventListener('keyup', this.handleKeyUp),
      () => canvas.removeEventListener('mousemove', this.handleMouseMove),
      () => canvas.removeEventListener('mousedown', this.handleMouseDown),
      () => canvas.removeEventListener('mouseup', this.handleMouseUp),
      () => canvas.removeEventListener('click', this.handleClick),
      () => canvas.removeEventListener('contextmenu', this.handleContextMenu),
    ];
  }

  destroy(): void {
    this.handlers.forEach((cleanup) => cleanup());
    this.handlers = [];
  }

  getState(): Readonly<InputState> {
    return this.state;
  }

  resetClick(): void {
    this.state.clicked = false;
  }

  isKeyDown(key: string): boolean {
    return this.state.keys.has(key.toLowerCase());
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.state.keys.add(event.key.toLowerCase());
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.state.keys.delete(event.key.toLowerCase());
  }

  private handleMouseMove(event: MouseEvent): void {
    this.state.mouseX = event.clientX;
    this.state.mouseY = event.clientY;
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.state.mouseDown = true;
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      this.state.mouseDown = false;
    }
  }

  private handleClick(event: MouseEvent): void {
    this.state.clicked = true;
    this.state.clickX = event.clientX;
    this.state.clickY = event.clientY;
  }

  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }
}
