/**
 * Consolidated game modes implementation using the Strategy Pattern.
 * This file contains the base GameMode class and all its implementations.
 */
import Player from '../entities/Player'
import { InputState, NetworkPlayer } from '../types'

// Forward reference for the Game type to avoid circular dependencies
interface Game {
    gameState: string
    isMultiplayerMode: boolean
    score: number
    highScore: number
    config: any
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    player: Player
    obstacleManager: any
    particleSystem: any
    uiManager: any
    assetManager: any
    scalingInfo: any
}

// Common interfaces
interface Obstacle {
    x: number
    y: number
    width: number
    height: number
}

// interface ParticleOptions {
//   x: number;
//   y: number;
//   count: number;
//   minSize: number;
//   maxSize: number;
//   minLife: number;
//   maxLife: number;
// }

/**
 * Abstract base class for game modes implementing the Strategy Pattern.
 */
export abstract class GameMode {
    /**
     * Reference to the main game controller
     */
    protected game: Game

    /**
     * Whether this mode has been initialized
     */
    protected initialized: boolean

    /**
     * Creates a new GameMode instance
     * @param game - Reference to the main game controller
     */
    constructor(game: Game) {
        if (this.constructor === GameMode) {
            throw new Error(
                'GameMode is an abstract class and cannot be instantiated directly'
            )
        }

        this.game = game
        this.initialized = false
    }

    /**
     * Initialize the game mode
     * @returns A promise that resolves when initialization is complete
     */
    async initialize(): Promise<void> {
        this.initialized = true
        return Promise.resolve()
    }

    /**
     * Update game state for this mode
     * @param inputState - Current input state
     * @param deltaTime - Time since last frame in seconds
     * @param timestamp - Current timestamp for animation
     */
    abstract update(
        inputState: InputState,
        deltaTime: number,
        timestamp: number
    ): void

    /**
     * Render game elements specific to this mode
     * @param timestamp - Current timestamp for animation
     */
    abstract render(timestamp: number): void

    /**
     * Handle post-update operations like win/lose detection
     */
    abstract postUpdate(): void

    /**
     * Handle game reset
     */
    abstract reset(): void

    /**
     * Handle complete reset after game over
     */
    abstract completeReset(): void

    /**
     * Clean up resources when switching away from this mode
     */
    dispose(): void {
        // Default implementation is a no-op
    }
}

/**
 * Implementation of single-player game mode.
 */
export class SinglePlayerMode extends GameMode {
    /**
     * Creates a new SinglePlayerMode instance
     * @param game - Reference to the main game controller
     */
    constructor(game: Game) {
        super(game)

        // Bind methods to maintain proper 'this' context
        this.handleCollision = this.handleCollision.bind(this)
        this.checkForWinner = this.checkForWinner.bind(this)
    }

    /**
     * Initialize the single player mode
     */
    async initialize(): Promise<void> {
        await super.initialize()

        // Set initial state for single player mode
        this.game.isMultiplayerMode = false

        // Reset score and state
        this.reset()

        console.log('SinglePlayerMode initialized')
        return Promise.resolve()
    }

    /**
     * Update game state for single player mode
     */
    update(inputState: InputState, deltaTime: number, timestamp: number): void {
        // Skip if game is not in playing state
        if (this.game.gameState !== this.game.config.STATE.PLAYING) {
            return
        }

        // Update player movement based on input
        this.updatePlayerMovement(inputState)

        // Update player position
        if (this.game.player) {
            this.game.player.move()
        }

        // Update obstacles using scaling info for responsive sizing
        if (this.game.obstacleManager) {
            this.game.obstacleManager.update(
                timestamp,
                this.game.score,
                this.game.scalingInfo
            )

            // Check for collisions with continuous collision detection (pass deltaTime)
            const collision = this.game.obstacleManager.checkCollisions(
                this.game.player,
                deltaTime
            )
            if (collision) {
                this.handleCollision(collision)
            }
        }
    }

    /**
     * Update player movement based on input state
     */
    private updatePlayerMovement(inputState: InputState): void {
        if (!this.game.player) return

        // Apply input to player movement
        this.game.player.setMovementKey('up', inputState.up)
        this.game.player.setMovementKey('down', inputState.down)
        this.game.player.setMovementKey('left', inputState.left)
        this.game.player.setMovementKey('right', inputState.right)

        // Special case for up movement - make it more responsive and scale with screen size
        if (inputState.up && this.game.player.y > 30) {
            // Apply an immediate boost when pressing up, scaled by screen size
            const boostAmount = 30 * this.game.scalingInfo.heightScale
            this.game.player.y -= boostAmount * 0.1
        }
    }

    /**
     * Handle collision with obstacle
     */
    private handleCollision(_obstacle: Obstacle): void {
        // Play collision sound
        if (this.game.assetManager) {
            this.game.assetManager.playSound('collision', 0.3)
        } else {
            // Fallback to legacy sound method
            const playSound = (window as any).playSound || (() => {})
            playSound('collision')
        }

        // Flash screen red
        if (this.game.uiManager) {
            this.game.uiManager.flashScreen('#ff0000', 200)
        }

        // Set game state to game over
        this.game.gameState = this.game.config.STATE.GAME_OVER

        // Show game over screen
        if (this.game.uiManager) {
            this.game.uiManager.showGameOver(
                this.game.score,
                this.game.highScore,
                this.completeReset.bind(this)
            )
        }
    }

    /**
     * Render single player mode specific elements
     */
    render(_timestamp: number): void {
        // Single player mode doesn't have any mode-specific rendering
        // All rendering is handled by the main Game.render method
    }

    /**
     * Post-update operations for single player mode
     */
    postUpdate(): void {
        // Only run these checks if the game is in PLAYING state
        if (this.game.gameState !== this.game.config.STATE.PLAYING) return

        // Check for winner
        this.checkForWinner()

        // Update high score
        this.updateHighScore()
    }

    /**
     * Check if player has reached the winning line
     */
    checkForWinner(): void {
        // Use EXACTLY the same calculation as Game.ts checkForWinner() and drawWinningLine()
        const BASE_CANVAS_HEIGHT = 550
        const scaledWinningLine = this.game.config.getWinningLine(
            this.game.canvas.height,
            BASE_CANVAS_HEIGHT
        )

        // Simple check: if player's top touches or crosses the winning line
        if (
            this.game.player.y <= scaledWinningLine &&
            !this.game.player.hasScored
        ) {
            // Mark as scored to prevent multiple scoring
            this.game.player.hasScored = true

            // Increment score
            this.game.score++
            if (this.game.uiManager) {
                this.game.uiManager.updateScore(this.game.score)
            }

            // Add more obstacles as game progresses
            this.addObstaclesBasedOnScore()

            // Add visual effects
            this.addScoreParticles(scaledWinningLine)

            // Play score sound
            if (this.game.assetManager) {
                this.game.assetManager.playSound('score', 0.3)
            }

            // Reset player to bottom of screen
            this.resetPlayerPosition()
        }
    }

    /**
     * Properly reset player position and scoring flags
     */
    private resetPlayerPosition(): void {
        if (!this.game.player) return

        // Reset player to bottom of screen
        this.game.player.resetPosition()

        // CRITICAL: Reset scoring flag so player can score again
        this.game.player.hasScored = false

        // Reset last position to current position
        this.game.player.lastY = this.game.player.y
    }

    /**
     * Add celebration particles when scoring
     */
    private addScoreParticles(winningLineY: number): void {
        if (!this.game.player || !this.game.particleSystem) return

        // Number of particles based on score (more particles for higher scores)
        const particleCount = Math.min(10 + this.game.score * 2, 50)

        // Apply scaling to particle sizes
        const scaleMultiplier = this.game.scalingInfo?.widthScale || 1

        this.game.particleSystem.createCelebration({
            x: this.game.player.x + this.game.player.width / 2,
            y: winningLineY, // Use exact winning line position
            count: particleCount,
            minSize: 2 * scaleMultiplier,
            maxSize: 7 * scaleMultiplier,
            minLife: 20,
            maxLife: 40,
        })
    }

    /**
     * Add obstacles based on current score
     */
    private addObstaclesBasedOnScore(): void {
        if (!this.game.obstacleManager) return

        // Add initial obstacles for new game
        if (this.game.score <= 2) {
            this.game.obstacleManager.addObstacle()
        }

        // Add obstacles as score increases (difficulty progression)
        if (this.game.score % 4 === 0) {
            this.game.obstacleManager.addObstacle()
        }

        // On small screens, cap the max number of obstacles
        if (
            this.game.scalingInfo.widthScale < 0.7 &&
            this.game.obstacleManager.getObstacles().length > 7
        ) {
            return
        }
    }

    /**
     * Update the high score if needed
     */
    private updateHighScore(): void {
        if (this.game.score > this.game.highScore) {
            this.game.highScore = this.game.score

            if (this.game.uiManager) {
                this.game.uiManager.updateHighScore(this.game.highScore)
            }
        }
    }

    /**
     * Reset game after collision
     */
    reset(): void {
        this.game.score = 0

        if (this.game.uiManager) {
            this.game.uiManager.updateScore(0)
        }

        if (this.game.obstacleManager) {
            this.game.obstacleManager.reset()
        }

        if (this.game.player) {
            this.game.player.resetPosition()
            // Reset scoring flag when game resets
            this.game.player.hasScored = false
        }

        // Clear particles
        if (this.game.particleSystem) {
            this.game.particleSystem.clear()
        }
    }

    /**
     * Complete reset after game over
     */
    completeReset(): void {
        // Hide any game over UI
        if (this.game.uiManager) {
            this.game.uiManager.hideGameOver()
        }

        // Reset game elements
        this.reset()

        // Set game state back to playing
        this.game.gameState = this.game.config.STATE.PLAYING
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        console.log('SinglePlayerMode disposed')
    }
}

/**
 * Implementation of multiplayer game mode.
 */
export class MultiplayerMode extends GameMode {
    private multiplayerManager: any | null
    private remotePlayers: Record<string, NetworkPlayer>
    private lastSentInput?: InputState
    private lastInputSendTime: number
    // private inputChangeCount = 0; // Currently unused

    /**
     * Creates a new MultiplayerMode instance
     */
    constructor(game: Game) {
        super(game)

        // Initialize multiplayer-specific state
        this.multiplayerManager = null
        this.remotePlayers = {}
        this.lastInputSendTime = 0

        // Bind methods to maintain proper 'this' context
        this.handleNetworkUpdate = this.handleNetworkUpdate.bind(this)
    }

    /**
     * Initialize the multiplayer mode
     */
    async initialize(): Promise<void> {
        await super.initialize()

        // Set state for multiplayer mode
        this.game.isMultiplayerMode = true

        // Dynamically import multiplayer manager
        try {
            const { MultiplayerManager } = await import(
                '../managers/MultiplayerManager'
            )

            // Create and initialize the multiplayer manager
            const EventBus = (await import('../core/EventBus')).EventBus
            const AssetManager = (await import('../managers/AssetManager'))
                .default

            const eventBus = new EventBus()
            const assetManager = new AssetManager()

            this.multiplayerManager = new MultiplayerManager(
                eventBus,
                assetManager
            )
            await this.multiplayerManager.connect()

            // Set up multiplayer event handlers
            this.setupEventHandlers()

            console.log('MultiplayerMode initialized')
        } catch (error) {
            console.error('Failed to initialize multiplayer mode:', error)
            throw error
        }

        return Promise.resolve()
    }

    /**
     * Set up event handlers for multiplayer events
     */
    private setupEventHandlers(): void {
        if (!this.multiplayerManager) return

        console.log('✅ Setting up multiplayer event handlers...')

        // The MultiplayerManager uses EventBus, not direct callbacks
        // For now, we'll implement basic event handling
        // TODO: Implement proper EventBus listeners for:
        // - GameEvents.MULTIPLAYER_STATE_UPDATE
        // - GameEvents.PLAYER_JOINED  
        // - GameEvents.PLAYER_LEFT
        // - GameEvents.MULTIPLAYER_ERROR

        console.log('✅ Multiplayer event handlers setup complete')
    }


    /**
     * Handle network state update from the server
     */
    private handleNetworkUpdate(gameState: any): void {
        // Update local game state based on server state
        this.game.gameState = gameState.gameState

        // Update remote players
        if (this.multiplayerManager) {
            this.remotePlayers = this.multiplayerManager.getRemotePlayers()
        }
    }

    /**
     * Update game state for multiplayer mode
     */
    update(
        inputState: InputState,
        _deltaTime: number,
        timestamp: number
    ): void {
        // Skip if game is not in playing state
        if (this.game.gameState !== this.game.config.STATE.PLAYING) {
            return
        }

        // Get local player from multiplayer manager
        const localPlayer = this.multiplayerManager?.getLocalPlayer()

        // Update local player based on input
        if (localPlayer && this.game.player) {
            // Apply input to player (visual representation only)
            this.updatePlayerMovement(inputState)

            // Move local player - this will be overridden by server updates
            // but provides immediate visual feedback
            this.game.player.move()

            // Network optimization: Only send inputs when they change or periodically
            this.throttledInputSend(inputState, timestamp)
        }
    }

    /**
     * Throttled input sending to reduce network traffic
     */
    private throttledInputSend(
        currentInput: InputState,
        timestamp: number
    ): void {
        // Initialize last input values if not set
        if (!this.lastSentInput) {
            this.lastSentInput = {
                up: false,
                down: false,
                left: false,
                right: false,
            }
            this.lastInputSendTime = 0
        }

        // Track if input has changed since last send
        const hasChanged =
            currentInput.up !== this.lastSentInput.up ||
            currentInput.down !== this.lastSentInput.down ||
            currentInput.left !== this.lastSentInput.left ||
            currentInput.right !== this.lastSentInput.right

        // Time since last send
        const timeSinceLastSend = timestamp - this.lastInputSendTime

        // Send if changed or heartbeat interval elapsed (100ms)
        if (hasChanged || timeSinceLastSend > 100) {
            // Send to server
            if (this.multiplayerManager) {
                this.multiplayerManager.sendInput(currentInput)
            }

            // Update tracking values
            this.lastSentInput = { ...currentInput }
            this.lastInputSendTime = timestamp
        }
    }

    /**
     * Update player movement based on input state
     */
    private updatePlayerMovement(inputState: InputState): void {
        if (!this.game.player) return

        // Apply input to player movement
        this.game.player.setMovementKey('up', inputState.up)
        this.game.player.setMovementKey('down', inputState.down)
        this.game.player.setMovementKey('left', inputState.left)
        this.game.player.setMovementKey('right', inputState.right)
    }

    /**
     * Render multiplayer mode specific elements
     */
    render(_timestamp: number): void {
        // Render remote players
        for (const id in this.remotePlayers) {
            const remotePlayer = this.remotePlayers[id]

            // Draw remote player - implementation depends on your player visualization
            if (remotePlayer.x !== undefined && remotePlayer.y !== undefined) {
                // Draw remote player at position
                this.drawRemotePlayer(remotePlayer)
            }
        }

        // Render any multiplayer-specific UI elements
        this.renderMultiplayerUI()
    }

    /**
     * Draw a remote player
     */
    private drawRemotePlayer(playerData: NetworkPlayer): void {
        if (!this.game.ctx) return

        // Get player color based on index or other property
        const color = this.getPlayerColor(playerData.index || 0)

        // Draw remote player with distinct color
        this.game.ctx.fillStyle = color
        this.game.ctx.fillRect(
            playerData.x,
            playerData.y,
            this.game.player ? this.game.player.width : 30,
            this.game.player ? this.game.player.height : 30
        )

        // Draw player name above
        if (playerData.name) {
            this.game.ctx.fillStyle = 'white'
            this.game.ctx.font = '12px Arial'
            this.game.ctx.textAlign = 'center'
            this.game.ctx.fillText(
                playerData.name,
                playerData.x +
                    (this.game.player ? this.game.player.width / 2 : 15),
                playerData.y - 5
            )
        }
    }

    /**
     * Get player color based on index
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
        ]

        return colors[index % colors.length]
    }

    /**
     * Render multiplayer-specific UI elements
     */
    private renderMultiplayerUI(): void {
        if (!this.game.ctx || !this.multiplayerManager) return

        // Draw player count
        const totalPlayers = this.multiplayerManager.getTotalPlayers()
        const alivePlayers = this.multiplayerManager.getAliveCount()

        this.game.ctx.fillStyle = 'white'
        this.game.ctx.font = '14px Arial'
        this.game.ctx.textAlign = 'right'
        this.game.ctx.fillText(
            `Players: ${alivePlayers}/${totalPlayers}`,
            this.game.canvas.width - 10,
            20
        )

        // Draw arena boundary if applicable
        const arenaStats = this.multiplayerManager.getArenaStats()
        if (arenaStats && arenaStats.areaPercentage < 100) {
            // Draw shrinking arena boundary
            this.drawArenaBoundary(arenaStats)
        }
    }

    /**
     * Draw arena boundary for battle royale mode
     */
    private drawArenaBoundary(arenaStats: any): void {
        if (!this.game.ctx) return

        // Calculate arena dimensions based on percentage
        const margin = (100 - arenaStats.areaPercentage) / 100
        const marginX = this.game.canvas.width * (margin / 2)
        const marginY = this.game.canvas.height * (margin / 2)

        // Draw arena boundary
        this.game.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'
        this.game.ctx.lineWidth = 2
        this.game.ctx.strokeRect(
            marginX,
            marginY,
            this.game.canvas.width - marginX * 2,
            this.game.canvas.height - marginY * 2
        )
    }

    /**
     * Post-update operations for multiplayer mode
     */
    postUpdate(): void {
        // Most game logic is server-driven in multiplayer mode
    }

    /**
     * Reset game state
     */
    reset(): void {
        // In multiplayer, reset is mostly server-driven
        // This handles local cleanup

        if (this.game.uiManager) {
            this.game.uiManager.updateScore(0)
        }

        if (this.game.player) {
            this.game.player.resetPosition()
        }

        // Clear particles
        if (this.game.particleSystem) {
            this.game.particleSystem.clear()
        }
    }

    /**
     * Complete reset after game over
     */
    completeReset(): void {
        // Hide any game over UI
        if (this.game.uiManager) {
            this.game.uiManager.hideGameOver()
        }

        // Request server restart if user is host
        if (this.multiplayerManager) {
            this.multiplayerManager.requestRestart()
        }

        // Reset local elements
        this.reset()
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        // Disconnect from server
        if (this.multiplayerManager) {
            this.multiplayerManager.disconnect()
            this.multiplayerManager = null
        }

        this.remotePlayers = {}
        console.log('MultiplayerMode disposed')
    }
}

// Default exports for backward compatibility
export { SinglePlayerMode as default }
