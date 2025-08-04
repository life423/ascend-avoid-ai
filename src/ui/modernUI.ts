/**
 * 🌉 Modern UI Bridge
 * Gradual migration from DOM manipulation to state management
 * Works alongside existing code without breaking it
 */

import { useUIStore } from '../stores/uiStore';

class ModernUIBridge {
  private unsubscribeCallbacks: Array<() => void> = [];
  
  constructor() {
    this.setupStateSubscriptions();
  }
  
  private setupStateSubscriptions() {
    // Subscribe to guide modal state changes
    const unsubscribeGuideModal = useUIStore.subscribe(
      (state) => state.isGuideModalOpen,
      (isOpen) => this.syncGuideModal(isOpen)
    );
    
    // Subscribe to float menu state changes  
    const unsubscribeFloatMenu = useUIStore.subscribe(
      (state) => state.isFloatMenuOpen,
      (isOpen) => this.syncFloatMenu(isOpen)
    );
    
    this.unsubscribeCallbacks.push(unsubscribeGuideModal, unsubscribeFloatMenu);
  }
  
  // 🔄 Sync guide modal with DOM (gradual replacement)
  private syncGuideModal(isOpen: boolean) {
    const modal = document.querySelector('.modal-panel');
    const body = document.body;
    
    if (modal) {
      if (isOpen) {
        modal.classList.remove('hidden');
        body.classList.add('modal-open');
      } else {
        modal.classList.add('hidden');
        body.classList.remove('modal-open');
      }
    }
  }
  
  // 🔄 Sync float menu with DOM (gradual replacement)
  private syncFloatMenu(isOpen: boolean) {
    const menuItems = document.querySelector('.float-options');
    
    if (menuItems) {
      if (isOpen) {
        menuItems.classList.remove('hidden');
      } else {
        menuItems.classList.add('hidden');
      }
    }
  }
  
  // 🎯 Modern event handlers to replace inline DOM events
  setupModernHandlers() {
    const { openGuideModal, toggleMultiplayer, toggleFloatMenu, closeAllModals } = useUIStore.getState();
    
    // 🖥️ Desktop: Replace guide button handlers (info panel)
    const guideButtons = document.querySelectorAll('.guide-btn-desktop, .guide-btn-mobile');
    guideButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🖥️ Desktop guide button clicked');
        openGuideModal();
      });
    });
    
    // 🖥️ Desktop: Replace multiplayer button handlers (info panel)
    const multiplayerButtons = document.querySelectorAll('.multiplayer-btn-desktop, .multiplayer-btn-mobile');
    multiplayerButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🖥️ Desktop multiplayer button clicked');
        toggleMultiplayer();
      });
    });
    
    // 📱 Mobile: Handle DrawerUI multiplayer button
    const drawerMultiplayerBtn = document.querySelector('.multiplayer-menu-btn');
    if (drawerMultiplayerBtn) {
      drawerMultiplayerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('📱 Drawer multiplayer button clicked');
        toggleMultiplayer();
      });
    }
    
    // 📱 Mobile: Replace menu trigger handler
    const menuTrigger = document.querySelector('.float-trigger');
    if (menuTrigger) {
      menuTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📱 Float menu triggered');
        toggleFloatMenu();
      });
    }
    
    // Replace close modal handler
    const closeButton = document.querySelector('.close-modal');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('❌ Modal close button clicked');
        useUIStore.getState().closeGuideModal();
      });
    }
    
    // Global click handler for closing menus
    document.addEventListener('click', (e) => {
      const target = e.target as Element;
      if (!target.closest('.float-menu') && !target.closest('.modal-panel') && !target.closest('.drawer')) {
        closeAllModals();
      }
    });
    
    console.log('✨ Modern UI handlers initialized with desktop/mobile compatibility');
    console.log('🔍 Button detection:', {
      desktop_guide: guideButtons.length,
      desktop_multiplayer: multiplayerButtons.length,
      drawer_multiplayer: drawerMultiplayerBtn ? 1 : 0,
      float_trigger: menuTrigger ? 1 : 0
    });
    
    // Initialize test utility in development
    if (process.env.NODE_ENV !== 'production') {
      import('../utils/testModernUI').then(({ testModernUISystem }) => {
        setTimeout(() => testModernUISystem(), 1000); // Test after DOM settle
      });
    }
  }
  
  // 🗑️ Cleanup method
  destroy() {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
  }
}

// 🎯 Singleton instance
let modernUIInstance: ModernUIBridge | null = null;

export function initializeModernUI() {
  if (!modernUIInstance) {
    modernUIInstance = new ModernUIBridge();
    
    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        modernUIInstance?.setupModernHandlers();
      });
    } else {
      modernUIInstance.setupModernHandlers();
    }
  }
  return modernUIInstance;
}

export function getModernUIInstance() {
  return modernUIInstance;
}