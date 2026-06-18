import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../core/InputManager.js';

describe('InputManager', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.destroy();
  });

  it('should start with empty state', () => {
    const state = inputManager.getState();
    expect(state.keys.size).toBe(0);
    expect(state.mouseDown).toBe(false);
    expect(state.clicked).toBe(false);
  });
});
