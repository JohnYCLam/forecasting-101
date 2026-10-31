import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Cpu,
  Info,
  BrainCircuit,
  Table as TableIcon,
  Layers,
  Sliders,
} from 'lucide-react';
import { MathText } from './MathText';
import { ZoomableChartShell, computeDynamicYDomain } from './charts';

const comparisonTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'center',
  background: 'var(--surface)',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid var(--border)',
  fontSize: '0.88rem',
};

const tableHeaderCellStyle = {
  padding: '0.65rem',
  borderBottom: '1px solid var(--border)',
  background: 'var(--primary-bg)',
  fontWeight: 600,
};

const tableCellStyle = {
  padding: '0.65rem',
  borderBottom: '1px solid var(--border)',
};

const Layout = ({
  title = "Explanation",
  commentary,
  dataset,
  controls,
  chart,
  chartHeight = "540px",
  extraCardTitle = null,
  extraCard = null,
  controlsPosition = "belowExtraCard",
}) => (
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

    {controls && controlsPosition === "aboveExtraCard" && (
      <div className="glass controls-panel" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem 1.25rem' }}>
        {controls}
      </div>
    )}

    {extraCard && (
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><Cpu size={18} /> {extraCardTitle || 'Deep Dive'}</h4>
          {extraCard}
        </div>
      </div>
    )}

    {controls && controlsPosition !== "aboveExtraCard" && (
      <div className="glass controls-panel" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem 1.25rem' }}>
        {controls}
      </div>
    )}

    {chart && (
      <div className="glass chart-container" style={{ width: '100%', height: chartHeight, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        {chart}
      </div>
    )}
  </div>
);

export default function Topic6({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subtopic 6.1 State
  const [tab1CommentaryTab, setTab1CommentaryTab] = useState(1); // 1: Motivation, 2: Mechanism, 3: Guided Evidence, 4: Decision/Choice of Learner
  const [tab1FeatureGroup, setTab1FeatureGroup] = useState('safe_full'); // 'safe_full' | 'lags_only' | 'lags_rolling' | 'leaky_rolling'
  const [tab1ShowBaseline, setTab1ShowBaseline] = useState(true);
  const [tab1ExtraView, setTab1ExtraView] = useState('table'); // 'table' | 'scorecard'

  // Subtopic 6.2 State
  const [tab2CommentaryTab, setTab2CommentaryTab] = useState(1); // 1: Three Philosophies, 2: Heat Surge Mechanism, 3: Guided Evidence, 4: Complexity & Generalization
  const [tab2View, setTab2View] = useState('timeline'); // 'timeline' | 'temp_curve' | 'residuals'
  const [tab2Complexity, setTab2Complexity] = useState('balanced'); // 'balanced' | 'underfit' | 'overfit'
  const [tab2ShowRidge, setTab2ShowRidge] = useState(true);
  const [tab2ShowRF, setTab2ShowRF] = useState(true);
  const [tab2ShowXGB, setTab2ShowXGB] = useState(true);
  const [tab2ExtraView, setTab2ExtraView] = useState('scorecard'); // 'scorecard' | 'family'

  useEffect(() => {
    fetch(`/topic6_data.json?t=${new Date().getTime()}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load topic 6 data", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Topic 6 Machine Learning Engine...</div>;
  }

  // =========================================================================
  // SUBTOPIC 6.1: From a Time Series to a Supervised-Learning Table
  // =========================================================================
  if (activeTab === 1) {
    const t1 = data.tab1 || {};
    const metrics = t1.metrics || {};
    const safeMetrics = metrics.safe_full || {};
    const lagsMetrics = metrics.lags_only || {};
    const leakyMetrics = metrics.leaky_rolling || {};
    const snMetrics = metrics.seasonal_naive || {};
    const timeline = t1.timeline || [];
    const sampleTable = t1.sample_feature_table || [];

    const activeModelMetrics = metrics[tab1FeatureGroup] || safeMetrics;
    const originIdx = typeof t1.origin_index === 'number' ? t1.origin_index : 0;

    // Pre-formatted strings to eliminate JSX ternaries inside <strong> and avoid nullish number fallbacks
    const safeTestMaeStr = safeMetrics.test_mae != null ? `${Number(safeMetrics.test_mae).toFixed(2)} MW` : 'n/a';
    const snTestMaeStr = snMetrics.test_mae != null ? `${Number(snMetrics.test_mae).toFixed(2)} MW` : 'n/a';
    const safeTrainMaeStr = safeMetrics.train_mae != null ? `${Number(safeMetrics.train_mae).toFixed(0)} MW` : 'n/a';
    const leakyTrainMaeStr = leakyMetrics.train_mae != null ? `${Number(leakyMetrics.train_mae).toFixed(0)} MW` : 'n/a';
    const leakyTestMaeStr = leakyMetrics.test_mae != null ? `${Number(leakyMetrics.test_mae).toFixed(0)} MW` : 'n/a';
    const lagsTestMaeStr = lagsMetrics.test_mae != null ? `${Number(lagsMetrics.test_mae).toFixed(0)} MW` : 'n/a';
    const activeTestMaeStr = activeModelMetrics.test_mae != null ? `${Number(activeModelMetrics.test_mae).toFixed(1)} MW` : 'n/a';
    const snTestMaeHeaderStr = snMetrics.test_mae != null ? `${Number(snMetrics.test_mae).toFixed(1)} MW` : 'n/a';

    const safeDiffVal = safeMetrics.test_mae != null && snMetrics.test_mae != null
      ? Number(snMetrics.test_mae - safeMetrics.test_mae).toFixed(2)
      : null;
    const safeGainPctVal = safeMetrics.test_mae != null && snMetrics.test_mae != null
      ? Number((snMetrics.test_mae - safeMetrics.test_mae) / snMetrics.test_mae * 100).toFixed(1)
      : null;
    const leakyDropPctVal = safeMetrics.train_mae != null && leakyMetrics.train_mae != null
      ? Number((safeMetrics.train_mae - leakyMetrics.train_mae) / safeMetrics.train_mae * 100).toFixed(1)
      : null;

    // Default zoom domain focusing around the origin window
    const defaultDomain = [0, Math.max(1, timeline.length - 1)];

    return (
      <Layout
        title="6.1 From a Time Series to a Supervised-Learning Table"
        commentary={
          <div>
            <div className="tab-buttons" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
              <button
                className={`tab-btn ${tab1CommentaryTab === 1 ? 'active' : ''}`}
                onClick={() => setTab1CommentaryTab(1)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1CommentaryTab === 1 ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                1. Why Time Needs a Table
              </button>
              <button
                className={`tab-btn ${tab1CommentaryTab === 2 ? 'active' : ''}`}
                onClick={() => { setTab1CommentaryTab(2); setTab1ExtraView('table'); }}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1CommentaryTab === 2 ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                2. Lags, Rolling, &amp; Cutoff Discipline
              </button>
              <button
                className={`tab-btn ${tab1CommentaryTab === 3 ? 'active' : ''}`}
                onClick={() => { setTab1CommentaryTab(3); setTab1ExtraView('scorecard'); }}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1CommentaryTab === 3 ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                3. The Leakage Trap
              </button>
              <button
                className={`tab-btn ${tab1CommentaryTab === 4 ? 'active' : ''}`}
                onClick={() => { setTab1CommentaryTab(4); setTab1FeatureGroup('lags_only'); }}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1CommentaryTab === 4 ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                4. Choice of Learner
              </button>
            </div>

            {tab1CommentaryTab === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>Why classical linear systems alone struggle:</strong> Section 5 showed that multivariate statistical models like VAR and VECM become fragile when predictors multiply, relationships drift, and linear structure is misspecified. But what happens when we have dozens of lagged, calendar, and renewable signals interacting simultaneously?
                </p>
                <p>
                  <strong>What machine learning expects:</strong> Standard regression algorithms have no built-in awareness of time. They treat every row as an independent vector of features <MathText tex="X_t" /> mapped to a target <MathText tex="y_{t+h}" />.
                </p>
                <p>
                  <strong>The core bridge:</strong> Before evaluating any algorithm, we must reformat sequential history into a supervised table. As shown on the chart, information available at forecast origin 2019-09-30 predicts daily electricity demand across the 30-day October holdout window.
                </p>
                <div style={{ background: 'var(--primary-bg)', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid var(--border)' }}>
                  <strong>Pedagogical takeaway:</strong> Machine learning does not replace temporal understanding; it forces us to encode time explicitly as tabular features.
                </div>
              </div>
            )}

            {tab1CommentaryTab === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>Constructing safe features:</strong> At any forecast origin <MathText tex="T" />, autoregressive lags (<MathText tex="y_{T-1}, y_{T-7}" />) provide recent level and weekly momentum. Moving averages must use a one-step lag shift (<MathText tex="\text{shift}(1)" />) before taking rolling means, ensuring the current day's realized value is never included in its own feature vector.
                </p>
                <p>
                  <strong>Known calendar vs unobserved futures:</strong> Deterministic calendar signals (day-of-week, month, cyclical harmonics) are genuinely known into the future. Realized weather and generation (<MathText tex="\text{solar}, \text{wind}" />) are not; they must be strictly lagged prior to origin.
                </p>
                <p>
                  <strong>Inspect the table below:</strong> The table preview in the deep-dive card demonstrates how sequential timestamps are transformed into row vectors where every feature is certified safe from lookahead leakage.
                </p>
              </div>
            )}

            {tab1CommentaryTab === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>Safe Ridge vs Seasonal Naive:</strong> On the 30-day October holdout, the Safe Ridge model achieves a test MAE of{' '}
                  <strong>{safeTestMaeStr}</strong>, cleanly outperforming the Seasonal Naive baseline ({snTestMaeStr})
                  {safeDiffVal != null && safeGainPctVal != null ? <> by {safeDiffVal} MW ({safeGainPctVal}% lower error)</> : null}.
                </p>
                <p>
                  <strong>The lookahead leakage trap:</strong> Toggle the control below to <em>Leaky Rolling</em>. Training error collapses from {safeTrainMaeStr} down to{' '}
                  <strong style={{ color: '#dc2626' }}>{leakyTrainMaeStr}</strong>
                  {leakyDropPctVal != null ? <> (a false {leakyDropPctVal}% drop in training error)</> : null}.
                </p>
                <p>
                  <strong>Why leakage fails in production:</strong> On untouched future holdout data, the leaky model&apos;s error is {leakyTestMaeStr}. When real deployment removes the unshifted future values, the apparent training accuracy vanishes.
                </p>
              </div>
            )}

            {tab1CommentaryTab === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>When lags alone fail:</strong> Switch the feature group to <em>Lags Only</em>. Without calendar and external drivers, test MAE explodes to{' '}
                  <strong style={{ color: '#dc2626' }}>{lagsTestMaeStr}</strong>. Machine learning models cannot infer cyclical calendar rhythm from autoregressive numbers alone.
                </p>
                <p>
                  <strong>Motivating the choice of learner:</strong> Ridge regression estimates a single global linear slope per feature. But what happens when features interact nonlinearly—such as an extreme summer heat wave triggering a steep air conditioning surge on weekdays that disappears on weekends?
                </p>
                <p>
                  <strong>Transition to Section 6.2:</strong> A linear hyperplane cannot bend quadratically or multiply features without manually engineered cross-terms. This limitation directly motivates tree-based ensembles—Random Forests and Gradient Boosted Trees—which partition feature space dynamically.
                </p>
                <div style={{ background: 'rgba(2, 132, 199, 0.08)', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
                  <strong>Next Question (6.2):</strong> Given the exact same tabular features, how do Random Forests and Gradient Boosting differ from Ridge?
                </div>
              </div>
            )}
          </div>
        }
        dataset={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
            <div><strong>Dataset:</strong> German Daily Electricity Load (ENTSO-E Transparency)</div>
            <div><strong>Total Scope:</strong> 2,100 daily observations (2015-01-01 to 2020-09-30)</div>
            <div><strong>Training Window:</strong> 2018-10-01 to 2019-09-30 (365 days)</div>
            <div><strong>Forecast Origin:</strong> 2019-09-30 (Cutoff marker on chart)</div>
            <div><strong>Holdout Test Window:</strong> 2019-10-01 to 2019-10-30 (30 days)</div>
            <div><strong>Target:</strong> Average daily national load in Megawatts (MW)</div>
            <div><strong>Model in Demo:</strong> Ridge Regression (<MathText tex="\alpha = 10.0" />) vs Seasonal Naive (7-day lag)</div>
            <div style={{ marginTop: '0.35rem', padding: '0.45rem', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
              <strong>Anti-Leakage Rule:</strong> All rolling features use <code>shift(1)</code>. Weather generation covariates (<MathText tex="\text{solar}, \text{wind}" />) are strictly lagged prior to origin.
            </div>
          </div>
        }
        extraCardTitle={tab1ExtraView === 'table' ? 'Supervised Feature Table Preview (Information Cutoff at Origin)' : 'Feature Group Ablation Scorecard'}
        extraCard={
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {tab1ExtraView === 'table'
                  ? 'Showing chronological feature vectors ending at origin 2019-09-30. Every feature is computed strictly from historical information known at t.'
                  : 'Comparing model complexity, training accuracy, and holdout generalization error across feature representations.'}
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => setTab1ExtraView('table')}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1ExtraView === 'table' ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer' }}
                >
                  <TableIcon size={12} style={{ display: 'inline', marginRight: '3px' }} /> Table Preview
                </button>
                <button
                  onClick={() => setTab1ExtraView('scorecard')}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1ExtraView === 'scorecard' ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer' }}
                >
                  Scorecard
                </button>
              </div>
            </div>

            {tab1ExtraView === 'table' ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={comparisonTableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderCellStyle}>Date (<MathText tex="t" />)</th>
                      <th style={tableHeaderCellStyle}>Load <MathText tex="y_t" /> (MW)</th>
                      <th style={tableHeaderCellStyle}>Lag 1 (<MathText tex="y_{t-1}" />)</th>
                      <th style={tableHeaderCellStyle}>Lag 7 (<MathText tex="y_{t-7}" />)</th>
                      <th style={tableHeaderCellStyle}>Rolling Mean 7</th>
                      <th style={tableHeaderCellStyle}>Day of Week</th>
                      <th style={tableHeaderCellStyle}>Lagged Solar (MW)</th>
                      <th style={tableHeaderCellStyle}>Lagged Wind (MW)</th>
                      <th style={tableHeaderCellStyle}>Safe Shift Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleTable.map((row, idx) => (
                      <tr key={idx} style={{ background: row.date === t1.origin_date ? 'rgba(234, 179, 8, 0.08)' : 'transparent' }}>
                        <td style={tableCellStyle}><strong>{row.date}</strong>{row.date === t1.origin_date ? ' (Origin)' : ''}</td>
                        <td style={{ ...tableCellStyle, fontWeight: 600 }}>{row.load_yt != null ? Number(row.load_yt).toLocaleString() : 'n/a'}</td>
                        <td style={tableCellStyle}>{row.lag_1 != null ? Number(row.lag_1).toLocaleString() : 'n/a'}</td>
                        <td style={tableCellStyle}>{row.lag_7 != null ? Number(row.lag_7).toLocaleString() : 'n/a'}</td>
                        <td style={tableCellStyle}>{row.roll_7 != null ? Number(row.roll_7).toLocaleString() : 'n/a'}</td>
                        <td style={tableCellStyle}>{row.dow === 0 ? 'Mon' : row.dow === 1 ? 'Tue' : row.dow === 2 ? 'Wed' : row.dow === 3 ? 'Thu' : row.dow === 4 ? 'Fri' : row.dow === 5 ? 'Sat' : 'Sun'}</td>
                        <td style={tableCellStyle}>{row.solar_lag1 != null ? Number(row.solar_lag1).toLocaleString() : 'n/a'}</td>
                        <td style={tableCellStyle}>{row.wind_lag1 != null ? Number(row.wind_lag1).toLocaleString() : 'n/a'}</td>
                        <td style={{ ...tableCellStyle, color: '#16a34a', fontWeight: 600 }}>{row.safe_shift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={comparisonTableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderCellStyle}>Feature Representation</th>
                      <th style={tableHeaderCellStyle}>Features (#)</th>
                      <th style={tableHeaderCellStyle}>Training MAE (MW)</th>
                      <th style={tableHeaderCellStyle}>Test Holdout MAE (MW)</th>
                      <th style={tableHeaderCellStyle}>Test RMSE (MW)</th>
                      <th style={tableHeaderCellStyle}>Generalization Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tableCellStyle}><strong>Safe Full (Lags + Calendar + Rolling + Renewables)</strong></td>
                      <td style={tableCellStyle}>{safeMetrics.feature_count ?? 'n/a'}</td>
                      <td style={tableCellStyle}>{safeMetrics.train_mae != null ? Number(safeMetrics.train_mae).toFixed(1) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 700, color: '#16a34a' }}>
                        {safeMetrics.test_mae != null ? Number(safeMetrics.test_mae).toFixed(1) : 'n/a'}
                      </td>
                      <td style={tableCellStyle}>{safeMetrics.test_rmse != null ? Number(safeMetrics.test_rmse).toFixed(1) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#16a34a', fontWeight: 600 }}>Wins vs Seasonal Naive</td>
                    </tr>
                    <tr>
                      <td style={tableCellStyle}><strong>Lags Only (Autoregressive without Calendar)</strong></td>
                      <td style={tableCellStyle}>{lagsMetrics.feature_count ?? 'n/a'}</td>
                      <td style={tableCellStyle}>{lagsMetrics.train_mae != null ? Number(lagsMetrics.train_mae).toFixed(1) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#dc2626', fontWeight: 600 }}>
                        {lagsMetrics.test_mae != null ? Number(lagsMetrics.test_mae).toFixed(1) : 'n/a'}
                      </td>
                      <td style={tableCellStyle}>{lagsMetrics.test_rmse != null ? Number(lagsMetrics.test_rmse).toFixed(1) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#dc2626' }}>Fails (Lacks Calendar Horizon Signals)</td>
                    </tr>
                    <tr>
                      <td style={tableCellStyle}><strong>Leaky Rolling (Unshifted Rolling Window)</strong></td>
                      <td style={tableCellStyle}>{leakyMetrics.feature_count ?? 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#dc2626', fontWeight: 700 }}>
                        {leakyMetrics.train_mae != null ? Number(leakyMetrics.train_mae).toFixed(1) : 'n/a'} (Artificial Collapse)
                      </td>
                      <td style={tableCellStyle}>{leakyMetrics.test_mae != null ? Number(leakyMetrics.test_mae).toFixed(1) : 'n/a'}</td>
                      <td style={tableCellStyle}>{leakyMetrics.test_rmse != null ? Number(leakyMetrics.test_rmse).toFixed(1) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#dc2626' }}>Lookahead Leakage (Training Illusion)</td>
                    </tr>
                    <tr>
                      <td style={tableCellStyle}><strong>Seasonal Naive Baseline (7-Day Persistence)</strong></td>
                      <td style={tableCellStyle}>1</td>
                      <td style={tableCellStyle}>{snMetrics.train_mae != null ? Number(snMetrics.train_mae).toFixed(1) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                        {snMetrics.test_mae != null ? Number(snMetrics.test_mae).toFixed(1) : 'n/a'}
                      </td>
                      <td style={tableCellStyle}>{snMetrics.test_rmse != null ? Number(snMetrics.test_rmse).toFixed(1) : 'n/a'}</td>
                      <td style={tableCellStyle}>Standard Classical Baseline</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        }
        controls={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Feature Representation:</span>
              <button
                className={`control-btn ${tab1FeatureGroup === 'safe_full' ? 'active' : ''}`}
                onClick={() => setTab1FeatureGroup('safe_full')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1FeatureGroup === 'safe_full' ? '#0284c7' : 'var(--surface)', color: tab1FeatureGroup === 'safe_full' ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                Safe Full (Recommended)
              </button>
              <button
                className={`control-btn ${tab1FeatureGroup === 'lags_only' ? 'active' : ''}`}
                onClick={() => setTab1FeatureGroup('lags_only')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1FeatureGroup === 'lags_only' ? '#7c3aed' : 'var(--surface)', color: tab1FeatureGroup === 'lags_only' ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Lags Only (No Calendar)
              </button>
              <button
                className={`control-btn ${tab1FeatureGroup === 'leaky_rolling' ? 'active' : ''}`}
                onClick={() => setTab1FeatureGroup('leaky_rolling')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: tab1FeatureGroup === 'leaky_rolling' ? '#dc2626' : 'var(--surface)', color: tab1FeatureGroup === 'leaky_rolling' ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Leaky Rolling (Lookahead Trap)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tab1ShowBaseline}
                  onChange={(e) => setTab1ShowBaseline(e.target.checked)}
                />
                Show Seasonal Naive Baseline
              </label>
            </div>
          </div>
        }
        chartHeight="520px"
        chart={
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', fontSize: '0.86rem' }}>
              <div>
                <strong>German Electricity Load: Supervised 30-Day Forecast at Origin (2019-09-30)</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  (Active Features: {tab1FeatureGroup === 'safe_full' ? 'Safe Full (Lags + Calendar + Shifted Rolling + Renewables)' : tab1FeatureGroup === 'lags_only' ? 'Lags Only (Autoregressive without Calendar)' : 'Leaky Rolling (Unshifted Future Average)'})
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Holdout MAE: <strong>{activeTestMaeStr}</strong>
                {tab1ShowBaseline ? ` (vs Naive: ${snTestMaeHeaderStr})` : ''}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '440px', position: 'relative' }}>
              <ZoomableChartShell key={tab1FeatureGroup} defaultDomain={defaultDomain} maxTime={Math.max(1, timeline.length - 1)}>
                {(zoomDomain) => {
                  const activeKey = tab1FeatureGroup === 'safe_full' ? 'safe_ridge' : tab1FeatureGroup === 'lags_only' ? 'lags_only_ridge' : 'leaky_ridge';
                  const activeKeys = ['actual', activeKey];
                  if (tab1ShowBaseline) activeKeys.push('seasonal_naive');

                  const yDomain = computeDynamicYDomain(timeline, activeKeys, zoomDomain);

                  return (
                    <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                      <LineChart data={timeline} margin={{ top: 15, right: 25, left: 15, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis
                          dataKey="time"
                          type="number"
                          domain={zoomDomain}
                          allowDataOverflow={true}
                          tick={{ fill: 'var(--text-muted)' }}
                          tickFormatter={(i) => timeline[Math.round(i)]?.date ? timeline[Math.round(i)].date.slice(5) : ''}
                        />
                        <YAxis
                          domain={yDomain}
                          allowDataOverflow={true}
                          tick={{ fill: 'var(--text-muted)' }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                          formatter={(val, name) => [`${Number(val).toLocaleString()} MW`, name]}
                          labelFormatter={(i) => `Date: ${timeline[Math.round(i)]?.date || ''} (${timeline[Math.round(i)]?.is_holdout ? 'October 30d Holdout' : 'September History'})`}
                        />
                        <Legend verticalAlign="top" height={32} />

                        {originIdx >= 0 && (
                          <ReferenceLine
                            x={originIdx}
                            stroke="#eab308"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{ position: 'top', value: 'Cutoff Origin (2019-09-30)', fill: '#eab308', fontSize: 11 }}
                          />
                        )}

                        <Line
                          type="monotone"
                          dataKey="actual"
                          name="Actual Historical Load"
                          stroke="#334155"
                          strokeWidth={2.4}
                          dot={{ r: 2 }}
                          isAnimationActive={false}
                        />

                        {tab1FeatureGroup === 'safe_full' && (
                          <Line
                            type="monotone"
                            dataKey="safe_ridge"
                            name="Safe Ridge Forecast (Safe Full)"
                            stroke="#0284c7"
                            strokeWidth={2.6}
                            dot={{ r: 3 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        )}

                        {tab1FeatureGroup === 'lags_only' && (
                          <Line
                            type="monotone"
                            dataKey="lags_only_ridge"
                            name="Ridge (Lags Only, No Calendar)"
                            stroke="#7c3aed"
                            strokeWidth={2.4}
                            strokeDasharray="4 4"
                            dot={{ r: 3 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        )}

                        {tab1FeatureGroup === 'leaky_rolling' && (
                          <Line
                            type="monotone"
                            dataKey="leaky_ridge"
                            name="Leaky Ridge (Unshifted Rolling)"
                            stroke="#dc2626"
                            strokeWidth={2.4}
                            strokeDasharray="3 3"
                            dot={{ r: 3 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        )}

                        {tab1ShowBaseline && (
                          <Line
                            type="monotone"
                            dataKey="seasonal_naive"
                            name="Seasonal Naive Baseline (7d Lag)"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 2 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  );
                }}
              </ZoomableChartShell>
            </div>
          </div>
        }
      />
    );
  }

  // =========================================================================
  // SUBTOPIC 6.2: One Table, Three Ways to Learn: Ridge, Random Forest, XGBoost
  // =========================================================================
  if (activeTab === 2) {
    const t2 = data.tab2 || {};
    const metrics = t2.metrics || {};
    const curMetrics = metrics[tab2Complexity] || metrics.balanced || {};
    const ridgeMetrics = curMetrics.ridge || {};
    const rfMetrics = curMetrics.rf || {};
    const xgbMetrics = curMetrics.xgb || {};

    const rawTimeline = t2.timeline || [];
    const rawTempCurve = t2.temp_curve || [];
    const heatThreshold = typeof t2.heat_surge_threshold === 'number' ? t2.heat_surge_threshold : 24;
    const heatDaysCount = typeof t2.heat_surge_days === 'number' ? t2.heat_surge_days : 0;
    const testDaysCount = typeof t2.test_days === 'number' ? t2.test_days : 0;
    const weekendCoolingSuppressionPct = 70;

    // Attach numeric index for ZoomableChartShell compatibility
    const timeline = rawTimeline.map((item, idx) => ({
      ...item,
      time: idx,
    }));

    const tempCurve = rawTempCurve.map((item, idx) => ({
      ...item,
      curve_idx: idx,
    }));

    // Balanced metrics strings for commentary
    const balMetrics = metrics.balanced || {};
    const ridgeBalMaeStr = balMetrics.ridge?.mae_overall != null ? `${Number(balMetrics.ridge.mae_overall).toFixed(2)} MW` : 'n/a';
    const rfBalMaeStr = balMetrics.rf?.mae_overall != null ? `${Number(balMetrics.rf.mae_overall).toFixed(2)} MW` : 'n/a';
    const xgbBalMaeStr = balMetrics.xgb?.mae_overall != null ? `${Number(balMetrics.xgb.mae_overall).toFixed(2)} MW` : 'n/a';

    const ridgeHeatMaeStr = balMetrics.ridge?.mae_heat_surge != null ? `${Number(balMetrics.ridge.mae_heat_surge).toFixed(2)} MW` : 'n/a';
    const ridgeHeatRmseStr = balMetrics.ridge?.rmse_heat_surge != null ? `${Number(balMetrics.ridge.rmse_heat_surge).toFixed(2)} MW` : 'n/a';
    const rfHeatMaeStr = balMetrics.rf?.mae_heat_surge != null ? `${Number(balMetrics.rf.mae_heat_surge).toFixed(2)} MW` : 'n/a';
    const rfHeatRmseStr = balMetrics.rf?.rmse_heat_surge != null ? `${Number(balMetrics.rf.rmse_heat_surge).toFixed(2)} MW` : 'n/a';
    const xgbHeatMaeStr = balMetrics.xgb?.mae_heat_surge != null ? `${Number(balMetrics.xgb.mae_heat_surge).toFixed(2)} MW` : 'n/a';
    const xgbHeatRmseStr = balMetrics.xgb?.rmse_heat_surge != null ? `${Number(balMetrics.xgb.rmse_heat_surge).toFixed(2)} MW` : 'n/a';

    // Underfit / Overfit strings for commentary
    const underMetrics = metrics.underfit || {};
    const overMetrics = metrics.overfit || {};
    const xgbUnderHeatMaeStr = underMetrics.xgb?.mae_heat_surge != null ? `${Number(underMetrics.xgb.mae_heat_surge).toFixed(2)} MW` : 'n/a';
    const xgbOverHeatMaeStr = overMetrics.xgb?.mae_heat_surge != null ? `${Number(overMetrics.xgb.mae_heat_surge).toFixed(2)} MW` : 'n/a';

    // Active complexity strings for header & status badges
    const activeRidgeMaeStr = ridgeMetrics.mae_overall != null ? `${Number(ridgeMetrics.mae_overall).toFixed(2)} MW` : 'n/a';
    const activeRfMaeStr = rfMetrics.mae_overall != null ? `${Number(rfMetrics.mae_overall).toFixed(2)} MW` : 'n/a';
    const activeXgbMaeStr = xgbMetrics.mae_overall != null ? `${Number(xgbMetrics.mae_overall).toFixed(2)} MW` : 'n/a';

    const activeRidgeSurgeStr = ridgeMetrics.mae_heat_surge != null ? `${Number(ridgeMetrics.mae_heat_surge).toFixed(2)} MW` : 'n/a';
    const activeRfSurgeStr = rfMetrics.mae_heat_surge != null ? `${Number(rfMetrics.mae_heat_surge).toFixed(2)} MW` : 'n/a';
    const activeXgbSurgeStr = xgbMetrics.mae_heat_surge != null ? `${Number(xgbMetrics.mae_heat_surge).toFixed(2)} MW` : 'n/a';

    // Find index of heat surge threshold in tempCurve
    const thresholdIdx = tempCurve.findIndex((p) => p.temp >= heatThreshold);

    // Default zoom domains
    const defaultTimelineDomain = [0, Math.max(1, timeline.length - 1)];
    const defaultCurveDomain = [0, Math.max(1, tempCurve.length - 1)];
    const defaultDomain = tab2View === 'temp_curve' ? defaultCurveDomain : defaultTimelineDomain;
    const maxTime = tab2View === 'temp_curve' ? Math.max(1, tempCurve.length - 1) : Math.max(1, timeline.length - 1);

    return (
      <Layout
        title="6.2 Tree Ensembles & Boosting: Ridge, Random Forest, XGBoost"
        commentary={
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setTab2CommentaryTab(1)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: tab2CommentaryTab === 1 ? 'var(--primary-bg)' : 'transparent',
                  fontWeight: tab2CommentaryTab === 1 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                1. Three Philosophies
              </button>
              <button
                onClick={() => setTab2CommentaryTab(2)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: tab2CommentaryTab === 2 ? 'var(--primary-bg)' : 'transparent',
                  fontWeight: tab2CommentaryTab === 2 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                2. Heat Surge Mechanism
              </button>
              <button
                onClick={() => setTab2CommentaryTab(3)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: tab2CommentaryTab === 3 ? 'var(--primary-bg)' : 'transparent',
                  fontWeight: tab2CommentaryTab === 3 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                3. Residual Curvature
              </button>
              <button
                onClick={() => setTab2CommentaryTab(4)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: tab2CommentaryTab === 4 ? 'var(--primary-bg)' : 'transparent',
                  fontWeight: tab2CommentaryTab === 4 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                4. Complexity & Generalization
              </button>
            </div>

            {tab2CommentaryTab === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>Starting from the tabular feature matrix:</strong> In Section 6.1, we converted chronological time series into a supervised table of lags, rolling statistics, and calendar coordinates. When we feed this identical table into different regression learners, each algorithm builds a fundamentally distinct mathematical surface.
                </p>
                <p>
                  <strong>Three structural paradigms:</strong> Ridge regression fits a single additive hyperplane (<MathText tex="y = \beta_0 + \sum \beta_j X_j" />), applying one global slope per feature. Random Forest builds parallel ensembles of deep decision trees via bootstrap aggregation (bagging), averaging axis-aligned step partitions to dampen variance. Gradient Boosting (XGBoost) sequentially adds shallow trees where each new tree fits the residual errors of the existing ensemble.
                </p>
                <p>
                  <strong>Default baseline performance:</strong> Across the 132-day evaluation window under balanced complexity, Ridge achieves an overall MAE of <strong>{ridgeBalMaeStr}</strong>, while Random Forest achieves <strong>{rfBalMaeStr}</strong> and XGBoost reaches <strong>{xgbBalMaeStr}</strong>.
                </p>
                <div style={{ background: 'var(--primary-bg)', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid var(--border)' }}>
                  <strong>Pedagogical takeaway:</strong> The feature table provides the inputs, but the learner dictates whether relationships are treated as flat hyperplanes, piecewise step constants, or sequentially corrected residuals.
                </div>
              </div>
            )}

            {tab2CommentaryTab === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>The weather-calendar threshold interaction:</strong> Real electricity grids exhibit severe nonlinear regimes. In our locked data-generating process, mild weather has modest heating demand, but temperatures exceeding <strong>{heatThreshold}°C</strong> trigger an explosive quadratic cooling surge on weekdays (<MathText tex="S_t \propto [\max(0, T - 24)]^2" />). On weekends, commercial shutdowns suppress this surge by {weekendCoolingSuppressionPct}%.
                </p>
                <p>
                  <strong>Why linear hyperplanes struggle:</strong> A standard linear model cannot multiply temperature and calendar features without manually engineered cross-product terms (<MathText tex="T \times \text{weekend}" />). Ridge attempts to strike a compromise by drawing a single flat slope through both regimes, systematically underestimating weekday peak heat.
                </p>
                <p>
                  <strong>How trees partition feature space:</strong> Decision trees split feature space into orthogonal (axis-aligned) rectangular boxes. By testing conditions like <MathText tex="T > 24" /> and <MathText tex="\text{weekend} = 0" />, tree ensembles naturally isolate the extreme heat surge into dedicated leaves without manual interaction engineering.
                </p>
              </div>
            )}

            {tab2CommentaryTab === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>Linear rigidity in the heat regime:</strong> Inspect the test period containing <strong>{heatDaysCount}</strong> hot weekday surge days. Ridge achieves a moderate overall test error, but its error explodes to <strong>{ridgeHeatMaeStr}</strong> during heat surges (RMSE: {ridgeHeatRmseStr}). In the Residual Error view, Ridge residuals form a distinctive U-shaped curve, consistently underpredicting peak cooling demand by 10 to 20 MW.
                </p>
                <p>
                  <strong>Tree ensembles capture the surge:</strong> Random Forest reduces heat surge MAE to <strong>{rfHeatMaeStr}</strong> (RMSE: {rfHeatRmseStr}) by averaging piecewise steps. XGBoost achieves the lowest error at <strong>{xgbHeatMaeStr}</strong> (RMSE: {xgbHeatRmseStr}), as gradient boosting iteratively focuses new tree splits directly on residual errors in the peak heat regime.
                </p>
                <p>
                  <strong>Visual inspection:</strong> Switch the chart view between <em>Test Timeline</em>, <em>Temperature Response Curve</em>, and <em>Residual Errors</em> to trace how Ridge&apos;s straight line cuts through the quadratic bend, while tree models track the actual demand response.
                </p>
              </div>
            )}

            {tab2CommentaryTab === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p>
                  <strong>The bias-variance trade-off on trees:</strong> Use the Complexity Dial to inspect depth limits. At <em>Underfit</em> (depth 2), XGBoost heat surge MAE degrades to <strong>{xgbUnderHeatMaeStr}</strong> because shallow stumps truncate the quadratic peak. At <em>Overfit</em> (depth 12+), heat surge MAE is <strong>{xgbOverHeatMaeStr}</strong> as deep leaves memorize individual sample noise spikes.
                </p>
                <p>
                  <strong>Questioning real-world generalization:</strong> In this stationary simulation, gradient boosting cleanly outperforms simpler models because the data-generating process contains a localized nonlinear interaction. But does this laboratory superiority hold up in the messy real world, where structural breaks, pandemic shocks, and trend shifts occur?
                </p>
                <p>
                  <strong>Transition to Section 6.3:</strong> Tree ensembles cannot extrapolate outside their training targets and can easily overfit historical noise. In Section 6.3, we take these models into the Forecast Arena to compete directly against classical statistical baselines (SARIMA, Seasonal Naive) across 5 walk-forward backtest folds on actual German grid data.
                </p>
                <div style={{ background: 'rgba(124, 58, 237, 0.08)', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
                  <strong>Next Step (6.3):</strong> Testing whether complex machine learning models reliably beat classical statistical baselines across 5 chronological walk-forward backtest folds.
                </div>
              </div>
            )}
          </div>
        }
        dataset={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
            <div><strong>Data Source:</strong> Locked Synthetic Demand DGP (<code>seed=42</code>)</div>
            <div><strong>Sample Size:</strong> 730 daily time steps (2 complete seasonal years)</div>
            <div><strong>Training Window:</strong> Days 1 to 365 (Year 1 baseline)</div>
            <div><strong>Test Evaluation Window:</strong> Days 419 to 550 ({testDaysCount} holdout days)</div>
            <div><strong>Heat Surge Regime:</strong> {heatDaysCount} weekdays where temperature exceeds {heatThreshold}°C</div>
            <div><strong>Input Features:</strong> Temperature, Weekend Indicator, Day of Week, Lag 1, Lag 7</div>
            <div><strong>Nonlinear Equation:</strong> <MathText tex="S_t = 3.5 \cdot [\max(0, T - 24)]^2 \cdot (1 - 0.70 W_t)" /></div>
            <div style={{ marginTop: '0.35rem', padding: '0.45rem', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
              <strong>Algorithmic Challenge:</strong> Capturing sharp quadratic threshold bends and weekday-weekend interactions without manually hardcoding polynomial features.
            </div>
          </div>
        }
        extraCardTitle={tab2ExtraView === 'scorecard' ? 'Algorithmic Complexity & Error Scorecard' : 'Machine Learning Model Family Architecture Guide'}
        extraCard={
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {tab2ExtraView === 'scorecard'
                  ? 'Comparing overall holdout error and extreme heat surge degradation across Underfit, Balanced, and Overfit hyperparameter regimes.'
                  : 'Architectural overview of key machine learning model families used in time-series forecasting, their inductive biases, and trade-offs.'}
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => setTab2ExtraView('scorecard')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.78rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    background: tab2ExtraView === 'scorecard' ? 'var(--primary-bg)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sliders size={12} /> Scorecard Table
                </button>
                <button
                  onClick={() => setTab2ExtraView('family')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.78rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    background: tab2ExtraView === 'family' ? 'var(--primary-bg)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Layers size={12} /> Model Family Guide
                </button>
              </div>
            </div>

            {tab2ExtraView === 'scorecard' ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={comparisonTableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderCellStyle}>Complexity Tier</th>
                      <th style={tableHeaderCellStyle}>Model</th>
                      <th style={tableHeaderCellStyle}>Configuration</th>
                      <th style={tableHeaderCellStyle}>Overall MAE (MW)</th>
                      <th style={tableHeaderCellStyle}>Heat Surge MAE (MW)</th>
                      <th style={tableHeaderCellStyle}>Heat Surge RMSE (MW)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Balanced Tier */}
                    <tr style={{ background: tab2Complexity === 'balanced' ? 'rgba(124, 58, 237, 0.08)' : 'transparent' }}>
                      <td rowSpan={3} style={{ ...tableCellStyle, fontWeight: 600, verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>
                        Balanced<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optimal Bias-Variance)</span>
                      </td>
                      <td style={{ ...tableCellStyle, color: '#0284c7', fontWeight: 600 }}>Ridge</td>
                      <td style={tableCellStyle}><MathText tex="\alpha = 1.0" /></td>
                      <td style={tableCellStyle}>{metrics.balanced?.ridge?.mae_overall != null ? Number(metrics.balanced.ridge.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#dc2626', fontWeight: 600 }}>{metrics.balanced?.ridge?.mae_heat_surge != null ? Number(metrics.balanced.ridge.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.balanced?.ridge?.rmse_heat_surge != null ? Number(metrics.balanced.ridge.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>
                    <tr style={{ background: tab2Complexity === 'balanced' ? 'rgba(124, 58, 237, 0.08)' : 'transparent' }}>
                      <td style={{ ...tableCellStyle, color: '#059669', fontWeight: 600 }}>Random Forest</td>
                      <td style={tableCellStyle}>Trees: 100, Depth: 6, Leaf: 3</td>
                      <td style={tableCellStyle}>{metrics.balanced?.rf?.mae_overall != null ? Number(metrics.balanced.rf.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#059669', fontWeight: 600 }}>{metrics.balanced?.rf?.mae_heat_surge != null ? Number(metrics.balanced.rf.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.balanced?.rf?.rmse_heat_surge != null ? Number(metrics.balanced.rf.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>
                    <tr style={{ background: tab2Complexity === 'balanced' ? 'rgba(124, 58, 237, 0.08)' : 'transparent' }}>
                      <td style={{ ...tableCellStyle, color: '#7c3aed', fontWeight: 600 }}>XGBoost</td>
                      <td style={tableCellStyle}>Trees: 100, Depth: 4, <MathText tex="\eta = 0.08" /></td>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>{metrics.balanced?.xgb?.mae_overall != null ? Number(metrics.balanced.xgb.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#7c3aed', fontWeight: 700 }}>{metrics.balanced?.xgb?.mae_heat_surge != null ? Number(metrics.balanced.xgb.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>{metrics.balanced?.xgb?.rmse_heat_surge != null ? Number(metrics.balanced.xgb.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>

                    {/* Underfit Tier */}
                    <tr style={{ background: tab2Complexity === 'underfit' ? 'rgba(234, 179, 8, 0.08)' : 'transparent' }}>
                      <td rowSpan={3} style={{ ...tableCellStyle, fontWeight: 600, verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>
                        Underfit<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(High Bias / Stumps)</span>
                      </td>
                      <td style={{ ...tableCellStyle, color: '#0284c7', fontWeight: 600 }}>Ridge</td>
                      <td style={tableCellStyle}><MathText tex="\alpha = 100.0" /></td>
                      <td style={tableCellStyle}>{metrics.underfit?.ridge?.mae_overall != null ? Number(metrics.underfit.ridge.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#dc2626' }}>{metrics.underfit?.ridge?.mae_heat_surge != null ? Number(metrics.underfit.ridge.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.underfit?.ridge?.rmse_heat_surge != null ? Number(metrics.underfit.ridge.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>
                    <tr style={{ background: tab2Complexity === 'underfit' ? 'rgba(234, 179, 8, 0.08)' : 'transparent' }}>
                      <td style={{ ...tableCellStyle, color: '#059669', fontWeight: 600 }}>Random Forest</td>
                      <td style={tableCellStyle}>Trees: 30, Depth: 2, Leaf: 15</td>
                      <td style={tableCellStyle}>{metrics.underfit?.rf?.mae_overall != null ? Number(metrics.underfit.rf.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.underfit?.rf?.mae_heat_surge != null ? Number(metrics.underfit.rf.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.underfit?.rf?.rmse_heat_surge != null ? Number(metrics.underfit.rf.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>
                    <tr style={{ background: tab2Complexity === 'underfit' ? 'rgba(234, 179, 8, 0.08)' : 'transparent' }}>
                      <td style={{ ...tableCellStyle, color: '#7c3aed', fontWeight: 600 }}>XGBoost</td>
                      <td style={tableCellStyle}>Trees: 30, Depth: 2, <MathText tex="\eta = 0.05" /></td>
                      <td style={tableCellStyle}>{metrics.underfit?.xgb?.mae_overall != null ? Number(metrics.underfit.xgb.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#eab308', fontWeight: 600 }}>{metrics.underfit?.xgb?.mae_heat_surge != null ? Number(metrics.underfit.xgb.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.underfit?.xgb?.rmse_heat_surge != null ? Number(metrics.underfit.xgb.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>

                    {/* Overfit Tier */}
                    <tr style={{ background: tab2Complexity === 'overfit' ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                      <td rowSpan={3} style={{ ...tableCellStyle, fontWeight: 600, verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>
                        Overfit<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(High Variance / Noise)</span>
                      </td>
                      <td style={{ ...tableCellStyle, color: '#0284c7', fontWeight: 600 }}>Ridge</td>
                      <td style={tableCellStyle}><MathText tex="\alpha = 0.001" /></td>
                      <td style={tableCellStyle}>{metrics.overfit?.ridge?.mae_overall != null ? Number(metrics.overfit.ridge.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.overfit?.ridge?.mae_heat_surge != null ? Number(metrics.overfit.ridge.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.overfit?.ridge?.rmse_heat_surge != null ? Number(metrics.overfit.ridge.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>
                    <tr style={{ background: tab2Complexity === 'overfit' ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                      <td style={{ ...tableCellStyle, color: '#059669', fontWeight: 600 }}>Random Forest</td>
                      <td style={tableCellStyle}>Trees: 150, Depth: 16, Leaf: 1</td>
                      <td style={tableCellStyle}>{metrics.overfit?.rf?.mae_overall != null ? Number(metrics.overfit.rf.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.overfit?.rf?.mae_heat_surge != null ? Number(metrics.overfit.rf.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.overfit?.rf?.rmse_heat_surge != null ? Number(metrics.overfit.rf.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>
                    <tr style={{ background: tab2Complexity === 'overfit' ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                      <td style={{ ...tableCellStyle, color: '#7c3aed', fontWeight: 600 }}>XGBoost</td>
                      <td style={tableCellStyle}>Trees: 250, Depth: 12, <MathText tex="\eta = 0.30" /></td>
                      <td style={tableCellStyle}>{metrics.overfit?.xgb?.mae_overall != null ? Number(metrics.overfit.xgb.mae_overall).toFixed(2) : 'n/a'}</td>
                      <td style={{ ...tableCellStyle, color: '#ef4444', fontWeight: 600 }}>{metrics.overfit?.xgb?.mae_heat_surge != null ? Number(metrics.overfit.xgb.mae_heat_surge).toFixed(2) : 'n/a'}</td>
                      <td style={tableCellStyle}>{metrics.overfit?.xgb?.rmse_heat_surge != null ? Number(metrics.overfit.xgb.rmse_heat_surge).toFixed(2) : 'n/a'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                <div style={{ background: 'var(--surface)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <h5 style={{ color: '#0284c7', margin: '0 0 0.4rem 0', fontSize: '0.92rem' }}>1. Linear & Regularized (Ridge, Lasso, Elastic Net)</h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>
                    Fits a single additive hyperplane with coefficient shrinkage. Efficient, convex, and highly interpretable, but completely unable to model nonlinear curves or multiplicative interactions without manual polynomial expansion.
                  </p>
                </div>
                <div style={{ background: 'var(--surface)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <h5 style={{ color: '#059669', margin: '0 0 0.4rem 0', fontSize: '0.92rem' }}>2. Bagged Ensembles (Random Forest, Extra Trees)</h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>
                    Builds hundreds of deep decision trees in parallel on bootstrap samples. By averaging orthogonal (axis-aligned) step partitions and selecting random feature subsets at each split, it drastically cuts variance while retaining low bias.
                  </p>
                </div>
                <div style={{ background: 'var(--surface)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <h5 style={{ color: '#7c3aed', margin: '0 0 0.4rem 0', fontSize: '0.92rem' }}>3. Gradient Boosted Trees (XGBoost, LightGBM, CatBoost)</h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>
                    Builds shallow trees sequentially, where each new tree fits the residual errors (gradient and Hessian) of the preceding ensemble. Yields state-of-the-art accuracy on tabular interactions, but requires careful depth and learning rate tuning.
                  </p>
                </div>
                <div style={{ background: 'var(--surface)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <h5 style={{ color: '#ea580c', margin: '0 0 0.4rem 0', fontSize: '0.92rem' }}>4. Kernel & Distance Methods (SVR, k-Nearest Neighbors)</h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>
                    Maps features into reproducing kernel Hilbert spaces (RBF kernel) or predicts local neighbor averages. Highly expressive, but pairwise distance evaluation scales quadratically with sample size, creating severe latency bottlenecks on long time series.
                  </p>
                </div>
              </div>
            )}
          </div>
        }
        controls={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Display View:</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  onClick={() => setTab2View('timeline')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: tab2View === 'timeline' ? 'var(--primary-bg)' : 'transparent',
                    fontWeight: tab2View === 'timeline' ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Test Timeline
                </button>
                <button
                  onClick={() => setTab2View('temp_curve')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: tab2View === 'temp_curve' ? 'var(--primary-bg)' : 'transparent',
                    fontWeight: tab2View === 'temp_curve' ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Temperature Curve
                </button>
                <button
                  onClick={() => setTab2View('residuals')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: tab2View === 'residuals' ? 'var(--primary-bg)' : 'transparent',
                    fontWeight: tab2View === 'residuals' ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Residual Errors
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Complexity Dial:</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  onClick={() => setTab2Complexity('underfit')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: tab2Complexity === 'underfit' ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                    borderColor: tab2Complexity === 'underfit' ? '#eab308' : 'var(--border)',
                    fontWeight: tab2Complexity === 'underfit' ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Underfit (Depth 2)
                </button>
                <button
                  onClick={() => setTab2Complexity('balanced')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: tab2Complexity === 'balanced' ? 'var(--primary-bg)' : 'transparent',
                    borderColor: tab2Complexity === 'balanced' ? 'var(--primary)' : 'var(--border)',
                    fontWeight: tab2Complexity === 'balanced' ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Balanced (Depth 4–6)
                </button>
                <button
                  onClick={() => setTab2Complexity('overfit')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: tab2Complexity === 'overfit' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    borderColor: tab2Complexity === 'overfit' ? '#ef4444' : 'var(--border)',
                    fontWeight: tab2Complexity === 'overfit' ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Overfit (Depth 12+)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Models:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#0284c7', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={tab2ShowRidge}
                  onChange={(e) => setTab2ShowRidge(e.target.checked)}
                />
                Ridge
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#059669', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={tab2ShowRF}
                  onChange={(e) => setTab2ShowRF(e.target.checked)}
                />
                Random Forest
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#7c3aed', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={tab2ShowXGB}
                  onChange={(e) => setTab2ShowXGB(e.target.checked)}
                />
                XGBoost
              </label>
            </div>
          </>
        }
        chart={
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {tab2View === 'timeline'
                    ? 'Holdout Timeline: Actual Demand vs Model Trajectories (Days 419–550)'
                    : tab2View === 'temp_curve'
                      ? 'Temperature Response Curve: Quadratic Cooling Surge Bend'
                      : 'Residual Error Tracking (e = y - y_hat): Error Structure Comparison'}
                </span>
                <span style={{ marginLeft: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {tab2View === 'timeline'
                    ? '(Balanced model predictions with 42 hot weekday surge days highlighted)'
                    : tab2View === 'temp_curve'
                      ? '(Sorted by temperature; surge threshold at 24°C)'
                      : '(Parity at zero; Ridge curvature vs tree error dispersion)'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Overall: Ridge {activeRidgeMaeStr} | RF {activeRfMaeStr} | XGB {activeXgbMaeStr} &nbsp;•&nbsp; Surge: <span style={{ color: '#0284c7' }}>Ridge {activeRidgeSurgeStr}</span> |{' '}
                <span style={{ color: '#059669' }}>RF {activeRfSurgeStr}</span> |{' '}
                <span style={{ color: '#7c3aed', fontWeight: 600 }}>XGB {activeXgbSurgeStr}</span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '440px', position: 'relative' }}>
              <ZoomableChartShell key={`${tab2View}-${tab2Complexity}`} defaultDomain={defaultDomain} maxTime={maxTime}>
                {(zoomDomain) => {
                  if (tab2View === 'temp_curve') {
                    const activeKeys = ['actual'];
                    if (tab2ShowRidge) activeKeys.push('ridge_fitted');
                    if (tab2ShowRF) activeKeys.push('rf_fitted');
                    if (tab2ShowXGB) activeKeys.push('xgb_fitted');

                    const yDomain = computeDynamicYDomain(tempCurve, activeKeys, zoomDomain);

                    return (
                      <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                        <LineChart data={tempCurve} margin={{ top: 15, right: 25, left: 15, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                          <XAxis
                            dataKey="curve_idx"
                            type="number"
                            domain={zoomDomain}
                            allowDataOverflow={true}
                            tick={{ fill: 'var(--text-muted)' }}
                            tickFormatter={(i) => tempCurve[Math.round(i)]?.temp != null ? `${Number(tempCurve[Math.round(i)].temp).toFixed(1)}°C` : ''}
                          />
                          <YAxis
                            domain={yDomain}
                            allowDataOverflow={true}
                            tick={{ fill: 'var(--text-muted)' }}
                            tickFormatter={(v) => `${Number(v).toFixed(0)} MW`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                            formatter={(val, name) => [`${Number(val).toFixed(2)} MW`, name]}
                            labelFormatter={(i) => {
                              const pt = tempCurve[Math.round(i)];
                              return pt ? `Temperature: ${Number(pt.temp).toFixed(2)}°C (${pt.weekend ? 'Weekend' : 'Weekday'})` : '';
                            }}
                          />
                          <Legend verticalAlign="top" height={32} />

                          {thresholdIdx >= 0 && (
                            <ReferenceLine
                              x={thresholdIdx}
                              stroke="#f59e0b"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              label={{ position: 'insideTopLeft', value: 'Surge Threshold (24°C)', fill: '#f59e0b', fontSize: 11 }}
                            />
                          )}

                          <Line
                            type="monotone"
                            dataKey="actual"
                            name="Actual Demand (MW)"
                            stroke="#334155"
                            strokeWidth={1.6}
                            dot={{ r: 3 }}
                            isAnimationActive={false}
                          />

                          {tab2ShowRidge && (
                            <Line
                              type="monotone"
                              dataKey="ridge_fitted"
                              name="Ridge Fit (Linear Hyperplane)"
                              stroke="#0284c7"
                              strokeWidth={2.4}
                              strokeDasharray="4 4"
                              dot={false}
                              isAnimationActive={false}
                            />
                          )}

                          {tab2ShowRF && (
                            <Line
                              type="monotone"
                              dataKey="rf_fitted"
                              name="Random Forest Fit (Piecewise Steps)"
                              stroke="#059669"
                              strokeWidth={2.4}
                              dot={false}
                              isAnimationActive={false}
                            />
                          )}

                          {tab2ShowXGB && (
                            <Line
                              type="monotone"
                              dataKey="xgb_fitted"
                              name="XGBoost Fit (Iterative Residual Fit)"
                              stroke="#7c3aed"
                              strokeWidth={2.6}
                              dot={false}
                              isAnimationActive={false}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  }

                  if (tab2View === 'residuals') {
                    const activeKeys = [];
                    if (tab2ShowRidge) activeKeys.push('ridge_residual');
                    if (tab2ShowRF) activeKeys.push('rf_residual');
                    if (tab2ShowXGB) activeKeys.push('xgb_residual');
                    const keysForDomain = activeKeys.length > 0 ? activeKeys : ['ridge_residual'];

                    const yDomain = computeDynamicYDomain(timeline, keysForDomain, zoomDomain, { forceIncludeZero: true });

                    return (
                      <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                        <LineChart data={timeline} margin={{ top: 15, right: 25, left: 15, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                          <XAxis
                            dataKey="time"
                            type="number"
                            domain={zoomDomain}
                            allowDataOverflow={true}
                            tick={{ fill: 'var(--text-muted)' }}
                            tickFormatter={(i) => timeline[Math.round(i)]?.day ? `Day ${timeline[Math.round(i)].day}` : ''}
                          />
                          <YAxis
                            domain={yDomain}
                            allowDataOverflow={true}
                            tick={{ fill: 'var(--text-muted)' }}
                            tickFormatter={(v) => `${Number(v).toFixed(0)} MW`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                            formatter={(val, name) => [`${Number(val).toFixed(2)} MW`, name]}
                            labelFormatter={(i) => {
                              const pt = timeline[Math.round(i)];
                              return pt ? `Day ${pt.day} (Temp: ${Number(pt.temp).toFixed(1)}°C${pt.is_heat_surge ? ' — Heat Surge' : pt.weekend ? ' — Weekend' : ''})` : '';
                            }}
                          />
                          <Legend verticalAlign="top" height={32} />

                          <ReferenceLine
                            y={0}
                            stroke="#94a3b8"
                            strokeWidth={1.6}
                            strokeDasharray="4 4"
                            label={{ position: 'right', value: 'Zero Parity (e = 0)', fill: '#94a3b8', fontSize: 11 }}
                          />

                          {tab2ShowRidge && (
                            <Line
                              type="monotone"
                              dataKey="ridge_residual"
                              name="Ridge Residual (Underpredicts Peak)"
                              stroke="#0284c7"
                              strokeWidth={2.2}
                              dot={{ r: 2 }}
                              isAnimationActive={false}
                            />
                          )}

                          {tab2ShowRF && (
                            <Line
                              type="monotone"
                              dataKey="rf_residual"
                              name="Random Forest Residual"
                              stroke="#059669"
                              strokeWidth={2.2}
                              dot={{ r: 2 }}
                              isAnimationActive={false}
                            />
                          )}

                          {tab2ShowXGB && (
                            <Line
                              type="monotone"
                              dataKey="xgb_residual"
                              name="XGBoost Residual (Tight Dispersion)"
                              stroke="#7c3aed"
                              strokeWidth={2.4}
                              dot={{ r: 2 }}
                              isAnimationActive={false}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  }

                  // Default: 'timeline'
                  const activeKeys = ['actual'];
                  if (tab2ShowRidge) activeKeys.push('ridge_pred');
                  if (tab2ShowRF) activeKeys.push('rf_pred');
                  if (tab2ShowXGB) activeKeys.push('xgb_pred');

                  const yDomain = computeDynamicYDomain(timeline, activeKeys, zoomDomain);

                  return (
                    <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                      <LineChart data={timeline} margin={{ top: 15, right: 25, left: 15, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis
                          dataKey="time"
                          type="number"
                          domain={zoomDomain}
                          allowDataOverflow={true}
                          tick={{ fill: 'var(--text-muted)' }}
                          tickFormatter={(i) => timeline[Math.round(i)]?.day ? `Day ${timeline[Math.round(i)].day}` : ''}
                        />
                        <YAxis
                          domain={yDomain}
                          allowDataOverflow={true}
                          tick={{ fill: 'var(--text-muted)' }}
                          tickFormatter={(v) => `${Number(v).toFixed(0)} MW`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                          formatter={(val, name) => [`${Number(val).toFixed(2)} MW`, name]}
                          labelFormatter={(i) => {
                            const pt = timeline[Math.round(i)];
                            return pt ? `Day ${pt.day} (Temp: ${Number(pt.temp).toFixed(1)}°C${pt.is_heat_surge ? ' — Heat Surge' : pt.weekend ? ' — Weekend' : ''})` : '';
                          }}
                        />
                        <Legend verticalAlign="top" height={32} />

                        <Line
                          type="monotone"
                          dataKey="actual"
                          name="Actual Load (MW)"
                          stroke="#334155"
                          strokeWidth={2.4}
                          dot={{ r: 2 }}
                          isAnimationActive={false}
                        />

                        {tab2ShowRidge && (
                          <Line
                            type="monotone"
                            dataKey="ridge_pred"
                            name="Ridge Forecast"
                            stroke="#0284c7"
                            strokeWidth={2.2}
                            strokeDasharray="4 4"
                            dot={{ r: 2 }}
                            isAnimationActive={false}
                          />
                        )}

                        {tab2ShowRF && (
                          <Line
                            type="monotone"
                            dataKey="rf_pred"
                            name="Random Forest Forecast"
                            stroke="#059669"
                            strokeWidth={2.4}
                            dot={{ r: 2 }}
                            isAnimationActive={false}
                          />
                        )}

                        {tab2ShowXGB && (
                          <Line
                            type="monotone"
                            dataKey="xgb_pred"
                            name="XGBoost Forecast"
                            stroke="#7c3aed"
                            strokeWidth={2.6}
                            dot={{ r: 2 }}
                            isAnimationActive={false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  );
                }}
              </ZoomableChartShell>
            </div>
          </div>
        }
      />
    );
  }

  // Placeholder for subsections 6.3 - 6.6 (implemented in subsequent phases)
  return (
    <div className="glass controls-panel" style={{ padding: '2rem', textAlign: 'center' }}>
      <h3>Section 6.{activeTab} Under Development</h3>
      <p style={{ color: 'var(--text-muted)' }}>
        Per the approved plan, Subsections 6.1 and 6.2 have been completed. Subsections 6.3 through 6.6 will be implemented in subsequent phases.
      </p>
    </div>
  );
}
