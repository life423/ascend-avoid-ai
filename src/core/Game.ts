import { InputState, ScalingInfo, NetworkPlayer } from '../types'
import { PlayerSchema, GameState } from '../../shared/schema'
import Background from '../entities/Background'
import { EventBus } from './EventBus'
import GameConfig from './GameConfig'
import InputManager from '../managers/InputManager'
import ObstacleManager from '../managers/ObstacleManager'
import UIManager from '../managers/UIManager'
import AssetManager from '../managers/AssetManager'
import ParticleSystem from '../entities/ParticleSystem'
import TouchControls from '../ui/TouchControls'
import { Client, Room } from 'colyseus.js'
import { GAME_CONFIG } from '../constants/client-constants'
import { generateRandomName } from '../utils/utils'

const PLAYER_COLORS = ['#FF5722', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4']

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
    particleSystem: ParticleSystem
    touchControls: TouchControls
    gameState: string
    score: number = 0
    
    // Multiplayer
    private client: Client | null = null
    private room: Room | null = null
    private players: Map<string, NetworkPlayer> = new Map()
    private localSessionId: string = ''

    // Virtual coordinate system - fixed dimensions for consistent gameplay
    private readonly VIRTUAL_WIDTH: number = 1200
    private readonly VIRTUAL_HEIGHT: number = 800
    private serverArenaWidth: number = 1200  // Will be updated from server
    private serverArenaHeight: number = 800  // Will be updated from server

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

        this.connectToServer()
        this.gameLoop()
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
        state.players.onRemove((player: PlayerSchema, sessionId: string) => {
            console.log('➖ Player removed via onRemove:', sessionId)
            this.players.delete(sessionId)
        })
        
        // Handle any existing players (if reconnecting)
        state.players.forEach((player: PlayerSchema, sessionId: string) => {
            // Manually call the onAdd logic for existing players
            console.log('🔄 Processing existing player:', sessionId)
            
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
        const deltaTime = (timestamp - this.lastFrameTime) / 1000
        this.lastFrameTime = timestamp

        const inputState = this.inputManager.getInputState()
        this.sendInput(inputState)
        this.obstacleManager.update(timestamp, this.score, this.scalingInfo)
        this.render()

        requestAnimationFrame(this.gameLoop.bind(this))
    }
    
    private sendInput(inputState: InputState): void {
        if (!this.room) return
        
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
        // ResponsiveCanvas handles all the scaling automatically
        // We just log the new dimensions for debugging
        const logicalWidth = this.canvas.width / (window.devicePixelRatio || 1)
        const logicalHeight = this.canvas.height / (window.devicePixelRatio || 1)
        const scaleX = logicalWidth / this.VIRTUAL_WIDTH
        const scaleY = logicalHeight / this.VIRTUAL_HEIGHT
        
        console.log('🖼️ Canvas resized:')
        console.log(`  Physical: ${this.canvas.width}×${this.canvas.height}`)
        console.log(`  Logical: ${logicalWidth}×${logicalHeight}`)
        console.log(`  Virtual: ${this.VIRTUAL_WIDTH}×${this.VIRTUAL_HEIGHT}`)
        console.log(`  Scale: ${scaleX.toFixed(2)}×${scaleY.toFixed(2)}`)
    }

    public dispose(): void {
        if (this.room) {
            this.room.leave()
            this.room = null
        }
        if (this.client) {
            this.client = null
        }
    }
}
