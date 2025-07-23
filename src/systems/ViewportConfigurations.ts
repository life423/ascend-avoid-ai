/**
 * Viewport Configurations for UnifiedResponsiveSystem
 * 
 * These configurations are like "presets" for different device scenarios.
 * Instead of scattered if-statements, all responsive behavior is defined here as data.
 */

import type { ViewportConfig } from './UnifiedResponsiveSystem'

/**
 * Define all possible viewport configurations
 * Order matters - first matching configuration wins
 */
export const VIEWPORT_CONFIGS: ViewportConfig[] = [
    // Phone Portrait - Optimized for one-handed play
    {
        name: 'phone-portrait',
        test: (v) => v.screenType === 'phone' && v.orientation === 'portrait',
        className: 'viewport-phone-portrait',
        canvasStrategy: {
            maxWidth: 400,
            maxHeight: 600,
            scalingMode: 'fit',
            maintainAspectRatio: true,
            targetAspectRatio: 3/4  // Slightly taller for portrait
        },
        controlLayout: {
            position: 'bottom',
            size: 'normal',     // Not too small for thumbs
            opacity: 0.85,
            hapticFeedback: true
        },
        performanceProfile: {
            targetFPS: 60,
            particleLimit: 100,
            shadowQuality: 'off',
            effectsEnabled: false,
            adaptiveQuality: true
        }
    },
    
    // Phone Landscape - Two-thumb gaming
    {
        name: 'phone-landscape',
        test: (v) => v.screenType === 'phone' && v.orientation === 'landscape',
        className: 'viewport-phone-landscape',
        canvasStrategy: {
            maxWidth: 800,
            maxHeight: 400,
            scalingMode: 'fill',
            maintainAspectRatio: true,
            targetAspectRatio: 16/9
        },
        controlLayout: {
            position: 'sides',    // Controls on left and right
            size: 'compact',
            opacity: 0.7,
            hapticFeedback: true
        },
        performanceProfile: {
            targetFPS: 60,
            particleLimit: 150,
            shadowQuality: 'off',
            effectsEnabled: true,
            adaptiveQuality: true
        }
    },
    
    // Tablet - Balanced for larger touch targets
    {
        name: 'tablet',
        test: (v) => v.screenType === 'tablet',
        className: 'viewport-tablet',
        canvasStrategy: {
            maxWidth: 1024,
            maxHeight: 768,
            scalingMode: 'fit',
            maintainAspectRatio: true,
            targetAspectRatio: 4/3
        },
        controlLayout: {
            position: 'bottom',
            size: 'large',
            opacity: 0.8,
            hapticFeedback: true
        },
        performanceProfile: {
            targetFPS: 60,
            particleLimit: 300,
            shadowQuality: 'low',
            effectsEnabled: true,
            adaptiveQuality: true
        }
    },
    
    // Desktop - Full quality, keyboard controls
    {
        name: 'desktop',
        test: (v) => v.screenType === 'desktop',
        className: 'viewport-desktop',
        canvasStrategy: {
            maxWidth: 1200,
            maxHeight: 800,
            scalingMode: 'pixel-perfect',
            maintainAspectRatio: true,
            targetAspectRatio: 16/10
        },
        controlLayout: {
            position: 'hidden',   // No touch controls on desktop
            size: 'normal',
            opacity: 0,
            hapticFeedback: false
        },
        performanceProfile: {
            targetFPS: 144,       // Support high refresh rate monitors
            particleLimit: 500,
            shadowQuality: 'high',
            effectsEnabled: true,
            adaptiveQuality: false  // Desktop can handle full quality
        }
    },
    
    // TV/Large Display - Optimized for distance viewing
    {
        name: 'tv',
        test: (v) => v.screenType === 'tv',
        className: 'viewport-tv',
        canvasStrategy: {
            maxWidth: 1920,
            maxHeight: 1080,
            scalingMode: 'fit',
            maintainAspectRatio: true,
            targetAspectRatio: 16/9
        },
        controlLayout: {
            position: 'hidden',   // Assume gamepad or remote
            size: 'normal',
            opacity: 0,
            hapticFeedback: false
        },
        performanceProfile: {
            targetFPS: 60,        // Most TVs are 60Hz
            particleLimit: 1000,  // Can handle more particles on big screen
            shadowQuality: 'high',
            effectsEnabled: true,
            adaptiveQuality: false
        }
    }
]

/**
 * Default configuration if no others match
 * This should never happen if configs are comprehensive
 */
export const DEFAULT_CONFIG: ViewportConfig = {
    name: 'fallback',
    test: () => true,  // Always matches
    className: 'viewport-fallback',
    canvasStrategy: {
        maxWidth: 800,
        maxHeight: 600,
        scalingMode: 'fit',
        maintainAspectRatio: true,
        targetAspectRatio: 4/3
    },
    controlLayout: {
        position: 'bottom',
        size: 'normal',
        opacity: 0.8,
        hapticFeedback: false
    },
    performanceProfile: {
        targetFPS: 60,
        particleLimit: 200,
        shadowQuality: 'low',
        effectsEnabled: true,
        adaptiveQuality: true
    }
}