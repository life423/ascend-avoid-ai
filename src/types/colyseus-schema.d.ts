// Type definitions for Colyseus schema objects received from server
// These match the server-side schema definitions

export interface PlayerSchema {
    sessionId: string
    playerIndex: number
    name: string
    x: number
    y: number
    width: number
    height: number
    state: 'alive' | 'dead' | 'spectating'
    score: number
    upKey: boolean
    downKey: boolean
    leftKey: boolean
    rightKey: boolean
    lastUpdateTime: number
}

export interface ObstacleSchema {
    id: number
    x: number
    y: number
    type: string
    speed: number
    width: number
    height: number
    isActive: boolean
}

export interface GameStateSchema {
    gameState: 'waiting' | 'starting' | 'playing' | 'gameOver'
    elapsedTime: number
    startTime: number
    countdownTime: number
    arenaWidth: number
    arenaHeight: number
    areaPercentage: number
    nextShrinkTime: number
    players: Map<string, PlayerSchema>
    obstacles: ObstacleSchema[]
    aliveCount: number
    totalPlayers: number
    winnerName: string
    lastUpdateTime: number
}

// Schema change event types
export interface SchemaChange {
    field: string
    value: any
    previousValue: any
}

// Colyseus MapSchema methods
export interface MapSchemaCallbacks<T> {
    onAdd?: (item: T, key: string) => void
    onRemove?: (item: T, key: string) => void
    onChange?: (item: T, key: string) => void
}

// Colyseus ArraySchema methods
export interface ArraySchemaCallbacks<T> {
    onAdd?: (item: T, index: number) => void
    onRemove?: (item: T, index: number) => void
    onChange?: (item: T, index: number) => void
}