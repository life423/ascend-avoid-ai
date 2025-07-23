export interface CanvasStrategy {
  mode: 'fit' | 'fill' | 'stretch' | 'pixelPerfect';
  designWidth: number;
  designHeight: number;
}
export interface Viewport { width: number; height: number; }

export function resolveCanvas(
  strategy: CanvasStrategy,
  vp: Viewport
): { cssWidth: number; cssHeight: number; scale: number } {
  const { designWidth: dw, designHeight: dh } = strategy;
  const { width: vw, height: vh } = vp;

  switch (strategy.mode) {
    case 'fit':  {
      const s = Math.min(vw / dw, vh / dh);
      return { cssWidth: Math.round(dw * s), cssHeight: Math.round(dh * s), scale: s };
    }
    case 'fill': {
      const s = Math.max(vw / dw, vh / dh);
      return { cssWidth: Math.round(dw * s), cssHeight: Math.round(dh * s), scale: s };
    }
    case 'pixelPerfect': {
      const s = Math.max(1, Math.floor(Math.min(vw / dw, vh / dh)));
      return { cssWidth: dw * s, cssHeight: dh * s, scale: s };
    }
    case 'stretch': {
      return { cssWidth: vw, cssHeight: vh, scale: NaN };
    }
    default: throw new Error(`Unknown mode ${(strategy as any).mode}`);
  }
}
