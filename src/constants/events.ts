/**
 * All game events - single source of truth
 */

export const GameEvents = {
  // Connection events
  MULTIPLAYER_CONNECTED: 'multiplayer:connected',
  MULTIPLAYER_DISCONNECTED: 'multiplayer:disconnected',
  MULTIPLAYER_ERROR: 'multiplayer:error',
  MULTIPLAYER_STATE_UPDATE: 'multiplayer:stateUpdate',
  MULTIPLAYER_CONNECT: 'multiplayer:connect',
  MULTIPLAYER_DISCONNECT: 'multiplayer:disconnect',
  MULTIPLAYER_PLAYER_JOIN: 'multiplayer:player_join',
  MULTIPLAYER_PLAYER_LEAVE: 'multiplayer:player_leave',
  
  // Player events
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_INPUT: 'player:input',
  PLAYER_UPDATE: 'player:update',
  PLAYER_MOVE: 'player:move',
  PLAYER_COLLISION: 'player:collision',
  PLAYER_SCORE: 'player:score',
  
  // Game lifecycle events
  GAME_INIT: 'game:init',
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_RESET: 'game:reset',
  GAME_RESTART: 'game:restart',
  
  // UI events
  UI_SHOW_MENU: 'ui:showMenu',
  UI_HIDE_MENU: 'ui:hideMenu',
  UI_SHOW_LOBBY: 'ui:showLobby',
  UI_HIDE_LOBBY: 'ui:hideLobby',
  UI_UPDATE_SCORE: 'ui:update_score',
  UI_UPDATE_HIGHSCORE: 'ui:update_highscore',
  
  // Input events
  INPUT_KEY_DOWN: 'input:key_down',
  INPUT_KEY_UP: 'input:key_up',
  INPUT_TOUCH_START: 'input:touch_start',
  INPUT_TOUCH_END: 'input:touch_end',
  
  // System events
  SYSTEM_RESIZE: 'system:resize',
  SYSTEM_VISIBILITY_CHANGE: 'system:visibility_change'
} as const;

export type GameEventType = typeof GameEvents[keyof typeof GameEvents];

export default GameEvents;