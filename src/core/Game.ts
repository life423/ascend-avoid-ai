// src/core/Game.ts

/**
 * Main game controller - Multiplayer-only implementation
 * Manages the game loop, rendering pipeline, and multiplayer coordination
 */
import { PerformanceStats, ScalingInfo } from '../types'
import Background from '../entities/Background'
import ResponsiveManager from '../managers/ResponsiveManager'
import TouchControls from '../ui/TouchControls'
import ParticleSystem from '../entities/ParticleSystem'
import AssetManager from '../managers/AssetManager'
import InputManager from '../managers/InputManager'
import ObstacleManager from '../managers/ObstacleManager'
import UIManager from '../managers/UIManager'
import GameConfig from './GameConfig'
import MultiplayerGameMode from './MultiplayerGameMode'

const BASE_CANVAS_HEIGHT = 550

export default class Game {
    // Core game components
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    
    // Managers
    responsiveManager!: ResponsiveManager
    inputManager: InputManager | null
    obstacleManager: ObstacleManager | null
    uiManager: UIManager | null
    assetManager: AssetManager | null
    
    // Game state
    gameState: string
    score: number
    highScore: number
    lastFrameTime: number
    
    // Configuration
    config: GameConfig
    isDesktop: boolean
    scalingInfo: ScalingInfo
    
    // Game mode
    multiplayerMode: MultiplayerGameMode | null
    
    // Visual components
    background: Background
    touchControls: TouchControls
    particleSystem: ParticleSystem | null
    
    // Performance tracking
    frameTimes: number[]
    frameTimeIndex: number
    frameTimeWindow: number
    performanceStats: PerformanceStats

    constructor() {
        console.log('Initializing multiplayer game...')

        // Canvas setup - try multiple selectors for compatibility
        this.canvas = (document.querySelector('.game-canvas[data-canvas="primary"]') as HTMLCanvasElement) ||
                     (document.getElementById('gameCanvas') as HTMLCanvasElement) ||
                     document.createElement('canvas')
        
        this.ctx = this.canvas.getContext('2d')!
        
        // Initialize game state
        this.score = 0
        this.highScore = 0
        this.lastFrameTime = 0
        this.multiplayerMode = null
        
        // Performance monitoring setup
        this.frameTimes = []
        this.frameTimeIndex = 0
        this.frameTimeWindow = 60
        this.performanceStats = {
            avgFrameTime: 0,
            maxFrameTime: 0,
            minFrameTime: Infinity,
            frameCount: 0,
        }
        
        // Device and configuration setup
        this.isDesktop = window.matchMedia('(min-width: 1200px)').matches
        this.config = new GameConfig({ isDesktop: this.isDesktop })
        this.gameState = this.config.STATE.READY
        
        // Initialize managers as null - they'll be created in init()
        this.inputManager = null
        this.obstacleManager = null
        this.uiManager = null
        this.assetManager = null
        
        // Scaling information for responsive design
        this.scalingInfo = {
            widthScale: 1,
            heightScale: 1,
            pixelRatio: 1,
            reducedResolution: false,
        }
        
        // Visual components initialized in init()
        this.background = null!
        this.touchControls = null!
        this.particleSystem = null
        
        this.init()
    }

    /**
     * Initialize all game systems and start the multiplayer connection
     */
    async init(): Promise<void> {
        // Set up UI manager first for loading screen
        const scoreElement = document.querySelector('.score-value[data-score="current"]')
        const highScoreElement = document.querySelector('.score-value[data-score="high"]')
        
        this.uiManager = new UIManager({
            scoreElement: scoreElement || document.createElement('div'),
            highScoreElement: highScoreElement || document.createElement('div'),
            config: this.config,
        })

        this.uiManager.showLoading('Connecting to multiplayer server...')
        
        // Initialize asset manager
        this.assetManager = new AssetManager()
        await this.preloadAssets()

        // Set up responsive canvas management
        this.responsiveManager = new ResponsiveManager(this)
        this.responsiveManager.init(this.canvas)
        this.scalingInfo = this.responsiveManager.getScalingInfo()
        this.responsiveManager.onResize = this.onResize.bind(this)

        // Initialize visual components
        this.background = new Background(this.canvas)
        this.particleSystem = new ParticleSystem({
            canvas: this.canvas,
            poolSize: 200,
            maxParticles: 500,
        })

        // Initialize obstacle system
        this.obstacleManager = new ObstacleManager({
            canvas: this.canvas,
            config: this.config,
        })
        this.obstacleManager.initialize()

        // Set up input handling
        this.inputManager = new InputManager({
            keyMappings: this.config.getKeys(),
        })

        // Event listeners
        document.addEventListener('game:restart', this.handleRestartEvent.bind(this))
        this.setupTouchControls()

        // Initialize multiplayer mode
        await this.initializeMultiplayerMode()

        // Hide loading screen and start game loop
        this.uiManager.hideLoading()
        this.gameState = this.config.STATE.PLAYING
        requestAnimationFrame(this.gameLoop.bind(this))

        console.log('Multiplayer game initialized successfully')
    }

    /**
     * Initialize and connect to multiplayer server
     */
    async initializeMultiplayerMode(): Promise<void> {
        if (this.multiplayerMode) {
            this.multiplayerMode.dispose()
            this.multiplayerMode = null
        }

        this.multiplayerMode = new MultiplayerGameMode(this)
        await this.multiplayerMode.initialize()
        console.log('Connected to multiplayer server')
    }

    /**
     * Handle window resize events
     */
    onResize(): void {
        this.scalingInfo = this.responsiveManager.getScalingInfo()
        this.isDesktop = window.innerWidth >= 1024
        this.config.setDesktopMode(this.isDesktop)

        if (this.background) {
            this.background.resize()
        }

        // Recalculate obstacle heights for new screen size
        if (this.obstacleManager) {
            const obstacles = this.obstacleManager.getObstacles()
            for (const obstacle of obstacles) {
                obstacle.calculateHeight()
            }
        }
    }

    /**
     * Set up touch controls for mobile devices
     */
    setupTouchControls(): void {
        this.touchControls = new TouchControls(this)
        const isSmallScreen = window.innerWidth < 768
        
        if (isSmallScreen) {
            this.touchControls.show()
        }

        // Register touch buttons with input manager
        if (this.inputManager && this.touchControls.buttonElements) {
            for (const [direction, button] of Object.entries(this.touchControls.buttonElements)) {
                if (button) {
                    this.inputManager.registerTouchButton(button as HTMLElement, direction)
                }
            }
        }

        if (this.inputManager) {
            this.inputManager.setupTouchControls(this.canvas)
        }
    }

    /**
     * Preload any required assets
     */
    async preloadAssets(): Promise<boolean> {
        console.log('Assets preloaded (using generated sprites)')
        return true
    }

    /**
     * Handle game restart events
     */
    handleRestartEvent(): void {
        if (this.gameState === this.config.STATE.GAME_OVER) {
            this.completeReset()
        } else if (this.gameState === this.config.STATE.PLAYING) {
            this.resetGame()
        }

        if (this.uiManager) {
            this.uiManager.hideGameOver()
        }
    }

    /**
     * Main game loop - handles update and render cycles
     */
    gameLoop(timestamp: number): void {
        const frameStartTime = performance.now()
        requestAnimationFrame(this.gameLoop.bind(this))

        // Calculate delta time with cap to prevent large jumps
        let deltaTime = 0
        if (this.lastFrameTime !== 0) {
            deltaTime = (timestamp - this.lastFrameTime) / 1000
            deltaTime = Math.min(deltaTime, 0.1) // Cap at 100ms
        }
        this.lastFrameTime = timestamp

        try {
            // Always render, but only update game logic when playing
            if (this.gameState === this.config.STATE.PLAYING) {
                // Get current input state
                const inputState = this.inputManager ? this.inputManager.getInputState() : 
                    { up: false, down: false, left: false, right: false }

                // Update multiplayer mode
                if (this.multiplayerMode) {
                    this.multiplayerMode.update(inputState, deltaTime, timestamp)
                }

                // Update common systems
                this.updateCommonSystems(deltaTime)
            }

            // Always render
            this.render(timestamp)

            // Post-update checks (win conditions, etc.)
            if (this.gameState === this.config.STATE.PLAYING && this.multiplayerMode) {
                this.multiplayerMode.postUpdate()
            }

            // Track performance
            this.trackFrameTime(performance.now() - frameStartTime)
        } catch (error) {
            console.error('Error in game loop:', error)
        }
    }

    /**
     * Track frame time for performance monitoring
     */
    trackFrameTime(frameTime: number): void {
        this.frameTimes[this.frameTimeIndex] = frameTime
        this.frameTimeIndex = (this.frameTimeIndex + 1) % this.frameTimeWindow

        this.performanceStats.frameCount++
        if (this.performanceStats.frameCount % 60 === 0) {
            let sum = 0, max = 0, min = Infinity
            for (let i = 0; i < this.frameTimes.length; i++) {
                const time = this.frameTimes[i] || 0
                sum += time
                max = Math.max(max, time)
                if (time > 0) min = Math.min(min, time)
            }

            const validTimes = this.frameTimes.filter(t => t > 0)
            this.performanceStats.avgFrameTime = sum / (validTimes.length || 1)
            this.performanceStats.maxFrameTime = max
            this.performanceStats.minFrameTime = min === Infinity ? 0 : min
        }
    }

    /**
     * Update systems that run regardless of game mode
     */
    updateCommonSystems(deltaTime: number): void {
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime)
        }
    }

    /**
     * Main render method - delegates to multiplayer mode
     */
    render(timestamp: number): void {
        if (!this.ctx || !this.canvas) return

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // Render game through multiplayer mode
        if (this.multiplayerMode) {
            this.multiplayerMode.render(this.ctx, timestamp)
        }

        // Debug info overlay
        if (this.config.isDebugEnabled()) {
            this.drawDebugInfo()
        }
    }

    /**
     * Render shared scene elements (called by multiplayer mode)
     * This allows the mode to control when these elements are drawn
     */
    public renderSharedScene(ctx: CanvasRenderingContext2D, timestamp: number): void {
        // Draw background
        if (this.background && typeof this.background.draw === 'function') {
            this.background.draw(timestamp)
        } else {
            ctx.fillStyle = '#0a192f'
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }

        // Draw obstacles
        const obstacles = this.obstacleManager?.getObstacles() || []
        obstacles.forEach(obstacle => {
            if (typeof (obstacle as any).draw === 'function') {
                (obstacle as any).draw(ctx)
            }
        })

        // Draw particles
        if (this.particleSystem) {
            this.particleSystem.draw()
        }

        // Draw touch controls
        if (this.touchControls && typeof this.touchControls.draw === 'function') {
            this.touchControls.draw()
        }

        // Draw winning line
        this.drawWinningLine(timestamp)
    }

    /**
     * Reset game state while keeping connection
     */
    resetGame(): void {
        this.score = 0
        if (this.uiManager) {
            this.uiManager.updateScore(0)
        }
        if (this.obstacleManager) {
            this.obstacleManager.reset()
        }
        if (this.particleSystem) {
            this.particleSystem.clear()
        }
    }

    /**
     * Complete reset after game over
     */
    completeReset(): void {
        if (this.uiManager) {
            this.uiManager.hideGameOver()
        }
        this.resetGame()
        this.gameState = this.config.STATE.PLAYING
    }

    /**
     * Draw the animated winning line
     */
    drawWinningLine(timestamp: number): void {
        const scaledWinningLine = this.config.getWinningLine(this.canvas.height, BASE_CANVAS_HEIGHT)
        
        this.ctx.save()
        this.ctx.globalAlpha = 0.7 + 0.3 * Math.sin(timestamp * 0.002)
        this.ctx.strokeStyle = '#7FDBFF'
        this.ctx.lineWidth = 2 * this.scalingInfo.heightScale
        this.ctx.setLineDash([5, 5])
        this.ctx.beginPath()
        this.ctx.moveTo(0, scaledWinningLine)
        this.ctx.lineTo(this.canvas.width, scaledWinningLine)
        this.ctx.stroke()
        this.ctx.restore()
    }

    /**
     * Draw debug information overlay
     */
    drawDebugInfo(): void {
        this.ctx.save()
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = '12px monospace'
        this.ctx.textAlign = 'left'

        const fps = Math.round(1000 / (this.performanceStats.avgFrameTime || 16))
        const playerCount = this.multiplayerMode?.getPlayerCount() || 0

        const debugLines = [
            `FPS: ${fps}`,
            `Players: ${playerCount}`,
            `Canvas: ${this.canvas.width}x${this.canvas.height}`,
            `Game State: ${this.gameState}`,
        ]

        debugLines.forEach((line, index) => {
            this.ctx.fillText(line, 10, 20 + index * 15)
        })

        this.ctx.restore()
    }

    /**
     * Clean up resources and disconnect
     */
    dispose(): void {
        document.removeEventListener('game:restart', this.handleRestartEvent.bind(this))
        
        if (this.multiplayerMode) {
            this.multiplayerMode.dispose()
            this.multiplayerMode = null
        }

        if (this.responsiveManager) {
            this.responsiveManager.dispose()
        }

        if (this.touchControls) {
            this.touchControls.hide()
        }
    }
}