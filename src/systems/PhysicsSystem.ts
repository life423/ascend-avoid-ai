/**
 * PhysicsSystem - Handles physics processing
 */
import { System } from '../core/System';
import { globalServiceLocator as ServiceLocator } from '../core/ServiceLocator';
import { globalEventBus as EventBus } from '../core/EventBus';
import { GameEvents } from '../constants/eventTypes';
import { Entity } from '../core/Entity';

interface CollisionData {
    entityA: Entity;
    entityB: Entity;
    overlapX: number;
    overlapY: number;
}

export class PhysicsSystem extends System {
    private entities: Set<Entity>;
    private gravity: number;
    private friction: number;
    
    /**
     * Creates a new PhysicsSystem
     * @param gravity - Gravity acceleration (pixels/second²)
     * @param friction - Friction coefficient (0-1)
     */
    constructor(gravity: number = 980, friction: number = 0.1) {
        // Physics system has medium priority
        super(5);
        
        this.entities = new Set();
        this.gravity = gravity;
        this.friction = friction;
    }
    
    /**
     * Initialize the physics system
     */
    public init(): void {
        // Register with ServiceLocator
        ServiceLocator.register('physicsSystem', this);
    }
    
    /**
     * Update the physics system
     * @param deltaTime - Time since last frame in seconds
     */
    public update(deltaTime: number): void {
        // Apply physics to all entities
        for (const entity of this.entities) {
            this.updateEntity(entity, deltaTime);
        }
        
        // Check for collisions
        this.checkCollisions();
    }
    
    /**
     * Add an entity to physics processing
     * @param entity - Entity to add
     */
    public addEntity(entity: Entity): void {
        this.entities.add(entity);
    }
    
    /**
     * Remove an entity from physics processing
     * @param entity - Entity to remove
     */
    public removeEntity(entity: Entity): void {
        this.entities.delete(entity);
    }
    
    /**
     * Update a single entity's physics
     * @param entity - Entity to update
     * @param deltaTime - Time since last frame in seconds
     */
    private updateEntity(entity: Entity, deltaTime: number): void {
        // Check if entity has velocity properties
        if ('velocityX' in entity && 'velocityY' in entity) {
            const velocityEntity = entity as Entity & {
                velocityX: number;
                velocityY: number;
                onGround?: boolean;
            };
            
            // Apply gravity if not on ground
            if (!velocityEntity.onGround) {
                velocityEntity.velocityY += this.gravity * deltaTime;
            }
            
            // Apply friction
            velocityEntity.velocityX *= (1 - this.friction * deltaTime);
            
            // Update position
            entity.x += velocityEntity.velocityX * deltaTime;
            entity.y += velocityEntity.velocityY * deltaTime;
        }
    }
    
    /**
     * Check for collisions between entities
     */
    private checkCollisions(): void {
        const entitiesArray = Array.from(this.entities);
        
        for (let i = 0; i < entitiesArray.length; i++) {
            for (let j = i + 1; j < entitiesArray.length; j++) {
                const entityA = entitiesArray[i];
                const entityB = entitiesArray[j];
                
                const collision = this.checkCollision(entityA, entityB);
                if (collision) {
                    this.handleCollision(collision);
                }
            }
        }
    }
    
    /**
     * Check collision between two entities
     * @param entityA - First entity
     * @param entityB - Second entity
     * @returns Collision data if collision occurred, null otherwise
     */
    private checkCollision(entityA: Entity, entityB: Entity): CollisionData | null {
        // Simple AABB collision detection
        const overlapX = Math.min(entityA.x + entityA.width, entityB.x + entityB.width) -
                        Math.max(entityA.x, entityB.x);
        const overlapY = Math.min(entityA.y + entityA.height, entityB.y + entityB.height) -
                        Math.max(entityA.y, entityB.y);
        
        if (overlapX > 0 && overlapY > 0) {
            return {
                entityA,
                entityB,
                overlapX,
                overlapY
            };
        }
        
        return null;
    }
    
    /**
     * Handle collision between entities
     * @param collision - Collision data
     */
    private handleCollision(collision: CollisionData): void {
        const { entityA, entityB, overlapX, overlapY } = collision;
        
        // Emit collision event
        EventBus.emit(GameEvents.PLAYER_COLLISION, {
            entityA: entityA.constructor.name,
            entityB: entityB.constructor.name,
            overlapX,
            overlapY
        });
        
        // Simple collision resolution - separate entities
        const separationX = overlapX / 2;
        const separationY = overlapY / 2;
        
        if (overlapX < overlapY) {
            // Horizontal separation
            if (entityA.x < entityB.x) {
                entityA.x -= separationX;
                entityB.x += separationX;
            } else {
                entityA.x += separationX;
                entityB.x -= separationX;
            }
        } else {
            // Vertical separation
            if (entityA.y < entityB.y) {
                entityA.y -= separationY;
                entityB.y += separationY;
            } else {
                entityA.y += separationY;
                entityB.y -= separationY;
            }
        }
        
        // Stop velocities on collision
        if ('velocityX' in entityA && 'velocityY' in entityA) {
            const velocityEntityA = entityA as Entity & {
                velocityX: number;
                velocityY: number;
                onGround?: boolean;
            };
            
            if (overlapX < overlapY) {
                velocityEntityA.velocityX = 0;
            } else {
                velocityEntityA.velocityY = 0;
                velocityEntityA.onGround = true;
            }
        }
        
        if ('velocityX' in entityB && 'velocityY' in entityB) {
            const velocityEntityB = entityB as Entity & {
                velocityX: number;
                velocityY: number;
                onGround?: boolean;
            };
            
            if (overlapX < overlapY) {
                velocityEntityB.velocityX = 0;
            } else {
                velocityEntityB.velocityY = 0;
                velocityEntityB.onGround = true;
            }
        }
    }
    
    /**
     * Set gravity
     * @param gravity - New gravity value
     */
    public setGravity(gravity: number): void {
        this.gravity = gravity;
    }
    
    /**
     * Set friction
     * @param friction - New friction value (0-1)
     */
    public setFriction(friction: number): void {
        this.friction = Math.max(0, Math.min(1, friction));
    }
    
    /**
     * Get all entities in physics system
     * @returns Set of entities
     */
    public getEntities(): Set<Entity> {
        return new Set(this.entities);
    }
    
    /**
     * Clear all entities
     */
    public clearEntities(): void {
        this.entities.clear();
    }
    
    /**
     * Clean up resources
     */
    public dispose(): void {
        this.clearEntities();
        
        // Remove from ServiceLocator
        ServiceLocator.remove('physicsSystem');
        
        super.dispose();
    }
}

export default PhysicsSystem;
