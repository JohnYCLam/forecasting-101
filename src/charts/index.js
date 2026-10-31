/**
 * Shared chart interaction layer for Topics 1–5.
 *
 * Use these for any new time-series chart with zoom/pan:
 * - ZoomableChartShell  — single chart (or custom layout via render prop)
 * - SyncedDualChart     — two stacked panels, shared zoom
 * - SyncedStackedChart  — N stacked panels, shared zoom
 * - ChartZoomControls   — only if building a new shell (prefer shells above)
 * - useChartZoom        — only if building a new shell
 *
 * Do not re-implement handleZoomIn / wheel / pan outside this folder.
 */
export { default as ZoomableChartShell } from './ZoomableChartShell';
export { default as SyncedDualChart } from './SyncedDualChart';
export { default as SyncedStackedChart } from './SyncedStackedChart';
export { default as ChartZoomControls } from './ChartZoomControls';
export { default as useChartZoom } from './useChartZoom';
export * from './zoomMath';
