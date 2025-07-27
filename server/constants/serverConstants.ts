/**
 * Server-specific constants for the game server
 * Imports base constants and adds server-specific values
 */

import { 
  GAME_CONFIG, 
  PLAYER, 
  OBSTACLE, 
  GAME_STATE, 
  PLAYER_STATE, 
  ARENA,
  PLAYER_COLORS 
} from '../../shared/constants/gameConstants';

// Legacy aliases for backward compatibility
export const GAME_CONSTANTS = {
  GAME: GAME_CONFIG,
  PLAYER,
  OBSTACLE,
  STATE: GAME_STATE,
  PLAYER_STATE,
  ARENA
};

// Server-specific settings
export const SERVER = {
  DEFAULT_PORT: 3000,
  PING_INTERVAL: 5000,
  PING_MAX_RETRIES: 3,
  MONITOR_PATH: '/colyseus',
};

// Connection and network settings
export const NETWORK = {
  MAX_MESSAGE_SIZE: 1024 * 10, // 10kb
  MESSAGE_TIMEOUT: 10000, // 10 seconds
};

// Re-export all constants for convenience
export {
  PLAYER,
  OBSTACLE,
  PLAYER_STATE,
  ARENA,
  PLAYER_COLORS
};
