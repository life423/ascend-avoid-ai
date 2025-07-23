/**
 * Performance monitoring utilities
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  renderTime: number;
  updateTime: number;
}

let performanceData: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,
  renderTime: 0,
  updateTime: 0
};

/**
 * Sets up performance monitoring
 */
export function setupPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  let frameCount = 0;
  let lastTime = performance.now();
  let lastFpsUpdate = lastTime;

  const updatePerformanceStats = () => {
    const now = performance.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    frameCount++;

    // Update FPS every second
    if (now - lastFpsUpdate >= 1000) {
      performanceData.fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
      frameCount = 0;
      lastFpsUpdate = now;
    }

    performanceData.frameTime = deltaTime;

    // Memory usage (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      performanceData.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(updatePerformanceStats);
    }
  };

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(updatePerformanceStats);
  }

  // Log performance status
  console.log('Performance monitoring enabled');
}

/**
 * Gets current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...performanceData };
}

/**
 * Measures execution time of a function
 */
export function measureTime<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Measures async execution time
 */
export async function measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Updates render time metric
 */
export function updateRenderTime(time: number): void {
  performanceData.renderTime = time;
}

/**
 * Updates update time metric
 */
export function updateUpdateTime(time: number): void {
  performanceData.updateTime = time;
}
