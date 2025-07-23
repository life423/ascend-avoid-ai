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
     * Connect to the game server
     */
    async connect(): Promise<boolean> {
        if (this.isConnecting || this.room) {
            console.warn('Already connected or connecting');
            return false;
        }

        this.isConnecting = true;
        
        try {
            const wsUrl = this.getWebSocketUrl();
            console.log('Connecting to server:', wsUrl);
            
            // Create Colyseus client
            this.client = new Client(wsUrl);
            
            // Get available rooms (optional, for debugging)
            try {
                const rooms = await this.client.getAvailableRooms(GAME_CONFIG.ROOM_NAME);
                console.log('Available rooms:', rooms);
            } catch (e) {
                console.log('Could not fetch available rooms (this is okay):', e);
            }
            
            // Join or create room
            this.room = await this.client.joinOrCreate(GAME_CONFIG.ROOM_NAME, {
                playerName: this.getPlayerName(),
                width: window.innerWidth,
                height: window.innerHeight
            });
            
            console.log('Successfully joined room:', this.room.id);
            
            // Set up room event handlers
            this.setupRoomHandlers();
            
            // Emit connection success
            this.eventBus.emit(GameEvents.MULTIPLAYER_CONNECTED, {
                roomId: this.room.id,
                sessionId: this.room.sessionId
            });
            
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            return true;
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.isConnecting = false;
            
            // Emit connection error
            this.eventBus.emit(GameEvents.MULTIPLAYER_ERROR, {
                type: 'connection',
                message: error instanceof Error ? error.message : 'Connection failed'
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
        if (!this.room) return;

        // Handle state changes
        this.room.onStateChange((state) => {
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
