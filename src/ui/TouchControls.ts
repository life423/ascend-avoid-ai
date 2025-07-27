/**
 * On-screen touch controls for mobile devices using DOM elements instead of canvas
 * Converted to TypeScript and organized in ui/ directory.
 * Updated for multiplayer-only mode.
 */
import Game from '../core/Game'
import { EventBus } from '../core/EventBus'
import { TouchControlsAdapter } from '../adapters/TouchControlsAdapter'

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
    private eventBus: EventBus
    private controlsAdapter: TouchControlsAdapter | null = null

    // Control button properties with symbols
    private buttons: Record<string, ControlButton>

    // Active button state - maps button keys to touch IDs
    private activeButtons: Record<string, number> // DOM elements
    private container: HTMLElement | null = null
    private directionControls!: HTMLElement
    buttonElements!: ButtonElements

    // Device detection
    private isTouchDevice: boolean

    constructor(game: Game, eventBus: EventBus) {
        this.game = game
        this.eventBus = eventBus

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

        // Check if we're on a touch device
        this.isTouchDevice =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches

        // Always create controls, but hide them on non-touch devices
        this.createControlElements()
        this.setupTouchListeners()

        // Initialize the adapter with the container
        if (this.container) {
            this.controlsAdapter = new TouchControlsAdapter(this.container);
        }

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

    handleResize(): void {
        const isSmallScreen = window.innerWidth < 1200
        const isLargeDisplay =
            document.body.classList.contains('desktop-layout') ||
            document.body.classList.contains('large-screen')

        if (isSmallScreen && !isLargeDisplay) {
            console.log('Showing touch controls on small screen')
            this.show()
        } else {
            console.log('Hiding touch controls on large screen')
            this.hide()
        }
    }

    private createControlElements(): void {
        const containerElement = document.querySelector(
            '.touch-controller[data-controller="main"]'
        )
        if (!containerElement) {
            console.log('Touch controls container not found, creating one')
            this.container = document.createElement('div')
            this.container.className = 'touch-controller'
            this.container.setAttribute('data-controller', 'main')
            this.container.style.position = 'relative'
            this.container.style.width = '100%'
            this.container.style.display = 'flex'
            this.container.style.justifyContent = 'space-between'
            this.container.style.alignItems = 'center'
            this.container.style.padding = 'var(--space-md) var(--space-lg) var(--space-xl) var(--space-lg)'
            this.container.style.pointerEvents = 'none'
            this.container.style.background =
                'linear-gradient(to top, rgba(10, 25, 47, 0.8), transparent)'

            document.body.appendChild(this.container)
        } else {
            this.container = containerElement as HTMLElement
        }

        // Create left side controls (D-pad)
        const leftControls = document.createElement('div')
        leftControls.className = 'left-controls'
        leftControls.style.display = 'flex'
        leftControls.style.justifyContent = 'center'
        leftControls.style.alignItems = 'center'
        leftControls.style.flex = '1'
        leftControls.style.pointerEvents = 'auto'
        leftControls.style.padding = 'var(--space-sm)' // Add breathing room around D-pad

        // Create d-pad container with grid layout
        this.directionControls = document.createElement('div')
        this.directionControls.className = 'dpad-controls'
        this.directionControls.style.display = 'grid'
        this.directionControls.style.gridTemplateAreas =
            '". up ." "left . right" ". down ."'
        this.directionControls.style.gap = 'var(--space-sm)' // Consistent spacing between arrow buttons

        // Create directional buttons
        for (const direction of ['up', 'down', 'left', 'right']) {
            const button = document.createElement('div')
            button.className = 'control-button dpad-button'
            button.dataset.key = direction
            button.dataset.direction = direction
            button.textContent = this.buttons[direction].symbol

            button.style.backgroundColor = 'rgba(0, 188, 212, 0.3)'
            button.style.border = 'var(--space-xs) solid var(--accent-primary, #00bcd4)'
            button.style.borderRadius = '50%'
            button.style.display = 'flex'
            button.style.justifyContent = 'center'
            button.style.alignItems = 'center'
            button.style.color = 'white'
            button.style.userSelect = 'none'
            button.style.touchAction = 'none'
            button.style.boxShadow = '0 var(--space-xs) var(--space-sm) rgba(0,0,0,0.3)'
            button.style.gridArea = direction
            // Responsive D-pad button sizing - consistent with action buttons
            button.style.width = 'clamp(44px, 12vw, 80px)'
            button.style.height = 'clamp(44px, 12vw, 80px)'
            button.style.fontSize = 'clamp(1.2rem, 4vw, 2rem)' // Arrows need to be slightly larger
            button.style.minWidth = '44px' // Accessibility minimum
            button.style.minHeight = '44px' // Accessibility minimum

            this.directionControls.appendChild(button)
        }

        leftControls.appendChild(this.directionControls)

        // Create right side controls (action buttons)
        const rightControls = document.createElement('div')
        rightControls.className = 'right-controls'
        rightControls.style.display = 'flex'
        rightControls.style.justifyContent = 'center'
        rightControls.style.alignItems = 'center'
        rightControls.style.flex = '1'
        rightControls.style.pointerEvents = 'auto'
        rightControls.style.padding = 'var(--space-sm)' // Add breathing room around action buttons

        const actionButtons = document.createElement('div')
        actionButtons.className = 'action-buttons'
        actionButtons.style.display = 'flex'
        actionButtons.style.flexDirection = 'row'
        actionButtons.style.gap = 'var(--space-lg)'

        // Create action buttons
        for (const action of ['boost', 'missile']) {
            const button = document.createElement('div')
            button.className = 'control-button action-button'
            button.dataset.action = action
            button.textContent = action === 'boost' ? 'B' : 'A'
            
            button.style.backgroundColor = 'rgba(0, 188, 212, 0.3)'
            button.style.border = 'var(--space-xs) solid var(--accent-primary, #00bcd4)'
            button.style.borderRadius = '50%'
            button.style.display = 'flex'
            button.style.justifyContent = 'center'
            button.style.alignItems = 'center'
            button.style.color = 'white'
            button.style.fontWeight = 'bold'
            button.style.userSelect = 'none'
            button.style.touchAction = 'none'
            button.style.boxShadow = '0 var(--space-xs) var(--space-sm) rgba(0,0,0,0.3)'
            // Responsive button sizing - minimum 44px touch target, scales with viewport
            button.style.width = 'clamp(44px, 12vw, 80px)'
            button.style.height = 'clamp(44px, 12vw, 80px)'
            button.style.fontSize = 'clamp(1rem, 3vw, 1.5rem)'
            button.style.minWidth = '44px' // Accessibility minimum
            button.style.minHeight = '44px' // Accessibility minimum

            actionButtons.appendChild(button)
        }

        rightControls.appendChild(actionButtons)

        // Assemble the layout
        this.container.appendChild(leftControls)
        this.container.appendChild(rightControls)

        // Store references to all buttons
        this.buttonElements = {
            up: this.directionControls.querySelector('[data-direction="up"]') as HTMLElement,
            down: this.directionControls.querySelector('[data-direction="down"]') as HTMLElement,
            left: this.directionControls.querySelector('[data-direction="left"]') as HTMLElement,
            right: this.directionControls.querySelector('[data-direction="right"]') as HTMLElement,
            boost: actionButtons.querySelector('[data-action="boost"]') as HTMLElement,
            missile: actionButtons.querySelector('[data-action="missile"]') as HTMLElement,
            restart: null as unknown as HTMLElement,
            shield: null as unknown as HTMLElement,
        }

        // Note: Buttons will be registered with InputManager by Game class
    }

    private setupTouchListeners(): void {
        Object.keys(this.buttonElements).forEach(key => {
            const button = this.buttonElements[key]

            if (!button) {
                console.log(`Skipping event listeners for missing button: ${key}`)
                return
            }

            button.addEventListener('touchstart', (e: TouchEvent) => {
                e.preventDefault()
                this.handleButtonActivation(key, true, e.changedTouches[0].identifier)
            }, { passive: false })

            button.addEventListener('touchend', (e: TouchEvent) => {
                e.preventDefault()
                this.handleButtonActivation(key, false, e.changedTouches[0].identifier)
            }, { passive: false })

            button.addEventListener('touchcancel', (e: TouchEvent) => {
                e.preventDefault()
                this.handleButtonActivation(key, false, e.changedTouches[0].identifier)
            }, { passive: false })

            button.addEventListener('touchmove', (e: TouchEvent) => {
                e.preventDefault()
                const touch = e.changedTouches[0]
                const buttonRect = button.getBoundingClientRect()
                if (
                    touch.clientX < buttonRect.left ||
                    touch.clientX > buttonRect.right ||
                    touch.clientY < buttonRect.top ||
                    touch.clientY > buttonRect.bottom
                ) {
                    this.handleButtonActivation(key, false, touch.identifier)
                }
            }, { passive: false })
        })
    }

    private handleButtonActivation(key: string, isActive: boolean, touchId: number): void {
        const button = this.buttonElements[key]

        if (!button) {
            console.log(`Cannot activate non-existent button: ${key}`)
            return
        }

        if (isActive) {
            button.classList.add('active')
            this.activeButtons[key] = touchId

            if (key === 'restart') {
                this.eventBus.emit('game:restart', {})
            } else if (key === 'boost' || key === 'missile') {
                console.log(`Action button pressed: ${key}`)
            } else {
                // In multiplayer mode, input is handled by InputManager
                console.log(`Touch input: ${key} = true`)
            }
        } else {
            if (this.activeButtons[key] === touchId) {
                button.classList.remove('active')
                delete this.activeButtons[key]

                if (key !== 'restart' && key !== 'boost' && key !== 'missile') {
                    console.log(`Touch input: ${key} = false`)
                }
            }
        }
    }

    hide(): void {
        if (this.container) {
            this.container.style.cssText = 'display: none !important'

            if (window.innerWidth >= 1200) {
                setTimeout(() => {
                    if (this.container && this.container.parentNode) {
                        this.container.parentNode.removeChild(this.container)
                        console.log('Touch controls removed from DOM for larger screen')
                    }
                }, 100)
            }
        }
    }

    show(): void {
        if (this.container) {
            this.container.style.display = 'flex'
        } else {
            console.log('Touch controls container was removed, recreating for small screen')
            this.createControlElements()
            this.setupTouchListeners()

            if (this.container) {
                this.controlsAdapter = new TouchControlsAdapter(this.container);
                const containerElement = this.container as HTMLElement;
                containerElement.style.display = 'flex';
            }
        }
    }

    draw(): void {
        // No canvas drawing needed - controls are DOM elements
    }

    dispose(): void {
        window.removeEventListener('resize', this.handleResize.bind(this))

        if (this.buttonElements) {
            Object.keys(this.buttonElements).forEach(key => {
                const button = this.buttonElements[key]
                if (button) {
                    button.replaceWith(button.cloneNode(true))
                }
            })
        }

        if (this.controlsAdapter) {
            this.controlsAdapter.dispose();
            this.controlsAdapter = null;
        }

        if (this.container && this.container.parentNode) {
            if (
                this.container.className.includes('touch-controller') &&
                !document.querySelector('.touch-controller[data-controller="main"]')
            ) {
                this.container.parentNode.removeChild(this.container)
            }
        }
    }
}
