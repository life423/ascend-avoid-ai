/**
 * Polyfills for older browsers and missing features
 */

/**
 * Sets up necessary polyfills for compatibility
 */
export function setupPolyfills(): void {
  // ResizeObserver polyfill
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      private callback: ResizeObserverCallback;
      private targets: Element[] = [];
      private intervalId: number | null = null;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe(target: Element): void {
        if (!this.targets.includes(target)) {
          this.targets.push(target);
          this.startPolling();
        }
      }

      unobserve(target: Element): void {
        const index = this.targets.indexOf(target);
        if (index > -1) {
          this.targets.splice(index, 1);
          if (this.targets.length === 0) {
            this.stopPolling();
          }
        }
      }

      disconnect(): void {
        this.targets = [];
        this.stopPolling();
      }

      private startPolling(): void {
        if (this.intervalId === null) {
          this.intervalId = window.setInterval(() => {
            const entries = this.targets.map(target => ({
              target,
              contentRect: target.getBoundingClientRect()
            }));
            this.callback(entries as ResizeObserverEntry[], this);
          }, 100);
        }
      }

      private stopPolling(): void {
        if (this.intervalId !== null) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }
    };
  }

  // requestAnimationFrame polyfill
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      return window.setTimeout(callback, 1000 / 60);
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number): void => {
      clearTimeout(id);
    };
  }

  // Performance.now polyfill
  if (!window.performance || !window.performance.now) {
    const startTime = Date.now();
    if (!window.performance) {
      (window as any).performance = {};
    }
    window.performance.now = (): number => {
      return Date.now() - startTime;
    };
  }

  // CSS.supports polyfill
  if (!window.CSS || !window.CSS.supports) {
    if (!window.CSS) {
      (window as any).CSS = {};
    }
    window.CSS.supports = (property: string, value?: string): boolean => {
      const div = document.createElement('div');
      try {
        if (value) {
          (div.style as any)[property] = value;
          return (div.style as any)[property] === value;
        } else {
          // For @supports style queries
          return false;
        }
      } catch {
        return false;
      }
    };
  }
}
