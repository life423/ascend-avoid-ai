/**
 * ResponsiveManager - Legacy Compatibility Layer
 * Thin wrapper around FluidResponsiveSystem to maintain existing game API
 */
import { FluidResponsiveSystem, createFluidCanvas } from '../systems/FluidResponsiveSystem'
import { ScalingInfo } from '../types'
import { CANVAS } from '../constants/gameConstants'

interface Game {
    particleSystem?: {
        setMaxParticles: (max: number) => void
    } | null
    config?: {
        deviceTier?: string
        targetFPS?: number
    }
    [key: string]: any
}

export default class ResponsiveManager {
    game: Game
    canvas: HTMLCanvasElement | null
    baseCanvasWidth: number
    baseCanvasHeight: number
    scalingInfo: ScalingInfo
    private fluidSystem: FluidResponsiveSystem | null = null
    private unsubscribeFn: (() => void) | null = null
    
    onResize?: (
        widthScale: number,
        heightScale: number,
        isDesktop: boolean
    ) => void

    constructor(game: Game) {
        this.game = game
        this.canvas = null
        this.baseCanvasWidth = CANVAS.BASE_WIDTH
        this.baseCanvasHeight = CANVAS.BASE_HEIGHT
        
        // Initial scaling info
        this.scalingInfo = {
            widthScale: 1,
            heightScale: 1,
            pixelRatio: window.devicePixelRatio || 1,
            reducedResolution: false,
        }
    }

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas
        
        // Create FluidResponsiveSystem
        this.fluidSystem = createFluidCanvas(canvas, {
            designWidth: this.baseCanvasWidth,
            designHeight: this.baseCanvasHeight,
            maintainAspectRatio: true,
            pixelPerfect: true
        })
        
        // Subscribe to changes
        this.unsubscribeFn = this.fluidSystem.subscribe((scaling) => {
            // Update legacy scaling info
            this.scalingInfo = {
                widthScale: scaling.scale,
                heightScale: scaling.scale,
                pixelRatio: scaling.viewport.devicePixelRatio,
                reducedResolution: scaling.scale < 0.7
            }
            
            // Trigger legacy callback
            if (this.onResize) {
                this.onResize(
                    scaling.scale,
                    scaling.scale,
                    scaling.viewport.screenType === 'desktop'
                )
            }
        })
    }

    // Legacy compatibility methods
    handleResize(): void {
        this.fluidSystem?.forceUpdate()
    }

    setupEventListeners(): void {
        // FluidResponsiveSystem handles all event listeners
    }

    handleVisibilityChange(): void {
        // FluidResponsiveSystem handles visibility changes
    }

    resizeCanvas(): void {
        // FluidResponsiveSystem handles canvas resizing
    }

    detectDesktop(): boolean {
        const scaling = this.fluidSystem?.getScaling()
        return scaling?.viewport.screenType === 'desktop' || false
    }

    getScalingInfo(): ScalingInfo {
        return this.scalingInfo
    }

    isDesktopDevice(): boolean {
        const scaling = this.fluidSystem?.getScaling()
        return scaling?.viewport.screenType === 'desktop' || false
    }

    dispose(): void {
        if (this.unsubscribeFn) {
            this.unsubscribeFn()
            this.unsubscribeFn = null
        }
        
        this.fluidSystem?.dispose()
        this.fluidSystem = null
    }
}