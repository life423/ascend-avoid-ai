/**
 * Standard event types for the game
 * Centralizes all event names to avoid typos and provide better IDE support
 */

export const GameEvents = {
  // Game lifecycle events
  GAME_INIT: 'game:init',
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  GAME_RESET: 'game:reset',
  GAME_RESTART: 'game:restart',
  
  // Player events
  PLAYER_MOVE: 'player:move',
  PLAYER_COLLISION: 'player:collision',
  PLAYER_SCORE: 'player:score',
  
  // UI events
  UI_SHOW_MENU: 'ui:show_menu',
  UI_HIDE_MENU: 'ui:hide_menu',
  UI_UPDATE_SCORE: 'ui:update_score',
  UI_UPDATE_HIGHSCORE: 'ui:update_highscore',
  
  // Input events
  INPUT_KEY_DOWN: 'input:key_down',
  INPUT_KEY_UP: 'input:key_up',
  INPUT_TOUCH_START: 'input:touch_start',
  INPUT_TOUCH_END: 'input:touch_end',
  
  // System events
  SYSTEM_RESIZE: 'system:resize',
  SYSTEM_VISIBILITY_CHANGE: 'system:visibility_change',
  
  // Multiplayer events
  MULTIPLAYER_CONNECT: 'multiplayer:connect',
  MULTIPLAYER_DISCONNECT: 'multiplayer:disconnect',
  MULTIPLAYER_PLAYER_JOIN: 'multiplayer:player_join',
  MULTIPLAYER_PLAYER_LEAVE: 'multiplayer:player_leave',
  MULTIPLAYER_STATE_UPDATE: 'multiplayer:state_update'
} as const;

export type GameEventType = typeof GameEvents[keyof typeof GameEvents];

export default GameEvents;