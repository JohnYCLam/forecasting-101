import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const btnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-main)',
  cursor: 'pointer',
  padding: '4px',
};

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
      style={{
        position: 'absolute',
        top: 5,
        right: 10,
        zIndex: 10,
        display: 'flex',
        gap: '0.25rem',
        opacity: 0.75,
      }}
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
        style={btnStyle}
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
        style={btnStyle}
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
        style={btnStyle}
      >
        <ZoomIn size={18} />
      </button>
    </div>
  );
}
