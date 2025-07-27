import { InputState, ScalingInfo, NetworkPlayer } from '../types'
import { PlayerSchema, GameStateSchema } from '../types/colyseus-schema'
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

    private serverArenaWidth: number = 800
    private serverArenaHeight: number = 600
    private scaleX: number = 1
    private scaleY: number = 1

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
                playerName: generateRandomName(),
                width: this.canvas.width,
                height: this.canvas.height
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
                
                // Get server arena dimensions and calculate scale
                if (state.arenaWidth && state.arenaHeight) {
                    this.serverArenaWidth = state.arenaWidth
                    this.serverArenaHeight = state.arenaHeight
                    this.updateScale()
                    console.log('🎮 Server arena:', this.serverArenaWidth, 'x', this.serverArenaHeight)
                    console.log('📏 Scale factors:', this.scaleX.toFixed(2), 'x', this.scaleY.toFixed(2))
                }
                
                // Set up fine-grained callbacks for the players map
                this.setupPlayerCallbacks(state)
            })
        } catch (error) {
            console.error('Failed to connect to server:', error)
        }
    }

    private updateScale(): void {
        this.scaleX = this.canvas.width / this.serverArenaWidth
        this.scaleY = this.canvas.height / this.serverArenaHeight
    }

    private serverToClientX(serverX: number): number {
        return serverX * this.scaleX
    }

    private serverToClientY(serverY: number): number {
        return serverY * this.scaleY
    }

    private clientToServerX(clientX: number): number {
        return clientX / this.scaleX
    }

    private clientToServerY(clientY: number): number {
        return clientY / this.scaleY
    }

    private setupPlayerCallbacks(state: GameStateSchema): void {
        if (!state.players) return
        
        // Handle new players being added
        state.players.onAdd = (player: PlayerSchema, sessionId: string) => {
            console.log('➕ Player added via onAdd:', sessionId)
            
            // Create visual representation for the player - use server's playerIndex for consistent colors
            const color = PLAYER_COLORS[player.playerIndex % PLAYER_COLORS.length]
            
            const networkPlayer: NetworkPlayer = {
                id: sessionId,
                sessionId: sessionId,
                x: this.serverToClientX(player.x || 0),
                y: this.serverToClientY(player.y || 0),
                width: this.serverToClientX(player.width || 50),
                height: this.serverToClientY(player.height || 50),
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
            player.onChange = (changes: any[]) => {
                const localPlayer = this.players.get(sessionId)
                if (!localPlayer) return
                
                changes.forEach((change) => {
                    if (change.field === 'x') localPlayer.x = this.serverToClientX(change.value)
                    else if (change.field === 'y') localPlayer.y = this.serverToClientY(change.value)
                    else if (change.field === 'name') localPlayer.name = change.value
                    else if (change.field === 'state') localPlayer.isAlive = change.value === 'alive'
                    else if (change.field === 'score') localPlayer.score = change.value
                })
            }
            
            // Alternative: Listen to specific properties
            player.listen('x', (value: number) => {
                const localPlayer = this.players.get(sessionId)
                if (localPlayer) localPlayer.x = this.serverToClientX(value)
            })
            
            player.listen('y', (value: number) => {
                const localPlayer = this.players.get(sessionId)
                if (localPlayer) localPlayer.y = this.serverToClientY(value)
            })
        }
        
        // Handle players being removed
        state.players.onRemove = (player: PlayerSchema, sessionId: string) => {
            console.log('➖ Player removed via onRemove:', sessionId)
            this.players.delete(sessionId)
        }
        
        // Handle any existing players (if reconnecting)
        state.players.forEach((player: PlayerSchema, sessionId: string) => {
            state.players.onAdd(player, sessionId)
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
        
        // Render all players
        this.players.forEach((player, sessionId) => {
            if (!player.isAlive) return
            
            this.ctx.save()
            
            // Draw player rectangle
            this.ctx.fillStyle = player.color
            this.ctx.fillRect(player.x, player.y, player.width, player.height)
            
            // Add border - thicker for local player
            const isLocalPlayer = sessionId === this.localSessionId
            this.ctx.strokeStyle = isLocalPlayer ? '#ffffff' : player.color
            this.ctx.lineWidth = isLocalPlayer ? 3 : 1
            this.ctx.strokeRect(player.x, player.y, player.width, player.height)
            
            // Draw player name
            this.ctx.fillStyle = '#ffffff'
            this.ctx.font = '12px Arial'
            this.ctx.textAlign = 'center'
            this.ctx.fillText(
                player.name + (isLocalPlayer ? ' (YOU)' : ''), 
                player.x + player.width/2, 
                player.y - 5
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
        this.updateScale()
        console.log('🖼️ Canvas resized:', this.canvas.width, 'x', this.canvas.height)
        console.log('📏 New scale factors:', this.scaleX.toFixed(2), 'x', this.scaleY.toFixed(2))
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
