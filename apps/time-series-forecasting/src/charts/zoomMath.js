/** Discrete zoom factor per click / wheel notch (level-by-level). */
export const ZOOM_IN_FACTOR = 0.75;
export const ZOOM_OUT_FACTOR = 1 / ZOOM_IN_FACTOR;

export function normalizeDomain(domain, minTime, maxTime) {
  if (!Array.isArray(domain) || domain.length < 2) {
    return [minTime, maxTime];
  }
  let left = Number(domain[0]);
  let right = Number(domain[1]);
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return [minTime, maxTime];
  }
  if (right < left) {
    [left, right] = [right, left];
  }
  const span = Math.max(right - left, 1e-6);
  if (left < minTime) {
    left = minTime;
    right = minTime + span;
  }
  if (right > maxTime) {
    right = maxTime;
    left = maxTime - span;
  }
  return [Math.max(minTime, left), Math.min(maxTime, right)];
}

export function resolveFocalFraction(focalFraction) {
  return typeof focalFraction === 'number' && Number.isFinite(focalFraction)
    ? Math.max(0, Math.min(1, focalFraction))
    : 0.5;
}

export function minAllowedRange(minTime, maxTime, minRange = 4) {
  const fullSpan = Math.max(maxTime - minTime, 1);
  return Math.max(minRange, Math.min(fullSpan, Math.ceil(fullSpan * 0.06)));
}

export function clampDomain(left, right, range, minTime, maxTime, minAllowed) {
  let newLeft = left;
  let newRight = right;
  const span = Math.max(range, minAllowed);
  if (newLeft < minTime) {
    newLeft = minTime;
    newRight = minTime + span;
  }
  if (newRight > maxTime) {
    newRight = maxTime;
    newLeft = maxTime - span;
  }
  return [
    Math.max(minTime, newLeft),
    Math.min(maxTime, Math.max(newLeft + 1e-6, newRight)),
  ];
}

export function zoomInDomain(prev, focalFraction, minTime, maxTime, minRange = 4) {
  const focal = resolveFocalFraction(focalFraction);
  const minAllowed = minAllowedRange(minTime, maxTime, minRange);
  const range = prev[1] - prev[0];
  if (!Number.isFinite(range) || range <= minAllowed * 1.02) return prev;
  const newRange = Math.max(minAllowed, range * ZOOM_IN_FACTOR);
  const focus = prev[0] + range * focal;
  const newLeft = focus - newRange * focal;
  return clampDomain(newLeft, newLeft + newRange, newRange, minTime, maxTime, minAllowed);
}

export function zoomOutDomain(prev, focalFraction, minTime, maxTime, minRange = 4) {
  const focal = resolveFocalFraction(focalFraction);
  const fullSpan = Math.max(maxTime - minTime, 1);
  const minAllowed = minAllowedRange(minTime, maxTime, minRange);
  const range = prev[1] - prev[0];
  if (!Number.isFinite(range)) return [minTime, maxTime];
  if (range >= fullSpan * 0.999) return [minTime, maxTime];
  const newRange = Math.min(fullSpan, range * ZOOM_OUT_FACTOR);
  const focus = prev[0] + range * focal;
  const newLeft = focus - newRange * focal;
  return clampDomain(newLeft, newLeft + newRange, newRange, minTime, maxTime, minAllowed);
}

/**
 * Dynamically computes the Y-axis [min, max] domain for a time-series slice.
 * Automatically rescales vertical axes when zooming or panning.
 *
 * @param {Array<Object>} data - Full chart dataset
 * @param {Array<string>} [keys] - Series keys to scan. If omitted, auto-detects all numeric keys.
 * @param {[number, number]} [zoomDomain] - Current [minTime, maxTime] visible window
 * @param {Object} [options]
 * @param {number} [options.paddingPct=0.08] - Vertical padding fraction (e.g. 0.08 = 8%)
 * @param {boolean} [options.forceIncludeZero=false] - Whether zero must be inside the domain
 * @param {number} [options.minRange=0] - Minimum Y span to enforce
 * @returns {[number, number]|['auto', 'auto']}
 */
export function computeDynamicYDomain(data, keys, zoomDomain, options = {}) {
  if (!Array.isArray(data) || data.length === 0) return ['auto', 'auto'];
  const {
    paddingPct = 0.08,
    forceIncludeZero = false,
    minRange = 0,
  } = options;

  let visible = data;
  if (Array.isArray(zoomDomain) && Number.isFinite(zoomDomain[0]) && Number.isFinite(zoomDomain[1])) {
    const left = Math.min(zoomDomain[0], zoomDomain[1]);
    const right = Math.max(zoomDomain[0], zoomDomain[1]);
    if (data[0] && typeof data[0].time === 'number') {
      visible = data.filter((d) => d && typeof d.time === 'number' && d.time >= left && d.time <= right);
    } else {
      const startIdx = Math.max(0, Math.min(data.length - 1, Math.floor(left)));
      const endIdx = Math.max(startIdx, Math.min(data.length - 1, Math.ceil(right)));
      visible = data.slice(startIdx, endIdx + 1);
    }
  }
  if (!visible || visible.length === 0) visible = data;

  let activeKeys = Array.isArray(keys) && keys.length > 0 ? keys : null;
  if (!activeKeys) {
    const keySet = new Set();
    const sample = visible.slice(0, Math.min(visible.length, 50));
    for (const row of sample) {
      if (!row || typeof row !== 'object') continue;
      for (const [k, v] of Object.entries(row)) {
        if (k !== 'time' && k !== 'index' && typeof v === 'number' && Number.isFinite(v)) {
          keySet.add(k);
        }
      }
    }
    activeKeys = Array.from(keySet);
  }
  if (!activeKeys.length) return ['auto', 'auto'];

  let min = Infinity;
  let max = -Infinity;
  for (const row of visible) {
    if (!row) continue;
    for (const k of activeKeys) {
      const v = row[k];
      if (typeof v === 'number' && Number.isFinite(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return ['auto', 'auto'];

  if (forceIncludeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  let span = max - min;
  if (span < minRange) {
    const diff = (minRange - span) / 2;
    min -= diff;
    max += diff;
    span = max - min;
  }

  const pad = span > 0 ? span * paddingPct : (Math.abs(min) * 0.1 || 1);
  let low = min - pad;
  let high = max + pad;

  if (high - low >= 10) {
    return [Math.floor(low), Math.ceil(high)];
  }

  const rawSpan = high - low;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rawSpan, 1e-6))));
  const step = mag >= 1 ? 1 : mag / 10;
  return [
    Number((Math.floor(low / step) * step).toFixed(6)),
    Number((Math.ceil(high / step) * step).toFixed(6)),
  ];
}

