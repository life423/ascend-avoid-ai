/**
 * Player class representing the player entity in the game.
 * Refactored for multiplayer compatibility - canvas-agnostic and input-separated.
 */
import { PLAYER } from '../constants/gameConstants';
import { getSprite } from '../utils/sprites';
import { GameObject, InputState } from '../types';

export interface PlayerConfig {
  canvasWidth: number;
  canvasHeight: number;
  baseCanvasWidth?: number;
  baseCanvasHeight?: number;
  scaleFactor?: number;
}

export default class Player implements GameObject {
  // Position and dimensions (server-authoritative in multiplayer)
  x: number;
  y: number;
  width: number;
  height: number;
  private baseWidth: number;
  private baseHeight: number;
  
  // Canvas configuration (not tied to specific canvas instance)
  private config: PlayerConfig;
  
  // Movement state (for local prediction only)
  private movementKeys: Record<string, boolean>;
  private canMove: Record<string, boolean>;
  
  // Velocity for collision detection
  vx: number = 0;
  vy: number = 0;
  
  // Properties for improved winning line collision detection
  lastY: number = 0;  // Previous Y position for swept collision detection
  hasScored: boolean = false;  // Flag to prevent multiple scoring
  
  /**
   * Creates a new Player instance
   * @param configOrCanvas - Player configuration object OR HTMLCanvasElement (for backward compatibility)
   */
  constructor(configOrCanvas: PlayerConfig | HTMLCanvasElement) {
    // Handle backward compatibility with old HTMLCanvasElement constructor
    if (configOrCanvas instanceof HTMLCanvasElement) {
      const canvas = configOrCanvas;
      this.config = {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        baseCanvasWidth: 560,
        baseCanvasHeight: 550,
        scaleFactor: 1,
      };
    } else {
      // New PlayerConfig interface
      this.config = {
        baseCanvasWidth: 560,
        baseCanvasHeight: 550,
        scaleFactor: 1,
        ...configOrCanvas
      };
    }
    
    // Base size that will be scaled
    this.baseWidth = PLAYER.BASE_WIDTH;
    this.baseHeight = PLAYER.BASE_HEIGHT;
    
    // Calculate actual size after scaling
    const scaleFactor = this.config.scaleFactor || 1;
    this.width = this.baseWidth * scaleFactor;
    this.height = this.baseHeight * scaleFactor;
    
    // Initialize position properties (will be set by calling code)
    this.x = 0;
    this.y = 0;
    this.lastY = 0;
    this.hasScored = false;
    
    // Movement state (for local input processing)
    this.movementKeys = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    
    // Movement cooldown flags to prevent continuous movement
    this.canMove = {
      up: true,
      down: true,
      left: true,
      right: true
    };
  }
  
  /**
   * Reset player to starting position at the bottom center of the screen
   */
  resetPosition(): void {
    const scaleFactor = this.config.scaleFactor || 1;
    
    // Use same dimension calculation as move() method
    const playerSize = Math.max(
      this.baseWidth * scaleFactor,
      15
    );
    this.width = playerSize;
    this.height = playerSize;
    
    // Position player at the bottom center with proper boundary clamping
    this.x = this.config.canvasWidth / 2 - this.width / 2;
    this.y = this.config.canvasHeight - this.height - (10 * scaleFactor);
    
    // Ensure position is within bounds
    this.x = Math.max(0, Math.min(this.x, this.config.canvasWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, this.config.canvasHeight - this.height));
    
    // CRITICAL: Reset collision detection properties
    this.lastY = this.y;  // Set lastY to current position
    this.hasScored = false;  // Reset scoring flag so player can score again
  }
  
  /**
   * Set player position directly (for server-authoritative multiplayer)
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  setPosition(x: number, y: number): void {
    this.lastY = this.y; // Store previous position for collision detection
    this.x = x;
    this.y = y;
    
    // Ensure position is within bounds
    this.x = Math.max(0, Math.min(this.x, this.config.canvasWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, this.config.canvasHeight - this.height));
  }
  
  /**
   * Draw the player on any canvas context (canvas-agnostic)
   * @param ctx - Canvas rendering context to draw on
   * @param timestamp - Current timestamp for animation
   */
  draw(ctx: CanvasRenderingContext2D, timestamp: number = 0): void {
    // Get and draw animated player sprite with current timestamp for animation
    const playerSprite = getSprite('player', 0, timestamp);
    ctx.drawImage(playerSprite, this.x, this.y, this.width, this.height);
  }
  
  /**
   * Set a movement key state
   * @param key - The key to set ('up', 'down', 'left', 'right')
   * @param value - The value to set
   */
  setMovementKey(key: string, value: boolean): void {
    if (key in this.movementKeys) {
      this.movementKeys[key] = value;
    }
  }
  
  /**
   * Update player movement state
   * @param inputState - Current input state
   */
  updateFromInputState(inputState: InputState): void {
    this.setMovementKey('up', inputState.up);
    this.setMovementKey('down', inputState.down);
    this.setMovementKey('left', inputState.left);
    this.setMovementKey('right', inputState.right);
  }
  
  /**
   * Move the player based on current input state (for local/single-player only)
   * In multiplayer, position should be set via setPosition() from server
   */
  move(): void {
    // IMPORTANT: Store previous position BEFORE any movement
    this.lastY = this.y;
    
    const scaleFactor = this.config.scaleFactor || 1;
    const baseCanvasWidth = this.config.baseCanvasWidth || 560;
    const baseCanvasHeight = this.config.baseCanvasHeight || 550;
    
    // Update dimensions first - before any movement calculations
    const playerSize = Math.max(
      this.baseWidth * scaleFactor,
      15
    );
    this.width = playerSize;
    this.height = playerSize;
    
    // Calculate movement step size based on scale factor
    const baseStepX = baseCanvasWidth * 0.07;
    const baseStepY = baseCanvasHeight * 0.07;
    
    // Scale the movement speed
    const moveX = Math.max(baseStepX * scaleFactor, PLAYER.MIN_STEP * scaleFactor);
    const moveY = Math.max(baseStepY * scaleFactor, PLAYER.MIN_STEP * scaleFactor);
    
    // Calculate scaled winning line position
    const winningLineRatio = 40 / baseCanvasHeight; // GAME.WINNING_LINE / BASE_CANVAS_HEIGHT
    const scaledWinningLine = winningLineRatio * this.config.canvasHeight;
    
    // Reset velocity
    this.vx = 0;
    this.vy = 0;
    
    // Move up - Allow player to reach the winning line
    if (this.movementKeys.up && this.canMove.up && this.y > scaledWinningLine - (this.height / 2)) {
      this.y -= moveY;
      this.vy = -moveY;
      this.canMove.up = false;
    }
    if (!this.movementKeys.up) {
      this.canMove.up = true;
    }
    
    // Move down
    if (this.movementKeys.down && this.canMove.down && this.y + this.height <= this.config.canvasHeight - (10 * scaleFactor)) {
      this.y += moveY;
      this.vy = moveY;
      this.canMove.down = false;
    }
    if (!this.movementKeys.down) {
      this.canMove.down = true;
    }
    
    // Move right
    if (this.movementKeys.right && this.canMove.right && this.x < this.config.canvasWidth - this.width - (5 * scaleFactor)) {
      this.x += moveX;
      this.vx = moveX;
      this.canMove.right = false;
    }
    if (!this.movementKeys.right) {
      this.canMove.right = true;
    }
    
    // Move left
    if (this.movementKeys.left && this.canMove.left && this.x > (5 * scaleFactor)) {
      this.x -= moveX;
      this.vx = -moveX;
      this.canMove.left = false;
    }
    if (!this.movementKeys.left) {
      this.canMove.left = true;
    }
    
    // Clamp player position to stay fully within canvas bounds
    this.x = Math.max(0, Math.min(this.x, this.config.canvasWidth - this.width));
    this.y = Math.max(scaledWinningLine, Math.min(this.y, this.config.canvasHeight - this.height));
  }
  
  /**
   * Render the player - alias for draw to fit GameObject interface
   * @param ctx - Canvas rendering context
   * @param timestamp - Current animation timestamp
   */
  render(ctx: CanvasRenderingContext2D, timestamp?: number): void {
    this.draw(ctx, timestamp);
  }
  
  /**
   * Update the player - alias for move to fit GameObject interface
   * @param deltaTime - Time elapsed since last frame
   */
  update(_deltaTime: number): void {
    this.move();
  }
}
