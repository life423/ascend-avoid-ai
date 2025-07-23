/**
 * SIMPLIFIED ResponsiveManager - Lets CSS handle layout, focuses on canvas drawing
 * Implements Strategy 4: Adjust Canvas Drawing Logic
 */
import { CANVAS } from '../constants/gameConstants'
import { ScalingInfo } from '../types'

interface Game {
    particleSystem?: { setMaxParticles: (max: number) => void } | null
    config?: { deviceTier?: string; targetFPS?: number }
    [key: string]: any
}

export default class ResponsiveManager {
    game: Game
    canvas: HTMLCanvasElement | null
    baseCanvasWidth: number
    baseCanvasHeight: number
    scalingInfo: ScalingInfo
    onResize?: (widthScale: number, heightScale: number, isDesktop: boolean) => void

    constructor(game: Game) {
        this.game = game
        this.canvas = null
        this.baseCanvasWidth = CANVAS.BASE_WIDTH
        this.baseCanvasHeight = CANVAS.BASE_HEIGHT
        this.scalingInfo = { widthScale: 1, heightScale: 1, pixelRatio: 1, reducedResolution: false }
    }

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas
        this.setupEventListeners()
        this.handleResize()
    }

    private setupEventListeners(): void {
        // Throttle resize to prevent performance issues
        let resizeTimeout: number
        const throttledResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = window.setTimeout(() => this.handleResize(), 100)
        }
        window.addEventListener('resize', throttledResize)
    }

    handleResize(): void {
        this.resizeCanvas()
        if (this.onResize) {
            this.onResize(this.scalingInfo.widthScale, this.scalingInfo.heightScale, window.innerWidth >= 1200)
        }
    }

    /**
     * STRATEGY 4: Canvas drawing logic - match CSS size with proper pixel ratio
     */
    resizeCanvas(): void {
        if (!this.canvas) return

        // Let CSS handle the layout - just read the displayed size
        const displayWidth = this.canvas.clientWidth
        const displayHeight = this.canvas.clientHeight
        
        if (displayWidth === 0 || displayHeight === 0) return

        // Set canvas drawing buffer to match display size * pixel ratio for crisp graphics
        const pixelRatio = window.devicePixelRatio || 1
        this.canvas.width = displayWidth * pixelRatio
        this.canvas.height = displayHeight * pixelRatio

        // Scale the drawing context so everything draws at the correct size
        const ctx = this.canvas.getContext('2d')
        if (ctx) {
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        }

        // Update scaling info for game logic
        this.scalingInfo = {
            widthScale: displayWidth / this.baseCanvasWidth,
            heightScale: displayHeight / this.baseCanvasHeight,
            pixelRatio,
            reducedResolution: false,
        }

        console.log(`Canvas: ${displayWidth}×${displayHeight} (scale: ${this.scalingInfo.widthScale.toFixed(2)})`)
    }

    getScalingInfo(): ScalingInfo {
        return this.scalingInfo
    }

    isDesktopDevice(): boolean {
        return window.innerWidth >= 1200
    }

    dispose(): void {
        // Cleanup would go here
    }
}