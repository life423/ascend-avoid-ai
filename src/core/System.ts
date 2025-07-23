/**
 * Base System class for all game systems
 * Systems handle specific aspects of game functionality (rendering, physics, etc.)
 */
import { System as SystemInterface } from '../types';

export abstract class System implements SystemInterface {
  // Whether the system is active
  public active: boolean;
  
  // System priority (lower numbers run first)
  protected priority: number;
  
  /**
   * Creates a new System
   * @param priority - System priority (lower numbers run first)
   */
  constructor(priority: number = 0) {
    this.active = true;
    this.priority = priority;
  }
  
  /**
   * Initialize the system
   */
  public init(): void {
    // Base implementation does nothing
  }
  
  /**
   * Update the system
   * @param deltaTime - Time since last frame in seconds
   */
  public abstract update(deltaTime: number): void;
  
  /**
   * Render the system (optional)
   * @param ctx - Canvas rendering context
   * @param timestamp - Current timestamp for animation
   */
  public render?(ctx: CanvasRenderingContext2D, timestamp?: number): void;
  
  /**
   * Dispose of the system
   */
  public dispose(): void {
    this.active = false;
  }
  
  /**
   * Get the system priority
   * @returns The system priority
   */
  public getPriority(): number {
    return this.priority;
  }
  
  /**
   * Check if the system is active
   * @returns Whether the system is active
   */
  public isActive(): boolean {
    return this.active;
  }
  
  /**
   * Set the system active state
   * @param active - Whether the system should be active
   */
  public setActive(active: boolean): void {
    this.active = active;
  }
}

export default System;
