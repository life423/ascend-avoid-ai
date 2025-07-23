/**
 * Complete TypeScript type definitions for Ascend Avoid game.
 * Contains all interfaces and types used throughout the application.
 */

// ===== CORE GAME TYPES =====

export interface Entity {
    x: number
    y: number
    width: number
    height: number
    update(deltaTime: number): void
    render(ctx: CanvasRenderingContext2D, scalingInfo?: ScalingInfo | number): void
    destroy?(): void
}

export interface System {
    init?(): void
    update?(deltaTime: number): void
    destroy?(): void
}

export interface GameObject {
    x: number
    y: number
    width: number
    height: number
    update(deltaTime: number, ...args: any[]): void
    render(ctx: CanvasRenderingContext2D, scalingInfo?: ScalingInfo | number): void
}

export interface InputState {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    restart?: boolean  // Made optional since many places don't provide it
    shoot?: boolean
    [key: string]: boolean | undefined
}

export interface ScalingInfo {
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
    // Legacy support for existing code
    widthScale: number
    heightScale: number
    pixelRatio: number
    reducedResolution?: boolean
}

export interface PerformanceStats {
    fps?: number
    frameTime?: number
    averageFrameTime?: number
    memoryUsage?: number
    renderTime?: number
    updateTime?: number
    // Legacy support for existing code
    avgFrameTime: number
    maxFrameTime: number
    minFrameTime: number
    frameCount: number
}

// ===== SERVICE LOCATOR AND EVENT BUS =====

export type EventCallback<T = any> = (data: T) => void

// Augment the imported ServiceLocator class to add missing methods
declare module '../core/ServiceLocator' {
    export interface ServiceLocator {
        register<T>(name: string, instance: T, singleton?: boolean): void
        get<T>(name: string): T
        has(name: string): boolean
        unregister(name: string): void
        remove(name: string): void // Alias for unregister
        clear(): void
    }
}

// Augment the imported EventBus class to add missing methods  
declare module '../core/EventBus' {
    export interface EventBus {
        listeners: Map<string, Set<EventCallback>>
        onceListeners: Map<string, Set<EventCallback>>
        debugMode: boolean
        on<T>(event: string, callback: EventCallback<T>): () => void
        off(event: string, callback: EventCallback): void
        once<T>(event: string, callback: EventCallback<T>): () => void
        emit<T>(event: string, data?: T): void
        clear(event: string): void
        dispose(): void
        getEvents(): string[]
        getListenerCount(event: string): number
        setDebugMode(enabled: boolean): void
    }
}

// ===== GAME CONFIGURATION =====

export interface GameConfig {
    STATE?: {
        READY: string
        WAITING: string
        STARTING: string
        PLAYING: string
        PAUSED: string
        GAME_OVER: string
    }
    WINNING_LINE?: number
    DEBUG_MODE?: boolean
    DESKTOP_MODE?: boolean
    OBSTACLE_MIN_WIDTH_RATIO?: number
    OBSTACLE_MAX_WIDTH_RATIO?: number
    MAX_CARS?: number
    KEYS?: {
        UP: string[]
        DOWN: string[]
        LEFT: string[]
        RIGHT: string[]
        RESTART: string[]
        SHOOT?: string[]
    }
}

// ===== MULTIPLAYER TYPES =====

export interface NetworkPlayer {
    id: string
    sessionId: string
    x: number
    y: number
    color: string
    name: string
    isAlive: boolean
    score: number
    velocity?: {
        x: number
        y: number
    }
    lastUpdate?: number
    interpolationData?: {
        startX: number
        startY: number
        targetX: number
        targetY: number
        startTime: number
        duration: number
    }
    // Legacy support for existing code
    index?: number
    playerIndex?: number
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

export interface ArenaStats {
    width: number
    height: number
    areaPercentage: number
    elapsedTime: number
    countdownTime?: number
    shrinkStart?: number
    shrinkEnd?: number
}

// ===== UI AND RESPONSIVE TYPES =====

export interface TouchControlsConfig {
    enabled: boolean
    opacity: number
    size: number
    position: {
        dpad: { bottom: number; left: number }
        buttons: { bottom: number; right: number }
    }
}

export interface ResponsiveConfig {
    maintainAspectRatio: boolean
    minWidth: number
    minHeight: number
    maxWidth: number
    maxHeight: number
    devicePixelRatio: boolean
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

// ===== ASSET MANAGEMENT =====

export interface AssetDefinition {
    key: string
    src: string
    type?: 'image' | 'audio' | 'font'
}

export interface LoadProgress {
    loaded: number
    total: number
    percentage: number
    currentAsset?: string
}

// ===== PARTICLE SYSTEM =====

export interface ParticleConfig {
    x: number
    y: number
    velocityX: number
    velocityY: number
    life: number
    maxLife: number
    size: number
    color: string
    gravity?: number
    fade?: boolean
}

export interface ParticleStats {
    activeParticles: number
    totalAllocated: number
    poolSize: number
    createdThisFrame: number
}

// ===== COLLISION DETECTION =====

export interface CollisionBox {
    x: number
    y: number
    width: number
    height: number
}

export interface CollisionResult {
    collided: boolean
    side?: 'top' | 'bottom' | 'left' | 'right'
    overlap?: {
        x: number
        y: number
    }
}

// ===== AUDIO SYSTEM =====

export interface SoundConfig {
    volume: number
    loop: boolean
    pitch?: number
    fadeIn?: number
    fadeOut?: number
}

// ===== GAME ENGINE =====

export interface GameEngineInterface {
    canvas: HTMLCanvasElement
    getCanvas(): HTMLCanvasElement
    addSystem(system: System): void
    removeSystem(system: System): void
    init(): Promise<void>
    start(): void
    stop(): void
    pause(): void
    resume(): void
    destroy(): void
}

// Allow GameEngine constructor to accept different parameter types
export declare class GameEngine {
    constructor(canvasOrEventBus: HTMLCanvasElement | any)
    canvas: HTMLCanvasElement
    getCanvas(): HTMLCanvasElement
    addSystem(system: System): void
    removeSystem(system: System): void
    init(): Promise<void>
    start(): void
    stop(): void
    pause(): void
    resume(): void
    destroy(): void
}

// ===== GLOBAL WINDOW EXTENSIONS =====

declare global {
    interface Window {
        game?: {
            onResize?: (
                widthScale: number,
                heightScale: number,
                isDesktop: boolean
            ) => void
            pause?: () => void
            resume?: () => void
            restart?: () => void
            toggleMultiplayer?: () => void
            getStats?: () => PerformanceStats
        }
        devicePixelRatio: number
    }
}

// ===== UTILITY TYPES =====

export type GameModeType = 'single' | 'multiplayer'

export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'expert'

export interface EventEmitter {
    on(event: string, callback: EventCallback): void
    off(event: string, callback: EventCallback): void
    emit(event: string, data?: any): void
}

// ===== CONSTANTS AS TYPES =====

export const GAME_EVENTS = {
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    PLAYER_DEATH: 'player:death',
    SCORE_UPDATE: 'score:update',
    MULTIPLAYER_CONNECT: 'multiplayer:connect',
    MULTIPLAYER_DISCONNECT: 'multiplayer:disconnect',
    WINDOW_RESIZE: 'window:resize',
    INPUT_KEY_DOWN: 'input:key_down',
    INPUT_KEY_UP: 'input:key_up',
    INPUT_TOUCH_START: 'input:touch_start',
    INPUT_TOUCH_END: 'input:touch_end',
    PLAYER_COLLISION: 'player:collision',
} as const

export type GameEvent = (typeof GAME_EVENTS)[keyof typeof GAME_EVENTS]

// ===== GAME EVENTS CONSTANT FOR IMPORT =====

export declare const GameEvents: typeof GAME_EVENTS
