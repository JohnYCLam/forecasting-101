// Example: TWO stacked charts with shared zoom. For 3+ panels use SyncedStackedChart with `panels={[...]}`.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SyncedDualChart } from './charts';

const makePanel = (title, dataKey, color, data) => ({
  title,
  content: (zoomDomain) => (
    <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
      {/* same syncId on every panel */}
      <LineChart syncId="mySync" data={data} margin={{ top: 28, right: 20, left: 10, bottom: 8 }} style={{ pointerEvents: 'auto' }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
        <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
        <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  ),
});

export function DualChart({ data }) {
  const n = data.length;
  return (
    <div style={{ height: 560 }}>
      <SyncedDualChart
        defaultDomain={[0, n - 1]}
        minTime={0}
        maxTime={n - 1}
        minRange={8}
        top={makePanel('Series Y1', 'y1', '#2563eb', data)}
        bottom={makePanel('Series Y2', 'y2', '#10b981', data)}
      />
    </div>
  );
}
