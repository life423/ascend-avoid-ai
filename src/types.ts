/**
 * Clean type definitions
 */

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

export interface GameObject {
    x: number
    y: number
    width: number
    height: number
    render?(ctx: CanvasRenderingContext2D, timestamp?: number): void
    update(deltaTime: number, ...args: any[]): void
}

export interface PerformanceStats {
    avgFrameTime: number
    maxFrameTime: number
    minFrameTime: number
    frameCount: number
    fps?: number
    frameTime?: number
    averageFrameTime?: number
    memoryUsage?: number
    renderTime?: number
    updateTime?: number
}

// Legacy types for compatibility
export interface Entity {
    id: string
    x: number
    y: number
    width: number
    height: number
    active: boolean
}

export interface GameConfig {
    [key: string]: any
}

export interface NetworkPlayer {
    id: string
    name: string
    x: number
    y: number
    color: string
    alive: boolean
    index?: number
    sessionId?: string
    isAlive?: boolean
    score?: number
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
}

export interface System {
    active: boolean
    update(deltaTime: number): void
    render?(ctx: CanvasRenderingContext2D, timestamp?: number): void
}

export interface DeviceInfo {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    isTouchDevice: boolean
    isLandscape: boolean
    devicePixelRatio: number
    screenWidth: number
    screenHeight: number
}

export interface ResponsiveConfig {
    baseWidth?: number
    baseHeight?: number
    minScale?: number
    maxScale?: number
    maintainAspectRatio: boolean
    minWidth: number
    minHeight: number
    maxWidth: number
    maxHeight: number
    devicePixelRatio: boolean
}

// Global window interface extension
declare global {
    interface Window {
        game?: {
            onResize?: (widthScale: number, heightScale: number, isDesktop: boolean) => void
            [key: string]: any
        }
    }
}
