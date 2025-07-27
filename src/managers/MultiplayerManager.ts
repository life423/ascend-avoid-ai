import { Client, Room } from 'colyseus.js';
import { EventBus } from '../core/EventBus';
import AssetManager from './AssetManager';
import { GAME_CONFIG, GameEvents } from '../constants/client-constants';

export class MultiplayerManager {
    private client: Client | null = null;
    private room: Room | null = null;
    private eventBus: EventBus;
    // private _assetManager: AssetManager; // Removed unused property
    private isConnecting: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 3;

    constructor(eventBus: EventBus, _assetManager: AssetManager) {
        this.eventBus = eventBus;
        // this._assetManager = assetManager; // Removed unused assignment
    }

    /**
     * Get WebSocket URL based on environment
     */
    private getWebSocketUrl(): string {
        // Check if we're in production (built version)
        // Use a more reliable way to detect production
        const isProd = process.env.NODE_ENV === 'production' || 
                      (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD);
        
        if (isProd) {
            // In production, use same origin as the page
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            console.log(`Production WebSocket URL: ${protocol}//${host}`);
            return `${protocol}//${host}`;
        } else {
            // In development, use localhost:3000
            console.log('Development WebSocket URL: ws://localhost:3000');
            return 'ws://localhost:3000';
        }
    }

    /**
     * Create a promise that rejects after a timeout
     */
    private createTimeoutPromise(timeoutMs: number): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs);
        });
    }

    /**
     * Attempt connection to the server
     */
    private async attemptConnection(wsUrl: string): Promise<void> {
        // Create Colyseus client
        this.client = new Client(wsUrl);
        
        // Get available rooms (optional, for debugging)
        try {
            const rooms = await this.client.getAvailableRooms(GAME_CONFIG.ROOM_NAME);
            console.log('📋 Available rooms:', rooms);
        } catch (e) {
            console.log('⚠️ Could not fetch available rooms (this is okay):', e);
        }
        
        // Join or create room
        this.room = await this.client.joinOrCreate(GAME_CONFIG.ROOM_NAME, {
            playerName: this.getPlayerName(),
            width: window.innerWidth,
            height: window.innerHeight
        });
        
        console.log('✅ Successfully joined room:', this.room.id);
    }

    /**
     * Connect to the game server with timeout
     */
    async connect(): Promise<boolean> {
        if (this.isConnecting || this.room) {
            console.warn('Already connected or connecting');
            return false;
        }

        this.isConnecting = true;
        const CONNECTION_TIMEOUT = 10000; // 10 seconds timeout
        
        try {
            const wsUrl = this.getWebSocketUrl();
            console.log('🔌 Connecting to server:', wsUrl);
            
            // Create connection promise with timeout
            const connectionPromise = this.attemptConnection(wsUrl);
            const timeoutPromise = this.createTimeoutPromise(CONNECTION_TIMEOUT);
            
            // Race connection against timeout
            await Promise.race([connectionPromise, timeoutPromise]);
            
            // Verify room was created successfully
            if (!this.room) {
                throw new Error('Room connection failed - no room instance created');
            }
            
            // Set up room event handlers
            this.setupRoomHandlers();
            
            // Emit connection success
            const room = this.room as any; // Type assertion for Colyseus room
            this.eventBus.emit(GameEvents.MULTIPLAYER_CONNECTED, {
                roomId: room.id,
                sessionId: room.sessionId
            });
            
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            return true;
            
        } catch (error) {
            console.error('🚨 Connection failed:', error);
            this.isConnecting = false;
            
            // Determine error type and message
            let errorMessage = 'Connection failed';
            let errorType = 'connection';
            
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    errorType = 'timeout';
                    errorMessage = 'Connection timed out. Make sure the game server is running.';
                } else if (error.message.includes('ECONNREFUSED')) {
                    errorType = 'refused';
                    errorMessage = 'Could not connect to game server. Please check if server is running on port 3000.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            // Emit connection error with detailed info
            this.eventBus.emit(GameEvents.MULTIPLAYER_ERROR, {
                type: errorType,
                message: errorMessage
            });
            
            // Try to reconnect if not at max attempts
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
            }
            
            return false;
        }
    }

    /**
     * Set up room event handlers
     */
    private setupRoomHandlers(): void {
        if (!this.room) {
            console.error('❌ Cannot setup room handlers - no room instance');
            return;
        }

        console.log('🔧 Setting up room event handlers...');

        // Handle state changes
        this.room.onStateChange((state) => {
            console.log('📡 Room state changed:', state);
            this.eventBus.emit(GameEvents.MULTIPLAYER_STATE_UPDATE, state);
        });

        // Handle messages from server
        this.room.onMessage('playerJoined', (data) => {
            console.log('Player joined:', data);
            this.eventBus.emit(GameEvents.PLAYER_JOINED, data);
        });

        this.room.onMessage('playerLeft', (data) => {
            console.log('Player left:', data);
            this.eventBus.emit(GameEvents.PLAYER_LEFT, data);
        });

        this.room.onMessage('gameStart', (data) => {
            console.log('Game starting:', data);
            this.eventBus.emit(GameEvents.GAME_START, data);
        });

        this.room.onMessage('gameOver', (data) => {
            console.log('Game over:', data);
            this.eventBus.emit(GameEvents.GAME_OVER, data);
        });

        // Handle errors
        this.room.onError((code, message) => {
            console.error('Room error:', code, message);
            this.eventBus.emit(GameEvents.MULTIPLAYER_ERROR, {
                type: 'room',
                code,
                message
            });
        });

        // Handle disconnect
        this.room.onLeave((code) => {
            console.log('Left room:', code);
            this.eventBus.emit(GameEvents.MULTIPLAYER_DISCONNECTED, { code });
            this.room = null;
            this.client = null;
        });
    }

    /**
     * Send player input to server
     */
    sendInput(input: any): void {
        if (!this.room) {
            console.warn('Not connected to room');
            return;
        }

        this.room.send('input', input);
    }

    /**
     * Send custom message to server
     */
    sendMessage(type: string, data: any): void {
        if (!this.room) {
            console.warn('Not connected to room');
            return;
        }

        this.room.send(type, data);
    }

    /**
     * Get local player data
     */
    getLocalPlayer(): any {
        if (!this.room || !this.room.state) {
            return null;
        }
        
        // Return the player with our session ID
        const players = this.room.state.players;
        if (players && this.room.sessionId) {
            return players.get(this.room.sessionId);
        }
        
        return null;
    }

    /**
     * Get remote players (all players except local)
     */
    getRemotePlayers(): Record<string, any> {
        const remotePlayers: Record<string, any> = {};
        
        if (!this.room || !this.room.state) {
            return remotePlayers;
        }
        
        const players = this.room.state.players;
        if (players) {
            players.forEach((player: any, sessionId: string) => {
                // Exclude our own player
                if (sessionId !== this.room?.sessionId) {
                    remotePlayers[sessionId] = player;
                }
            });
        }
        
        return remotePlayers;
    }

    /**
     * Disconnect from server
     */
    disconnect(): void {
        if (this.room) {
            this.room.leave();
            this.room = null;
        }
        
        if (this.client) {
            this.client = null;
        }
        
        this.isConnecting = false;
        this.reconnectAttempts = 0;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.room !== null && this.room.connection.isOpen;
    }

    /**
     * Get current room
     */
    getRoom(): Room | null {
        return this.room;
    }

    /**
     * Get player name from storage or generate
     */
    private getPlayerName(): string {
        // Try to get from sessionStorage first (persists during session)
        let playerName = sessionStorage.getItem('playerName');
        
        if (!playerName) {
            // Generate a random name
            playerName = `Player${Math.floor(Math.random() * 10000)}`;
            sessionStorage.setItem('playerName', playerName);
        }
        
        return playerName;
    }

    /**
     * Update player name
     */
    updatePlayerName(name: string): void {
        sessionStorage.setItem('playerName', name);
        
        if (this.room) {
            this.room.send('updateName', { name });
        }
    }
}
