import { ResponsiveSystem } from '../systems/UnifiedResponsiveSystem';
import type { ViewportConfig, ViewportInfo } from '../systems/UnifiedResponsiveSystem';

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
    
    // Subscribe to the unified responsive system
    this.disposeFn = ResponsiveSystem.subscribe(this.handleConfigChange.bind(this));
    
    // Initial setup
    const config = ResponsiveSystem.getCurrentConfig();
    const viewport = ResponsiveSystem.getViewportInfo();
    if (config && viewport) {
      this.applyLayout(viewport);
    }
    
    // Remove the three-dot menu
    const floatMenu = document.querySelector('.float-menu') as HTMLElement | null;
    if (floatMenu) {
      floatMenu.style.display = 'none';
    }
  }
  
  private handleConfigChange(_config: ViewportConfig, viewport: ViewportInfo): void {
    this.applyLayout(viewport);
  }
  
  private applyLayout(viewport: ViewportInfo): void {
    // Calculate sizes based on viewport dimensions and device type
    const buttonSize = this.calculateButtonSize(viewport);
    const buttonGap = Math.min(25, viewport.width * 0.06);
    
    // Apply horizontal layout for action buttons (GameBoy style)
    if (this.actionButtonsContainer) {
      this.actionButtonsContainer.style.display = 'flex';
      this.actionButtonsContainer.style.flexDirection = 'row';
      this.actionButtonsContainer.style.gap = `${buttonGap}px`;
      this.actionButtonsContainer.style.justifyContent = 'center';
      
      // Apply GameBoy style to action buttons
      const actionButtons = this.actionButtonsContainer.querySelectorAll('.action-button');
      actionButtons.forEach((button) => {
        const htmlButton = button as HTMLElement;
        htmlButton.style.width = `${buttonSize}px`;
        htmlButton.style.height = `${buttonSize}px`;
        htmlButton.style.transform = 'rotate(-15deg)'; // GameBoy style rotation
      });
    }
    
    // Adjust D-pad based on viewport
    if (this.dpadContainer) {
      const dpadGap = Math.min(15, viewport.width * 0.03);
      this.dpadContainer.style.gap = `${dpadGap}px`;
      
      // Update D-pad button sizes
      const dpadButtons = this.dpadContainer.querySelectorAll('.dpad-button');
      dpadButtons.forEach((button) => {
        const htmlButton = button as HTMLElement;
        htmlButton.style.width = `${buttonSize}px`;
        htmlButton.style.height = `${buttonSize}px`;
      });
    }
    
    // Adjust container padding based on device type
    const bottomPadding = viewport.screenType === 'phone' ? 40 : 20;
    this.container.style.padding = `10px 10px ${bottomPadding}px 10px`;
    
    // Ensure container is properly positioned
    this.container.style.position = 'fixed';
    this.container.style.bottom = '0';
    this.container.style.left = '0';
    this.container.style.right = '0';
    this.container.style.zIndex = '1000';
    this.container.style.display = 'flex';
    this.container.style.justifyContent = 'space-between';
    
    // Add gradient background
    this.container.style.background = 'linear-gradient(to top, rgba(10, 25, 47, 0.8), transparent)';
  }
  
  private calculateButtonSize(viewport: ViewportInfo): number {
    // Calculate button size based on device type and orientation
    switch (viewport.screenType) {
      case 'phone':
        return viewport.orientation === 'portrait' 
          ? Math.min(65, viewport.width * 0.15) 
          : Math.min(60, viewport.height * 0.15);
      case 'tablet':
        return Math.min(75, viewport.width * 0.1);
      default:
        return 70; // Default size
    }
  }
  
  dispose(): void {
    if (this.disposeFn) {
      this.disposeFn();
    }
  }
}