/**
 * Implementation of single-player game mode.
 * Handles all game logic specific to the single-player experience.
 * Now with TypeScript support and improved collision detection.
 */
import GameMode from './GameMode';
import { InputState } from '../types';

// Define types for components used within this class
interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}



export default class SinglePlayerMode extends GameMode {
  /**
   * Creates a new SinglePlayerMode instance
   * @param game - Reference to the main game controller
   */
  constructor(game: any) {
    super(game);
    
    // Bind methods to maintain proper 'this' context
    this.handleCollision = this.handleCollision.bind(this);
    this.checkForWinner = this.checkForWinner.bind(this);
  }
  
  /**
   * Initialize the single player mode
   * @returns A promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Set initial state for single player mode
    this.game.isMultiplayerMode = false;
    
    // Reset score and state
    this.reset();
    
    console.log('SinglePlayerMode initialized');
    return Promise.resolve();
  }
  
  /**
   * Update game state for single player mode
   * @param inputState - Current input state
   * @param deltaTime - Time since last frame in seconds
   * @param timestamp - Current timestamp for animation
   */
  update(inputState: InputState, deltaTime: number, timestamp: number): void {
    // Skip if game is not in playing state
    if (this.game.gameState !== this.game.config.STATE.PLAYING) {
      return;
    }
    
    // Update player movement based on input
    this.updatePlayerMovement(inputState);
    
    // Update player position
    if (this.game.player) {
      this.game.player.move();
    }
    
    // Update obstacles using scaling info for responsive sizing
    if (this.game.obstacleManager) {
      this.game.obstacleManager.update(timestamp, this.game.score, this.game.scalingInfo);
      
      // Check for collisions with continuous collision detection (pass deltaTime)
      const collision = this.game.obstacleManager.checkCollisions(this.game.player, deltaTime);
      if (collision) {
        this.handleCollision(collision);
      }
    }
  }
  
  /**
   * Update player movement based on input state
   * @param inputState - Current input state
   */
  private updatePlayerMovement(inputState: InputState): void {
    if (!this.game.player) return;
    
    // Apply input to player movement
    this.game.player.setMovementKey('up', inputState.up);
    this.game.player.setMovementKey('down', inputState.down);
    this.game.player.setMovementKey('left', inputState.left);
    this.game.player.setMovementKey('right', inputState.right);
    
    // Special case for up movement - make it more responsive and scale with screen size
    if (inputState.up && this.game.player.y > 30) {
      // Apply an immediate boost when pressing up, scaled by screen size
      const boostAmount = 30 * this.game.scalingInfo.heightScale;
      this.game.player.y -= boostAmount * 0.1;
    }
  }
  
  /**
   * Handle collision with obstacle
   * @param _obstacle - The obstacle that was hit
   */
  private handleCollision(_obstacle: Obstacle): void {
    // Play collision sound
    if (this.game.assetManager) {
      this.game.assetManager.playSound('collision', 0.3);
    } else {
      // Fallback to legacy sound method
      const playSound = (window as any).playSound || (() => {});
      playSound('collision');
    }
    
    // Flash screen red
    if (this.game.uiManager) {
      this.game.uiManager.flashScreen('#ff0000', 200);
    }
    
    // Set game state to game over
    this.game.gameState = this.game.config.STATE.GAME_OVER;
    
    // Show game over screen
    if (this.game.uiManager) {
      this.game.uiManager.showGameOver(
        this.game.score,
        this.game.highScore,
        this.completeReset.bind(this)
      );
    }
  }
  
  /**
   * Render single player mode specific elements
   * @param _timestamp - Current timestamp for animation
   */
  render(_timestamp: number): void {
    // Single player mode doesn't have any mode-specific rendering
    // All rendering is handled by the main Game.render method
  }
  
  /**
   * Post-update operations for single player mode
   * Checks for winning conditions and updates scores
   */
  postUpdate(): void {
    // Only run these checks if the game is in PLAYING state
    if (this.game.gameState !== this.game.config.STATE.PLAYING) return;
    
    // Check for winner
    this.checkForWinner();
    
    // Update high score
    this.updateHighScore();
  }
  
  /**
   * Check if player has reached the winning line
   * SIMPLIFIED: Use the same method as Game.ts for absolute consistency
   */
  checkForWinner(): void {
    // Use EXACTLY the same calculation as Game.ts checkForWinner() and drawWinningLine()
    const BASE_CANVAS_HEIGHT = 550;
    const scaledWinningLine = this.game.config.getWinningLine(
        this.game.canvas.height,
        BASE_CANVAS_HEIGHT
    );

    // Debug logging to see what's happening
    console.log('Checking for winner:', {
        playerY: this.game.player.y,
        scaledWinningLine: scaledWinningLine,
        canvasHeight: this.game.canvas.height,
        distance: this.game.player.y - scaledWinningLine,
        hasScored: this.game.player.hasScored || false
    });

    // Simple check: if player's top touches or crosses (less than or equal to) the winning line
    if (this.game.player.y <= scaledWinningLine && !this.game.player.hasScored) {
        console.log('🎉 PLAYER SCORED! Player Y:', this.game.player.y, 'Winning Line:', scaledWinningLine);
        
        // Mark as scored to prevent multiple scoring
        this.game.player.hasScored = true;

        // Increment score
        this.game.score++;
        if (this.game.uiManager) {
            this.game.uiManager.updateScore(this.game.score);
        }

        // Add more obstacles as game progresses
        this.addObstaclesBasedOnScore();

        // Add visual effects
        this.addScoreParticles(scaledWinningLine);

        // Play score sound
        if (this.game.assetManager) {
            this.game.assetManager.playSound('score', 0.3);
        }

        // Reset player to bottom of screen
        this.resetPlayerPosition();
    }
  }

  /**
   * Properly reset player position and scoring flags
   */
  private resetPlayerPosition(): void {
    if (!this.game.player) return;
    
    // Reset player to bottom of screen
    this.game.player.resetPosition();
    
    // CRITICAL: Reset scoring flag so player can score again
    this.game.player.hasScored = false;
    
    // Reset last position to current position
    this.game.player.lastY = this.game.player.y;
    
    console.log('✅ Player reset to bottom, ready for next score');
  }

  /**
   * Add celebration particles when scoring
   * @param winningLineY - Exact Y position of the winning line
   */
  private addScoreParticles(winningLineY: number): void {
    if (!this.game.player || !this.game.particleSystem) return;
    
    // Number of particles based on score (more particles for higher scores)
    const particleCount = Math.min(10 + this.game.score * 2, 50);
    
    // Apply scaling to particle sizes
    const scaleMultiplier = this.game.scalingInfo?.widthScale || 1;
    
    this.game.particleSystem.createCelebration({
      x: this.game.player.x + this.game.player.width / 2,
      y: winningLineY, // Use exact winning line position
      count: particleCount,
      minSize: 2 * scaleMultiplier,
      maxSize: 7 * scaleMultiplier,
      minLife: 20,
      maxLife: 40,
    });
  }
  
  /**
   * Add obstacles based on current score
   */
  private addObstaclesBasedOnScore(): void {
    if (!this.game.obstacleManager) return;
    
    // Add initial obstacles for new game
    if (this.game.score <= 2) {
      this.game.obstacleManager.addObstacle();
    }
    
    // Add obstacles as score increases (difficulty progression)
    if (this.game.score % 4 === 0) {
      this.game.obstacleManager.addObstacle();
    }
    
    // On small screens, cap the max number of obstacles to avoid overwhelming
    // the player
    if (
      this.game.scalingInfo.widthScale < 0.7 &&
      this.game.obstacleManager.getObstacles().length > 7
    ) {
      return;
    }
  }
  
  /**
   * Update the high score if needed
   */
  private updateHighScore(): void {
    if (this.game.score > this.game.highScore) {
      this.game.highScore = this.game.score;
      
      if (this.game.uiManager) {
        this.game.uiManager.updateHighScore(this.game.highScore);
      }
    }
  }
  
  /**
   * Reset game after collision
   */
  reset(): void {
    this.game.score = 0;
    
    if (this.game.uiManager) {
      this.game.uiManager.updateScore(0);
    }
    
    if (this.game.obstacleManager) {
      this.game.obstacleManager.reset();
    }
    
    if (this.game.player) {
      this.game.player.resetPosition();
      // Reset scoring flag when game resets
      this.game.player.hasScored = false;
    }
    
    // Clear particles
    if (this.game.particleSystem) {
      this.game.particleSystem.clear();
    }
  }
  
  /**
   * Complete reset after game over
   */
  completeReset(): void {
    // Hide any game over UI
    if (this.game.uiManager) {
      this.game.uiManager.hideGameOver();
    }
    
    // Reset game elements
    this.reset();
    
    // Set game state back to playing
    this.game.gameState = this.game.config.STATE.PLAYING;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    console.log('SinglePlayerMode disposed');
  }
}
