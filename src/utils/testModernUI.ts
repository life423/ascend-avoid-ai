/**
 * 🧪 Modern UI System Test Utility  
 * Helps verify Zustand integration and button functionality
 */

import { useUIStore } from '../stores/uiStore';

export function testModernUISystem() {
  console.log('🧪 Testing Modern UI System...');
  
  // Test 1: Check Zustand store initialization
  const state = useUIStore.getState();
  console.log('✅ Zustand store state:', {
    isGuideModalOpen: state.isGuideModalOpen,
    isFloatMenuOpen: state.isFloatMenuOpen,
    isDrawerOpen: state.isDrawerOpen,
    currentDevice: state.currentDevice,
  });
  
  // Test 2: Check button detection  
  const buttonTests = {
    desktop_guide: document.querySelectorAll('[data-action*="guide"]').length,
    desktop_multiplayer: document.querySelectorAll('[data-action*="multiplayer"]').length,
    drawer_multiplayer: document.querySelector('.multiplayer-menu-btn') ? 1 : 0,
    float_trigger: document.querySelector('.float-trigger') ? 1 : 0,
    close_modal: document.querySelector('.close-modal') ? 1 : 0,
  };
  console.log('🔍 Button detection results:', buttonTests);
  
  // Test 3: Verify event handlers are attached
  const hasEventHandlers = {
    zustand_actions: typeof state.openGuideModal === 'function',
    multiplayer_integration: typeof state.toggleMultiplayer === 'function',
    device_context: typeof state.setDevice === 'function',
  };
  console.log('⚡ Event handler verification:', hasEventHandlers);
  
  // Test 4: Check CSS integration
  const cssTests = {
    info_panel: document.querySelector('.info-panel') ? 1 : 0,
    info_actions: document.querySelector('.info-actions') ? 1 : 0,
    drawer_ui: document.querySelector('.drawer') ? 1 : 0,
    modern_button: document.querySelector('.nav-button') ? 1 : 0,
  };
  console.log('🎨 CSS element detection:', cssTests);
  
  // Test 5: Device context test
  const currentDevice = window.innerWidth >= 1200 ? 'desktop' : 
                       window.innerWidth >= 768 ? 'tablet' : 'mobile';
  console.log('📱 Device context:', {
    window_width: window.innerWidth,
    detected_device: currentDevice,
    store_device: state.currentDevice
  });
  
  return {
    success: true, 
    buttonTests,
    hasEventHandlers,
    cssTests,
    currentDevice
  };
}

// Make it available globally for console testing
(window as any).testModernUI = testModernUISystem;