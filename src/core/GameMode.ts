/**
 * Abstract base class for game modes implementing the Strategy Pattern.
 * This class defines the interface that all game modes must implement.
 * Now with TypeScript support.
 */
import { InputState } from '../types';

// Forward reference for the Game type to avoid circular dependencies
interface Game {
  gameState: string;
  isMultiplayerMode: boolean;
  score: number;
  highScore: number;
  config: any;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: any;
  obstacleManager: any;
  particleSystem: any;
  uiManager: any;
  assetManager: any;
  scalingInfo: any;
}

export default abstract class GameMode {
  /**
   * Reference to the main game controller
   */
  protected game: Game;
  
  /**
   * Whether this mode has been initialized
   */
  protected initialized: boolean;
  
  /**
   * Creates a new GameMode instance
   * @param game - Reference to the main game controller
   */
  constructor(game: Game) {
    if (this.constructor === GameMode) {
      throw new Error('GameMode is an abstract class and cannot be instantiated directly');
    }
    
    this.game = game;
    this.initialized = false;
  }
  
  /**
   * Initialize the game mode
   * @returns A promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }
  
  /**
   * Update game state for this mode
   * @param inputState - Current input state
   * @param deltaTime - Time since last frame in seconds
   * @param timestamp - Current timestamp for animation
   */
  abstract update(inputState: InputState, deltaTime: number, timestamp: number): void;
  
  /**
   * Render game elements specific to this mode
   * @param ctx - Canvas rendering context
   * @param timestamp - Current timestamp for animation
   */
  abstract render(ctx: CanvasRenderingContext2D, timestamp: number): void;
  
  /**
   * Handle post-update operations like win/lose detection
   */
  abstract postUpdate(): void;
  
  /**
   * Handle game reset
   */
  abstract reset(): void;
  
  /**
   * Handle complete reset after game over
   */
  abstract completeReset(): void;
  
  /**
   * Clean up resources when switching away from this mode
   */
  dispose(): void {
    // Default implementation is a no-op
  }
}
