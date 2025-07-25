/**
 * ✨ Cutting-edge Design Tokens with vanilla-extract
 * Type-safe design system with zero style conflicts
 */

import { createTheme } from '@vanilla-extract/css';

// 🎨 Design Tokens - Type-safe design system
export const tokens = {
  // Spacing scale (consistent with existing --space- vars but type-safe)
  space: {
    xs: '4px',
    sm: '8px', 
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  // Color palette with semantic naming
  colors: {
    primary: {
      dark: '#0a192f',
      light: '#172a46',
    },
    accent: {
      primary: '#00bcd4',
      secondary: '#00e5ff',
    },
    text: {
      light: '#e2e8f0',
      dark: '#1a202c',
    },
    surface: {
      divider: 'rgba(0, 188, 212, 0.3)',
      highlight: 'rgba(0, 188, 212, 0.1)',
    },
    state: {
      warning: '#ff6b6b',
      success: '#4ecdc4',
    }
  },
  
  // Typography scale
  typography: {
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      xxl: '1.5rem', // 24px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
    }
  },
  
  // Layout & sizing
  layout: {
    borderRadius: '8px',
    borderWidth: {
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    transition: {
      fast: '150ms ease',
      base: '250ms ease',
      slow: '350ms ease',
    },
  },
  
  // Component-specific tokens
  components: {
    infoPanel: {
      width: '280px',
      padding: '24px',
    },
    button: {
      paddingX: '32px',
      paddingY: '16px',
      minWidth: '100px',
    },
  },
};

// 🌙 Create theme variants (extensible for dark mode, etc.)
export const [themeClass, themeVars] = createTheme(tokens);

// 🎯 Export branded types for type safety
export type SpaceToken = keyof typeof tokens.space;
export type ColorToken = keyof typeof tokens.colors;
export type TypographyToken = keyof typeof tokens.typography.fontSize;