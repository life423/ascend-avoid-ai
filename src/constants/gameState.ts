// src/constants/gameState.ts
export const GAME_STATE = {
  READY:      'READY',
  WAITING:    'WAITING',
  STARTING:   'STARTING',
  PLAYING:    'PLAYING',
  PAUSED:     'PAUSED',
  GAME_OVER:  'GAME_OVER',
} as const;

export type GameState = typeof GAME_STATE[keyof typeof GAME_STATE];
