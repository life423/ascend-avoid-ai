import { Schema, MapSchema, ArraySchema } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";
import { ObstacleSchema } from "./ObstacleSchema";
export declare class GameState extends Schema {
    gameState: string;
    elapsedTime: number;
    startTime: number;
    countdownTime: number;
    arenaWidth: number;
    arenaHeight: number;
    areaPercentage: number;
    nextShrinkTime: number;
    players: MapSchema<PlayerSchema, string>;
    obstacles: ArraySchema<ObstacleSchema>;
    aliveCount: number;
    totalPlayers: number;
    winnerName: string;
    lastUpdateTime: number;
    constructor();
}
