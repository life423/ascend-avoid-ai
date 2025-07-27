import { Schema, type } from "@colyseus/schema";

export class ObstacleSchema extends Schema {
  @type("number") id: number = 0;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") type: string = "rectangle";
  @type("number") speed: number = 2;
  @type("number") width: number = 50;
  @type("number") height: number = 30;
  @type("boolean") isActive: boolean = true;

  constructor(id: number = 0) {
    super();
    this.id = id;
    this.isActive = true;
  }

  /**
   * Reset obstacle to a new position
   * @param canvasWidth - Width of the game canvas
   * @param canvasHeight - Height of the game canvas
   * @param playerPositions - Array of player positions to avoid
   */
  reset(canvasWidth: number, canvasHeight: number, playerPositions: Array<{x: number, y: number}> = []): void {
    // Random width and height
    this.width = 30 + Math.random() * 30; // 30-60px
    this.height = 20 + Math.random() * 10; // 20-30px
    
    // Start from the top
    this.y = -this.height;
    
    // Random x position
    this.x = Math.random() * (canvasWidth - this.width);
    
    // Random speed
    this.speed = 2 + Math.random() * 3; // 2-5 speed
    
    this.isActive = true;
  }

  /**
   * Update obstacle position
   * @param deltaTime - Time since last update
   * @param canvasWidth - Width of the game canvas
   * @returns true if obstacle needs to be reset
   */
  update(deltaTime: number, canvasWidth: number): boolean {
    if (!this.isActive) return false;
    
    // Move down
    this.y += this.speed;
    
    // Check if off screen (need reset)
    return this.y > 1000; // Reset when far off screen
  }

  /**
   * Check collision with player
   * @param player - Player object with x, y, width, height
   * @returns true if collision detected
   */
  checkCollision(player: {x: number, y: number, width: number, height: number}): boolean {
    if (!this.isActive) return false;
    
    return (
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y
    );
  }
}