/**
 * ProjectileManager handles the creation, updating, and cleanup of projectiles.
 * Follows the same pattern as ObstacleManager for consistency.
 */
import { PROJECTILE } from '../constants/gameConstants';
import { GameObject } from '../types';
import Projectile from '../entities/Projectile';

interface ProjectileManagerOptions {
    canvas: HTMLCanvasElement;
    maxProjectiles?: number;
}

export default class ProjectileManager {
    // Canvas reference
    private canvas: HTMLCanvasElement;
    
    // Projectile storage
    private projectiles: Projectile[];
    private maxProjectiles: number;
    
    // Shooting cooldown management
    private lastShotTime: number;
    private fireRate: number;
    
    /**
     * Creates a new ProjectileManager instance
     * @param options - Configuration options
     */
    constructor({ canvas, maxProjectiles = PROJECTILE.MAX_COUNT }: ProjectileManagerOptions) {
        this.canvas = canvas;
        this.projectiles = [];
        this.maxProjectiles = maxProjectiles;
        this.lastShotTime = 0;
        this.fireRate = PROJECTILE.FIRE_RATE;
    }
    
    /**
     * Initialize the projectile manager
     */
    initialize(): void {
        // Clear any existing projectiles
        this.projectiles = [];
        this.lastShotTime = 0;
    }
    
    /**
     * Create a new projectile from the specified position
     * @param startX - Starting X position
     * @param startY - Starting Y position
     * @param velocityX - Horizontal velocity (optional)
     * @param velocityY - Vertical velocity (optional)
     * @returns True if projectile was created, false if on cooldown or at max capacity
     */
    createProjectile(startX: number, startY: number, velocityX?: number, velocityY?: number): boolean {
        const currentTime = Date.now();
        
        // Check if we're still on cooldown
        if (currentTime - this.lastShotTime < this.fireRate) {
            return false;
        }
        
        // Remove inactive projectiles first to make room
        this.cleanup();
        
        // Check if we're at max capacity
        if (this.projectiles.length >= this.maxProjectiles) {
            return false;
        }
        
        // Create new projectile
        const projectile = new Projectile(this.canvas, startX, startY, velocityX, velocityY);
        this.projectiles.push(projectile);
        
        // Update last shot time
        this.lastShotTime = currentTime;
        
        return true;
    }
    
    /**
     * Update all projectiles
     * @param deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime: number): void {
        // Update all active projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isActive()) {
                projectile.update(deltaTime);
            }
        }
        
        // Remove inactive projectiles periodically (not every frame for performance)
        if (this.projectiles.length > 0 && Math.random() < 0.1) {
            this.cleanup();
        }
    }
    
    /**
     * Render all active projectiles
     * @param ctx - Canvas rendering context
     * @param timestamp - Current animation timestamp
     */
    render(ctx: CanvasRenderingContext2D, timestamp?: number): void {
        for (const projectile of this.projectiles) {
            if (projectile.isActive()) {
                projectile.render(ctx, timestamp);
            }
        }
    }
    
    /**
     * Draw all projectiles (alias for render)
     * @param timestamp - Current animation timestamp
     */
    draw(timestamp: number = 0): void {
        for (const projectile of this.projectiles) {
            if (projectile.isActive()) {
                projectile.draw(timestamp);
            }
        }
    }
    
    /**
     * Get all active projectiles
     * @returns Array of active projectiles
     */
    getProjectiles(): Projectile[] {
        return this.projectiles.filter(projectile => projectile.isActive());
    }
    
    /**
     * Get all projectiles (including inactive ones)
     * @returns Array of all projectiles
     */
    getAllProjectiles(): Projectile[] {
        return [...this.projectiles];
    }
    
    /**
     * Check collision between projectiles and game objects
     * @param gameObjects - Array of game objects to check collision with
     * @returns Array of collision results { projectile, target }
     */
    checkCollisions(gameObjects: GameObject[]): Array<{ projectile: Projectile; target: GameObject }> {
        const collisions: Array<{ projectile: Projectile; target: GameObject }> = [];
        
        for (const projectile of this.projectiles) {
            if (!projectile.isActive()) continue;
            
            for (const target of gameObjects) {
                if (projectile.checkCollision(target)) {
                    collisions.push({ projectile, target });
                    // Deactivate the projectile immediately upon collision
                    projectile.deactivate();
                    break; // One collision per projectile
                }
            }
        }
        
        return collisions;
    }
    
    /**
     * Remove inactive projectiles from the array
     */
    private cleanup(): void {
        this.projectiles = this.projectiles.filter(projectile => projectile.isActive());
    }
    
    /**
     * Check if player can shoot (not on cooldown)
     * @returns True if player can shoot
     */
    canShoot(): boolean {
        const currentTime = Date.now();
        return (currentTime - this.lastShotTime) >= this.fireRate;
    }
    
    /**
     * Get the time remaining until next shot is allowed
     * @returns Time in milliseconds until next shot
     */
    getTimeUntilNextShot(): number {
        const currentTime = Date.now();
        const timeSinceLastShot = currentTime - this.lastShotTime;
        return Math.max(0, this.fireRate - timeSinceLastShot);
    }
    
    /**
     * Reset the projectile manager (clear all projectiles)
     */
    reset(): void {
        this.projectiles = [];
        this.lastShotTime = 0;
    }
    
    /**
     * Clear all projectiles immediately
     */
    clear(): void {
        for (const projectile of this.projectiles) {
            projectile.deactivate();
        }
        this.cleanup();
    }
    
    /**
     * Get statistics about the projectile manager
     * @returns Object with projectile statistics
     */
    getStats(): { active: number; total: number; canShoot: boolean; cooldownRemaining: number } {
        return {
            active: this.getProjectiles().length,
            total: this.projectiles.length,
            canShoot: this.canShoot(),
            cooldownRemaining: this.getTimeUntilNextShot()
        };
    }
    
    /**
     * Set the fire rate
     * @param rate - New fire rate in milliseconds
     */
    setFireRate(rate: number): void {
        this.fireRate = Math.max(50, rate); // Minimum 50ms between shots
    }
    
    /**
     * Dispose of the projectile manager and clean up resources
     */
    dispose(): void {
        this.clear();
        this.projectiles = [];
    }
}
