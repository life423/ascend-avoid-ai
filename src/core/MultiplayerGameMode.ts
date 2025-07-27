// src/core/MultiplayerGameMode.ts
import GameMode from './GameMode';
import { InputState, NetworkPlayer } from '../types';
import { MultiplayerManager } from '../managers/MultiplayerManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../constants/client-constants';
// import { GAME_CONSTANTS } from '../constants/gameConstants';

// Player colors for visual distinction
const PLAYER_COLORS = [
  '#FF5252', // Red
  '#FF9800', // Orange  
  '#FFEB3B', // Yellow
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#00BCD4', // Cyan
];

/**
 * MultiplayerGameMode handles all multiplayer-specific game logic,
 * including remote player management and rendering
 */
export default class MultiplayerGameMode extends GameMode {
  private multiplayerManager: MultiplayerManager;
  private eventBus: EventBus;
  private remotePlayers: Map<string, NetworkPlayer> = new Map();
  private localSessionId: string = '';
  private lastInputSent: number = 0;
  private inputSendRate: number = 50; // Send input every 50ms max


  constructor(game: any) {
    super(game);
    
    // Create event bus if game doesn't have one
    this.eventBus = game.eventBus || new EventBus();
    
    // Initialize multiplayer manager
    this.multiplayerManager = new MultiplayerManager(
      this.eventBus,
      game.assetManager || null
    );
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for multiplayer events
   */
  private setupEventListeners(): void {
    // Handle successful connection
    this.eventBus.on(GameEvents.MULTIPLAYER_CONNECTED, (data) => {
      console.log('🔗 Connected to multiplayer:', data);
      this.localSessionId = data.sessionId;
    });

    // Handle state updates from server
    this.eventBus.on(GameEvents.MULTIPLAYER_STATE_UPDATE, (state) => {
      this.handleStateUpdate(state);
    });

    // Handle player joined
    this.eventBus.on(GameEvents.PLAYER_JOINED, (data) => {
      console.log('👤 Player joined:', data);
    });

    // Handle player left
    this.eventBus.on(GameEvents.PLAYER_LEFT, (data) => {
      console.log('👋 Player left:', data);
      this.remotePlayers.delete(data.id);
    });
  }

  /**
   * Initialize multiplayer mode
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    console.log('🎮 Initializing multiplayer mode...');
    
    try {
      // Connect to the game server
      const connected = await this.multiplayerManager.connect();
      
      if (!connected) {
        console.log('⚠️ Server not available, falling back to single player');
        await (this.game as any).switchGameMode('singlePlayer');
        return;
      }
      
      // Set game to multiplayer mode
      this.game.isMultiplayerMode = true;
      
      console.log('✅ Multiplayer mode initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize multiplayer:', error);
      console.log('⚠️ Falling back to single player mode');
      await (this.game as any).switchGameMode('singlePlayer');
    }
  }

  /**
   * Handle state updates from the server
   */
  private handleStateUpdate(state: any): void {
    if (!state || !state.players) return;

    const playerCount = Object.keys(state.players).length;
    console.log(`📡 State update: ${playerCount} total players`);

    // Update remote players from state
    Object.entries(state.players).forEach(([sessionId, playerData]: [string, any]) => {
      console.log(`🔍 Processing player ${sessionId} (local: ${this.localSessionId})`);
      
      if (sessionId === this.localSessionId) {
        // snap local sprite to server‑authoritative spawn once (lobby phase)
        if (this.game.player && state.gameState !== this.game.config.STATE.PLAYING) {
          this.game.player.x = playerData.x;
          this.game.player.y = playerData.y;
        }
      } else {
        // This is a remote player - update or create
        console.log(`➕ Adding/updating remote player: ${sessionId}`);
        this.updateRemotePlayer(sessionId, playerData);
      }
    });

    console.log(`🎮 Remote players count: ${this.remotePlayers.size}`);

    // Remove players that are no longer in the state
    const statePlayerIds = new Set(Object.keys(state.players));
    this.remotePlayers.forEach((_player, id) => {
      if (!statePlayerIds.has(id) && id !== this.localSessionId) {
        console.log(`🗑️ Removing disconnected player: ${id}`);
        this.remotePlayers.delete(id);
      }
    });

    // Update game state info
    if (state.gameState) {
      this.game.gameState = state.gameState;
    }
  }

  /**
   * Update or create a remote player
   */
  private updateRemotePlayer(sessionId: string, playerData: any): void {
    let remotePlayer = this.remotePlayers.get(sessionId);
    
    if (!remotePlayer) {
      // Create new remote player with debug positioning
      const playerIndex = this.remotePlayers.size; // Use current count as index
      const debugX = 100 + playerIndex * 80; // Spread horizontally
      const debugY = 200 + playerIndex * 60; // Spread vertically
      
      remotePlayer = {
        id: sessionId,
        sessionId: sessionId,
        x: playerData.x ?? debugX,
        y: playerData.y ?? debugY,
        name: playerData.name || `Player ${playerIndex + 1}`,
        color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
        isAlive: true, // Force alive for now to test rendering
        score: playerData.score || 0,
        lastUpdate: Date.now()
      };
      
      console.log(`🎨 Created remote player at (${remotePlayer.x}, ${remotePlayer.y}) color: ${remotePlayer.color}`);
      
      this.remotePlayers.set(sessionId, remotePlayer);
      console.log('➕ Created remote player:', remotePlayer.name);
    } else {
      // Update existing remote player with interpolation data
      remotePlayer.interpolationData = {
        startX: remotePlayer.x,
        startY: remotePlayer.y,
        targetX: playerData.x || remotePlayer.x,
        targetY: playerData.y || remotePlayer.y,
        startTime: Date.now(),
        duration: 100 // Interpolate over 100ms
      };
      
      remotePlayer.name = playerData.name || remotePlayer.name;
      remotePlayer.isAlive = true; // Force alive for now
      remotePlayer.score = playerData.score || 0;
      remotePlayer.lastUpdate = Date.now();
    }
  }

  /**
   * Update game state for multiplayer mode
   */
  update(inputState: InputState, _deltaTime: number, timestamp: number): void {
    // Handle common updates ourselves since parent update is abstract
    // We'll handle obstacles, collisions, etc. directly
    
    // Update obstacles
    if (this.game.obstacleManager) {
      this.game.obstacleManager.update(timestamp, this.game.score, this.game.scalingInfo);
    }
    
    // Update local player movement based on input
    this.updateLocalPlayerMovement(inputState);
    
    // Move the local player
    if (this.game.player) {
      this.game.player.move();
    }
    
    // Interpolate remote player positions for smooth movement
    this.interpolateRemotePlayers(timestamp);
    
    // Send input to server at controlled rate
    const now = Date.now();
    if (now - this.lastInputSent >= this.inputSendRate) {
      this.sendInputToServer(inputState);
      this.lastInputSent = now;
    }
  }

  /**
   * Interpolate remote player positions for smooth movement
   */
  private interpolateRemotePlayers(timestamp: number): void {
    this.remotePlayers.forEach(player => {
      if (player.interpolationData) {
        const { startX, startY, targetX, targetY, startTime, duration } = player.interpolationData;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth movement
        const easeProgress = this.easeInOutQuad(progress);
        
        player.x = startX + (targetX - startX) * easeProgress;
        player.y = startY + (targetY - startY) * easeProgress;
        
        // Clean up interpolation data when complete
        if (progress >= 1) {
          player.interpolationData = undefined;
        }
      }
    });
  }

  /**
   * Easing function for smooth interpolation
   */
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Update local player movement based on input state
   */
  private updateLocalPlayerMovement(inputState: InputState): void {
    if (!this.game.player) return;

    // Apply input to player movement
    this.game.player.setMovementKey('up', inputState.up);
    this.game.player.setMovementKey('down', inputState.down);
    this.game.player.setMovementKey('left', inputState.left);
    this.game.player.setMovementKey('right', inputState.right);
  }

  /**
   * Send input state to server
   */
  private sendInputToServer(inputState: InputState): void {
    if (!this.multiplayerManager.isConnected()) return;
    
    // FIXED: Convert InputState to the format expected by server
    const input = {
      up: inputState.up || false,
      down: inputState.down || false,
      left: inputState.left || false,
      right: inputState.right || false
    };
    
    this.multiplayerManager.sendInput(input);
  }

  /**
   * Render all game entities including remote players
   */
  render(ctx: CanvasRenderingContext2D, timestamp: number): void {
    if (!ctx) return;
    
    // FIRST: Render shared scene (background, obstacles, etc.)
    (this.game as any).renderSharedScene(ctx, timestamp);
    
    // THEN: Render all remote players FIRST (behind local player)
    this.renderRemotePlayers(ctx, timestamp);
    
    // FINALLY: Render local player on top
    if (this.game.player) {
      this.game.player.draw(timestamp);
    }
    
    // Render player names and scores
    this.renderPlayerInfo(ctx);
    
    // DEBUG: Show multiplayer info
    this.renderMultiplayerDebug(ctx);
  }

  /**
   * Render all remote players
   */
  private renderRemotePlayers(ctx: CanvasRenderingContext2D, _timestamp: number): void {
    this.remotePlayers.forEach((player, _sessionId) => {
      if (!player.isAlive) return;
      
      // Save context state
      ctx.save();
      
      // Draw player sprite/rectangle
      ctx.fillStyle = player.color || '#00ff00';
      ctx.fillRect(
        player.x,
        player.y,
        this.game.player?.width || 30,
        this.game.player?.height || 30
      );
      
      // Add a border to make remote players distinct
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        player.x,
        player.y,
        this.game.player?.width || 30,
        this.game.player?.height || 30
      );
      
      // Restore context state
      ctx.restore();
    });
  }

  /**
   * Render player names above their sprites
   */
  private renderPlayerInfo(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Render remote player names
    this.remotePlayers.forEach(player => {
      if (!player.isAlive) return;
      
      const playerWidth = this.game.player?.width || 30;
      const nameX = player.x + playerWidth / 2;
      const nameY = player.y - 10;
      
      // Draw name background for readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(player.name).width;
      ctx.fillRect(nameX - textWidth / 2 - 4, nameY - 14, textWidth + 8, 18);
      
      // Draw name
      ctx.fillStyle = '#ffffff';
      ctx.fillText(player.name, nameX, nameY);
    });
    
    // Render local player name
    if (this.game.player && this.localSessionId) {
      const localPlayer = this.game.player;
      const nameX = localPlayer.x + localPlayer.width / 2;
      const nameY = localPlayer.y - 10;
      
      // Get local player name from storage or default
      const localName = sessionStorage.getItem('playerName') || 'You';
      
      // Draw name background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(localName).width;
      ctx.fillRect(nameX - textWidth / 2 - 4, nameY - 14, textWidth + 8, 18);
      
      // Draw name with special color
      ctx.fillStyle = '#ffff00'; // Yellow for local player
      ctx.fillText(localName, nameX, nameY);
    }
    
    ctx.restore();
  }

  /**
   * Render debug information for multiplayer
   */
  private renderMultiplayerDebug(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    const remoteCount = this.remotePlayers.size;
    const connected = this.multiplayerManager.isConnected();
    
    ctx.fillText(`Multiplayer: ${connected ? 'Connected' : 'Disconnected'}`, 10, 30);
    ctx.fillText(`Remote Players: ${remoteCount}`, 10, 50);
    ctx.fillText(`Session: ${this.localSessionId.substring(0, 8)}...`, 10, 70);
    
    ctx.restore();
  }

  /**
   * Handle post-update operations like win/lose detection
   */
  postUpdate(): void {
    // In multiplayer mode, most game logic is server-driven
    // Handle any client-side post-update logic here
  }

  /**
   * Handle game reset
   */
  reset(): void {
    // Reset local game state
    if (this.game.player) {
      this.game.player.resetPosition();
    }
    
    // Clear particles
    if (this.game.particleSystem) {
      this.game.particleSystem.clear();
    }
    
    // Reset score (though this might be server-driven)
    this.game.score = 0;
    if (this.game.uiManager) {
      this.game.uiManager.updateScore(0);
    }
  }

  /**
   * Handle complete reset after game over
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
   * Clean up multiplayer mode
   */
  dispose(): void {
    super.dispose();
    
    // Disconnect from server
    this.multiplayerManager.disconnect();
    
    // Clear remote players
    this.remotePlayers.clear();
    
    // Clear event listeners (store handlers to properly remove them)
    // For now, we'll handle this in a more robust way in the future
    try {
      // EventBus.off expects event and handler, but we don't have handler refs
      // This is a TODO for proper cleanup
    } catch (error) {
      console.warn('Error removing event listeners:', error);
    }
    
    console.log('🗑️ Multiplayer mode disposed');
  }
}