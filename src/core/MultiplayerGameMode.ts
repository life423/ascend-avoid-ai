// src/core/MultiplayerGameMode.ts

/**
 * Multiplayer game mode implementation
 * Handles all multiplayer-specific logic including networking,
 * player synchronization, and rendering of remote players
 */
import { InputState, NetworkPlayer } from '../types'
import { MultiplayerManager } from '../managers/MultiplayerManager'
import { EventBus } from './EventBus'
import { GameEvents } from '../constants/client-constants'

// Player colors for visual distinction
const PLAYER_COLORS = [
    '#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', 
    '#2196F3', '#9C27B0', '#E91E63', '#00BCD4'
]

// Type definition for the game instance to avoid circular dependencies
interface Game {
    gameState: string
    score: number
    highScore: number
    config: any
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    obstacleManager: any
    particleSystem: any
    uiManager: any
    assetManager: any
    scalingInfo: any
    eventBus?: EventBus
    renderSharedScene: (ctx: CanvasRenderingContext2D, timestamp: number) => void
}

export default class MultiplayerGameMode {
    private game: Game
    private multiplayerManager: MultiplayerManager
    private eventBus: EventBus
    private players: Map<string, NetworkPlayer> = new Map()
    private localSessionId: string = ''
    private lastInputSent: number = 0
    private inputSendRate: number = 50 // Send input every 50ms to balance responsiveness and bandwidth

    constructor(game: Game) {
        this.game = game
        this.eventBus = game.eventBus || new EventBus()
        this.multiplayerManager = new MultiplayerManager(this.eventBus, game.assetManager || null)
        this.setupEventListeners()
    }

    /**
     * Set up event listeners for multiplayer events
     */
    private setupEventListeners(): void {
        // Connection established
        this.eventBus.on(GameEvents.MULTIPLAYER_CONNECTED, (data) => {
            console.log('🔗 Connected to multiplayer:', data)
            this.localSessionId = data.sessionId
            console.log('🎯 My session ID:', this.localSessionId)
        })

        // Game state updates from server
        this.eventBus.on(GameEvents.MULTIPLAYER_STATE_UPDATE, (state) => {
            this.handleStateUpdate(state)
        })

        // Player joined
        this.eventBus.on(GameEvents.PLAYER_JOINED, (data) => {
            console.log('👤 Player joined:', data)
        })

        // Player left
        this.eventBus.on(GameEvents.PLAYER_LEFT, (data) => {
            console.log('👋 Player left:', data)
            this.players.delete(data.id)
        })
    }

    /**
     * Initialize multiplayer connection
     */
    async initialize(): Promise<void> {
        console.log('🎮 Initializing multiplayer mode...')
        
        const connected = await this.multiplayerManager.connect()
        if (!connected) {
            throw new Error('Multiplayer server unavailable - this game requires multiplayer connection')
        }
        
        console.log('✅ Multiplayer mode initialized successfully')
    }

    /**
     * Handle state updates from the server
     * This is where we synchronize all player positions and game state
     */
    private handleStateUpdate(state: any): void {
        console.log('📡 State update - Total players:', state.totalPlayers)
        
        if (!state || !state.players) {
            console.log('⚠️ No players in state')
            return
        }

        // Clear existing players and rebuild from server state
        this.players.clear()

        // Add each player from the server state
        state.players.forEach((playerData: any, sessionId: string) => {
            console.log(`🔍 Player ${sessionId}: (${playerData.x}, ${playerData.y})`)
            this.addPlayer(sessionId, playerData)
        })

        console.log(`✅ Final: ${this.players.size} total players`)
    }

    /**
     * Add or update a player in the local state
     */
    private addPlayer(sessionId: string, playerData: any): void {
        const playerIndex = this.players.size
        
        // Ensure player positions are within bounds
        const x = Math.max(50, Math.min(playerData.x || (100 + playerIndex * 80), 700))
        const y = Math.max(50, Math.min(playerData.y || (200 + playerIndex * 60), 800))
        
        const player: NetworkPlayer = {
            id: sessionId,
            sessionId: sessionId,
            x: x,
            y: y,
            width: 30,
            height: 30,
            name: playerData.name || `Player ${playerIndex + 1}`,
            color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
            isAlive: true,
            score: 0,
            playerIndex: playerIndex,
            lastUpdate: Date.now()
        }
        
        this.players.set(sessionId, player)
        
        const isMe = sessionId === this.localSessionId ? ' (ME)' : ''
        console.log(`➕ Added player: ${sessionId}${isMe} at (${x}, ${y}) Color: ${player.color}`)
    }

    /**
     * Update game logic and send input to server
     */
    update(inputState: InputState, _deltaTime: number, timestamp: number): void {
        // Update local game systems (obstacles, etc.)
        if (this.game.obstacleManager) {
            this.game.obstacleManager.update(timestamp, this.game.score, this.game.scalingInfo)
        }
        
        // Send input to server at controlled rate
        const now = Date.now()
        if (now - this.lastInputSent >= this.inputSendRate) {
            this.sendInputToServer(inputState)
            this.lastInputSent = now
        }
    }

    /**
     * Send local player input to server
     */
    private sendInputToServer(inputState: InputState): void {
        if (!this.multiplayerManager.isConnected()) return
        
        // Only send the input state, server handles position updates
        const input = {
            up: inputState.up || false,
            down: inputState.down || false,
            left: inputState.left || false,
            right: inputState.right || false
        }
        
        this.multiplayerManager.sendInput(input)
    }

    /**
     * Render all game elements including shared scene and players
     */
    render(ctx: CanvasRenderingContext2D, timestamp: number): void {
        if (!ctx) return
        
        // Render the shared game scene (background, obstacles, particles, etc.)
        this.game.renderSharedScene(ctx, timestamp)
        
        // Render all players on top
        this.renderAllPlayers(ctx, timestamp)
    }

    /**
     * Render all players (both local and remote)
     */
    private renderAllPlayers(ctx: CanvasRenderingContext2D, _timestamp: number): void {
        console.log(`🎨 Rendering: ${this.players.size} total players`)
        
        this.players.forEach((player, sessionId) => {
            const isLocalPlayer = sessionId === this.localSessionId
            const playerType = isLocalPlayer ? 'ME' : 'OTHER'
            console.log(`🎨 Drawing ${playerType} ${sessionId} at (${player.x}, ${player.y}) ${player.color}`)
            
            ctx.save()
            
            // Draw player as colored rectangle
            ctx.fillStyle = player.color
            ctx.fillRect(player.x, player.y, 30, 30)
            
            // Add border to distinguish local player
            ctx.strokeStyle = isLocalPlayer ? '#ffff00' : '#ffffff'
            ctx.lineWidth = isLocalPlayer ? 3 : 2
            ctx.strokeRect(player.x, player.y, 30, 30)
            
            // Draw player name above the character
            ctx.fillStyle = '#ffffff'
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(player.name, player.x + 15, player.y - 5)
            
            ctx.restore()
        })
    }

    /**
     * Handle post-update operations
     * In multiplayer, win/lose conditions are handled by the server
     */
    postUpdate(): void {
        // Server handles win/lose conditions in multiplayer
        // This method is here for interface compatibility
    }

    /**
     * Reset is handled by server in multiplayer
     */
    reset(): void {
        // Server controls game resets
    }

    /**
     * Complete reset is handled by server in multiplayer
     */
    completeReset(): void {
        // Server controls game resets
    }

    /**
     * Get the current number of players
     */
    getPlayerCount(): number {
        return this.players.size
    }

    /**
     * Clean up resources and disconnect from server
     */
    dispose(): void {
        console.log('🔌 Disposing multiplayer mode...')
        this.multiplayerManager.disconnect()
        this.players.clear()
        this.eventBus.dispose()
    }
}