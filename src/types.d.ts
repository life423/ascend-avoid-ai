/**
 * Complete TypeScript type definitions for Ascend Avoid game.
 * Contains all interfaces and types used throughout the application.
 */

// ===========================
// CORE TYPES
// ===========================

export interface Point2D {
    x: number
    y: number
}

export interface Dimensions {
    width: number
    height: number
}

export interface Bounds {
    x: number
    y: number
    width: number
    height: number
}

export interface Entity {
    x: number
    y: number
    width: number
    height: number
    update(deltaTime: number): void
    render(ctx: CanvasRenderingContext2D, scalingInfo?: ScalingInfo): void
    destroy?(): void
}

export interface GameObject {
    x: number
    y: number
    width: number
    height: number
    update(deltaTime: number, ...args: any[]): void
    render(ctx: CanvasRenderingContext2D, scalingInfoOrTimestamp?: ScalingInfo | number): void
}

export interface InputState {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    restart?: boolean
    shoot?: boolean
    [key: string]: boolean | undefined
}

export interface ScalingInfo {
    widthScale: number
    heightScale: number
    pixelRatio: number
    reducedResolution?: boolean
    scaleX?: number
    scaleY?: number
    offsetX?: number
    offsetY?: number
    canvasWidth?: number
    canvasHeight?: number
    baseWidth?: number
    baseHeight?: number
    devicePixelRatio?: number
    isDesktop?: boolean
    isMobile?: boolean
    isTablet?: boolean
}

export interface PerformanceStats {
    avgFrameTime: number
    maxFrameTime: number
    minFrameTime: number
    frameCount: number
    fps: number
    frameTime?: number
    averageFrameTime?: number
    memoryUsage?: number
    renderTime: number
    updateTime: number
}

export interface DeviceInfo {
    isTouchDevice: boolean
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    isLandscape: boolean
    devicePixelRatio: number
    screenWidth: number
    screenHeight: number
}

export interface ResponsiveConfig {
    baseWidth: number
    baseHeight: number
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    aspectRatio?: number
    maintainAspectRatio?: boolean
    scaleMode?: 'fit' | 'fill' | 'stretch'
    devicePixelRatio?: number
}

// ===========================
// MULTIPLAYER TYPES
// ===========================

export interface NetworkPlayer {
    id: string
    sessionId: string
    x: number
    y: number
    width: number
    height: number
    color: string
    name: string
    isAlive: boolean
    score: number
    playerIndex: number
    velocity?: Point2D
    lastUpdate?: number
    interpolationData?: {
        startX: number
        startY: number
        targetX: number
        targetY: number
        startTime: number
        duration: number
    }
    index?: number
}

export interface GameState {
    gameState: string
    players: Record<string, NetworkPlayer>
    obstacles: any[]
    arenaWidth: number
    arenaHeight: number
    areaPercentage: number
    elapsedTime: number
    countdownTime?: number
    aliveCount: number
    totalPlayers: number
    winnerName?: string
}

// ===========================
// GAME CONFIGURATION
// ===========================

export interface GameConfig {
    STATE: {
        READY: string
        WAITING: string
        STARTING: string
        PLAYING: string
        PAUSED: string
        GAME_OVER: string
    }
    
    // Methods
    getWinningLine(canvasHeight?: number, baseCanvasHeight?: number): number
    getBaseSpeed(): number
    getMinStep(): number
    getPlayerSizeRatio(): number
    getObstacleMinWidthRatio(): number
    getObstacleMaxWidthRatio(): number
    getMaxCars(): number
    getMinObstacles(): number
    getDifficultyIncreaseRate(): number
    getDeviceTier(): string | undefined
    getTargetFPS(): number | undefined
    isDebugEnabled(): boolean
    showCollisions(): boolean
    getKeys(): Record<string, readonly string[]>
    setDesktopMode(isDesktop: boolean): void
    
    // Optional properties
    deviceTier?: string
    targetFPS?: number
}

// ===========================
// UI AND INTERACTION
// ===========================

export interface TouchControlsConfig {
    enabled: boolean
    opacity: number
    size: 'small' | 'medium' | 'large'
    layout: 'fixed' | 'floating' | 'adaptive'
    
    positions: {
        movement: {
            anchor: 'bottom-left' | 'bottom-right' | 'custom'
            offset?: Point2D
        }
        actions: {
            anchor: 'bottom-right' | 'bottom-left' | 'custom'
            offset?: Point2D
        }
    }
    
    hapticFeedback: boolean
}

export interface NotificationConfig {
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    duration?: number
    position?: 'top' | 'bottom' | 'center'
    actions?: Array<{
        label: string
        callback: () => void
    }>
}

// ===========================
// PARTICLE SYSTEM
// ===========================

export interface ParticleConfig {
    position: Point2D
    emissionRate: number
    maxParticles: number
    
    particleLife: {
        min: number
        max: number
    }
    
    size: {
        start: number
        end: number
        variance: number
    }
    
    speed: {
        min: number
        max: number
        direction?: number
        spread?: number
    }
    
    color: {
        start: string
        end?: string
        variance?: number
    }
    
    gravity?: number
    friction?: number
    bounce?: number
    blendMode?: GlobalCompositeOperation
    texture?: string
}

export interface ParticleStats {
    activeParticles: number
    totalAllocated: number
    poolSize: number
    createdThisFrame: number
}

// ===========================
// COLLISION SYSTEM
// ===========================

export interface CollisionResult {
    occurred: boolean
    entities: [Entity, Entity]
    point?: Point2D
    normal?: Point2D
    depth?: number
    shouldBounce?: boolean
    shouldDestroy?: boolean
    damage?: number
}

export interface SpatialCell {
    bounds: Bounds
    entities: Set<string>
}

// ===========================
// AUDIO SYSTEM
// ===========================

export interface SoundConfig {
    volume: number
    loop: boolean
    pitch?: number
    position?: Point2D
    falloffDistance?: number
    reverb?: number
    distortion?: number
    delay?: number
    fadeIn?: number
    fadeOut?: number
}

export interface AudioState {
    masterVolume: number
    sfxVolume: number
    musicVolume: number
    muted: boolean
    
    activeSounds: Map<string, {
        source: AudioBufferSourceNode
        startTime: number
        config: SoundConfig
    }>
}

// ===========================
// ASSET MANAGEMENT
// ===========================

export interface AssetDefinition {
    key: string
    src: string
    type: 'image' | 'audio' | 'font' | 'json' | 'binary'
    preload?: boolean
    priority?: 'low' | 'normal' | 'high'
    processAfterLoad?: (data: any) => any
    size?: number
    dependencies?: string[]
}

export interface LoadProgress {
    loaded: number
    total: number
    percentage: number
    
    currentAsset?: {
        key: string
        type: string
        progress: number
    }
    
    bytesLoaded?: number
    bytesTotal?: number
    timeElapsed?: number
}

// ===========================
// EVENT SYSTEM
// ===========================

export type EventCallback<T = any> = (data: T) => void

export const GameEvents = {
    // Game lifecycle
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_END: 'game:end',
    
    // Player events
    PLAYER_JOIN: 'player:join',
    PLAYER_LEAVE: 'player:leave',
    PLAYER_MOVE: 'player:move',
    PLAYER_DEATH: 'player:death',
    PLAYER_RESPAWN: 'player:respawn',
    PLAYER_SCORE: 'player:score',
    
    // Multiplayer events
    MULTIPLAYER_CONNECTED: 'multiplayer:connected',
    MULTIPLAYER_DISCONNECTED: 'multiplayer:disconnected',
    MULTIPLAYER_STATE_UPDATE: 'multiplayer:state_update',
    NETWORK_CONNECT: 'network:connect',
    NETWORK_DISCONNECT: 'network:disconnect',
    NETWORK_RECONNECT: 'network:reconnect',
    NETWORK_ERROR: 'network:error',
    
    // Game state events
    STATE_UPDATE: 'state:update',
    ARENA_SHRINK: 'arena:shrink',
    MATCH_START: 'match:start',
    MATCH_END: 'match:end',
    
    // UI events
    UI_RESIZE: 'ui:resize',
    UI_NOTIFICATION: 'ui:notification',
    UI_MENU_TOGGLE: 'ui:menu_toggle',
    
    // Input events
    INPUT_START: 'input:start',
    INPUT_END: 'input:end',
    INPUT_MOVE: 'input:move',
} as const

export type GameEventType = typeof GameEvents[keyof typeof GameEvents]

export interface GameEventPayloads {
    [GameEvents.GAME_INIT]: { timestamp: number }
    [GameEvents.GAME_START]: { matchId: string }
    [GameEvents.GAME_PAUSE]: { reason?: string }
    [GameEvents.GAME_RESUME]: { pauseDuration: number }
    [GameEvents.GAME_END]: { winner?: NetworkPlayer; duration: number }
    
    [GameEvents.PLAYER_JOIN]: { player: NetworkPlayer }
    [GameEvents.PLAYER_LEAVE]: { playerId: string; reason?: string }
    [GameEvents.PLAYER_MOVE]: { playerId: string; position: Point2D; velocity?: Point2D }
    [GameEvents.PLAYER_DEATH]: { playerId: string; killerId?: string }
    [GameEvents.PLAYER_RESPAWN]: { playerId: string; position: Point2D }
    [GameEvents.PLAYER_SCORE]: { playerId: string; score: number; total: number }
    
    [GameEvents.MULTIPLAYER_CONNECTED]: { sessionId: string }
    [GameEvents.MULTIPLAYER_DISCONNECTED]: { reason: string }
    [GameEvents.MULTIPLAYER_STATE_UPDATE]: { state: GameState }
    [GameEvents.NETWORK_CONNECT]: { sessionId: string; ping: number }
    [GameEvents.NETWORK_DISCONNECT]: { reason: string; wasClean: boolean }
    [GameEvents.NETWORK_RECONNECT]: { attempts: number; success: boolean }
    [GameEvents.NETWORK_ERROR]: { error: Error; recoverable: boolean }
    
    [GameEvents.STATE_UPDATE]: { state: Partial<GameState>; timestamp: number }
    [GameEvents.ARENA_SHRINK]: { percentage: number; duration: number }
    [GameEvents.MATCH_START]: { playerCount: number; countdown: number }
    [GameEvents.MATCH_END]: { results: Array<{player: NetworkPlayer; rank: number}> }
    
    [GameEvents.UI_RESIZE]: { dimensions: Dimensions; deviceInfo: DeviceInfo }
    [GameEvents.UI_NOTIFICATION]: NotificationConfig
    [GameEvents.UI_MENU_TOGGLE]: { open: boolean; menu: string }
    
    [GameEvents.INPUT_START]: { type: 'keyboard' | 'touch' | 'gamepad'; data: any }
    [GameEvents.INPUT_END]: { type: 'keyboard' | 'touch' | 'gamepad'; data: any }
    [GameEvents.INPUT_MOVE]: { type: 'mouse' | 'touch'; position: Point2D }
}

// ===========================
// GLOBAL AUGMENTATIONS
// ===========================

declare global {
    interface Window {
        game?: {
            pause(): void
            resume(): void
            getStats(): PerformanceStats
            getState(): {
                gameState: string
                isConnected: boolean
                playerCount: number
            }
            reconnect(): Promise<boolean>
        }
        
        __ASCEND_AVOID_DEBUG__?: {
            showCollisions: boolean
            showNetworkStats: boolean
            simulateLatency: number
            forceDisconnect(): void
        }
    }
}

// ===========================
// MODULE AUGMENTATIONS
// ===========================

declare module './core/EventBus' {
    interface EventBus {
        on<K extends GameEventType>(
            event: K,
            callback: EventCallback<GameEventPayloads[K]>
        ): () => void
        
        emit<K extends GameEventType>(
            event: K,
            data: GameEventPayloads[K]
        ): void
        
        once<K extends GameEventType>(
            event: K,
            callback: EventCallback<GameEventPayloads[K]>
        ): () => void
    }
}

// Export empty object to make this a module
export {}