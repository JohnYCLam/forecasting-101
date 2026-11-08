import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

/**
 * Shared reset / zoom-out / zoom-in controls.
 * stopPropagation prevents chart pan from starting on button press.
 */
export default function ChartZoomControls({ onReset, onZoomOut, onZoomIn }) {
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      data-chart-zoom-controls
      className="chart-zoom-controls"
      onMouseDown={stop}
      onTouchStart={stop}
    >
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onReset();
        }}
        title="Reset Zoom"
        aria-label="Reset Zoom"
      >
        <RotateCcw size={18} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onZoomOut();
        }}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onZoomIn();
        }}
        title="Zoom In"
        aria-label="Zoom In"
      >
        <ZoomIn size={18} />
      </button>
    </div>
  );
}
