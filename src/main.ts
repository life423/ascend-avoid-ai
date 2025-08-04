// Codex test commit
/**
 * Modern main entry point for Ascend Avoid game.
 * Handles initialization, polyfills, and responsive behavior.
 * Fully typed with comprehensive error handling.
 */

import './styles/index.css'

// Import core game components
import Game from './core/Game'
import { DeviceInfo } from './types'
import { ResponsiveCanvas } from './utils/responsiveCanvas'

// Import utility functions
import {
    applyChromeMobileFixes,
    initMobileViewportFix,
} from './utils/mobileViewportFix'
import { setupPerformanceMonitoring } from './utils/performance'
import { setupPolyfills } from './utils/polyfills'

// Global game instance
let gameInstance: Game | null = null
let responsiveCanvas: ResponsiveCanvas | null = null

/**
 * Application initialization and startup
 */
class GameApplication {
    private initialized = false
    private canvas: HTMLCanvasElement | null = null
    private loader: HTMLElement | null = null

    constructor() {
        this.setupGlobalErrorHandling()
        this.setupPerformanceMonitoring()
        this.initMobileFixes()
    }

    /**
     * Initialize mobile-specific fixes
     */
    private initMobileFixes(): void {
        initMobileViewportFix()
        applyChromeMobileFixes()
    }

    /**
     * Sets up global error handling and reporting
     */
    private setupGlobalErrorHandling(): void {
        window.addEventListener('error', event => {
            console.error('Global error:', event.error)
            this.showErrorMessage(
                'An unexpected error occurred. Please refresh the page.'
            )
        })

        window.addEventListener('unhandledrejection', event => {
            console.error('Unhandled promise rejection:', event.reason)
            this.showErrorMessage(
                'A network or loading error occurred. Please check your connection.'
            )
        })
    }

    /**
     * Sets up performance monitoring for debugging
     */
    private setupPerformanceMonitoring(): void {
        if (process.env.NODE_ENV === 'development') {
            setupPerformanceMonitoring()
        }
    }

    /**
     * Shows error message to user
     */
    private showErrorMessage(message: string): void {
        const errorDiv = document.createElement('div')
        errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `
        errorDiv.textContent = message
        document.body.appendChild(errorDiv)

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv)
            }
        }, 5000)
    }

    /**
     * Detects device capabilities and preferences
     */
    private getDeviceInfo(): DeviceInfo {
        return {
            isTouchDevice:
                'ontouchstart' in window || navigator.maxTouchPoints > 0,
            isMobile: window.innerWidth < 768,
            isTablet: window.innerWidth >= 768 && window.innerWidth < 1200,
            isDesktop: window.innerWidth >= 1200,
            isLandscape: window.innerWidth > window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
        }
    }

    /**
     * Sets up polyfills for older browsers
     */
    private setupPolyfills(): void {
        setupPolyfills()
    }

    /**
     * Applies initial device-specific optimizations
     */
    private applyDeviceOptimizations(deviceInfo: DeviceInfo): void {
        const body = document.body

        // Add device-specific classes
        if (deviceInfo.isDesktop) {
            body.classList.add('desktop-layout')
        } else if (deviceInfo.isTablet) {
            body.classList.add('tablet-layout')
        } else if (deviceInfo.isMobile) {
            body.classList.add('mobile-layout')
        }

        if (deviceInfo.isTouchDevice) {
            body.classList.add('touch-device')
        }

        if (deviceInfo.isLandscape) {
            body.classList.add('landscape')
        } else {
            body.classList.add('portrait')
        }

        // Set CSS custom properties for responsive scaling
        document.documentElement.style.setProperty(
            '--device-width',
            `${deviceInfo.screenWidth}px`
        )
        document.documentElement.style.setProperty(
            '--device-height',
            `${deviceInfo.screenHeight}px`
        )
        document.documentElement.style.setProperty(
            '--device-ratio',
            deviceInfo.devicePixelRatio.toString()
        )
    }

    /**
     * Sets up the responsive canvas system
     */
    private setupCanvas(): void {
        this.canvas = document.querySelector(
            '.game-canvas[data-canvas="primary"]'
        ) as HTMLCanvasElement

        if (!this.canvas) {
            throw new Error(
                'Game canvas not found! Make sure the HTML includes an element with class="game-canvas" and data-canvas="primary"'
            )
        }

        // Remove any hardcoded dimensions from HTML
        this.canvas.removeAttribute('width')
        this.canvas.removeAttribute('height')

        // Create responsive canvas manager
        responsiveCanvas = new ResponsiveCanvas(this.canvas, {
            maintainAspectRatio: false, // Allow full screen usage for better mobile experience
            minWidth: 320,
            minHeight: 240,
            maxWidth: 2560,
            maxHeight: 1440,
            devicePixelRatio: true,
        })

        // Set up resize callback for game updates
        responsiveCanvas.onResize(
            (
                widthScale: number,
                heightScale: number,
                deviceInfo: DeviceInfo
            ) => {
                console.log(
                    `Canvas resized: ${deviceInfo.screenWidth}x${
                        deviceInfo.screenHeight
                    }, Scale: ${widthScale.toFixed(2)}x${heightScale.toFixed(
                        2
                    )}`
                )

                // Update device classes
                this.applyDeviceOptimizations(deviceInfo)

                // Notify game instance if it exists (defensive call)
                if (gameInstance && (gameInstance as any).handleResize) {
                    try {
                        ;(gameInstance as any).handleResize(
                            widthScale,
                            heightScale,
                            deviceInfo
                        )
                    } catch (error) {
                        console.warn('Game resize handler failed:', error)
                    }
                }
            }
        )
    }

    /**
     * Creates the multiplayer toggle button with proper styling
     * Commented out since the element doesn't exist in current HTML
     */
    /*
    private setupMultiplayerButton(): void {
        const multiplayerButton = document.getElementById('multiplayerToggle')

        if (!multiplayerButton) {
            console.warn('Multiplayer button not found in HTML')
            return
        }

        // Set initial text
        const statusSpan = multiplayerButton.querySelector('.button-status')
        if (statusSpan) {
            statusSpan.textContent = 'OFF'
        }

        // Add click handler
        multiplayerButton.addEventListener('click', () => {
            if (gameInstance && (gameInstance as any).toggleMultiplayer) {
                try {
                    ;(gameInstance as any).toggleMultiplayer()
                } catch (error) {
                    console.warn('Multiplayer toggle failed:', error)
                }
            }
        })

        // Add keyboard support
        multiplayerButton.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                multiplayerButton.click()
            }
        })
    }
    */

    /**
     * Sets up debug stats display
     * Commented out since the elements don't exist in current HTML
     */
    /*
    private setupDebugStats(): void {
        const debugStats = document.getElementById('debug-stats')

        if (!debugStats) {
            console.warn('Debug stats element not found')
            return
        }

        // Show debug stats in development mode or when debug flag is set
        const showDebug =
            process.env.NODE_ENV === 'development' ||
            new URLSearchParams(window.location.search).has('debug')

        if (showDebug) {
            debugStats.style.display = 'block'
            this.startStatsUpdater()
        }
    }
    */

    /**
     * Starts the debug stats updater
     * Commented out since debug elements don't exist
     */
    /*
    private startStatsUpdater(): void {
        const fpsCounter = document.getElementById('fps-counter')
        const frameTime = document.getElementById('frame-time')
        const canvasSize = document.getElementById('canvas-size')
        const deviceInfo = document.getElementById('device-info')

        if (!fpsCounter || !frameTime || !canvasSize || !deviceInfo) {
            return
        }

        let lastTime = performance.now()
        let frameCount = 0
        let lastFpsUpdate = lastTime

        const updateStats = () => {
            const now = performance.now()
            const delta = now - lastTime
            lastTime = now
            frameCount++

            // Update FPS every second
            if (now - lastFpsUpdate >= 1000) {
                const fps = Math.round(
                    (frameCount * 1000) / (now - lastFpsUpdate)
                )
                fpsCounter.textContent = `FPS: ${fps}`
                frameCount = 0
                lastFpsUpdate = now
            }

            // Update frame time
            frameTime.textContent = `Frame: ${delta.toFixed(1)}ms`

            // Update canvas size
            if (this.canvas) {
                canvasSize.textContent = `Canvas: ${this.canvas.width}x${this.canvas.height}`
            }

            // Update device info
            const device = this.getDeviceInfo()
            const deviceType = device.isDesktop
                ? 'Desktop'
                : device.isTablet
                ? 'Tablet'
                : 'Mobile'
            deviceInfo.textContent = `Device: ${deviceType} (${device.screenWidth}x${device.screenHeight})`

            requestAnimationFrame(updateStats)
        }

        requestAnimationFrame(updateStats)
    }
    */

    /**
     * Hides the loading screen
     */
    private hideLoader(): void {
        if (this.loader) {
            this.loader.classList.add('hidden')
            setTimeout(() => {
                if (this.loader && this.loader.parentNode) {
                    this.loader.parentNode.removeChild(this.loader)
                }
                this.loader = null
            }, 500)
        }
    }

    /**
     * Sets up global game interface for debugging and external control
     */
    private setupGlobalInterface(): void {
        window.game = {
            onResize: (
                widthScale: number,
                heightScale: number,
                _isDesktop: boolean
            ) => {
                // This will be called by the ResponsiveCanvas system
                if (gameInstance && (gameInstance as any).handleResize) {
                    try {
                        const deviceInfo = this.getDeviceInfo()
                        ;(gameInstance as any).handleResize(
                            widthScale,
                            heightScale,
                            deviceInfo
                        )
                    } catch (error) {
                        console.warn('Game resize handler failed:', error)
                    }
                }
            },
            pause: () => {
                if (gameInstance && (gameInstance as any).pause) {
                    try {
                        ;(gameInstance as any).pause()
                    } catch (error) {
                        console.warn('Game pause failed:', error)
                    }
                }
            },
            resume: () => {
                if (gameInstance && (gameInstance as any).resume) {
                    try {
                        ;(gameInstance as any).resume()
                    } catch (error) {
                        console.warn('Game resume failed:', error)
                    }
                }
            },
            restart: () => {
                if (gameInstance && (gameInstance as any).restart) {
                    try {
                        ;(gameInstance as any).restart()
                    } catch (error) {
                        console.warn('Game restart failed:', error)
                    }
                }
            },
            toggleMultiplayer: () => {
                if (gameInstance && (gameInstance as any).switchGameMode) {
                    try {
                        const newMode = (gameInstance as any).isMultiplayerMode
                            ? 'singlePlayer'
                            : 'multiplayer'
                        ;(gameInstance as any).switchGameMode(newMode)
                    } catch (error) {
                        console.warn('Multiplayer toggle failed:', error)
                    }
                }
            },
            switchGameMode: (mode: 'singlePlayer' | 'multiplayer') => {
                if (gameInstance && (gameInstance as any).switchGameMode) {
                    try {
                        return (gameInstance as any).switchGameMode(mode)
                    } catch (error) {
                        console.warn('Game mode switch failed:', error)
                        return Promise.reject(error)
                    }
                }
                return Promise.reject(new Error('Game instance not available'))
            },
            // Expose current multiplayer state
            get isMultiplayerMode() {
                return gameInstance
                    ? (gameInstance as any).isMultiplayerMode
                    : false
            },
            getStats: () => {
                if (gameInstance) {
                    // Try multiple possible method names
                    if ((gameInstance as any).getPerformanceStats) {
                        try {
                            return (gameInstance as any).getPerformanceStats()
                        } catch (error) {
                            console.warn('getPerformanceStats failed:', error)
                        }
                    }
                    if ((gameInstance as any).performanceStats) {
                        try {
                            return (gameInstance as any).performanceStats
                        } catch (error) {
                            console.warn(
                                'performanceStats access failed:',
                                error
                            )
                        }
                    }
                }
                return null
            },
        }
    }

    /**
     * Main initialization method
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            console.warn('Game already initialized')
            return
        }

        try {
            console.log('Initializing Ascend Avoid game...')

            // Get loader element
            this.loader = document.querySelector('.loader')

            // Detect device capabilities
            const deviceInfo = this.getDeviceInfo()
            console.log(
                `Device detected: ${
                    deviceInfo.isDesktop
                        ? 'Desktop'
                        : deviceInfo.isTablet
                        ? 'Tablet'
                        : 'Mobile'
                }`
            )
            console.log(
                `Touch support: ${deviceInfo.isTouchDevice ? 'Yes' : 'No'}`
            )
            console.log(
                `Screen: ${deviceInfo.screenWidth}x${deviceInfo.screenHeight} (${deviceInfo.devicePixelRatio}x DPR)`
            )

            // Apply initial optimizations
            this.applyDeviceOptimizations(deviceInfo)

            // Set up polyfills for older browsers
            this.setupPolyfills()

            // Set up canvas and responsive system
            this.setupCanvas()

            // Set up UI components (skip missing elements for now)
            // this.setupMultiplayerButton()
            // this.setupDebugStats()

            // Set up global interface
            this.setupGlobalInterface()

            // Give the canvas a moment to initialize
            await new Promise(resolve => setTimeout(resolve, 100))

            // Initialize the game (no parameters based on current Game constructor)
            gameInstance = new Game()

            // Set the canvas if the game has a method to do so
            if (this.canvas && (gameInstance as any).setCanvas) {
                try {
                    ;(gameInstance as any).setCanvas(this.canvas)
                } catch (error) {
                    console.warn(
                        'Failed to set canvas on game instance:',
                        error
                    )
                }
            }

            // CRITICAL: Initialize the game (this was missing!)
            if ((gameInstance as any).init) {
                try {
                    await (gameInstance as any).init()
                    console.log('Game initialization completed')
                } catch (error) {
                    console.error('Game initialization failed:', error)
                    throw error
                }
            }

            // Hide loading screen
            this.hideLoader()

            this.initialized = true
            console.log('Game initialized successfully')
        } catch (error) {
            console.error('Failed to initialize game:', error)
            this.showErrorMessage(
                'Failed to initialize game. Please refresh the page and try again.'
            )
            throw error
        }
    }

    /**
     * Clean up resources when page unloads
     */
    public cleanup(): void {
        if (responsiveCanvas) {
            responsiveCanvas.destroy()
            responsiveCanvas = null
        }

        if (gameInstance && (gameInstance as any).destroy) {
            try {
                ;(gameInstance as any).destroy()
            } catch (error) {
                console.warn('Game cleanup failed:', error)
            }
            gameInstance = null
        }

        this.initialized = false
    }
}

// Application instance
const app = new GameApplication()

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.initialize().catch(console.error)
    })
} else {
    // DOM is already ready
    app.initialize().catch(console.error)
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    app.cleanup()
})

// Handle visibility changes (mobile optimization)
document.addEventListener('visibilitychange', () => {
    if (gameInstance) {
        if (document.hidden) {
            // Page hidden - pause game to save battery
            if ((gameInstance as any).pause) {
                try {
                    ;(gameInstance as any).pause()
                } catch (error) {
                    console.warn('Auto-pause failed:', error)
                }
            }
        } else {
            // Page visible - resume game
            if ((gameInstance as any).resume) {
                try {
                    ;(gameInstance as any).resume()
                } catch (error) {
                    console.warn('Auto-resume failed:', error)
                }
            }
        }
    }
})

// Export for debugging
if (process.env.NODE_ENV === 'development') {
    ;(window as any).gameApp = app
    ;(window as any).getGameInstance = () => gameInstance
    ;(window as any).getResponsiveCanvas = () => responsiveCanvas
}
