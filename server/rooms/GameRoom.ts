import pkg from 'colyseus';
const { Room } = pkg;
import { GameState } from "../schema/GameState.js";
import { GAME_CONSTANTS } from "../constants/serverConstants.js";
import { Client } from "colyseus";
import logger from "../utils/logger.js";

/**
 * Type definitions for room messages
 */
interface JoinOptions {
  name?: string;
  width?: number;
  height?: number;
}

interface InputMessage {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

interface NameUpdateMessage {
  name: string;
}

/**
 * Last Player Standing Game Room
 * Handles up to 30 players in a battle royale style game
 */
class GameRoom extends Room<GameState> {
  private updateInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    super();

    // Configure room settings
    this.maxClients = GAME_CONSTANTS.GAME.MAX_PLAYERS;
    this.autoDispose = false; // Don't dispose room automatically when empty

    logger.info("Last Player Standing Game Room created");
  }

  /**
   * Initialize room state when created
   */
  onCreate(options: JoinOptions = {}): void {
    logger.info("Creating Last Player Standing Game Room");

    // Initialize room state with GameState schema
    this.setState(new GameState());

    // Override arena dimensions if provided
    if (options.width && options.height) {
      this.state.arenaWidth = options.width;
      this.state.arenaHeight = options.height;
    }

    // Set up game update loop
    const updateRate = GAME_CONSTANTS.GAME.STATE_UPDATE_RATE;
    this.updateInterval = setInterval(() => this.gameLoop(), updateRate);

    // Set up message handlers
    this.setupMessageHandlers();

    logger.info(`Room ready. Arena size: ${this.state.arenaWidth}x${this.state.arenaHeight}`);
  }

  /**
   * Setup message handlers for client communication
   */
  setupMessageHandlers(): void {
    // Handle player movement input
    this.onMessage("input", (client, data: InputMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Update player's movement input state
      player.movementKeys = {
        up: data.up || false,
        down: data.down || false,
        left: data.left || false,
        right: data.right || false
      };
    });

    // Handle player name update
    this.onMessage("updateName", (client, data: NameUpdateMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (player && data.name) {
        player.name = data.name.substring(0, 20); // Limit name length
      }
    });

    // Handle game restart request
    this.onMessage("restartGame", (client) => {
      // Only allow restart when game is over
      if (this.state.gameState === GAME_CONSTANTS.STATE.GAME_OVER as string) {
        logger.info("Game restart requested by:", client.sessionId);
        this.state.resetGame();
      }
    });
  }

  /**
   * Handle client joining the room
   */
  onJoin(client: Client, options: JoinOptions = {}): void {
    logger.info(`Player ${client.sessionId} joined`);

    // Create player in game state
    const player = this.state.createPlayer(client.sessionId);

    // Set player name if provided
    if (options.name) {
      player.name = options.name.substring(0, 20); // Limit name length
    }

    // Broadcast join message
    this.broadcast("playerJoined", {
      id: client.sessionId,
      name: player.name
    });

    logger.info(`Current players: ${this.state.totalPlayers}`);
  }

  /**
   * Handle client leaving the room
   */
  onLeave(client: Client, _consented: boolean): void {
    logger.info(`Player ${client.sessionId} left`);

    // Remove player from game state
    this.state.removePlayer(client.sessionId);

    // Broadcast leave message
    this.broadcast("playerLeft", {
      id: client.sessionId
    });

    // Check win condition (in case only one player remains)
    this.state.checkWinCondition();

    logger.info(`Current players: ${this.state.totalPlayers}`);
  }

  /**
   * Main game loop
   */
  gameLoop(): void {
    // Calculate delta time (in seconds)
    const now = Date.now();
    const deltaTime = (now - this.state.lastUpdateTime) / 1000;
    this.state.lastUpdateTime = now;

    // Update game state
    this.state.update(deltaTime);
  }

  /**
   * Clean up when room is disposed
   */
  onDispose(): void {
    logger.info("Last Player Standing Game Room disposed");

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export { GameRoom };
