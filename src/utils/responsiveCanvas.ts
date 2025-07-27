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

        // Default configuration - FIXED: use number for devicePixelRatio
        this.config = {
            baseWidth: 320,
            baseHeight: 240,
            minWidth: 320,
            minHeight: 240,
            maxWidth: 2560,
            maxHeight: 1440,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio || 1, // FIXED: number instead of boolean
            ...config,
        }

        this.setupCanvas()
        this.setupEventListeners()
        this.initialResize()
    }

    private setupCanvas(): void {
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.display = 'block'
        this.canvas.style.position = 'absolute'
        this.canvas.style.top = '0'
        this.canvas.style.left = '0'
        this.canvas.style.imageRendering = 'pixelated'

        this.canvas.addEventListener('contextmenu', e => e.preventDefault())
        this.canvas.style.touchAction = 'none'
        this.canvas.style.userSelect = 'none'
    }

    private setupEventListeners(): void {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(_entries => {
                this.throttledResize()
            })
            this.resizeObserver.observe(
                this.canvas.parentElement || document.body
            )
        }

        window.addEventListener('resize', this.throttledResize.bind(this))
        window.addEventListener('orientationchange', () => {
            setTimeout(this.throttledResize.bind(this), 100)
        })
    }

    private throttledResize(): void {
        if (this.throttleTimeout) {
            clearTimeout(this.throttleTimeout)
        }

        this.throttleTimeout = window.setTimeout(() => {
            this.handleResize()
        }, 16)
    }

    private handleResize(): void {
        const deviceInfo = this.getDeviceInfo()
        const container = this.canvas.parentElement || document.body

        let width = container.clientWidth
        let height = container.clientHeight

        // Apply min/max constraints
        width = Math.max(
            this.config.minWidth || 320,
            Math.min(this.config.maxWidth || 2560, width)
        )
        height = Math.max(
            this.config.minHeight || 240,
            Math.min(this.config.maxHeight || 1440, height)
        )

        // Handle aspect ratio maintenance if enabled
        if (this.config.maintainAspectRatio) {
            const aspectRatio = (this.config.minWidth || 320) / (this.config.minHeight || 240)
            const currentAspect = width / height

            if (currentAspect > aspectRatio) {
                width = height * aspectRatio
            } else {
                height = width / aspectRatio
            }
        }

        // Get device pixel ratio for sharp rendering
        const devicePixelRatio = this.config.devicePixelRatio || deviceInfo.devicePixelRatio

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

    private updateCanvasDimensions(
        width: number,
        height: number,
        devicePixelRatio: number
    ): void {
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px`

        this.canvas.width = width * devicePixelRatio
        this.canvas.height = height * devicePixelRatio

        this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
        this.ctx.imageSmoothingEnabled = false
    }

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

    public getScalingInfo(): ScalingInfo {
        const baseWidth = this.config.baseWidth || 320
        const baseHeight = this.config.baseHeight || 240
        const currentWidth = this.canvas.width / (window.devicePixelRatio || 1)
        const currentHeight = this.canvas.height / (window.devicePixelRatio || 1)
        const deviceInfo = this.getDeviceInfo()

        const scaleX = currentWidth / baseWidth
        const scaleY = currentHeight / baseHeight
        const pixelRatio = window.devicePixelRatio || 1

        return {
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
            widthScale: scaleX,
            heightScale: scaleY,
            pixelRatio: pixelRatio,
        }
    }

    public onResize(callback: ResizeCallback): void {
        this.resizeCallbacks.push(callback)
    }

    public offResize(callback: ResizeCallback): void {
        const index = this.resizeCallbacks.indexOf(callback)
        if (index > -1) {
            this.resizeCallbacks.splice(index, 1)
        }
    }

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
    }

    public forceResize(): void {
        this.handleResize()
    }

    private initialResize(): void {
        setTimeout(() => {
            this.handleResize()
        }, 0)
    }

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

    public getCanvas(): HTMLCanvasElement {
        return this.canvas
    }

    public getContext(): CanvasRenderingContext2D {
        return this.ctx
    }

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

export function makeCanvasResponsive(
    canvas: HTMLCanvasElement
): ResponsiveCanvas {
    return new ResponsiveCanvas(canvas)
}

export function setupResponsiveCanvas(canvasId: string): ResponsiveCanvas {
    return ResponsiveCanvas.setup(canvasId)
}