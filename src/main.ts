// src/main.ts

/**
 * Main entry point for Ascend Avoid - Multiplayer Game
 * Handles initialization, responsive behavior, and device optimization
 */

import './styles/index.css'

// Core game imports
import Game from './core/Game'
import { ResponsiveCanvas } from './utils/responsiveCanvas'
import { DeviceInfo } from './types'

// Utility imports
import { setupPolyfills } from './utils/polyfills'
import { setupPerformanceMonitoring } from './utils/performance'
import { initMobileViewportFix, applyChromeMobileFixes } from './utils/mobileViewportFix'

// Global game instance
let gameInstance: Game | null = null
let responsiveCanvas: ResponsiveCanvas | null = null

/**
 * Device detection and classification helper
 */
class DeviceDetector {
  static getInfo(): DeviceInfo {
    return {
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1200,
      isDesktop: window.innerWidth >= 1200,
      isLandscape: window.innerWidth > window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    }
  }

  static applyOptimizations(deviceInfo: DeviceInfo): void {
    const body = document.body
    
    // Clear existing device classes
    body.classList.remove('desktop-layout', 'tablet-layout', 'mobile-layout', 
                         'touch-device', 'landscape', 'portrait')
    
    // Add appropriate device classes
    if (deviceInfo.isDesktop) body.classList.add('desktop-layout')
    else if (deviceInfo.isTablet) body.classList.add('tablet-layout')
    else if (deviceInfo.isMobile) body.classList.add('mobile-layout')
    
    if (deviceInfo.isTouchDevice) body.classList.add('touch-device')
    body.classList.add(deviceInfo.isLandscape ? 'landscape' : 'portrait')
    
    // Set CSS custom properties for responsive design
    const root = document.documentElement
    root.style.setProperty('--device-width', `${deviceInfo.screenWidth}px`)
    root.style.setProperty('--device-height', `${deviceInfo.screenHeight}px`)
    root.style.setProperty('--device-ratio', deviceInfo.devicePixelRatio.toString())
  }
}

/**
 * Error handling and user feedback system
 */
class ErrorHandler {
  private static showError(message: string, duration: number = 5000): void {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'game-error-notification'
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
      animation: slideIn 0.3s ease-out;
    `
    errorDiv.textContent = message
    document.body.appendChild(errorDiv)

    // Auto-remove after duration
    setTimeout(() => errorDiv.remove(), duration)
  }

  static setupGlobalHandlers(): void {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      this.showError('An unexpected error occurred. Please refresh the page.')
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // More specific error messages for common multiplayer issues
      const reason = event.reason?.toString() || ''
      if (reason.includes('WebSocket') || reason.includes('connection')) {
        this.showError('Unable to connect to game server. Please check your connection.')
      } else {
        this.showError('Connection error. Please check your network and refresh.')
      }
    })
  }
}

/**
 * Debug statistics display for development
 */
class DebugStats {
  private static updateInterval: number | null = null
  
  static initialize(): void {
    const debugElement = document.getElementById('debug-stats')
    if (!debugElement) return
    
    const isDevelopment = process.env.NODE_ENV === 'development'
    const hasDebugFlag = new URLSearchParams(window.location.search).has('debug')
    
    if (isDevelopment || hasDebugFlag) {
      debugElement.style.display = 'block'
      this.startUpdating()
    }
  }
  
  static startUpdating(): void {
    const elements = {
      fps: document.getElementById('fps-counter'),
      frameTime: document.getElementById('frame-time'),
      canvasSize: document.getElementById('canvas-size'),
      deviceInfo: document.getElementById('device-info'),
      playerCount: document.getElementById('player-count'), // Add multiplayer-specific stat
      connectionStatus: document.getElementById('connection-status') // Add connection status
    }
    
    if (!elements.fps || !elements.frameTime) return
    
    let frameCount = 0
    let lastFpsUpdate = performance.now()
    let lastFrameTime = performance.now()
    
    const update = () => {
      const now = performance.now()
      const delta = now - lastFrameTime
      lastFrameTime = now
      frameCount++
      
      // Update FPS every second
      if (now - lastFpsUpdate >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate))
        elements.fps!.textContent = `FPS: ${fps}`
        frameCount = 0
        lastFpsUpdate = now
        
        // Update multiplayer stats once per second
        if (gameInstance) {
          // Player count
          if (elements.playerCount) {
            const count = (gameInstance as any).multiplayerMode?.getPlayerCount() || 0
            elements.playerCount.textContent = `Players: ${count}`
          }
          
          // Connection status
          if (elements.connectionStatus) {
            const isConnected = (gameInstance as any).multiplayerMode?.isConnected() || false
            elements.connectionStatus.textContent = `Server: ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}`
          }
        }
      }
      
      // Update frame time
      elements.frameTime!.textContent = `Frame: ${delta.toFixed(1)}ms`
      
      // Update canvas size
      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
      if (canvas && elements.canvasSize) {
        elements.canvasSize.textContent = `Canvas: ${canvas.width}x${canvas.height}`
      }
      
      // Update device info
      if (elements.deviceInfo) {
        const device = DeviceDetector.getInfo()
        const type = device.isDesktop ? 'Desktop' : device.isTablet ? 'Tablet' : 'Mobile'
        elements.deviceInfo.textContent = `Device: ${type} (${device.screenWidth}x${device.screenHeight})`
      }
      
      this.updateInterval = requestAnimationFrame(update)
    }
    
    this.updateInterval = requestAnimationFrame(update)
  }
  
  static stop(): void {
    if (this.updateInterval !== null) {
      cancelAnimationFrame(this.updateInterval)
      this.updateInterval = null
    }
  }
}

/**
 * Main application controller for the multiplayer game
 */
class GameApplication {
  private initialized = false
  private canvas: HTMLCanvasElement | null = null
  private loadingScreen: HTMLElement | null = null
  private connectionRetries = 0
  private readonly maxRetries = 3

  constructor() {
    this.setupEnvironment()
  }

  /**
   * Set up the game environment and prerequisites
   */
  private setupEnvironment(): void {
    // Mobile-specific fixes
    initMobileViewportFix()
    applyChromeMobileFixes()
    
    // Error handling
    ErrorHandler.setupGlobalHandlers()
    
    // Performance monitoring (development only)
    if (process.env.NODE_ENV === 'development') {
      setupPerformanceMonitoring()
    }
    
    // Browser compatibility
    setupPolyfills()
  }

  /**
   * Initialize the canvas and responsive system
   */
  private async initializeCanvas(): Promise<void> {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    
    if (!this.canvas) {
      throw new Error('Game canvas element not found')
    }

    // Remove any hardcoded dimensions
    this.canvas.removeAttribute('width')
    this.canvas.removeAttribute('height')

    // Create responsive canvas manager
    responsiveCanvas = new ResponsiveCanvas(this.canvas, {
      maintainAspectRatio: false, // Full screen for better mobile experience
      minWidth: 320,
      minHeight: 240,
      maxWidth: 2560,
      maxHeight: 1440,
      devicePixelRatio: true
    })

    // Handle resize events
    responsiveCanvas.onResize((widthScale: number, heightScale: number, deviceInfo: DeviceInfo) => {
      console.log(`Canvas resized: ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`)
      DeviceDetector.applyOptimizations(deviceInfo)
      
      // Notify game of resize if it has a handler
      if (gameInstance && typeof (gameInstance as any).onResize === 'function') {
        (gameInstance as any).onResize()
      }
    })
  }

  /**
   * Initialize the multiplayer game with retry logic
   */
  private async initializeGame(): Promise<void> {
    try {
      // Create game instance
      gameInstance = new Game()
      
      // The Game constructor handles its own initialization now
      console.log('Multiplayer game instance created')
      
      // Reset retry counter on success
      this.connectionRetries = 0
      
    } catch (error) {
      console.error('Failed to initialize game:', error)
      
      // Retry logic for connection failures
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++
        console.log(`Retrying connection... (${this.connectionRetries}/${this.maxRetries})`)
        
        // Update loading screen message
        const loadingMessage = this.loadingScreen?.querySelector('.loading-message')
        if (loadingMessage) {
          loadingMessage.textContent = `Reconnecting... (${this.connectionRetries}/${this.maxRetries})`
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, this.connectionRetries)))
        
        // Retry
        return this.initializeGame()
      }
      
      throw error
    }
  }

  /**
   * Set up the global game API for external control
   */
  private setupGlobalAPI(): void {
    // Simplified API for multiplayer-only game
    window.game = {
      // Pause/resume functionality
      pause: () => {
        if (gameInstance && typeof (gameInstance as any).pause === 'function') {
          (gameInstance as any).pause()
        }
      },
      
      resume: () => {
        if (gameInstance && typeof (gameInstance as any).resume === 'function') {
          (gameInstance as any).resume()
        }
      },
      
      // Get performance statistics
      getStats: () => {
        if (gameInstance && (gameInstance as any).performanceStats) {
          return (gameInstance as any).performanceStats
        }
        return null
      },
      
      // Get current game state
      getState: () => {
        if (gameInstance) {
          return {
            gameState: (gameInstance as any).gameState,
            isConnected: (gameInstance as any).multiplayerMode?.isConnected() || false,
            playerCount: (gameInstance as any).multiplayerMode?.getPlayerCount() || 0
          }
        }
        return null
      },
      
      // Reconnect to server
      reconnect: async () => {
        if (gameInstance && (gameInstance as any).multiplayerMode) {
          try {
            await (gameInstance as any).multiplayerMode.reconnect()
            return true
          } catch (error) {
            console.error('Reconnection failed:', error)
            return false
          }
        }
        return false
      }
    }
  }

  /**
   * Hide the loading screen with animation
   */
  private hideLoadingScreen(): void {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('fade-out')
      setTimeout(() => {
        this.loadingScreen?.remove()
        this.loadingScreen = null
      }, 500)
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
      console.log('🎮 Initializing Ascend Avoid Multiplayer...')
      
      // Get loading screen element
      this.loadingScreen = document.getElementById('loader')
      
      // Device detection and optimization
      const deviceInfo = DeviceDetector.getInfo()
      DeviceDetector.applyOptimizations(deviceInfo)
      console.log(`📱 Device: ${deviceInfo.isDesktop ? 'Desktop' : deviceInfo.isTablet ? 'Tablet' : 'Mobile'}`)
      console.log(`🖱️ Touch support: ${deviceInfo.isTouchDevice ? 'Yes' : 'No'}`)
      console.log(`📐 Resolution: ${deviceInfo.screenWidth}x${deviceInfo.screenHeight} (${deviceInfo.devicePixelRatio}x DPR)`)
      
      // Initialize canvas system
      await this.initializeCanvas()
      
      // Initialize debug stats
      DebugStats.initialize()
      
      // Set up global API
      this.setupGlobalAPI()
      
      // Allow canvas to stabilize
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Initialize the game (with retry logic)
      await this.initializeGame()
      
      // Hide loading screen
      this.hideLoadingScreen()
      
      this.initialized = true
      console.log('✅ Game initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize game:', error)
      
      // Show appropriate error message
      if ((error as any)?.message?.includes('multiplayer')) {
        ErrorHandler.showError('Unable to connect to game server. Please check your connection and refresh.')
      } else {
        ErrorHandler.showError('Failed to start game. Please refresh and try again.')
      }
      
      // Hide loading screen even on error
      this.hideLoadingScreen()
      
      throw error
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    DebugStats.stop()
    
    if (responsiveCanvas) {
      responsiveCanvas.destroy()
      responsiveCanvas = null
    }
    
    if (gameInstance && typeof (gameInstance as any).dispose === 'function') {
      (gameInstance as any).dispose()
      gameInstance = null
    }
    
    this.initialized = false
  }
}

// Create and initialize application
const app = new GameApplication()

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.initialize().catch(console.error)
  })
} else {
  app.initialize().catch(console.error)
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => app.cleanup())

// Handle page visibility changes (mobile optimization)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.game?.pause()
  } else {
    window.game?.resume()
  }
})

// Handle online/offline events for multiplayer
window.addEventListener('online', () => {
  console.log('🌐 Connection restored')
  // Attempt to reconnect if we were disconnected
  window.game?.reconnect()
})

window.addEventListener('offline', () => {
  console.log('📵 Connection lost')
  ErrorHandler.showError('Connection lost. The game will reconnect when your connection is restored.')
})

// Development exports
if (process.env.NODE_ENV === 'development') {
  (window as any).gameApp = app
  (window as any).getGameInstance = () => gameInstance
  (window as any).getResponsiveCanvas = () => responsiveCanvas
}