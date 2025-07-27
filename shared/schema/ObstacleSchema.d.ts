import { Schema } from "@colyseus/schema";
export declare class ObstacleSchema extends Schema {
    id: number;
    x: number;
    y: number;
    type: string;
    speed: number;
    width: number;
    height: number;
    isActive: boolean;
    constructor(id?: number);
    /**
     * Reset obstacle to a new position
     * @param canvasWidth - Width of the game canvas
     * @param canvasHeight - Height of the game canvas
     * @param playerPositions - Array of player positions to avoid
     */
    reset(canvasWidth: number, canvasHeight: number, playerPositions?: Array<{
        x: number;
        y: number;
    }>): void;
    /**
     * Update obstacle position
     * @param deltaTime - Time since last update
     * @param canvasWidth - Width of the game canvas
     * @returns true if obstacle needs to be reset
     */
    update(deltaTime: number, canvasWidth: number): boolean;
    /**
     * Check collision with player
     * @param player - Player object with x, y, width, height
     * @returns true if collision detected
     */
    checkCollision(player: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): boolean;
}
