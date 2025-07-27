/**
 * ResponsiveManager Compatibility Layer
 * Uses UnifiedResponsiveSystem under the hood while maintaining the old API
 */
import { ResponsiveSystem } from '../systems/UnifiedResponsiveSystem'
import { ScalingInfo } from '../types'
import { CANVAS } from '../constants/gameConstants'

// Game interface (minimal for type safety)
interface Game {
    particleSystem?: {
        setMaxParticles: (max: number) => void
    } | null
    config?: {
        deviceTier?: string
        targetFPS?: number
    }
    [key: string]: any // Allow additional properties
}

export default class ResponsiveManager {
    game: Game
    canvas: HTMLCanvasElement | null
    baseCanvasWidth: number
    baseCanvasHeight: number
    isDesktop: boolean
    scalingInfo: ScalingInfo
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
        this.isDesktop = this.detectDesktop()
        
        // Initial scaling info
        this.scalingInfo = {
            widthScale: 1,
            heightScale: 1,
            pixelRatio: window.devicePixelRatio || 1,
            reducedResolution: false,
        }
    }

    /**
     * Detect if current viewport is desktop sized
     */
    detectDesktop(): boolean {
        const isWideScreen = window.innerWidth >= 800
        const hasLargeHeight = window.innerHeight >= 500
        const isDesktopSize = isWideScreen && hasLargeHeight
        
        console.log(
            `Desktop detection: width=${window.innerWidth}, height=${window.innerHeight}, isDesktop=${isDesktopSize}`
        )
        
        return isDesktopSize
    }

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas
        
        // Set up event listeners for resize
        this.setupEventListeners()
        
        // Subscribe to UnifiedResponsiveSystem changes
        this.unsubscribeFn = ResponsiveSystem.subscribe((_config, viewport) => {
            this.isDesktop = viewport.width >= 800 && viewport.height >= 500
            // Trigger handleResize when viewport changes
            this.handleResize()
        })
        
        // Initial resize
        this.handleResize()
    }

    /**
     * Set up event listeners for responsive behavior
     */
    setupEventListeners(): void {
        window.addEventListener('resize', this.handleResize.bind(this))
        window.addEventListener('orientationchange', this.handleResize.bind(this))
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }

    /**
     * Handle window resize event
     */
    handleResize(): void {
        // Re-check device type
        this.isDesktop = this.detectDesktop()

        // Resize canvas
        this.resizeCanvas()

        // Execute callback if provided
        if (this.onResize) {
            this.onResize(
                this.scalingInfo.widthScale,
                this.scalingInfo.heightScale,
                this.isDesktop
            )
        }
    }

    /**
     * Handle document visibility change
     */
    handleVisibilityChange(): void {
        if (document.visibilityState === 'visible') {
            this.handleResize()
        }
    }

    /**
     * Resize canvas to match viewport, maintaining aspect ratio
     */
    resizeCanvas(): void {
        if (!this.canvas) return

        // Get the canvas viewport container
        const viewport = this.canvas.closest(
            '.canvas-viewport[data-viewport="main"]'
        ) as HTMLElement
        if (!viewport) {
            console.warn('Canvas viewport container not found')
            return
        }

        // Calculate available space based on device type
        let availableWidth: number
        let availableHeight: number

        if (this.isDesktop) {
            // Desktop: Calculate based on the CSS Grid layout
            const gameMain = document.querySelector(
                '.game-main[data-section="main"]'
            ) as HTMLElement | null
            
            if (gameMain) {
                const gameMainRect = gameMain.getBoundingClientRect()
                const sidebarWidth = 280
                const gridGap = 24
                const padding = 32
                
                availableWidth = Math.max(gameMainRect.width - sidebarWidth - gridGap - padding, 600)
                availableHeight = Math.max(gameMainRect.height - padding, 500)
                
                console.log(
                    `Desktop canvas sizing: ${availableWidth}x${availableHeight} available`
                )
            } else {
                // Fallback for desktop
                const sidebarWidth = 280
                const gridGap = 24
                const padding = 64
                
                availableWidth = Math.max(window.innerWidth - sidebarWidth - gridGap - padding, 600)
                availableHeight = Math.max(window.innerHeight - 200, 500)
                
                console.log(
                    `Desktop canvas sizing (fallback): ${availableWidth}x${availableHeight}`
                )
            }
        } else {
            // Mobile: Calculate based on actual layout structure
            const header = document.querySelector('.app-header') as HTMLElement | null
            const controlPanel = document.querySelector(
                '.control-panel[data-section="controls"]'
            ) as HTMLElement | null

            const headerHeight = header ? header.offsetHeight : 80
            
            let controlsHeight: number
            if (controlPanel) {
                controlPanel.offsetHeight // Trigger reflow
                controlsHeight = controlPanel.offsetHeight
            } else {
                const ctrlH = getComputedStyle(document.documentElement).getPropertyValue('--ctrl-h')
                controlsHeight = parseFloat(ctrlH) || 120
            }
            const margin = 20

            const totalReservedHeight = headerHeight + controlsHeight + margin
            availableHeight = Math.max(window.innerHeight - totalReservedHeight, 250)
            availableWidth = Math.max(window.innerWidth - margin, 280)

            availableWidth = Math.min(availableWidth, CANVAS.MAX_MOBILE_WIDTH * 1.2)

            console.log(
                `Mobile canvas sizing: ${availableWidth}x${availableHeight} available`
            )
        }

        // Calculate scaling factors to fit within available space
        const widthScale = availableWidth / this.baseCanvasWidth
        const heightScale = availableHeight / this.baseCanvasHeight

        // Use the smaller scale to maintain aspect ratio
        const scale = Math.min(widthScale, heightScale)

        // Calculate final canvas dimensions
        const canvasWidth = Math.floor(this.baseCanvasWidth * scale)
        const canvasHeight = Math.floor(this.baseCanvasHeight * scale)

        // Ensure minimum playable size
        const minHeight = this.isDesktop ? 500 : 200
        const minWidth = Math.floor((minHeight / this.baseCanvasHeight) * this.baseCanvasWidth)

        const finalCanvasWidth = Math.max(canvasWidth, minWidth)
        const finalCanvasHeight = Math.max(canvasHeight, minHeight)

        // Apply CSS dimensions for visual scaling
        this.canvas.style.width = `${finalCanvasWidth}px`
        this.canvas.style.height = `${finalCanvasHeight}px`
        this.canvas.style.display = 'block'
        this.canvas.style.margin = '0 auto'

        // Set internal canvas dimensions to match visual size exactly
        this.canvas.width = finalCanvasWidth
        this.canvas.height = finalCanvasHeight

        // Reset context transform for 1:1 pixel mapping
        const ctx = this.canvas.getContext('2d')
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0)
        }

        // Update scaling info for game logic
        this.scalingInfo = {
            widthScale: finalCanvasWidth / this.baseCanvasWidth,
            heightScale: finalCanvasHeight / this.baseCanvasHeight,
            pixelRatio: 1,
            reducedResolution: false,
        }

        console.log(
            `Canvas resized: ${finalCanvasWidth}×${finalCanvasHeight} (scale: ${this.scalingInfo.widthScale.toFixed(2)})`
        )
    }

    getScalingInfo(): ScalingInfo {
        return this.scalingInfo
    }

    isDesktopDevice(): boolean {
        return this.isDesktop
    }

    dispose(): void {
        if (this.unsubscribeFn) {
            this.unsubscribeFn()
            this.unsubscribeFn = null
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this))
        window.removeEventListener('orientationchange', this.handleResize.bind(this))
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }
}