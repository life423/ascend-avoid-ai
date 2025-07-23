/**
 * Manages the creation, updating, and recycling of obstacles
 * to improve efficiency and separate concerns.
 * Now with TypeScript support.
 */
import { ScalingInfo, GameObject } from '../types';

// Interface for the Obstacle instance
interface Obstacle extends GameObject {
  calculateHeight: () => void;
  detectCollision: (player: GameObject, deltaTime?: number) => boolean;
  update: (timestamp: number, score: number, scalingInfo?: ScalingInfo) => void;
}

// Interface for the GameConfig used by ObstacleManager
interface ObstacleGameConfig {
  getObstacleMinWidthRatio: () => number;
  getObstacleMaxWidthRatio: () => number;
  getMaxCars: () => number;
}

// Import using relative paths to the new TypeScript locations
// These imports may need to be adjusted based on actual file locations
import { randomIntFromInterval } from '../utils/utils';
import ObstacleClass from '../entities/Obstacle';

export default class ObstacleManager {
  private canvas: HTMLCanvasElement;
  private config: ObstacleGameConfig;
  private obstacles: Obstacle[];
  // private _baseCanvasHeight: number; // Removed unused property
  
  /**
   * Creates a new ObstacleManager
   * @param options - Configuration options
   */
  constructor({ canvas, config }: { canvas: HTMLCanvasElement; config: ObstacleGameConfig }) {
    this.canvas = canvas;
    this.config = config;
    this.obstacles = [];
    // this._baseCanvasHeight = canvas.height; // Removed unused assignment
  }
  
  /**
   * Initialize the obstacle pool with the first obstacle
   */
  initialize(): void {
    // Start with one obstacle
    this.obstacles = [this.createNewObstacle()];
  }
  
  /**
   * Create a new obstacle with random properties
   * @returns The newly created obstacle
   */
  private createNewObstacle(): Obstacle {
    // First, we'll need to dynamically import the Obstacle class
    // since it might be in a different location based on migration progress
    
    // Calculate sizes based on canvas dimensions and config
    const minWidth = Math.max(
      this.canvas.width * this.config.getObstacleMinWidthRatio(),
      30
    );
    
    const maxWidth = Math.max(
      this.canvas.width * this.config.getObstacleMaxWidthRatio(),
      80
    );
    
    // Starting position offscreen to the left
    const startX = -120;
    
    // Height boundaries
    const minY = 20;
    const maxY = this.canvas.height - 50;
    
    // Create a new obstacle instance
    
    // Create the obstacle with random initial position
    return new ObstacleClass(
      startX,
      randomIntFromInterval(minY, maxY),
      randomIntFromInterval(minWidth, maxWidth),
      this.canvas
    );
  }
  
  /**
   * Reposition an obstacle without overlapping others
   * @param obstacle - The obstacle to reposition
   */
  private respawnObstacle(obstacle: Obstacle): Obstacle {
    // Start with a position off the left side of the screen
    obstacle.x = -obstacle.width - 20;
    
    // Randomize Y position
    const minY = 20;
    const maxY = this.canvas.height - 50;
    obstacle.y = randomIntFromInterval(minY, maxY);
    
    // Ensure no overlap with other obstacles
    let attempts = 0;
    let hasOverlap = this.checkForOverlap(obstacle);
    
    // Try to find non-overlapping position (max 10 attempts)
    while (hasOverlap && attempts < 10) {
      obstacle.y = randomIntFromInterval(minY, maxY);
      hasOverlap = this.checkForOverlap(obstacle);
      attempts++;
    }
    
    // Recalculate height based on new position
    obstacle.calculateHeight();
    
    return obstacle;
  }
  
  /**
   * Check if an obstacle overlaps with any other obstacles
   * @param obstacle - The obstacle to check
   * @returns Whether the obstacle overlaps with any others
   */
  private checkForOverlap(obstacle: Obstacle): boolean {
    for (const other of this.obstacles) {
      if (other === obstacle) continue;
      
      // Simple overlap check
      const horizontalOverlap = 
        obstacle.x < other.x + other.width && 
        obstacle.x + obstacle.width > other.x;
      
      const verticalOverlap = 
        obstacle.y < other.y + other.height && 
        obstacle.y + obstacle.height > other.y;
      
      if (horizontalOverlap && verticalOverlap) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Add a new obstacle to the game
   */
  addObstacle(): void {
    // Check if we've reached the maximum allowed obstacles
    if (this.obstacles.length >= this.config.getMaxCars()) {
      // Instead of adding a new one, respawn one from the existing pool
      const randomIndex = Math.floor(Math.random() * this.obstacles.length);
      this.respawnObstacle(this.obstacles[randomIndex]);
      return;
    }
    
    // Create and add a new obstacle
    const newObstacle = this.createNewObstacle();
    
    // Make sure it doesn't overlap with existing obstacles
    this.respawnObstacle(newObstacle);
    
    // Add to collection
    this.obstacles.push(newObstacle);
  }
  
  /**
   * Update all obstacles
   * @param timestamp - Current timestamp for animation
   * @param score - Current game score (affects speed)
   * @param scalingInfo - Optional scaling information for responsive sizing
   */
  update(timestamp: number, score: number, scalingInfo?: ScalingInfo): void {
    // Update each obstacle and check if it's off-screen
    for (const obstacle of this.obstacles) {
      // Update obstacle position
      obstacle.update(timestamp, score, scalingInfo);
      
      // If obstacle is moving off-screen, respawn it
      if (obstacle.x >= this.canvas.width) {
        this.respawnObstacle(obstacle);
      }
    }
  }
  
  /**
   * Check for collisions between player and obstacles
   * @param player - The player object to check against
   * @param deltaTime - Optional time since last frame for continuous detection
   * @returns The obstacle that was hit, or null if no collision
   */
  checkCollisions(player: GameObject, deltaTime?: number): Obstacle | null {
    for (const obstacle of this.obstacles) {
      if (obstacle.detectCollision(player, deltaTime)) {
        return obstacle;
      }
    }
    
    return null;
  }
  
  /**
   * Get all obstacles
   * @returns The array of obstacles
   */
  getObstacles(): Obstacle[] {
    return this.obstacles;
  }
  
  /**
   * Reset all obstacles to initial state
   */
  reset(): void {
    // Clear all obstacles
    this.obstacles = [];
    
    // Add back the initial obstacle
    this.initialize();
  }
}
