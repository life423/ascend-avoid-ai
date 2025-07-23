/**
 * Implementation of multiplayer game mode.
 * Handles all game logic specific to the multiplayer experience.
 * Now with TypeScript support.
 */
import GameMode from './GameMode';
import { InputState, NetworkPlayer } from '../types';

interface GameState {
  gameState: string;
  obstacles?: any[];
  arenaWidth?: number;
  arenaHeight?: number;
}

interface ArenaStats {
  areaPercentage: number;
  shrinkStart?: number;
  shrinkEnd?: number;
}

export default class MultiplayerMode extends GameMode {
  private multiplayerManager: any | null;
  private remotePlayers: Record<string, NetworkPlayer>;
  private lastSentInput?: InputState;
  private lastInputSendTime: number;
  private inputChangeCount?: number;
  
  /**
   * Creates a new MultiplayerMode instance
   * @param game - Reference to the main game controller
   */
  constructor(game: any) {
    super(game);
    
    // Initialize multiplayer-specific state
    this.multiplayerManager = null;
    this.remotePlayers = {};
    this.lastInputSendTime = 0;
    
    // Bind methods to maintain proper 'this' context
    this.handleNetworkUpdate = this.handleNetworkUpdate.bind(this);
  }
  
  /**
   * Initialize the multiplayer mode
   * @returns A promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Set state for multiplayer mode
    this.game.isMultiplayerMode = true;
    
    // Dynamically import multiplayer manager to avoid loading it in single-player mode
    try {
      const { MultiplayerManager } = await import('../managers/MultiplayerManager');
      
      // Create and initialize the multiplayer manager
      // Use a simple EventBus and AssetManager for now
      const EventBus = (await import('../core/EventBus')).EventBus;
      const AssetManager = (await import('../managers/AssetManager')).default;
      
      const eventBus = new EventBus();
      const assetManager = new AssetManager();
      
      this.multiplayerManager = new MultiplayerManager(eventBus, assetManager);
      await this.multiplayerManager.connect();
      
      // Set up multiplayer event handlers
      this.setupEventHandlers();
      
      console.log('MultiplayerMode initialized');
    } catch (error) {
      console.error('Failed to initialize multiplayer mode:', error);
      throw error;
    }
    
    return Promise.resolve();
  }
  
  /**
   * Set up event handlers for multiplayer events
   */
  private setupEventHandlers(): void {
    if (!this.multiplayerManager) return;
    
    // Handle game state changes from server
    this.multiplayerManager.onGameStateChange = this.handleNetworkUpdate;
    
    // Handle player joining
    this.multiplayerManager.onPlayerJoin = (player: NetworkPlayer) => {
      console.log(`Player joined: ${player.name}`);
      // Update UI or show notification
      if (this.game.uiManager) {
        this.game.uiManager.showNotification(`${player.name} joined the game`);
      }
    };
    
    // Handle player leaving
    this.multiplayerManager.onPlayerLeave = (player: NetworkPlayer) => {
      console.log(`Player left: ${player.id}`);
      // Update UI or show notification
      if (this.game.uiManager) {
        this.game.uiManager.showNotification(`${player.name || 'A player'} left the game`);
      }
    };
    
    // Handle connection errors
    this.multiplayerManager.onConnectionError = (error: string) => {
      console.error(`Multiplayer connection error: ${error}`);
      if (this.game.uiManager) {
        this.game.uiManager.showError(`Connection error: ${error}`);
      }
    };
    
    // Handle game over from server
    this.multiplayerManager.onGameOver = (winnerName: string) => {
      if (this.game.uiManager) {
        this.game.uiManager.showGameOver(
          this.game.score,
          this.game.highScore,
          this.completeReset.bind(this),
          winnerName
        );
      }
    };
  }
  
  /**
   * Handle network state update from the server
   * @param gameState - Server game state
   */
  private handleNetworkUpdate(gameState: GameState): void {
    // Update local game state based on server state
    this.game.gameState = gameState.gameState;
    
    // Update remote players
    if (this.multiplayerManager) {
      this.remotePlayers = this.multiplayerManager.getRemotePlayers();
    }
    
    // Update obstacles from server if in multiplayer mode
    if (gameState.obstacles) {
      // Convert server obstacle format to client format if needed
      // This depends on your specific implementation
    }
    
    // Update arena information if applicable
    if (gameState.arenaWidth && gameState.arenaHeight) {
      // Update arena dimensions
    }
  }
  
  /**
   * Update game state for multiplayer mode
   * @param inputState - Current input state
   * @param _deltaTime - Time since last frame in seconds
   * @param timestamp - Current timestamp for animation
   */
  update(inputState: InputState, _deltaTime: number, timestamp: number): void {
    // Skip if game is not in playing state
    if (this.game.gameState !== this.game.config.STATE.PLAYING) {
      return;
    }
    
    // Get local player from multiplayer manager
    const localPlayer = this.multiplayerManager?.getLocalPlayer();
    
    // Update local player based on input
    if (localPlayer && this.game.player) {
      // Apply input to player (visual representation only)
      this.updatePlayerMovement(inputState);
      
      // Move local player - this will be overridden by server updates
      // but provides immediate visual feedback
      this.game.player.move();
      
      // Network optimization: Only send inputs when they change or periodically as a heartbeat
      this.throttledInputSend(inputState, timestamp);
    }
    
    // Update remote players (animations, interpolation)
    this.updateRemotePlayers();
    
    // Obstacles are server-authoritative in multiplayer mode
    // They will be updated via network updates
  }
  
  /**
   * Throttled input sending to reduce network traffic
   * Only sends inputs when they change or every 100ms as a heartbeat
   * @param currentInput - Current input state
   * @param timestamp - Current timestamp for timing
   */
  private throttledInputSend(currentInput: InputState, timestamp: number): void {
    // Initialize last input values if not set
    if (!this.lastSentInput) {
      this.lastSentInput = { up: false, down: false, left: false, right: false };
      this.lastInputSendTime = 0;
    }
    
    // Track if input has changed since last send
    const hasChanged = 
      currentInput.up !== this.lastSentInput.up ||
      currentInput.down !== this.lastSentInput.down ||
      currentInput.left !== this.lastSentInput.left ||
      currentInput.right !== this.lastSentInput.right;
      
    // Time since last send
    const timeSinceLastSend = timestamp - this.lastInputSendTime;
    
    // Send if changed or heartbeat interval elapsed (100ms)
    if (hasChanged || timeSinceLastSend > 100) {
      // Track metrics if debug enabled
      if (this.game.config.isDebugEnabled() && hasChanged) {
        this.inputChangeCount = (this.inputChangeCount || 0) + 1;
        if (this.inputChangeCount % 10 === 0) {
          console.log(`MultiplayerMode: Sent ${this.inputChangeCount} input updates`);
        }
      }
      
      // Send to server
      if (this.multiplayerManager) {
        this.multiplayerManager.sendInput(currentInput);
      }
      
      // Update tracking values
      this.lastSentInput = { ...currentInput };
      this.lastInputSendTime = timestamp;
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
  }
  
  /**
   * Update remote players for animation and interpolation
   */
  private updateRemotePlayers(): void {
    // Interpolate remote player positions
    for (const _id in this.remotePlayers) {
      // Apply any visual updates or interpolation
      // This depends on your specific implementation
    }
  }
  
  /**
   * Render multiplayer mode specific elements
   * @param _timestamp - Current timestamp for animation
   */
  render(_timestamp: number): void {
    // Render remote players
    for (const id in this.remotePlayers) {
      const remotePlayer = this.remotePlayers[id];
      
      // Draw remote player - implementation depends on your player visualization
      if (remotePlayer.x !== undefined && remotePlayer.y !== undefined) {
        // Draw remote player at position
        this.drawRemotePlayer(remotePlayer);
      }
    }
    
    // Render any multiplayer-specific UI elements
    this.renderMultiplayerUI();
  }
  
  /**
   * Draw a remote player
   * @param playerData - Remote player data
   */
  private drawRemotePlayer(playerData: NetworkPlayer): void {
    if (!this.game.ctx) return;
    
    // Get player color based on index or other property
    const color = this.getPlayerColor(playerData.index || 0);
    
    // Draw remote player with distinct color
    this.game.ctx.fillStyle = color;
    this.game.ctx.fillRect(
      playerData.x,
      playerData.y,
      this.game.player ? this.game.player.width : 30,
      this.game.player ? this.game.player.height : 30
    );
    
    // Draw player name above
    if (playerData.name) {
      this.game.ctx.fillStyle = 'white';
      this.game.ctx.font = '12px Arial';
      this.game.ctx.textAlign = 'center';
      this.game.ctx.fillText(
        playerData.name,
        playerData.x + (this.game.player ? this.game.player.width / 2 : 15),
        playerData.y - 5
      );
    }
  }
  
  /**
   * Get player color based on index
   * @param index - Player index
   * @returns Color in CSS format
   */
  private getPlayerColor(index: number): string {
    // Define a set of distinct colors for players
    const colors = [
      '#FF5252', // Red
      '#FF9800', // Orange
      '#FFEB3B', // Yellow
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#9C27B0', // Purple
      '#E91E63', // Pink
    ];
    
    return colors[index % colors.length];
  }
  
  /**
   * Render multiplayer-specific UI elements
   */
  private renderMultiplayerUI(): void {
    if (!this.game.ctx || !this.multiplayerManager) return;
    
    // Draw player count
    const totalPlayers = this.multiplayerManager.getTotalPlayers();
    const alivePlayers = this.multiplayerManager.getAliveCount();
    
    this.game.ctx.fillStyle = 'white';
    this.game.ctx.font = '14px Arial';
    this.game.ctx.textAlign = 'right';
    this.game.ctx.fillText(
      `Players: ${alivePlayers}/${totalPlayers}`,
      this.game.canvas.width - 10,
      20
    );
    
    // Draw arena boundary if applicable
    const arenaStats = this.multiplayerManager.getArenaStats();
    if (arenaStats && arenaStats.areaPercentage < 100) {
      // Draw shrinking arena boundary
      this.drawArenaBoundary(arenaStats);
    }
  }
  
  /**
   * Draw arena boundary for battle royale mode
   * @param arenaStats - Arena statistics from server
   */
  private drawArenaBoundary(arenaStats: ArenaStats): void {
    if (!this.game.ctx) return;
    
    // Calculate arena dimensions based on percentage
    const margin = (100 - arenaStats.areaPercentage) / 100;
    const marginX = this.game.canvas.width * (margin / 2);
    const marginY = this.game.canvas.height * (margin / 2);
    
    // Draw arena boundary
    this.game.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    this.game.ctx.lineWidth = 2;
    this.game.ctx.strokeRect(
      marginX,
      marginY,
      this.game.canvas.width - marginX * 2,
      this.game.canvas.height - marginY * 2
    );
  }
  
  /**
   * Post-update operations for multiplayer mode
   */
  postUpdate(): void {
    // Most game logic is server-driven in multiplayer mode
    // Local post-update mainly deals with UI updates
    
    // Update player count display if needed
  }
  
  /**
   * Reset game state
   */
  reset(): void {
    // In multiplayer, reset is mostly server-driven
    // This handles local cleanup
    
    if (this.game.uiManager) {
      this.game.uiManager.updateScore(0);
    }
    
    if (this.game.player) {
      this.game.player.resetPosition();
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
    
    // Request server restart if user is host
    if (this.multiplayerManager) {
      this.multiplayerManager.requestRestart();
    }
    
    // Reset local elements
    this.reset();
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Disconnect from server
    if (this.multiplayerManager) {
      this.multiplayerManager.disconnect();
      this.multiplayerManager = null;
    }
    
    this.remotePlayers = {};
    console.log('MultiplayerMode disposed');
  }
}
