/**
 * Enhanced responsive canvas system with full device support.
 * Handles all screen sizes, device pixel ratios, and performance optimization.
 */

import { DeviceInfo, ResponsiveConfig, ScalingInfo } from '../types'

export interface ResizeCallback {
    (widthScale: number, heightScale: number, deviceInfo: DeviceInfo): void
}

export class ResponsiveCanvas {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private config: ResponsiveConfig
    private resizeCallbacks: ResizeCallback[] = []
    private lastWidth = 0
    private lastHeight = 0
    private lastDevicePixelRatio = 1
    private resizeObserver?: ResizeObserver
    private throttleTimeout?: number

    constructor(
        canvas: HTMLCanvasElement,
        config: Partial<ResponsiveConfig> = {}
    ) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!

        if (!this.ctx) {
            throw new Error('Failed to get 2D context from canvas')
        }

        // Default configuration
        this.config = {
            maintainAspectRatio: false,
            minWidth: 320,
            minHeight: 240,
            maxWidth: 2560,
            maxHeight: 1440,
            devicePixelRatio: true,
            ...config,
        }

        this.setupCanvas()
        this.setupEventListeners()
        this.initialResize()
    }

    /**
     * Sets up the canvas with proper styling and attributes
     */
    private setupCanvas(): void {
        // Ensure canvas fills its container
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.display = 'block'
        this.canvas.style.position = 'absolute'
        this.canvas.style.top = '0'
        this.canvas.style.left = '0'
        this.canvas.style.imageRendering = 'pixelated' // For crisp pixel art

        // Disable context menu on right-click
        this.canvas.addEventListener('contextmenu', e => e.preventDefault())

        // Improve touch handling
        this.canvas.style.touchAction = 'none'
        this.canvas.style.userSelect = 'none'
    }

    /**
     * Sets up all event listeners for responsive behavior
     */
    private setupEventListeners(): void {
        // Use ResizeObserver for better performance if available
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(_entries => {
                this.throttledResize()
            })
            this.resizeObserver.observe(
                this.canvas.parentElement || document.body
            )
        }

        // Fallback to window resize events
        window.addEventListener('resize', this.throttledResize.bind(this))
        window.addEventListener('orientationchange', () => {
            // Orientation change needs a delay to get correct dimensions
            setTimeout(this.throttledResize.bind(this), 100)
        })

        // Handle device pixel ratio changes (zoom, display changes)
        if ('devicePixelRatio' in window) {
            const media = window.matchMedia(
                `(resolution: ${window.devicePixelRatio}dppx)`
            )
            media.addEventListener('change', this.throttledResize.bind(this))
        }
    }

    /**
     * Throttled resize handler to prevent excessive calls
     */
    private throttledResize(): void {
        if (this.throttleTimeout) {
            clearTimeout(this.throttleTimeout)
        }

        this.throttleTimeout = window.setTimeout(() => {
            this.handleResize()
        }, 16) // ~60fps throttling
    }

    /**
     * Main resize handler that updates canvas dimensions and scaling
     */
    private handleResize(): void {
        const deviceInfo = this.getDeviceInfo()
        const container = this.canvas.parentElement || document.body

        let width = container.clientWidth
        let height = container.clientHeight

        // Apply min/max constraints
        width = Math.max(
            this.config.minWidth,
            Math.min(this.config.maxWidth, width)
        )
        height = Math.max(
            this.config.minHeight,
            Math.min(this.config.maxHeight, height)
        )

        // Handle aspect ratio maintenance if enabled
        if (this.config.maintainAspectRatio) {
            const aspectRatio = this.config.minWidth / this.config.minHeight
            const currentAspect = width / height

            if (currentAspect > aspectRatio) {
                width = height * aspectRatio
            } else {
                height = width / aspectRatio
            }
        }

        // Get device pixel ratio for sharp rendering
        const devicePixelRatio = this.config.devicePixelRatio
            ? deviceInfo.devicePixelRatio
            : 1

        // Only update if dimensions actually changed
        if (
            width !== this.lastWidth ||
            height !== this.lastHeight ||
            devicePixelRatio !== this.lastDevicePixelRatio
        ) {
            this.updateCanvasDimensions(width, height, devicePixelRatio)
            this.notifyCallbacks(deviceInfo)

            this.lastWidth = width
            this.lastHeight = height
            this.lastDevicePixelRatio = devicePixelRatio
        }
    }

    /**
     * Updates the actual canvas dimensions and scaling
     */
    private updateCanvasDimensions(
        width: number,
        height: number,
        devicePixelRatio: number
    ): void {
        // Set CSS size
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px`

        // Set actual canvas buffer size
        this.canvas.width = width * devicePixelRatio
        this.canvas.height = height * devicePixelRatio

        // Scale the context to handle device pixel ratio
        this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

        // Ensure crisp rendering
        this.ctx.imageSmoothingEnabled = false
    }

    /**
     * Gets comprehensive device information
     */
    public getDeviceInfo(): DeviceInfo {
        const width = window.innerWidth
        const height = window.innerHeight

        return {
            isTouchDevice:
                'ontouchstart' in window || navigator.maxTouchPoints > 0,
            isMobile: width < 768,
            isTablet: width >= 768 && width < 1200,
            isDesktop: width >= 1200,
            isLandscape: width > height,
            devicePixelRatio: window.devicePixelRatio || 1,
            screenWidth: width,
            screenHeight: height,
        }
    }

    /**
     * Gets current scaling information for game objects
     */
    public getScalingInfo(): ScalingInfo {
        const baseWidth = this.config.minWidth
        const baseHeight = this.config.minHeight
        const currentWidth = this.canvas.width / (window.devicePixelRatio || 1)
        const currentHeight =
            this.canvas.height / (window.devicePixelRatio || 1)
        const deviceInfo = this.getDeviceInfo()

        const scaleX = currentWidth / baseWidth
        const scaleY = currentHeight / baseHeight
        const pixelRatio = window.devicePixelRatio || 1

        return {
            // New format properties
            scaleX,
            scaleY,
            offsetX: 0,
            offsetY: 0,
            canvasWidth: currentWidth,
            canvasHeight: currentHeight,
            baseWidth,
            baseHeight,
            devicePixelRatio: pixelRatio,
            isDesktop: deviceInfo.isDesktop,
            isMobile: deviceInfo.isMobile,
            isTablet: deviceInfo.isTablet,
            // Legacy format properties (required by interface)
            widthScale: scaleX,
            heightScale: scaleY,
            pixelRatio: pixelRatio,
        }
    }

    /**
     * Adds a callback to be called when the canvas is resized
     */
    public onResize(callback: ResizeCallback): void {
        this.resizeCallbacks.push(callback)
    }

    /**
     * Removes a resize callback
     */
    public offResize(callback: ResizeCallback): void {
        const index = this.resizeCallbacks.indexOf(callback)
        if (index > -1) {
            this.resizeCallbacks.splice(index, 1)
        }
    }

    /**
     * Notifies all callbacks of resize events
     */
    private notifyCallbacks(deviceInfo: DeviceInfo): void {
        const scalingInfo = this.getScalingInfo()

        this.resizeCallbacks.forEach(callback => {
            try {
                callback(
                    scalingInfo.scaleX || scalingInfo.widthScale,
                    scalingInfo.scaleY || scalingInfo.heightScale,
                    deviceInfo
                )
            } catch (error) {
                console.error('Error in resize callback:', error)
            }
        })

        // Also notify global game object if it exists
        if (window.game?.onResize) {
            window.game.onResize(
                scalingInfo.scaleX || scalingInfo.widthScale,
                scalingInfo.scaleY || scalingInfo.heightScale,
                deviceInfo.isDesktop
            )
        }
    }

    /**
     * Forces an immediate resize check and update
     */
    public forceResize(): void {
        this.handleResize()
    }

    /**
     * Performs initial resize to set up canvas
     */
    private initialResize(): void {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.handleResize()
        }, 0)
    }

    /**
     * Cleans up event listeners and observers
     */
    public destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
        }

        if (this.throttleTimeout) {
            clearTimeout(this.throttleTimeout)
        }

        window.removeEventListener('resize', this.throttledResize.bind(this))
        this.resizeCallbacks.length = 0
    }

    /**
     * Gets the canvas element
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas
    }

    /**
     * Gets the 2D context
     */
    public getContext(): CanvasRenderingContext2D {
        return this.ctx
    }

    /**
     * Static factory method for easy setup
     */
    public static setup(
        canvasId: string,
        config?: Partial<ResponsiveConfig>
    ): ResponsiveCanvas {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement
        if (!canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`)
        }
        return new ResponsiveCanvas(canvas, config)
    }
}

// Legacy functions for backward compatibility
export function makeCanvasResponsive(
    canvas: HTMLCanvasElement
): ResponsiveCanvas {
    return new ResponsiveCanvas(canvas)
}

export function setupResponsiveCanvas(canvasId: string): ResponsiveCanvas {
    return ResponsiveCanvas.setup(canvasId)
}
