/**
 * Projectile class representing a projectile fired by the player.
 * Follows the GameObject interface and integrates with the existing game architecture.
 */
import { PROJECTILE } from '../constants/gameConstants';
import { SCALE_FACTOR } from '../utils/utils';
import { GameObject } from '../types';

export default class Projectile implements GameObject {
    // Canvas and context
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    // Position and dimensions
    x: number;
    y: number;
    width: number;
    height: number;
    
    // Velocity
    private vx: number;
    private vy: number;
    
    // Lifecycle
    private lifetime: number;
    private age: number;
    private active: boolean;
    
    /**
     * Creates a new Projectile instance
     * @param canvas - The game canvas
     * @param startX - Starting X position
     * @param startY - Starting Y position
     * @param velocityX - Horizontal velocity
     * @param velocityY - Vertical velocity
     */
    constructor(canvas: HTMLCanvasElement, startX: number, startY: number, velocityX: number = 0, velocityY: number = -PROJECTILE.BASE_SPEED) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        
        // Scale projectile size based on screen scale
        this.width = PROJECTILE.WIDTH * SCALE_FACTOR;
        this.height = PROJECTILE.HEIGHT * SCALE_FACTOR;
        
        // Position
        this.x = startX - this.width / 2; // Center on start position
        this.y = startY;
        
        // Velocity
        this.vx = velocityX * SCALE_FACTOR;
        this.vy = velocityY * SCALE_FACTOR;
        
        // Lifecycle
        this.lifetime = PROJECTILE.LIFETIME;
        this.age = 0;
        this.active = true;
    }
    
    /**
     * Update the projectile position and check for expiration
     * @param deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime: number): void {
        if (!this.active) return;
        
        // Update position based on velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Update age
        this.age += deltaTime * 1000; // Convert to milliseconds
        
        // Check if projectile has expired or is off-screen
        if (this.age >= this.lifetime || this.isOffScreen()) {
            this.active = false;
        }
    }
    
    /**
     * Render the projectile on the canvas
     * @param ctx - Canvas rendering context (optional, uses internal ctx if not provided)
     * @param timestamp - Current animation timestamp (optional)
     */
    render(ctx?: CanvasRenderingContext2D, _timestamp?: number): void {
        if (!this.active) return;
        
        const context = ctx || this.ctx;
        
        // Save context state
        context.save();
        
        // Create a bright projectile with glow effect
        context.fillStyle = '#00ffff'; // Bright cyan
        context.shadowColor = '#00ffff';
        context.shadowBlur = 3 * SCALE_FACTOR;
        
        // Draw the projectile as a rounded rectangle
        context.beginPath();
        const radius = Math.min(this.width, this.height) / 4;
        context.roundRect(this.x, this.y, this.width, this.height, radius);
        context.fill();
        
        // Add inner highlight
        context.fillStyle = '#ffffff';
        context.shadowBlur = 0;
        const innerWidth = this.width * 0.6;
        const innerHeight = this.height * 0.8;
        const innerX = this.x + (this.width - innerWidth) / 2;
        const innerY = this.y + (this.height - innerHeight) / 2;
        context.beginPath();
        context.roundRect(innerX, innerY, innerWidth, innerHeight, radius / 2);
        context.fill();
        
        // Restore context state
        context.restore();
    }
    
    /**
     * Draw the projectile (alias for render to maintain consistency)
     * @param timestamp - Current animation timestamp
     */
    draw(timestamp: number = 0): void {
        this.render(this.ctx, timestamp);
    }
    
    /**
     * Check if the projectile is off-screen
     * @returns True if the projectile is off-screen
     */
    private isOffScreen(): boolean {
        return (
            this.x + this.width < 0 ||
            this.x > this.canvas.width ||
            this.y + this.height < 0 ||
            this.y > this.canvas.height
        );
    }
    
    /**
     * Check if the projectile is still active
     * @returns True if the projectile is active
     */
    isActive(): boolean {
        return this.active;
    }
    
    /**
     * Deactivate the projectile (for cleanup when hit)
     */
    deactivate(): void {
        this.active = false;
    }
    
    /**
     * Get the bounding box for collision detection
     * @returns Object with x, y, width, height
     */
    getBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Check collision with another game object
     * @param other - The other game object to check collision with
     * @returns True if collision detected
     */
    checkCollision(other: GameObject): boolean {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }
    
    /**
     * Reset the projectile (not typically used, but required by GameObject interface)
     */
    reset(): void {
        this.active = false;
        this.age = 0;
    }
}
