/**
 * Mobile viewport height fix
 * Addresses the issue where 100vh doesn't account for browser UI on mobile
 */
export function initMobileViewportFix(): void {
    // Set custom CSS property for actual viewport height
    const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setViewportHeight();

    // Update on resize (includes orientation change and browser UI show/hide)
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // Also update when the page becomes visible (handles browser UI changes)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setViewportHeight();
        }
    });

    // Fix for Chrome mobile address bar
    let lastHeight = window.innerHeight;
    const checkHeight = () => {
        if (window.innerHeight !== lastHeight) {
            lastHeight = window.innerHeight;
            setViewportHeight();
        }
    };

    // Check periodically for height changes (addresses Chrome mobile quirks)
    setInterval(checkHeight, 100);
}

/**
 * Detect if running on Chrome mobile
 */
export function isChromeMobile(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return /android.*chrome|crios/i.test(ua) && !/edge/i.test(ua);
}

/**
 * Apply Chrome-specific fixes
 */
export function applyChromeMobileFixes(): void {
    if (isChromeMobile()) {
        // Add class for Chrome-specific CSS
        document.body.classList.add('chrome-mobile');
        
        // Force a layout recalculation after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.scrollTo(0, 1);
                window.scrollTo(0, 0);
            }, 100);
        });
    }
}