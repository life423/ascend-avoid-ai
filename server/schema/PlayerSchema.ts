import { Schema, type } from "@colyseus/schema";
import { GAME_CONSTANTS } from "../constants/serverConstants";

/**
 * PlayerSchema defines the synchronized properties for each player
 */
export class PlayerSchema extends Schema {
  @type("string") sessionId: string;
  @type("number") playerIndex: number;
  @type("string") name: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") width: number;
  @type("number") height: number;
  @type("string") state: string;
  @type("number") score: number;
  @type("boolean") upKey: boolean;
  @type("boolean") downKey: boolean;
  @type("boolean") leftKey: boolean;
  @type("boolean") rightKey: boolean;
  @type("number") lastUpdateTime: number;

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
    this.upKey = false;
    this.downKey = false;
    this.leftKey = false;
    this.rightKey = false;
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Reset player position for a new game
   * @param canvasWidth - Width of the game canvas
   * @param canvasHeight - Height of the game canvas
   * @param playerIndex - Optional: player index for spawn distribution
   * @param totalPlayers - Optional: total players for spawn distribution
   */
  resetPosition(canvasWidth: number, canvasHeight: number, playerIndex?: number, totalPlayers?: number): void {
    // If we have player index info, distribute players evenly across the bottom
    if (playerIndex !== undefined && totalPlayers !== undefined && totalPlayers > 0) {
      // Divide the width into sections based on number of players
      const sectionWidth = canvasWidth / (totalPlayers + 1);
      this.x = sectionWidth * (playerIndex + 1) - (this.width / 2);
      
      // Ensure x is within bounds
      this.x = Math.max(10, Math.min(this.x, canvasWidth - this.width - 10));
      
      // Add slight randomness to prevent exact overlap if players have same index
      this.x += (Math.random() - 0.5) * 20;
    } else {
      // Fallback to random position
      this.x = 10 + Math.random() * (canvasWidth - this.width - 20);
    }
    
    // Keep Y at bottom but add slight variation to make overlaps visible
    this.y = canvasHeight - this.height - 10 - (Math.random() * 30);
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
    if (this.upKey && this.y > GAME_CONSTANTS.GAME.WINNING_LINE) {
      this.y -= moveY;
    }
    
    if (this.downKey && this.y + this.height < canvasHeight - 10) {
      this.y += moveY;
    }
    
    if (this.leftKey && this.x > 5) {
      this.x -= moveX;
    }
    
    if (this.rightKey && this.x + this.width < canvasWidth - 5) {
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