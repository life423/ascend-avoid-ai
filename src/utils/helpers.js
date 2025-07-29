// Utility functions for the multiplayer game

// Math utilities
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const lerp = (start, end, factor) => start + (end - start) * factor;

export const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Canvas utilities
export const getCanvasBounds = (canvas) => {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    left: rect.left,
    top: rect.top
  };
};

export const constrainToCanvas = (x, y, objectSize, canvasWidth, canvasHeight) => ({
  x: clamp(x, 0, canvasWidth - objectSize),
  y: clamp(y, 0, canvasHeight - objectSize)
});

// Color utilities
export const generatePlayerColor = (playerId) => {
  const colors = [
    '#E84545', // Red
    '#17A2B8', // Teal  
    '#28A745', // Green
    '#FFC107', // Amber
    '#8E44AD', // Purple
    '#F39C12'  // Orange
  ];
  
  // Use player ID hash to consistently assign colors
  const hash = playerId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// DOM utilities
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

// Debounce function for performance
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Device detection
export const isMobile = () => /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
export const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Random utilities
export const randomBetween = (min, max) => Math.random() * (max - min) + min;
export const randomInt = (min, max) => Math.floor(randomBetween(min, max + 1));
export const randomChoice = (array) => array[randomInt(0, array.length - 1)];

// Performance utilities
export const fps = (() => {
  let lastTime = 0;
  let frameCount = 0;
  let currentFPS = 0;
  
  return {
    update: (timestamp) => {
      frameCount++;
      if (timestamp - lastTime >= 1000) {
        currentFPS = Math.round((frameCount * 1000) / (timestamp - lastTime));
        frameCount = 0;
        lastTime = timestamp;
      }
    },
    get: () => currentFPS
  };
})();