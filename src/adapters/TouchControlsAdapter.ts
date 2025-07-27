import { FluidResponsiveSystem } from '../systems/FluidResponsiveSystem';
import type { FluidScaling } from '../systems/FluidResponsiveSystem';

export class TouchControlsAdapter {
  private container: HTMLElement;
  private disposeFn: () => void;
  private actionButtonsContainer: HTMLElement | null = null;
  private dpadContainer: HTMLElement | null = null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Find control containers
    this.actionButtonsContainer = container.querySelector('.action-buttons') as HTMLElement | null;
    this.dpadContainer = container.querySelector('.dpad-controls') as HTMLElement | null;
    
    // Subscribe to the fluid responsive system
    const fluidSystem = FluidResponsiveSystem.getInstance();
    if (fluidSystem) {
      this.disposeFn = fluidSystem.subscribe(this.handleScalingChange.bind(this));
      
      // Initial setup
      const scaling = fluidSystem.getScaling();
      if (scaling) {
        this.applyLayout(scaling.viewport);
      }
    } else {
      this.disposeFn = () => {}; // No-op if system not available
    }
    
    // Remove the three-dot menu
    const floatMenu = document.querySelector('.float-menu') as HTMLElement | null;
    if (floatMenu) {
      floatMenu.style.display = 'none';
    }
  }
  
  private handleScalingChange(scaling: FluidScaling): void {
    this.applyLayout(scaling.viewport);
  }
  
  private applyLayout(viewport: { width: number; height: number; screenType: string; orientation: string; isTouch: boolean }): void {
    // Calculate sizes based on viewport dimensions and device type
    const buttonSize = this.calculateButtonSize(viewport);
    const buttonGap = this.calculateButtonGap(viewport);
    
    // Apply GameBoy style to action buttons with responsive offset positioning
    if (this.actionButtonsContainer) {
      this.actionButtonsContainer.style.display = 'flex';
      this.actionButtonsContainer.style.flexDirection = 'row';
      this.actionButtonsContainer.style.gap = `${buttonGap}px`;
      this.actionButtonsContainer.style.justifyContent = 'center';
      this.actionButtonsContainer.style.position = 'relative';
      
      // Calculate offset based on viewport dimensions
      const offsetY = this.calculateButtonOffset(viewport);
      const offsetX = offsetY * 0.5; // Horizontal offset is half the vertical offset
      
      // Get the buttons
      const actionButtons = this.actionButtonsContainer.querySelectorAll('.action-button');
      
      // Apply styles to each button
      actionButtons.forEach((button, index) => {
        const htmlButton = button as HTMLElement;
        htmlButton.style.width = `${buttonSize}px`;
        htmlButton.style.height = `${buttonSize}px`;
        
        // No rotation for straight text
        
        // Apply offset to B button (first button)
        if (index === 0) { // B button
          htmlButton.style.position = 'relative';
          htmlButton.style.bottom = `-${offsetY}px`;
          htmlButton.style.right = `${offsetX}px`;
        }
        
        // Calculate font size based on button size and viewport
        const fontSize = this.calculateFontSize(buttonSize, viewport);
        htmlButton.style.fontSize = `${fontSize}px`;
        htmlButton.style.fontWeight = 'bold';
      });
    }
    
    // Adjust D-pad based on viewport
    if (this.dpadContainer) {
      const dpadGap = Math.min(8, viewport.width * 0.02);
      this.dpadContainer.style.gap = `${dpadGap}px`;
      
      // Update D-pad button sizes
      const dpadButtons = this.dpadContainer.querySelectorAll('.dpad-button');
      dpadButtons.forEach((button) => {
        const htmlButton = button as HTMLElement;
        htmlButton.style.width = `${buttonSize}px`;
        htmlButton.style.height = `${buttonSize}px`;
        
        // Adjust font size based on button size
        const fontSize = Math.max(16, Math.min(buttonSize * 0.4, 24));
        htmlButton.style.fontSize = `${fontSize}px`;
      });
    }
    
    // Adjust container padding based on device type
    const bottomPadding = viewport.screenType === 'phone' ? 20 : 15;
    const sidePadding = viewport.screenType === 'phone' ? 10 : 15;
    this.container.style.padding = `${sidePadding}px ${sidePadding}px ${bottomPadding}px ${sidePadding}px`;
    
    // Ensure container uses relative positioning within the layout flow
    this.container.style.position = 'relative';
    this.container.style.width = '100%';
    this.container.style.display = 'flex';
    this.container.style.justifyContent = 'space-between';
    
    // Add gradient background
    this.container.style.background = 'linear-gradient(to top, rgba(10, 25, 47, 0.8), transparent)';
  }
  
  private calculateButtonSize(viewport: { width: number; height: number; screenType: string; orientation: string }): number {
    // Calculate button size based on device type and orientation
    switch (viewport.screenType) {
      case 'phone':
        return viewport.orientation === 'portrait' 
          ? Math.min(50, viewport.width * 0.12) 
          : Math.min(45, viewport.height * 0.12);
      case 'tablet':
        return Math.min(60, viewport.width * 0.08);
      default:
        return 55; // Default size
    }
  }
  
  private calculateButtonGap(viewport: { width: number; height: number; screenType: string; orientation: string }): number {
    // Calculate gap between buttons based on device type
    switch (viewport.screenType) {
      case 'phone':
        return viewport.orientation === 'portrait'
          ? Math.min(15, viewport.width * 0.04)
          : Math.min(12, viewport.height * 0.04);
      case 'tablet':
        return Math.min(20, viewport.width * 0.03);
      default:
        return 15;
    }
  }
  
  private calculateButtonOffset(viewport: { width: number; height: number; screenType: string; orientation: string }): number {
    // Calculate offset based on device type and orientation
    switch (viewport.screenType) {
      case 'phone':
        return viewport.orientation === 'portrait'
          ? Math.min(10, viewport.width * 0.025)
          : Math.min(8, viewport.height * 0.025);
      case 'tablet':
        return Math.min(12, viewport.width * 0.015);
      default:
        return 10;
    }
  }
  
  private calculateFontSize(buttonSize: number, viewport: { screenType: string }): number {
    // Base font size on button size with min/max constraints
    const baseFontSize = buttonSize * 0.5; // 50% of button size
    
    // Adjust based on device type
    switch (viewport.screenType) {
      case 'phone':
        return Math.max(16, Math.min(baseFontSize, 24));
      case 'tablet':
        return Math.max(18, Math.min(baseFontSize, 28));
      default:
        return Math.max(18, Math.min(baseFontSize, 30));
    }
  }
  
  dispose(): void {
    if (this.disposeFn) {
      this.disposeFn();
    }
  }
}