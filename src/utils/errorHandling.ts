/**
 * Comprehensive error handling and reporting system.
 * Provides graceful error recovery and user-friendly error messages.
 */

export interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  source?: string;
  category: 'javascript' | 'network' | 'canvas' | 'audio' | 'multiplayer' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface ErrorHandlerOptions {
  enableReporting: boolean;
  enableConsoleLogging: boolean;
  enableUserNotifications: boolean;
  maxReports: number;
  reportingEndpoint?: string;
}

export class ErrorHandler {
  private options: ErrorHandlerOptions;
  private errorReports: ErrorReport[] = [];
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime = 0;
  private errorThrottleTime = 1000; // 1 second
  
  constructor(options: Partial<ErrorHandlerOptions> = {}) {
    this.options = {
      enableReporting: true,
      enableConsoleLogging: true,
      enableUserNotifications: true,
      maxReports: 100,
      ...options
    };
    
    this.setupGlobalHandlers();
  }

  /**
   * Sets up global error handlers
   */
  private setupGlobalHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        source: 'window.onerror',
        category: 'javascript',
        severity: 'high'
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        source: 'unhandledrejection',
        category: 'javascript',
        severity: 'medium',
        context: { reason: event.reason }
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window && event.target instanceof HTMLElement) {
        this.handleError({
          message: `Failed to load resource: ${(event.target as any).src || (event.target as any).href}`,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          source: 'resource',
          category: 'network',
          severity: 'medium',
          context: {
            tagName: event.target.tagName,
            src: (event.target as any).src,
            href: (event.target as any).href
          }
        });
      }
    }, true);
  }

  /**
   * Handles an error report
   */
  private handleError(report: ErrorReport): void {
    // Throttle similar errors
    const errorKey = `${report.message}:${report.lineNumber}:${report.columnNumber}`;
    const now = Date.now();
    
    if (now - this.lastErrorTime < this.errorThrottleTime) {
      const count = this.errorCounts.get(errorKey) || 0;
      if (count > 3) {
        return; // Too many similar errors
      }
    }
    
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    this.lastErrorTime = now;

    // Add to reports
    this.errorReports.push(report);
    
    // Keep reports within limit
    if (this.errorReports.length > this.options.maxReports) {
      this.errorReports.shift();
    }

    // Console logging
    if (this.options.enableConsoleLogging) {
      this.logToConsole(report);
    }

    // User notifications
    if (this.options.enableUserNotifications) {
      this.showUserNotification(report);
    }

    // Remote reporting
    if (this.options.enableReporting && this.options.reportingEndpoint) {
      this.sendReport(report);
    }
  }

  /**
   * Logs error to console with appropriate level
   */
  private logToConsole(report: ErrorReport): void {
    const message = `[${report.category.toUpperCase()}] ${report.message}`;
    
    switch (report.severity) {
      case 'low':
        console.info(message, report);
        break;
      case 'medium':
        console.warn(message, report);
        break;
      case 'high':
      case 'critical':
        console.error(message, report);
        break;
    }
  }

  /**
   * Shows user-friendly error notification
   */
  private showUserNotification(report: ErrorReport): void {
    if (report.severity === 'low') {
      return; // Don't show notifications for low severity errors
    }

    const message = this.getUserFriendlyMessage(report);
    
    // Only show critical errors to users immediately
    if (report.severity === 'critical') {
      this.showErrorDialog(message, report);
    } else {
      // For other errors, show a less intrusive notification
      this.showErrorToast(message);
    }
  }

  /**
   * Converts technical error to user-friendly message
   */
  private getUserFriendlyMessage(report: ErrorReport): string {
    switch (report.category) {
      case 'network':
        return 'Network connection issue. Please check your internet connection.';
      case 'canvas':
        return 'Graphics rendering issue. Try refreshing the page.';
      case 'audio':
        return 'Audio playback issue. Game will continue without sound.';
      case 'multiplayer':
        return 'Multiplayer connection issue. Switching to single-player mode.';
      case 'javascript':
        if (report.message.includes('memory') || report.message.includes('allocation')) {
          return 'The game is using too much memory. Try refreshing the page.';
        }
        return 'A technical error occurred. The game will attempt to continue.';
      default:
        return 'An unexpected error occurred. Please try refreshing the page.';
    }
  }

  /**
   * Shows error dialog for critical errors
   */
  private showErrorDialog(message: string, _report: ErrorReport): void {
    const dialog = document.createElement('div');
    dialog.className = 'error-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #dc2626;
      color: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      font-family: inherit;
      text-align: center;
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 18px;">Error</h3>
      <p style="margin: 0 0 20px 0; line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="error-refresh" style="
          background: #ffffff;
          color: #dc2626;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        ">Refresh Page</button>
        <button id="error-continue" style="
          background: transparent;
          color: white;
          border: 2px solid white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        ">Continue</button>
      </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    const refreshBtn = dialog.querySelector('#error-refresh') as HTMLButtonElement;
    const continueBtn = dialog.querySelector('#error-continue') as HTMLButtonElement;

    refreshBtn.addEventListener('click', () => {
      window.location.reload();
    });

    continueBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (dialog.parentNode) {
        document.body.removeChild(dialog);
      }
    }, 10000);
  }

  /**
   * Shows non-intrusive error toast
   */
  private showErrorToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      max-width: 300px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-family: inherit;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 5000);

    // Add CSS animations if not already present
    if (!document.querySelector('#error-animations')) {
      const style = document.createElement('style');
      style.id = 'error-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Sends error report to remote endpoint
   */
  private async sendReport(report: ErrorReport): Promise<void> {
    if (!this.options.reportingEndpoint) {
      return;
    }

    try {
      await fetch(this.options.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.warn('Failed to send error report:', error);
    }
  }

  /**
   * Manually reports an error
   */
  public reportError(
    message: string,
    category: ErrorReport['category'] = 'unknown',
    severity: ErrorReport['severity'] = 'medium',
    context?: Record<string, any>
  ): void {
    this.handleError({
      message,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      category,
      severity,
      context,
      source: 'manual'
    });
  }

  /**
   * Gets all error reports
   */
  public getReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  /**
   * Clears all error reports
   */
  public clearReports(): void {
    this.errorReports.length = 0;
    this.errorCounts.clear();
  }

  /**
   * Gets error statistics
   */
  public getStats(): any {
    const categories: Record<string, number> = {};
    const severities: Record<string, number> = {};

    this.errorReports.forEach(report => {
      categories[report.category] = (categories[report.category] || 0) + 1;
      severities[report.severity] = (severities[report.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorReports.length,
      categories,
      severities,
      mostCommonErrors: Array.from(this.errorCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    };
  }
}

// Global error handler instance
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Sets up global error handling
 */
export function setupErrorHandling(options?: Partial<ErrorHandlerOptions>): ErrorHandler {
  if (globalErrorHandler) {
    console.warn('Error handler already initialized');
    return globalErrorHandler;
  }

  globalErrorHandler = new ErrorHandler(options);
  return globalErrorHandler;
}

/**
 * Gets the global error handler
 */
export function getErrorHandler(): ErrorHandler | null {
  return globalErrorHandler;
}

/**
 * Manually reports an error to the global handler
 */
export function reportError(
  message: string,
  category: ErrorReport['category'] = 'unknown',
  severity: ErrorReport['severity'] = 'medium',
  context?: Record<string, any>
): void {
  if (globalErrorHandler) {
    globalErrorHandler.reportError(message, category, severity, context);
  } else {
    console.error(`[${category.toUpperCase()}] ${message}`, context);
  }
}

/**
 * Utility functions for common error scenarios
 */
export const ErrorUtils = {
  /**
   * Wraps an async function with error handling
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    category: ErrorReport['category'] = 'javascript'
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        reportError(
          error instanceof Error ? error.message : 'Unknown async error',
          category,
          'medium',
          { args, stack: error instanceof Error ? error.stack : undefined }
        );
        throw error;
      }
    }) as T;
  },

  /**
   * Wraps a synchronous function with error handling
   */
  wrapSync<T extends (...args: any[]) => any>(
    fn: T,
    category: ErrorReport['category'] = 'javascript'
  ): T {
    return ((...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        reportError(
          error instanceof Error ? error.message : 'Unknown sync error',
          category,
          'medium',
          { args, stack: error instanceof Error ? error.stack : undefined }
        );
        throw error;
      }
    }) as T;
  },

  /**
   * Safe JSON parsing with error handling
   */
  safeJsonParse<T = any>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      reportError(
        `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'javascript',
        'low',
        { json: json.substring(0, 100) }
      );
      return defaultValue;
    }
  },

  /**
   * Safe localStorage operations
   */
  safeLocalStorage: {
    getItem(key: string, defaultValue: string | null = null): string | null {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        reportError(
          `localStorage.getItem error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'javascript',
          'low',
          { key }
        );
        return defaultValue;
      }
    },

    setItem(key: string, value: string): boolean {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        reportError(
          `localStorage.setItem error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'javascript',
          'low',
          { key, valueLength: value.length }
        );
        return false;
      }
    }
  }
};
