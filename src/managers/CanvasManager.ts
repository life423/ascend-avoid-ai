/**
 * CanvasManager - Handles canvas sizing and responsiveness
 * Works with UnifiedResponsiveSystem to provide actual canvas resizing functionality
 * Replaces the canvas sizing logic that was lost from ResponsiveManager
 */
import { ResponsiveSystem } from '../systems/UnifiedResponsiveSystem';
import type { ViewportConfig, ViewportInfo } from '../systems/UnifiedResponsiveSystem';
import { CANVAS } from '../constants/gameConstants';
import { ScalingInfo } from '../types';

export class CanvasManager {
    private canvas: HTMLCanvasElement;
    private baseCanvasWidth: number;
    private baseCanvasHeight: number;
    private scalingInfo: ScalingInfo;
    private unsubscribe?: () => void;
    private onResizeCallback?: (scalingInfo: ScalingInfo) => void;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.baseCanvasWidth = CANVAS.BASE_WIDTH;
        this.baseCanvasHeight = CANVAS.BASE_HEIGHT;
        
        this.scalingInfo = {
            widthScale: 1,
            heightScale: 1,
            pixelRatio: window.devicePixelRatio || 1,
            reducedResolution: false,
        };

        this.init();
    }

    private init(): void {
        // Subscribe to responsive system updates
        this.unsubscribe = ResponsiveSystem.subscribe((config, info) => {
            this.handleResponsiveUpdate(config, info);
        });

        // Initial resize
        const initialInfo = ResponsiveSystem.getViewportInfo();
        this.resizeCanvas(initialInfo);
    }

    private handleResponsiveUpdate(config: ViewportConfig, info: ViewportInfo): void {
        this.resizeCanvas(info);
    }

    /**
     * Resize canvas based on viewport information
     * Restored from ResponsiveManager with modern adaptations
     */
    private resizeCanvas(info: ViewportInfo): void {
        if (!this.canvas) return;

        // Get the canvas viewport container
        const viewport = this.canvas.closest(
            '.canvas-viewport[data-viewport="main"]'
        ) as HTMLElement;
        if (!viewport) {
            console.warn('Canvas viewport container not found');
            return;
        }

        // Calculate available space based on device type
        let availableWidth: number;
        let availableHeight: number;

        if (info.screenType === 'desktop' || info.width >= 1024) {
            // Desktop: Calculate based on the CSS Grid layout
            const gameMain = document.querySelector(
                '.game-main[data-section="main"]'
            ) as HTMLElement | null;
            
            if (gameMain) {
                const gameMainRect = gameMain.getBoundingClientRect();
                const sidebarWidth = 280; // Fixed sidebar width from CSS
                const gridGap = 24; // CSS gap from --space-lg
                const padding = 32; // Main padding
                
                // Calculate available space for canvas (first grid column)
                availableWidth = Math.max(gameMainRect.width - sidebarWidth - gridGap - padding, 600);
                availableHeight = Math.max(gameMainRect.height - padding, 500);
                
                console.log(
                    `Desktop canvas sizing: ${availableWidth}x${availableHeight} available`
                );
            } else {
                // Fallback for desktop
                const sidebarWidth = 280;
                const gridGap = 24;
                const padding = 64;
                
                availableWidth = Math.max(info.width - sidebarWidth - gridGap - padding, 600);
                availableHeight = Math.max(info.height - 200, 500);
            }
        } else {
            // Mobile: Calculate based on actual layout structure
            const viewportRect = viewport.getBoundingClientRect();
            const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect()?.height || 60;
            const controlsHeight = document.querySelector('.control-panel')?.getBoundingClientRect()?.height || 120;
            const padding = 20;

            availableWidth = Math.max(viewportRect.width - padding, 280);
            availableHeight = Math.max(info.height - headerHeight - controlsHeight - padding, 200);

            console.log(
                `Mobile canvas sizing: ${availableWidth}x${availableHeight} available (header: ${headerHeight}px, controls: ${controlsHeight}px)`
            );
        }

        // Calculate scale to fit within available space
        const widthScale = availableWidth / this.baseCanvasWidth;
        const heightScale = availableHeight / this.baseCanvasHeight;
        const scale = Math.min(widthScale, heightScale);

        // Calculate final canvas dimensions
        const canvasWidth = Math.floor(this.baseCanvasWidth * scale);
        const canvasHeight = Math.floor(this.baseCanvasHeight * scale);

        // Ensure minimum playable size
        const minWidth = info.screenType === 'desktop' ? 600 : 280;
        const minHeight = info.screenType === 'desktop' ? 500 : 200;

        const finalCanvasWidth = Math.max(canvasWidth, minWidth);
        const finalCanvasHeight = Math.max(canvasHeight, minHeight);

        // Apply dimensions to canvas
        this.canvas.style.width = `${finalCanvasWidth}px`;
        this.canvas.style.height = `${finalCanvasHeight}px`;
        this.canvas.width = finalCanvasWidth * info.pixelRatio;
        this.canvas.height = finalCanvasHeight * info.pixelRatio;

        // Scale the drawing context for high-DPI displays
        const ctx = this.canvas.getContext('2d');
        if (ctx && info.pixelRatio !== 1) {
            ctx.scale(info.pixelRatio, info.pixelRatio);
        }

        // Update scaling info
        this.scalingInfo = {
            widthScale: finalCanvasWidth / this.baseCanvasWidth,
            heightScale: finalCanvasHeight / this.baseCanvasHeight,
            pixelRatio: info.pixelRatio,
            reducedResolution: info.pixelRatio < 1.5,
        };

        console.log(
            `Canvas resized: ${finalCanvasWidth}×${finalCanvasHeight} (scale: ${this.scalingInfo.widthScale.toFixed(2)})`
        );

        // Notify callback if set
        if (this.onResizeCallback) {
            this.onResizeCallback(this.scalingInfo);
        }
    }

    /**
     * Set callback for resize events
     */
    public onResize(callback: (scalingInfo: ScalingInfo) => void): void {
        this.onResizeCallback = callback;
    }

    /**
     * Get current scaling information
     */
    public getScalingInfo(): ScalingInfo {
        return { ...this.scalingInfo };
    }

    /**
     * Force a resize update
     */
    public forceResize(): void {
        const info = ResponsiveSystem.getViewportInfo();
        this.resizeCanvas(info);
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}