// server/rooms/GameRoom.ts

import { Room, Client } from "colyseus";
// import { GameState } from "../schema/GameState";
// import { GameState } from "../schema/GameState";
import { GAME_CONSTANTS } from "../constants/serverConstants";
import logger from "../utils/logger";
import { GameState } from '../schema/GameState';
/**
 * Options sent by clients when joining a room
 */
interface JoinOptions {
  name?: string;
  width?: number;
  height?: number;
}

/**
 * Structure of an input message from the client
 */
interface InputMessage {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/**
 * Structure of a name‑update message from the client
 */
interface NameUpdateMessage {
  name: string;
}

/**
 * Last‑Player‑Standing Game Room
 */
export class GameRoom extends Room<GameState> {
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Configure room settings
    this.maxClients = GAME_CONSTANTS.GAME.MAX_PLAYERS;
    this.autoDispose = false; // keep room alive even when empty
    logger.info("Last Player Standing Game Room instantiated");
  }

  /**
   * Called when the room is first created
   */
  onCreate(options: JoinOptions = {}): void {
    logger.info("Creating Last Player Standing Game Room");

    // Initialize the state schema
    this.setState(new GameState());

    // Set patch rate for state synchronization
    this.setPatchRate(50);

    // Override arena dimensions if provided
    if (options.width && options.height) {
      this.state.arenaWidth = options.width;
      this.state.arenaHeight = options.height;
    }

    // Start the game loop
    const updateRate = GAME_CONSTANTS.GAME.STATE_UPDATE_RATE;
    this.updateInterval = setInterval(() => this.gameLoop(), updateRate);

    // Register message handlers
    this.setupMessageHandlers();

    logger.info(
      `Room ready - Arena: ${this.state.arenaWidth}×${this.state.arenaHeight}`
    );
  }

  /**
   * Register handlers for incoming messages
   */
  private setupMessageHandlers(): void {
    this.onMessage("input", (client: Client, data: InputMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.log(`⚠️ SERVER: No player found for input from ${client.sessionId}`);
        return;
      }

      player.upKey = data.up ?? false;
      player.downKey = data.down ?? false;
      player.leftKey = data.left ?? false;
      player.rightKey = data.right ?? false;
    });

    this.onMessage("updateName", (client: Client, data: NameUpdateMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (player && data.name) {
        player.name = data.name.substring(0, 20);
      }
    });

    this.onMessage("restartGame", (client: Client) => {
      if (this.state.gameState === GAME_CONSTANTS.STATE.GAME_OVER) {
        logger.info("Restart requested by", client.sessionId);
        this.state.resetGame();
      }
    });
  }

  /**
   * Called when a client successfully joins
   */
  onJoin(client: Client, options: JoinOptions = {}): void {
    try {
      logger.info(`Player ${client.sessionId} joined`);
      console.log(`🔗 SERVER: Player ${client.sessionId} joining...`);
      console.log(`🔗 SERVER: Join options:`, options);

      const player = this.state.createPlayer(client.sessionId);
      console.log(`✅ SERVER: Created player at (${player.x}, ${player.y})`);
      
      if (options.playerName) {
        player.name = options.playerName.substring(0, 20);
        console.log(`📝 SERVER: Set player name to: ${player.name}`);
      }

      this.broadcast("playerJoined", {
        id: client.sessionId,
        name: player.name,
      });

      console.log(`📊 SERVER: Total players now: ${this.state.totalPlayers}`);
      console.log(`📊 SERVER: Players in state:`, this.state.players.size);
      logger.info(`Current players: ${this.state.totalPlayers}`);
    } catch (error) {
      console.error(`❌ SERVER: Error in onJoin:`, error);
      throw error;
    }
  }

  /**
   * Called when a client leaves
   */
  onLeave(client: Client, _consented: boolean): void {
    logger.info(`Player ${client.sessionId} left`);

    this.state.removePlayer(client.sessionId);
    this.broadcast("playerLeft", { id: client.sessionId });
    this.state.checkWinCondition();

    logger.info(`Current players: ${this.state.totalPlayers}`);
  }

  /**
   * Main game loop, called at a fixed interval
   */
  private gameLoop(): void {
    const now = Date.now();
    const deltaTime = (now - this.state.lastUpdateTime) / 1000;
    this.state.lastUpdateTime = now;

    this.state.update(deltaTime);
  }

  /**
   * Clean up when the room is disposed
   */
  onDispose(): void {
    logger.info("Last Player Standing Game Room disposed");
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
