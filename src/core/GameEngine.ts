/**
 * Game Engine - Core game loop and timing management
 * Handles the main game loop, frame timing, and system coordination
 */

import { EventBus } from './EventBus';
import { Initializable } from './ServiceLocator';

export interface GameEngineConfig {
    targetFPS?: number;
    maxDeltaTime?: number;
    enableVSync?: boolean;
    enablePerformanceMonitoring?: boolean;
}

export interface FrameData {
    deltaTime: number;
    timestamp: number;
    frameNumber: number;
    fps: number;
}

export interface PerformanceMetrics {
    avgFrameTime: number;
    minFrameTime: number;
    maxFrameTime: number;
    avgFPS: number;
    frameCount: number;
    lastUpdateTime: number;
}

export type GameEngineState = 'stopped' | 'starting' | 'running' | 'paused' | 'stopping';

export class GameEngine implements Initializable {
    private state: GameEngineState = 'stopped';
    private frameId = 0;
    private lastTimestamp = 0;
    private frameNumber = 0;
    
    // Configuration
    private config: Required<GameEngineConfig>;
    
    // Performance monitoring
    private frameTimes: number[] = [];
    private frameTimeIndex = 0;
    private performanceWindow = 60; // Track last 60 frames
    private performanceMetrics: PerformanceMetrics;
    
    // Event system
    private eventBus: EventBus;
    
    // Delta time smoothing
    private deltaHistory: number[] = [];
    private deltaHistorySize = 10;
    
    constructor(eventBus: EventBus, config: GameEngineConfig = {}) {
        this.eventBus = eventBus;
        
        // Default configuration
        this.config = {
            targetFPS: config.targetFPS || 60,
            maxDeltaTime: config.maxDeltaTime || 0.1, // Cap at 100ms
            enableVSync: config.enableVSync !== false, // Default true
            enablePerformanceMonitoring: config.enablePerformanceMonitoring !== false, // Default true
        };
        
        // Initialize performance metrics
        this.performanceMetrics = {
            avgFrameTime: 0,
            minFrameTime: Infinity,
            maxFrameTime: 0,
            avgFPS: 0,
            frameCount: 0,
            lastUpdateTime: 0,
        };
        
        // Initialize frame time tracking
        this.frameTimes = new Array(this.performanceWindow).fill(0);
        
        // Bind methods to preserve context
        this.gameLoop = this.gameLoop.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Setup page visibility handling
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
        }
    }

    async initialize(): Promise<void> {
        console.log('GameEngine: Initializing...');
        
        // Reset state
        this.frameNumber = 0;
        this.lastTimestamp = 0;
        this.frameTimeIndex = 0;
        this.frameTimes.fill(0);
        this.deltaHistory = [];
        
        // Reset performance metrics
        this.performanceMetrics = {
            avgFrameTime: 0,
            minFrameTime: Infinity,
            maxFrameTime: 0,
            avgFPS: 0,
            frameCount: 0,
            lastUpdateTime: 0,
        };
        
        console.log(`GameEngine: Initialized with target FPS: ${this.config.targetFPS}`);
    }

    /**
     * Start the game engine
     */
    start(): void {
        if (this.state === 'running') {
            console.warn('GameEngine: Already running');
            return;
        }
        
        if (this.state === 'paused') {
            this.resume();
            return;
        }
        
        console.log('GameEngine: Starting...');
        this.state = 'starting';
        
        // Reset timing
        this.lastTimestamp = performance.now();
        this.frameNumber = 0;
        
        // Emit start event
        this.eventBus.emit('engine:starting');
        
        // Start the game loop
        this.state = 'running';
        this.frameId = requestAnimationFrame(this.gameLoop);
        
        this.eventBus.emit('engine:started');
        console.log('GameEngine: Started');
    }

    /**
     * Pause the game engine
     */
    pause(): void {
        if (this.state !== 'running') {
            console.warn('GameEngine: Cannot pause - not running');
            return;
        }
        
        console.log('GameEngine: Pausing...');
        this.state = 'paused';
        
        // Cancel the current frame request
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = 0;
        }
        
        this.eventBus.emit('engine:paused');
        console.log('GameEngine: Paused');
    }

    /**
     * Resume the game engine from pause
     */
    resume(): void {
        if (this.state !== 'paused') {
            console.warn('GameEngine: Cannot resume - not paused');
            return;
        }
        
        console.log('GameEngine: Resuming...');
        
        // Reset timing to prevent large delta time jump
        this.lastTimestamp = performance.now();
        
        // Clear delta history to prevent smoothing issues
        this.deltaHistory = [];
        
        this.state = 'running';
        this.frameId = requestAnimationFrame(this.gameLoop);
        
        this.eventBus.emit('engine:resumed');
        console.log('GameEngine: Resumed');
    }

    /**
     * Stop the game engine
     */
    stop(): void {
        if (this.state === 'stopped') {
            console.warn('GameEngine: Already stopped');
            return;
        }
        
        console.log('GameEngine: Stopping...');
        this.state = 'stopping';
        
        // Cancel any pending frame request
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = 0;
        }
        
        this.state = 'stopped';
        
        this.eventBus.emit('engine:stopped');
        console.log('GameEngine: Stopped');
    }

    /**
     * Main game loop
     */
    private gameLoop(timestamp: number): void {
        // Check if we should continue running
        if (this.state !== 'running') {
            return;
        }

        // Calculate frame timing
        const frameData = this.calculateFrameData(timestamp);
        
        // Update performance metrics
        if (this.config.enablePerformanceMonitoring) {
            this.updatePerformanceMetrics(frameData);
        }
        
        try {
            // Emit pre-update event
            this.eventBus.emit('engine:preUpdate', frameData);
            
            // Emit main update event - systems will listen to this
            this.eventBus.emit('engine:update', frameData);
            
            // Emit post-update event
            this.eventBus.emit('engine:postUpdate', frameData);
            
            // Emit render event
            this.eventBus.emit('engine:render', frameData);
            
            // Emit post-render event for cleanup, debug overlays, etc.
            this.eventBus.emit('engine:postRender', frameData);
            
        } catch (error) {
            console.error('GameEngine: Error in game loop:', error);
            this.eventBus.emit('engine:error', { error, frameData });
            
            // Continue running even if there's an error
            // The error handling should be done by individual systems
        }
        
        // Increment frame counter
        this.frameNumber++;
        
        // Schedule next frame
        this.frameId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Calculate frame timing data with smoothing and capping
     */
    private calculateFrameData(timestamp: number): FrameData {
        // Calculate raw delta time
        let deltaTime = 0;
        if (this.lastTimestamp !== 0) {
            deltaTime = (timestamp - this.lastTimestamp) / 1000; // Convert to seconds
        }
        
        // Cap delta time to prevent large jumps when tab becomes active
        deltaTime = Math.min(deltaTime, this.config.maxDeltaTime);
        
        // Smooth delta time for more stable frame rates
        deltaTime = this.smoothDeltaTime(deltaTime);
        
        // Store this timestamp for next frame
        this.lastTimestamp = timestamp;
        
        // Calculate FPS
        const fps = deltaTime > 0 ? 1 / deltaTime : 0;
        
        return {
            deltaTime,
            timestamp,
            frameNumber: this.frameNumber,
            fps
        };
    }

    /**
     * Smooth delta time to reduce jitter
     */
    private smoothDeltaTime(deltaTime: number): number {
        // Add to history
        this.deltaHistory.push(deltaTime);
        if (this.deltaHistory.length > this.deltaHistorySize) {
            this.deltaHistory.shift();
        }
        
        // Return simple average for smoothing
        if (this.deltaHistory.length === 1) {
            return deltaTime;
        }
        
        const sum = this.deltaHistory.reduce((a, b) => a + b, 0);
        return sum / this.deltaHistory.length;
    }

    /**
     * Update performance metrics
     */
    private updatePerformanceMetrics(frameData: FrameData): void {
        const frameTime = frameData.deltaTime * 1000; // Convert to ms
        
        // Store frame time in circular buffer
        this.frameTimes[this.frameTimeIndex] = frameTime;
        this.frameTimeIndex = (this.frameTimeIndex + 1) % this.performanceWindow;
        
        this.performanceMetrics.frameCount++;
        
        // Update metrics every 60 frames
        if (this.performanceMetrics.frameCount % 60 === 0) {
            this.calculatePerformanceStats();
        }
    }

    /**
     * Calculate performance statistics
     */
    private calculatePerformanceStats(): void {
        const validTimes = this.frameTimes.filter(time => time > 0);
        if (validTimes.length === 0) return;
        
        // Calculate averages
        const sum = validTimes.reduce((a, b) => a + b, 0);
        this.performanceMetrics.avgFrameTime = sum / validTimes.length;
        this.performanceMetrics.avgFPS = 1000 / this.performanceMetrics.avgFrameTime;
        
        // Calculate min/max
        this.performanceMetrics.minFrameTime = Math.min(...validTimes);
        this.performanceMetrics.maxFrameTime = Math.max(...validTimes);
        this.performanceMetrics.lastUpdateTime = performance.now();
        
        // Emit performance data
        this.eventBus.emit('engine:performance', this.performanceMetrics);
    }

    /**
     * Handle page visibility changes
     */
    private handleVisibilityChange(): void {
        if (document.hidden) {
            if (this.state === 'running') {
                this.pause();
                this.eventBus.emit('engine:backgrounded');
            }
        } else {
            if (this.state === 'paused') {
                this.resume();
                this.eventBus.emit('engine:foregrounded');
            }
        }
    }

    /**
     * Get current performance metrics
     */
    getPerformanceMetrics(): Readonly<PerformanceMetrics> {
        return { ...this.performanceMetrics };
    }

    /**
     * Get current engine state
     */
    getState(): GameEngineState {
        return this.state;
    }

    /**
     * Update engine configuration
     */
    updateConfig(config: Partial<GameEngineConfig>): void {
        this.config = { ...this.config, ...config };
        console.log('GameEngine: Configuration updated', this.config);
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.stop();
        
        // Remove event listeners
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        }
        
        // Clear arrays
        this.frameTimes = [];
        this.deltaHistory = [];
        
        console.log('GameEngine: Disposed');
    }
}

export default GameEngine;
