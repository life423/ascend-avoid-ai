import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";
import { ObstacleSchema } from "./ObstacleSchema";

export class GameState extends Schema {
  // Game state properties
  @type("string") gameState: string = "waiting";
  @type("number") elapsedTime: number = 0;
  @type("number") startTime: number = 0;
  @type("number") countdownTime: number = 5;
  
  // Arena settings
  @type("number") arenaWidth: number = 1200;
  @type("number") arenaHeight: number = 800;
  @type("number") areaPercentage: number = 100;
  @type("number") nextShrinkTime: number = 0;
  
  // Collections for players and obstacles
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type([ObstacleSchema]) obstacles = new ArraySchema<ObstacleSchema>();
  
  // Game statistics
  @type("number") aliveCount: number = 0;
  @type("number") totalPlayers: number = 0;
  @type("string") winnerName: string = "";
  
  // Last update time for delta calculations
  @type("number") lastUpdateTime: number = Date.now();

  constructor() {
    super();
    this.lastUpdateTime = Date.now();
  }
}