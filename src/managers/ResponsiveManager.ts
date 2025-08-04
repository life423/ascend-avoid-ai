/**
 * Manages responsive design and performance adaptations for the game
 * Handles canvas scaling, UI adjustments, and performance optimizations
 * based on device/screen size and capabilities
 */
import { CANVAS, DEVICE_SETTINGS } from '../constants/gameConstants'
import { ScalingInfo } from '../types'

// Define types for ResponsiveManager
interface DeviceCapabilities {
    highPerformance: boolean
    canUseWebGL: boolean
    maxParticles: number
    targetFPS: number
    deviceTier: 'high' | 'medium' | 'low'
    memoryLimit: 'high' | 'medium' | 'low'
    deviceProfile: DeviceProfile | null
}

interface DeviceProfile {
    userAgent: string
    hardwareConcurrency: number
    deviceMemory: number
    screenSize: {
        width: number
        height: number
        pixelRatio: number
    }
    perfScore: number
    webGL: boolean
}

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
    deviceSettings: any
    scalingInfo: ScalingInfo
    capabilities: DeviceCapabilities
    onResize?: (
        widthScale: number,
        heightScale: number,
        isDesktop: boolean
    ) => void

    /**
     * Creates a new ResponsiveManager instance
     * @param game - Reference to the game instance
     */
    constructor(game: Game) {
        this.game = game
        this.canvas = null
        this.baseCanvasWidth = CANVAS.BASE_WIDTH
        this.baseCanvasHeight = CANVAS.BASE_HEIGHT

        // Current device settings
        this.isDesktop = this.detectDesktop()
        this.deviceSettings = this.isDesktop
            ? DEVICE_SETTINGS.DESKTOP
            : DEVICE_SETTINGS.MOBILE

        // Scaling information
        this.scalingInfo = {
            widthScale: 1,
            heightScale: 1,
            pixelRatio: window.devicePixelRatio || 1,
            reducedResolution: false,
        }

        // Performance capabilities
        this.capabilities = {
            highPerformance: true,
            canUseWebGL: false,
            maxParticles: 500,
            targetFPS: 60,
            deviceTier: 'high', // 'high', 'medium', 'low'
            memoryLimit: 'high', // 'high', 'medium', 'low'
            deviceProfile: null, // Will hold detailed performance analysis
        }
    }

    /**
     * Initialize the responsive manager with a canvas
     * @param canvas - The game canvas
     */
    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas

        // Set up event listeners
        this.setupEventListeners()

        // Detect device capabilities
        this.detectDeviceCapabilities().then(capabilities => {
            this.capabilities = capabilities
            console.log('Device capabilities detected:', this.capabilities)

            // Apply performance settings based on capabilities
            this.applyPerformanceSettings()
        })

        // Initial resize
        this.handleResize()
    }

    /**
     * Set up event listeners for responsive behavior
     */
    setupEventListeners(): void {
        // Listen for window resize
        window.addEventListener('resize', this.handleResize.bind(this))

        // Listen for orientation change on mobile
        window.addEventListener(
            'orientationchange',
            this.handleResize.bind(this)
        )

        // Listen for visibility change to handle tab switching
        document.addEventListener(
            'visibilitychange',
            this.handleVisibilityChange.bind(this)
        )
    }

    /**
     * Handle window resize event
     */
    handleResize(): void {
        // Re-check device type
        const wasDesktop = this.isDesktop
        this.isDesktop = this.detectDesktop()

        // Update device settings if device type changed
        if (wasDesktop !== this.isDesktop) {
            this.deviceSettings = this.isDesktop
                ? DEVICE_SETTINGS.DESKTOP
                : DEVICE_SETTINGS.MOBILE
        }

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
     * Handle document visibility change (active tab changes)
     */
    handleVisibilityChange(): void {
        if (document.visibilityState === 'visible') {
            // Force a resize check when tab becomes visible again
            this.handleResize()
        }
    }

    /**
     * Detect if current viewport is desktop sized
     * @returns Whether the current viewport is desktop sized
     */
    detectDesktop(): boolean {
        // Use a more practical detection method that works with browser automation
        const isWideScreen = window.innerWidth >= 800 // Lower threshold to match browser viewport
        const hasLargeHeight = window.innerHeight >= 500

        // Consider desktop if screen is both wide and tall enough
        // This is more reliable than pointer detection which can fail in automation
        const isDesktopSize = isWideScreen && hasLargeHeight

        console.log(
            `Desktop detection: width=${window.innerWidth}, height=${window.innerHeight}, isDesktop=${isDesktopSize}`
        )

        return isDesktopSize
    }

    /**
     * Resize canvas to match viewport, maintaining aspect ratio
     */
    resizeCanvas(): void {
        if (!this.canvas) return

        // Canvas is now directly in game-main, no viewport wrapper needed
        const gameMain = this.canvas.closest('.game-main') as HTMLElement
        if (!gameMain) {
            console.warn('Game main container not found')
            return
        }

        // Calculate available space based on device type
        let availableWidth: number
        let availableHeight: number

        if (this.isDesktop) {
            // Desktop: Calculate based on the CSS Grid layout
            // The grid is: grid-template-columns: 1fr 280px with gap: 16px
            const gameMain = document.querySelector(
                '.game-main'
            ) as HTMLElement | null
            
            if (gameMain) {
                const gameMainRect = gameMain.getBoundingClientRect()
                const sidebarWidth = 280 // Fixed sidebar width from CSS
                const gridGap = 24 // CSS gap from --space-lg
                const padding = 32 // Main padding (16px each side)
                
                // Calculate available space for canvas (first grid column)
                availableWidth = Math.max(gameMainRect.width - sidebarWidth - gridGap - padding, 600)
                availableHeight = Math.max(gameMainRect.height - padding, 500)
                
                console.log(
                    `Desktop canvas sizing: ${availableWidth}x${availableHeight} available (gameMain: ${gameMainRect.width}x${gameMainRect.height}, sidebar: ${sidebarWidth}px)`
                )
            } else {
                // Fallback for desktop
                const sidebarWidth = 280
                const gridGap = 24
                const padding = 64 // Conservative padding estimate
                
                availableWidth = Math.max(window.innerWidth - sidebarWidth - gridGap - padding, 600)
                availableHeight = Math.max(window.innerHeight - 200, 500) // Account for header
                
                console.log(
                    `Desktop canvas sizing (fallback): ${availableWidth}x${availableHeight}`
                )
            }
        } else {
            // Mobile: Calculate based on actual layout structure
            const header = document.querySelector(
                '.app-header'
            ) as HTMLElement | null
            const controlPanel = document.querySelector(
                '.control-panel'
            ) as HTMLElement | null

            // Get actual heights of fixed elements - use modern measurement approach
            const headerHeight = header ? header.offsetHeight : 80
            
            // Dynamic control height calculation - accounts for responsive CSS
            let controlsHeight: number
            if (controlPanel) {
                // Force layout calculation to get accurate size after CSS changes
                controlPanel.offsetHeight // Trigger reflow
                controlsHeight = controlPanel.offsetHeight
            } else {
                // Use CSS custom property as fallback instead of hardcoded value
                const ctrlH = getComputedStyle(document.documentElement).getPropertyValue('--ctrl-h')
                controlsHeight = parseFloat(ctrlH) || 120 // Parse clamp() result or fallback
            }
            const margin = 20 // Total margin (10px each side)

            // Calculate available space more accurately
            const totalReservedHeight = headerHeight + controlsHeight + margin
            availableHeight = Math.max(
                window.innerHeight - totalReservedHeight,
                250
            ) // Minimum 250px height
            availableWidth = Math.max(window.innerWidth - margin, 280) // Minimum 280px width

            // Apply mobile-specific limits - increased to give more canvas space
            availableWidth = Math.min(availableWidth, CANVAS.MAX_MOBILE_WIDTH * 1.2)

            console.log(
                `Mobile canvas sizing: ${availableWidth}x${availableHeight} available (header: ${headerHeight}px, controls: ${controlsHeight}px)`
            )
        }

        // Calculate scaling factors to fit within available space
        const widthScale = availableWidth / this.baseCanvasWidth
        const heightScale = availableHeight / this.baseCanvasHeight

        // Use the smaller scale to maintain aspect ratio and fit within bounds
        const scale = Math.min(widthScale, heightScale)

        // Calculate final canvas dimensions
        const canvasWidth = Math.floor(this.baseCanvasWidth * scale)
        const canvasHeight = Math.floor(this.baseCanvasHeight * scale)

        // Ensure minimum playable size - more aggressive mobile sizing
        const minHeight = this.isDesktop ? 500 : 200 // Reduced mobile minimum
        const minWidth = Math.floor(
            (minHeight / this.baseCanvasHeight) * this.baseCanvasWidth
        )

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
            `Canvas resized: ${finalCanvasWidth}×${finalCanvasHeight} (scale: ${this.scalingInfo.widthScale.toFixed(
                2
            )})`
        )
    }

    /**
     * Get the current device settings
     * @returns The current device settings
     */
    getDeviceSettings(): any {
        return this.deviceSettings
    }

    /**
     * Get the current scaling information
     * @returns The current scaling information
     */
    getScalingInfo(): ScalingInfo {
        return this.scalingInfo
    }

    /**
     * Check if the current device is desktop
     * @returns Whether the current device is desktop
     */
    isDesktopDevice(): boolean {
        return this.isDesktop
    }

    /**
     * Calculate a responsive value based on the base value and scaling
     * @param baseValue - The base value
     * @param dimension - The dimension to scale by ('width', 'height', or 'both')
     * @returns The scaled value
     */
    getResponsiveValue(
        baseValue: number,
        dimension: 'width' | 'height' | 'both' = 'both'
    ): number {
        if (dimension === 'width') {
            return baseValue * this.scalingInfo.widthScale
        } else if (dimension === 'height') {
            return baseValue * this.scalingInfo.heightScale
        } else {
            // Use average scaling for 'both'
            const avgScale =
                (this.scalingInfo.widthScale + this.scalingInfo.heightScale) / 2
            return baseValue * avgScale
        }
    }

    /**
     * Detect device capabilities for performance optimizations
     * @returns A promise that resolves to device capabilities
     */
    async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
        const capabilities: DeviceCapabilities = {
            highPerformance: true,
            canUseWebGL: false,
            maxParticles: 500,
            targetFPS: 60,
            deviceTier: 'high',
            memoryLimit: 'high', // 'high', 'medium', 'low'
            deviceProfile: null,
        }

        // Check for mobile/low-end devices based on user agent
        const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        )
        const isLowEndMobile =
            /Android 4|Android 5|iPhone 6|iPhone 7|iPhone 8|iPad Mini/i.test(
                navigator.userAgent
            )

        // Check hardware capabilities
        const hardwareConcurrency = navigator.hardwareConcurrency || 2
        const deviceMemory = (navigator as any).deviceMemory || 4

        // Check WebGL support
        try {
            const canvas = document.createElement('canvas')
            const gl =
                canvas.getContext('webgl') ||
                (canvas.getContext(
                    'experimental-webgl'
                ) as WebGLRenderingContext | null)
            capabilities.canUseWebGL = !!gl

            // Additional WebGL capabilities check if supported
            if (gl) {
                // Check for WebGL extensions
                interface WebGLDebugRendererInfo {
                    UNMASKED_VENDOR_WEBGL: number
                    UNMASKED_RENDERER_WEBGL: number
                }

                const debugInfo = gl.getExtension(
                    'WEBGL_debug_renderer_info'
                ) as WebGLDebugRendererInfo | null
                if (debugInfo) {
                    const renderer = gl.getParameter(
                        debugInfo.UNMASKED_RENDERER_WEBGL
                    ) as string
                    console.log(`WebGL Renderer: ${renderer}`)

                    // Detect low-end GPUs
                    const isLowEndGPU =
                        /Intel|HD Graphics|GMA|Mali-4|Mali-T|Adreno 3|PowerVR/i.test(
                            renderer
                        )
                    if (isLowEndGPU) {
                        capabilities.highPerformance = false
                    }
                }
            }
        } catch (e) {
            capabilities.canUseWebGL = false
            console.warn('WebGL detection failed:', e)
        }

        // Run a quick performance test
        const perfScore = await this.runPerformanceTest()

        // Determine device tier based on all factors
        if (
            isLowEndMobile ||
            hardwareConcurrency <= 2 ||
            deviceMemory <= 2 ||
            perfScore < 10
        ) {
            capabilities.deviceTier = 'low'
            capabilities.highPerformance = false
            capabilities.maxParticles = 50
            capabilities.targetFPS = 30
            capabilities.memoryLimit = 'low'
        } else if (
            isMobile ||
            hardwareConcurrency <= 4 ||
            deviceMemory <= 4 ||
            perfScore < 25
        ) {
            capabilities.deviceTier = 'medium'
            capabilities.highPerformance = false
            capabilities.maxParticles = 150
            capabilities.targetFPS = 45
            capabilities.memoryLimit = 'medium'
        }

        // Create device profile for analytics
        capabilities.deviceProfile = {
            userAgent: navigator.userAgent,
            hardwareConcurrency,
            deviceMemory,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height,
                pixelRatio: window.devicePixelRatio || 1,
            },
            perfScore,
            webGL: capabilities.canUseWebGL,
        }

        return capabilities
    }

    /**
     * Run a quick performance test to estimate device capabilities
     * @returns Performance score (higher is better)
     */
    async runPerformanceTest(): Promise<number> {
        return new Promise(resolve => {
            console.log('Running performance test...')

            let frameCount = 0
            const startTime = performance.now()
            const iterations = 1000

            // Test array operations
            const arrays: Float32Array[] = []
            for (let i = 0; i < 10; i++) {
                arrays.push(new Float32Array(1000))
            }

            // Test rendering performance
            const testCanvas = document.createElement('canvas')
            testCanvas.width = 200
            testCanvas.height = 200
            const ctx = testCanvas.getContext('2d')

            // Run the test
            const runIteration = (iter: number): void => {
                if (iter >= iterations) {
                    // Test complete
                    const duration = performance.now() - startTime
                    const score = Math.round((iterations / duration) * 1000)
                    console.log(
                        `Performance test completed with score: ${score}`
                    )

                    // Cleanup
                    arrays.length = 0

                    resolve(score)
                    return
                }

                // Test array manipulations (CPU)
                for (let i = 0; i < arrays.length; i++) {
                    const arr = arrays[i]
                    for (let j = 0; j < 100; j++) {
                        arr[j] = Math.sin(j) * Math.cos(j)
                    }
                }

                // Test canvas drawing (GPU)
                if (ctx) {
                    ctx.clearRect(0, 0, 200, 200)
                    for (let i = 0; i < 10; i++) {
                        ctx.fillStyle = `rgba(${Math.random() * 255}, ${
                            Math.random() * 255
                        }, ${Math.random() * 255}, 0.5)`
                        ctx.beginPath()
                        ctx.arc(
                            Math.random() * 200,
                            Math.random() * 200,
                            10 + Math.random() * 20,
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()
                    }
                }

                frameCount++

                // Continue test asynchronously to avoid blocking UI
                if (iter % 50 === 0) {
                    setTimeout(() => runIteration(iter + 1), 0)
                } else {
                    runIteration(iter + 1)
                }
            }

            // Start the test
            runIteration(0)
        })
    }

    /**
     * Apply performance settings based on detected capabilities
     */
    applyPerformanceSettings(): void {
        console.log(
            `Applying performance settings for ${this.capabilities.deviceTier} tier device`
        )

        // Update scalingInfo with performance considerations
        this.scalingInfo.reducedResolution =
            this.capabilities.deviceTier === 'low'

        // Apply settings to game components if they exist
        if (this.game) {
            // Update particle system settings
            if (this.game.particleSystem) {
                const maxParticles = this.capabilities.maxParticles
                this.game.particleSystem.setMaxParticles(maxParticles)
                console.log(`Set max particles to ${maxParticles}`)
            }

            // Update rendering quality
            if (this.canvas) {
                if (this.capabilities.deviceTier === 'low') {
                    // Lower quality for low-end devices
                    this.canvas.className = 'low-quality'

                    // Reduce canvas size for low-end devices
                    const pixelRatio = 0.75 // 75% of native resolution
                    const ctx = this.canvas.getContext('2d')
                    if (ctx) {
                        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
                    }
                }
            }

            // Store settings in game configuration
            if (this.game.config) {
                // Allow game to access device tier for conditional logic
                this.game.config.deviceTier = this.capabilities.deviceTier
                this.game.config.targetFPS = this.capabilities.targetFPS
            }
        }

        // Apply FPS throttling for lower-end devices
        if (this.capabilities.targetFPS < 60) {
            console.log(
                `Throttling FPS to target ${this.capabilities.targetFPS} FPS`
            )
        }
    }

    /**
     * Clean up resources (important for memory management)
     */
    dispose(): void {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this))
        window.removeEventListener(
            'orientationchange',
            this.handleResize.bind(this)
        )
        document.removeEventListener(
            'visibilitychange',
            this.handleVisibilityChange.bind(this)
        )
    }
}
