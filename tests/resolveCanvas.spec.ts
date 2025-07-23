import { resolveCanvas } from '../src/utils/resolveCanvas';

describe('resolveCanvas', () => {
  const vp = { width: 390, height: 844 };

  it('fit never exceeds viewport', () => {
    const r = resolveCanvas({ mode:'fit', designWidth:720, designHeight:1280 }, vp);
    expect(r.cssWidth).toBeLessThanOrEqual(vp.width);
    expect(r.cssHeight).toBeLessThanOrEqual(vp.height);
  });

  it('fill always covers viewport', () => {
    const r = resolveCanvas({ mode:'fill', designWidth:720, designHeight:1280 }, vp);
    expect(r.cssWidth).toBeGreaterThanOrEqual(vp.width);
    expect(r.cssHeight).toBeGreaterThanOrEqual(vp.height);
  });
});
