import { Game } from './core/Game.js';

async function main(): Promise<void> {
  const game = new Game();
  await game.init();

  // Expose for debugging (dev only)
  if (import.meta.env.DEV) {
    (window as any).__game = game;
  }
}

main().catch((error) => {
  console.error('Failed to initialize game:', error);
});
