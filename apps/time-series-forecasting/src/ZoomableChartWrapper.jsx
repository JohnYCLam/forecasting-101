/**
 * Backward-compatible export. New code should import from './charts/ZoomableChartShell'.
 * Zoom is discrete (0.75× per step), ignores React click events as focal args,
 * and blocks pan-start on the control buttons.
 */
export { default } from './charts/ZoomableChartShell';
