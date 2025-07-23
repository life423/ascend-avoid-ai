/**
 * On-screen touch controls for mobile devices using DOM elements instead of canvas
 * Converted to TypeScript and organized in ui/ directory.
 */
import Game from '../core/Game'
import Player from '../entities/Player'
import { SCALE_FACTOR } from '../utils/utils'

// Interface for control button definition
interface ControlButton {
    key: string
    symbol: string
    label?: string
    action?: string
}

// Interface for button element references
interface ButtonElements {
    up: HTMLElement
    down: HTMLElement
    left: HTMLElement
    right: HTMLElement
    restart: HTMLElement
    boost?: HTMLElement
    missile?: HTMLElement
    shield?: HTMLElement
    [key: string]: HTMLElement | undefined
}

export default class TouchControls {
    private game: Game
    private player: Player
    private currentScale: number

    // Control button properties with symbols
    private buttons: Record<string, ControlButton>

    // Active button state - maps button keys to touch IDs
    private activeButtons: Record<string, number> // DOM elements
    private container: HTMLElement | null = null
    private directionControls: HTMLElement
    buttonElements: ButtonElements

    // Device detection
    private isTouchDevice: boolean

    /**
     * Creates a new TouchControls instance
     * @param game - The main game instance
     */
    constructor(game: Game) {
        this.game = game
        this.player = game.player

        // Save current scale for comparison on resize
        this.currentScale = SCALE_FACTOR

        // Control button properties with symbols
        this.buttons = {
            up: { key: 'up', symbol: '▲' },
            down: { key: 'down', symbol: '▼' },
            left: { key: 'left', symbol: '◀' },
            right: { key: 'right', symbol: '▶' },
            restart: { key: 'restart', symbol: '⟳' },
            boost: {
                key: 'boost',
                symbol: '⚡',
                label: 'BOOST',
                action: 'boost',
            },
            missile: {
                key: 'missile',
                symbol: '🚀',
                label: 'FIRE',
                action: 'missile',
            },
            shield: {
                key: 'shield',
                symbol: '🛡️',
                label: 'SHIELD',
                action: 'shield',
            },
        }

        // Active button state
        this.activeButtons = {}

        // Check if we're on a touch device (improved detection focusing on input method not screen size)
        this.isTouchDevice =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches

        // Initialize DOM element references (will be set in createControlElements)        this.container = null!
        this.directionControls = null!
        this.buttonElements = null!

        // Always create controls, but hide them on non-touch devices
        this.createControlElements()
        this.setupTouchListeners()

        // Hide controls on desktop/mouse-based devices or when desktop layout is forced
        if (
            !this.isTouchDevice ||
            document.body.classList.contains('desktop-layout')
        ) {
            this.hide()
        }

        // Handle window resize to show/hide controls dynamically
        window.addEventListener('resize', this.handleResize.bind(this))
    }

    /**
     * Handle window resize and adjust controls for the screen size
     */
    handleResize(): void {
        // Always show touch controls on small screens regardless of touch support
        // This ensures they're available on all mobile devices
        const isSmallScreen = window.innerWidth < 1200 // 1200px matches CSS breakpoint

        // Also check for desktop layout class or large-screen class
        const isLargeDisplay =
            document.body.classList.contains('desktop-layout') ||
            document.body.classList.contains('large-screen')

        // Show controls if it's a small screen AND NOT on a large display
        if (isSmallScreen && !isLargeDisplay) {
            console.log('Showing touch controls on small screen')
            this.show()
            this.resize() // Adjust sizes based on new dimensions
        } else {
            console.log('Hiding touch controls on large screen')
            this.hide()
        }
    }

    /**
     * Create DOM elements for touch controls in GameBoy style layout
     * D-pad on left, two action buttons on right
     */
    private createControlElements(): void {
        // Get the container for controls using the new selector system
        const containerElement = document.querySelector(
            '.touch-controller[data-controller="main"]'
        )
        if (!containerElement) {
            console.log('Touch controls container not found, creating one')
            // Create the container if it doesn't exist
            this.container = document.createElement('div')
            this.container.className = 'touch-controller'
            this.container.setAttribute('data-controller', 'main')
            this.container.style.position = 'fixed' // Changed to fixed positioning
            this.container.style.bottom = '0'
            this.container.style.left = '0'
            this.container.style.right = '0'
            this.container.style.width = '100%'
            this.container.style.display = 'flex'
            this.container.style.justifyContent = 'space-between'
            this.container.style.alignItems = 'center'
            this.container.style.padding = '10px 10px 30px 10px' // Extra padding at bottom
            this.container.style.zIndex = '1000'
            this.container.style.pointerEvents = 'none' // Parent container doesn't intercept clicks
            this.container.style.background =
                'linear-gradient(to top, rgba(10, 25, 47, 0.8), transparent)' // Gradient background

            document.body.appendChild(this.container)
        } else {
            this.container = containerElement as HTMLElement
        }

        // Create left side controls (D-pad)
        const leftControls = document.createElement('div')
        leftControls.className = 'left-controls'
        leftControls.style.display = 'flex'
        leftControls.style.justifyContent = 'center' // Center in its area
        leftControls.style.alignItems = 'center'
        leftControls.style.flex = '1'
        leftControls.style.pointerEvents = 'auto' // Enable pointer events for controls

        // Create d-pad container with grid layout (GameBoy style)
        this.directionControls = document.createElement('div')
        this.directionControls.className = 'dpad-controls'
        this.directionControls.style.display = 'grid'
        this.directionControls.style.gridTemplateAreas =
            '". up ." "left . right" ". down ."'
        this.directionControls.style.gap = '5px'

        // Create directional buttons
        for (const direction of ['up', 'down', 'left', 'right']) {
            const button = document.createElement('div')
            button.className = 'control-button dpad-button'
            button.dataset.key = direction
            button.dataset.direction = direction
            button.textContent = this.buttons[direction].symbol

            // Style the button
            this.styleButton(button)

            // Position in grid based on direction
            button.style.gridArea = direction

            this.directionControls.appendChild(button)
        }

        leftControls.appendChild(this.directionControls)

        // Create right side controls (action buttons in GameBoy layout)
        const rightControls = document.createElement('div')
        rightControls.className = 'right-controls'
        rightControls.style.display = 'flex'
        rightControls.style.justifyContent = 'center' // Center in its area
        rightControls.style.alignItems = 'center'
        rightControls.style.flex = '1'
        rightControls.style.pointerEvents = 'auto' // Enable pointer events for controls

        // Create action buttons container
        const actionButtons = document.createElement('div')
        actionButtons.className = 'action-buttons'
        actionButtons.style.display = 'flex'
        actionButtons.style.gap = '15px'

        // Create two action buttons: boost and missile (GameBoy A and B style)
        for (const action of ['boost', 'missile']) {
            const button = document.createElement('div')
            button.className = 'control-button action-button'
            button.dataset.action = action

            // Button content with icon and label
            const buttonIcon = document.createElement('span')
            buttonIcon.textContent = this.buttons[action].symbol

            const buttonLabel = document.createElement('span')
            buttonLabel.className = 'button-label'
            buttonLabel.textContent = action === 'boost' ? 'B' : 'A' // GameBoy style labels
            buttonLabel.style.fontSize = '14px'
            buttonLabel.style.fontWeight = 'bold'
            buttonLabel.style.marginTop = '2px'

            button.appendChild(buttonIcon)
            button.appendChild(buttonLabel)

            // Style the button
            this.styleButton(button)
            button.style.display = 'flex'
            button.style.flexDirection = 'column'
            button.style.alignItems = 'center'

            actionButtons.appendChild(button)
        }

        // Add action buttons to right controls
        rightControls.appendChild(actionButtons) // No restart button anymore
        // Empty placeholder - no restart control needed

        // Assemble the layout
        this.container.appendChild(leftControls)
        this.container.appendChild(rightControls)

        // Store references to all buttons for easy access
        this.buttonElements = {
            up: this.directionControls.querySelector(
                '[data-direction="up"]'
            ) as HTMLElement,
            down: this.directionControls.querySelector(
                '[data-direction="down"]'
            ) as HTMLElement,
            left: this.directionControls.querySelector(
                '[data-direction="left"]'
            ) as HTMLElement,
            right: this.directionControls.querySelector(
                '[data-direction="right"]'
            ) as HTMLElement,
            boost: actionButtons.querySelector(
                '[data-action="boost"]'
            ) as HTMLElement,
            missile: actionButtons.querySelector(
                '[data-action="missile"]'
            ) as HTMLElement,
            restart: null as unknown as HTMLElement, // No restart button but keep the property
            shield: null as unknown as HTMLElement,
        }
    }

    /**
     * Helper method for consistent button styling
     */
    private styleButton(button: HTMLElement): void {
        button.style.width = '65px'
        button.style.height = '65px'
        button.style.backgroundColor = 'rgba(0, 188, 212, 0.3)'
        button.style.border = '3px solid var(--accent-primary, #00bcd4)'
        button.style.borderRadius = '50%'
        button.style.display = 'flex'
        button.style.justifyContent = 'center'
        button.style.alignItems = 'center'
        button.style.fontSize = '24px'
        button.style.color = 'white'
        button.style.userSelect = 'none'
        button.style.touchAction = 'none'
        button.style.boxShadow = '0 3px 5px rgba(0,0,0,0.3)'
    }

    /**
     * Set up touch event listeners for all control buttons
     */
    private setupTouchListeners(): void {
        // For each button, add event listeners - check that button exists first
        Object.keys(this.buttonElements).forEach(key => {
            const button = this.buttonElements[key]

            // Skip if button doesn't exist (like removed shield button)
            if (!button) {
                console.log(
                    `Skipping event listeners for missing button: ${key}`
                )
                return
            }

            // Touch start - activate button
            button.addEventListener(
                'touchstart',
                (e: TouchEvent) => {
                    e.preventDefault()
                    this.handleButtonActivation(
                        key,
                        true,
                        e.changedTouches[0].identifier
                    )
                },
                { passive: false }
            )

            // Touch end - deactivate button
            button.addEventListener(
                'touchend',
                (e: TouchEvent) => {
                    e.preventDefault()
                    this.handleButtonActivation(
                        key,
                        false,
                        e.changedTouches[0].identifier
                    )
                },
                { passive: false }
            )

            // Touch cancel - deactivate button
            button.addEventListener(
                'touchcancel',
                (e: TouchEvent) => {
                    e.preventDefault()
                    this.handleButtonActivation(
                        key,
                        false,
                        e.changedTouches[0].identifier
                    )
                },
                { passive: false }
            )

            // Touch move - deactivate button if touch moves out (replaces non-standard touchleave)
            button.addEventListener(
                'touchmove',
                (e: TouchEvent) => {
                    e.preventDefault()
                    // Check if touch has moved outside of button
                    const touch = e.changedTouches[0]
                    const buttonRect = button.getBoundingClientRect()
                    if (
                        touch.clientX < buttonRect.left ||
                        touch.clientX > buttonRect.right ||
                        touch.clientY < buttonRect.top ||
                        touch.clientY > buttonRect.bottom
                    ) {
                        this.handleButtonActivation(
                            key,
                            false,
                            touch.identifier
                        )
                    }
                },
                { passive: false }
            )
        })
    }

    /**
     * Handle button activation state
     * @param key - The button key (up, down, left, right, restart, boost, missile)
     * @param isActive - Whether to activate or deactivate the button
     * @param touchId - Touch identifier to keep track of which touch is on which button
     */
    private handleButtonActivation(
        key: string,
        isActive: boolean,
        touchId: number
    ): void {
        const button = this.buttonElements[key]

        // Skip if button doesn't exist
        if (!button) {
            console.log(`Cannot activate non-existent button: ${key}`)
            return
        }

        if (isActive) {
            // Activate button
            button.classList.add('active')
            this.activeButtons[key] = touchId

            // Trigger action based on button
            if (key === 'restart') {
                this.game.resetGame()
            } else if (key === 'boost' || key === 'missile') {
                // GameBoy style buttons - only boost and missile
                console.log(`Action button pressed: ${key}`)
            } else {
                this.player.setMovementKey(key, true)
            }
        } else {
            // If this touch ID matches the one that activated this button
            if (this.activeButtons[key] === touchId) {
                // Deactivate button
                button.classList.remove('active')
                delete this.activeButtons[key]

                // Stop movement for movement keys
                if (key !== 'restart' && key !== 'boost' && key !== 'missile') {
                    this.player.setMovementKey(key, false)
                }
            }
        }
    }

    /**
     * Resize touch controls based on screen size
     */
    resize(): void {
        // If scale factor changed significantly, adjust button sizes
        if (Math.abs(this.currentScale - SCALE_FACTOR) > 0.05) {
            this.currentScale = SCALE_FACTOR

            // Calculate new button size based on viewport
            const buttonSize = Math.max(50, Math.min(70 * SCALE_FACTOR, 100))
            const fontSize = Math.max(18, Math.min(28 * SCALE_FACTOR, 36))
            const labelSize = Math.max(10, Math.min(14 * SCALE_FACTOR, 18)) // Get all control buttons
            if (!this.container) return
            const buttons = this.container.querySelectorAll('.control-button')

            // Update size and font for all buttons
            buttons.forEach(button => {
                ;(button as HTMLElement).style.width = `${buttonSize}px`
                ;(button as HTMLElement).style.height = `${buttonSize}px`
                ;(button as HTMLElement).style.fontSize = `${fontSize}px`

                // Update label size if present
                const label = button.querySelector('.button-label')
                if (label) {
                    ;(label as HTMLElement).style.fontSize = `${labelSize}px`
                }
            })

            // Adjust DPad grid
            this.directionControls.style.gap = `${Math.max(
                5,
                Math.min(10 * SCALE_FACTOR, 15)
            )}px`

            // Adjust spacing in container
            const containerPadding = Math.max(
                5,
                Math.min(15 * SCALE_FACTOR, 20)
            )
            if (this.container) {
                this.container.style.padding = `${containerPadding}px`

                // Adjust gap between action buttons
                const actionButtons =
                    this.container.querySelector('.action-buttons')
                if (actionButtons) {
                    ;(actionButtons as HTMLElement).style.gap = `${Math.max(
                        5,
                        Math.min(15 * SCALE_FACTOR, 20)
                    )}px`
                }
                // Adjust spacing between controls in left side
                const leftControls =
                    this.container.querySelector('.left-controls')
                if (leftControls) {
                    ;(leftControls as HTMLElement).style.gap = `${Math.max(
                        10,
                        Math.min(30 * SCALE_FACTOR, 40)
                    )}px`
                }
            }
        }
    }

    /**
     * Hide the touch controls - called when touch is not supported or not needed
     */
    hide(): void {
        if (this.container) {
            // First set display to none
            this.container.style.cssText = 'display: none !important'

            // For larger screens, completely remove from DOM instead of just hiding
            if (window.innerWidth >= 1200) {
                // Use setTimeout to avoid any potential race conditions
                setTimeout(() => {
                    if (this.container && this.container.parentNode) {
                        this.container.parentNode.removeChild(this.container)
                        console.log(
                            'Touch controls removed from DOM for larger screen'
                        )
                    }
                }, 100)
            }
        }
    }
    /**
     * Show the touch controls
     */
    show(): void {
        if (this.container) {
            // If container is in the DOM, just show it
            this.container.style.display = 'flex'
        } else {
            // If container was removed from DOM, recreate it
            console.log(
                'Touch controls container was removed, recreating for small screen'
            )
            this.createControlElements()
            this.setupTouchListeners()

            if (this.container) {
                ;(this.container as HTMLElement).style.display = 'flex'
                this.resize() // Re-apply proper sizing
            }
        }
    }

    /**
     * Draw the touch controls - empty method to match Game's expectations
     * Since we're using DOM elements, no actual canvas drawing is needed
     */
    draw(): void {
        // No canvas drawing needed - controls are DOM elements
        // This method exists to match the Game class expectations
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        // Remove window resize listener
        window.removeEventListener('resize', this.handleResize.bind(this))

        // Clean up button event listeners
        if (this.buttonElements) {
            Object.keys(this.buttonElements).forEach(key => {
                const button = this.buttonElements[key]
                if (button) {
                    button.replaceWith(button.cloneNode(true))
                }
            })
        }

        // Remove container if needed
        if (this.container && this.container.parentNode) {
            // Only remove if we created it programmatically
            if (
                this.container.className.includes('touch-controller') &&
                !document.querySelector(
                    '.touch-controller[data-controller="main"]'
                )
            ) {
                this.container.parentNode.removeChild(this.container)
            }
        }
    }
}
