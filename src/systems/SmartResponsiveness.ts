/**
 * SmartResponsiveness - Neural Network Foundation for Responsive Design
 * 
 * Step 1: Smart Button Size Optimization
 * - Collects touch interaction data
 * - Learns optimal button sizes for different devices
 * - Makes real-time adjustments without breakpoints
 */

// Neural network-based button optimization system

export interface TouchInteractionData {
    buttonId: string
    timestamp: number
    accuracy: number        // How close to center of button (0-1)
    pressureDuration: number // How long the press lasted
    deviceInfo: {
        diagonal: number
        screenType: string
        isTouch: boolean
    }
    currentButtonSize: number
    wasSuccessful: boolean  // Did the touch register correctly
}

export interface ButtonOptimizationState {
    buttonId: string
    currentSize: number
    optimalSize: number
    confidence: number      // How confident we are in optimal size (0-1)
    interactionCount: number
    successRate: number
    averageAccuracy: number
    lastUpdated: number
}

export interface SmartResponsivenessConfig {
    enabled: boolean
    learningRate: number    // How quickly to adapt (0-1)
    minButtonSize: number
    maxButtonSize: number
    dataRetentionMs: number // How long to keep interaction data
    adaptationThreshold: number // Minimum interactions before adapting
}

export class SmartResponsiveness {
    private static instance: SmartResponsiveness | null = null
    private config: SmartResponsivenessConfig
    private interactionHistory: TouchInteractionData[] = []
    private buttonStates: Map<string, ButtonOptimizationState> = new Map()
    private callbacks: Set<(optimizations: Map<string, ButtonOptimizationState>) => void> = new Set()

    private constructor(config: Partial<SmartResponsivenessConfig> = {}) {
        this.config = {
            enabled: true,
            learningRate: 0.1,
            minButtonSize: 35,
            maxButtonSize: 80,
            dataRetentionMs: 300000, // 5 minutes
            adaptationThreshold: 5,
            ...config
        }

        this.startDataCleanup()
        
        console.log('🧠 SmartResponsiveness initialized:', this.config)
    }

    public static create(config?: Partial<SmartResponsivenessConfig>): SmartResponsiveness {
        if (SmartResponsiveness.instance) {
            SmartResponsiveness.instance.dispose()
        }
        SmartResponsiveness.instance = new SmartResponsiveness(config)
        return SmartResponsiveness.instance
    }

    public static getInstance(): SmartResponsiveness | null {
        return SmartResponsiveness.instance
    }

    /**
     * Record a touch interaction for learning
     */
    public recordInteraction(data: TouchInteractionData): void {
        if (!this.config.enabled) return

        // Add timestamp if not provided
        if (!data.timestamp) {
            data.timestamp = Date.now()
        }

        this.interactionHistory.push(data)
        this.updateButtonState(data)

        // Trigger neural network-style adaptation
        this.adaptButtonSize(data.buttonId)

        console.log(`📊 Recorded interaction: ${data.buttonId} (accuracy: ${data.accuracy.toFixed(2)}, success: ${data.wasSuccessful})`)
    }

    /**
     * Get optimal button size for a specific button
     */
    public getOptimalButtonSize(buttonId: string, currentSize: number): number {
        if (!this.config.enabled) return currentSize

        const buttonState = this.buttonStates.get(buttonId)
        if (!buttonState || buttonState.interactionCount < this.config.adaptationThreshold) {
            return currentSize // Not enough data yet
        }

        // Return optimal size with confidence weighting
        const confidence = Math.min(buttonState.confidence, 1)
        const adaptation = (buttonState.optimalSize - currentSize) * confidence
        
        return Math.max(
            this.config.minButtonSize,
            Math.min(this.config.maxButtonSize, currentSize + adaptation)
        )
    }

    /**
     * Subscribe to optimization updates
     */
    public subscribe(callback: (optimizations: Map<string, ButtonOptimizationState>) => void): () => void {
        this.callbacks.add(callback)
        
        // Immediate callback with current state
        callback(this.buttonStates)
        
        return () => this.callbacks.delete(callback)
    }

    /**
     * Get current learning statistics
     */
    public getStats(): {
        totalInteractions: number
        buttonsTracked: number
        averageSuccessRate: number
        adaptationsMade: number
    } {
        const totalInteractions = this.interactionHistory.length
        const buttonsTracked = this.buttonStates.size
        
        let totalSuccessRate = 0
        let adaptationsMade = 0
        
        for (const state of this.buttonStates.values()) {
            totalSuccessRate += state.successRate
            if (state.interactionCount >= this.config.adaptationThreshold) {
                adaptationsMade++
            }
        }
        
        return {
            totalInteractions,
            buttonsTracked,
            averageSuccessRate: buttonsTracked > 0 ? totalSuccessRate / buttonsTracked : 0,
            adaptationsMade
        }
    }

    /**
     * Neural network-style adaptation algorithm
     */
    private adaptButtonSize(buttonId: string): void {
        const buttonState = this.buttonStates.get(buttonId)
        if (!buttonState || buttonState.interactionCount < this.config.adaptationThreshold) {
            return
        }

        // Simple neural network logic:
        // If accuracy is low OR success rate is low -> increase size
        // If accuracy is high AND success rate is high -> try smaller size
        
        const currentSize = buttonState.currentSize
        const targetAccuracy = 0.7
        const targetSuccessRate = 0.9
        
        let sizeAdjustment = 0
        
        // Low performance -> increase size
        if (buttonState.averageAccuracy < targetAccuracy || buttonState.successRate < targetSuccessRate) {
            sizeAdjustment = currentSize * 0.1 // Increase by 10%
        }
        // High performance -> try smaller size for better UX
        else if (buttonState.averageAccuracy > 0.9 && buttonState.successRate > 0.95) {
            sizeAdjustment = -currentSize * 0.05 // Decrease by 5%
        }

        if (sizeAdjustment !== 0) {
            const newOptimalSize = Math.max(
                this.config.minButtonSize,
                Math.min(this.config.maxButtonSize, currentSize + sizeAdjustment)
            )

            buttonState.optimalSize = newOptimalSize
            buttonState.confidence = Math.min(buttonState.confidence + 0.1, 1.0)
            buttonState.lastUpdated = Date.now()

            console.log(`🧠 Adapted ${buttonId}: ${currentSize.toFixed(1)}px -> ${newOptimalSize.toFixed(1)}px (confidence: ${buttonState.confidence.toFixed(2)})`)
            
            this.notifyCallbacks()
        }
    }

    /**
     * Update button state based on interaction
     */
    private updateButtonState(data: TouchInteractionData): void {
        let buttonState = this.buttonStates.get(data.buttonId)
        
        if (!buttonState) {
            buttonState = {
                buttonId: data.buttonId,
                currentSize: data.currentButtonSize,
                optimalSize: data.currentButtonSize,
                confidence: 0.1,
                interactionCount: 0,
                successRate: 0,
                averageAccuracy: 0,
                lastUpdated: Date.now()
            }
            this.buttonStates.set(data.buttonId, buttonState)
        }

        // Update metrics using exponential moving average
        const alpha = this.config.learningRate
        
        buttonState.interactionCount++
        buttonState.currentSize = data.currentButtonSize
        buttonState.averageAccuracy = (1 - alpha) * buttonState.averageAccuracy + alpha * data.accuracy
        
        // Update success rate
        const successValue = data.wasSuccessful ? 1 : 0
        buttonState.successRate = (1 - alpha) * buttonState.successRate + alpha * successValue
        
        buttonState.lastUpdated = Date.now()
    }

    /**
     * Notify subscribers of changes
     */
    private notifyCallbacks(): void {
        this.callbacks.forEach(callback => {
            try {
                callback(this.buttonStates)
            } catch (error) {
                console.error('SmartResponsiveness callback error:', error)
            }
        })
    }

    /**
     * Clean up old interaction data
     */
    private startDataCleanup(): void {
        setInterval(() => {
            const cutoff = Date.now() - this.config.dataRetentionMs
            this.interactionHistory = this.interactionHistory.filter(
                interaction => interaction.timestamp > cutoff
            )
        }, 60000) // Clean up every minute
    }

    /**
     * Reset all learning data
     */
    public reset(): void {
        this.interactionHistory = []
        this.buttonStates.clear()
        console.log('🧠 SmartResponsiveness reset - all learning data cleared')
    }

    /**
     * Export learning data for analysis
     */
    public exportData(): {
        interactions: TouchInteractionData[]
        buttonStates: Array<ButtonOptimizationState>
        config: SmartResponsivenessConfig
        stats: ReturnType<SmartResponsiveness['getStats']>
    } {
        return {
            interactions: [...this.interactionHistory],
            buttonStates: Array.from(this.buttonStates.values()),
            config: { ...this.config },
            stats: this.getStats()
        }
    }

    /**
     * Cleanup resources
     */
    public dispose(): void {
        this.callbacks.clear()
        this.interactionHistory = []
        this.buttonStates.clear()
        SmartResponsiveness.instance = null
    }
}

// Factory function for easy setup
export function createSmartResponsiveness(config?: Partial<SmartResponsivenessConfig>): SmartResponsiveness {
    return SmartResponsiveness.create(config)
}