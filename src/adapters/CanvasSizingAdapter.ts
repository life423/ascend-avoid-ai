import { ResponsiveSystem } from '../systems/UnifiedResponsiveSystem';
import type { CanvasStrategy, ResolvedCanvas, ViewportInfo } from '../systems/UnifiedResponsiveSystem';

export class CanvasSizingAdapter {
  private canvas: HTMLCanvasElement;
  private disposeFn: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // subscribe once
    this.disposeFn = ResponsiveSystem.subscribe(({ canvasStrategy }: { canvasStrategy: CanvasStrategy }, viewport: ViewportInfo) => {
      if (!this.enabled()) return;             // legacy path guard
      const resolved = CanvasSizingAdapter.resolve(canvasStrategy, viewport);
      this.apply(resolved);
    });

    // run once now
    const cfg = ResponsiveSystem.getCurrentConfig();
    const vp  = ResponsiveSystem.getViewportInfo();
    if (cfg && vp) {
      this.apply(CanvasSizingAdapter.resolve(cfg.canvasStrategy, vp));
    }
  }

  /** feature flag read‑helper */
  private enabled(): boolean {
    return localStorage.getItem('AA_EXPERIMENTAL_UNIFIED_RS') === '1';
  }

  /** math only ‑ pure & unit‑testable */
  static resolve(strategy: CanvasStrategy, vp: ViewportInfo): ResolvedCanvas {
    const { designWidth: dw, designHeight: dh } = strategy;
    const vw = vp.width, vh = vp.height;

    switch (strategy.mode) {
      case 'fit': {
        const scale = Math.min(vw / dw, vh / dh);
        return dims(scale);
      }
      case 'fill': {
        const scale = Math.max(vw / dw, vh / dh);
        return dims(scale);
      }
      case 'pixelPerfect': {
        // integer scale not exceeding viewport
        const scale = Math.max(1, Math.floor(Math.min(vw / dw, vh / dh)));
        return dims(scale);
      }
      case 'stretch': {
        const sx = vw / dw, sy = vh / dh;
        return {
          cssWidth : Math.round(dw * sx),
          cssHeight: Math.round(dh * sy),
          scale    : NaN          // non‑uniform, game logic must read sx,sy separately
        };
      }
      default: throw new Error(`Unknown mode ${(strategy as any).mode}`);
    }

    function dims(scale: number): ResolvedCanvas {
      if (strategy.minScale) scale = Math.max(scale, strategy.minScale);
      const cssWRaw = Math.round(dw * scale);
      const cssHRaw = Math.round(dh * scale);
      const cssWidth  = strategy.maxWidth  ? Math.min(cssWRaw, strategy.maxWidth)  : cssWRaw;
      const cssHeight = strategy.maxHeight ? Math.min(cssHRaw, strategy.maxHeight) : cssHRaw;
      return { cssWidth, cssHeight, scale };
    }
  }

  /** DOM side‑effects isolated here */
  private apply({ cssWidth, cssHeight }: ResolvedCanvas) {
    this.canvas.style.width  = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    // IMPORTANT: keep backing‑store resolution (*attribs*) on legacy path
    this.canvas.width  = cssWidth  * devicePixelRatio;
    this.canvas.height = cssHeight * devicePixelRatio;
  }

  /** clean up when scene disposes */
  dispose() { this.disposeFn(); }
}