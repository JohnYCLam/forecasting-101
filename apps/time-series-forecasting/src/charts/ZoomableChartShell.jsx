import useChartZoom from './useChartZoom';
import ChartZoomControls from './ChartZoomControls';
import { computeDynamicYDomain } from './zoomMath';

/**
 * Reusable zoom/pan shell for one or more charts.
 * Pass a render function:
 *   children(zoomDomain, computeYDomain, autoYDomain) => ReactNode
 *
 * Optional props for automated Y-axis auto-scaling:
 *   data: Array of chart rows
 *   dataKeys: Array of keys to scale (optional, auto-detected if omitted)
 */
export default function ZoomableChartShell({
  defaultDomain,
  minTime = 0,
  maxTime,
  minRange = 4,
  style,
  data,
  dataKeys,
  children,
}) {
  const {
    zoomDomain,
    chartRef,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleMouseDown,
    handleMouseMove,
  } = useChartZoom({ defaultDomain, minTime, maxTime, minRange });

  const computeYDomain = (chartData = data, keys = dataKeys, options) =>
    computeDynamicYDomain(chartData, keys, zoomDomain, options);

  const autoYDomain = data ? computeYDomain(data, dataKeys) : ['auto', 'auto'];

  return (
    <div
      className="zoomable-chart-shell"
      ref={chartRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <ChartZoomControls
        onReset={handleResetZoom}
        onZoomOut={() => handleZoomOut(0.5)}
        onZoomIn={() => handleZoomIn(0.5)}
      />
      {typeof children === 'function'
        ? children(zoomDomain, computeYDomain, autoYDomain)
        : children}
    </div>
  );
}
