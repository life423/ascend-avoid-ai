// src/main.ts

/**
 * Main entry point for Ascend Avoid - Multiplayer Game
 */

import './styles/index.css'
import Game from './core/Game'
import { FluidResponsiveSystem, createFluidCanvas } from './systems/FluidResponsiveSystem'
import { DeviceInfo } from './types'
import { setupPolyfills } from './utils/polyfills'
import { setupPerformanceMonitoring } from './utils/performance'
import { DrawerUI } from './ui/DrawerUI'

// Global game instance
let gameInstance: Game | null = null
let fluidResponsive: FluidResponsiveSystem | null = null
let drawerUI: DrawerUI | null = null

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
    
    body.classList.remove('desktop-layout', 'tablet-layout', 'mobile-layout', 
                         'touch-device', 'landscape', 'portrait')
    
    if (deviceInfo.isDesktop) body.classList.add('desktop-layout')
    else if (deviceInfo.isTablet) body.classList.add('tablet-layout')
    else if (deviceInfo.isMobile) body.classList.add('mobile-layout')
    
    if (deviceInfo.isTouchDevice) body.classList.add('touch-device')
    body.classList.add(deviceInfo.isLandscape ? 'landscape' : 'portrait')
    
    const root = document.documentElement
    root.style.setProperty('--device-width', `${deviceInfo.screenWidth}px`)
    root.style.setProperty('--device-height', `${deviceInfo.screenHeight}px`)
    root.style.setProperty('--device-ratio', deviceInfo.devicePixelRatio.toString())
  }
}

class ErrorHandler {
  static showError(message: string, duration: number = 5000): void {
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
    `
    errorDiv.textContent = message
    document.body.appendChild(errorDiv)

    setTimeout(() => errorDiv.remove(), duration)
  }

  static setupGlobalHandlers(): void {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      this.showError('An unexpected error occurred. Please refresh the page.')
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      const reason = event.reason?.toString() || ''
      if (reason.includes('WebSocket') || reason.includes('connection')) {
        this.showError('Unable to connect to game server. Please check your connection.')
      } else {
        this.showError('Connection error. Please check your network and refresh.')
      }
    })
  }
}

class GameApplication {
  private initialized = false
  private canvas: HTMLCanvasElement | null = null
  private loadingScreen: HTMLElement | null = null

  constructor() {
    this.setupEnvironment()
  }

  private setupEnvironment(): void {
    // FluidResponsiveSystem handles all mobile viewport fixes
    ErrorHandler.setupGlobalHandlers()
    
    if (process.env.NODE_ENV === 'development') {
      setupPerformanceMonitoring()
    }
    
    setupPolyfills()
  }

  private async initializeCanvas(): Promise<void> {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    
    if (!this.canvas) {
      throw new Error('Game canvas element not found')
    }

    this.canvas.removeAttribute('width')
    this.canvas.removeAttribute('height')

    fluidResponsive = createFluidCanvas(this.canvas, {
      designWidth: 600,
      designHeight: 700,
      maintainAspectRatio: true,
      pixelPerfect: true,
      minScale: 0.15,
      maxScale: 5.0
    })

    fluidResponsive.subscribe((scaling) => {
      console.log(`Canvas fluid resize: ${scaling.canvasWidth}x${scaling.canvasHeight} (scale: ${scaling.scale.toFixed(2)})`)
      
      // Update device info for compatibility
      const deviceInfo: DeviceInfo = {
        screenWidth: scaling.viewport.width,
        screenHeight: scaling.viewport.height,
        isTouchDevice: scaling.viewport.isTouch,
        isMobile: scaling.viewport.screenType === 'phone',
        isTablet: scaling.viewport.screenType === 'tablet',
        isDesktop: scaling.viewport.screenType === 'desktop',
        isLandscape: scaling.viewport.orientation === 'landscape',
        devicePixelRatio: scaling.viewport.devicePixelRatio
      }
      
      DeviceDetector.applyOptimizations(deviceInfo)
      
      if (gameInstance && typeof (gameInstance as any).onResize === 'function') {
        (gameInstance as any).onResize()
      }
    })
  }

  private async initializeGame(): Promise<void> {
    try {
      gameInstance = new Game()
      console.log('Multiplayer game instance created')
      
      // Initialize DrawerUI for mobile menu
      drawerUI = new DrawerUI()
      console.log('🍔 Mobile drawer menu initialized')
      
    } catch (error) {
      console.error('Failed to initialize game:', error)
      throw error
    }
  }

  private setupGlobalAPI(): void {
    window.game = {
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
      
      getStats: () => {
        if (gameInstance && (gameInstance as any).performanceStats) {
          return (gameInstance as any).performanceStats
        }
        return null
      },
      
      getState: () => {
        if (gameInstance) {
          return {
            gameState: (gameInstance as any).gameState || 'unknown',
            isConnected: (gameInstance as any).multiplayerMode?.isConnected() || false,
            playerCount: (gameInstance as any).multiplayerMode?.getPlayerCount() || 0
          }
        }
        return {
          gameState: 'not_initialized',
          isConnected: false,
          playerCount: 0
        }
      },
      
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

  private hideLoadingScreen(): void {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('fade-out')
      setTimeout(() => {
        this.loadingScreen?.remove()
        this.loadingScreen = null
      }, 500)
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Game already initialized')
      return
    }

    try {
      console.log('🎮 Initializing Ascend Avoid Multiplayer...')
      
      this.loadingScreen = document.getElementById('loader')
      
      const deviceInfo = DeviceDetector.getInfo()
      DeviceDetector.applyOptimizations(deviceInfo)
      console.log(`📱 Device: ${deviceInfo.isDesktop ? 'Desktop' : deviceInfo.isTablet ? 'Tablet' : 'Mobile'}`)
      
      await this.initializeCanvas()
      this.setupGlobalAPI()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await this.initializeGame()
      
      this.hideLoadingScreen()
      
      this.initialized = true
      console.log('✅ Game initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize game:', error)
      
      if ((error as any)?.message?.includes('multiplayer')) {
        ErrorHandler.showError('Unable to connect to game server. Please check your connection and refresh.')
      } else {
        ErrorHandler.showError('Failed to start game. Please refresh and try again.')
      }
      
      this.hideLoadingScreen()
      throw error
    }
  }

  public cleanup(): void {
    if (fluidResponsive) {
      fluidResponsive.dispose()
      fluidResponsive = null
    }
    
    if (drawerUI) {
      drawerUI.destroy()
      drawerUI = null
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

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.game?.pause()
  } else {
    window.game?.resume()
  }
})

// Handle online/offline events
window.addEventListener('online', () => {
  console.log('🌐 Connection restored')
  window.game?.reconnect()
})

window.addEventListener('offline', () => {
  console.log('📵 Connection lost')
  ErrorHandler.showError('Connection lost. The game will reconnect when your connection is restored.')
})

// Development exports
if (process.env.NODE_ENV === 'development') {
  ;(window as any).gameApp = app
  ;(window as any).getGameInstance = () => gameInstance
  ;(window as any).getFluidResponsive = () => fluidResponsive
}