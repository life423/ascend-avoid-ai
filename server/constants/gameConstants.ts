/**
 * Server constants - re-exports from shared constants + server-specific additions
 */

// Re-export everything from shared constants
export * from '../../shared/constants/gameConstants';

// Server-specific constants
export const SERVER = {
  DEFAULT_PORT: 3000,
  PING_INTERVAL: 5000,
  PING_MAX_RETRIES: 3,
  MONITOR_PATH: '/colyseus'
} as const;

export const NETWORK = {
  MAX_MESSAGE_SIZE: 1024 * 10,
  MESSAGE_TIMEOUT: 10000
} as const;

// Legacy compatibility
import * as sharedConstants from '../../shared/constants/gameConstants';
export const GAME_CONSTANTS = {
  ...sharedConstants,
  SERVER,
  NETWORK
};

export default GAME_CONSTANTS;
