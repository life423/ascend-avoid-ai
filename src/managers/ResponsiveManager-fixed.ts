// /**
//  * SIMPLIFIED ResponsiveManager - Fixes canvas sizing issues
//  * Removes complex calculations and uses viewport container bounds directly
//  */
// import { CANVAS } from '../constants/gameConstants'
// import { ScalingInfo } from '../types'

// interface Game {
//     particleSystem?: {
//         setMaxParticles: (max: number) => void
//     } | null
//     config?: {
//         deviceTier?: string
//         targetFPS?: number
//     }
//     [key: string]: any
// }

// export default class ResponsiveManager {
//     game: Game
//     canvas: HTMLCanvasElement | null
//     baseCanvasWidth: number
//     baseCanvasHeight: number
//     isDesktop: boolean
//     scalingInfo: ScalingInfo
//     onResize?: (widthScale: number, heightScale: number, isDesktop: boolean) => void

//     constructor(game: Game) {
//         this.game = game
//         this.canvas = null
//         this.baseCanvasWidth = CANVAS.BASE_WIDTH
//         this.baseCanvasHeight = CANVAS.BASE_HEIGHT

//         this.isDesktop = window.innerWidth >= 1200
//         this.scalingInfo = {
//             widthScale: 1,
//             heightScale: 1,
//             pixelRatio: 1,
//             reducedResolution: false,
//         }
//     }

//     init(canvas: HTMLCanvasElement): void {
//         this.canvas = canvas
//         this.setupEventListeners()
//         this.handleResize()
//     }

//     private setupEventListeners(): void {
//         // Throttle resize events to prevent performance issues
//         let resizeTimeout: number
//         const throttledResize = () => {
//             clearTimeout(resizeTimeout)
//             resizeTimeout = window.setTimeout(() => this.handleResize(), 100)
//         }

//         window.addEventListener('resize', throttledResize)
//         window.addEventListener('orientationchange', throttledResize)
//     }

//     handleResize(): void {
//         this.isDesktop = window.innerWidth >= 1200
//         this.resizeCanvas()
        
//         if (this.onResize) {
//             this.onResize(
//                 this.scalingInfo.widthScale,
//                 this.scalingInfo.heightScale,
//                 this.isDesktop
//             )
//         }
//     }

//     /**
//      * SIMPLIFIED canvas sizing - uses viewport container bounds directly
//      */
//     resizeCanvas(): void {
//         if (!this.canvas) return

//         const viewport = this.canvas.closest('.canvas-viewport[data-viewport="main"]') as HTMLElement
//         if (!viewport) return

//         // Get available space from viewport container
//         const viewportRect = viewport.getBoundingClientRect()
//         const availableWidth = Math.max(viewportRect.width - 20, 280)
//         const availableHeight = Math.max(viewportRect.height - 20, 200)

//         // Calculate scale to fit within available space
//         const widthScale = availableWidth / this.baseCanvasWidth
//         const heightScale = availableHeight / this.baseCanvasHeight
//         const scale = Math.min(widthScale, heightScale)

//         // Calculate final dimensions
//         const canvasWidth = Math.floor(this.baseCanvasWidth * scale)
//         const canvasHeight = Math.floor(this.baseCanvasHeight * scale)

//         // Apply dimensions
//         this.canvas.style.width = `${canvasWidth}px`
//         this.canvas.style.height = `${canvasHeight}px`
//         this.canvas.width = canvasWidth
//         this.canvas.height = canvasHeight

//         // Reset context transform
//         const ctx = this.canvas.getContext('2d')
//         if (ctx) {
//             ctx.setTransform(1, 0, 0, 1, 0, 0)
//         }

//         // Update scaling info
//         this.scalingInfo = {
//             widthScale: canvasWidth / this.baseCanvasWidth,
//             heightScale: canvasHeight / this.baseCanvasHeight,
//             pixelRatio: 1,
//             reducedResolution: false,
//         }
//     }

//     getScalingInfo(): ScalingInfo {
//         return this.scalingInfo
//     }

//     isDesktopDevice(): boolean {
//         return this.isDesktop
//     }

//     dispose(): void {
//         // Remove event listeners would go here
//     }
// }