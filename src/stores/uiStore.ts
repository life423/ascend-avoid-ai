/**
 * 🗃️ UI State Management with Zustand
 * Incremental modernization - works alongside existing DOM manipulation
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface UIState {
  // Info panel state (desktop)
  isInfoPanelVisible: boolean;
  
  // Modal state (both desktop and mobile)
  isGuideModalOpen: boolean;
  isMultiplayerModalOpen: boolean;
  
  // Mobile menu state  
  isFloatMenuOpen: boolean;
  isDrawerOpen: boolean;
  
  // UI context
  currentDevice: 'mobile' | 'tablet' | 'desktop';
  
  // Actions
  toggleInfoPanel: () => void;
  openGuideModal: () => void;
  closeGuideModal: () => void;
  toggleMultiplayer: () => void;
  toggleFloatMenu: () => void;
  toggleDrawer: () => void;
  closeAllModals: () => void;
  setDevice: (device: 'mobile' | 'tablet' | 'desktop') => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    isInfoPanelVisible: false,
    isGuideModalOpen: false,
    isMultiplayerModalOpen: false,
    isFloatMenuOpen: false,
    isDrawerOpen: false,
    currentDevice: 'desktop', // Default to desktop
    
    // Actions
    toggleInfoPanel: () => set((state) => ({ 
      isInfoPanelVisible: !state.isInfoPanelVisible 
    })),
    
    openGuideModal: () => set(() => ({ 
      isGuideModalOpen: true,
      isFloatMenuOpen: false, // Close menus when opening modal
      isDrawerOpen: false,
    })),
    
    closeGuideModal: () => set(() => ({ 
      isGuideModalOpen: false 
    })),
    
    toggleMultiplayer: () => {
      // This integrates with the existing game.switchGameMode
      const game = (window as any).game;
      if (game && typeof game.switchGameMode === 'function') {
        const newMode = game.isMultiplayerMode ? 'singlePlayer' : 'multiplayer';
        
        console.log(`🎮 Zustand: Attempting to switch to ${newMode} mode...`);
        
        // Close menus immediately for better UX
        set(() => ({ 
          isFloatMenuOpen: false,
          isDrawerOpen: false,
        }));
        
        // Switch game mode with proper error handling
        game.switchGameMode(newMode)
          .then(() => {
            console.log(`✅ Zustand: Successfully switched to ${newMode} mode`);
          })
          .catch((err: any) => {
            console.error('❌ Zustand: Failed to switch game mode:', err);
            // Game.ts already handles UI error display, so we just log here
          });
      } else {
        console.warn('⚠️ Zustand: Game instance not available for multiplayer toggle');
      }
    },
    
    toggleFloatMenu: () => set((state) => ({ 
      isFloatMenuOpen: !state.isFloatMenuOpen,
      isDrawerOpen: false, // Close drawer when opening float menu
    })),
    
    toggleDrawer: () => set((state) => ({ 
      isDrawerOpen: !state.isDrawerOpen,
      isFloatMenuOpen: false, // Close float menu when opening drawer
    })),
    
    setDevice: (device) => set(() => ({
      currentDevice: device,
      // Auto-close inappropriate menus for device
      isFloatMenuOpen: device === 'desktop' ? false : false,
      isDrawerOpen: device === 'desktop' ? false : false,
    })),
    
    closeAllModals: () => set(() => ({
      isGuideModalOpen: false,
      isMultiplayerModalOpen: false,
      isFloatMenuOpen: false,
      isDrawerOpen: false,
    })),
  }))
);

// 🎯 Selector hooks for optimized re-renders
export const useIsGuideModalOpen = () => useUIStore((state) => state.isGuideModalOpen);
export const useIsFloatMenuOpen = () => useUIStore((state) => state.isFloatMenuOpen);
export const useUIActions = () => useUIStore((state) => ({
  openGuideModal: state.openGuideModal,
  closeGuideModal: state.closeGuideModal,
  toggleMultiplayer: state.toggleMultiplayer,
  toggleFloatMenu: state.toggleFloatMenu,
  closeAllModals: state.closeAllModals,
}));