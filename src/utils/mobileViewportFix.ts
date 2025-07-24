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
        
        // Firefox mobile fix for position:fixed bottom elements
        fixFirefoxBottomPositioning();
    }
}

/**
 * Fix Firefox mobile position:fixed bottom positioning issues
 */
function fixFirefoxBottomPositioning(): void {
    // Wait for DOM to be ready
    const applyFix = () => {
        const touchControllers = document.querySelectorAll('.touch-controller[data-controller="main"]');
        
        touchControllers.forEach((controller) => {
            const element = controller as HTMLElement;
            if (element.style.position === 'fixed' && element.style.bottom === '0px') {
                // Firefox workaround: use top positioning instead of bottom
                element.style.bottom = 'auto';
                element.style.top = 'calc(100vh - 120px)'; // Approximate height of controls
                element.style.height = '120px'; // Set explicit height
            }
        });
    };

    // Apply immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFix);
    } else {
        applyFix();
    }

    // Also apply when touch controls are dynamically created
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    if (element.classList?.contains('touch-controller') || 
                        element.querySelector?.('.touch-controller')) {
                        setTimeout(applyFix, 100); // Small delay to ensure styles are applied
                    }
                }
            });
        });
    });

    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
}