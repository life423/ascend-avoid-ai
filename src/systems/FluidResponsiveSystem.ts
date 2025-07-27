/**
 * FluidResponsiveSystem - Single Source of Truth for All Responsiveness
 * 
 * Consolidates all responsive logic from scattered files into one unified system:
 * - No breakpoints, pure fluid/continuous scaling
 * - Aspect ratio maintained with pixel-perfect rendering  
 * - Neural network ready with metrics and data-driven config
 * - Supports all devices from smartwatches to 8K displays
 * - Cross-browser compatible with mobile viewport fixes
 * - Everything scales with the canvas
 */

export interface FluidViewport {
    width: number
    height: number
    aspectRatio: number
    devicePixelRatio: number
    isTouch: boolean
    orientation: 'portrait' | 'landscape'
    screenType: 'phone' | 'tablet' | 'desktop' | 'tv'
    diagonalInches: number // For neural net features
}

export interface FluidCanvasConfig {
    designWidth: number
    designHeight: number
    maintainAspectRatio: boolean
    pixelPerfect: boolean
    minScale: number
    maxScale: number
    scalingCurve: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export interface FluidScaling {
    scale: number
    canvasWidth: number
    canvasHeight: number
    offsetX: number
    offsetY: number
    viewport: FluidViewport
    // Neural net features
    responsiveScore: number // How well current scaling works (0-1)
    adaptationLevel: number // How much system adapted from 1:1 (0-1)
    performanceMetrics: {
        renderTime: number
        frameRate: number
        memoryUsage: number
    }
}

export type FluidCallback = (scaling: FluidScaling) => void

export class FluidResponsiveSystem {
    private static instance: FluidResponsiveSystem | null = null
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private config: FluidCanvasConfig
    private callbacks: Set<FluidCallback> = new Set()
    private rafId: number | null = null
    private resizeObserver: ResizeObserver | null = null
    private lastScaling: FluidScaling | null = null
    private performanceTracker = {
        lastFrameTime: 0,
        frameCount: 0,
        averageFrameTime: 16.67 // 60fps baseline
    }

    private constructor(canvas: HTMLCanvasElement, config: Partial<FluidCanvasConfig> = {}) {
        this.canvas = canvas
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D context required')
        this.ctx = ctx

        this.config = {
            designWidth: 600,
            designHeight: 700,
            maintainAspectRatio: true,
            pixelPerfect: true,
            minScale: 0.15, // Support tiny smartwatches
            maxScale: 5.0,  // Support 8K displays
            scalingCurve: 'easeOut',
            ...config
        }

        this.initializeCanvas()
        this.setupMobileViewportFixes()
        this.setupResponsiveListeners()
        this.update()
    }

    public static create(canvas: HTMLCanvasElement, config?: Partial<FluidCanvasConfig>): FluidResponsiveSystem {
        if (FluidResponsiveSystem.instance) {
            FluidResponsiveSystem.instance.dispose()
        }
        FluidResponsiveSystem.instance = new FluidResponsiveSystem(canvas, config)
        return FluidResponsiveSystem.instance
    }

    public static getInstance(): FluidResponsiveSystem | null {
        return FluidResponsiveSystem.instance
    }

    private initializeCanvas(): void {
        // Optimal canvas setup for responsiveness
        this.canvas.style.display = 'block'
        this.canvas.style.margin = '0 auto'
        this.canvas.style.maxWidth = '100%'
        this.canvas.style.maxHeight = '100%'
        this.canvas.style.imageRendering = 'pixelated'
        this.canvas.style.touchAction = 'none'
        this.canvas.style.userSelect = 'none'
        this.canvas.style.transition = 'width 0.15s ease, height 0.15s ease'
        
        // Prevent context menu and text selection
        this.canvas.addEventListener('contextmenu', e => e.preventDefault())
        this.canvas.addEventListener('selectstart', e => e.preventDefault())
    }

    private setupMobileViewportFixes(): void {
        // Consolidated mobile viewport height fixes from mobileViewportFix.ts
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
        }

        setViewportHeight()
        window.addEventListener('resize', setViewportHeight)
        window.addEventListener('orientationchange', setViewportHeight)

        // Modern Visual Viewport API for better mobile handling
        if ('visualViewport' in window && window.visualViewport) {
            window.visualViewport.addEventListener('resize', setViewportHeight)
            window.visualViewport.addEventListener('scroll', setViewportHeight)
        }

        // Page visibility fix
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setViewportHeight()
                this.update()
            }
        })

        // Browser-specific fixes
        this.applyBrowserSpecificFixes()
    }

    private applyBrowserSpecificFixes(): void {
        const ua = navigator.userAgent.toLowerCase()
        
        // Chrome mobile fixes
        if (/android.*chrome|crios/i.test(ua) && !/edge/i.test(ua)) {
            document.documentElement.classList.add('chrome-mobile')
            window.addEventListener('load', () => {
                setTimeout(() => {
                    window.scrollTo(0, 1)
                    window.scrollTo(0, 0)
                }, 100)
            })
        }
        
        // Firefox mobile fixes  
        if (/android.*firefox|mobile.*firefox/i.test(ua)) {
            document.documentElement.classList.add('firefox-mobile')
        }
    }

    private setupResponsiveListeners(): void {
        // Primary: ResizeObserver for optimal performance
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.scheduleUpdate())
            const container = this.canvas.parentElement || document.body
            this.resizeObserver.observe(container)
            this.resizeObserver.observe(document.documentElement)
        }

        // Fallback listeners for older browsers
        const throttledUpdate = this.throttle(() => this.update(), 16)
        window.addEventListener('resize', throttledUpdate)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.update(), 150) // Allow orientation to complete
        })

        // Device pixel ratio changes (zoom, external displays)
        this.setupPixelRatioListener()
    }

    private setupPixelRatioListener(): void {
        if (!window.matchMedia) return

        const handleDPRChange = () => {
            this.update()
            // Re-setup for new DPR
            setTimeout(() => this.setupPixelRatioListener(), 100)
        }

        try {
            const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
            if (dprQuery.addEventListener) {
                dprQuery.addEventListener('change', handleDPRChange, { once: true })
            } else if (dprQuery.addListener) {
                dprQuery.addListener(handleDPRChange)
            }
        } catch (e) {
            // Fallback: periodic DPR check
            setTimeout(() => this.setupPixelRatioListener(), 5000)
        }
    }

    private scheduleUpdate(): void {
        if (this.rafId) return
        this.rafId = requestAnimationFrame(() => {
            this.rafId = null
            this.update()
        })
    }

    private update(): void {
        const frameStart = performance.now()
        
        const viewport = this.detectViewport()
        const scaling = this.calculateFluidScaling(viewport)
        
        // Only apply if meaningfully different
        if (!this.lastScaling || this.isSignificantChange(this.lastScaling, scaling)) {
            this.applyScaling(scaling)
            this.updateCSSProperties(scaling)
            this.notifyCallbacks(scaling)
            this.lastScaling = scaling
        }

        // Track performance for neural net
        this.trackPerformance(frameStart)
    }

    private detectViewport(): FluidViewport {
        // Get container dimensions
        const container = this.canvas.parentElement
        const rect = container?.getBoundingClientRect() || {
            width: window.innerWidth,
            height: window.innerHeight
        }

        const width = rect.width || window.innerWidth
        const height = rect.height || window.innerHeight
        const devicePixelRatio = window.devicePixelRatio || 1

        // Smart screen type detection (consolidated from UnifiedResponsiveSystem)
        let screenType: FluidViewport['screenType'] = 'desktop'
        
        // Touch capability detection
        const isTouch = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0 ||
                       (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)

        // Screen diagonal estimation for neural net
        const screenDiagonal = Math.sqrt(width * width + height * height)
        const diagonalInches = screenDiagonal / (devicePixelRatio * 96) // Rough estimate

        // Classify screen type
        if (width >= 1920 && devicePixelRatio <= 1.5) {
            screenType = 'tv'
        } else if ((width >= 768 && width <= 1366 && isTouch) || 
                   /iPad|Android.*Tablet/i.test(navigator.userAgent)) {
            screenType = 'tablet'
        } else if ((width <= 768 && isTouch) || 
                   /iPhone|Android.*Mobile/i.test(navigator.userAgent)) {
            screenType = 'phone'
        }

        return {
            width,
            height,
            aspectRatio: width / height,
            devicePixelRatio,
            isTouch,
            orientation: width > height ? 'landscape' : 'portrait',
            screenType,
            diagonalInches
        }
    }

    private calculateFluidScaling(viewport: FluidViewport): FluidScaling {
        const { designWidth, designHeight, maintainAspectRatio, minScale, maxScale, scalingCurve } = this.config

        // Smart padding based on device characteristics
        const padding = this.calculateAdaptivePadding(viewport)
        const availableWidth = Math.max(viewport.width - padding.horizontal, 100)
        const availableHeight = Math.max(viewport.height - padding.vertical, 75)

        // Calculate scale factors
        const scaleX = availableWidth / designWidth
        const scaleY = availableHeight / designHeight

        // Apply scaling strategy
        let scale = maintainAspectRatio ? Math.min(scaleX, scaleY) : Math.sqrt(scaleX * scaleY)

        // Apply scaling curve for better UX
        scale = this.applyScalingCurve(scale, scalingCurve)

        // Constrain to bounds
        scale = Math.max(minScale, Math.min(maxScale, scale))

        // Calculate final dimensions
        let canvasWidth = designWidth * scale
        let canvasHeight = designHeight * scale

        // Pixel perfect adjustment
        if (this.config.pixelPerfect) {
            canvasWidth = Math.round(canvasWidth)
            canvasHeight = Math.round(canvasHeight)
            scale = Math.min(canvasWidth / designWidth, canvasHeight / designHeight)
        }

        // Calculate centering
        const offsetX = Math.max(0, (viewport.width - canvasWidth) / 2)
        const offsetY = Math.max(0, (viewport.height - canvasHeight) / 2)

        // Neural net metrics
        const responsiveScore = this.calculateResponsiveScore(scale, viewport)
        const adaptationLevel = Math.abs(1 - scale)

        return {
            scale,
            canvasWidth,
            canvasHeight,
            offsetX,
            offsetY,
            viewport,
            responsiveScore,
            adaptationLevel,
            performanceMetrics: {
                renderTime: this.performanceTracker.averageFrameTime,
                frameRate: 1000 / this.performanceTracker.averageFrameTime,
                memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
            }
        }
    }

    private calculateAdaptivePadding(viewport: FluidViewport): { horizontal: number; vertical: number } {
        // Fluid padding based on screen characteristics
        const base = Math.min(viewport.width, viewport.height) * 0.015 // 1.5% of smaller dimension
        const touchMultiplier = viewport.isTouch ? 1.8 : 1.0
        const sizeMultiplier = Math.max(0.3, Math.min(2.5, viewport.diagonalInches / 5))
        
        const padding = base * touchMultiplier * sizeMultiplier
        
        return {
            horizontal: Math.max(6, Math.min(80, padding * 2)),
            vertical: Math.max(4, Math.min(50, padding))
        }
    }

    private applyScalingCurve(scale: number, curve: string): number {
        const { minScale, maxScale } = this.config
        const normalized = Math.max(0, Math.min(1, (scale - minScale) / (maxScale - minScale)))
        
        let curved: number
        switch (curve) {
            case 'easeIn':
                curved = normalized * normalized
                break
            case 'easeOut':
                curved = 1 - (1 - normalized) * (1 - normalized)
                break
            case 'easeInOut':
                curved = normalized < 0.5 
                    ? 2 * normalized * normalized 
                    : 1 - 2 * (1 - normalized) * (1 - normalized)
                break
            default:
                curved = normalized
        }
        
        return minScale + curved * (maxScale - minScale)
    }

    private calculateResponsiveScore(scale: number, viewport: FluidViewport): number {
        // Neural net feature: responsive quality score (0-1)
        const idealScale = 1.0
        const scaleScore = 1 - Math.abs(scale - idealScale) / Math.max(idealScale, scale)
        const aspectScore = Math.min(viewport.aspectRatio, 1 / viewport.aspectRatio)
        const sizeScore = Math.min(1, viewport.diagonalInches / 5) // 5" ideal
        
        return (scaleScore * 0.5 + aspectScore * 0.3 + sizeScore * 0.2)
    }

    private applyScaling(scaling: FluidScaling): void {
        const { canvasWidth, canvasHeight, viewport } = scaling
        const { devicePixelRatio } = viewport

        // Set visual CSS size
        this.canvas.style.width = `${canvasWidth}px`
        this.canvas.style.height = `${canvasHeight}px`

        // Set backing store resolution for crisp rendering
        const pixelWidth = canvasWidth * devicePixelRatio
        const pixelHeight = canvasHeight * devicePixelRatio

        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.canvas.width = pixelWidth
            this.canvas.height = pixelHeight

            // Scale context for device pixel ratio
            this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
            this.ctx.imageSmoothingEnabled = false
        }
    }

    private updateCSSProperties(scaling: FluidScaling): void {
        const { scale, canvasWidth, canvasHeight, viewport, responsiveScore, adaptationLevel } = scaling
        const root = document.documentElement

        // Core responsive properties for CSS
        root.style.setProperty('--fluid-scale', scale.toString())
        root.style.setProperty('--canvas-width', `${canvasWidth}px`)
        root.style.setProperty('--canvas-height', `${canvasHeight}px`)
        root.style.setProperty('--viewport-width', `${viewport.width}px`)
        root.style.setProperty('--viewport-height', `${viewport.height}px`)
        root.style.setProperty('--device-pixel-ratio', viewport.devicePixelRatio.toString())
        root.style.setProperty('--aspect-ratio', viewport.aspectRatio.toString())

        // Neural net ready properties
        root.style.setProperty('--responsive-score', responsiveScore.toString())
        root.style.setProperty('--adaptation-level', adaptationLevel.toString())
        root.style.setProperty('--diagonal-inches', viewport.diagonalInches.toString())

        // Device classification classes
        root.classList.remove('touch-device', 'mouse-device', 'portrait', 'landscape', 
                             'screen-phone', 'screen-tablet', 'screen-desktop', 'screen-tv')
        root.classList.add(
            viewport.isTouch ? 'touch-device' : 'mouse-device',
            viewport.orientation,
            `screen-${viewport.screenType}`
        )
    }

    private trackPerformance(frameStart: number): void {
        const frameTime = performance.now() - frameStart
        this.performanceTracker.frameCount++
        
        // Running average of frame times
        const alpha = 0.1 // Smoothing factor
        this.performanceTracker.averageFrameTime = 
            this.performanceTracker.averageFrameTime * (1 - alpha) + frameTime * alpha
    }

    private isSignificantChange(old: FluidScaling, new_: FluidScaling): boolean {
        const scaleThreshold = 0.01
        const sizeThreshold = 2

        return Math.abs(old.scale - new_.scale) > scaleThreshold ||
               Math.abs(old.canvasWidth - new_.canvasWidth) > sizeThreshold ||
               Math.abs(old.canvasHeight - new_.canvasHeight) > sizeThreshold ||
               old.viewport.orientation !== new_.viewport.orientation
    }

    private notifyCallbacks(scaling: FluidScaling): void {
        this.callbacks.forEach(callback => {
            try {
                callback(scaling)
            } catch (error) {
                console.error('FluidResponsiveSystem callback error:', error)
            }
        })
    }

    private throttle(func: Function, limit: number): () => void {
        let inThrottle: boolean
        return function(this: any) {
            if (!inThrottle) {
                func.apply(this, arguments)
                inThrottle = true
                setTimeout(() => inThrottle = false, limit)
            }
        }
    }

    // Public API
    public subscribe(callback: FluidCallback): () => void {
        this.callbacks.add(callback)
        
        // Immediate callback with current state
        if (this.lastScaling) {
            callback(this.lastScaling)
        }
        
        return () => this.callbacks.delete(callback)
    }

    public getScaling(): FluidScaling | null {
        return this.lastScaling
    }

    public updateConfig(newConfig: Partial<FluidCanvasConfig>): void {
        this.config = { ...this.config, ...newConfig }
        this.update()
    }

    public forceUpdate(): void {
        this.lastScaling = null
        this.update()
    }

    public dispose(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }
        
        this.callbacks.clear()
        FluidResponsiveSystem.instance = null
    }

    // Legacy compatibility for existing ResponsiveManager
    public getCompatibilityInfo(): {
        widthScale: number
        heightScale: number
        pixelRatio: number
        reducedResolution: boolean
        isDesktop: boolean
    } {
        const scaling = this.lastScaling
        if (!scaling) {
            return {
                widthScale: 1,
                heightScale: 1,
                pixelRatio: 1,
                reducedResolution: false,
                isDesktop: false
            }
        }

        return {
            widthScale: scaling.scale,
            heightScale: scaling.scale,
            pixelRatio: scaling.viewport.devicePixelRatio,
            reducedResolution: scaling.scale < 0.7,
            isDesktop: scaling.viewport.screenType === 'desktop'
        }
    }
}

// Factory function for easy setup
export function createFluidCanvas(
    canvasId: string | HTMLCanvasElement,
    config?: Partial<FluidCanvasConfig>
): FluidResponsiveSystem {
    const canvas = typeof canvasId === 'string' 
        ? document.getElementById(canvasId) as HTMLCanvasElement
        : canvasId

    if (!canvas) {
        throw new Error(`Canvas not found: ${canvasId}`)
    }

    return FluidResponsiveSystem.create(canvas, config)
}