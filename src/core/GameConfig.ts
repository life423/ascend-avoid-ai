/**
 * A class to encapsulate game configuration, avoiding mutation of global constants
 * and providing clean access to game settings based on platform.
 * Now with TypeScript support.
 */
import {
    DESKTOP_SETTINGS,
    GAME,
    KEYS,
    OBSTACLE,
    PLAYER,
    GAME_STATE,
} from '../constants/gameConstants'
import { GameConfig as GameConfigInterface } from '../types'

interface GameSettings {
    WINNING_LINE: number
    BASE_SPEED: number
    PLAYER_SIZE_RATIO: number
    MIN_STEP: number
    OBSTACLE_MIN_WIDTH_RATIO: number
    OBSTACLE_MAX_WIDTH_RATIO: number
    MAX_CARS: number
    DIFFICULTY_INCREASE_RATE: number
}

interface DebugSettings {
    enabled: boolean
    showCollisions: boolean
    showFPS: boolean
}

export default class GameConfig implements GameConfigInterface {
    private settings: GameSettings
    private debug: DebugSettings

    // Game state constants - use the standardized ones from constants
    public readonly STATE = GAME_STATE

    // Optional properties added by performance optimization
    deviceTier?: string
    targetFPS?: number

    constructor({ isDesktop = false }: { isDesktop?: boolean } = {}) {
        const params = new URLSearchParams(window.location.search)
        const debugFlag = params.get('debug') === 'true'

        this.settings = this.buildBaseSettings(isDesktop)
        this.debug = {
            enabled: debugFlag,
            showCollisions: debugFlag,
            showFPS: debugFlag,
        }
    }

    private buildBaseSettings(isDesktop: boolean): GameSettings {
        const base = {
            WINNING_LINE: GAME.WINNING_LINE,
            BASE_SPEED: OBSTACLE.BASE_SPEED,
            PLAYER_SIZE_RATIO: PLAYER.SIZE_RATIO,
            MIN_STEP: PLAYER.MIN_STEP,
            OBSTACLE_MIN_WIDTH_RATIO: OBSTACLE.MIN_WIDTH_RATIO,
            OBSTACLE_MAX_WIDTH_RATIO: OBSTACLE.MAX_WIDTH_RATIO,
            MAX_CARS: GAME.MAX_OBSTACLES,
            DIFFICULTY_INCREASE_RATE: GAME.DIFFICULTY_INCREASE_RATE,
        }
        return isDesktop ? { ...base, ...DESKTOP_SETTINGS } : base
    }

    setDesktopMode(isDesktop: boolean): void {
        this.settings = this.buildBaseSettings(isDesktop)
    }

    getWinningLine(canvasHeight?: number, baseCanvasHeight?: number): number {
        const winningLine = this.settings.WINNING_LINE

        if (canvasHeight && baseCanvasHeight) {
            return winningLine * (canvasHeight / baseCanvasHeight)
        }

        return winningLine
    }

    getBaseSpeed(): number {
        return this.settings.BASE_SPEED
    }

    getMinStep(): number {
        return this.settings.MIN_STEP
    }

    getPlayerSizeRatio(): number {
        return this.settings.PLAYER_SIZE_RATIO
    }

    getObstacleMinWidthRatio(): number {
        return this.settings.OBSTACLE_MIN_WIDTH_RATIO
    }

    getObstacleMaxWidthRatio(): number {
        return this.settings.OBSTACLE_MAX_WIDTH_RATIO
    }

    getMaxCars(): number {
        return this.settings.MAX_CARS
    }

    getMinObstacles(): number {
        return Math.floor(this.settings.MAX_CARS / 2)
    }

    getDifficultyIncreaseRate(): number {
        return this.settings.DIFFICULTY_INCREASE_RATE
    }

    getDeviceTier(): string | undefined {
        return this.deviceTier
    }

    getTargetFPS(): number | undefined {
        return this.targetFPS
    }

    isDebugEnabled(): boolean {
        return this.debug.enabled
    }

    showCollisions(): boolean {
        return this.debug.showCollisions
    }

    // FIXED: Return mutable string arrays instead of readonly
    getKeys(): Record<string, string[]> {
        const keys = KEYS as any
        return {
            UP: [...keys.UP],
            DOWN: [...keys.DOWN],
            LEFT: [...keys.LEFT],
            RIGHT: [...keys.RIGHT],
            RESTART: [...keys.RESTART],
            SHOOT: [...keys.SHOOT]
        }
    }
}