// Example: ONE zoomable chart. Adapt data keys, colors, numbers only.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ZoomableChartShell } from './charts';

// `series` = array of { time: number, actual: number, forecast: number|null }
export function SingleZoomChart({ series }) {
  const n = series.length;
  return (
    <div style={{ height: 380 }}>
      <ZoomableChartShell defaultDomain={[0, n - 1]} minTime={0} maxTime={n - 1} minRange={8}>
        {(zoomDomain) => (
          <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            <LineChart data={series} margin={{ top: 28, right: 20, left: 10, bottom: 8 }} style={{ pointerEvents: 'auto' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#2563eb" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#ef4444" dot={false} strokeWidth={2} strokeDasharray="5 5" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ZoomableChartShell>
    </div>
  );
}
