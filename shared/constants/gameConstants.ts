/**
 * Shared game constants - single source of truth for client and server
 */

// Canvas defaults
export const CANVAS = {
  BASE_WIDTH: 600,
  BASE_HEIGHT: 700,
  MAX_DESKTOP_WIDTH: 1600,
  MAX_MOBILE_WIDTH: 800
} as const;

// Game configuration
export const GAME_CONFIG = {
  ROOM_NAME: 'game_room',
  DEFAULT_PLAYER_NAME: 'Anonymous',
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000,
  MAX_PLAYERS: 30,
  MIN_PLAYERS_TO_START: process.env.NODE_ENV === 'development' ? 1 : 2,
  STATE_UPDATE_RATE: 1000 / 30,
  MAX_OBSTACLES: 12,
  DIFFICULTY_INCREASE_RATE: 0.15,
  WINNING_LINE: 40,
  ARENA_WIDTH: 1200,
  ARENA_HEIGHT: 800
} as const;

// Player settings
export const PLAYER = {
  BASE_WIDTH: 30,
  BASE_HEIGHT: 30,
  MIN_STEP: 3,
  BASE_SPEED: 5,
  SIZE_RATIO: 0.04
} as const;

// Obstacle settings
export const OBSTACLE = {
  BASE_SPEED: 2,
  MIN_WIDTH: 30,
  MAX_WIDTH: 60,
  MIN_WIDTH_RATIO: 0.08,
  MAX_WIDTH_RATIO: 0.18
} as const;

// Projectile settings
export const PROJECTILE = {
  WIDTH: 4,
  HEIGHT: 8,
  SPEED: 400,
  BASE_SPEED: 400,
  MAX_ACTIVE: 5,
  MAX_COUNT: 5,
  FIRE_RATE: 250,
  COLOR: '#00ffff',
  TRAIL_LENGTH: 3,
  LIFETIME: 3000
} as const;

// Game states
export const GAME_STATE = {
  READY: 'ready',
  WAITING: 'waiting',
  STARTING: 'starting',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
  PAUSED: 'paused'
} as const;

// Player states
export const PLAYER_STATE = {
  ALIVE: 'alive',
  DEAD: 'dead',
  SPECTATING: 'spectating'
} as const;

// Arena settings
export const ARENA = {
  INITIAL_AREA_PERCENTAGE: 100,
  SHRINK_INTERVAL: 30000,
  SHRINK_PERCENTAGE: 10,
  MIN_AREA_PERCENTAGE: 40
} as const;

// Key mappings
export const KEYS = {
  UP: ['ArrowUp', 'Up', 'w', 'W'],
  DOWN: ['ArrowDown', 'Down', 's', 'S'],
  LEFT: ['ArrowLeft', 'Left', 'a', 'A'],
  RIGHT: ['ArrowRight', 'Right', 'd', 'D'],
  RESTART: ['r', 'R'],
  SHOOT: [' ', 'Space', 'Enter']
} as const;

// Player colors
export const PLAYER_COLORS = [
  '#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#00BCD4', '#64FFDA',
  '#E91E63', '#3F51B5', '#00E5FF', '#76FF03', '#FFC400', '#F50057',
  '#D500F9', '#00B0FF', '#F44336', '#FF5722', '#651FFF', '#2979FF',
  '#18FFFF', '#1DE9B6', '#00E676', '#C6FF00', '#FFC107', '#FF3D00',
  '#FF9100', '#FFEA00', '#76FF03'
] as const;

// Device-specific settings
export const DEVICE_SETTINGS = {
  DESKTOP: {
    PLAYER_SIZE_RATIO: 0.035,
    MIN_STEP: 10,
    OBSTACLE_MIN_WIDTH_RATIO: 0.08,
    OBSTACLE_MAX_WIDTH_RATIO: 0.18,
    BASE_SPEED: 3.5,
    DIFFICULTY_INCREASE_RATE: 0.18
  },
  MOBILE: {
    PLAYER_SIZE_RATIO: 0.045,
    MIN_STEP: 4,
    OBSTACLE_MIN_WIDTH_RATIO: 0.1,
    OBSTACLE_MAX_WIDTH_RATIO: 0.2,
    BASE_SPEED: 2.5,
    DIFFICULTY_INCREASE_RATE: 0.15
  }
} as const;

// Legacy aliases
export const GAME = GAME_CONFIG;
export const STATE = GAME_STATE;
export const DESKTOP_SETTINGS = DEVICE_SETTINGS.DESKTOP;

export type GameStateType = typeof GAME_STATE[keyof typeof GAME_STATE];
export type PlayerStateType = typeof PLAYER_STATE[keyof typeof PLAYER_STATE];