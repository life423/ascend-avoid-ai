import { CanvasSizingAdapter } from '../src/adapters/CanvasSizingAdapter';

describe('Canvas resolve()', () => {
  const vp = { width: 390, height: 844 }; // portrait phone

  it.each([
    [{ mode:'fit', designWidth:720, designHeight:1280 }, 390],
    [{ mode:'fill', designWidth:720, designHeight:1280 }, 844],
    [{ mode:'pixelPerfect', designWidth:240, designHeight:320 }, 320],
  ])('strategy %p', (strategy, expectedMax) => {
    const { cssHeight } = CanvasSizingAdapter.resolve(strategy as any, vp as any);
    expect(cssHeight).toBeLessThanOrEqual(expectedMax);
  });
});