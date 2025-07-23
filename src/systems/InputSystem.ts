/**
 * InputSystem - Handles input processing
 */
import { System } from '../core/System';
import { globalServiceLocator as ServiceLocator } from '../core/ServiceLocator';
import { globalEventBus as EventBus } from '../core/EventBus';
import { GameEvents } from '../constants/eventTypes';
import { InputState } from '../types';

export class InputSystem extends System {
  // Input state
  private inputState: InputState;
  
  // Key mappings
  private keyMappings: Record<string, string[]>;
  
  // Touch state
  private touchActive: boolean;
  private touchButtons: Map<HTMLElement, string>;
  
  /**
   * Creates a new InputSystem
   * @param keyMappings - Key mappings
   */
  constructor(keyMappings: Record<string, string[]> = {}) {
    // Input system has high priority (runs before most updates)
    super(10);
    
    // Initialize input state
    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    
    this.keyMappings = keyMappings;
    this.touchActive = false;
    this.touchButtons = new Map();
    
    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }
  
  /**
   * Initialize the input system
   */
  public init(): void {
    // Register with ServiceLocator
    ServiceLocator.register('inputSystem', this);
    
    // Set up event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Check if touch is available
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.touchActive = true;
    }
  }
  
  /**
   * Update the input system
   * @param deltaTime - Time since last frame in seconds
   */
  public update(_deltaTime: number): void {
    // Nothing to do in update for input system
    // Input is handled by event listeners
  }
  
  /**
   * Handle key down event
   * @param event - Key event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Update input state based on key mappings
    for (const [action, keys] of Object.entries(this.keyMappings)) {
      if (keys.includes(event.key) || keys.includes(event.code)) {
        this.setInputState(action, true);
        
        // Emit input event
        EventBus.emit(GameEvents.INPUT_KEY_DOWN, {
          action,
          key: event.key,
          code: event.code
        });
        
        // Prevent default for game keys
        event.preventDefault();
      }
    }
  }
  
  /**
   * Handle key up event
   * @param event - Key event
   */
  private handleKeyUp(event: KeyboardEvent): void {
    // Update input state based on key mappings
    for (const [action, keys] of Object.entries(this.keyMappings)) {
      if (keys.includes(event.key) || keys.includes(event.code)) {
        this.setInputState(action, false);
        
        // Emit input event
        EventBus.emit(GameEvents.INPUT_KEY_UP, {
          action,
          key: event.key,
          code: event.code
        });
        
        // Prevent default for game keys
        event.preventDefault();
      }
    }
  }
  
  /**
   * Handle touch start event
   * @param event - Touch event
   */
  private handleTouchStart(event: TouchEvent): void {
    // Emit touch event
    EventBus.emit(GameEvents.INPUT_TOUCH_START, {
      touches: event.touches,
      changedTouches: event.changedTouches
    });
  }
  
  /**
   * Handle touch end event
   * @param event - Touch event
   */
  private handleTouchEnd(event: TouchEvent): void {
    // Emit touch event
    EventBus.emit(GameEvents.INPUT_TOUCH_END, {
      touches: event.touches,
      changedTouches: event.changedTouches
    });
  }
  
  /**
   * Set up touch controls for a canvas
   * @param canvas - The canvas to set up touch controls for
   */
  public setupTouchControls(canvas: HTMLCanvasElement): void {
    if (!this.touchActive) return;
    
    // Add touch event listeners to canvas
    canvas.addEventListener('touchstart', this.handleTouchStart);
    canvas.addEventListener('touchend', this.handleTouchEnd);
  }
  
  /**
   * Register a touch button
   * @param element - The button element
   * @param action - The action to trigger
   */
  public registerTouchButton(element: HTMLElement, action: string): void {
    if (!this.touchActive) return;
    
    // Add to touch buttons map
    this.touchButtons.set(element, action);
    
    // Add touch event listeners
    element.addEventListener('touchstart', () => {
      this.setInputState(action, true);
      EventBus.emit(GameEvents.INPUT_TOUCH_START, { action });
    });
    
    element.addEventListener('touchend', () => {
      this.setInputState(action, false);
      EventBus.emit(GameEvents.INPUT_TOUCH_END, { action });
    });
  }
  
  /**
   * Set input state for an action
   * @param action - The action
   * @param value - The value
   */
  private setInputState(action: string, value: boolean): void {
    // Update input state if action exists
    if (action in this.inputState) {
      this.inputState[action] = value;
    }
  }
  
  /**
   * Get the current input state
   * @returns The current input state
   */
  public getInputState(): InputState {
    return { ...this.inputState };
  }
  
  /**
   * Set key mappings
   * @param keyMappings - Key mappings
   */
  public setKeyMappings(keyMappings: Record<string, string[]>): void {
    this.keyMappings = keyMappings;
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    // Remove from ServiceLocator
    ServiceLocator.remove('inputSystem');
    
    super.dispose();
  }
}

export default InputSystem;
