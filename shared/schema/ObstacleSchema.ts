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
    
    // Start from above the canvas
    this.y = -this.height;
    
    // Random x position, avoiding player positions if provided
    let attempts = 0;
    let validPosition = false;
    
    while (!validPosition && attempts < 10) {
      this.x = Math.random() * (canvasWidth - this.width);
      
      // Check if position conflicts with any player
      validPosition = true;
      for (const player of playerPositions) {
        const distance = Math.abs(this.x - player.x);
        if (distance < 100) { // Keep 100px away from players
          validPosition = false;
          break;
        }
      }
      
      attempts++;
    }
    
    // If we couldn't find a valid position, just use random
    if (!validPosition) {
      this.x = Math.random() * (canvasWidth - this.width);
    }
    
    // Random speed, scale with canvas height for consistency
    const speedMultiplier = Math.min(1.5, canvasHeight / 700); // Normalize to 700px height
    this.speed = (2 + Math.random() * 3) * speedMultiplier; // 2-5 speed, scaled
    
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
    
    // Move down (deltaTime could be used for frame-rate independent movement)
    // For now, assuming 60fps, but deltaTime is available for future enhancement
    this.y += this.speed * (deltaTime || 1);
    
    // Check if off screen (use canvasWidth for boundary detection)
    // Reset when obstacle is completely off screen or far below canvas
    const isOffScreen = this.y > canvasWidth + 200; // Use canvasWidth as reference for "far off screen"
    
    return isOffScreen;
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