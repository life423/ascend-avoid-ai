/**
 * ✨ Type-safe Info Panel Component Styles
 * Zero style conflicts with vanilla-extract CSS-in-TS
 */

import { style } from '@vanilla-extract/css';
import { themeVars } from '../tokens.css';

// 🎯 Main info panel container - replaces .info-panel
export const infoPanelContainer = style({
  display: 'none', // Hidden by default, shown via media query
  background: themeVars.colors.primary.light,
  borderRadius: themeVars.layout.borderRadius,
  
  // Modern CSS: Logical properties for internationalization
  borderInlineStart: `${themeVars.layout.borderWidth.thick} solid ${themeVars.colors.accent.primary}`,
  boxShadow: themeVars.layout.shadow.md,
  
  // Surgical flexbox fix for button positioning  
  flexDirection: 'column',
  blockSize: '100%', // Modern CSS: logical sizing
  padding: themeVars.space.lg,
  
  // Container queries support
  containerType: 'size',
  
  // Type-safe responsive behavior
  '@media': {
    '(min-width: 1200px)': {
      display: 'flex',
      gridColumn: '2',
      width: themeVars.components.infoPanel.width,
      minWidth: themeVars.components.infoPanel.width,
      maxWidth: themeVars.components.infoPanel.width,
    },
  },
});

// 📝 Panel content area - replaces .panel-content
export const panelContent = style({
  flex: '1',
  marginBottom: themeVars.space.xxl,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space.lg,
});

// 🎨 Typography styles with semantic naming
export const panelTitle = style({
  color: themeVars.colors.accent.secondary,
  fontSize: themeVars.typography.fontSize.xl,
  fontWeight: themeVars.typography.fontWeight.semibold,
  lineHeight: themeVars.typography.lineHeight.tight,
  margin: `0 0 ${themeVars.space.sm} 0`,
});

export const panelText = style({
  margin: '0',
  lineHeight: themeVars.typography.lineHeight.normal,
  color: themeVars.colors.text.light,
  
  // Adjacent paragraph spacing
  selectors: {
    '& + &': {
      marginTop: themeVars.space.md,
    },
  },
});

export const panelList = style({
  margin: '0',
  paddingLeft: themeVars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.space.sm,
});

export const panelListItem = style({
  margin: '0',
  lineHeight: themeVars.typography.lineHeight.normal,
  color: themeVars.colors.text.light,
});

// 💡 Enhanced note styling with better visual hierarchy
export const panelNote = style({
  fontStyle: 'italic',
  color: themeVars.colors.accent.secondary,
  fontSize: themeVars.typography.fontSize.sm,
  margin: '0',
  padding: themeVars.space.sm,
  background: themeVars.colors.surface.highlight,
  borderRadius: themeVars.layout.borderRadius,
  borderLeft: `3px solid ${themeVars.colors.accent.secondary}`,
});

// 🔘 Button container - replaces .info-actions  
export const infoActions = style({
  // Surgical fix: push buttons to bottom
  marginTop: 'auto',
  display: 'flex',
  gap: '0.75rem', // Exact value from your surgical fix
  
  // Modern CSS: Logical padding with breathing room
  paddingBlock: `${themeVars.space.lg} 1.5rem`,
  borderBlockStart: `${themeVars.layout.borderWidth.medium} solid ${themeVars.colors.surface.divider}`,
  alignItems: 'center',
  justifyContent: 'center',
});

// 🎯 Button styling with equal width distribution
export const actionButton = style({
  // Equal width buttons (your optional enhancement)
  flex: '1 1 0',
  
  // Modern CSS: Dynamic button sizing
  vars: {
    '--button-count': '2',
  },
  minInlineSize: 'calc(100% / var(--button-count) - 0.75rem)',
  
  // Enhanced button styling
  padding: `${themeVars.components.button.paddingY} ${themeVars.components.button.paddingX}`,
  background: themeVars.colors.accent.primary,
  color: themeVars.colors.text.dark,
  border: 'none',
  borderRadius: themeVars.layout.borderRadius,
  fontWeight: themeVars.typography.fontWeight.semibold,
  cursor: 'pointer',
  transition: themeVars.layout.transition.base,
  textTransform: 'uppercase',
  fontSize: themeVars.typography.fontSize.sm,
  letterSpacing: themeVars.typography.letterSpacing.wide,
  minWidth: themeVars.components.button.minWidth,
  
  // Interactive states
  ':hover': {
    background: themeVars.colors.accent.secondary,
    transform: 'translateY(-2px)',
    boxShadow: themeVars.layout.shadow.md,
  },
  
  ':active': {
    transform: 'translateY(0)',
  },
  
  // Focus accessibility
  ':focus-visible': {
    outline: `2px solid ${themeVars.colors.accent.secondary}`,
    outlineOffset: '2px',
  },
});

// 🎨 Export all styles as a cohesive component API
export const infoPanelStyles = {
  container: infoPanelContainer,
  content: panelContent,
  title: panelTitle,
  text: panelText,
  list: panelList,
  listItem: panelListItem,
  note: panelNote,
  actions: infoActions,
  button: actionButton,
};