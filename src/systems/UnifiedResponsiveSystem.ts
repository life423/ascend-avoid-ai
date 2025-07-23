/**
 * UnifiedResponsiveSystem - Foundation Implementation
 * 
 * This system represents a paradigm shift in responsive design:
 * - Configuration as data, not logic
 * - Multi-dimensional device analysis  
 * - Performance-aware adaptations
 * - Single source of truth for all responsive behavior
 */

import { VIEWPORT_CONFIGS, DEFAULT_CONFIG } from './ViewportConfigurations'

// First, let's define our core interfaces
// These describe the "shape" of our data

export interface ViewportInfo {
    width: number
    height: number
    orientation: 'portrait' | 'landscape'
    pixelRatio: number
    touchCapable: boolean
    screenType: 'phone' | 'tablet' | 'desktop' | 'tv'
}

/** How to derive logical canvasSize given a viewport */
export interface CanvasStrategy {
  mode: 'fit' | 'fill' | 'stretch' | 'pixelPerfect';
  designWidth: number;   // your internal coord‑sys, e.g. 720
  designHeight: number;  //                 , e.g. 1280
  maxWidth?: number;     // optional caps
  maxHeight?: number;
  minScale?: number;     // optional floor so things never get microscopic
}

export interface ResolvedCanvas {
  cssWidth: number;   // physical CSS pixels
  cssHeight: number;
  scale: number;      // cssPx / designPx (same for x & y except 'stretch')
}

export interface ControlLayout {
    position: 'bottom' | 'sides' | 'floating' | 'hidden'
    size: 'compact' | 'normal' | 'large'
    opacity: number
    hapticFeedback: boolean
}

export interface PerformanceProfile {
    targetFPS: number
    particleLimit: number
    shadowQuality: 'off' | 'low' | 'high'
    effectsEnabled: boolean
    adaptiveQuality: boolean
}

export interface ViewportConfig {
    name: string
    test: (viewport: ViewportInfo) => boolean
    className: string
    canvasStrategy: CanvasStrategy
    controlLayout: ControlLayout
    performanceProfile: PerformanceProfile
}

/**
 * The main system class
 * We're using a singleton pattern because there should only be one
 * responsive system managing the entire application
 */
export class UnifiedResponsiveSystem {
    private static instance: UnifiedResponsiveSystem
    private currentConfig: ViewportConfig | null = null
    private viewportInfo: ViewportInfo
    private subscribers: Set<(config: ViewportConfig, info: ViewportInfo) => void> = new Set()
    
    // We'll add more properties as we build out the system
    private rafId: number | null = null
    private lastCheck: number = 0
    private checkInterval: number = 100 // Check every 100ms max
    
    private constructor() {
        console.log('🚀 UnifiedResponsiveSystem initializing...')
        
        // Get initial viewport information
        this.viewportInfo = this.detectViewportInfo()
        
        // Set up our configuration data (we'll expand this next)
        this.setupConfigurations()
        
        // Start monitoring for changes
        this.setupEventListeners()
        
        // Apply initial configuration
        this.update()
    }
    
    /**
     * Singleton accessor - ensures we only have one instance
     */
    public static getInstance(): UnifiedResponsiveSystem {
        if (!UnifiedResponsiveSystem.instance) {
            UnifiedResponsiveSystem.instance = new UnifiedResponsiveSystem()
        }
        return UnifiedResponsiveSystem.instance
    }
    
    /**
     * Detects comprehensive information about the current viewport
     * This goes far beyond simple width/height checks
     */
    private detectViewportInfo(): ViewportInfo {
        const width = window.innerWidth
        const height = window.innerHeight
        
        // Determine orientation based on dimensions
        const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait'
        
        // Get device pixel ratio for high-DPI displays
        const pixelRatio = window.devicePixelRatio || 1
        
        // Comprehensive touch detection
        const touchCapable = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 ||
                           (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
        
        // Smart screen type detection
        let screenType: ViewportInfo['screenType'] = 'desktop'
        
        // First check if it might be a TV (large screen, low DPI)
        if (width >= 1920 && pixelRatio <= 1.5) {
            screenType = 'tv'
        }
        // Then check for tablets (medium size with touch)
        else if ((width >= 768 && width <= 1366 && touchCapable) || 
                 /iPad|Android.*Tablet/i.test(navigator.userAgent)) {
            screenType = 'tablet'
        }
        // Finally check for phones (small size or mobile UA)
        else if ((width <= 768 && touchCapable) || 
                 /iPhone|Android.*Mobile/i.test(navigator.userAgent)) {
            screenType = 'phone'
        }
        
        return {
            width,
            height,
            orientation,
            pixelRatio,
            touchCapable,
            screenType
        }
    }
    
    /**
     * Set up viewport configurations
     * This is where we teach the system about different device scenarios
     */
    private setupConfigurations(): void {
        console.log('📊 Setting up viewport configurations...')
        
        // The configurations are already defined in ViewportConfigurations.ts
        // Here we just verify they're loaded correctly
        if (VIEWPORT_CONFIGS.length === 0) {
            console.warn('⚠️ No viewport configurations found! Using default.')
        } else {
            console.log(`✅ Loaded ${VIEWPORT_CONFIGS.length} viewport configurations`)
        }
    }
    
    /**
     * Set up event listeners for viewport changes
     */
    private setupEventListeners(): void {
        // Use ResizeObserver for better performance
        if ('ResizeObserver' in window && typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => {
                this.scheduleUpdate()
            })
            observer.observe(document.body)
        }
        
        // Always set up window listeners as a fallback or addition
        // Use arrow function to preserve 'this' context
        const handleResize = () => this.scheduleUpdate()
        window.addEventListener('resize', handleResize)
        
        // Orientation change with proper typing
        if ('orientation' in window) {
            window.addEventListener('orientationchange', handleResize)
        }
        
        // Listen for device pixel ratio changes (zoom, external displays)
        if (window.matchMedia) {
            const pixelRatioQuery = `(resolution: ${window.devicePixelRatio || 1}dppx)`
            try {
                const mediaQuery = window.matchMedia(pixelRatioQuery)
                // Modern browsers
                if (mediaQuery.addEventListener) {
                    mediaQuery.addEventListener('change', handleResize)
                } else if (mediaQuery.addListener) {
                    // Legacy Safari
                    mediaQuery.addListener(handleResize)
                }
            } catch (e) {
                console.warn('Media query for pixel ratio failed:', e)
            }
        }
    }
    
    /**
     * Throttles update checks for performance
     * We don't want to recalculate on every single pixel of window resize
     */
    private scheduleUpdate(): void {
        const now = performance.now()
        
        // If we checked recently, schedule for later
        if (now - this.lastCheck < this.checkInterval) {
            if (!this.rafId) {
                this.rafId = requestAnimationFrame(() => {
                    this.rafId = null
                    this.update()
                })
            }
            return
        }
        
        this.lastCheck = now
        this.update()
    }
    
    /**
     * Main update method - this is where the magic happens
     */
    private update(): void {
        // Re-detect viewport information
        const oldInfo = this.viewportInfo
        this.viewportInfo = this.detectViewportInfo()
        
        // Log changes for debugging
        if (oldInfo.screenType !== this.viewportInfo.screenType ||
            oldInfo.orientation !== this.viewportInfo.orientation) {
            console.log('📱 Viewport changed:', this.viewportInfo)
        }
        
        // Find the best configuration for current viewport
        const newConfig = this.findBestConfiguration()
        
        // Only update if configuration actually changed
        // This prevents unnecessary work when nothing meaningful has changed
        if (newConfig !== this.currentConfig) {
            console.log(`🔄 Switching from ${this.currentConfig?.name || 'none'} to ${newConfig.name}`)
            this.applyConfiguration(newConfig)
        }
    }
    
    /**
     * Finds the best configuration for the current viewport
     * Think of this as a matchmaking service for your device and settings
     */
    private findBestConfiguration(): ViewportConfig {
        // Go through configurations in order and find the first match
        // Order matters here - more specific configs should come first
        for (const config of VIEWPORT_CONFIGS) {
            if (config.test(this.viewportInfo)) {
                return config
            }
        }
        
        // If somehow no configuration matches (shouldn't happen), use default
        console.warn('⚠️ No matching configuration found, using default')
        return DEFAULT_CONFIG
    }
    
    /**
     * Applies a configuration to the application
     * This is where configuration becomes reality
     */
    private applyConfiguration(config: ViewportConfig): void {
        const previousConfig = this.currentConfig
        this.currentConfig = config
        
        // Update document class for CSS hooks
        // This lets your CSS respond to configuration changes if needed
        if (previousConfig) {
            document.documentElement.classList.remove(previousConfig.className)
        }
        document.documentElement.classList.add(config.className)
        
        // Add data attribute for easier debugging
        document.documentElement.setAttribute('data-viewport-config', config.name)
        
        // Notify all subscribers about the configuration change
        // This is like sending out a newsletter to all interested parties
        this.subscribers.forEach(callback => {
            try {
                callback(config, this.viewportInfo)
            } catch (error) {
                console.error('Error in responsive subscriber:', error)
            }
        })
        
        console.log(`✅ Applied configuration: ${config.name}`)
    }
    
    /**
     * Public API for other parts of the app to subscribe to changes
     */
    public subscribe(callback: (config: ViewportConfig, info: ViewportInfo) => void): () => void {
        this.subscribers.add(callback)
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback)
        }
    }
    
    /**
     * Get current viewport information
     */
    public getViewportInfo(): ViewportInfo {
        return { ...this.viewportInfo }
    }
    
    /**
     * Force an immediate update (useful for testing)
     */
    public forceUpdate(): void {
        console.log('🔄 Forcing responsive update...')
        this.update()
    }

    /**
     * Get current configuration
     */
    public getCurrentConfig(): ViewportConfig | null {
        return this.currentConfig;
    }
}

// Export a singleton instance for easy access
export const ResponsiveSystem = UnifiedResponsiveSystem.getInstance()