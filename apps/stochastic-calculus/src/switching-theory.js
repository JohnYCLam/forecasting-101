import { OBS_STEP, THRESHOLD, sourceDrift } from './switching-ml.js';

// Evolve the backward diffusion equation between readings. Reapply the flag
// condition only at a reading, so an unobserved crossing does not score a hit.
export function sourceVisitCurve(sigma, start, duration) {
  const readings = Math.round(duration / OBS_STEP);
  const curve = new Float64Array(readings + 1);
  if (start >= THRESHOLD) return curve.fill(1);
  if (sigma === 0) {
    if (start > 0) {
      const hitTime = Math.log((1 / start**2 - 1) / (1 / THRESHOLD**2 - 1)) / 2;
      curve.fill(1, Math.ceil(hitTime / OBS_STEP));
    }
    return curve;
  }
  const dx = 0.005, radius = 3, steps = 16;
  const cells = Math.round(2 * radius / dx);
  const cutoff = Math.round((THRESHOLD + radius) / dx);
  const halfDt = OBS_STEP / (2 * steps);
  const diffusion = sigma * sigma / 2;
  const makeGrid = () => new Float64Array(cells);
  const left = makeGrid(), right = makeGrid(), inverse = makeGrid(), upper = makeGrid();
  const value = makeGrid(), rhs = makeGrid();
  const weight = z => z === 0 ? 1 : z / Math.expm1(z);
  for (let i = 0; i < cells; i++) {
    const x = -radius + (i + 0.5) * dx;
    const z = sourceDrift(x) * dx / diffusion;
    const scale = halfDt * diffusion / (dx * dx);
    left[i] = i === 0 ? 0 : scale * weight(z);
    right[i] = i === cells - 1 ? 0 : scale * weight(-z);
    // Reflect at the outer grid edges. Factor the common tridiagonal matrix once.
    inverse[i] = 1 / (1 + left[i] + right[i] - (i ? left[i] * upper[i-1] : 0));
    upper[i] = right[i] * inverse[i];
  }
  function advance(centered) {
    for (let i = 0; i < cells; i++) {
      let v = value[i];
      if (centered) {
        if (i > 0) v += left[i] * (value[i-1] - value[i]);
        if (i + 1 < cells) v += right[i] * (value[i+1] - value[i]);
      }
      rhs[i] = (v + (i ? left[i] * rhs[i-1] : 0)) * inverse[i];
    }
    value[cells-1] = rhs[cells-1];
    for (let i = cells-2; i >= 0; i--) value[i] = rhs[i] + upper[i] * value[i+1];
  }
  const index = (start + radius) / dx - 0.5;
  const i = Math.floor(index);
  for (let k = 1; k <= readings; k++) {
    value.fill(1, cutoff);
    // Two implicit half-steps smooth the discontinuity before Crank–Nicolson.
    advance(false);
    advance(false);
    for (let s = 1; s < steps; s++) advance(true);
    curve[k] = Math.min(1, Math.max(0, value[i] + (index-i) * (value[i+1]-value[i])));
  }
  return curve;
}
