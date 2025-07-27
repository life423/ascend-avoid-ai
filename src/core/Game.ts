import { InputState, ScalingInfo, NetworkPlayer } from '../types'
import { PlayerSchema, GameState } from '../../shared/schema'
import Background from '../entities/Background'
import { EventBus } from './EventBus'
import GameConfig from './GameConfig'
import InputManager from '../managers/InputManager'
import ObstacleManager from '../managers/ObstacleManager'
import UIManager from '../managers/UIManager'
import AssetManager from '../managers/AssetManager'
import ResponsiveManager from '../managers/ResponsiveManager'
import ParticleSystem from '../entities/ParticleSystem'
import TouchControls from '../ui/TouchControls'
import { Client, Room } from 'colyseus.js'
import { GAME_CONFIG, PLAYER_COLORS } from '../constants/gameConstants'
import { generateRandomName } from '../utils/utils'
// ResponsiveManager now handles responsive system integration



export default class Game {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    eventBus: EventBus
    background: Background
    lastFrameTime: number = 0
    scalingInfo: ScalingInfo = { widthScale: 1, heightScale: 1, pixelRatio: 1 }
    config: GameConfig
    inputManager: InputManager
    obstacleManager: ObstacleManager
    uiManager: UIManager
    assetManager: AssetManager
    responsiveManager: ResponsiveManager
    particleSystem: ParticleSystem
    touchControls: TouchControls
    gameState: string
    score: number = 0
    
    // Multiplayer
    private client: Client | null = null
    private room: Room | null = null
    private players: Map<string, NetworkPlayer> = new Map()
    private localSessionId: string = ''
    private playerReady: boolean = false

    // Virtual coordinate system - fixed dimensions for consistent gameplay
    private readonly VIRTUAL_WIDTH: number = 1200
    private readonly VIRTUAL_HEIGHT: number = 800
    private serverArenaWidth: number = 1200  // Will be updated from server
    private serverArenaHeight: number = 800  // Will be updated from server
    private lastViewportHeight: number = 0   // Track viewport height changes for mobile

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
        if (!this.canvas) {
            throw new Error('Canvas not found')
        }
        this.ctx = this.canvas.getContext('2d')!
        this.eventBus = new EventBus()
        this.config = new GameConfig({ isDesktop: window.innerWidth > 1024 })
        this.gameState = this.config.STATE.READY

        this.assetManager = new AssetManager()
        this.inputManager = new InputManager({ keyMappings: this.config.getKeys() as any })
        this.uiManager = new UIManager({
            scoreElement: document.querySelector('.score-value[data-score="current"]') as HTMLElement,
            highScoreElement: document.querySelector('.score-value[data-score="high"]') as HTMLElement,
            config: this.config,
        })
        
        // Initialize responsive manager after UI manager
        // ResponsiveManager works with UnifiedResponsiveSystem to handle canvas sizing
        console.log('🖼️ Initializing ResponsiveManager for canvas sizing...')
        this.responsiveManager = new ResponsiveManager(this)
        this.responsiveManager.init(this.canvas)
        this.scalingInfo = this.responsiveManager.getScalingInfo()
        this.responsiveManager.onResize = this.onResize.bind(this)
        
        // ResponsiveManager now uses FluidResponsiveSystem internally
        
        this.obstacleManager = new ObstacleManager({
            canvas: this.canvas,
            config: this.config,
        })
        this.particleSystem = new ParticleSystem({
            canvas: this.canvas,
            poolSize: 200,
            maxParticles: 500,
        })
        this.touchControls = new TouchControls(this, this.eventBus)
        this.background = new Background(this.canvas)

        // Set up touch controls for InputManager
        this.inputManager.setupTouchControls(this.canvas)
        
        // Register touch buttons with InputManager
        this.setupTouchControls()

        this.connectToServer()
        this.gameLoop()
    }

    /**
     * Set up touch controls and register buttons with InputManager
     */
    private setupTouchControls(): void {
        if (this.inputManager && this.touchControls && this.touchControls.buttonElements) {
            console.log('🎮 Registering touch buttons with InputManager...')
            
            // Register directional buttons
            for (const [direction, button] of Object.entries(this.touchControls.buttonElements)) {
                if (button && ['up', 'down', 'left', 'right'].includes(direction)) {
                    console.log(`  Registering ${direction} button`)
                    this.inputManager.registerTouchButton(button as HTMLElement, direction)
                }
            }
            
            console.log('✅ Touch controls setup complete')
        } else {
            console.log('⚠️ Cannot setup touch controls - missing dependencies')
        }
    }

    private async connectToServer(): Promise<void> {
        try {
            const wsUrl = window.location.hostname === 'localhost' ? 'ws://localhost:3000' : `wss://${window.location.host}`
            this.client = new Client(wsUrl)
            this.room = await this.client.joinOrCreate(GAME_CONFIG.ROOM_NAME, {
                playerName: generateRandomName()
            })
            
            this.localSessionId = this.room.sessionId
            console.log('🔗 Connected to server')
            console.log('📋 Room ID:', this.room.id)
            console.log('🆔 Session ID:', this.localSessionId)
            console.log('🏠 Room Name:', this.room.name)
            console.log('📐 Canvas dimensions:', this.canvas.width, 'x', this.canvas.height)
            
            // Monitor room events
            this.room.onMessage('playerJoined', (data) => {
                console.log('🟢 Player joined:', data)
            })
            
            this.room.onMessage('playerLeft', (data) => {
                console.log('🔴 Player left:', data)
            })
            
            this.room.onMessage('playerNotReady', (data) => {
                console.warn('⚠️ Server says our player is not ready yet:', data)
            })
            
            // Initial state setup
            this.room.onStateChange.once((state) => {
                console.log('📡 Initial state received')
                console.log('   Room ID:', this.room?.id)
                console.log('   Total players:', state.players?.size || 0)
                
                // Get server arena dimensions (should match our virtual dimensions)
                if (state.arenaWidth && state.arenaHeight) {
                    this.serverArenaWidth = state.arenaWidth
                    this.serverArenaHeight = state.arenaHeight
                    console.log('🎮 Server arena:', this.serverArenaWidth, 'x', this.serverArenaHeight)
                    console.log('📏 Virtual space:', this.VIRTUAL_WIDTH, 'x', this.VIRTUAL_HEIGHT)
                    
                    if (this.serverArenaWidth !== this.VIRTUAL_WIDTH || this.serverArenaHeight !== this.VIRTUAL_HEIGHT) {
                        console.warn('⚠️ Server arena size differs from virtual coordinate system!')
                    }
                }
                
                // Set up fine-grained callbacks for the players map
                this.setupPlayerCallbacks(state)
            })
        } catch (error) {
            console.error('Failed to connect to server:', error)
        }
    }

    private serverToVirtualX(serverX: number): number {
        // Server coordinates map directly to virtual coordinates
        // since server now uses the same dimensions as virtual space
        return serverX
    }

    private serverToVirtualY(serverY: number): number {
        // Server coordinates map directly to virtual coordinates
        return serverY
    }

    private virtualToCanvasX(virtualX: number): number {
        // ResponsiveCanvas handles the scaling automatically via devicePixelRatio
        // We just need to scale from virtual space to current canvas logical size
        const logicalWidth = this.canvas.width / (window.devicePixelRatio || 1)
        return (virtualX / this.VIRTUAL_WIDTH) * logicalWidth
    }

    private virtualToCanvasY(virtualY: number): number {
        const logicalHeight = this.canvas.height / (window.devicePixelRatio || 1)
        return (virtualY / this.VIRTUAL_HEIGHT) * logicalHeight
    }

    private setupPlayerCallbacks(state: GameState): void {
        if (!state.players) return
        
        // Handle new players being added
        state.players.onAdd((player: PlayerSchema, sessionId: string) => {
            console.log('➕ Player added via onAdd:', sessionId)
            
            // If this is our local player, mark as ready for input
            if (sessionId === this.localSessionId) {
                this.playerReady = true
                const gameState = this.room?.state?.gameState || 'unknown'
                console.log(`🎮 Local player ready for input! Game state: ${gameState}`)
                
                // Extra debug for mid-game joins
                if (gameState === 'playing') {
                    console.log(`⚠️ Joined during active game - player should be positioned safely`)
                }
            }
            
            // Create visual representation for the player - use server's playerIndex for consistent colors
            const color = PLAYER_COLORS[player.playerIndex % PLAYER_COLORS.length]
            
            const networkPlayer: NetworkPlayer = {
                id: sessionId,
                sessionId: sessionId,
                x: this.serverToVirtualX(player.x || 0),
                y: this.serverToVirtualY(player.y || 0),
                width: this.serverToVirtualX(player.width || 50),
                height: this.serverToVirtualY(player.height || 50),
                name: player.name || 'Player',
                color: color,
                isAlive: player.state === 'alive',
                score: player.score || 0,
                playerIndex: player.playerIndex || 0
            }
            
            this.players.set(sessionId, networkPlayer)
            console.log(`   Created player ${networkPlayer.name} (index: ${player.playerIndex}) with color ${color}`)
            console.log(`   Server pos: (${player.x}, ${player.y}) -> Client pos: (${networkPlayer.x.toFixed(1)}, ${networkPlayer.y.toFixed(1)})`)
            
            // Set up property change listeners for this player
            player.onChange(() => {
                const localPlayer = this.players.get(sessionId)
                if (!localPlayer) return
                
                // Update all properties when any change occurs
                localPlayer.x = this.serverToVirtualX(player.x || 0)
                localPlayer.y = this.serverToVirtualY(player.y || 0)
                localPlayer.name = player.name || 'Player'
                localPlayer.isAlive = player.state === 'alive'
                localPlayer.score = player.score || 0
            })
            
            // Alternative: Listen to specific properties
            player.listen('x', (value: number) => {
                const localPlayer = this.players.get(sessionId)
                if (localPlayer) localPlayer.x = this.serverToVirtualX(value)
            })
            
            player.listen('y', (value: number) => {
                const localPlayer = this.players.get(sessionId)
                if (localPlayer) localPlayer.y = this.serverToVirtualY(value)
            })
        })
        
        // Handle players being removed
        state.players.onRemove((_player: PlayerSchema, sessionId: string) => {
            console.log('➖ Player removed via onRemove:', sessionId)
            this.players.delete(sessionId)
            
            // If this is our local player being removed, mark as not ready
            if (sessionId === this.localSessionId) {
                this.playerReady = false
                console.log('🚫 Local player no longer ready for input')
            }
        })
        
        // Handle any existing players (if reconnecting)
        state.players.forEach((player: PlayerSchema, sessionId: string) => {
            // Manually call the onAdd logic for existing players
            console.log('🔄 Processing existing player:', sessionId)
            
            // If this is our local player, mark as ready for input
            if (sessionId === this.localSessionId) {
                this.playerReady = true
                const gameState = this.room?.state?.gameState || 'unknown'
                console.log(`🎮 Local player ready for input! (existing) Game state: ${gameState}`)
                
                // Extra debug for mid-game reconnections
                if (gameState === 'playing') {
                    console.log(`⚠️ Reconnected during active game - player should be positioned safely`)
                }
            }
            
            const color = PLAYER_COLORS[player.playerIndex % PLAYER_COLORS.length]
            
            const networkPlayer: NetworkPlayer = {
                id: sessionId,
                sessionId: sessionId,
                x: this.serverToVirtualX(player.x || 0),
                y: this.serverToVirtualY(player.y || 0),
                width: this.serverToVirtualX(player.width || 50),
                height: this.serverToVirtualY(player.height || 50),
                name: player.name || 'Player',
                color: color,
                isAlive: player.state === 'alive',
                score: player.score || 0,
                playerIndex: player.playerIndex || 0
            }
            
            this.players.set(sessionId, networkPlayer)
            
            // Set up listeners for existing players too
            player.onChange(() => {
                const localPlayer = this.players.get(sessionId)
                if (!localPlayer) return
                
                localPlayer.x = this.serverToVirtualX(player.x || 0)
                localPlayer.y = this.serverToVirtualY(player.y || 0)
                localPlayer.name = player.name || 'Player'
                localPlayer.isAlive = player.state === 'alive'
                localPlayer.score = player.score || 0
            })
        })
    }

    gameLoop(timestamp: number = 0): void {
        this.lastFrameTime = timestamp

        const inputState = this.inputManager.getInputState()
        this.sendInput(inputState)
        this.obstacleManager.update(timestamp, this.score, this.scalingInfo)
        this.render()

        requestAnimationFrame(this.gameLoop.bind(this))
    }
    
    private sendInput(inputState: InputState): void {
        if (!this.room) return
        
        // Only send input if our player exists on the server and is ready
        // This prevents race conditions where input is sent before player is created
        if (!this.playerReady || !this.room.state?.players?.has(this.localSessionId)) {
            // Player not yet ready or created on server, don't send input
            return
        }
        
        // Send input for our own player
        if (inputState.up || inputState.down || inputState.left || inputState.right) {
            this.room.send('input', {
                up: inputState.up || false,
                down: inputState.down || false,
                left: inputState.left || false,
                right: inputState.right || false
            })
        }
    }
    
    private render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        // Render background
        this.background.render(this.ctx, performance.now())
        
        // Render game state overlay
        this.renderGameStateOverlay()
        
        // Render obstacles
        const obstacles = this.obstacleManager.getObstacles()
        obstacles.forEach(obstacle => {
            if (typeof (obstacle as any).render === 'function') {
                (obstacle as any).render(this.ctx)
            }
        })
        
        // Render particles
        this.particleSystem.draw()
        
        // Render arena bounds indicator
        this.renderArenaBounds()
        
        // Render all players (convert from virtual to canvas coordinates)
        this.players.forEach((player, sessionId) => {
            if (!player.isAlive) return
            
            this.ctx.save()
            
            // Convert virtual coordinates to canvas coordinates
            const canvasX = this.virtualToCanvasX(player.x)
            const canvasY = this.virtualToCanvasY(player.y)
            const canvasWidth = this.virtualToCanvasX(player.width)
            const canvasHeight = this.virtualToCanvasY(player.height)
            
            // Draw player rectangle
            this.ctx.fillStyle = player.color
            this.ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight)
            
            // Add border - thicker for local player
            const isLocalPlayer = sessionId === this.localSessionId
            this.ctx.strokeStyle = isLocalPlayer ? '#ffffff' : player.color
            this.ctx.lineWidth = isLocalPlayer ? 3 : 1
            this.ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight)
            
            // Draw player name
            this.ctx.fillStyle = '#ffffff'
            this.ctx.font = '12px Arial'
            this.ctx.textAlign = 'center'
            this.ctx.fillText(
                player.name + (isLocalPlayer ? ' (YOU)' : ''), 
                canvasX + canvasWidth/2, 
                canvasY - 5
            )
            
            this.ctx.restore()
        })
    }

    public getPlayerCount(): number {
        return this.room?.state?.players?.size || 0
    }

    public isConnected(): boolean {
        return this.room !== null && this.room.connection.isOpen
    }

    private renderArenaBounds(): void {
        // Draw a subtle border to show the virtual game arena bounds
        this.ctx.save()
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        this.ctx.lineWidth = 2
        this.ctx.setLineDash([5, 5])
        
        // Convert virtual arena bounds to canvas coordinates
        const canvasWidth = this.virtualToCanvasX(this.VIRTUAL_WIDTH)
        const canvasHeight = this.virtualToCanvasY(this.VIRTUAL_HEIGHT)
        this.ctx.strokeRect(0, 0, canvasWidth, canvasHeight)
        
        this.ctx.setLineDash([]) // Reset line dash
        this.ctx.restore()
        
        // Show virtual coordinate system info for debugging
        this.ctx.save()
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        this.ctx.fillRect(10, 10, 280, 80)
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = '12px Arial'
        
        const logicalWidth = this.canvas.width / (window.devicePixelRatio || 1)
        const logicalHeight = this.canvas.height / (window.devicePixelRatio || 1)
        const scaleX = logicalWidth / this.VIRTUAL_WIDTH
        const scaleY = logicalHeight / this.VIRTUAL_HEIGHT
        
        this.ctx.fillText(`Virtual: ${this.VIRTUAL_WIDTH}×${this.VIRTUAL_HEIGHT}`, 15, 25)
        this.ctx.fillText(`Logical: ${logicalWidth.toFixed(0)}×${logicalHeight.toFixed(0)}`, 15, 40)
        this.ctx.fillText(`Physical: ${this.canvas.width}×${this.canvas.height}`, 15, 55)
        this.ctx.fillText(`Scale: ${scaleX.toFixed(2)}×${scaleY.toFixed(2)}`, 15, 70)
        this.ctx.restore()
    }

    private renderGameStateOverlay(): void {
        if (!this.room?.state) return
        
        const gameState = this.room.state.gameState
        const playerCount = this.room.state.totalPlayers || 0
        
        this.ctx.save()
        
        switch (gameState) {
            case 'waiting':
                // Draw waiting message
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
                
                this.ctx.fillStyle = '#ffffff'
                this.ctx.font = 'bold 24px Arial'
                this.ctx.textAlign = 'center'
                this.ctx.textBaseline = 'middle'
                
                const minPlayers = 2 // This should come from server constants
                this.ctx.fillText(
                    `Waiting for players... (${playerCount}/${minPlayers})`,
                    this.canvas.width / 2,
                    this.canvas.height / 2 - 40
                )
                
                this.ctx.font = '18px Arial'
                this.ctx.fillText(
                    'You can move around while waiting!',
                    this.canvas.width / 2,
                    this.canvas.height / 2
                )
                
                if (playerCount === 1) {
                    this.ctx.fillText(
                        'Open another browser tab to test multiplayer',
                        this.canvas.width / 2,
                        this.canvas.height / 2 + 40
                    )
                }
                break
                
            case 'starting':
                // Draw countdown
                const countdown = this.room.state.countdownTime || 0
                if (countdown > 0) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
                    
                    this.ctx.fillStyle = '#ffff00'
                    this.ctx.font = 'bold 72px Arial'
                    this.ctx.textAlign = 'center'
                    this.ctx.textBaseline = 'middle'
                    this.ctx.fillText(
                        countdown.toString(),
                        this.canvas.width / 2,
                        this.canvas.height / 2
                    )
                    
                    this.ctx.font = 'bold 24px Arial'
                    this.ctx.fillText(
                        'Get Ready!',
                        this.canvas.width / 2,
                        this.canvas.height / 2 + 60
                    )
                }
                break
        }
        
        this.ctx.restore()
    }

    public onResize(): void {
        console.log('🔄 onResize triggered - comprehensive game recalculation...')
        
        // 1. Update scaling info from ResponsiveManager
        if (this.responsiveManager) {
            this.scalingInfo = this.responsiveManager.getScalingInfo()
        }
        
        // 2. Update CSS responsive classes and viewport properties
        this.updateResponsiveClasses()
        
        // 3. Calculate viewport scaling for debugging and game logic
        const logicalWidth = this.canvas.width / (window.devicePixelRatio || 1)
        const logicalHeight = this.canvas.height / (window.devicePixelRatio || 1)
        const scaleX = logicalWidth / this.VIRTUAL_WIDTH
        const scaleY = logicalHeight / this.VIRTUAL_HEIGHT
        
        console.log('🖼️ Canvas resized by ResponsiveManager:')
        console.log(`  Physical: ${this.canvas.width}×${this.canvas.height}`)
        console.log(`  Logical: ${logicalWidth}×${logicalHeight}`)
        console.log(`  Virtual: ${this.VIRTUAL_WIDTH}×${this.VIRTUAL_HEIGHT}`)
        console.log(`  Scale: ${scaleX.toFixed(2)}×${scaleY.toFixed(2)}`)
        console.log(`  ResponsiveManager scaling: ${this.scalingInfo.widthScale.toFixed(2)}×${this.scalingInfo.heightScale.toFixed(2)}`)
        console.log(`  Device type: ${this.responsiveManager?.isDesktopDevice() ? 'Desktop' : 'Mobile'}`)
        
        // 4. Update game elements that depend on canvas dimensions
        this.updateGameElementsOnResize()
        
        // 5. Update viewport for mobile browsers (helps with viewport height issues)
        this.updateMobileViewport()
        
        // 6. Trigger custom resize event for other components
        this.dispatchResizeEvent()
    }
    
    /**
     * Updates all game elements that need to be recalculated when canvas size changes
     */
    private updateGameElementsOnResize(): void {
        console.log('⚙️ Updating game elements for new canvas size...')
        
        // 1. Update obstacle dimensions
        this.recalculateObstacleDimensions()
        
        // 2. Update particle system bounds (if it exists and has resize capabilities)
        this.updateParticleSystemBounds()
        
        // 3. Update background scaling
        this.updateBackgroundScaling()
        
        // 4. Update touch controls layout
        this.updateTouchControlsLayout()
        
        // 5. Validate player positions (ensure they're within bounds)
        this.validatePlayerPositions()
        
        console.log('✅ Game elements updated for resize')
    }
    
    /**
     * Recalculates obstacle dimensions based on new canvas size
     */
    private recalculateObstacleDimensions(): void {
        if (!this.obstacleManager) return
        
        console.log('🚧 Recalculating obstacle dimensions...')
        
        // Get obstacles from obstacle manager
        const obstacles = this.obstacleManager.getObstacles()
        let updatedCount = 0
        
        obstacles.forEach(obstacle => {
            // Check if obstacle has calculateHeight method
            if (typeof (obstacle as any).calculateHeight === 'function') {
                (obstacle as any).calculateHeight()
                updatedCount++
            }
        })
        
        console.log(`  Updated ${updatedCount} obstacles`)
    }
    
    /**
     * Updates particle system boundaries if applicable
     */
    private updateParticleSystemBounds(): void {
        if (!this.particleSystem) return
        
        console.log('✨ Updating particle system bounds...')
        
        // Check if particle system has resize/bounds update methods
        if (typeof (this.particleSystem as any).updateBounds === 'function') {
            (this.particleSystem as any).updateBounds(this.canvas.width, this.canvas.height)
        }
        
        // If particle system has setMaxParticles method, adjust based on canvas size
        if (typeof (this.particleSystem as any).setMaxParticles === 'function') {
            const canvasArea = this.canvas.width * this.canvas.height
            const baseArea = 600 * 700 // Base canvas size
            const particleRatio = Math.max(0.3, Math.min(2.0, canvasArea / baseArea))
            const maxParticles = Math.floor(500 * particleRatio)
            
            ;(this.particleSystem as any).setMaxParticles(maxParticles)
            console.log(`  Adjusted max particles to ${maxParticles} (ratio: ${particleRatio.toFixed(2)})`)
        }
    }
    
    /**
     * Updates background scaling for new canvas size
     */
    private updateBackgroundScaling(): void {
        if (!this.background) return
        
        console.log('🌌 Updating background scaling...')
        
        // Check if background has resize method
        if (typeof (this.background as any).onResize === 'function') {
            (this.background as any).onResize(this.canvas.width, this.canvas.height)
        }
    }
    
    /**
     * Updates touch controls layout for new screen size
     */
    private updateTouchControlsLayout(): void {
        if (!this.touchControls) return
        
        console.log('📱 Updating touch controls layout...')
        
        // Check if touch controls have layout update method
        if (typeof (this.touchControls as any).updateLayout === 'function') {
            const isDesktop = this.responsiveManager?.isDesktopDevice() || false
            ;(this.touchControls as any).updateLayout(isDesktop)
        }
    }
    
    /**
     * Validates that all player positions are within the current canvas bounds
     * Note: In multiplayer, we mainly validate visual rendering bounds, not server positions
     */
    private validatePlayerPositions(): void {
        if (!this.players || this.players.size === 0) return
        
        console.log('👥 Validating player visual positions...')
        
        let outOfBoundsCount = 0
        
        this.players.forEach((player, sessionId) => {
            if (!player.isAlive) return
            
            // Convert virtual coordinates to canvas coordinates for validation
            const canvasX = this.virtualToCanvasX(player.x)
            const canvasY = this.virtualToCanvasY(player.y)
            const canvasPlayerWidth = this.virtualToCanvasX(player.width)
            const canvasPlayerHeight = this.virtualToCanvasY(player.height)
            
            // Check if player is outside visible canvas bounds
            const isOutOfBounds = (
                canvasX + canvasPlayerWidth < 0 || 
                canvasX > this.canvas.width ||
                canvasY + canvasPlayerHeight < 0 || 
                canvasY > this.canvas.height
            )
            
            if (isOutOfBounds) {
                outOfBoundsCount++
                console.log(`  Player ${sessionId} is outside visible bounds: canvas (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`)
                
                // For multiplayer, we don't adjust server positions, but we can flag for UI feedback
                if (sessionId === this.localSessionId) {
                    console.log(`  ⚠️ Local player is outside visible area - this may indicate a scaling issue`)
                }
            }
        })
        
        if (outOfBoundsCount > 0) {
            console.log(`  ${outOfBoundsCount} players outside visible bounds (normal in multiplayer with different arena sizes)`)
        }
        
        // Specific check for local player that might need UI attention
        const localPlayer = this.players.get(this.localSessionId)
        if (localPlayer && localPlayer.isAlive) {
            const localCanvasX = this.virtualToCanvasX(localPlayer.x)
            const localCanvasY = this.virtualToCanvasY(localPlayer.y)
            
            // If local player is way outside bounds, it might indicate a coordinate system mismatch
            if (localCanvasX < -100 || localCanvasX > this.canvas.width + 100 ||
                localCanvasY < -100 || localCanvasY > this.canvas.height + 100) {
                console.warn(`⚠️ Local player significantly outside canvas bounds - coordinate system may need adjustment`)
                console.warn(`  Virtual: (${localPlayer.x.toFixed(1)}, ${localPlayer.y.toFixed(1)}) -> Canvas: (${localCanvasX.toFixed(1)}, ${localCanvasY.toFixed(1)})`)
            }
        }
    }
    
    
    /**
     * Updates CSS classes and viewport properties to coordinate with responsive.css
     */
    private updateResponsiveClasses(): void {
        console.log('🎨 Updating responsive CSS classes...')
        
        const body = document.body
        const root = document.documentElement
        const isDesktop = this.responsiveManager?.isDesktopDevice() || false
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        const isLandscape = window.innerWidth > window.innerHeight
        const deviceWidth = window.innerWidth
        const deviceHeight = window.innerHeight
        
        // Remove all device type classes
        body.classList.remove('desktop-layout', 'tablet-layout', 'mobile-layout', 
                            'touch-device', 'landscape', 'portrait', 'chrome-mobile')
        
        // Add appropriate device type classes
        if (isDesktop) {
            body.classList.add('desktop-layout')
        } else if (deviceWidth >= 768 && deviceWidth < 1200) {
            body.classList.add('tablet-layout')
        } else {
            body.classList.add('mobile-layout')
        }
        
        // Add device capability classes
        if (isTouchDevice) body.classList.add('touch-device')
        body.classList.add(isLandscape ? 'landscape' : 'portrait')
        
        // Detect Chrome mobile for specific fixes
        const isChromeMobile = /Chrome/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent)
        if (isChromeMobile) {
            body.classList.add('chrome-mobile')
        }
        
        // Update CSS custom properties
        root.style.setProperty('--device-width', `${deviceWidth}px`)
        root.style.setProperty('--device-height', `${deviceHeight}px`)
        root.style.setProperty('--device-ratio', (window.devicePixelRatio || 1).toString())
        root.style.setProperty('--canvas-width', `${this.canvas.width}px`)
        root.style.setProperty('--canvas-height', `${this.canvas.height}px`)
        root.style.setProperty('--scale-x', this.scalingInfo.widthScale.toString())
        root.style.setProperty('--scale-y', this.scalingInfo.heightScale.toString())
        
        console.log(`  Device: ${isDesktop ? 'Desktop' : 'Mobile'} | Touch: ${isTouchDevice} | Orientation: ${isLandscape ? 'Landscape' : 'Portrait'}`)
    }
    
    /**
     * Updates mobile viewport handling for better mobile browser compatibility
     */
    private updateMobileViewport(): void {
        if (this.responsiveManager?.isDesktopDevice()) return
        
        console.log('📱 Updating mobile viewport properties...')
        
        // Calculate real viewport height (excluding mobile browser chrome)
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
        
        // Calculate control panel height for responsive.css
        const controlPanel = document.querySelector('.control-panel[data-section="controls"]') as HTMLElement
        if (controlPanel) {
            const controlHeight = controlPanel.offsetHeight
            document.documentElement.style.setProperty('--ctrl-h', `${controlHeight}px`)
            console.log(`  Control panel height: ${controlHeight}px`)
        }
        
        // Force reflow to apply mobile viewport fixes
        if (window.innerHeight !== this.lastViewportHeight) {
            this.lastViewportHeight = window.innerHeight
            console.log(`  Viewport height changed: ${window.innerHeight}px`)
            
            // Trigger responsive.css mobile optimizations
            setTimeout(() => {
                const event = new CustomEvent('viewportHeightChanged', {
                    detail: { height: window.innerHeight, vh }
                })
                document.dispatchEvent(event)
            }, 100)
        }
    }
    
    /**
     * Dispatches custom resize event for other game components
     */
    private dispatchResizeEvent(): void {
        console.log('📡 Dispatching custom resize event...')
        
        const resizeData = {
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height,
                logicalWidth: this.canvas.width / (window.devicePixelRatio || 1),
                logicalHeight: this.canvas.height / (window.devicePixelRatio || 1)
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                isDesktop: this.responsiveManager?.isDesktopDevice() || false,
                isLandscape: window.innerWidth > window.innerHeight
            },
            scaling: {
                widthScale: this.scalingInfo.widthScale,
                heightScale: this.scalingInfo.heightScale,
                pixelRatio: this.scalingInfo.pixelRatio || 1
            },
            virtual: {
                width: this.VIRTUAL_WIDTH,
                height: this.VIRTUAL_HEIGHT
            }
        }
        
        // Custom event for other components to listen to
        const gameResizeEvent = new CustomEvent('gameResize', { detail: resizeData })
        document.dispatchEvent(gameResizeEvent)
        
        // Also trigger on EventBus for internal game components
        if (this.eventBus) {
            this.eventBus.emit('resize', resizeData)
        }
    }

    public dispose(): void {
        if (this.room) {
            this.room.leave()
            this.room = null
        }
        if (this.client) {
            this.client = null
        }
        if (this.responsiveManager) {
            this.responsiveManager.dispose()
        }
    }
}
