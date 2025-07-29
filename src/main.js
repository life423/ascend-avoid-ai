// Mobile-first multiplayer canvas game - Modular entry point
import { CanvasManager } from './game/canvas.js';
import { InputManager } from './game/input.js';
import { GameLoop } from './game/gameLoop.js';
import { WebSocketManager } from './network/websocket.js';
import { StatusManager } from './ui/status.js';

// Initialize game systems
const canvas = new CanvasManager('gameCanvas');
const input = new InputManager();
const network = new WebSocketManager();
const status = new StatusManager('status');

// Create and start game
const game = new GameLoop(canvas, input, network, status);
game.start();

// Export for debugging
if (import.meta.env.DEV) {
  window.game = { canvas, input, network, status, gameLoop: game };
}