import ZoomableChartShell from './ZoomableChartShell';

/**
 * N vertically stacked panels sharing one zoom/pan shell.
 * panel: { key?, title?, content: (zoomDomain) => node, flex?, minHeight?, bodyMinHeight? }
 */
export default function SyncedStackedChart({
  defaultDomain,
  minTime = 0,
  maxTime,
  minRange = 4,
  panels = [],
  gap = '1rem',
  style,
}) {
  const activePanels = (panels || []).filter(Boolean);

  return (
    <ZoomableChartShell
      defaultDomain={defaultDomain}
      minTime={minTime}
      maxTime={maxTime}
      minRange={minRange}
      style={style}
    >
      {(zoomDomain, computeYDomain) => (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap,
            paddingTop: '0.25rem',
          }}
        >
          {activePanels.map((panel, idx) => (
            <div
              key={panel.key || idx}
              style={{
                flex: panel.flex ?? 1,
                minHeight: panel.minHeight || '200px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {panel.title && (
                <div
                  style={{
                    marginBottom: '0.35rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    paddingRight: '5.5rem',
                    color: 'var(--text-main)',
                    textAlign: panel.titleAlign || 'left',
                  }}
                >
                  {panel.title}
                </div>
              )}
              <div style={{ flex: 1, minHeight: panel.bodyMinHeight || '160px' }}>
                {typeof panel.content === 'function'
                  ? panel.content(zoomDomain, computeYDomain)
                  : panel.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </ZoomableChartShell>
  );
}
