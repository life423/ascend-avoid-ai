import { Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") sessionId: string = "";
  @type("number") playerIndex: number = 0;
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") width: number = 30;
  @type("number") height: number = 30;
  @type("string") state: string = "alive";
  @type("number") score: number = 0;
  @type("boolean") upKey: boolean = false;
  @type("boolean") downKey: boolean = false;
  @type("boolean") leftKey: boolean = false;
  @type("boolean") rightKey: boolean = false;
  @type("number") lastUpdateTime: number = 0;

  constructor(sessionId: string = "", playerIndex: number = 0) {
    super();
    this.sessionId = sessionId;
    this.playerIndex = playerIndex;
    this.name = `Player ${playerIndex + 1}`;
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
    this.state = "alive";
  }

  /**
   * Update player movement based on input
   * @param deltaTime - Time since last update in seconds
   * @param canvasWidth - Width of the game canvas
   * @param canvasHeight - Height of the game canvas
   */
  updateMovement(_deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    if (this.state !== "alive") return;
    
    // Calculate movement step
    const moveX = 5; // BASE_SPEED
    const moveY = 5; // BASE_SPEED
    
    // Apply movement based on keys
    if (this.upKey && this.y > 40) { // WINNING_LINE
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
    this.state = "dead";
  }

  /**
   * Convert to spectator
   */
  becomeSpectator(): void {
    this.state = "spectating";
  }
}