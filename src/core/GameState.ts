/**
 * Centralized Game State Management
 * Provides immutable state updates and subscription system for game state changes
 */

import { EventBus } from './EventBus';

export interface PlayerState {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    health: number;
    score: number;
    isAlive: boolean;
    lastShot: number;
}

export interface EntityState {
    id: string;
    type: 'obstacle' | 'projectile' | 'particle' | 'powerup';
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    velocity?: { x: number; y: number };
    data?: Record<string, any>; // Additional entity-specific data
}

export interface MultiplayerState {
    connected: boolean;
    roomId?: string;
    hostId?: string;
    players: Map<string, PlayerState>;
    latency: number;
    lastSync: number;
}

export interface GameStateData {
    // Core game state
    score: number;
    highScore: number;
    gameMode: 'singlePlayer' | 'multiplayer';
    gamePhase: 'menu' | 'loading' | 'playing' | 'paused' | 'gameOver' | 'complete';
    
    // Player state
    player: PlayerState;
    
    // Entity management
    entities: Map<string, EntityState>;
    entityCounter: number;
    
    // Multiplayer state
    multiplayer: MultiplayerState;
    
    // Performance and timing
    lastUpdateTime: number;
    totalPlayTime: number;
    
    // Settings and preferences
    settings: {
        soundEnabled: boolean;
        musicEnabled: boolean;
        difficulty: 'easy' | 'normal' | 'hard';
        debugMode: boolean;
    };
}

export type GameStateEvent = 
    | 'state:updated'
    | 'score:changed'
    | 'highScore:updated'
    | 'player:moved'
    | 'player:died'
    | 'entity:added'
    | 'entity:removed'
    | 'entity:updated'
    | 'game:phaseChanged'
    | 'multiplayer:connected'
    | 'multiplayer:disconnected'
    | 'settings:changed';

export class GameState {
    private state: GameStateData;
    private eventBus: EventBus;
    private history: GameStateData[] = [];
    private maxHistorySize = 10;

    constructor(eventBus?: EventBus) {
        this.eventBus = eventBus || new EventBus();
        this.state = this.createInitialState();
    }

    /**
     * Create the initial game state
     */
    private createInitialState(): GameStateData {
        return {
            score: 0,
            highScore: this.loadHighScore(),
            gameMode: 'singlePlayer',
            gamePhase: 'menu',
            
            player: {
                id: 'local_player',
                x: 0,
                y: 0,
                width: 40,
                height: 40,
                health: 100,
                score: 0,
                isAlive: true,
                lastShot: 0,
            },
            
            entities: new Map(),
            entityCounter: 0,
            
            multiplayer: {
                connected: false,
                players: new Map(),
                latency: 0,
                lastSync: 0,
            },
            
            lastUpdateTime: 0,
            totalPlayTime: 0,
            
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                difficulty: 'normal',
                debugMode: false,
            },
        };
    }

    /**
     * Get the current state (immutable)
     */
    getState(): Readonly<GameStateData> {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Get a specific part of the state
     */
    getPlayer(): Readonly<PlayerState> {
        return { ...this.state.player };
    }

    getEntities(): ReadonlyMap<string, EntityState> {
        return new Map(this.state.entities);
    }

    getEntity(id: string): EntityState | undefined {
        return this.state.entities.get(id);
    }

    getMultiplayerState(): Readonly<MultiplayerState> {
        return {
            ...this.state.multiplayer,
            players: new Map(this.state.multiplayer.players),
        };
    }

    getSettings(): Readonly<typeof this.state.settings> {
        return { ...this.state.settings };
    }

    /**
     * Update the entire state (use sparingly)
     */
    updateState(updates: Partial<GameStateData>): void {
        this.saveToHistory();
        this.state = { ...this.state, ...updates };
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Update player state
     */
    updatePlayer(updates: Partial<PlayerState>): void {
        this.saveToHistory();
        this.state.player = { ...this.state.player, ...updates };
        this.emitEvent('player:moved', this.state.player);
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Update player position
     */
    updatePlayerPosition(x: number, y: number): void {
        this.saveToHistory();
        this.state.player.x = x;
        this.state.player.y = y;
        this.emitEvent('player:moved', { x, y });
    }

    /**
     * Update score
     */
    updateScore(score: number): void {
        const oldScore = this.state.score;
        this.saveToHistory();
        this.state.score = score;
        this.state.player.score = score;
        
        this.emitEvent('score:changed', { oldScore, newScore: score });
        
        // Check for new high score
        if (score > this.state.highScore) {
            this.updateHighScore(score);
        }
        
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Add points to current score
     */
    addScore(points: number): void {
        this.updateScore(this.state.score + points);
    }

    /**
     * Update high score
     */
    updateHighScore(highScore: number): void {
        this.saveToHistory();
        this.state.highScore = highScore;
        this.saveHighScore(highScore);
        this.emitEvent('highScore:updated', highScore);
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Change game phase
     */
    setGamePhase(phase: GameStateData['gamePhase']): void {
        const oldPhase = this.state.gamePhase;
        this.saveToHistory();
        this.state.gamePhase = phase;
        this.emitEvent('game:phaseChanged', { oldPhase, newPhase: phase });
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Entity management
     */
    addEntity(entityData: Omit<EntityState, 'id'>): string {
        this.saveToHistory();
        const id = `entity_${this.state.entityCounter++}`;
        const entity: EntityState = { ...entityData, id };
        this.state.entities.set(id, entity);
        this.emitEvent('entity:added', entity);
        this.emitEvent('state:updated', this.state);
        return id;
    }

    updateEntity(id: string, updates: Partial<EntityState>): boolean {
        const entity = this.state.entities.get(id);
        if (!entity) return false;

        this.saveToHistory();
        this.state.entities.set(id, { ...entity, ...updates });
        this.emitEvent('entity:updated', { id, entity: this.state.entities.get(id) });
        this.emitEvent('state:updated', this.state);
        return true;
    }

    removeEntity(id: string): boolean {
        if (!this.state.entities.has(id)) return false;

        this.saveToHistory();
        const entity = this.state.entities.get(id);
        this.state.entities.delete(id);
        this.emitEvent('entity:removed', { id, entity });
        this.emitEvent('state:updated', this.state);
        return true;
    }

    clearEntities(type?: EntityState['type']): void {
        this.saveToHistory();
        
        if (type) {
            // Remove only entities of specific type
            const toRemove: string[] = [];
            this.state.entities.forEach((entity, id) => {
                if (entity.type === type) {
                    toRemove.push(id);
                }
            });
            toRemove.forEach(id => this.state.entities.delete(id));
        } else {
            // Remove all entities
            this.state.entities.clear();
        }
        
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Multiplayer state management
     */
    setMultiplayerConnected(connected: boolean, roomId?: string): void {
        this.saveToHistory();
        this.state.multiplayer.connected = connected;
        if (roomId) {
            this.state.multiplayer.roomId = roomId;
        }
        
        this.emitEvent(connected ? 'multiplayer:connected' : 'multiplayer:disconnected', 
                     this.state.multiplayer);
        this.emitEvent('state:updated', this.state);
    }

    addRemotePlayer(player: PlayerState): void {
        this.saveToHistory();
        this.state.multiplayer.players.set(player.id, player);
        this.emitEvent('state:updated', this.state);
    }

    updateRemotePlayer(id: string, updates: Partial<PlayerState>): boolean {
        const player = this.state.multiplayer.players.get(id);
        if (!player) return false;

        this.saveToHistory();
        this.state.multiplayer.players.set(id, { ...player, ...updates });
        this.emitEvent('state:updated', this.state);
        return true;
    }

    removeRemotePlayer(id: string): boolean {
        if (!this.state.multiplayer.players.has(id)) return false;

        this.saveToHistory();
        this.state.multiplayer.players.delete(id);
        this.emitEvent('state:updated', this.state);
        return true;
    }

    /**
     * Settings management
     */
    updateSettings(updates: Partial<typeof this.state.settings>): void {
        this.saveToHistory();
        this.state.settings = { ...this.state.settings, ...updates };
        this.emitEvent('settings:changed', this.state.settings);
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Reset game state
     */
    reset(keepSettings = true): void {
        const currentHighScore = this.state.highScore;
        const currentSettings = this.state.settings;
        
        this.saveToHistory();
        this.state = this.createInitialState();
        this.state.highScore = currentHighScore;
        
        if (keepSettings) {
            this.state.settings = currentSettings;
        }
        
        this.emitEvent('state:updated', this.state);
    }

    /**
     * Event system
     */
    on(event: GameStateEvent, callback: (data: any) => void): () => void {
        return this.eventBus.on(event, callback);
    }

    once(event: GameStateEvent, callback: (data: any) => void): () => void {
        return this.eventBus.once(event, callback);
    }

    off(event: GameStateEvent, callback: (data: any) => void): void {
        this.eventBus.off(event, callback);
    }

    private emitEvent(event: GameStateEvent, data: any): void {
        this.eventBus.emit(event, data);
    }

    /**
     * History management for debugging and undo functionality
     */
    private saveToHistory(): void {
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    getHistory(): GameStateData[] {
        return [...this.history];
    }

    canUndo(): boolean {
        return this.history.length > 0;
    }

    undo(): boolean {
        if (!this.canUndo()) return false;

        const previousState = this.history.pop();
        if (previousState) {
            this.state = previousState;
            this.emitEvent('state:updated', this.state);
            return true;
        }
        return false;
    }

    /**
     * Persistence
     */
    private loadHighScore(): number {
        try {
            const saved = localStorage.getItem('ascendAvoidHighScore');
            return saved ? parseInt(saved, 10) || 0 : 0;
        } catch {
            return 0;
        }
    }

    private saveHighScore(score: number): void {
        try {
            localStorage.setItem('ascendAvoidHighScore', score.toString());
        } catch (error) {
            console.warn('Could not save high score:', error);
        }
    }

    /**
     * Serialization for saving/loading game state
     */
    serialize(): string {
        const serializableState = {
            ...this.state,
            entities: Array.from(this.state.entities.entries()),
            multiplayer: {
                ...this.state.multiplayer,
                players: Array.from(this.state.multiplayer.players.entries()),
            },
        };
        return JSON.stringify(serializableState);
    }

    deserialize(data: string): boolean {
        try {
            const parsed = JSON.parse(data);
            
            // Restore Maps
            const entities = new Map(parsed.entities);
            const multiplayerPlayers = new Map(parsed.multiplayer.players);
            
            this.saveToHistory();
            this.state = {
                ...parsed,
                entities,
                multiplayer: {
                    ...parsed.multiplayer,
                    players: multiplayerPlayers,
                },
            };
            
            this.emitEvent('state:updated', this.state);
            return true;
        } catch (error) {
            console.error('Failed to deserialize game state:', error);
            return false;
        }
    }

    /**
     * Debug utilities
     */
    getDiagnostics() {
        return {
            stateSize: JSON.stringify(this.state).length,
            entityCount: this.state.entities.size,
            multiplayerPlayerCount: this.state.multiplayer.players.size,
            historySize: this.history.length,
            lastUpdate: this.state.lastUpdateTime,
        };
    }

    dispose(): void {
        this.history = [];
        this.eventBus.dispose();
    }
}

export default GameState;
