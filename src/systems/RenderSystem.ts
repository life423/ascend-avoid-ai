/**
 * RenderSystem - Handles rendering
 */
import { GameObject } from '../types';

export class RenderSystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private entities: Set<GameObject>;
    private backgroundColor: string;
    private clearBeforeRender: boolean;
    
    /**
     * Creates a new RenderSystem
     * @param canvas - Canvas element to render to
     * @param backgroundColor - Background color (default: transparent)
     * @param clearBeforeRender - Whether to clear canvas before rendering (default: true)
     */
    constructor(canvas: HTMLCanvasElement, backgroundColor: string = 'transparent', clearBeforeRender: boolean = true) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D rendering context');
        }
        this.ctx = ctx;
        
        this.entities = new Set();
        this.backgroundColor = backgroundColor;
        this.clearBeforeRender = clearBeforeRender;
        
        // Set up canvas properties
        this.setupCanvas();
    }
    
    /**
     * Initialize the render system
     */
    public init(): void {
        // Initialization logic can go here if needed in the future
    }
    
    /**
     * Public render method
     * @param _ctx - Canvas rendering context (ignored, uses internal context)
     * @param timestamp - Current timestamp for animation
     */
    public render(_ctx: CanvasRenderingContext2D, timestamp?: number): void {
        this.renderEntities(timestamp);
    }
    
    /**
     * Set up canvas properties
     */
    private setupCanvas(): void {
        // Enable image smoothing for better quality
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Set text properties
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
    }
    
    /**
     * Render all entities
     */
    private renderEntities(timestamp?: number): void {
        // Clear canvas if needed
        if (this.clearBeforeRender) {
            this.clearCanvas();
        }
        
        // Sort entities by render order (z-index)
        const sortedEntities = Array.from(this.entities).sort((a, b) => {
            const aZIndex = 'zIndex' in a ? (a as any).zIndex || 0 : 0;
            const bZIndex = 'zIndex' in b ? (b as any).zIndex || 0 : 0;
            return aZIndex - bZIndex;
        });
        
        // Render all entities
        for (const entity of sortedEntities) {
            this.renderEntity(entity, timestamp);
        }
    }
    
    /**
     * Clear the canvas
     */
    private clearCanvas(): void {
        if (this.backgroundColor === 'transparent') {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Render a single entity
     * @param entity - Entity to render
     */
    private renderEntity(entity: GameObject, timestamp?: number): void {
        // Save canvas state
        this.ctx.save();
        
        try {
            // Check if entity has a custom render method
            if (typeof entity.render === 'function') {
                entity.render(this.ctx, timestamp);
            } else {
                // Default rendering - simple rectangle
                this.ctx.fillStyle = 'color' in entity ? (entity as any).color || '#000000' : '#000000';
                this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
            }
        } catch (error) {
            console.error('Error rendering entity:', error);
        } finally {
            // Restore canvas state
            this.ctx.restore();
        }
    }
    
    /**
     * Add an entity to rendering
     * @param entity - Entity to add
     */
    public addEntity(entity: GameObject): void {
        this.entities.add(entity);
    }
    
    /**
     * Remove an entity from rendering
     * @param entity - Entity to remove
     */
    public removeEntity(entity: GameObject): void {
        this.entities.delete(entity);
    }

    public remove(entity: GameObject): void {
        this.removeEntity(entity);
    }
    
    /**
     * Get the canvas element
     * @returns Canvas element
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
    
    /**
     * Get the rendering context
     * @returns 2D rendering context
     */
    public getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }
    
    /**
     * Set background color
     * @param color - Background color
     */
    public setBackgroundColor(color: string): void {
        this.backgroundColor = color;
    }
    
    /**
     * Set whether to clear canvas before rendering
     * @param clear - Whether to clear
     */
    public setClearBeforeRender(clear: boolean): void {
        this.clearBeforeRender = clear;
    }
    
    /**
     * Get all entities in render system
     * @returns Set of entities
     */
    public getEntities(): Set<GameObject> {
        return new Set(this.entities);
    }
    
    /**
     * Clear all entities
     */
    public clearEntities(): void {
        this.entities.clear();
    }
    
    /**
     * Resize canvas
     * @param width - New width
     * @param height - New height
     */
    public resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.setupCanvas(); // Reapply canvas properties after resize
    }
    
    /**
     * Clean up resources
     */
    public dispose(): void {
        this.clearEntities();
    }
}

export default RenderSystem;
