/**
 * Main application entry point.
 * Handles initialization, polyfills and responsive behavior.
 */

// Import core game components
import Game from './core/Game'
// import { ResponsiveSystem } from './systems/UnifiedResponsiveSystem'

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

    // Create multiplayer button with proper styling
    createMultiplayerButton()

    // Initialize the game
    const game = new Game()

    // Store references for debugging and future use
    ;(window as any).game = game

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
 * Creates styled multiplayer button with proper responsive behavior
 */
function createMultiplayerButton() {
    // Create multiplayer button container
    const mpButtonContainer = document.createElement('div')
    mpButtonContainer.className = 'mp-button-container'
    mpButtonContainer.style.position = 'fixed'
    mpButtonContainer.style.top = '10px'
    mpButtonContainer.style.right = '10px'
    mpButtonContainer.style.zIndex = '100'

    // Create the button element
    const mpButton = document.createElement('button')
    mpButton.textContent = 'Multiplayer'
    mpButton.className = 'multiplayer-button'
    mpButton.style.background = '#0CC7C7'
    mpButton.style.color = 'black'
    mpButton.style.border = 'none'
    mpButton.style.padding = '10px 15px'
    mpButton.style.borderRadius = '4px'
    mpButton.style.fontWeight = 'bold'
    mpButton.style.cursor = 'pointer'
    mpButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)'
    mpButton.style.transition = 'all 0.2s ease'

    // Add button hover effects
    mpButton.addEventListener('mouseenter', () => {
        mpButton.style.transform = 'scale(1.05)'
        mpButton.style.boxShadow = '0 0 15px rgba(12, 199, 199, 0.5)'
    })

    mpButton.addEventListener('mouseleave', () => {
        mpButton.style.transform = 'scale(1)'
        mpButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)'
    })

    // Make button responsive on smaller screens
    const mediaQuery = window.matchMedia('(max-width: 600px)')
    function updateButtonSize(mq: MediaQueryListEvent | MediaQueryList) {
        if (mq.matches) {
            // Smaller button on mobile
            mpButton.style.padding = '8px 12px'
            mpButton.style.fontSize = '0.9rem'
        } else {
            // Regular size on desktop
            mpButton.style.padding = '10px 15px'
            mpButton.style.fontSize = '1rem'
        }
    }

    // Initialize button size based on screen
    updateButtonSize(mediaQuery)

    // Update button when screen size changes
    mediaQuery.addEventListener('change', updateButtonSize)

    // Add click handler to initialize multiplayer
    mpButton.addEventListener('click', initializeMultiplayer)

    // Add button to container and container to document
    mpButtonContainer.appendChild(mpButton)
    document.body.appendChild(mpButtonContainer)
}

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
    // Create a test function that runs only in development
    // function testResponsiveSystem() {
    //     // Subscribe to configuration changes
    //     const unsubscribe = ResponsiveSystem.subscribe((config, viewport) => {
    //         console.log('🎯 Responsive Update:', {
    //             configuration: config.name,
    //             viewport: {
    //                 size: `${viewport.width}x${viewport.height}`,
    //                 type: viewport.screenType,
    //                 orientation: viewport.orientation,
    //             },
    //             canvas: config.canvasStrategy,
    //             controls: config.controlLayout,
    //             performance: config.performanceProfile,
    //         })
    //     })

    //     // Make it available in the console for testing
    //     ;(window as any).ResponsiveSystem = ResponsiveSystem
    //     ;(window as any).unsubscribeResponsive = unsubscribe
    //     ;(window as any).testResponsive = () => {
    //         console.log(
    //             'Current configuration:',
    //             ResponsiveSystem.getCurrentConfig()
    //         )
    //         console.log('Viewport info:', ResponsiveSystem.getViewportInfo())
    //     }

    //     console.log(
    //         '✅ ResponsiveSystem ready! Try resizing your window or use testResponsive() in console'
    //     )
    // }

    // // Only run in development
    // const isDevelopment = process.env.NODE_ENV !== 'production';
    // if (isDevelopment) {
    //     testResponsiveSystem()
    // }
}
