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

    // Modern Visual Viewport API support for better mobile browser handling
    if ('visualViewport' in window && window.visualViewport) {
        // Visual Viewport API provides more accurate viewport size changes
        window.visualViewport.addEventListener('resize', setViewportHeight);
        window.visualViewport.addEventListener('scroll', setViewportHeight);
    }

    // Also update when the page becomes visible (handles browser UI changes)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setViewportHeight();
        }
    });

    // Fix for Chrome mobile address bar (fallback for browsers without Visual Viewport API)
    let lastHeight = window.innerHeight;
    const checkHeight = () => {
        if (window.innerHeight !== lastHeight) {
            lastHeight = window.innerHeight;
            setViewportHeight();
        }
    };

    // Check periodically for height changes (addresses Chrome mobile quirks)
    // Reduced frequency when Visual Viewport API is available
    const interval = window.visualViewport ? 500 : 100;
    setInterval(checkHeight, interval);
}

/**
 * Detect if running on Chrome mobile
 */
export function isChromeMobile(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return /android.*chrome|crios/i.test(ua) && !/edge/i.test(ua);
}

/**
 * Detect if running on Firefox mobile
 */
export function isFirefoxMobile(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return /android.*firefox|mobile.*firefox/i.test(ua);
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

/**
 * Apply Firefox-specific fixes
 */
export function applyFirefoxMobileFixes(): void {
    if (isFirefoxMobile()) {
        // Add class for Firefox-specific CSS
        document.body.classList.add('firefox-mobile');
        
        // Note: Firefox position:fixed workarounds removed since we now use flexbox layout
        // Touch controls are now positioned using CSS Grid/Flexbox instead of fixed positioning
    }
}