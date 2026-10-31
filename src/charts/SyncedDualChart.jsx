import SyncedStackedChart from './SyncedStackedChart';

/**
 * Convenience wrapper for two vertically stacked, zoom-synced panels.
 * Prefer SyncedStackedChart when you need 3+ panels.
 */
export default function SyncedDualChart({
  defaultDomain,
  minTime = 0,
  maxTime,
  minRange = 4,
  top,
  bottom,
  gap = '1rem',
  style,
}) {
  return (
    <SyncedStackedChart
      defaultDomain={defaultDomain}
      minTime={minTime}
      maxTime={maxTime}
      minRange={minRange}
      gap={gap}
      style={style}
      panels={[top, bottom]}
    />
  );
}
