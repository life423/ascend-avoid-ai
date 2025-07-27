import { InputState, ScalingInfo, NetworkPlayer } from '../types'
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
            this.room = await this.client.joinOrCreate(GAME_CONFIG.ROOM_NAME)
            
            this.localSessionId = this.room.sessionId
            console.log('🔗 Connected to server, sessionId:', this.localSessionId)
            
            this.room.onStateChange((state) => {
                console.log('📡 State update - players:', state.players?.size || 0)
                
                // Simple: just get the first player from server state
                if (state.players && state.players.size > 0) {
                    const firstPlayer = Array.from(state.players.values())[0]
                    console.log('📦 Shared rectangle at:', firstPlayer.x, firstPlayer.y)
                    
                    this.players.clear()
                    this.players.set('shared', {
                        id: 'shared',
                        sessionId: 'shared',
                        x: firstPlayer.x,
                        y: firstPlayer.y,
                        width: 50,
                        height: 50,
                        name: 'Shared Box',
                        color: '#FF5722',
                        isAlive: true,
                        score: 0,
                        playerIndex: 0
                    })
                }
            })
        } catch (error) {
            console.error('Failed to connect to server:', error)
        }
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
        
        // Only the first client (lowest sessionId) can control the shared rectangle
        const canControl = this.room.state?.players?.size === 1 || 
                          Array.from(this.room.state?.players?.keys() || [])[0] === this.localSessionId
        
        if (canControl && (inputState.up || inputState.down || inputState.left || inputState.right)) {
            console.log('🎮 Controlling shared rectangle')
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
        
        // Render obstacles
        const obstacles = this.obstacleManager.getObstacles()
        obstacles.forEach(obstacle => {
            if (typeof (obstacle as any).render === 'function') {
                (obstacle as any).render(this.ctx)
            }
        })
        
        // Render particles
        this.particleSystem.draw()
        
        // Render shared rectangle that all tabs can see
        this.players.forEach((player) => {
            this.ctx.save()
            
            // Draw shared rectangle
            this.ctx.fillStyle = player.color
            this.ctx.fillRect(player.x, player.y, player.width, player.height)
            
            // Check if this client can control it
            const canControl = this.room?.state?.players?.size === 1 || 
                              Array.from(this.room?.state?.players?.keys() || [])[0] === this.localSessionId
            
            // Add border - yellow if you control it, white if you don't
            this.ctx.strokeStyle = canControl ? '#ffff00' : '#ffffff'
            this.ctx.lineWidth = canControl ? 4 : 2
            this.ctx.strokeRect(player.x, player.y, player.width, player.height)
            
            // Show control status
            this.ctx.fillStyle = '#ffffff'
            this.ctx.font = '14px Arial'
            this.ctx.textAlign = 'center'
            const controlText = canControl ? 'YOU CONTROL' : 'SHARED VIEW'
            this.ctx.fillText(controlText, player.x + player.width/2, player.y - 10)
            
            this.ctx.restore()
        })
    }

    public getPlayerCount(): number {
        return this.room?.state?.players?.size || 0
    }

    public isConnected(): boolean {
        return this.room !== null && this.room.connection.isOpen
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
