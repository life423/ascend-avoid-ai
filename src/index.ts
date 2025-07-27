/**
 * Main application entry point.
 * Handles initialization, polyfills and responsive behavior.
 */

// Import styles
import './styles/touch-controls.css'

// Import core game components
import Game from './core/Game'
import { ResponsiveSystem } from './systems/UnifiedResponsiveSystem'
import { DrawerUI } from './ui/DrawerUI'

// Helper function for device detection
function detectDevice() {
    return {
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1200,
        isDesktop: window.innerWidth >= 1200,
        isLandscape: window.innerWidth > window.innerHeight,
    }
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Ascend Avoid game...')

    // Show initial loading indicator if it exists
    const loader = document.querySelector('.loader')

    // Detect device capabilities for initial setup
    const deviceInfo = detectDevice()
    console.log(
        `Device detected: ${
            deviceInfo.isDesktop
                ? 'Desktop'
                : deviceInfo.isTablet
                ? 'Tablet'
                : 'Mobile'
        }`
    )
    console.log(`Touch support: ${deviceInfo.isTouchDevice ? 'Yes' : 'No'}`)

    // Apply any device-specific initial body classes
    const body = document.body
    if (deviceInfo.isDesktop) {
        body.classList.add('desktop-layout')
    }

    // Canvas management is now handled by ResponsiveManager in Game.ts

    // Initialize drawer UI (always present)
    const drawerUI = new DrawerUI()

    // Initialize the game
    const game = new Game()

    // Store references for debugging and future use
    ;(window as any).game = game
    ;(window as any).drawerUI = drawerUI

    // Make initializeMultiplayer available globally for drawer
    ;(window as any).initializeMultiplayer = initializeMultiplayer

    // Remove loading indicator after initialization
    if (loader) {
        setTimeout(() => {
            ;(loader as HTMLElement).style.opacity = '0'
            setTimeout(() => loader.remove(), 300)
        }, 300)
    }

    console.log('Game initialized successfully')
})


/**
 * Initializes multiplayer functionality on demand using the Game mode system
 * Delegates to Game.switchGameMode for proper mode initialization
 */
function initializeMultiplayer() {
    // Get button and game reference
    const mpButton = document.querySelector(
        '.multiplayer-button'
    ) as HTMLButtonElement
    const game = (window as any).game

    // Ensure game instance exists
    if (!game) {
        console.error('Game instance not found. Cannot initialize multiplayer.')
        alert('Error: Game not initialized properly.')
        return
    }

    // Show a loading state on button
    const originalText = mpButton.textContent
    mpButton.textContent = 'Loading...'
    mpButton.style.opacity = '0.7'
    mpButton.disabled = true

    // Check if we're already in multiplayer mode
    if (game.isMultiplayerMode) {
        // We're already in multiplayer mode, just show UI
        import('./ui/MultiplayerUI').then(MultiplayerUIModule => {
            const MultiplayerUI = MultiplayerUIModule.default

            // Create UI if it doesn't exist
            if (!(window as any).multiplayerUI) {
                ;(window as any).multiplayerUI = new MultiplayerUI(
                    game.currentGameMode?.multiplayerManager || null
                )
            }

            // Show UI
            ;(window as any).multiplayerUI.toggle()

            // Reset button
            mpButton.textContent = originalText || 'Multiplayer'
            mpButton.style.opacity = '1'
            mpButton.disabled = false
        })

        return
    }

    // Switch to multiplayer mode
    game.switchGameMode('multiplayer')
        .then(() => {
            console.log('Switched to multiplayer mode successfully')

            // Reset button state
            mpButton.textContent = originalText || 'Multiplayer'
            mpButton.style.opacity = '1'
            mpButton.disabled = false

            // Load and show UI
            return import('./ui/MultiplayerUI')
        })
        .then((MultiplayerUIModule: any) => {
            const MultiplayerUI = MultiplayerUIModule.default

            // Create UI
            ;(window as any).multiplayerUI = new MultiplayerUI(
                game.currentGameMode?.multiplayerManager || null
            )

            // Show UI
            ;(window as any).multiplayerUI.toggle()

            console.log('Multiplayer UI initialized')
        })
        .catch((err: any) => {
            // Reset button state
            mpButton.textContent = originalText || 'Multiplayer'
            mpButton.style.opacity = '1'
            mpButton.disabled = false

            // Show error
            console.error('Failed to initialize multiplayer:', err)
            alert(
                'Could not initialize multiplayer. Please check your connection and try again.'
            )
        })
    
    // Enable ResponsiveSystem for development testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
        // Make it available in the console for testing
        (window as any).ResponsiveSystem = ResponsiveSystem;
    }
    
    // ✨ Initialize modern UI system (gradual migration)
    initializeModernUISystem();
}

async function initializeModernUISystem() {
    try {
        const { initializeModernUI } = await import('./ui/modernUI');
        initializeModernUI();
        console.log('✨ Modern UI system initialized');
    } catch (error) {
        console.warn('Modern UI system failed to initialize (non-breaking):', error);
    }
}