import * as schema from "@colyseus/schema";
const { Schema, type } = schema;
import { GAME_CONSTANTS } from "../constants/serverConstants.js";

/**
 * Interface for player position (used in obstacle placement)
 */
interface PlayerPosition {
  x: number;
  y: number;
}

/**
 * ObstacleSchema defines the synchronized properties for each obstacle
 */
class ObstacleSchema extends Schema {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  variant: number;
  active: boolean;

  constructor(id: number) {
    super();
    
    // Initialize obstacle properties
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.width = GAME_CONSTANTS.OBSTACLE.MIN_WIDTH;
    this.height = 20; // Will be recalculated based on canvas dimensions
    this.speed = GAME_CONSTANTS.OBSTACLE.BASE_SPEED;
    this.variant = Math.floor(Math.random() * 3); // Random variant (0-2)
    this.active = true;
  }
  
  /**
   * Reset obstacle to a new position
   * @param canvasWidth - Width of the game canvas
   * @param canvasHeight - Height of the game canvas
   * @param playerPositions - Array of player positions to avoid when placing obstacle
   * @returns Whether the reset was successful
   */
  reset(_canvasWidth: number, canvasHeight: number, playerPositions: PlayerPosition[] = []): boolean {
    // Set starting position off-screen to the left
    this.x = -this.width;
    
    // Randomize y position, avoiding player positions
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 10) {
      // Generate random y position
      this.y = Math.random() * (canvasHeight - 70) + 20;
      
      // Check if too close to any player's spawn area
      validPosition = true;
      
      for (const playerPos of playerPositions) {
        const safeZoneWidth = 100;
        const safeZoneHeight = 100;
        
        const safeLeft = playerPos.x - safeZoneWidth / 2;
        const safeRight = playerPos.x + safeZoneWidth / 2;
        const safeTop = playerPos.y - safeZoneHeight / 2;
        const safeBottom = playerPos.y + safeZoneHeight / 2;
        
        // Check if obstacle overlaps with safe zone
        if (
          this.x < safeRight &&
          this.x + this.width > safeLeft &&
          this.y < safeBottom &&
          this.y + this.height > safeTop
        ) {
          validPosition = false;
          break;
        }
      }
      
      attempts++;
    }
    
    // Randomize variant for visual diversity
    this.variant = Math.floor(Math.random() * 3);
    
    // Reset speed based on current score
    this.speed = GAME_CONSTANTS.OBSTACLE.BASE_SPEED;
    
    // Set active
    this.active = true;
    
    // Return whether we found a valid position
    return validPosition;
  }
  
  /**
   * Update obstacle position
   * @param deltaTime - Time since last update in seconds
   * @param canvasWidth - Width of the game canvas
   * @param score - Current game score
   * @returns Whether the obstacle needs to be reset
   */
  update(deltaTime: number, canvasWidth: number, score: number = 0): boolean {
    // Update speed based on score (increases difficulty)
    this.speed = GAME_CONSTANTS.OBSTACLE.BASE_SPEED + (score / 10);
    
    // Move the obstacle
    if (this.x < canvasWidth) {
      this.x += this.speed * deltaTime;
    } else {
      // Mark for reset when off screen
      return true; // Needs reset
    }
    
    return false; // No need to reset
  }
  
  /**
   * Check for collision with a player
   * @param player - The player to check collision against
   * @returns Whether a collision occurred
   */
  checkCollision(player: { x: number; y: number; width: number; height: number }): boolean {
    // Add a smaller hitbox for better gameplay experience (80% of visual size)
    const hitboxReduction = 0.2; // 20% reduction
    
    // Player hitbox
    const pLeft = player.x + player.width * hitboxReduction;
    const pRight = player.x + player.width * (1 - hitboxReduction);
    const pTop = player.y + player.height * hitboxReduction;
    const pBottom = player.y + player.height * (1 - hitboxReduction);
    
    // Obstacle hitbox
    const oLeft = this.x + this.width * hitboxReduction;
    const oRight = this.x + this.width * (1 - hitboxReduction);
    const oTop = this.y + this.height * hitboxReduction;
    const oBottom = this.y + this.height * (1 - hitboxReduction);
    
    // Check if hitboxes overlap
    return oLeft < pRight && oRight > pLeft && oTop < pBottom && oBottom > pTop;
  }
}

// Define the schema types for network synchronization
type("number")(ObstacleSchema.prototype, "id");
type("number")(ObstacleSchema.prototype, "x");
type("number")(ObstacleSchema.prototype, "y");
type("number")(ObstacleSchema.prototype, "width");
type("number")(ObstacleSchema.prototype, "height");
type("number")(ObstacleSchema.prototype, "speed");
type("number")(ObstacleSchema.prototype, "variant");
type("boolean")(ObstacleSchema.prototype, "active");

export { ObstacleSchema };
