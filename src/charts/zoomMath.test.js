import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDomain,
  resolveFocalFraction,
  zoomInDomain,
  zoomOutDomain,
  ZOOM_IN_FACTOR,
} from './zoomMath.js';

describe('zoomMath', () => {
  it('normalizes invalid domains to the full span', () => {
    assert.deepEqual(normalizeDomain([NaN, 10], 0, 100), [0, 100]);
    assert.deepEqual(normalizeDomain(null, 0, 100), [0, 100]);
  });

  it('treats non-numeric focal args (React events) as center', () => {
    assert.equal(resolveFocalFraction({ type: 'click' }), 0.5);
    assert.equal(resolveFocalFraction(undefined), 0.5);
    assert.equal(resolveFocalFraction(0.25), 0.25);
  });

  it('zooms in by one discrete level, not to the min range', () => {
    const next = zoomInDomain([0, 100], 0.5, 0, 100, 8);
    const range = next[1] - next[0];
    assert.ok(range > 70 && range < 80, `expected ~75, got ${range}`);
    assert.equal(Number.isFinite(next[0]), true);
    assert.equal(Number.isFinite(next[1]), true);
    assert.ok(Math.abs(range - 100 * ZOOM_IN_FACTOR) < 1e-9);
  });

  it('does not produce NaN when a click event is passed as focalFraction', () => {
    const next = zoomInDomain([0, 100], { type: 'click' }, 0, 100, 8);
    assert.equal(Number.isFinite(next[0]), true);
    assert.equal(Number.isFinite(next[1]), true);
    assert.ok(next[1] - next[0] > 70);
  });

  it('stops near minRange after repeated zoom-in', () => {
    let domain = [0, 16];
    for (let i = 0; i < 12; i += 1) {
      domain = zoomInDomain(domain, 0.5, 0, 100, 8);
    }
    const range = domain[1] - domain[0];
    assert.ok(range >= 8 && range <= 8.5, `expected ~8, got ${range}`);
  });

  it('zooms out toward the full span', () => {
    const next = zoomOutDomain([25, 75], 0.5, 0, 100, 8);
    assert.ok(next[1] - next[0] > 50);
    assert.ok(next[0] >= 0 && next[1] <= 100);
  });

  describe('computeDynamicYDomain', () => {
    it('returns auto when data is empty or invalid', async () => {
      const { computeDynamicYDomain } = await import('./zoomMath.js');
      assert.deepEqual(computeDynamicYDomain(null), ['auto', 'auto']);
      assert.deepEqual(computeDynamicYDomain([]), ['auto', 'auto']);
    });

    it('dynamically bounds Y axis to the visible window slice', async () => {
      const { computeDynamicYDomain } = await import('./zoomMath.js');
      const data = [
        { time: 0, val: 50 },
        { time: 50, val: 100 },
        { time: 100, val: 200 },
      ];
      // Full timeline
      const full = computeDynamicYDomain(data, ['val'], [0, 100]);
      assert.ok(full[0] <= 50 && full[1] >= 200);

      // Zoomed to [40, 60] -> only point at time 50 with val: 100 is visible
      const zoomed = computeDynamicYDomain(data, ['val'], [40, 60]);
      assert.ok(zoomed[0] > 50, `expected min > 50, got ${zoomed[0]}`);
      assert.ok(zoomed[1] < 200, `expected max < 200, got ${zoomed[1]}`);
    });

    it('auto-detects numeric keys when keys argument is omitted', async () => {
      const { computeDynamicYDomain } = await import('./zoomMath.js');
      const data = [
        { time: 0, a: 120, b: 140 },
        { time: 10, a: 125, b: 145 },
      ];
      const res = computeDynamicYDomain(data, null, [0, 10]);
      assert.ok(res[0] <= 120 && res[1] >= 145);
    });

    it('supports forceIncludeZero option', async () => {
      const { computeDynamicYDomain } = await import('./zoomMath.js');
      const data = [
        { time: 0, val: 10 },
        { time: 10, val: 20 },
      ];
      const res = computeDynamicYDomain(data, ['val'], [0, 10], { forceIncludeZero: true });
      assert.ok(res[0] <= 0);
    });

    it('handles small decimal values cleanly without crushing to integers', async () => {
      const { computeDynamicYDomain } = await import('./zoomMath.js');
      const data = [
        { time: 0, ret: 0.012 },
        { time: 10, ret: 0.038 },
      ];
      const res = computeDynamicYDomain(data, ['ret'], [0, 10]);
      assert.ok(res[0] < 0.012 && res[0] > 0);
      assert.ok(res[1] > 0.038 && res[1] < 0.1);
    });
  });
});

