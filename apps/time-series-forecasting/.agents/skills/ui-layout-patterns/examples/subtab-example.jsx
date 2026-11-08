// Example of one complete subtab, modeled on src/Topic5.jsx. Not runnable inside .agents; copy the shape.
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Info } from 'lucide-react';
import { MathText } from './MathText';
import { ZoomableChartShell } from './charts';

// 1) Local Layout (copy from Topic5.jsx; each topic file has its own copy)
const Layout = ({ title = 'Explanation', commentary, dataset, controls, chart, chartHeight = '720px', extraCardTitle = null, extraCard = null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div className="top-panels">
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><BrainCircuit size={18} /> {title}</h4>
          {commentary}
        </div>
      </div>
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><Info size={18} /> Dataset Details</h4>
          {dataset}
        </div>
      </div>
    </div>
    {extraCard && (
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><BrainCircuit size={18} /> {extraCardTitle || 'Deep Dive'}</h4>
          {extraCard}
        </div>
      </div>
    )}
    {controls && (
      <div className="glass controls-panel" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem 1.25rem' }}>
        {controls}
      </div>
    )}
    <div className="glass chart-container" style={{ width: '100%', height: chartHeight, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      {chart}
    </div>
  </div>
);

// 2) A subtab with in-card commentary tabs, an option-button control, and data-driven numbers
export function ExampleSubtab({ data }) {
  const [view, setView] = useState(data.views[0]);        // default shows the key effect
  const [commentaryTab, setCommentaryTab] = useState(1);  // 1 idea | 2 demo | 3 how to read
  const v = data.byView[view];                            // everything numeric comes from JSON
  const rows = v.actual.map((a, i) => ({ time: i, actual: a, forecast: v.forecast[i] ?? null, baseline: v.baseline[i] ?? null }));
  const n = rows.length;

  const commentaryTabs = (
    <div className="tabs" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
      {[{ id: 1, label: 'What X is' }, { id: 2, label: 'The demo' }, { id: 3, label: 'How to read the chart' }].map((t) => (
        <button key={t.id} className={`tab ${commentaryTab === t.id ? 'active' : ''}`} onClick={() => setCommentaryTab(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );

  const body = {
    1: (
      <>
        <p><strong>Why the baseline alone fails:</strong> it sees only each series' own past, so it misses ...</p>
        <p><strong>What X is:</strong> plain-language definition, then the key equation.</p>
        <div style={{ background: 'var(--primary-bg)', padding: '0.55rem', borderRadius: '6px', textAlign: 'center' }}>
          <MathText tex="y_t = c + \phi y_{t-1} + \varepsilon_t" />
        </div>
      </>
    ),
    2: (
      <p>
        <strong>Out-of-sample RMSE ({view}):</strong> the model scores {v.rmse_model.toFixed(2)} versus {v.rmse_baseline.toFixed(2)} for the baseline.
      </p>
    ),
    3: (
      <p><strong>Visual reading guide:</strong> the blue line is the actual series, the red dashed line the forecast, the grey line the baseline. Look for ...</p>
    ),
  }[commentaryTab];

  return (
    <Layout
      title="N.1 Title that states the idea"
      commentary={
        <div>
          {commentaryTabs}
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>{body}</div>
        </div>
      }
      dataset={<p>What the data is, period and size, units, train/test split, how orders were chosen. Interpolate numbers from `data`.</p>}
      controls={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>View:</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {data.views.map((name) => (
              <button key={name} className={`nav-btn ${view === name ? 'primary' : 'secondary'}`} onClick={() => setView(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      }
      chart={
        <ZoomableChartShell defaultDomain={[0, n - 1]} minTime={0} maxTime={n - 1} minRange={8}>
          {(zoomDomain) => (
            <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
              <LineChart data={rows} margin={{ top: 28, right: 20, left: 10, bottom: 8 }} style={{ pointerEvents: 'auto' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                <Legend />
                <Line dataKey="actual" name="Actual" stroke="#2563eb" dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line dataKey="baseline" name="Baseline" stroke="#9ca3af" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                <Line dataKey="forecast" name="Model forecast" stroke="#ef4444" dot={false} strokeWidth={2} strokeDasharray="6 4" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ZoomableChartShell>
      }
    />
  );
}
