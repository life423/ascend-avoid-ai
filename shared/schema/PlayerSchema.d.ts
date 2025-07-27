import { Schema } from "@colyseus/schema";
export declare class PlayerSchema extends Schema {
    sessionId: string;
    playerIndex: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    state: string;
    score: number;
    upKey: boolean;
    downKey: boolean;
    leftKey: boolean;
    rightKey: boolean;
    lastUpdateTime: number;
    constructor(sessionId?: string, playerIndex?: number);
    /**
     * Reset player position for a new game
     * @param canvasWidth - Width of the game canvas
     * @param canvasHeight - Height of the game canvas
     * @param playerIndex - Optional: player index for spawn distribution
     * @param totalPlayers - Optional: total players for spawn distribution
     */
    resetPosition(canvasWidth: number, canvasHeight: number, playerIndex?: number, totalPlayers?: number): void;
    /**
     * Update player movement based on input
     * @param deltaTime - Time since last update in seconds
     * @param canvasWidth - Width of the game canvas
     * @param canvasHeight - Height of the game canvas
     */
    updateMovement(_deltaTime: number, canvasWidth: number, canvasHeight: number): void;
    /**
     * Mark player as dead
     */
    markAsDead(): void;
    /**
     * Convert to spectator
     */
    becomeSpectator(): void;
}
