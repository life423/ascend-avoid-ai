import * as schema from "@colyseus/schema";
const { Schema, type } = schema;
import { GAME_CONSTANTS } from "../constants/serverConstants.js";

/**
 * Interface for movement keys
 */
interface MovementKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/**
 * PlayerSchema defines the synchronized properties for each player
 */
class PlayerSchema extends Schema {
  sessionId: string;
  playerIndex: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: string;
  score: number;
  movementKeys: MovementKeys;
  lastUpdateTime: number;

  constructor(sessionId: string, playerIndex: number) {
    super();
    
    // Initialize player properties
    this.sessionId = sessionId;
    this.playerIndex = playerIndex;
    this.name = `Player ${playerIndex + 1}`;
    this.x = 0;
    this.y = 0;
    this.width = GAME_CONSTANTS.PLAYER.BASE_WIDTH;
    this.height = GAME_CONSTANTS.PLAYER.BASE_HEIGHT;
    this.state = GAME_CONSTANTS.PLAYER_STATE.ALIVE;
    this.score = 0;
    this.movementKeys = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Reset player position for a new game
   * @param canvasWidth - Width of the game canvas
   * @param canvasHeight - Height of the game canvas
   */
  resetPosition(canvasWidth: number, canvasHeight: number): void {
    this.x = Math.random() * (canvasWidth - this.width);
    this.y = canvasHeight - this.height - 10;
    this.state = GAME_CONSTANTS.PLAYER_STATE.ALIVE;
  }
  
  /**
   * Update player movement based on input
   * @param deltaTime - Time since last update in seconds
   * @param canvasWidth - Width of the game canvas
   * @param canvasHeight - Height of the game canvas
   */
  updateMovement(_deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    if (this.state !== GAME_CONSTANTS.PLAYER_STATE.ALIVE) return;
    
    // Calculate movement step
    const moveX = GAME_CONSTANTS.PLAYER.BASE_SPEED;
    const moveY = GAME_CONSTANTS.PLAYER.BASE_SPEED;
    
    // Apply movement based on keys
    if (this.movementKeys.up && this.y > GAME_CONSTANTS.GAME.WINNING_LINE) {
      this.y -= moveY;
    }
    
    if (this.movementKeys.down && this.y + this.height < canvasHeight - 10) {
      this.y += moveY;
    }
    
    if (this.movementKeys.left && this.x > 5) {
      this.x -= moveX;
    }
    
    if (this.movementKeys.right && this.x + this.width < canvasWidth - 5) {
      this.x += moveX;
    }
  }
  
  /**
   * Mark player as dead
   */
  markAsDead(): void {
    this.state = GAME_CONSTANTS.PLAYER_STATE.DEAD;
  }
  
  /**
   * Convert to spectator
   */
  becomeSpectator(): void {
    this.state = GAME_CONSTANTS.PLAYER_STATE.SPECTATING;
  }
}

// Define the schema types for network synchronization
type("string")(PlayerSchema.prototype, "sessionId");
type("number")(PlayerSchema.prototype, "playerIndex");
type("string")(PlayerSchema.prototype, "name");
type("number")(PlayerSchema.prototype, "x");
type("number")(PlayerSchema.prototype, "y");
type("number")(PlayerSchema.prototype, "width");
type("number")(PlayerSchema.prototype, "height");
type("string")(PlayerSchema.prototype, "state");
type("number")(PlayerSchema.prototype, "score");

export { PlayerSchema };
