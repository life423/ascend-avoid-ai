/**
 * Base Entity class for all game objects
 * Provides common functionality and properties for all entities
 */
import { Entity as EntityInterface } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class Entity implements EntityInterface {
  // Unique identifier
  public id: string;
  
  // Entity type
  public type: string;
  
  // Position and dimensions
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  
  // State
  public active: boolean;
  public tags: string[];
  
  /**
   * Creates a new Entity
   * @param type - The entity type
   * @param x - Initial x position
   * @param y - Initial y position
   * @param width - Entity width
   * @param height - Entity height
   */
  constructor(type: string, x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
    this.id = uuidv4();
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.active = true;
    this.tags = [];
  }
  
  /**
   * Update the entity
   * @param deltaTime - Time since last frame in seconds
   */
  update(_deltaTime: number): void {
    // Base implementation does nothing
  }
  
  /**
   * Render the entity
   * @param ctx - Canvas rendering context
   * @param timestamp - Current timestamp for animation
   */
  render(_ctx: CanvasRenderingContext2D, _timestamp?: number): void {
    // Base implementation does nothing
  }
  
  /**
   * Reset the entity to its initial state
   */
  reset(): void {
    // Base implementation does nothing
  }
  
  /**
   * Destroy the entity
   */
  destroy(): void {
    this.active = false;
  }
}

export default Entity;