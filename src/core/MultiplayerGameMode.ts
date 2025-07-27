// src/core/MultiplayerGameMode.ts
import GameMode from './GameMode';
import { InputState, NetworkPlayer } from '../types';
import { MultiplayerManager } from '../managers/MultiplayerManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../constants/client-constants';

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

export default class MultiplayerGameMode extends GameMode {
  private multiplayerManager: MultiplayerManager;
  private eventBus: EventBus;
  private remotePlayers: Map<string, NetworkPlayer> = new Map();
  private localSessionId: string = '';
  private lastInputSent: number = 0;
  private inputSendRate: number = 50;

  constructor(game: any) {
    super(game);
    
    this.eventBus = game.eventBus || new EventBus();
    this.multiplayerManager = new MultiplayerManager(
      this.eventBus,
      game.assetManager || null
    );
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on(GameEvents.MULTIPLAYER_CONNECTED, (data) => {
      console.log('🔗 Connected to multiplayer:', data);
      this.localSessionId = data.sessionId;
    });

    this.eventBus.on(GameEvents.MULTIPLAYER_STATE_UPDATE, (state) => {
      this.handleStateUpdate(state);
    });

    this.eventBus.on(GameEvents.PLAYER_JOINED, (data) => {
      console.log('👤 Player joined:', data);
    });

    this.eventBus.on(GameEvents.PLAYER_LEFT, (data) => {
      console.log('👋 Player left:', data);
      this.remotePlayers.delete(data.id);
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    
    console.log('🎮 Initializing multiplayer mode...');
    
    try {
      const connected = await this.multiplayerManager.connect();
      
      if (!connected) {
        console.log('⚠️ Server not available, falling back to single player');
        await (this.game as any).switchGameMode('singlePlayer');
        return;
      }
      
      this.game.isMultiplayerMode = true;
      console.log('✅ Multiplayer mode initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize multiplayer:', error);
      console.log('⚠️ Falling back to single player mode');
      await (this.game as any).switchGameMode('singlePlayer');
    }
  }

  private handleStateUpdate(state: any): void {
    if (!state || !state.players) return;

    const playerCount = Object.keys(state.players).length;
    console.log(`📡 State update: ${playerCount} total players`);

    Object.entries(state.players).forEach(([sessionId, playerData]: [string, any]) => {
      if (sessionId === this.localSessionId) {
        if (this.game.player && state.gameState !== this.game.config.STATE.PLAYING) {
          this.game.player.x = playerData.x;
          this.game.player.y = playerData.y;
        }
      } else {
        this.updateRemotePlayer(sessionId, playerData);
      }
    });

    const statePlayerIds = new Set(Object.keys(state.players));
    this.remotePlayers.forEach((_player, id) => {
      if (!statePlayerIds.has(id) && id !== this.localSessionId) {
        this.remotePlayers.delete(id);
      }
    });

    if (state.gameState) {
      this.game.gameState = state.gameState;
    }
  }

  private updateRemotePlayer(sessionId: string, playerData: any): void {
    let remotePlayer = this.remotePlayers.get(sessionId);
    
    if (!remotePlayer) {
      const playerIndex = this.remotePlayers.size;
      const debugX = 100 + playerIndex * 80;
      const debugY = 200 + playerIndex * 60;
      
      remotePlayer = {
        id: sessionId,
        sessionId: sessionId,
        x: playerData.x ?? debugX,
        y: playerData.y ?? debugY,
        name: playerData.name || `Player ${playerIndex + 1}`,
        color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
        isAlive: playerData.state === 'alive' || true,
        score: playerData.score || 0,
        lastUpdate: Date.now()
      };
      
      this.remotePlayers.set(sessionId, remotePlayer);
    } else {
      remotePlayer.interpolationData = {
        startX: remotePlayer.x,
        startY: remotePlayer.y,
        targetX: playerData.x ?? remotePlayer.x,
        targetY: playerData.y ?? remotePlayer.y,
        startTime: Date.now(),
        duration: 100
      };
      
      remotePlayer.name = playerData.name || remotePlayer.name;
      remotePlayer.isAlive = playerData.state === 'alive' || true;
      remotePlayer.score = playerData.score || 0;
      remotePlayer.lastUpdate = Date.now();
    }
  }

  update(inputState: InputState, _deltaTime: number, timestamp: number): void {
    if (this.game.obstacleManager) {
      this.game.obstacleManager.update(timestamp, this.game.score, this.game.scalingInfo);
    }
    
    this.updateLocalPlayerMovement(inputState);
    
    if (this.game.player) {
      this.game.player.move();
    }
    
    this.interpolateRemotePlayers(timestamp);
    
    const now = Date.now();
    if (now - this.lastInputSent >= this.inputSendRate) {
      this.sendInputToServer(inputState);
      this.lastInputSent = now;
    }
  }

  private interpolateRemotePlayers(timestamp: number): void {
    this.remotePlayers.forEach(player => {
      if (player.interpolationData) {
        const { startX, startY, targetX, targetY, startTime, duration } = player.interpolationData;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = this.easeInOutQuad(progress);
        
        player.x = startX + (targetX - startX) * easeProgress;
        player.y = startY + (targetY - startY) * easeProgress;
        
        if (progress >= 1) {
          player.interpolationData = undefined;
        }
      }
    });
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private updateLocalPlayerMovement(inputState: InputState): void {
    if (!this.game.player) return;

    this.game.player.setMovementKey('up', inputState.up);
    this.game.player.setMovementKey('down', inputState.down);
    this.game.player.setMovementKey('left', inputState.left);
    this.game.player.setMovementKey('right', inputState.right);
  }

  private sendInputToServer(inputState: InputState): void {
    if (!this.multiplayerManager.isConnected()) return;
    
    const input = {
      up: inputState.up || false,
      down: inputState.down || false,
      left: inputState.left || false,
      right: inputState.right || false
    };
    
    console.log(`🎮 Sending input:`, input);
    this.multiplayerManager.sendInput(input);
  }

  render(ctx: CanvasRenderingContext2D, timestamp: number): void {
    if (!ctx) return;
    
    (this.game as any).renderSharedScene(ctx, timestamp);
    this.renderRemotePlayers(ctx, timestamp);
    
    if (this.game.player) {
      this.game.player.draw(timestamp);
    }
  }

  private renderRemotePlayers(ctx: CanvasRenderingContext2D, _timestamp: number): void {
    this.remotePlayers.forEach((player, _sessionId) => {
      if (!player.isAlive) return;
      
      ctx.save();
      ctx.fillStyle = player.color || '#00ff00';
      ctx.fillRect(player.x, player.y, 30, 30);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, player.y, 30, 30);
      ctx.restore();
    });
  }

  postUpdate(): void {}
  reset(): void {}
  completeReset(): void {}
  
  dispose(): void {
    super.dispose();
    this.multiplayerManager.disconnect();
    this.remotePlayers.clear();
  }
}