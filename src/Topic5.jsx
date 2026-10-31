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
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Scatter,
  Area,
  ReferenceArea,
} from 'recharts';
import {
  BrainCircuit,
  Info,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { MathText, ModelOrder } from './MathText';
import { ZoomableChartShell, SyncedDualChart, computeDynamicYDomain } from './charts';

/** Render "ARIMA(0,1,2)" / "VAR(2)" with the shared ModelOrder KaTeX style. */
const OrderLabel = ({ order, fallback = 'model' }) => {
  const match = String(order || '').match(/^([A-Za-z]+)\((.+)\)$/);
  if (!match) return <>{order || fallback}</>;
  const args = match[2].split(',').map((s) => s.trim()).join(', ');
  return <ModelOrder name={match[1]}>{args}</ModelOrder>;
};

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
  chartHeight = "720px",
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
          <h4><BrainCircuit size={18} /> {extraCardTitle || 'Deep Dive'}</h4>
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

export default function Topic5({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subtab 5.1 state
  const [tab1Shock, setTab1Shock] = useState(250);
  const [tab1CommentaryTab, setTab1CommentaryTab] = useState(1); // 1 intro | 2 demo | 3 remarks

  // Subtab 5.2 state (VARMA matrices)
  const [tab2InspectTime, setTab2InspectTime] = useState(null);

  // Subtab 5.4 state (Granger Causality)
  const [tabGrangerMode, setTabGrangerMode] = useState('sim'); // 'sim' | 'macro'
  const [tabGrangerCommentaryTab, setTabGrangerCommentaryTab] = useState(1); // 1 what | 2 VARMA link | 3 same evidence, two pass marks | 4 which to trust (new data) | 5 real data
  const [tabGrangerBIdx, setTabGrangerBIdx] = useState(null); // null = auto (b with the largest disagreement rate at T = 120)
  const [tabGrangerT, setTabGrangerT] = useState(120);

  // Subtab 5.3 state (Problems with VARMA)
  const [tabUniqTab, setTabUniqTab] = useState(1); // 1 uniqueness | 2 estimation
  const [tabUniqLambda, setTabUniqLambda] = useState('0.30');
  const [tabUniqEstView, setTabUniqEstView] = useState('ridge'); // 'ridge' | 'approx'

  // Subtab 5.5 state (Walk-Forward Validation)
  const [tab4Horizon, setTab4Horizon] = useState(16);
  const [tab4Series, setTab4Series] = useState('realgdp');
  const [tab4SelectedOrigin, setTab4SelectedOrigin] = useState('2004Q4');

  // Subtab 5.6 state (Curse of Dimensionality)
  const [tab6K, setTab6K] = useState(2);
  const [tab6CommentaryTab, setTab6CommentaryTab] = useState(1); // 1 What it is | 2 Why error explodes | 3 Practical defense

  // Subtab 5.7 state (Recursive Coefficient Stability & CUSUM Detection)
  const [tab7Var, setTab7Var] = useState('cons_to_gdp');
  const [tab7ShowCI, setTab7ShowCI] = useState(true);
  const [tab7CommentaryTab, setTab7CommentaryTab] = useState(1); // 1 Detect Drift (CUSUM) | 2 Diagnose Cause (Beta) | 3 Retraining Playbook

  // Subtab 5.8 state (VECM & Cointegration)
  const [tab8View, setTab8View] = useState('levels'); // 'levels' | 'spread' | 'forecast'
  const [tab8Series, setTab8Series] = useState('series_a'); // dynamic per scenario
  const [tab8CommentaryTab, setTab8CommentaryTab] = useState(1); // 1 Intuition | 2 Case 1 | 3 Case 2 | 4 Case 3



  useEffect(() => {
    fetch(`/topic5_data.json?t=${new Date().getTime()}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load topic 5 data", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Topic 5: VARIMA...</div>;
  }

  // =========================================================================
  // SUBTAB 5.1: Why Univariate ARIMA Misses the Feedback Loop
  // =========================================================================
  if (activeTab === 1) {
    const t1Data = data.tab1;
    const currentScenario = t1Data.scenarios[String(tab1Shock)] || t1Data.scenarios['250'];
    const timeline = currentScenario.timeline;
    const curMetrics = currentScenario.metrics?.aic_optimized || {};

    const priceArimaMae = curMetrics.price_arima_mae ?? 24.0;
    const priceVarMae = curMetrics.price_var_mae ?? 5.06;
    const priceRedPct = curMetrics.price_reduction_pct ?? 78.9;

    const dispArimaMae = curMetrics.dispatch_arima_mae ?? 24.4;
    const dispVarMae = curMetrics.dispatch_var_mae ?? 1.56;
    const dispRedPct = curMetrics.dispatch_reduction_pct ?? 93.6;

    const timeMap = {};
    const timeFullMap = {};
    timeline.forEach((pt) => {
      timeMap[pt.time] = pt.time_str || `${pt.time}`;
      timeFullMap[pt.time] = pt;
    });

    const step1Pt = timeline.find((pt) => pt.time === 121);
    const step2Pt = timeline.find((pt) => pt.time === 122);
    const bessMw = step1Pt?.dispatch_var_aic != null ? Number(step1Pt.dispatch_var_aic.toFixed(1)) : 76.4;
    const arimaPriceStep1 = step1Pt?.price_arima_aic != null ? Number(step1Pt.price_arima_aic.toFixed(1)) : 183.4;
    const varPriceStep1 = step1Pt?.price_var_aic != null ? Number(step1Pt.price_var_aic.toFixed(1)) : 166.4;
    const varPriceStep2 = step2Pt?.price_var_aic != null ? Number(step2Pt.price_var_aic.toFixed(1)) : 25.8;
    const arimaDispStep1 = step1Pt?.dispatch_arima_aic != null ? Number(step1Pt.dispatch_arima_aic.toFixed(1)) : 0.6;

    const commentaryTabs = (
      <div className="tabs" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { id: 1, label: 'What VARMA is' },
          { id: 2, label: 'The microgrid loop' },
          { id: 3, label: 'How to read the charts' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tab1CommentaryTab === t.id ? 'active' : ''}`}
            onClick={() => setTab1CommentaryTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    const commentaryBody = (() => {
      if (tab1CommentaryTab === 1) {
        return (
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p>
              <strong>Why univariate ARIMA is not enough:</strong> a separate model for each series sees only its own past. It misses delayed feedback — price triggers battery dispatch, then dispatch suppresses price.
            </p>
            <p>
              <strong>What VARMA is:</strong> the multivariate cousin of ARMA. Instead of one series and scalar coefficients, we model a vector <MathText tex="\mathbf{y}_t" /> with <em>matrix</em> coefficients so each equation can use lags of every included series.
            </p>
            <div style={{ background: 'var(--primary-bg)', padding: '0.55rem', borderRadius: '6px', textAlign: 'center' }}>
              <MathText tex="\mathbf{y}_t = \mathbf{c} + \sum_{i=1}^{p} \mathbf{A}_i \mathbf{y}_{t-i} + \boldsymbol{\varepsilon}_t" />
            </div>
            <p>
              <strong>Naming:</strong> <ModelOrder name="VAR">p</ModelOrder> uses only lagged values (like multivariate AR). <ModelOrder name="VARMA">p, q</ModelOrder> also uses lagged shocks (like multivariate ARMA). If the series need differencing, we speak of VARIMA — the “I” is the same integration idea as in Topic 2. The charts below use a joint <strong>VAR</strong> on levels.
            </p>
          </div>
        );
      }
      if (tab1CommentaryTab === 2) {
        return (
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p>
              <strong>The microgrid setup:</strong> wholesale spot price and battery dispatch form a closed loop. When price exceeds the $75/MWh arbitrage threshold, the battery discharges; the injection then pulls clearing prices back down.
            </p>
            <p>
              <strong>Where independent ARIMA fails:</strong> after the ${tab1Shock}/MWh spike at 10:00, price ARIMA still sees only its own history and forecasts a slow retreat (about ${arimaPriceStep1}/MWh at 10:05, then flat near $55). Dispatch ARIMA saw an idle battery and keeps forecasting near {arimaDispStep1} MW — blind to the price breach.
            </p>
            <p>
              <strong>How joint VAR uses the other series:</strong> training includes the 07:00 contingency spike ($252/MWh) and the ~80 MW response at 07:05, so the model learns that high prices precede discharge and discharge precedes price collapse. At 10:05 it forecasts about {bessMw} MW of injection (actual {step1Pt?.dispatch_actual?.toFixed(1) ?? '78.5'} MW) and price near ${varPriceStep1}; by 10:10 price is forecast near ${varPriceStep2} versus the ARIMA flatline at $55.
            </p>
            <p>
              <strong>Out-of-sample MAE:</strong> price {priceRedPct.toFixed(0)}% lower for VAR (${priceVarMae.toFixed(1)} vs ${priceArimaMae.toFixed(1)}); dispatch {dispRedPct.toFixed(0)}% lower ({dispVarMae.toFixed(1)} vs {dispArimaMae.toFixed(1)} MW). Orders are AIC-selected on the pre-shock window: price <OrderLabel order={curMetrics.price_arima_order} />, dispatch <OrderLabel order={curMetrics.dispatch_arima_order} />, joint <OrderLabel order={curMetrics.price_var_order} />.
            </p>
          </div>
        );
      }
      return (
        <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p>
            <strong>Fit lines vs the forecast origin:</strong> faint lines are one-step predictions <MathText tex="\hat{\mathbf{y}}_{t|t-1}" />. Sudden shocks (02:30, 07:00) are innovations <MathText tex="\boldsymbol{\varepsilon}_t" />, so the fit reacts one step later. Interval 120 is the observed origin <MathText tex="\mathbf{y}_T" />, not a prediction. Both models’ one-step fit at 10:00 still sits near ~$51–$52; the dashed paths for 10:05–10:25 start from that observed shock.
          </p>
          <p>
            <strong>How orders were chosen:</strong> univariate candidates were compared by AIC over a small <MathText tex="(p, d, q)" /> grid on intervals 0–119 only. Selected orders: price <OrderLabel order={curMetrics.price_arima_order} />, dispatch <OrderLabel order={curMetrics.dispatch_arima_order} />, joint <OrderLabel order={curMetrics.price_var_order} />. Changing shock size does not refit the models — it only changes the forecast origin and the simulated holdout path. Whether each series belongs in each equation is a separate question, tested by Granger in 5.4.
          </p>
          <p>
            <strong>Why the first price step looks similar, then diverges:</strong> at 10:00 the battery is still idle, so the first VAR price step has little cross-lag dampening yet. Once VAR projects the {bessMw} MW injection at 10:05, the next price step collapses; ARIMA cannot condition on that dispatch path and stays near its mean.
          </p>
        </div>
      );
    })();

    return (
      <Layout
        title="5.1 What VARMA Is"
        commentary={
          <div>
            {commentaryTabs}
            {commentaryBody}
          </div>
        }
        dataset={
          <p>
            Synthetic 5-minute microgrid series (00:00–10:25, 126 intervals): wholesale spot price ($/MWh) and battery dispatch (MW). Baseload price sits near $45–$55/MWh; the battery stays idle until price exceeds $75/MWh, then discharges and pulls price back down. Training (intervals 0–119) includes a 07:00 contingency spike (~$252/MWh) and is shared across shock sizes. The held-out shock at 10:00 is set by the control below (currently ${tab1Shock}/MWh). Compared models are AIC-selected on that training window: <OrderLabel order={curMetrics.price_arima_order} />, <OrderLabel order={curMetrics.dispatch_arima_order} />, and <OrderLabel order={curMetrics.price_var_order} />.
          </p>
        }
        controls={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Price Shock Size:</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {t1Data.shock_sizes.map((sz) => (
                <button
                  key={sz}
                  className={`nav-btn ${tab1Shock === sz ? 'primary' : 'secondary'}`}
                  onClick={() => setTab1Shock(sz)}
                >
                  ${sz}
                </button>
              ))}
            </div>
          </div>
        }
        extraCardTitle="Out-of-Sample MAE"
        extraCard={
          <table style={comparisonTableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderCellStyle}>Model</th>
                <th style={tableHeaderCellStyle}>Spot Price MAE ($/MWh)</th>
                <th style={tableHeaderCellStyle}>Battery Dispatch MAE (MW)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tableCellStyle, fontWeight: 600, color: '#ef4444' }}>ARIMA</td>
                <td style={tableCellStyle}>{priceArimaMae.toFixed(1)}</td>
                <td style={tableCellStyle}>{dispArimaMae.toFixed(1)}</td>
              </tr>
              <tr>
                <td style={{ ...tableCellStyle, fontWeight: 600, color: '#16a34a', borderBottom: 'none' }}>VAR</td>
                <td style={{ ...tableCellStyle, borderBottom: 'none', fontWeight: 700, color: '#16a34a' }}>{priceVarMae.toFixed(1)}</td>
                <td style={{ ...tableCellStyle, borderBottom: 'none', fontWeight: 700, color: '#16a34a' }}>{dispVarMae.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        }
        chartHeight="680px"
        chart={
          <SyncedDualChart
            key={`tab1_${tab1Shock}`}
            defaultDomain={[75, 125]}
            minTime={0}
            maxTime={125}
            minRange={8}
            top={{
              title: `Spot Price ($/MWh) — shock to $${tab1Shock} at 10:00`,
              content: (zoomDomain) => (
                <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                  <LineChart syncId="tab1Sync" data={timeline} margin={{ top: 28, right: 20, left: 10, bottom: 8 }} style={{ pointerEvents: 'auto' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(t) => timeMap[t] || ''} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                      formatter={(val, name) => (val == null ? null : [`$${Number(val).toFixed(1)}`, name])}
                      labelFormatter={(l) => { const item = timeFullMap[l]; return item ? `${item.datetime} (t=${l})` : `t=${l}`; }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 8 }} />
                    <ReferenceLine y={75} stroke="#d97706" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Arbitrage $75', fill: '#d97706', fontSize: 10 }} />
                    <ReferenceLine x={84} stroke="rgba(107, 114, 128, 0.6)" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Train spike 07:00', fill: 'var(--text-muted)', fontSize: 10 }} />
                    <ReferenceLine x={120} stroke="#eab308" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Forecast origin', fill: '#eab308', fontSize: 11 }} />
                    <Line type="monotone" dataKey="price_actual" name="Actual" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="price_arima_fit" name="ARIMA Fit" stroke="#ef4444" strokeOpacity={0.45} strokeWidth={1.8} dot={false} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="price_var_fit" name="VAR Fit" stroke="#16a34a" strokeOpacity={0.65} strokeWidth={1.8} dot={false} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="price_arima_aic" name="ARIMA Fcst" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="price_var_aic" name="VAR Fcst" stroke="#16a34a" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ),
            }}
            bottom={{
              title: 'Battery Dispatch (MW)',
              content: (zoomDomain) => (
                <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                  <LineChart syncId="tab1Sync" data={timeline} margin={{ top: 28, right: 20, left: 10, bottom: 8 }} style={{ pointerEvents: 'auto' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(t) => timeMap[t] || ''} />
                    <YAxis domain={[0, 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                      formatter={(val, name) => (val == null ? null : [`${Number(val).toFixed(1)} MW`, name])}
                      labelFormatter={(l) => { const item = timeFullMap[l]; return item ? `${item.datetime} (t=${l})` : `t=${l}`; }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 8 }} />
                    <ReferenceLine x={85} stroke="rgba(107, 114, 128, 0.6)" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Train response 07:05', fill: 'var(--text-muted)', fontSize: 10 }} />
                    <ReferenceLine x={120} stroke="#eab308" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: 'Forecast origin', fill: '#eab308', fontSize: 11 }} />
                    <Line type="monotone" dataKey="dispatch_actual" name="Actual" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="dispatch_arima_fit" name="ARIMA Fit" stroke="#ef4444" strokeOpacity={0.45} strokeWidth={1.8} dot={false} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="dispatch_var_fit" name="VAR Fit" stroke="#16a34a" strokeOpacity={0.65} strokeWidth={1.8} dot={false} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="dispatch_arima_aic" name="ARIMA Fcst" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="dispatch_var_aic" name="VAR Fcst" stroke="#16a34a" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ),
            }}
          />
        }
      />
    );
  }

  // =========================================================================
  // SUBTAB 5.2: Coefficient matrices A and M
  // =========================================================================
  if (activeTab === 2) {
    const t2 = data.tab2_varma || {};
    const A = t2.A || [[0.2, 0.8], [0, 0.55]];
    const M = t2.M || [[0.85, 0], [0, 0.35]];
    const timeline = t2.timeline || [];
    const n = timeline.length || t2.n || 80;
    const inspectTime = Math.min(Math.max(tab2InspectTime ?? t2.default_t ?? 20, 1), Math.max(1, n - 1));
    const now = timeline[inspectTime] || {};
    const lag = timeline[inspectTime - 1] || {};

    const fmt = (v, d = 2) => Number(v ?? 0).toFixed(d);
    const term = (coef, input) => (coef ?? 0) * (input ?? 0);
    const pred1 = term(A[0][0], lag.y1) + term(A[0][1], lag.y2) + term(M[0][0], lag.eps1) + term(M[0][1], lag.eps2);
    const pred2 = term(A[1][0], lag.y1) + term(A[1][1], lag.y2) + term(M[1][0], lag.eps1) + term(M[1][1], lag.eps2);

    const chartData = timeline.map((row) => ({
      time: row.t,
      y1: row.y1,
      y2: row.y2,
      mean1: row.mean1,
      mean2: row.mean2,
    }));

    const makePanel = (title, actualKey, meanKey, lagY, lagEps, stroke) => ({
      title,
      content: (zoomDomain) => (
        <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
          <ComposedChart
            syncId="tab2Sync"
            data={chartData}
            margin={{ top: 28, right: 20, left: 10, bottom: 8 }}
            style={{ pointerEvents: 'auto' }}
            onClick={(event) => {
              const time = Number(event?.activeLabel);
              if (Number.isFinite(time) && time >= 1 && time <= n - 1) setTab2InspectTime(Math.round(time));
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
            <Legend verticalAlign="top" height={32} />
            <ReferenceLine x={inspectTime - 1} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 't−1 inputs', fill: '#3b82f6', fontSize: 10, position: 'insideTopLeft' }} />
            <ReferenceLine x={inspectTime} stroke="var(--text-main)" strokeDasharray="3 3" label={{ value: `t = ${inspectTime}`, fill: 'var(--text-muted)', fontSize: 11, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey={actualKey} name="Actual" stroke={stroke} strokeWidth={2.2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={meanKey} name="Conditional mean" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls={false} isAnimationActive={false} />
            <Scatter data={[{ time: inspectTime - 1, value: lagY }]} dataKey="value" fill="#3b82f6" name="Lagged value y_{t-1}" isAnimationActive={false} />
            <Scatter data={[{ time: inspectTime - 1, value: lagEps }]} dataKey="value" fill="#f59e0b" name="Lagged shock ε_{t-1}" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      ),
    });

    return (
      <Layout
        title="5.2 Coefficient Matrices A and M"
        commentary={
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>How a VARMA value is formed:</strong> a bivariate <ModelOrder name="VARMA">1, 1</ModelOrder> stores every lag coefficient in two matrices. <MathText tex="\mathbf{A}" /> multiplies last period’s <em>values</em>; <MathText tex="\mathbf{M}" /> multiplies last period’s <em>shocks</em>. The current observation then equals that predictable mean plus a new shock.
            </p>
            <div style={{ background: 'var(--primary-bg)', padding: '0.7rem', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <MathText tex="\mathbf{y}_t = \mathbf{A} \mathbf{y}_{t-1} + \boldsymbol{\varepsilon}_t + \mathbf{M} \boldsymbol{\varepsilon}_{t-1}" />
              <MathText tex={`\\mathbf{A} = \\begin{bmatrix} ${fmt(A[0][0])} & ${fmt(A[0][1])} \\\\ ${fmt(A[1][0])} & ${fmt(A[1][1])} \\end{bmatrix},\\quad \\mathbf{M} = \\begin{bmatrix} ${fmt(M[0][0])} & ${fmt(M[0][1])} \\\\ ${fmt(M[1][0])} & ${fmt(M[1][1])} \\end{bmatrix}`} />
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
              <strong>How to read an entry:</strong> row = which series is being formed; column = which series the lag (or shock) comes from. So <MathText tex="a_{ij}" /> is the weight on <MathText tex="y_{j,t-1}" /> in the equation for <MathText tex="y_{i,t}" />, and <MathText tex="m_{ij}" /> is the weight on <MathText tex="\varepsilon_{j,t-1}" />.
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
              <strong>Expanded equations:</strong> the matrix form is just two ordinary ARMA-style equations written together — the first row of <MathText tex="\mathbf{A}" /> and <MathText tex="\mathbf{M}" /> for Y₁, the second row for Y₂:
            </p>
            <div style={{ fontSize: '0.86rem', lineHeight: 1.75, textAlign: 'center' }}>
              <div><MathText tex={`y_{1,t} = ${fmt(A[0][0])} y_{1,t-1} + ${fmt(A[0][1])} y_{2,t-1} + \\varepsilon_{1,t} + ${fmt(M[0][0])} \\varepsilon_{1,t-1} + ${fmt(M[0][1])} \\varepsilon_{2,t-1}`} /></div>
              <div><MathText tex={`y_{2,t} = ${fmt(A[1][0])} y_{1,t-1} + ${fmt(A[1][1])} y_{2,t-1} + \\varepsilon_{2,t} + ${fmt(M[1][0])} \\varepsilon_{1,t-1} + ${fmt(M[1][1])} \\varepsilon_{2,t-1}`} /></div>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
              <strong>What these numbers mean:</strong> in this data-generating process, <MathText tex="a_{11}=0.20" /> and <MathText tex="a_{22}=0.55" /> are own persistence (like <MathText tex="\phi" /> in ARMA). <MathText tex="a_{12}=0.80" /> is a strong cross-lag: yesterday’s Y₂ pulls Y₁. <MathText tex="a_{21}=0" /> means Y₁ does not feed back into Y₂. On the shock side, <MathText tex="m_{11}=0.85" /> and <MathText tex="m_{22}=0.35" /> are own shock memory (like <MathText tex="\theta" />); both off-diagonal <MathText tex="\mathbf{M}" /> entries are 0, so one series’ shock does not enter the other series through <MathText tex="\mathbf{M}" />.
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
              <strong>How to read the charts:</strong> blue and amber dots at <MathText tex="t-1" /> are the four inputs <MathText tex="\mathbf{A}" /> and <MathText tex="\mathbf{M}" /> multiply — <MathText tex="y_1" /> and <MathText tex="\varepsilon_1" /> on the top chart, <MathText tex="y_2" /> and <MathText tex="\varepsilon_2" /> on the bottom. Each red line is that equation’s conditional mean; the gap to actual at <MathText tex="t" /> is the new shock <MathText tex="\varepsilon_t" />.
            </p>
          </div>
        }
        dataset={
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
            Synthetic bivariate <ModelOrder name="VARMA">1, 1</ModelOrder> ({n} observations) generated from the matrices above. Nothing is estimated.
          </p>
        }
        controls={
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(380px, 1.1fr) minmax(420px, 1.3fr)',
            gap: '1rem 2.5rem',
            alignItems: 'center',
            width: '100%',
          }}>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>Inspect time</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>t = {inspectTime}</span>
              </label>
              <input
                type="range"
                min={1}
                max={n - 1}
                step={1}
                value={inspectTime}
                onChange={(e) => setTab2InspectTime(parseInt(e.target.value, 10))}
                style={{ width: '100%', display: 'block' }}
              />
            </div>
            <div style={{ fontSize: '0.82rem', lineHeight: 1.55, minWidth: 0, textAlign: 'center' }}>
              <div>
                <MathText tex={`\\hat{y}_{1,${inspectTime}} = ${fmt(A[0][0])}(${fmt(lag.y1)}) + ${fmt(A[0][1])}(${fmt(lag.y2)}) + ${fmt(M[0][0])}(${fmt(lag.eps1)}) + ${fmt(M[0][1])}(${fmt(lag.eps2)}) = ${fmt(pred1, 3)}`} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Actual <MathText tex={`y_{1,${inspectTime}} = ${fmt(now.y1, 3)}`} />, <MathText tex={`\\varepsilon_{1,${inspectTime}} = ${fmt((now.y1 ?? 0) - pred1, 3)}`} />
              </div>
              <div>
                <MathText tex={`\\hat{y}_{2,${inspectTime}} = ${fmt(A[1][0])}(${fmt(lag.y1)}) + ${fmt(A[1][1])}(${fmt(lag.y2)}) + ${fmt(M[1][0])}(${fmt(lag.eps1)}) + ${fmt(M[1][1])}(${fmt(lag.eps2)}) = ${fmt(pred2, 3)}`} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Actual <MathText tex={`y_{2,${inspectTime}} = ${fmt(now.y2, 3)}`} />, <MathText tex={`\\varepsilon_{2,${inspectTime}} = ${fmt((now.y2 ?? 0) - pred2, 3)}`} />
              </div>
            </div>
          </div>
        }
        chartHeight="680px"
        chart={
          <SyncedDualChart
            defaultDomain={[0, n - 1]}
            minTime={0}
            maxTime={n - 1}
            minRange={8}
            top={makePanel('Y₁', 'y1', 'mean1', lag.y1, lag.eps1, '#2563eb')}
            bottom={makePanel('Y₂', 'y2', 'mean2', lag.y2, lag.eps2, '#10b981')}
          />
        }
      />
    );
  }

  // =========================================================================
  // SUBTAB 5.4: Granger Causality (nav slot 4; uniqueness is 5.3)
  // =========================================================================
  if (activeTab === 4) {
    const tGranger = data.tab_granger;
    if (!tGranger || !tGranger.sim || !tGranger.macro) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Missing Granger causality data. Run <code>python generate_topic5_data.py</code>.
        </div>
      );
    }
    const { sim, macro } = tGranger;

    const mp = macro?.pairs || [];
    const helped = mp.filter((p) => p.rmse_ratio < 1).map((p) => p.label);

    const isTab2 = tabGrangerCommentaryTab === 2;
    const isAicTab = tabGrangerCommentaryTab === 3 || tabGrangerCommentaryTab === 4;
    const isNewDataTab = tabGrangerCommentaryTab === 4;
    const isMacroTab = tabGrangerCommentaryTab === 5;

    const defaultBIdx = (() => {
      const cells = sim.cells?.['120'] || [];
      let best = 0;
      cells.forEach((c, i) => {
        if ((c.y2_to_y1?.disagree_rate ?? 0) > (cells[best]?.y2_to_y1?.disagree_rate ?? 0)) best = i;
      });
      return best;
    })();
    const bIdx = tabGrangerBIdx ?? defaultBIdx;

    const currentTCells = sim.cells?.[String(tabGrangerT)];
    const currentCell = currentTCells?.[bIdx];
    const currentThreshold = sim.thresholds?.[String(tabGrangerT)];
    const selectedB = sim.b_grid?.[bIdx];
    if (!currentTCells || !currentCell || !currentThreshold || selectedB === undefined) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Missing Granger causality data for this selection. Run <code>python generate_topic5_data.py</code>.
        </div>
      );
    }
    const b0Cell = currentTCells.find((c) => c.b === 0);

    const hasInversion = currentTCells.some(
      (c) => (c.y2_to_y1?.granger_reject_rate ?? 0) > (c.y2_to_y1?.aic_include_rate ?? 0)
    );
    if (hasInversion) {
      console.error('Impossible state: granger_reject_rate > aic_include_rate');
    }

    const simChartData = currentTCells.map((c) => {
      const bVal = c.b;
      const bLabel = String(bVal);
      const y21 = c.y2_to_y1 || {};
      const y12 = c.y1_to_y2 || {};
      return {
        b: bVal,
        bLabel,
        f_median_y21: y21.f_median,
        f_band: [y21.f_q25, y21.f_q75],
        f_median_null: y12.f_median,
        aic_include_rate: y21.aic_include_rate,
        granger_reject_rate: y21.granger_reject_rate,
        unrestricted_wins_rate: y21.unrestricted_wins_rate,
        gap_wins: y21.when_aic_only?.wins_rate ?? null,
        gap_change: y21.when_aic_only?.median_ratio == null ? null : y21.when_aic_only.median_ratio - 1,
        null_granger_reject_rate: y12.granger_reject_rate,
        gap_band: [
          Math.min(y21.granger_reject_rate ?? 0, y21.aic_include_rate ?? 0),
          Math.max(y21.granger_reject_rate ?? 0, y21.aic_include_rate ?? 0),
        ],
      };
    });

    const commentaryTabs = (
      <div className="tabs" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { id: 1, label: '1 How the test behaves' },
          { id: 2, label: '2 Link to VARMA' },
          { id: 3, label: '3 Same evidence, two pass marks' },
          { id: 4, label: '4 Which to trust: new data' },
          { id: 5, label: '5 Real data: U.S. macro' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tabGrangerCommentaryTab === t.id ? 'active' : ''}`}
            onClick={() => {
              setTabGrangerCommentaryTab(t.id);
              if (t.id === 5) {
                setTabGrangerMode('macro');
              } else {
                setTabGrangerMode('sim');
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    const pctOf = (x) => (x == null ? 'n/a' : `${(x * 100).toFixed(1)}%`);
    const cur = currentCell.y2_to_y1 || {};
    const b0 = b0Cell?.y2_to_y1 || {};
    const fmtCross = (tv) => {
      const v = sim.b_cross_by_T?.[String(tv)];
      return v == null ? 'n/a' : v.toFixed(2);
    };
    const pctChange = (ratio) => (ratio == null ? 'n/a' : `${ratio >= 1 ? '+' : ''}${((ratio - 1) * 100).toFixed(1)}%`);
    const shrinkPct = (f) => {
      const r = 1 + (f * sim.dgp.p) / (currentThreshold.n - currentThreshold.k_u);
      return (100 * (1 - 1 / r)).toFixed(1);
    };
    const shrinkG = shrinkPct(currentThreshold.f_crit);
    const shrinkA = shrinkPct(currentThreshold.f_aic);
    const nPairs = mp.length;
    const labT = sim.t_grid?.[1];
    const labCells = sim.cells?.[String(labT)] || [];
    const labCell = labCells.reduce((best, c) => {
      const score = c.y2_to_y1?.disagree_rate;
      const bestScore = best?.y2_to_y1?.disagree_rate;
      if (score == null) return best;
      if (bestScore == null || score > bestScore) return c;
      return best;
    }, null);
    const labGranger = labCell?.y2_to_y1?.when_granger_rejects;
    const sigLabels = mp.filter((p) => p.granger_reject).map((p) => p.label);
    const nMismatch = mp.filter((p) => p.granger_reject !== (p.rmse_ratio < 1)).length;
    const paraStack = { fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' };
    const formulaBox = { background: 'var(--primary-bg)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' };
    const A52 = data.tab2_varma?.A;
    const g52 = data.tab2_varma?.granger_var_approx;
    const fmtP = (pv) => (pv < 0.0001 ? '< 0.0001' : `= ${pv.toFixed(3)}`);

    const commentaryBody = (() => {
      if (tabGrangerCommentaryTab === 1) {
        return (
          <div style={paraStack}>
            <p>
              <strong>From joint models to a yes/no filter:</strong> Sections 5.1&ndash;5.2 put <MathText tex="Y_1" /> and <MathText tex="Y_2" /> in one system so each equation can use the other&rsquo;s past. Granger asks the narrower filter: does <MathText tex="Y_2" />&rsquo;s past belong in <MathText tex="Y_1" />&rsquo;s equation at all?
            </p>
            <p>
              <strong>What the test compares:</strong> Fit two models for <MathText tex="Y_1" /> &mdash; one that uses only <MathText tex="Y_1" />&rsquo;s own past (the &ldquo;no effect&rdquo; assumption, <MathText tex="H_0" />), and one that also uses <MathText tex="Y_2" />&rsquo;s past. If the second fits enough better that luck alone is unlikely, the test rejects <MathText tex="H_0" />. A rejection means &ldquo;helps predict,&rdquo; not &ldquo;causes.&rdquo; The gain is the same residual-sum idea as Section 2.4, rewritten as an <MathText tex="F" /> statistic:
            </p>
            <div style={formulaBox}>
              <MathText tex="F = \frac{\text{improvement in fit per added term}}{\text{noise left per remaining observation}}" />
            </div>
            <p>
              <strong>Why the lab uses simulation:</strong> real data hides the true effect. Here we simulate {sim.dgp.reps} datasets per setting and set <MathText tex="b" /> ourselves (how strongly <MathText tex="Y_2" />&rsquo;s past drives <MathText tex="Y_1" />).
            </p>
            <p>
              <strong>Guided walk (controls panel below):</strong> Slide <MathText tex="b" /> to 0: Panel B&rsquo;s Granger rejection rate (how often the test says Y2 helps predict Y1) is {pctOf(b0.granger_reject_rate)} &mdash; false alarms, near 5% by design. Raise <MathText tex="b" />: the blue median <MathText tex="F" /> in Panel A climbs toward the red dashed 5% cut-off. Where they meet is the crossing point (the <MathText tex="b" /> where a typical dataset first looks convincing): left of it most datasets fail to reject; right of it most reject. At your setting (<MathText tex="b" /> = {selectedB}, <MathText tex="T" /> = {tabGrangerT}) the test rejects in {pctOf(cur.granger_reject_rate)}.
            </p>
            <p>
              <strong>Sample size and takeaway:</strong> Larger <MathText tex="T" /> averages out noise, so the crossing moves left &mdash; near <MathText tex="b" /> = {fmtCross(60)} at 60, {fmtCross(120)} at 120, {fmtCross(240)} at 240. That is the sensitivity of the test: how small an effect it can notice. A &ldquo;no&rdquo; may only mean the effect is too small for this sample; a &ldquo;yes&rdquo; means distinguishable from zero &mdash; not that it is large or improves new-data forecasts (Tabs 3&ndash;4).
            </p>
          </div>
        );
      }
      if (tabGrangerCommentaryTab === 2) {
        return (
          <div style={paraStack}>
            <p>
              <strong>What Granger causality tests in a VAR:</strong> in a two-variable system, &ldquo;<MathText tex="Y_2" /> helps predict <MathText tex="Y_1" />&rdquo; means the cross-lag coefficient <MathText tex="a_{12}" /> — how strongly the past of Y2 feeds into Y1 — is not zero. The reverse link is <MathText tex="a_{21}" />.
            </p>
            <p>
              <strong>The Section 5.2 system:</strong> <MathText tex="a_{12}" /> = {A52 ? A52[0][1] : 'n/a'} and <MathText tex="a_{21}" /> = {A52 ? A52[1][0] : 'n/a'}. <MathText tex="Y_2" /> feeds strongly into <MathText tex="Y_1" /> and nothing feeds back — a one-way link.
            </p>
            {g52 ? (
              <p>
                <strong>Applying the F test to that system:</strong> fitting a VAR({g52.p}) to {g52.y2_to_y1.n_obs} observations and testing <MathText tex="a_{12}" /> gives <MathText tex="F" /> = {g52.y2_to_y1.F.toFixed(1)}, well above the 5% cut-off of {g52.y2_to_y1.f_crit.toFixed(2)} (<MathText tex="p" /> {fmtP(g52.y2_to_y1.p_val)}): Granger rejects and <MathText tex="Y_2" /> is confirmed to help predict <MathText tex="Y_1" />. Testing <MathText tex="a_{21}" /> gives <MathText tex="F" /> = {g52.y1_to_y2.F.toFixed(2)}, well below the cut-off: no rejection. This is the right side of the crossing in Tab 1 — a large effect, an <MathText tex="F" /> far above the threshold.
              </p>
            ) : null}
            <p>
              <strong>Why VARMA complicates this:</strong> in a VARMA the coefficient <MathText tex="a_{12}" /> is not pinned down. Section 5.3 showed that different coefficient sets can describe exactly the same data, so a zero in <MathText tex="\mathbf{A}" /> may simply move the cross-series link into the moving-average part. Past shocks also reach <MathText tex="Y_1" /> through that channel.
            </p>
            <p>
              <strong>The standard workaround:</strong> approximate the VARMA with a VAR that has enough lags (<MathText tex="p" />, chosen by AIC) and apply the usual <MathText tex="F" /> test to the <MathText tex="Y_2" /> lags. If <MathText tex="p" /> is too small the approximation is poor and the test can mislead.
            </p>
          </div>
        );
      }
      if (tabGrangerCommentaryTab === 3) {
        return (
          <div style={paraStack}>
            <p>
              <strong>From Tab 1&rsquo;s F to two decisions:</strong> Tab 1 used <MathText tex="F" /> to ask whether <MathText tex="Y_2" />&rsquo;s past is distinguishable from noise. The same <MathText tex="F" /> also feeds AIC, which asks whether adding <MathText tex="Y_2" /> pays for its extra parameters when the goal is forecasting new data well.
            </p>
            <p>
              <strong>One ruler, two pass marks (Panel A):</strong> Adding <MathText tex="Y_2" /> shrinks leftover squared error; bigger shrinkage means a larger <MathText tex="F" />. Granger needs <MathText tex="F" /> above {currentThreshold.f_crit.toFixed(2)} (about {shrinkG}% error shrinkage) &mdash; too big to be luck 95% of the time. AIC needs only {currentThreshold.f_aic.toFixed(2)} (about {shrinkA}%). AIC&rsquo;s bar is lower. The amber band between those lines is where AIC says yes and Granger says no.
            </p>
            <p>
              <strong>Why Granger rejection implies AIC inclusion:</strong> clearing the higher mark clears the lower one too. The reverse fails only in that amber band &mdash; so the disagreement is the width between two pass marks, not random noise.
            </p>
            <p>
              <strong>Guided walk (Panel B, controls below):</strong> Raise <MathText tex="b" />: amber (AIC includes <MathText tex="Y_2" />) lifts first, then red (Granger rejection rate). The gap between them peaks at moderate <MathText tex="b" /> and closes when the effect is large. At your setting (<MathText tex="b" /> = {selectedB}, <MathText tex="T" /> = {tabGrangerT}): Granger {pctOf(cur.granger_reject_rate)}, AIC {pctOf(cur.aic_include_rate)}, disagree {pctOf(cur.disagree_rate)}.
            </p>
            <p>
              <strong>What &ldquo;AIC yes, Granger no&rdquo; means:</strong> the gain cleared AIC&rsquo;s cost but not the 5% luck bar (<MathText tex="p" /> between 5% and {currentThreshold.p_aic.toFixed(2)}). Treat it as &ldquo;maybe useful.&rdquo; Tab 4 checks whether those datasets forecast better on new data.
            </p>
          </div>
        );
      }
      if (tabGrangerCommentaryTab === 4) {
        const gapText = (o) => {
          if (!o || o.n == null) return 'n/a';
          if (o.wins_rate == null) return `only ${o.n} datasets, too few to summarize`;
          return `${o.n} datasets, lower error in ${pctOf(o.wins_rate)}, typical change ${pctChange(o.median_ratio)}`;
        };
        return (
          <div style={paraStack}>
            <p>
              <strong>What this tab measures:</strong> in Tab 3 the gap between the red and amber lines is the &ldquo;AIC yes, Granger no&rdquo; zone. Chart C and the scorecard focus only on those datasets: did including <MathText tex="Y_2" /> help on the last {sim.dgp.holdout} unseen points?
            </p>
            <p>
              <strong>How to read Chart C:</strong> Teal (left axis) is the share of gap datasets where new-data error falls with <MathText tex="Y_2" />; the grey dashed line at one-half is break-even. Blue dashed (right axis) is the typical percent change in that error (the median, so one outlier does not set it): zero means no net change; negative means <MathText tex="Y_2" /> helped.
            </p>
            <p>
              <strong>No real effect (<MathText tex="b = 0" />):</strong> every gap dataset is a false alarm, so the gap result is {gapText(b0.when_aic_only)}. That loss is larger than the all-dataset change of {pctChange(b0.rmse_ratio_median)}, because AIC is fooled when a fitted coefficient happens to look large.
            </p>
            <p>
              <strong>Your setting</strong> (<MathText tex="b" /> = {selectedB}, <MathText tex="T" /> = {tabGrangerT}): {gapText(cur.when_aic_only)}. Raise <MathText tex="b" /> and both gap lines shift from a small loss toward a small gain. Compare the blue percent with the loss at <MathText tex="b = 0" /> to judge whether the improvement is meaningful.
            </p>
            <p>
              <strong>When the rules disagree:</strong> For forecasting, lean on new-data error (and AIC&rsquo;s lower bar) &mdash; missing a small real effect usually costs more than keeping a useless lag. For claiming a real link, lean on Granger &mdash; it controls false alarms. If the blue percent is tiny either way, prefer the simpler model without <MathText tex="Y_2" />. Tab 5 shows how noisy one real holdout can be.
            </p>
          </div>
        );
      }

      const bothYesWorse = mp.filter((p) => p.granger_reject && p.aic_include && p.rmse_ratio >= 1).map((p) => p.label);
      return (
        <div style={paraStack}>
          <p>
            <strong>Moving from simulation to real data:</strong> Tabs 1–3 used simulated datasets where the true effect was known. Here the trained models end at {macro.train_end} and their forecasts are compared to actuals in {macro.test_start}&ndash;{macro.test_end} ({macro.holdout_quarters} quarters) — a window neither Granger nor AIC has seen.
          </p>
          <div>
            <p style={{ margin: '0 0 0.35rem 0' }}><strong>What the table shows</strong> ({nMismatch} of {nPairs} pairs mismatch, amber rows):</p>
            <ul style={{ margin: 0, paddingLeft: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>Granger rejected for <strong>{sigLabels.join(' and ') || 'no pair'}</strong> with high confidence — AIC added both — yet both forecast <em>worse</em> on the held-out window.</li>
              <li>The only pair that forecast better, <strong>{helped.join(' and ') || 'none'}</strong>, was not significant: Granger did not reject, well above the 5% bar.</li>
              <li>The training rules called it &ldquo;below the bar&rdquo;; the held-out window called it the most useful pair.</li>
            </ul>
          </div>
          <div>
            <p style={{ margin: '0 0 0.35rem 0' }}><strong>Tab 5 is the payoff of Tabs 1&ndash;4, not a contradiction:</strong></p>
            <ul style={{ margin: 0, paddingLeft: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>A rejection means the effect is <em>distinguishable from zero in training</em> — not that it improves forecasts on unseen data (Tab 1).</li>
              <li>The strongest rejection (Consumption &rarr; GDP) likely reflects the national accounts identity: GDP is partly <em>constructed from</em> consumption, so the VAR detects a mechanical link with no independent predictive signal.</li>
              <li>The useful pair Granger missed is Tab 1&rsquo;s mirror warning: &ldquo;no&rdquo; can mean the effect is real but below the detection threshold for this sample size.</li>
              <li>{macro.holdout_quarters} quarters of test data is one noisy draw — a different window would shift every number in the table.</li>
            </ul>
          </div>
        </div>
      );
    })();

    const datasetSection = (() => {
      const wrap = { fontSize: '0.88rem', lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: '0.55rem' };
      if (tabGrangerCommentaryTab === 2) {
        return (
          <div style={wrap}>
            <p style={{ margin: 0 }}>
              <strong>Example system from Section 5.2:</strong> <MathText tex="\mathbf{y}_t = \mathbf{A}\mathbf{y}_{t-1} + \boldsymbol{\varepsilon}_t" />
              {A52 ? <> with <MathText tex={`\\mathbf{A} = \\begin{pmatrix} ${A52[0][0]} & ${A52[0][1]} \\\\ ${A52[1][0]} & ${A52[1][1]} \\end{pmatrix}`} /></> : null}.
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              No new data is simulated on this tab.
            </p>
          </div>
        );
      }
      if (tabGrangerCommentaryTab !== 5) {
        return (
          <div style={wrap}>
            <p style={{ margin: 0 }}>
              <strong>Synthetic two-variable system.</strong> {sim.dgp.reps} datasets for each cross-effect <MathText tex="b" /> and sample size <MathText tex="T \in \{60, 120, 240\}" />; the last {sim.dgp.holdout} points of each dataset are held out as new data.
            </p>
            <div style={{ background: 'var(--primary-bg)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.86rem' }}>
              <div><MathText tex={`y_{1,t} = ${sim.dgp.a11}\\,y_{1,t-1} + ${selectedB}\\,y_{2,t-1} + \\varepsilon_{1,t}`} /></div>
              <div style={{ marginTop: '0.25rem' }}><MathText tex={`y_{2,t} = ${sim.dgp.a22}\\,y_{2,t-1} + \\varepsilon_{2,t}`} /></div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              The reverse direction (<MathText tex="Y_1 \to Y_2" />) has no real effect and serves as the comparison.
            </p>
          </div>
        );
      }
      return (
        <div style={wrap}>
          <p style={{ margin: 0 }}>
            <strong>U.S. macro growth, {macro.sample_start}&ndash;{macro.sample_end}.</strong> Quarterly log differences of real GDP, real consumption and real disposable income (statsmodels macrodata).
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Models are fitted through {macro.train_end} and tested on {macro.test_start}&ndash;{macro.test_end} ({macro.holdout_quarters} quarters). Lag order <MathText tex={`p = ${macro.p_star}`} /> was chosen by AIC on the joint 3-variable model.
          </p>
        </div>
      );
    })();

    const controlsSection = tabGrangerMode === 'sim' ? (
      <>
        <div style={{ minWidth: '260px', flex: '1 1 300px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem', fontSize: '0.88rem' }}>
            <span style={{ fontWeight: 600 }}>Cross-effect b (<MathText tex="Y_2 \to Y_1" />):</span>
            <span style={{ fontWeight: 700, color: selectedB === 0 ? 'var(--text-muted)' : 'var(--primary)' }}>
              {selectedB === 0 ? '0 (no true effect)' : selectedB.toFixed(selectedB < 0.1 ? 3 : 2)}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={sim.b_grid.length - 1}
            step={1}
            value={bIdx}
            onChange={(e) => setTabGrangerBIdx(parseInt(e.target.value, 10))}
            style={{ width: '100%', display: 'block', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            <span>0.00 (none)</span>
            <span>0.10 (weak)</span>
            <span>0.20</span>
            <span>0.50 (strong)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sample size T:</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {sim.t_grid.map((tVal) => (
              <button
                key={tVal}
                className={`nav-btn ${tabGrangerT === tVal ? 'primary' : 'secondary'}`}
                onClick={() => setTabGrangerT(tVal)}
              >
                {tVal}
              </button>
            ))}
          </div>
        </div>
      </>
    ) : null;

    const extraCardTitle = tabGrangerMode === 'sim'
      ? `Scorecard at b = ${selectedB}, T = ${tabGrangerT}`
      : `Real data: does significance match usefulness? (lag p = ${macro.p_star}, fitted through ${macro.train_end})`;

    const extraCardContent = tabGrangerMode === 'sim' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--primary)' }}>
            Across {sim.dgp.reps} simulated datasets at <MathText tex={`b = ${selectedB}, T = ${tabGrangerT}`} />
          </div>
          {isNewDataTab ? (
            <>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Gap datasets only (“AIC yes, Granger no”), measured on the last {sim.dgp.holdout} held-out points. Negative change means Y₂ forecast better.
              </div>
              <table style={comparisonTableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderCellStyle}>Group</th>
                    <th style={tableHeaderCellStyle}>Datasets</th>
                    <th style={tableHeaderCellStyle}>Lower new-data error</th>
                    <th style={tableHeaderCellStyle}>Typical error change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: 'rgba(15, 118, 110, 0.10)' }}>
                    <td style={{ ...tableCellStyle, fontWeight: 700, textAlign: 'left' }}>Gap, this setting (AIC adds, Granger does not)</td>
                    <td style={tableCellStyle}>{cur.when_aic_only?.n ?? 'n/a'}</td>
                    <td style={tableCellStyle}>{cur.when_aic_only?.wins_rate == null ? 'n/a' : pctOf(cur.when_aic_only.wins_rate)}</td>
                    <td style={tableCellStyle}>{pctChange(cur.when_aic_only?.median_ratio)}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellStyle, fontWeight: 600, textAlign: 'left' }}>Gap, no real effect (b = 0) — baseline</td>
                    <td style={tableCellStyle}>{b0.when_aic_only?.n ?? 'n/a'}</td>
                    <td style={tableCellStyle}>{b0.when_aic_only?.wins_rate == null ? 'n/a' : pctOf(b0.when_aic_only.wins_rate)}</td>
                    <td style={tableCellStyle}>{pctChange(b0.when_aic_only?.median_ratio)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
          <>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            {isAicTab
                ? 'Both rules read the same F; AIC just uses the lower pass mark.'
                : 'These are the numbers behind the lines in the chart at the current settings.'}
          </div>
          <table style={comparisonTableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderCellStyle}>Direction</th>
                <th style={tableHeaderCellStyle}>Granger rejection rate (<MathText tex="p < 0.05" />)</th>
                {isAicTab && <th style={tableHeaderCellStyle}>AIC adds <MathText tex="Y_2" /></th>}
                {isAicTab && <th style={tableHeaderCellStyle}>AIC adds, Granger does not</th>}
                <th style={tableHeaderCellStyle}>Median <MathText tex="F" /></th>
                {isNewDataTab && <th style={tableHeaderCellStyle}>Forecast improves on new data</th>}
                {isNewDataTab && <th style={tableHeaderCellStyle}>Typical error change (median RMSE with <MathText tex="Y_2" /> vs without)</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tableCellStyle, fontWeight: 600, textAlign: 'left' }}>
                  <MathText tex="Y_2 \to Y_1" /> (real effect: <MathText tex={`b = ${selectedB}`} />)
                </td>
                <td style={tableCellStyle}>{(currentCell.y2_to_y1?.granger_reject_rate * 100).toFixed(1)}%</td>
                {isAicTab && <td style={tableCellStyle}>{(currentCell.y2_to_y1?.aic_include_rate * 100).toFixed(1)}%</td>}
                {isAicTab && (
                  <td style={{ ...tableCellStyle, fontWeight: (currentCell.y2_to_y1?.disagree_rate ?? 0) > 0.1 ? 700 : 400, color: (currentCell.y2_to_y1?.disagree_rate ?? 0) > 0.1 ? '#d97706' : 'inherit' }}>
                    {((currentCell.y2_to_y1?.disagree_rate ?? 0) * 100).toFixed(1)}%
                  </td>
                )}
                <td style={tableCellStyle}>{currentCell.y2_to_y1?.f_median?.toFixed(2)}</td>
                {isNewDataTab && <td style={tableCellStyle}>{(currentCell.y2_to_y1?.unrestricted_wins_rate * 100).toFixed(1)}%</td>}
                {isNewDataTab && <td style={tableCellStyle}>{pctChange(currentCell.y2_to_y1?.rmse_ratio_median)}</td>}
              </tr>
              <tr>
                <td style={{ ...tableCellStyle, fontWeight: 600, textAlign: 'left' }}>
                  <MathText tex="Y_1 \to Y_2" /> (no real effect)
                </td>
                <td style={tableCellStyle}>{(currentCell.y1_to_y2?.granger_reject_rate * 100).toFixed(1)}%</td>
                {isAicTab && <td style={tableCellStyle}>{(currentCell.y1_to_y2?.aic_include_rate * 100).toFixed(1)}%</td>}
                {isAicTab && <td style={tableCellStyle}>{(currentCell.y1_to_y2?.disagree_rate * 100).toFixed(1)}%</td>}
                <td style={tableCellStyle}>{currentCell.y1_to_y2?.f_median?.toFixed(2)}</td>
                {isNewDataTab && <td style={tableCellStyle}>{(currentCell.y1_to_y2?.unrestricted_wins_rate * 100).toFixed(1)}%</td>}
                {isNewDataTab && <td style={tableCellStyle}>{pctChange(currentCell.y1_to_y2?.rmse_ratio_median)}</td>}
              </tr>
              {isNewDataTab && (
                <tr>
                  <td style={{ ...tableCellStyle, fontWeight: 600, textAlign: 'left' }}>
                    Gap only: AIC adds, Granger does not
                    {' '}(n = {cur.when_aic_only?.n ?? 'n/a'})
                  </td>
                  <td style={tableCellStyle}>—</td>
                  <td style={tableCellStyle}>—</td>
                  <td style={tableCellStyle}>—</td>
                  <td style={tableCellStyle}>—</td>
                  <td style={tableCellStyle}>
                    {cur.when_aic_only?.wins_rate == null ? 'n/a' : `${(cur.when_aic_only.wins_rate * 100).toFixed(1)}%`}
                  </td>
                  <td style={tableCellStyle}>{pctChange(cur.when_aic_only?.median_ratio)}</td>
                </tr>
              )}
            </tbody>
          </table>
          </>
          )}
        </div>
      </div>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={comparisonTableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderCellStyle}>Pair (driver &rarr; target)</th>
              <th style={tableHeaderCellStyle}>Granger test (5%)</th>
              <th style={tableHeaderCellStyle}>AIC</th>
              <th style={tableHeaderCellStyle}>Forecast error on new data, with driver vs without</th>
              <th style={tableHeaderCellStyle}>Significance matches usefulness?</th>
            </tr>
          </thead>
          <tbody>
            {mp.map((p) => {
              const useful = p.rmse_ratio < 1;
              const matches = p.granger_reject === useful;
              const changePct = (p.rmse_ratio - 1) * 100;
              return (
                <tr key={p.id} style={{ background: matches ? 'transparent' : 'rgba(217, 119, 6, 0.10)' }}>
                  <td style={{ ...tableCellStyle, fontWeight: 600, textAlign: 'left' }}>{p.label}</td>
                  <td style={tableCellStyle}>
                    {p.granger_reject ? 'Rejects' : 'Does not reject'} (<MathText tex="p" /> {p.p_val < 0.0001 ? '< 0.0001' : `= ${p.p_val.toFixed(3)}`})
                  </td>
                  <td style={tableCellStyle}>{p.aic_include ? 'Adds driver' : 'Does not add'}</td>
                  <td style={{ ...tableCellStyle, color: useful ? '#16a34a' : 'inherit', fontWeight: useful ? 600 : 400 }}>
                    {`${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`} {useful ? '(better)' : '(worse)'}
                  </td>
                  <td style={{ ...tableCellStyle, fontWeight: matches ? 400 : 700, color: matches ? 'var(--text-muted)' : '#d97706' }}>
                    {matches ? 'Match' : 'Mismatch'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    const chartSection = tabGrangerMode === 'sim' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {!isNewDataTab && <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            A. F statistic for Y₂ predicting Y₁ (the ruler)
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            b values are shown as equally spaced categories, not to scale.
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            {isAicTab ? (
              <>Amber bar: AIC threshold (F = {currentThreshold.f_aic}); red bar: 5% Granger threshold (F = {currentThreshold.f_crit}); shaded band: AIC includes, Granger does not.</>
            ) : (
              <>Red bar: 5% Granger threshold (F = {currentThreshold.f_crit}). Above this line a typical dataset rejects &ldquo;no effect&rdquo;.</>
            )}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simChartData} margin={{ top: 20, right: 25, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="bLabel" type="category" tick={{ fill: 'var(--text-muted)' }} />
                <YAxis
                  scale="log"
                  domain={[0.1, 'auto']}
                  allowDataOverflow
                  tick={{ fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => (typeof v === 'number' ? v.toFixed(v < 1 ? 1 : 0) : v)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                  formatter={(val, name) => {
                    if (Array.isArray(val)) return [`[${val[0]?.toFixed(2)}, ${val[1]?.toFixed(2)}]`, name];
                    return [typeof val === 'number' ? val.toFixed(2) : val, name];
                  }}
                  labelFormatter={(l) => `Cross-effect b = ${l}`}
                />
                <Legend verticalAlign="top" height={32} />
                {isAicTab && (
                  <ReferenceArea
                    y1={currentThreshold.f_aic}
                    y2={currentThreshold.f_crit}
                    fill="#d97706"
                    fillOpacity={0.12}
                  />
                )}
                {isAicTab && (
                  <ReferenceLine
                    y={currentThreshold.f_aic}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    strokeWidth={1.8}
                  />
                )}
                <ReferenceLine
                  y={currentThreshold.f_crit}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                />
                <ReferenceLine
                  x={String(selectedB)}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: `b = ${selectedB}`, fill: '#eab308', position: 'top', fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="f_band"
                  stroke="none"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  name="IQR (q25–q75) Y₂ → Y₁"
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="f_median_y21"
                  name="Median F (Y₂ → Y₁, real effect b)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="f_median_null"
                  name="Median F (Y₁ → Y₂, no real effect)"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#94a3b8' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>}

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            {isNewDataTab
              ? 'B. Training rules: how often each one adds Y₂ (Y₂ → Y₁)'
              : isAicTab
                ? 'B. How often Granger rejects vs how often AIC adds Y₂ (Y₂ → Y₁)'
                : 'B. How often the Granger test rejects (Y₂ → Y₁)'}
          </div>
          {isNewDataTab && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Red: Granger rejects. Amber: AIC adds Y₂. The space between them is the gap that chart C measures.
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simChartData} margin={{ top: 20, right: 25, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="bLabel" type="category" tick={{ fill: 'var(--text-muted)' }} />
                <YAxis
                  domain={[0, 1]}
                  tick={{ fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                  formatter={(val, name) => {
                    if (Array.isArray(val)) {
                      const width = Math.abs(Number(val[1]) - Number(val[0]));
                      return [`${(width * 100).toFixed(1)} percentage points`, name];
                    }
                    return [`${(Number(val) * 100).toFixed(1)}%`, name];
                  }}
                  labelFormatter={(l) => `Cross-effect b = ${l}`}
                />
                <Legend verticalAlign="top" height={32} />
                <ReferenceLine
                  x={String(selectedB)}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: `b = ${selectedB}`, fill: '#eab308', position: 'top', fontSize: 11 }}
                />
                {isAicTab && (
                  <Area
                    type="monotone"
                    dataKey="gap_band"
                    fill="#d97706"
                    fillOpacity={0.18}
                    stroke="none"
                    name="Gap: AIC includes, Granger does not"
                    isAnimationActive={false}
                  />
                )}
                {isAicTab && (
                  <Line
                    type="monotone"
                    dataKey="aic_include_rate"
                    name="AIC includes Y₂ (ΔAIC < 0)"
                    stroke="#d97706"
                    strokeWidth={2.2}
                    dot={{ r: 3, fill: '#d97706' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="granger_reject_rate"
                  name="Granger rejection rate (p < 0.05)"
                  stroke="#dc2626"
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: '#dc2626' }}
                />
                {!isNewDataTab && (
                <Line
                  type="monotone"
                  dataKey="null_granger_reject_rate"
                  name="False-alarm rate (Y₁ → Y₂, no real effect)"
                  stroke="#94a3b8"
                  strokeWidth={1.6}
                  strokeDasharray="3 3"
                  dot={false}
                />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        {isNewDataTab && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.2rem' }}>
              C. Gap datasets on new data: how often the error falls, and by how much (Y₂ → Y₁)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Only datasets where AIC adds Y₂ but Granger does not reject (&ldquo;AIC yes, Granger no&rdquo;). Left axis: share with lower new-data error (teal). Right axis: typical error change (0% = no change, negative = Y₂ better).
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simChartData} margin={{ top: 20, right: 25, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="bLabel" type="category" tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis
                    yAxisId="share"
                    domain={[0, 1]}
                    tick={{ fill: 'var(--text-muted)' }}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    yAxisId="change"
                    orientation="right"
                    tick={{ fill: 'var(--text-muted)' }}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                    formatter={(val, name) => [`${(Number(val) * 100).toFixed(1)}%`, name]}
                    labelFormatter={(l) => `Cross-effect b = ${l}`}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine
                    yAxisId="share"
                    x={String(selectedB)}
                    stroke="#eab308"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                  <ReferenceLine yAxisId="share" y={0.5} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'break-even', fill: 'var(--text-muted)', fontSize: 10, position: 'insideTopRight' }} />
                  <ReferenceLine yAxisId="change" y={0} stroke="#1d4ed8" strokeDasharray="3 3" />
                  <Line
                    yAxisId="share"
                    type="monotone"
                    dataKey="gap_wins"
                    name="Gap: forecast improves on new data"
                    stroke="#0f766e"
                    strokeWidth={2.2}
                    dot={{ r: 3, fill: '#0f766e' }}
                    connectNulls={false}
                  />
                  <Line
                    yAxisId="change"
                    type="monotone"
                    dataKey="gap_change"
                    name="Gap: typical error change"
                    stroke="#1d4ed8"
                    strokeWidth={2.2}
                    strokeDasharray="5 3"
                    dot={{ r: 3, fill: '#1d4ed8' }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    ) : null;

    return (
      <Layout
        title="5.4 Granger Causality: Does Y₂ Help Forecast Y₁?"
        commentary={
          <div>
            {commentaryTabs}
            {commentaryBody}
          </div>
        }
        dataset={datasetSection}
        controls={isTab2 || isMacroTab ? null : controlsSection}
        controlsPosition="aboveExtraCard"
        extraCardTitle={isTab2 ? null : extraCardTitle}
        extraCard={isTab2 ? null : extraCardContent}
        chartHeight={tabGrangerMode === 'sim' ? '760px' : '480px'}
        chart={isTab2 || isMacroTab ? null : chartSection}
      />
    );
  }

  // =========================================================================
  // SUBTAB 5.3: Problems with VARMA
  // =========================================================================
  if (activeTab === 3) {
    const tUniq = data.tab_uniqueness || {};
    const uniq = tUniq.uniqueness || {};
    const est = tUniq.estimation || {};
    const A0 = uniq.A0 || [[0.5, 0.2], [0.1, 0.4]];
    const origin = uniq.origin ?? 60;
    const n = uniq.n || (uniq.timeline || []).length || 80;
    const lam = uniq.models?.[tabUniqLambda] ? tabUniqLambda : (uniq.default_lambda || '0.30');
    const model = uniq.models?.[lam] || {
      lambda: 0.3,
      A1: [[0.8, 0.2], [0.1, 0.7]],
      A2: [[-0.15, -0.06], [-0.03, -0.12]],
      M1: [[-0.3, 0], [0, -0.3]],
      max_mean_diff: 0,
    };
    const approx = est.approximation || { timeline: [], rmse: {}, A: A0, M: [[0, 0], [0, 0]] };
    const fmtN = (v, d = 2) => {
      const nVal = Number(v ?? 0);
      if (!Number.isFinite(nVal) || Math.abs(nVal) < 5e-4) return (0).toFixed(d);
      return nVal.toFixed(d);
    };
    const zeros = [[0, 0], [0, 0]];
    const matTex = (M) => {
      const a = (r, c) => fmtN(M?.[r]?.[c]);
      return `\\begin{bmatrix} ${a(0, 0)} \\hspace{0.85em} & \\hspace{0.85em} ${a(0, 1)} \\\\[0.55em] ${a(1, 0)} \\hspace{0.85em} & \\hspace{0.85em} ${a(1, 1)} \\end{bmatrix}`;
    };
    const stackTex = (A1, A2, M1) => (
      `\\begin{aligned} \\mathbf{A}_1 &= ${matTex(A1)} \\\\[0.8em] \\mathbf{A}_2 &= ${matTex(A2)} \\\\[0.8em] \\mathbf{M}_1 &= ${matTex(M1)} \\end{aligned}`
    );

    const commentaryTabs = (
      <div className="tabs" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { id: 1, label: 'Uniqueness problem' },
          { id: 2, label: 'Estimation complexity' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tabUniqTab === t.id ? 'active' : ''}`}
            onClick={() => setTabUniqTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    const uniquenessCommentary = (
      <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          <strong>How a VAR(1) is written:</strong> the series is generated as <MathText tex="\mathbf{y}_t = \mathbf{A}_0 \mathbf{y}_{t-1} + \boldsymbol{\varepsilon}_t" />. One lag of the values, no lagged shocks — the green model.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>How the VARMA(2,1) is formed:</strong> take that same equation and subtract <MathText tex="\lambda" /> times last period’s equation (the slider is <MathText tex="\lambda" />). In lag-operator form this is multiplying both sides by <MathText tex="(\mathbf{I} - \lambda L)" />:
        </p>
        <div style={{ background: 'var(--primary-bg)', padding: '0.7rem', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <MathText tex="\mathbf{y}_t - \lambda \mathbf{y}_{t-1} = \mathbf{A}_0 \mathbf{y}_{t-1} - \lambda \mathbf{A}_0 \mathbf{y}_{t-2} + \boldsymbol{\varepsilon}_t - \lambda \boldsymbol{\varepsilon}_{t-1}" />
          <MathText tex={`\\mathbf{y}_t = (\\mathbf{A}_0+${fmtN(model.lambda)}\\mathbf{I})\\mathbf{y}_{t-1} - ${fmtN(model.lambda)}\\mathbf{A}_0\\mathbf{y}_{t-2} + \\boldsymbol{\\varepsilon}_t - ${fmtN(model.lambda)}\\boldsymbol{\\varepsilon}_{t-1}`} />
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          That expanded line is a <ModelOrder name="VARMA">2, 1</ModelOrder>: two lags of <MathText tex="y" /> plus one lag of <MathText tex="\varepsilon" />. It is not a new process — only an extra writing of the original VAR. Change <MathText tex="\lambda" /> and Model 2’s matrices change; the green and red paths stay on top of each other.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>What these matrices mean:</strong> Model 1 has <MathText tex="\mathbf{A}_1 = \mathbf{A}_0" /> and <MathText tex="\mathbf{A}_2 = \mathbf{M}_1 = \mathbf{0}" />. Model 2 has <MathText tex={`\\mathbf{A}_1 = \\mathbf{A}_0 + ${fmtN(model.lambda)}\\mathbf{I}`} />, <MathText tex={`\\mathbf{A}_2 = -${fmtN(model.lambda)}\\mathbf{A}_0`} />, and <MathText tex={`\\mathbf{M}_1 = -${fmtN(model.lambda)}\\mathbf{I}`} />. Those extra entries come from the <MathText tex="(\mathbf{I} - \lambda L)" /> multiplication, not from extra dynamics.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>Why the coefficients cannot be read as in 5.2:</strong> in 5.2 each entry is a real weight. Here Model 1 has <MathText tex={`a_{11}=${fmtN(A0[0][0])}`} /> and no shock memory. Model 2 has <MathText tex={`a_{11}=${fmtN(model.A1?.[0]?.[0])}`} /> and <MathText tex={`m_{11}=${fmtN(model.M1?.[0]?.[0])}`} />. Reading Model 2 the 5.2 way would say Y₁ is more persistent and has MA memory. Neither is true of the generating process — those extras cancelled by construction. Forecasts still match, so the graph will not warn you.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>How to read the charts:</strong> both writings produce the same conditional mean (solid) and the same forecast after t = {origin} (dashed). Overlay is the point: two different <MathText tex="(\mathbf{A}, \mathbf{M})" /> pairs, one series.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>The uniqueness constraint:</strong> keep only one writing. Either set <MathText tex="q = 0" /> (a VAR), or require the MA part to be invertible and share no extra lag factor with the AR part. Then <MathText tex="\mathbf{A}" /> and <MathText tex="\mathbf{M}" /> are unique, so 5.2-style reading is valid. If the truth really needs shock memory, a short VAR may need extra lags of <MathText tex="y" /> to stand in for it — that is the next tab.
        </p>
      </div>
    );

    const estimationCommentary = (
      <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          <strong>What the extra lag is:</strong> <MathText tex="\lambda" /> is not a new parameter of the data. It is the slider from the uniqueness tab — how strongly an extra lag was multiplied onto a VAR(1) to write it as <ModelOrder name="VARMA">2, 1</ModelOrder>. Every <MathText tex="\lambda" /> describes the same series, so they all leave the same residuals.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>How to read the fit plot:</strong> log-likelihood is how well a writing fits the sample. Against <MathText tex="\lambda" /> the unconstrained VARMA is a flat red line: every equivalent writing fits equally, so there is no unique maximum. The green curve drops the matching MA term and estimates a VAR forced through <MathText tex="\mathbf{A}_0+\lambda \mathbf{I}" />; only <MathText tex="\lambda=0" /> (the true VAR) fits, so OLS has a unique peak.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>How a VAR approximates VARMA:</strong> an invertible VARMA can be rewritten as a VAR(<MathText tex="\infty" />): extra lags of <MathText tex="y" /> stand in for <MathText tex="\mathbf{M}\boldsymbol{\varepsilon}_{t-1}" />. That substitution is used at each date to predict the next observation from realized lags — a one-step forecast.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>How to read the one-step chart:</strong> a different series whose generating process is <ModelOrder name="VARMA">1, 1</ModelOrder>, as in 5.2. Purple is that true one-step mean. Red <ModelOrder name="VAR">1</ModelOrder> and green <ModelOrder name="VAR">4</ModelOrder> are OLS-fitted on the first {approx.origin} points. Extra lags should pull green closer to purple.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>Why VAR(1) can win multi-step:</strong> iterate from a fixed origin and a VARMA forecast sets future shocks to 0 after the first step, so later horizons are mostly AR decay. Extra lags that stand in for shock memory at <MathText tex="h = 1" /> then add little — and can drift. In this generating process a short <ModelOrder name="VAR">1</ModelOrder> tracks that decay more closely than <ModelOrder name="VAR">4</ModelOrder>.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <strong>Why later tabs use VAR:</strong> set <MathText tex="q = 0" /> and keep enough lags. Coefficients from OLS are unique, and one-step predictions track the VARMA mean without estimating <MathText tex="\mathbf{M}" />. Later tabs do this on differenced macros. The cost is more lags than a short VARMA, which is why <ModelOrder name="VAR">1</ModelOrder> loses to <ModelOrder name="VAR">4</ModelOrder> on the one-step chart here.
        </p>
      </div>
    );

    const uniquenessDataset = (
      <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
        Synthetic bivariate <ModelOrder name="VAR">1</ModelOrder> ({n} observations) from <MathText tex="\mathbf{A}_0" />. Model 2 is that same series rewritten as <ModelOrder name="VARMA">2, 1</ModelOrder> by subtracting <MathText tex={`\\lambda=${fmtN(model.lambda)}`} /> times last period’s equation. Green and red means (and the dashed forecasts after t = {origin}) match (max gap {fmtN(model.max_mean_diff, 4)}).
      </p>
    );

    const estimationDataset = tabUniqEstView === 'ridge' ? (
      <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
        Same uniqueness sample, times 2 to {origin - 1}. Horizontal axis is <MathText tex="\lambda" /> from the uniqueness tab. Higher log-likelihood means a better fit to that sample.
      </p>
    ) : (
      <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
        A different series whose data-generating process <em>is</em> <ModelOrder name="VARMA">1, 1</ModelOrder> ({approx.n} observations), like 5.2. <ModelOrder name="VAR">1</ModelOrder> and <ModelOrder name="VAR">4</ModelOrder> are OLS-fitted on the first {approx.origin} points. The graph is one-step (actual lagged <MathText tex="y" />).
      </p>
    );

    const uniquenessChartData = (uniq.timeline || []).map((row) => ({
      time: row.t,
      y1: row.y1,
      y2: row.y2,
      var_mean1: row.var_mean1,
      var_mean2: row.var_mean2,
      varma_mean1: row[`varma_${lam}_mean1`],
      varma_mean2: row[`varma_${lam}_mean2`],
      var_fcst1: row.var_fcst1,
      var_fcst2: row.var_fcst2,
      varma_fcst1: row[`varma_${lam}_fcst1`],
      varma_fcst2: row[`varma_${lam}_fcst2`],
    }));

    const makeUniqPanel = (title, actualKey, varMean, varmaMean, varFcst, varmaFcst, stroke) => ({
      title,
      content: (zoomDomain) => (
        <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
          <LineChart syncId="tab3UniqSync" data={uniquenessChartData} margin={{ top: 28, right: 20, left: 10, bottom: 8 }} style={{ pointerEvents: 'auto' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
            <Legend verticalAlign="top" height={32} />
            <ReferenceLine x={origin} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Forecast origin', fill: '#eab308', fontSize: 11, position: 'insideTopLeft' }} />
            <Line type="monotone" dataKey={actualKey} name="Actual" stroke={stroke} strokeWidth={2.2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={varMean} name="VAR(1) mean" stroke="#16a34a" strokeWidth={2.4} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={varmaMean} name="VARMA(2,1) mean" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={varFcst} name="VAR(1) forecast" stroke="#16a34a" strokeWidth={2.4} strokeDasharray="4 3" dot={{ r: 2.5 }} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={varmaFcst} name="VARMA(2,1) forecast" stroke="#ef4444" strokeWidth={2} strokeDasharray="2 3" dot={{ r: 2.5 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    });

    const approxChartData = (approx.timeline || []).map((row) => ({
      time: row.t,
      y1: row.y1,
      y2: row.y2,
      varma_mean1: row.varma_mean1,
      varma_mean2: row.varma_mean2,
      var1_mean1: row.var1_mean1,
      var1_mean2: row.var1_mean2,
      var4_mean1: row.var4_mean1,
      var4_mean2: row.var4_mean2,
    }));

    const makeApproxPanel = (title, actualKey, varmaKey, var1Key, var4Key, stroke) => ({
      title,
      content: (zoomDomain) => (
        <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
          <LineChart syncId="tab3EstSync" data={approxChartData} margin={{ top: 28, right: 20, left: 10, bottom: 8 }} style={{ pointerEvents: 'auto' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine x={approx.origin} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Fit / holdout split', fill: '#eab308', fontSize: 11, position: 'insideTopLeft' }} />
            <Line type="monotone" dataKey={actualKey} name="Actual" stroke={stroke} strokeWidth={1.6} strokeOpacity={0.45} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={varmaKey} name="VARMA(1,1) one-step mean" stroke="#7c3aed" strokeWidth={2.4} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={var1Key} name="VAR(1) one-step" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={var4Key} name="VAR(4) one-step" stroke="#16a34a" strokeWidth={2.2} strokeDasharray="2 3" dot={false} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    });

    return (
      <Layout
        title="5.3 Problems with VARMA"
        commentary={
          <div>
            {commentaryTabs}
            {tabUniqTab === 1 ? uniquenessCommentary : estimationCommentary}
          </div>
        }
        dataset={tabUniqTab === 1 ? uniquenessDataset : estimationDataset}
        extraCardTitle={tabUniqTab === 1 ? 'Two writings of the same series' : (tabUniqEstView === 'ridge' ? 'Same fit, different matrices' : 'One-step distance to VARMA')}
        extraCard={
          tabUniqTab === 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
              <div style={{ background: 'var(--primary-bg)', padding: '0.9rem 1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.7rem', color: '#16a34a' }}>Model 1 — VAR(1)</div>
                <div style={{ fontSize: '1.05rem' }}>
                  <MathText displayMode tex={stackTex(A0, zeros, zeros)} />
                </div>
              </div>
              <div style={{ background: 'var(--primary-bg)', padding: '0.9rem 1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.7rem', color: '#ef4444' }}>
                  Model 2 — VARMA(2,1), <MathText tex={`\\lambda=${fmtN(model.lambda)}`} />
                </div>
                <div style={{ fontSize: '1.05rem' }}>
                  <MathText displayMode tex={stackTex(model.A1, model.A2, model.M1)} />
                </div>
              </div>
            </div>
          ) : (
            tabUniqEstView === 'approx' ? (
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.55 }}>
                Holdout one-step RMSE versus the true VARMA mean — VAR(1) {fmtN(approx.dist_to_varma?.var1, 3)}, VAR(4) <strong style={{ color: '#16a34a' }}>{fmtN(approx.dist_to_varma?.var4, 3)}</strong>.
              </p>
            ) : (
            <table style={comparisonTableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderCellStyle}>How we estimate</th>
                  <th style={tableHeaderCellStyle}>Extra factor kept</th>
                  <th style={tableHeaderCellStyle}>Fit (log-likelihood)</th>
                  <th style={tableHeaderCellStyle}>Unique A₁?</th>
                </tr>
              </thead>
              <tbody>
                {(est.starts || []).map((s) => (
                  <tr key={s.id}>
                    <td style={tableCellStyle}>{s.label}</td>
                    <td style={tableCellStyle}>{fmtN(s.end_lambda)}</td>
                    <td style={tableCellStyle}>{fmtN(s.ll, 2)}</td>
                    <td style={{ ...tableCellStyle, color: s.unique ? '#16a34a' : '#ef4444', fontWeight: 700, borderBottom: s.id === 'var_ols' ? 'none' : tableCellStyle.borderBottom }}>
                      {s.unique ? 'Yes' : 'No — same fit as the other VARMA start'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )
          )
        }
        controls={
          tabUniqTab === 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Extra lag factor <MathText tex="\lambda" />:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {Object.keys(uniq.models || { '0.15': 1, '0.30': 1, '0.45': 1 }).map((key) => (
                  <button
                    key={key}
                    onClick={() => setTabUniqLambda(key)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: lam === key ? 'var(--primary)' : 'var(--surface)',
                      color: lam === key ? '#fff' : 'var(--text-main)',
                      fontWeight: lam === key ? 700 : 400,
                    }}
                  >
                    <MathText tex={`\\lambda = ${key}`} />
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Larger <MathText tex="\lambda" /> makes Model 2 look more different. Forecasts stay the same.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chart:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[
                  { id: 'ridge', label: 'Fit vs λ' },
                  { id: 'approx', label: 'One-step: VAR vs VARMA' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTabUniqEstView(opt.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: tabUniqEstView === opt.id ? 'var(--primary)' : 'var(--surface)',
                      color: tabUniqEstView === opt.id ? '#fff' : 'var(--text-main)',
                      fontWeight: tabUniqEstView === opt.id ? 700 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {tabUniqEstView === 'approx' && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Holdout distance to VARMA mean — VAR(1) {fmtN(approx.dist_to_varma?.var1, 3)}, VAR(4) {fmtN(approx.dist_to_varma?.var4, 3)}
                </span>
              )}
            </div>
          )
        }
        chartHeight="680px"
        chart={
          tabUniqTab === 1 ? (
            <SyncedDualChart
              defaultDomain={[0, n - 1]}
              minTime={0}
              maxTime={n - 1}
              minRange={8}
              top={makeUniqPanel('Y₁', 'y1', 'var_mean1', 'varma_mean1', 'var_fcst1', 'varma_fcst1', '#2563eb')}
              bottom={makeUniqPanel('Y₂', 'y2', 'var_mean2', 'varma_mean2', 'var_fcst2', 'varma_fcst2', '#10b981')}
            />
          ) : tabUniqEstView === 'ridge' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={est.ridge_points || []} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="lambda" tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => `λ=${v}`} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                  formatter={(val, name) => [Number(val).toFixed(2), name]}
                  labelFormatter={(v) => `λ = ${v}`}
                />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine x={0} stroke="rgba(107, 114, 128, 0.6)" strokeDasharray="3 3" label={{ value: 'true VAR (λ = 0)', fill: 'var(--text-muted)', fontSize: 11 }} />
                <Line type="monotone" dataKey="varma_ll" name="Equivalent VARMA writings (same fit)" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="constrained_var_ll" name="VAR without the matching MA (only λ = 0 fits)" stroke="#16a34a" strokeWidth={2.4} strokeDasharray="4 3" dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <SyncedDualChart
              defaultDomain={[Math.max(0, (approx.origin || 120) - 25), (approx.n || 140) - 1]}
              minTime={0}
              maxTime={(approx.n || 140) - 1}
              minRange={12}
              top={makeApproxPanel('Y₁', 'y1', 'varma_mean1', 'var1_mean1', 'var4_mean1', '#2563eb')}
              bottom={makeApproxPanel('Y₂', 'y2', 'varma_mean2', 'var1_mean2', 'var4_mean2', '#10b981')}
            />
          )
        }
      />
    );
  }



  // =========================================================================
  // SUBTAB 5.5: Walk-Forward Validation & Horizon Advantage
  // =========================================================================
if (activeTab === 5) {
    const t4Data = data.tab4;
    const currentSummary = t4Data.horizons_summary[String(tab4Horizon)];
    const windows = t4Data.windows_by_horizon[String(tab4Horizon)] || [];
    const selectedDetails = t4Data.selected_window_details || {};

    const validOrigins = windows.map((w) => w.train_end);
    const activeOrigin = validOrigins.includes(tab4SelectedOrigin)
      ? tab4SelectedOrigin
      : (validOrigins[validOrigins.length - 1] || '2004Q4');

    const seriesLabels = {
      realgdp: 'Real GDP',
      realcons: 'Personal Consumption',
      realdpi: 'Disposable Income',
    };

    const windowRatioData = windows.map((w) => {
      const score = w.scores[tab4Series]?.rmse_ratio || 1.0;
      const startYear = w.test_start.slice(0, 4);
      const endYear = w.test_end.slice(2, 4);
      return {
        trainEnd: w.train_end,
        target: `${w.test_start}-${w.test_end}`,
        testWindow: `${startYear}-${endYear}`,
        ratio: Number(score.toFixed(3)),
        wins: score < 1.0,
      };
    });

    const activeSummary = currentSummary[tab4Series] || {};
    const summary8 = t4Data.horizons_summary['8']?.[tab4Series] || {};
    const summary12 = t4Data.horizons_summary['12']?.[tab4Series] || {};
    const summary16 = t4Data.horizons_summary['16']?.[tab4Series] || {};
    const summary16BySeries = {
      realgdp: t4Data.horizons_summary['16']?.realgdp || {},
      realcons: t4Data.horizons_summary['16']?.realcons || {},
      realdpi: t4Data.horizons_summary['16']?.realdpi || {},
    };
    const formatHorizon16Line = (key) => {
      const s = summary16BySeries[key] || {};
      if (!s.rmse_ratio || s.window_win_rate === undefined) return null;
      const winPct = (s.window_win_rate * 100).toFixed(1);
      const ratio = s.rmse_ratio.toFixed(2);
      const errRed = ((1 - s.rmse_ratio) * 100).toFixed(0);
      return (
        <>
          &bull; {seriesLabels[key]}: <strong>{winPct}% win rate</strong> ({ratio} error ratio &mdash; {errRed}% error reduction)
        </>
      );
    };

    const rawTrajectory = (selectedDetails[activeOrigin] && selectedDetails[activeOrigin][tab4Series]) || [];
    const windowDetailSeriesData = rawTrajectory.slice(0, tab4Horizon).map((pt, idx) => ({ ...pt, time: idx }));

    const currentWindowObj = windows.find((w) => w.train_end === activeOrigin);
    const currentWindowScore = currentWindowObj?.scores?.[tab4Series];
    const currentWindowLabel = currentWindowObj
      ? `${currentWindowObj.test_start.slice(0, 4)}-${currentWindowObj.test_end.slice(2, 4)} (${currentWindowObj.test_start} to ${currentWindowObj.test_end})`
      : activeOrigin;

    const recessionMarkers = tab4Horizon === 16 ? [
      { x: '1989-92', label: '1990 Oil Shock' },
      { x: '2001-04', label: '2001 Dot-Com' },
      { x: '2005-08', label: '2007-08 Crisis' },
    ] : tab4Horizon === 12 ? [
      { x: '1990-92', label: '1990 Oil Shock' },
      { x: '2001-03', label: '2001 Dot-Com' },
      { x: '2006-08', label: '2007-08 Crisis' },
    ] : [
      { x: '1990-91', label: '1990 Oil Shock' },
      { x: '2001-02', label: '2001 Dot-Com' },
      { x: '2007-08', label: '2007-08 Crisis' },
    ];

    return (
      <Layout
        title="5.5 Out-of-Sample Walk-Forward: Does Joint Feedback Hold Up in the Real World?"
        commentary={
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>From simulation to practice:</strong> Sections 5.1&ndash;5.4 showed how joint feedback works in controlled data. Those demos assumed the cross-series edge would survive on real macro series &mdash; here we test that assumption.
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>The core question:</strong> Does a joint model of Real GDP, Personal Consumption, and Disposable Income beat univariate ARIMA out of sample? A single test split can look good by luck, so we evaluate both models across <strong>24 rolling forecast windows</strong> spanning 1984&ndash;2009.
            </p>

            <div style={{ background: 'var(--primary-bg)', padding: '0.55rem 0.8rem', borderRadius: '6px', fontSize: '0.84rem', lineHeight: 1.5 }}>
              <strong>Expanding-window protocol:</strong> At each annual cutoff (e.g. end of 1984), both models are estimated only on data available up to that date, then project 2&ndash;4 years into unseen quarters. The training sample expands by one year each step; there is no future leakage.
            </div>

            <div style={{ background: 'var(--surface)', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.84rem', lineHeight: 1.5 }}>
              <strong>What each bar shows:</strong> Each bar is an entire multi-year forecast window (not a single quarter). Height is the aggregate error ratio <MathText tex="\text{RMSE}_{\text{VARIMA}} / \text{RMSE}_{\text{ARIMA}}" />. <span style={{ color: '#16a34a', fontWeight: 700 }}>Green (below 1.0)</span> = VARIMA won; <span style={{ color: '#ef4444', fontWeight: 700 }}>Red (above 1.0)</span> = ARIMA won.
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.15rem' }}>
              Performance for <strong>{seriesLabels[tab4Series]}</strong> across forecast horizons:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--surface)', padding: '0.55rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>2 Years Ahead (8Q)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: summary8.rmse_ratio < 1 ? '#16a34a' : '#ef4444' }}>
                  {summary8.rmse_ratio ? summary8.rmse_ratio.toFixed(2) : '—'}
                </div>
                <div style={{ fontSize: '0.72rem', color: summary8.rmse_ratio < 1 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  {summary8.rmse_ratio < 1 ? `${((1 - summary8.rmse_ratio) * 100).toFixed(0)}% lower error` : 'par'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Wins {(summary8.window_win_rate * 100).toFixed(0)}% of windows
                </div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.55rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>3 Years Ahead (12Q)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: summary12.rmse_ratio < 1 ? '#16a34a' : '#ef4444' }}>
                  {summary12.rmse_ratio ? summary12.rmse_ratio.toFixed(2) : '—'}
                </div>
                <div style={{ fontSize: '0.72rem', color: summary12.rmse_ratio < 1 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  {summary12.rmse_ratio < 1 ? `${((1 - summary12.rmse_ratio) * 100).toFixed(0)}% lower error` : 'par'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Wins {(summary12.window_win_rate * 100).toFixed(0)}% of windows
                </div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.55rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>4 Years Ahead (16Q)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: summary16.rmse_ratio < 1 ? '#16a34a' : '#ef4444' }}>
                  {summary16.rmse_ratio ? summary16.rmse_ratio.toFixed(2) : '—'}
                </div>
                <div style={{ fontSize: '0.72rem', color: summary16.rmse_ratio < 1 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                  {summary16.rmse_ratio < 1 ? `${((1 - summary16.rmse_ratio) * 100).toFixed(0)}% lower error` : 'par'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Wins {(summary16.window_win_rate * 100).toFixed(0)}% of windows
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>
              <strong>Longer-horizon advantage:</strong> Over short horizons (1&ndash;4 quarters), local autocorrelation dominates and ARIMA extrapolates recent momentum well. At 4&ndash;16Q horizons, isolated series drift; income &rarr; spending &rarr; GDP feedback keeps the joint system bound, so VARIMA&apos;s relative error keeps falling.
            </p>

            <div style={{ background: 'var(--surface)', borderLeft: '4px solid var(--border)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.84rem', lineHeight: 1.55, border: '1px solid var(--border)' }}>
              <p style={{ margin: 0, marginBottom: '0.45rem' }}>
                <strong>Turning-point vulnerability:</strong> Despite using more series, VARIMA loses to ARIMA at unexpected crises &mdash; notice the red bars at the <strong>1990</strong> oil shock, <strong>2001</strong> dot-com crash, and <strong>2007&ndash;08</strong> Great Recession.
              </p>
              <p style={{ margin: 0, marginBottom: '0.45rem' }}>
                <strong>Echo-chamber risk:</strong> Before a crash, all three series were growing and mutually reinforced each other (higher income &rarr; more spending &rarr; higher GDP). After an unseen external shock, those coupled equations keep projecting expansion and overshoot the downturn.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Why ARIMA is more resilient here:</strong> Univariate ARIMA sees only its own history, so its AR decay dampens toward baseline faster and does not amplify cross-series echo after a break.
              </p>
            </div>

            <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              The next section asks when adding variables hurts rather than helps.
            </p>
          </div>
        }
        dataset={
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
              <div><strong>Dataset:</strong> U.S. Macroeconomic Data (Real GDP, Consumption, DPI), quarterly 1959Q1-2009Q4 (200 quarters).</div>

              <div style={{ background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.81rem', lineHeight: '1.5', border: '1px solid var(--border)' }}>
                <strong>Why We Transform the Data:</strong><br />
                Macroeconomic dollar levels grow over decades and are non-stationary. Fitting models directly on raw levels risks spurious correlations. We difference the logarithms to obtain stationary quarterly percentage growth rates, fit the models on those stable rates, and then convert forecasts back to real dollar levels for evaluation.
              </div>

              <div style={{ background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.81rem', lineHeight: '1.5', border: '1px solid var(--border)' }}>
                <strong>Expanding-Window Evaluation Strategy:</strong><br />
                &bull; <strong>Initial Training:</strong> 100 quarters (1959Q1-1983Q4 = 25 years of data).<br />
                &bull; <strong>Out-of-Sample Horizons:</strong> 8Q (2 yrs), 12Q (3 yrs), and 16Q (4 yrs) ahead into unseen quarters.<br />
                &bull; <strong>Annual Step:</strong> Every Q4, advance the training cutoff by 4 quarters (1 year), retrain models on accumulated history, and repeat across 24 independent test windows.<br />
                &bull; <strong>Why step annually:</strong> Avoids nearly complete quarterly overlap between adjacent 16-quarter forecasts, evaluating 24 clean historical regimes.
              </div>

              <div style={{ background: 'var(--primary-bg)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.81rem', lineHeight: '1.5' }}>
                <strong>16-Quarter Out-of-Sample Performance by Series:</strong><br />
                {formatHorizon16Line('realgdp')}<br />
                {formatHorizon16Line('realcons')}<br />
                {formatHorizon16Line('realdpi')}
              </div>
            </div>
          </div>
        }
        controls={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Forecast Horizon:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[
                  { h: 8, label: '8 Quarters (2 Years)' },
                  { h: 12, label: '12 Quarters (3 Years)' },
                  { h: 16, label: '16 Quarters (4 Years)' },
                ].map((item) => (
                  <button
                    key={item.h}
                    onClick={() => setTab4Horizon(item.h)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: tab4Horizon === item.h ? 'var(--primary)' : 'var(--surface)',
                      color: tab4Horizon === item.h ? '#fff' : 'var(--text-main)',
                      fontWeight: tab4Horizon === item.h ? 700 : 400,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Series:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[
                  { id: 'realgdp', label: 'Real GDP' },
                  { id: 'realcons', label: 'Personal Consumption' },
                  { id: 'realdpi', label: 'Disposable Income' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTab4Series(s.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: tab4Series === s.id ? 'var(--primary)' : 'var(--surface)',
                      color: tab4Series === s.id ? '#fff' : 'var(--text-main)',
                      fontWeight: tab4Series === s.id ? 700 : 400,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        }
        chartHeight="640px"
        chart={
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* TOP PANEL: Bar Chart */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.86rem', fontWeight: 600 }}>
                <span>
                  1. Out-of-Sample Error Ratio by Test Window — {seriesLabels[tab4Series]}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                    (Click any bar to inspect its projection path below)
                  </span>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Horizon: {tab4Horizon} Quarters ({tab4Horizon / 4} Years)
                </span>
              </div>

              <div style={{ height: '190px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={windowRatioData} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="testWindow"
                      tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={35}
                    />
                    <YAxis
                      domain={[0, 'auto']}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                      tickFormatter={(v) => v.toFixed(1)}
                      label={{ value: 'RMSE Ratio (VAR / ARIMA)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10, offset: 5 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                      formatter={(val, _name, item) => [
                        `RMSE Ratio: ${val} (${item.payload.wins ? `✓ VARIMA won by ${((1 - Number(val)) * 100).toFixed(0)}%` : `ARIMA won by ${((Number(val) - 1) * 100).toFixed(0)}%`})`,
                        item.payload.wins ? 'Winner: Joint VARIMA' : 'Winner: Univariate ARIMA',
                      ]}
                      labelFormatter={(l, items) => {
                        const it = items[0]?.payload;
                        return `Test Window: ${it?.target || l} (${tab4Horizon}Q / ${tab4Horizon / 4} Yrs) | Trained through: ${it?.trainEnd || ''} (Click to inspect below)`;
                      }}
                    />
                    <ReferenceLine y={1.0} stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1.5} label={{ position: 'top', value: 'Parity (1.0)', fill: '#dc2626', fontSize: 10 }} />
                    {recessionMarkers.map((m) => (
                      <ReferenceLine key={m.x} x={m.x} stroke="#f59e0b" strokeDasharray="2 2" label={{ position: 'top', value: m.label, fill: '#f59e0b', fontSize: 9 }} />
                    ))}
                    <Bar
                      dataKey="ratio"
                      name="RMSE Ratio"
                      onClick={(entry) => {
                        if (entry && entry.trainEnd) setTab4SelectedOrigin(entry.trainEnd);
                      }}
                    >
                      {windowRatioData.map((entry, index) => {
                        const isSelected = entry.trainEnd === activeOrigin;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.wins ? '#16a34a' : '#ef4444'}
                            stroke={isSelected ? '#2563eb' : (entry.wins ? '#15803d' : '#b91c1c')}
                            strokeWidth={isSelected ? 3 : 1}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setTab4SelectedOrigin(entry.trainEnd)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: '0.35rem', padding: '0.35rem 0.65rem', background: 'var(--primary-bg)', borderRadius: '4px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span>
                  <strong>{seriesLabels[tab4Series]} Overall ({tab4Horizon}Q):</strong> RMSE Ratio = <strong style={{ color: activeSummary.rmse_ratio < 1 ? '#16a34a' : '#ef4444' }}>{activeSummary.rmse_ratio ? activeSummary.rmse_ratio.toFixed(2) : '—'}</strong> ({activeSummary.rmse_ratio < 1 ? `${((1 - activeSummary.rmse_ratio) * 100).toFixed(0)}% lower error` : 'par'})
                </span>
                <span>
                  Win Rate: <strong>{(activeSummary.window_win_rate * 100).toFixed(1)}%</strong> ({windowRatioData.filter(d => d.wins).length} of {windowRatioData.length} windows won)
                </span>
                <span>
                  Average MAPE: VARIMA <strong style={{ color: '#16a34a' }}>{activeSummary.varima_mape?.toFixed(2)}%</strong> vs ARIMA <strong style={{ color: '#ef4444' }}>{activeSummary.arima_mape?.toFixed(2)}%</strong>
                </span>
              </div>
            </div>

            {/* BOTTOM PANEL: Forecast Trajectory */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.86rem', fontWeight: 600 }}>
                <span>
                  2. Detailed Forecast Trajectory: {currentWindowLabel}
                  <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.5rem' }}>
                    [Trained through {activeOrigin}]
                  </span>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {seriesLabels[tab4Series]} • Billions Chained 2005 $ • Step +1 to +{tab4Horizon} ({tab4Horizon / 4} Years)
                </span>
              </div>

              <div style={{ flex: 1, minHeight: '230px', position: 'relative' }}>
                <ZoomableChartShell
                  defaultDomain={[0, Math.max(1, windowDetailSeriesData.length - 1)]}
                  maxTime={Math.max(1, windowDetailSeriesData.length - 1)}
                  data={windowDetailSeriesData}
                  dataKeys={['actual', 'varima_forecast', 'arima_forecast']}
                >
                  {(zoomDomain, computeYDomain, autoYDomain) => (
                    <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                      <LineChart data={windowDetailSeriesData} margin={{ top: 10, right: 20, left: 10, bottom: 15 }} style={{ pointerEvents: 'auto' }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis
                          dataKey="time"
                          type="number"
                          domain={zoomDomain}
                          allowDataOverflow={true}
                          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                          tickFormatter={(i) => windowDetailSeriesData[Math.round(i)]?.target_quarter || ''}
                        />
                        <YAxis
                          domain={autoYDomain}
                          allowDataOverflow={true}
                          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                          formatter={(val) => `$${Number(val).toFixed(1)}B`}
                          labelFormatter={(i) => `Quarter: ${windowDetailSeriesData[Math.round(i)]?.target_quarter || ''} (Step +${windowDetailSeriesData[Math.round(i)]?.step || ''})`}
                        />
                        <Legend verticalAlign="top" height={28} />
                        <Line type="monotone" dataKey="actual" name="Actual Level" stroke="#334155" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="varima_forecast" name="VARIMA Path" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="arima_forecast" name="ARIMA Path" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ZoomableChartShell>
              </div>

              {currentWindowScore && (() => {
                const varimaWinLabel = currentWindowScore.varima_rmse != null
                  ? `$${Number(currentWindowScore.varima_rmse).toFixed(1)}B`
                  : 'n/a';
                const arimaWinLabel = currentWindowScore.arima_rmse != null
                  ? `$${Number(currentWindowScore.arima_rmse).toFixed(1)}B`
                  : 'n/a';
                const ratioLabel = currentWindowScore.rmse_ratio != null
                  ? Number(currentWindowScore.rmse_ratio).toFixed(2)
                  : 'n/a';
                const wonByLabel = currentWindowScore.rmse_ratio == null
                  ? ''
                  : currentWindowScore.rmse_ratio < 1
                    ? `VARIMA won by ${((1 - currentWindowScore.rmse_ratio) * 100).toFixed(0)}%`
                    : `ARIMA won by ${((currentWindowScore.rmse_ratio - 1) * 100).toFixed(0)}%`;
                return (
                <div style={{ marginTop: '0.35rem', padding: '0.35rem 0.65rem', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span>
                    <strong>Selected Window Evaluation:</strong> VARIMA RMSE = <strong>{varimaWinLabel}</strong> vs ARIMA RMSE = <strong>{arimaWinLabel}</strong>
                  </span>
                  <span>
                    Window Error Ratio = <strong style={{ color: currentWindowScore.rmse_ratio < 1 ? '#16a34a' : '#ef4444' }}>{ratioLabel}</strong>
                    {wonByLabel && (
                      <span style={{ marginLeft: '0.3rem', fontWeight: 600, color: currentWindowScore.rmse_ratio < 1 ? '#16a34a' : '#ef4444' }}>
                        ({wonByLabel})
                      </span>
                    )}
                  </span>
                </div>
                );
              })()}
            </div>
          </div>
        }
      />
    );
  }

  // =========================================================================
  // SUBTAB 5.6: Curse of Dimensionality
  // =========================================================================
  if (activeTab === 6) {
    const t6Data = data.tab6 || {};
    const curseDemo = t6Data.curse_demo || {};
    const dgpInfo = curseDemo.dgp_info || { train_size: 90, test_size: 20, total_size: 110, p_lag: 2 };
    const timeline = curseDemo.timeline || [];
    const metricsByK = curseDemo.metrics_by_k || {};
    const curveData = curseDemo.curve_data || [];

    const activeMetrics = metricsByK[String(tab6K)] || {
      k: tab6K,
      p: 2,
      params: (tab6K ** 2) * 2 + tab6K,
      coeff_params: (tab6K ** 2) * 2,
      intercept_params: tab6K,
      obs_per_param: 1.0,
      in_rmse: 0.8,
      out_rmse: 1.0,
      out_mae: 0.8,
      error_delta_pct: 0,
      verdict: 'Active Model',
      verdict_type: 'optimal',
    };

    const m1 = metricsByK['1'] || { in_rmse: 0.932, out_rmse: 1.095 };
    const m2 = metricsByK['2'] || { in_rmse: 0.805, out_rmse: 0.935 };
    const m6 = metricsByK['6'] || { in_rmse: 0.729, out_rmse: 1.111, error_delta_pct: 18.8 };
    const k2GainPct = (((m1.out_rmse - m2.out_rmse) / m1.out_rmse) * 100).toFixed(1);
    const m6LossPct = (((m6.out_rmse - m1.out_rmse) / m1.out_rmse) * 100).toFixed(1);
    const y2Granger = (curseDemo.granger_filter || []).find((g) => g.variable === 'Y2') || {};
    const y2FStat = y2Granger.f_stat;
    const y2PVal = y2Granger.p_val;

    const splitIndex = dgpInfo.train_size - 1; // 89 (t=90)
    const activeFcKey = `fc_k${tab6K}`;

    // Verdict styling
    const verdictBadgeStyle =
      activeMetrics.verdict_type === 'optimal'
        ? { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', border: '#16a34a' }
        : activeMetrics.verdict_type === 'underfit'
        ? { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b' }
        : { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444' };

    const commentaryTabs = (
      <div className="tabs" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { id: 1, label: '1. Curse of Dimensionality & Overfitting' },
          { id: 2, label: '2. Demo Walkthrough (K = 1 to 6)' },
          { id: 3, label: '3. Granger Causality & Guardrails' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tab6CommentaryTab === t.id ? 'active' : ''}`}
            onClick={() => setTab6CommentaryTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    const commentaryContent = (() => {
      if (tab6CommentaryTab === 1) {
        return (
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Assumption from 5.5:</strong> Walk-forward showed joint feedback can help &mdash; but only when the extra series carry real signal. What happens when we keep adding variables that do not?
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Curse of dimensionality:</strong> In a univariate model, one more lag adds one parameter. In a VAR with <MathText tex="K" /> variables and lag order <MathText tex="p" />, every equation includes lags of every variable, so the count grows as:
            </p>
            <div style={{ background: 'var(--primary-bg)', padding: '0.55rem', borderRadius: '6px', textAlign: 'center', fontSize: '1.05rem' }}>
              <MathText tex="K^2 p + K" />
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>Concrete scale:</strong> At fixed <MathText tex="p = 2" />, <MathText tex="K = 1" /> needs 3 parameters while <MathText tex="K = 6" /> needs 78. With <MathText tex="T = 90" /> training quarters that is about 1.2 observations per parameter &mdash; enough flexibility to memorize noise. Training RMSE falls from {m1.in_rmse.toFixed(3)} to {m6.in_rmse.toFixed(3)}, but holdout accuracy collapses once those quirks fail to repeat.
            </p>
          </div>
        );
      }
      if (tab6CommentaryTab === 2) {
        return (
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>What the Demo Compares:</strong> We forecast target series <MathText tex="Y_1" /> across 20 unseen holdout steps (<MathText tex="t = 91 \dots 110" />) under expanding system sizes:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--surface)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong><MathText tex="K = 1" /> (Univariate Baseline):</strong> Ignores the true driver <MathText tex="Y_2" />. It underfits, yielding holdout RMSE = <strong>{m1.out_rmse.toFixed(3)}</strong>.
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong><MathText tex="K = 2" /> (Optimal Sweet Spot):</strong> Captures the true structural feedback from <MathText tex="Y_2" /> with only 10 parameters. Holdout RMSE drops to <strong>{m2.out_rmse.toFixed(3)}</strong> (a {k2GainPct}% improvement over baseline).
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong><MathText tex="K = 3 \dots 5" /> (Degrading):</strong> Adding noise series (<MathText tex="Y_3 \dots Y_5" />) increases parameters to 21, 36, and 55. They still beat ARIMA because <MathText tex="Y_2" /> provides a strong signal buffer, but accuracy progressively deteriorates.
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong><MathText tex="K = 6" /> (Severe Overfitting):</strong> At 78 parameters, noise completely overwhelms the signal. Holdout RMSE spikes to <strong>{m6.out_rmse.toFixed(3)}</strong> (+{m6LossPct}% worse than simple univariate ARIMA!).
              </div>
            </div>
          </div>
        );
      }
      return (
        <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            <strong>Granger Causality as the Pre-Estimation Filter:</strong> In Section 5.4, Granger causality tested whether the past of a candidate series provides genuine predictive information for <MathText tex="Y_1" />, beyond <MathText tex="Y_1" />&rsquo;s own history. Instead of blindly adding variables and suffering quadratic parameter explosion, forecasters use pairwise Granger tests as a pre-estimation gatekeeper.
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong>Screening Candidates on Training Data:</strong> We test each candidate predictor against target <MathText tex="Y_1" /> on the training sample (<MathText tex="T = 90" />, <MathText tex="p = 2" />) at significance level <MathText tex="\alpha = 0.05" />:
          </p>
          <div style={{ background: 'var(--surface)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--primary-bg)' }}>
                  <th style={{ padding: '0.3rem 0.6rem' }}>Candidate</th>
                  <th style={{ padding: '0.3rem 0.6rem' }}>Role</th>
                  <th style={{ padding: '0.3rem 0.6rem' }}><MathText tex="F" />-Statistic</th>
                  <th style={{ padding: '0.3rem 0.6rem' }}><MathText tex="p" />-Value</th>
                  <th style={{ padding: '0.3rem 0.6rem' }}>Decision (<MathText tex="\alpha = 0.05" />)</th>
                </tr>
              </thead>
              <tbody>
                {(curseDemo.granger_filter || []).map((g) => (
                  <tr key={g.variable} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.3rem 0.6rem', fontWeight: 600 }}>
                      <MathText tex={`${g.variable} \\to Y_1`} />
                    </td>
                    <td style={{ padding: '0.3rem 0.6rem', color: g.action === 'keep' ? '#16a34a' : 'var(--text-muted)' }}>
                      {g.role}
                    </td>
                    <td style={{ padding: '0.3rem 0.6rem' }}>
                      {g.f_stat.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.3rem 0.6rem' }}>
                      {g.p_val < 0.001 ? <MathText tex="p < 0.001" /> : <MathText tex={`p = ${g.p_val.toFixed(3)}`} />}
                    </td>
                    <td style={{ padding: '0.3rem 0.6rem', fontWeight: 600, color: g.action === 'keep' ? '#16a34a' : '#ef4444' }}>
                      {g.action === 'keep' ? 'Include in VAR' : 'Exclude (Noise)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong>Why screening helps:</strong> The test rejects <MathText tex="H_0" /> for <MathText tex="Y_2 \to Y_1" />
            {y2FStat !== undefined ? (
              <> (<MathText tex={`F = ${Number(y2FStat).toFixed(2)}`} />{y2PVal !== undefined && y2PVal < 0.001 ? <>, <MathText tex="p < 0.001" /></> : null})</>
            ) : null}
            , confirming genuine predictive value. Distractors <MathText tex="Y_3 \dots Y_6" /> all fail to clear <MathText tex="p > 0.05" />. Granger screening stops expansion before overfitting begins, keeping the {k2GainPct}% gain at <MathText tex="K = 2" /> instead of the 78-parameter trap.
          </p>
          <div style={{ background: 'var(--surface)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem', marginTop: '0.1rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Additional Guardrails (Beyond Statistical Tests):</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>
                <strong>Observation Budget:</strong> Demand at least 10 historical time periods per estimated parameter (<MathText tex="T \ge 10(K^2 p + K)" />). At <MathText tex="K = 6" />, 78 parameters require <MathText tex="T \ge 780" /> quarters, whereas our sample has only <MathText tex="T = 90" /> (<MathText tex="1.2" /> obs/param).
              </li>
              <li>
                <strong>Holdout Validation:</strong> In-sample fit improves mechanically as variables are added; only out-of-sample holdout testing against the univariate baseline (<MathText tex="K = 1" />) exposes overparameterization.
              </li>
            </ul>
          </div>
        </div>
      );
    })();

    return (
      <Layout
        title="5.6 Curse of Dimensionality"
        commentary={
          <div>
            {commentaryTabs}
            {commentaryContent}
          </div>
        }
        dataset={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 600 }}>Laboratory Specification:</div>
            <div style={{ background: 'var(--surface)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.82rem', lineHeight: '1.6' }}>
              <div><strong>Forecasting Objective:</strong> Predict Target Series <MathText tex="Y_1" /> out-of-sample over <MathText tex="t = 91 \dots 110" /></div>
              <div><strong>Apple-to-Apple Baseline:</strong> Univariate model on <MathText tex="Y_1" /> alone (<MathText tex="K = 1" /> AR(2) benchmark)</div>
              <div><strong>Training Sample:</strong> <MathText tex="t = 1 \dots 90" /> (<MathText tex="T = 90" /> observations)</div>
              <div><strong>Lag Order:</strong> Fixed <MathText tex="p = 2" /> lags across all specifications</div>
            </div>
            <div style={{ background: 'var(--primary-bg)', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', lineHeight: '1.5' }}>
              <strong>Ground-Truth Data Generating Process:</strong>
              <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.1rem' }}>
                <li><strong>Coupled Drivers:</strong> <MathText tex="Y_1" /> (Target) and <MathText tex="Y_2" /> form a coupled true feedback loop (<MathText tex="K = 2" />).</li>
                <li><strong>Distractors:</strong> <MathText tex="Y_3 \dots Y_6" /> are independent autoregressive noise series with zero structural feedback to <MathText tex="Y_1" />.</li>
              </ul>
            </div>
          </div>
        }
        controlsPosition="aboveExtraCard"
        controls={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem', padding: '0.35rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <label htmlFor="tab6-k-slider" style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                Variables in VAR System (<MathText tex="K" />):
              </label>
              <input
                id="tab6-k-slider"
                type="range"
                min="1"
                max="6"
                value={tab6K}
                onChange={(e) => setTab6K(parseInt(e.target.value, 10))}
                style={{ width: '150px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: '65px', fontSize: '1rem' }}>
                <MathText tex={`K = ${tab6K}`} />
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ({activeMetrics.params} total parameters)
              </span>
            </div>

            <div>
              <span
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  background: verdictBadgeStyle.bg,
                  color: verdictBadgeStyle.color,
                  border: `1px solid ${verdictBadgeStyle.border}`,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {activeMetrics.verdict}
              </span>
            </div>
          </div>
        }
        extraCardTitle="Model Progression & Benchmark Scorecard (K = 1 to 6)"
        extraCard={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Click any row to inspect that model on the forecast chart below. Row <strong><MathText tex="K = 1" /></strong> serves as the unassisted univariate benchmark.
            </div>
            <table style={comparisonTableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderCellStyle}><MathText tex="K" /></th>
                  <th style={tableHeaderCellStyle}>Parameters (<MathText tex="K^2 p + K" />)</th>
                  <th style={tableHeaderCellStyle}>Obs / Param (<MathText tex="T / \text{Param}" />)</th>
                  <th style={tableHeaderCellStyle}>Training RMSE (<MathText tex="t = 1 \dots 90" />)</th>
                  <th style={tableHeaderCellStyle}>Holdout RMSE (<MathText tex="t = 91 \dots 110" />)</th>
                  <th style={tableHeaderCellStyle}>vs Baseline (<MathText tex="K = 1" />)</th>
                  <th style={tableHeaderCellStyle}>Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {curveData.map((row) => {
                  const isRowActive = row.k === tab6K;
                  const isOptimal = row.k === 2;
                  const isUnderfit = row.k === 1;
                  const deltaVsK1 = ((row.out_rmse - m1.out_rmse) / m1.out_rmse) * 100;
                  const isWorseThanK1 = row.out_rmse > m1.out_rmse;
                  return (
                    <tr
                      key={row.k}
                      style={{
                        background: isUnderfit
                          ? 'rgba(59, 130, 246, 0.08)'
                          : isRowActive
                          ? 'var(--primary-bg)'
                          : 'transparent',
                        fontWeight: isRowActive ? 700 : 400,
                        borderLeft: isUnderfit ? '4px solid #3b82f6' : isRowActive ? '4px solid var(--primary)' : '4px solid transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setTab6K(row.k)}
                    >
                      <td style={tableCellStyle}>
                        <strong><MathText tex={`K = ${row.k}`} /></strong>{' '}
                        {isUnderfit && (
                          <span style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.72rem', marginLeft: '0.25rem' }}>
                            Baseline
                          </span>
                        )}
                        {isRowActive && !isUnderfit && (
                          <span style={{ color: 'var(--primary)', fontSize: '0.78rem', marginLeft: '0.25rem' }}>
                            (Active)
                          </span>
                        )}
                      </td>
                      <td style={tableCellStyle}>{row.params}</td>
                      <td style={{ ...tableCellStyle, color: row.obs_per_param < 5 ? '#ef4444' : '#16a34a' }}>
                        {row.obs_per_param}x
                      </td>
                      <td style={tableCellStyle}>{row.in_rmse.toFixed(3)}</td>
                      <td style={{ ...tableCellStyle, color: isOptimal ? '#16a34a' : (isWorseThanK1 ? '#ef4444' : 'inherit'), fontWeight: isOptimal || isWorseThanK1 ? 700 : 400 }}>
                        {row.out_rmse.toFixed(3)}
                      </td>
                      <td style={tableCellStyle}>
                        {isUnderfit ? (
                          <span style={{ color: '#3b82f6', fontWeight: 600 }}>Baseline ({m1.out_rmse.toFixed(3)})</span>
                        ) : deltaVsK1 < 0 ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>{deltaVsK1.toFixed(1)}% (Beats Baseline)</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>+{deltaVsK1.toFixed(1)}% (Worse than Baseline!)</span>
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        {isUnderfit && <span style={{ color: '#f59e0b' }}>Underfitting (Misses Driver <MathText tex="Y_2" />)</span>}
                        {isOptimal && <span style={{ color: '#16a34a' }}>Optimal (Lowest Test Error)</span>}
                        {row.k >= 3 && !isWorseThanK1 && <span style={{ color: '#ef4444' }}>Degrading (Extra Parameters)</span>}
                        {isWorseThanK1 && <span style={{ color: '#ef4444', fontWeight: 700 }}>Severe Overfit (Noise Trapped)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
        chartHeight="500px"
        chart={
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem', fontWeight: 600 }}>
              <span>
                Target Series <MathText tex="Y_1" />: Actual vs VAR(2) Forecast at Active <MathText tex={`K = ${tab6K}`} /> {activeMetrics.verdict_type === 'optimal' ? '(Optimal Model)' : activeMetrics.verdict_type === 'underfit' ? '(Underfitting)' : '(Overfitting from Parameter Explosion)'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                Training <MathText tex="t = 1 \dots 90" /> | Out-of-Sample Holdout <MathText tex="t = 91 \dots 110" />
              </span>
            </div>
            <div style={{ flex: 1, minHeight: '440px', position: 'relative' }}>
              <ZoomableChartShell defaultDomain={[69, Math.min(99, Math.max(1, timeline.length - 1))]} minTime={0} maxTime={Math.max(1, timeline.length - 1)}>
                {(zoomDomain) => (
                  <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                    <LineChart data={timeline} margin={{ top: 15, right: 25, left: 10, bottom: 10 }} style={{ pointerEvents: 'auto' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(i) => timeline[Math.round(i)]?.step_label || ''} />
                      <YAxis
                        domain={[-2.5, 4.5]}
                        ticks={[-2, -1, 0, 1, 2, 3, 4]}
                        tick={{ fill: 'var(--text-muted)' }}
                        tickFormatter={(v) => Number(v).toFixed(0)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                        formatter={(val) => (val !== null && val !== undefined ? Number(val).toFixed(2) : 'N/A')}
                        labelFormatter={(i) => `Step: ${timeline[Math.round(i)]?.step_label || ''} (${timeline[Math.round(i)]?.is_test ? 'Holdout Test' : 'Training Sample'})`}
                      />
                      <Legend verticalAlign="top" height={32} />
                      <ReferenceLine x={splitIndex} stroke="#eab308" strokeDasharray="4 4" label={{ position: 'top', value: 'Forecast Origin (t = 90)', fill: '#eab308', fontSize: 11 }} />

                      {/* Actual Target Series Y1 */}
                      <Line
                        type="monotone"
                        dataKey="y1_actual"
                        name="Target Series Y1 (Actual)"
                        stroke="#334155"
                        strokeWidth={2.5}
                        dot={{ r: 2 }}
                        isAnimationActive={false}
                      />

                      {/* Univariate Baseline Benchmark (Always Visible when K > 1) */}
                      {tab6K !== 1 && (
                        <Line
                          type="monotone"
                          dataKey="fc_k1"
                          name="K=1 Univariate Baseline (ARIMA)"
                          stroke="#64748b"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3 }}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                      )}

                      {/* Active K Forecast */}
                      <Line
                        type="monotone"
                        dataKey={activeFcKey}
                        name={`Active Model Forecast (K=${tab6K})`}
                        stroke={tab6K === 2 ? '#16a34a' : (tab6K === 1 ? '#3b82f6' : '#ef4444')}
                        strokeWidth={3}
                        strokeDasharray="4 4"
                        dot={{ r: 3.5 }}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ZoomableChartShell>
            </div>
          </div>
        }
      />
    );
  }

  // =========================================================================
  // SUBTAB 5.7: Recursive Coefficient Stability & Structural Resilience
  // =========================================================================
  if (activeTab === 7) {
    const t7Data = data.tab7 || { trajectory: [], variables: {} };
    const trajectory = t7Data.trajectory || [];

    const paramLabels = {
      cons_to_gdp: {
        title: 'Consumption → GDP',
        desc: 'Lagged Consumption Growth effect on Real GDP Growth',
        betaKey: 'beta_cons_to_gdp',
        upperKey: 'upper_cons_to_gdp',
        lowerKey: 'lower_cons_to_gdp',
        seKey: 'se_cons_to_gdp',
      },
      gdp_to_cons: {
        title: 'GDP → Consumption',
        desc: 'Lagged Real GDP Growth effect on Consumption Growth',
        betaKey: 'beta_gdp_to_cons',
        upperKey: 'upper_gdp_to_cons',
        lowerKey: 'lower_gdp_to_cons',
        seKey: 'se_gdp_to_cons',
      },
      dpi_to_gdp: {
        title: 'Income → GDP',
        desc: 'Lagged Disposable Income Growth effect on Real GDP Growth',
        betaKey: 'beta_dpi_to_gdp',
        upperKey: 'upper_dpi_to_gdp',
        lowerKey: 'lower_dpi_to_gdp',
        seKey: 'se_dpi_to_gdp',
      },
      dpi_to_cons: {
        title: 'Income → Consumption',
        desc: 'Lagged Disposable Income Growth effect on Consumption Growth',
        betaKey: 'beta_dpi_to_cons',
        upperKey: 'upper_dpi_to_cons',
        lowerKey: 'lower_dpi_to_cons',
        seKey: 'se_dpi_to_cons',
      },
    };

    const currentConfig = paramLabels[tab7Var] || paramLabels.cons_to_gdp;

    const trajectoryWithCI = trajectory.map((pt) => ({
      ...pt,
      ci_band: [pt[currentConfig.lowerKey], pt[currentConfig.upperKey]],
    }));

    const b1981Index = trajectory.findIndex((pt) => pt.origin === '1981Q3');
    const gmIndex = trajectory.findIndex((pt) => pt.origin === '1984Q1');
    const rec1990Index = trajectory.findIndex((pt) => pt.origin === '1990Q3');
    const b2001Index = trajectory.findIndex((pt) => pt.origin === '2001Q3');
    // Ploberger–Krämer OLS-CUSUM 5% critical value (theoretical; independent of estimates)
    const CUSUM_BOUND = 0.948;
    const cusum1981 = b1981Index >= 0 ? trajectory[b1981Index].cusum : null;
    const cusum2001 = b2001Index >= 0 ? trajectory[b2001Index].cusum : null;
    const pt1980 = trajectory.find((pt) => pt.origin === '1980Q1');
    const pt1982 = trajectory.find((pt) => pt.origin === '1982Q1');
    const beta1980 = pt1980?.beta_cons_to_gdp;
    const beta1982 = pt1982?.beta_cons_to_gdp;
    const se1980 = pt1980?.se_cons_to_gdp;
    const betaShift = (beta1980 !== undefined && beta1982 !== undefined) ? (beta1982 - beta1980) : null;
    const postBreakPts = trajectory.filter((pt) => pt.origin >= '1984Q1' && pt.origin <= '1999Q4');
    const betaPlateau = postBreakPts.length
      ? postBreakPts.reduce((sum, pt) => sum + pt.beta_cons_to_gdp, 0) / postBreakPts.length
      : null;

    const commentaryTabs = (
      <div className="tabs" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { id: 1, label: '1. Detect Drift (CUSUM & KL Divergence)' },
          { id: 2, label: '2. Diagnose Cause (Recursive β Trajectory)' },
          { id: 3, label: '3. When to Retrain: Practical Playbook' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tab7CommentaryTab === t.id ? 'active' : ''}`}
            onClick={() => setTab7CommentaryTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    const commentaryContent = (() => {
      if (tab7CommentaryTab === 1) {
        const cusum1981Label = cusum1981 !== null && cusum1981 !== undefined
          ? `${cusum1981 >= 0 ? '+' : ''}${Number(cusum1981).toFixed(3)}`
          : null;
        const cusum2001Label = cusum2001 !== null && cusum2001 !== undefined
          ? `${cusum2001 >= 0 ? '+' : ''}${Number(cusum2001).toFixed(3)}`
          : null;
        const title1981 = cusum1981Label ? `1981Q3 early warning (${cusum1981Label})` : '1981Q3 early warning';
        const title2001 = cusum2001Label ? `2001Q3 borderline alert (${cusum2001Label})` : '2001Q3 borderline alert';
        return (
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Core assumption under test:</strong> Sections 5.5 and 5.6 treated cross-series relationships as fixed over decades. If those relationships shift, an expanding VAR averages over conflicting regimes &mdash; one reason walk-forward ARIMA sometimes beat expanding VAR in transitions.
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>What CUSUM monitors:</strong> The cumulative sum of recursive residuals tracks one-step forecast errors (<MathText tex="e_t = y_t - \hat{y}_t" />). Under a stable model, errors cancel around zero; after a shift they accumulate and the path drifts.
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>95% critical boundary (&plusmn;{CUSUM_BOUND}):</strong> This is the published Ploberger&ndash;Krämer OLS-CUSUM 5% threshold under the null of a stable model. It does not depend on the VAR&apos;s estimated coefficients &mdash; only on the null distribution of the normalized residual path.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--surface)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>{title1981}:</strong> Aggressive Volcker rate hikes to break inflation. Notice the purple path just grazes the +{CUSUM_BOUND} line &mdash; a borderline alert that one-sided forecast errors are accumulating, not an explosive breach.
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>1984&ndash;1999 stability:</strong> During the Great Moderation the cumulative error path stays well inside the bands.
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>{title2001}:</strong> The dot-com recession drives negative accumulation that again grazes the lower threshold.
              </div>
            </div>
            <div style={{ background: 'var(--primary-bg)', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid var(--border)' }}>
              <strong>ML bridge (concept drift):</strong> Concept drift means the input&ndash;output map itself shifted. Streaming ML often tracks that with KL divergence on recent vs baseline error distributions, but density estimates need thousands of samples. With 40&ndash;80 quarterly points, CUSUM is preferred because it compares cumulative errors to an exact theoretical bound without estimating those densities.
            </div>
          </div>
        );
      }
      if (tab7CommentaryTab === 2) {
        const beta1980Label = beta1980 !== undefined ? Number(beta1980).toFixed(3) : 'n/a';
        const beta1982Label = beta1982 !== undefined ? Number(beta1982).toFixed(3) : 'n/a';
        const betaPlateauLabel = betaPlateau !== null ? betaPlateau.toFixed(3) : 'n/a';
        const betaShiftLabel = betaShift !== null ? `${betaShift >= 0 ? '+' : ''}${betaShift.toFixed(2)}` : null;
        const se1980Label = se1980 !== undefined ? Number(se1980).toFixed(2) : null;
        return (
          <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Cause diagnosis (parameter space):</strong> CUSUM flagged strain in 1981. Recursive estimation &mdash; refitting from 1980Q1 to 2002Q4 &mdash; shows which lag coefficient actually moved.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--surface)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>Consumption &rarr; GDP (structural surge):</strong>
                <div style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>
                  This is the primary transmission channel. Notice on the chart: <MathText tex="\hat{\beta}" /> rises from{' '}
                  <strong>{beta1980Label}</strong> in 1980Q1 to{' '}
                  <strong>{beta1982Label}</strong> in 1982Q1
                  {betaShiftLabel ? <> (absolute shift {betaShiftLabel})</> : null}
                  {se1980Label ? <>, larger than one SE ({se1980Label})</> : null}.
                  After 1984 it settles on a post-break plateau around <strong>{betaPlateauLabel}</strong>.
                </div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>Other parameters (stable vs noise):</strong>
                <div style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>
                  Use the parameter buttons in the controls panel below to compare:
                  <ul style={{ margin: '0.35rem 0 0 1.15rem', padding: 0 }}>
                    <li style={{ marginBottom: '0.25rem' }}>
                      <strong>Income &rarr; Consumption:</strong> A modest, steady pass-through without the regime surge seen in Consumption &rarr; GDP.
                    </li>
                    <li>
                      <strong>GDP &rarr; Consumption &amp; Income &rarr; GDP:</strong> Both hover near zero with 95% bands that span zero across the full sample &mdash; estimation noise, not structure.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>Key takeaway:</strong> Treat a move as structural when a primary, significant channel shifts by more than its standard error across regimes &mdash; not when near-zero coefficients wiggle.
            </p>
          </div>
        );
      }
      return (
        <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            <strong>Link back to 5.5&ndash;5.6:</strong> In 5.5 the joint model&apos;s edge eroded at crisis origins; 5.6 showed extra noise variables hurt. Parameter drift is another reason expanding windows fail &mdash; obsolete pre-break relationships leak into the new regime.
          </p>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
            <strong>Retraining finding:</strong> When CUSUM drifts and coefficients shift across regimes, expanding the estimation window over the full history averages conflicting eras and weakens forecasts.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            <div style={{ background: 'var(--surface)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                Strategy 1: Fixed Rolling Window
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                Retrain on only the most recent <MathText tex="M" /> quarters (e.g., the last 40 quarters / 10 years). As new quarters arrive, old pre-break data is automatically dropped, preventing obsolete economic relationships from corrupting current forecasts.
              </div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#16a34a', marginBottom: '0.35rem' }}>
                Strategy 2: Reset Training Origin
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                Once CUSUM or structural tests identify a clear break date (such as 1984Q1 for the Great Moderation), reset the estimation start date to that point. The model then learns exclusively within the active economic regime.
              </div>
            </div>
          </div>
        </div>
      );
    })();

    const controlsContent = (() => {
      if (tab7CommentaryTab === 2) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tracked Parameter:</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {Object.entries(paramLabels).map(([k, cfg]) => (
                <button
                  key={k}
                  onClick={() => setTab7Var(k)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: tab7Var === k ? 'var(--primary)' : 'var(--surface)',
                    color: tab7Var === k ? '#fff' : 'var(--text-main)',
                    fontWeight: tab7Var === k ? 700 : 400,
                    fontSize: '0.82rem',
                  }}
                >
                  {cfg.title}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', cursor: 'pointer', marginLeft: '0.5rem' }}>
              <input
                type="checkbox"
                checked={tab7ShowCI}
                onChange={(e) => setTab7ShowCI(e.target.checked)}
              />
              Show 95% Confidence Band (&plusmn;1.96 SE)
            </label>
          </div>
        );
      }
      return null;
    })();

    const chartContent = (() => {
      if (tab7CommentaryTab === 1 || tab7CommentaryTab === 2) {
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem', fontWeight: 600 }}>
              <span>
                {tab7CommentaryTab === 1
                  ? 'Recursive CUSUM Diagnostic: Forecast Residual Accumulation (1980Q1 to 2002Q4)'
                  : `Recursive Parameter Trajectory: ${currentConfig.title} (1980Q1 to 2002Q4)`}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>Scroll / drag to zoom &amp; pan</span>
            </div>
            <div style={{ flex: 1, minHeight: '420px', position: 'relative' }}>
              <ZoomableChartShell defaultDomain={[0, Math.max(1, trajectory.length - 1)]} maxTime={Math.max(1, trajectory.length - 1)}>
                {(zoomDomain) => (
                  <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                    {tab7CommentaryTab === 1 ? (
                      <ComposedChart data={trajectory} margin={{ top: 15, right: 35, left: 10, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(i) => trajectory[Math.round(i)]?.origin || ''} />
                        <YAxis
                          domain={[-1.4, 1.4]}
                          tick={{ fill: '#8b5cf6' }}
                          tickFormatter={(v) => v.toFixed(1)}
                          label={{ value: 'Recursive CUSUM Statistic', angle: -90, position: 'insideLeft', offset: -5, fill: '#8b5cf6' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                          formatter={(val, name) => [Number(val).toFixed(3), name]}
                          labelFormatter={(i) => `Date: ${trajectory[Math.round(i)]?.origin || ''} (${trajectory[Math.round(i)]?.regime || ''})`}
                        />
                        <Legend verticalAlign="top" height={32} />
                        <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
                        <ReferenceLine y={CUSUM_BOUND} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: `+95% Critical Bound (+${CUSUM_BOUND})`, fill: '#ef4444', fontSize: 11 }} />
                        <ReferenceLine y={-CUSUM_BOUND} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'bottom', value: `-95% Critical Bound (-${CUSUM_BOUND})`, fill: '#ef4444', fontSize: 11 }} />
                        {b1981Index >= 0 && (
                          <ReferenceLine x={b1981Index} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'top', value: `1981Q3 Early Warning (${cusum1981 >= 0 ? '+' : ''}${Number(cusum1981).toFixed(3)})`, fill: '#ef4444', fontSize: 11 }} />
                        )}
                        {gmIndex >= 0 && (
                          <ReferenceLine x={gmIndex} stroke="#10b981" strokeDasharray="4 4" label={{ position: 'top', value: 'Great Moderation (1984Q1)', fill: '#10b981', fontSize: 11 }} />
                        )}
                        {b2001Index >= 0 && (
                          <ReferenceLine x={b2001Index} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'bottom', value: `2001Q3 Borderline Alert (${cusum2001 >= 0 ? '+' : ''}${Number(cusum2001).toFixed(3)})`, fill: '#ef4444', fontSize: 11 }} />
                        )}
                        <Line type="monotone" dataKey="cusum" name="Recursive CUSUM Path" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={trajectoryWithCI} margin={{ top: 15, right: 35, left: 10, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(i) => trajectory[Math.round(i)]?.origin || ''} />
                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fill: 'var(--text-muted)' }}
                          tickFormatter={(v) => v.toFixed(2)}
                          label={{ value: 'Estimated Lag-1 Coefficient (β)', angle: -90, position: 'insideLeft', offset: -5, fill: 'var(--text-muted)' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                          formatter={(val, name) => [
                            Array.isArray(val) ? `[${val[0]?.toFixed(3)}, ${val[1]?.toFixed(3)}]` : Number(val).toFixed(4),
                            name
                          ]}
                          labelFormatter={(i) => `Date: ${trajectory[Math.round(i)]?.origin || ''} (${trajectory[Math.round(i)]?.regime || ''})`}
                        />
                        <Legend verticalAlign="top" height={32} />
                        <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
                        {gmIndex >= 0 && (
                          <ReferenceLine x={gmIndex} stroke="#10b981" strokeDasharray="4 4" label={{ position: 'top', value: 'Great Moderation (1984Q1)', fill: '#10b981', fontSize: 11 }} />
                        )}
                        {rec1990Index >= 0 && (
                          <ReferenceLine x={rec1990Index} stroke="#f59e0b" strokeDasharray="4 4" label={{ position: 'top', value: '1990 Recession', fill: '#f59e0b', fontSize: 11 }} />
                        )}
                        {tab7ShowCI && (
                          <>
                            <Area
                              type="monotone"
                              dataKey="ci_band"
                              stroke="#93c5fd"
                              strokeDasharray="4 4"
                              strokeWidth={1}
                              fill="#3b82f6"
                              fillOpacity={0.12}
                              name="95% Confidence Band (±1.96 SE)"
                              isAnimationActive={false}
                            />
                            <Line
                              type="monotone"
                              dataKey={currentConfig.upperKey}
                              name="+95% Confidence Bound"
                              stroke="#93c5fd"
                              strokeDasharray="4 4"
                              strokeWidth={1.2}
                              dot={false}
                              legendType="none"
                              isAnimationActive={false}
                            />
                            <Line
                              type="monotone"
                              dataKey={currentConfig.lowerKey}
                              name="-95% Confidence Bound"
                              stroke="#93c5fd"
                              strokeDasharray="4 4"
                              strokeWidth={1.2}
                              dot={false}
                              legendType="none"
                              isAnimationActive={false}
                            />
                          </>
                        )}
                        <Line
                          type="monotone"
                          dataKey={currentConfig.betaKey}
                          name={`Recursive β (${currentConfig.title})`}
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={{ r: 2 }}
                          isAnimationActive={false}
                        />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                )}
              </ZoomableChartShell>
            </div>
          </div>
        );
      }
      return null;
    })();

    return (
      <Layout
        title="5.7 Parameter Stability: Do Coefficients Stay Constant?"
        commentary={
          <div>
            {commentaryTabs}
            {commentaryContent}
          </div>
        }
        dataset={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
            <div><strong>Dataset:</strong> U.S. Macrodata (1959Q1&ndash;2002Q4) in quarterly log differences (<MathText tex="\Delta \ln \text{GDP}, \Delta \ln \text{Cons}, \Delta \ln \text{DPI}" />).</div>
            <div style={{ background: 'var(--surface)', padding: '0.55rem', borderRadius: '6px', fontSize: '0.82rem', lineHeight: '1.5', border: '1px solid var(--border)' }}>
              <div><strong>Recursive Sample:</strong> Expanding quarterly windows from 1980Q1 to 2002Q4, re-estimated every 2 quarters (46 evaluation points).</div>
              <div style={{ marginTop: '0.35rem' }}><strong>Model Specification:</strong> Trivariate <MathText tex="\text{VAR}(2)" /> on first-differenced log series.</div>
            </div>
            <div style={{ background: 'var(--primary-bg)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem' }}>
              <strong>Active Focus:</strong> {tab7CommentaryTab === 1 ? '1. Error Space (CUSUM Detection)' : tab7CommentaryTab === 2 ? `2. Parameter Space (${currentConfig.title})` : '3. Retraining Playbook'}
            </div>
          </div>
        }
        controls={controlsContent}
        chartHeight="500px"
        chart={chartContent}
      />
    );
  }

  // =========================================================================
  // =========================================================================
  // SUBTAB 5.8: VECM & Cointegration (Long-Run Equilibrium)
  // =========================================================================
  if (activeTab === 8) {
    const t8Root = data.tab8 || {};
    const scenarios = t8Root.scenarios || {};

    // Tab 1 & 2 use Mutual Cointegration (Both Series Adjust)
    // Tab 3 uses Leader-Follower & Weak Exogeneity (One Series Adjusts)
    // Tab 4 uses Uncointegrated Macro System (Spurious Anchor Penalty)
    const activeScenarioKey = tab8CommentaryTab === 3
      ? 'leader_follower'
      : tab8CommentaryTab === 4
      ? 'uncointegrated'
      : 'mutual';

    const currentScenarioData = scenarios[activeScenarioKey] || scenarios.mutual || scenarios.cointegrated || t8Root;
    const is2Var = activeScenarioKey !== 'uncointegrated';

    const johansen = currentScenarioData.johansen || [];
    const johansenR0 = johansen[0] || {};
    const johansenR1 = johansen[1] || {};
    const spreadTimeline = currentScenarioData.spread_timeline || [];
    const metrics = currentScenarioData.metrics || {};
    const seriesKeys = currentScenarioData.series_keys || (is2Var ? ['series_a', 'series_b'] : ['realgdp', 'realcons', 'realdpi']);
    const seriesLabels = currentScenarioData.series_labels || (is2Var ? { series_a: 'Series A', series_b: 'Series B' } : { realgdp: 'Real GDP', realcons: 'Real Consumption', realdpi: 'Disposable Income' });
    const metricsA = metrics.by_series?.series_a || {};
    const metricsB = metrics.by_series?.series_b || {};
    const metricsGdp = metrics.by_series?.realgdp || {};
    const fmtAlpha = (v, signed = false) => {
      if (v === undefined || v === null) return null;
      const n = Number(v);
      const body = n.toFixed(4);
      return signed && n > 0 ? `+${body}` : body;
    };
    const fmtP = (p) => {
      if (p === undefined || p === null) return null;
      return Number(p) < 0.001 ? '< 0.001' : Number(p).toFixed(4);
    };

    // Safeguard active series selection when switching tabs
    const activeSeriesKey = seriesKeys.includes(tab8Series) ? tab8Series : seriesKeys[0];
    const currMetrics = metrics.by_series?.[activeSeriesKey] || {
      vecm_rmse: metrics.vecm_rmse || 0,
      varima_rmse: metrics.varima_rmse || 0,
      pct_worse: 0,
    };

    const actualKey = `${activeSeriesKey}_actual`;
    const vecmKey = `${activeSeriesKey}_vecm`;
    const varimaKey = `${activeSeriesKey}_varima`;

    const splitIndex = spreadTimeline.findIndex((pt) => pt.quarter === '2002Q4');

    // Default domain: focus on 1996Q1-2006Q4 so the shock and cointegration dynamics are immediately visible
    const focus1996Index = Math.max(0, spreadTimeline.findIndex((pt) => pt.quarter === '1996Q1'));
    const focusStartIndex = Math.max(0, spreadTimeline.findIndex((pt) => pt.quarter === '1999Q1'));
    const defaultDomain = tab8CommentaryTab === 1 && tab8View === 'levels'
      ? [focus1996Index !== -1 ? focus1996Index : 0, Math.max(1, spreadTimeline.length - 1)]
      : tab8CommentaryTab >= 2
      ? [focusStartIndex !== -1 ? focusStartIndex : 0, Math.max(1, spreadTimeline.length - 1)]
      : [0, Math.max(1, spreadTimeline.length - 1)];

    const cointVec = currentScenarioData.cointegrating_vector || {};
    const ectEquationLatex = (() => {
      if (is2Var) {
        if (cointVec.series_b === undefined || cointVec.intercept_c === undefined) return '\\text{ECT}_t = \\text{n/a}';
        const signB = cointVec.series_b >= 0 ? '+' : '-';
        return `\\text{ECT}_t = \\text{Series A}_t ${signB} ${Math.abs(cointVec.series_b).toFixed(3)}\\text{Series B}_t - ${Number(cointVec.intercept_c).toFixed(3)}`;
      }
      if (cointVec.cons === undefined || cointVec.dpi === undefined) return '\\text{ECT}_t = \\text{n/a}';
      const signCons = cointVec.cons >= 0 ? '+' : '-';
      const signDpi = cointVec.dpi >= 0 ? '+' : '-';
      return `\\text{ECT}_t = \\ln(\\text{GDP}_t) ${signCons} ${Math.abs(cointVec.cons).toFixed(3)}\\ln(\\text{Cons}_t) ${signDpi} ${Math.abs(cointVec.dpi).toFixed(3)}\\ln(\\text{Income}_t)`;
    })();
    const shockPt = spreadTimeline.find((pt) => pt.quarter === '2002Q4');
    const shockDisplacement = shockPt?.ect_spread != null ? Number(shockPt.ect_spread) : null;
    const equilibriumGap = cointVec.intercept_c != null ? Math.abs(Number(cointVec.intercept_c)) : null;

    const commentaryTabs = (
      <div className="tabs" style={{ marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { id: 1, label: '1. Equilibrium & The Differencing Trap' },
          { id: 2, label: '2. Mutual Cointegration & Johansen Test' },
          { id: 3, label: '3. Leader-Follower & Weak Exogeneity' },
          { id: 4, label: '4. Uncointegrated Series & Why Differencing Wins' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tab8CommentaryTab === t.id ? 'active' : ''}`}
            onClick={() => {
              setTab8CommentaryTab(t.id);
              if (t.id === 1) {
                setTab8View('levels');
                setTab8Series('series_a');
              } else if (t.id === 2) {
                setTab8View('forecast');
                setTab8Series('series_a');
              } else if (t.id === 3) {
                setTab8View('forecast');
                setTab8Series('series_a');
              } else if (t.id === 4) {
                setTab8View('forecast');
                setTab8Series('realgdp');
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    );

    const commentaryContent = (() => {
      if (tab8CommentaryTab === 1) {
        return (
          <div style={{ fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Assumption from 5.1&ndash;5.7:</strong> Topic 5&apos;s default for trending data was differencing (<MathText tex="\Delta y_t = y_t - y_{t-1}" />) before VAR/VARIMA. That rule fails when two trending series share a long-run bond that keeps their gap mean-reverting.
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Long-run equilibrium:</strong> Theory often ties a pair by a resting parity <MathText tex="Y_t = \beta X_t + c" />, so the spread <MathText tex="\text{ECT}_t = Y_t - \beta X_t - c" /> fluctuates around zero even while each series wanders.
            </p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.5rem 0.85rem', borderRadius: '6px', textAlign: 'center', margin: '0.1rem 0' }}>
              <MathText tex="Y_t = \beta X_t + c \implies \text{ECT}_t = Y_t - \beta X_t - c = 0" />
            </div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Fuel-price example:</strong> Wholesale (<MathText tex="X_t" />) and retail (<MathText tex="Y_t" />) fuel usually share a margin <MathText tex="c" />. After a refinery shock lifts retail by several units, competition pulls retail back toward wholesale parity over later quarters.
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Equilibrium amnesia:</strong> A differenced model only sees <MathText tex="\Delta Y_t" />. Once growth returns near zero it treats the new inflated level as &ldquo;at rest,&rdquo; with no memory of the level gap to parity.
            </p>
            <div style={{ background: 'var(--primary-bg)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>Error correction term (ECT):</strong> Like a thermostat vs a setpoint, <MathText tex="\text{ECT}_{t-1} = Y_{t-1} - \beta X_{t-1} - c" /> enters the growth equation:
              <div style={{ margin: '0.45rem 0', textAlign: 'center' }}>
                <MathText tex="\Delta Y_t = \alpha_Y (Y_{t-1} - \beta X_{t-1} - c) + \Gamma_1 \Delta Y_{t-1} + \varepsilon_t" />
              </div>
              When retail is too high (<MathText tex="\text{ECT} > 0" />), <MathText tex="\alpha_Y < 0" /> pulls growth down until parity returns. Differencing gives stationarity; the ECT restores long-run memory.
            </div>
            <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-main)' }}>
              <strong>What to look for:</strong> At 2002Q4 a supply shock lifts Series A well above Series B. Toggle <strong>System in Levels</strong> vs <strong>Equilibrium Error Spread</strong> to see the gap that pure differencing ignores.
            </p>
          </div>
        );
      }

      if (tab8CommentaryTab === 2) {
        const alphaA = fmtAlpha(metrics.alpha_a_speed);
        const alphaB = fmtAlpha(metrics.alpha_b_speed, true);
        const pA = fmtP(metrics.alpha_a_pvalue);
        const pB = fmtP(metrics.alpha_b_pvalue);
        return (
          <div style={{ fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Proving an ECT exists:</strong> Tab 1 showed why the error-correction term matters. Forcing one onto independent drifts invents a false long-run target. The <strong>Johansen sequential rank test</strong> checks whether a stationary ECT is actually present.
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Cointegration rank (<MathText tex="r" />):</strong> For <MathText tex="K" /> non-stationary series, <MathText tex="r" /> is the number of independent stationary linear combinations. Here <MathText tex="r = 0" /> means no anchor; <MathText tex="r = 1" /> means one shared equilibrium tether.
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Johansen results:</strong> Start with <MathText tex="H_0: r = 0" />. Trace {johansenR0.trace_stat ?? 'n/a'} {johansenR0.rejected_95 ? '>' : '<'} {johansenR0.cv_95 ?? 'n/a'} {johansenR0.rejected_95 ? 'rejects' : 'fails to reject'} that null. Next, <MathText tex="H_0: r \\le 1" />: Trace {johansenR1.trace_stat ?? 'n/a'} {johansenR1.rejected_95 ? '>' : '<'} {johansenR1.cv_95 ?? 'n/a'} {johansenR1.rejected_95 ? 'rejects' : 'fails to reject'}, confirming rank <MathText tex="r = 1" />.
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Two-sided adjustment:</strong> Both series move to close the gap when Series A is shocked high (<MathText tex="\text{ECT} > 0" />):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '0.1rem 0' }}>
              <div style={{ background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>Series A adjusts down:</strong><br />
                {alphaA !== null ? <MathText tex={`\\alpha_A = ${alphaA}`} /> : 'n/a'}{' '}
                <span style={{ color: '#0284c7', fontSize: '0.78rem' }}>
                  (t = {metrics.alpha_a_tstat ?? 'n/a'}{pA ? `, p = ${pA}` : ''})
                </span><br />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pulls growth downward toward parity.</span>
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>Series B adjusts up:</strong><br />
                {alphaB !== null ? <MathText tex={`\\alpha_B = ${alphaB}`} /> : 'n/a'}{' '}
                <span style={{ color: '#16a34a', fontSize: '0.78rem' }}>
                  (t = {metrics.alpha_b_tstat != null && metrics.alpha_b_tstat > 0 ? `+${metrics.alpha_b_tstat}` : (metrics.alpha_b_tstat ?? 'n/a')}{pB ? `, p = ${pB}` : ''})
                </span><br />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pushes growth upward to meet Series A.</span>
              </div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>Forecasting payoff:</strong> On the 16Q holdout, VECM RMSE is {metricsA.vecm_rmse?.toFixed(2) ?? 'n/a'} vs {metricsA.varima_rmse?.toFixed(2) ?? 'n/a'} for differenced VAR on Series A ({metricsA.pct_worse !== undefined ? `${metricsA.pct_worse.toFixed(1)}%` : 'n/a'}), and {metricsB.vecm_rmse?.toFixed(2) ?? 'n/a'} vs {metricsB.varima_rmse?.toFixed(2) ?? 'n/a'} on Series B ({metricsB.pct_worse !== undefined ? `${metricsB.pct_worse.toFixed(1)}%` : 'n/a'}). Differenced VAR extrapolates the shock; VECM anticipates mean-reversion.
            </div>
          </div>
        );
      }

      if (tab8CommentaryTab === 3) {
        const alphaA = fmtAlpha(metrics.alpha_a_speed);
        const alphaB = fmtAlpha(metrics.alpha_b_speed);
        const pA = fmtP(metrics.alpha_a_pvalue);
        const pB = fmtP(metrics.alpha_b_pvalue);
        const pctA = metricsA.pct_worse;
        const pctB = metricsB.pct_worse;
        return (
          <div style={{ fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>One-sided vs two-sided adjustment:</strong> Tab 2 had both series closing the gap. Often one series is an <strong>autonomous leader</strong> and the other a <strong>follower</strong> &mdash; e.g. mortgage rates track the policy rate, but the central bank does not clear commercial spreads (<MathText tex="\alpha = 0" /> for the leader).
            </p>
            <div style={{ background: 'var(--primary-bg)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>Rank vs who adjusts:</strong> Rank <MathText tex="r" /> counts equilibrium equations, not adjusting variables. <MathText tex="r = 1" /> can be two-sided (<MathText tex="\alpha_A \neq 0, \alpha_B \neq 0" />) or one-sided (<MathText tex="\alpha_A \neq 0, \alpha_B = 0" />). In a 2-variable system, <MathText tex="r = 2" /> would mean both series were already stationary.
            </div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Weak exogeneity (<MathText tex="H_0: \alpha_i = 0" />):</strong> A <MathText tex="t" />-test on each loading identifies the autonomous anchor. From the table below:
            </p>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.5 }}>
              &bull; <strong>Series A (follower):</strong>{' '}
              {alphaA !== null ? <MathText tex={`\\hat{\\alpha}_A = ${alphaA}`} /> : 'n/a'}{' '}
              (<MathText tex={`t = ${metrics.alpha_a_tstat ?? 'n/a'}${pA ? `, p = ${pA}` : ''}`} />) &rarr; rejects <MathText tex="H_0" />.<br />
              &bull; <strong>Series B (leader):</strong>{' '}
              {alphaB !== null ? <MathText tex={`\\hat{\\alpha}_B = ${alphaB}`} /> : 'n/a'}{' '}
              (<MathText tex={`t = ${metrics.alpha_b_tstat ?? 'n/a'}${pB ? `, p = ${pB}` : ''} > 0.05`} />) &rarr; fails to reject; B is weakly exogenous.
            </div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              <strong>Weak-exogeneity trap:</strong> On follower A, VECM RMSE is {metricsA.vecm_rmse?.toFixed(2) ?? 'n/a'} vs {metricsA.varima_rmse?.toFixed(2) ?? 'n/a'} ({pctA !== undefined ? `${pctA.toFixed(1)}%` : 'n/a'}). Toggle to Series B: truth has <MathText tex="\alpha_B = 0" />, but unconstrained estimation yields a small nonzero loading ({alphaB !== null ? <MathText tex={`\\hat{\\alpha}_B = ${alphaB}`} /> : 'n/a'}). After a shock to A, that loading contaminates B ({pctB !== undefined ? `+${Math.abs(pctB).toFixed(1)}%` : 'n/a'} vs differenced VAR RMSE {metricsB.varima_rmse?.toFixed(2) ?? 'n/a'}). Test weak exogeneity and restrict non-adjusting series to zero.
            </p>
          </div>
        );
      }

      return (
        <div style={{ fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            <strong>Forcing VECM without a test:</strong> If series have independent stochastic trends, any linear combination is non-stationary. A forced VECM locks onto a <strong>phantom anchor</strong> &mdash; a spurious long-run vector fit from in-sample noise that fails out of sample.
          </p>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            <strong>U.S. macro check:</strong> On Real GDP, Consumption, and Disposable Income, Johansen Trace {johansenR0.trace_stat ?? 'n/a'} {johansenR0.rejected_95 ? '>' : '<'} {johansenR0.cv_95 ?? 'n/a'} fails to reject <MathText tex="H_0: r = 0" />. No stable level anchor binds this system.
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', lineHeight: 1.5 }}>
            {(() => {
              const varimaGdpLabel = metricsGdp.varima_rmse !== undefined
                ? `$${Number(metricsGdp.varima_rmse).toFixed(1)}B`
                : 'n/a';
              const vecmGdpLabel = metricsGdp.vecm_rmse !== undefined
                ? `$${Number(metricsGdp.vecm_rmse).toFixed(1)}B`
                : 'n/a';
              const penaltyLabel = metricsGdp.pct_worse !== undefined
                ? ` (+${Number(metricsGdp.pct_worse).toFixed(1)}% penalty)`
                : '';
              return (
                <>
                  <strong>Forecasting penalty:</strong> On the Real GDP 16Q holdout, differenced <ModelOrder name="VARIMA">2, 1, 0</ModelOrder> RMSE is{' '}
                  <strong>{varimaGdpLabel}</strong>
                  {' '}while forced VECM reaches{' '}
                  <strong>{vecmGdpLabel}</strong>
                  {penaltyLabel}. Without cointegration, differencing is the right default.
                </>
              );
            })()}
          </div>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-main)' }}>
            <strong>Decision framework:</strong> (1) Run Johansen; if <MathText tex="r = 0" />, fit differenced VAR/VARIMA. (2) If <MathText tex="r \ge 1" />, test <MathText tex="H_0: \alpha_i = 0" /> and restrict non-adjusting series before forecasting with VECM.
          </p>
        </div>
      );
    })();

    return (
      <Layout
        title="5.8 Cointegration & Vector Error Correction (VECM)"
        commentary={
          <div>
            {commentaryTabs}
            {commentaryContent}
          </div>
        }
        dataset={
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
              <div><strong>System Tested:</strong> {currentScenarioData.system_tested}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentScenarioData.sample_desc}
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.82rem', lineHeight: '1.5', border: '1px solid var(--border)' }}>
                <strong>Normalized Cointegrating Vector (Implied Long-Run Equilibrium):</strong><br />
                <MathText tex={ectEquationLatex} />
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                <strong>Estimated Speeds of Adjustment (<MathText tex="\boldsymbol{\alpha}" />):</strong><br />
                {is2Var ? (
                  <>
                    &bull; Series A: {metrics.alpha_a_speed !== undefined
                      ? <><MathText tex={`\\alpha_A = ${metrics.alpha_a_speed.toFixed(4)}`} /> <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>(t = {metrics.alpha_a_tstat ?? 'n/a'})</span></>
                      : 'n/a'}<br />
                    &bull; Series B: {metrics.alpha_b_speed !== undefined
                      ? <><MathText tex={`\\alpha_B = ${metrics.alpha_b_speed > 0 ? `+${metrics.alpha_b_speed.toFixed(4)}` : metrics.alpha_b_speed.toFixed(4)}`} /> <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>(t = {metrics.alpha_b_tstat != null && metrics.alpha_b_tstat > 0 ? `+${metrics.alpha_b_tstat}` : (metrics.alpha_b_tstat ?? 'n/a')})</span></>
                      : 'n/a'}
                    {tab8CommentaryTab === 3 && metrics.alpha_b_pvalue !== undefined && (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#16a34a' }}>
                        * Series B is weakly exogenous in truth (<MathText tex="\alpha_B = 0" />; fails to reject <MathText tex="H_0" />, <MathText tex={`p = ${Number(metrics.alpha_b_pvalue).toFixed(3)}`} />).
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    &bull; Real GDP: {metrics.alpha_gdp_speed !== undefined
                      ? <><MathText tex={`\\alpha_{\\text{GDP}} = ${metrics.alpha_gdp_speed.toFixed(4)}`} /> <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>(weak adjustment)</span></>
                      : 'n/a'}<br />
                    &bull; Consumption: {metrics.alpha_cons_speed !== undefined
                      ? <MathText tex={`\\alpha_{\\text{Cons}} = ${metrics.alpha_cons_speed.toFixed(4)}`} />
                      : 'n/a'}<br />
                    &bull; Income: {metrics.alpha_dpi_speed !== undefined
                      ? <MathText tex={`\\alpha_{\\text{DPI}} = ${metrics.alpha_dpi_speed.toFixed(4)}`} />
                      : 'n/a'}
                  </>
                )}
              </div>
            </div>
          </div>
        }
        controls={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {tab8CommentaryTab === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Visual View:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'levels', label: 'System in Levels (The 2002Q4 Shock)' },
                    { id: 'spread', label: 'Equilibrium Error Spread (ECT_t Mean-Reversion)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setTab8View(m.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: tab8View === m.id ? 'var(--primary)' : 'var(--surface)',
                        color: tab8View === m.id ? '#fff' : 'var(--text-main)',
                        fontWeight: tab8View === m.id ? 700 : 400,
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Forecast Series:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {seriesKeys.map((sKey) => (
                    <button
                      key={sKey}
                      onClick={() => setTab8Series(sKey)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: activeSeriesKey === sKey ? 'var(--primary)' : 'var(--surface)',
                        color: activeSeriesKey === sKey ? '#fff' : 'var(--text-main)',
                        fontWeight: activeSeriesKey === sKey ? 700 : 400,
                      }}
                    >
                      {seriesLabels[sKey] || sKey}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        }
        extraCardTitle={
          tab8CommentaryTab === 1 ? null : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} color="#0284c7" />
              {tab8CommentaryTab === 2
                ? 'Johansen Sequential Cointegration Rank Test'
                : tab8CommentaryTab === 3
                ? 'Speed of Adjustment & Weak Exogeneity Diagnostic (H₀: α = 0)'
                : 'Johansen Cointegration Rank Test (U.S. Macro System)'}
            </span>
          )
        }
        extraCard={
          tab8CommentaryTab === 1 ? null : (
            <div>
              {(tab8CommentaryTab === 2 || tab8CommentaryTab === 4) && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                    {tab8CommentaryTab === 2
                      ? `Evaluates rank sequentially: Trace (${johansenR0.trace_stat ?? 'n/a'} ${johansenR0.rejected_95 ? '>' : '<'} ${johansenR0.cv_95 ?? 'n/a'}) ${johansenR0.rejected_95 ? 'rejects' : 'fails to reject'} H₀: r = 0, and Trace (${johansenR1.trace_stat ?? 'n/a'} ${johansenR1.rejected_95 ? '>' : '<'} ${johansenR1.cv_95 ?? 'n/a'}) ${johansenR1.rejected_95 ? 'rejects' : 'fails to reject'} H₀: r ≤ 1${johansenR0.rejected_95 && !johansenR1.rejected_95 ? ', confirming cointegration rank r = 1' : ''}.`
                      : `Evaluates rank sequentially: Trace (${johansenR0.trace_stat ?? 'n/a'} ${johansenR0.rejected_95 ? '>' : '<'} ${johansenR0.cv_95 ?? 'n/a'}) ${johansenR0.rejected_95 ? 'rejects' : 'fails to reject'} H₀: r = 0.${!johansenR0.rejected_95 ? ' Cointegration is rejected.' : ''}`}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={comparisonTableStyle}>
                      <thead>
                        <tr>
                          <th style={tableHeaderCellStyle}>Hypothesized Rank</th>
                          <th style={tableHeaderCellStyle}>Trace Statistic</th>
                          <th style={tableHeaderCellStyle}>90% CV</th>
                          <th style={tableHeaderCellStyle}>95% CV</th>
                          <th style={tableHeaderCellStyle}>99% CV</th>
                          <th style={tableHeaderCellStyle}>95% Significance Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {johansen.map((row, idx) => (
                          <tr key={idx}>
                            <td style={tableCellStyle}><strong>{row.hypothesized_rank}</strong></td>
                            <td style={{ ...tableCellStyle, fontWeight: 700, color: row.trace_stat > row.cv_95 ? '#16a34a' : 'var(--text-main)' }}>
                              {row.trace_stat.toFixed(2)}
                            </td>
                            <td style={tableCellStyle}>{row.cv_90.toFixed(2)}</td>
                            <td style={tableCellStyle}>{row.cv_95.toFixed(2)}</td>
                            <td style={tableCellStyle}>{row.cv_99.toFixed(2)}</td>
                            <td style={{ ...tableCellStyle, color: row.rejected_95 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                              {row.rejected_95 ? 'Reject Null (Cointegrated)' : 'Fail to Reject Null (No Cointegration)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab8CommentaryTab === 3 && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                    Tests whether each series responds to the equilibrium error (<MathText tex="\text{ECT}_{t-1}" />). Testing both variables illustrates the weak exogeneity framework in action:
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={comparisonTableStyle}>
                      <thead>
                        <tr>
                          <th style={tableHeaderCellStyle}>Variable</th>
                          <th style={tableHeaderCellStyle}>Role in System</th>
                          <th style={tableHeaderCellStyle}>Estimated Speed (<MathText tex="\hat{\alpha}" />)</th>
                          <th style={tableHeaderCellStyle}>Std Error</th>
                          <th style={tableHeaderCellStyle}>t-Statistic</th>
                          <th style={tableHeaderCellStyle}>p-Value</th>
                          <th style={tableHeaderCellStyle}>Weak Exogeneity Status (<MathText tex="H_0: \alpha = 0" />)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={tableCellStyle}><strong>Series A</strong></td>
                          <td style={tableCellStyle}>Follower (Endogenous)</td>
                          <td style={{ ...tableCellStyle, fontWeight: 700, color: '#0284c7' }}>{metrics.alpha_a_speed ?? 'n/a'}</td>
                          <td style={tableCellStyle}>{metrics.alpha_a_stderr ?? 'n/a'}</td>
                          <td style={tableCellStyle}>{metrics.alpha_a_tstat ?? 'n/a'}</td>
                          <td style={tableCellStyle}>{metrics.alpha_a_pvalue !== undefined ? metrics.alpha_a_pvalue.toFixed(4) : 'n/a'}</td>
                          <td style={{ ...tableCellStyle, color: '#16a34a', fontWeight: 600 }}>Rejects <MathText tex="H_0" /> (Actively Adjusts to ECT)</td>
                        </tr>
                        <tr>
                          <td style={tableCellStyle}><strong>Series B</strong></td>
                          <td style={tableCellStyle}>Leader (Autonomous Anchor)</td>
                          <td style={{ ...tableCellStyle, fontWeight: 700, color: '#16a34a' }}>{metrics.alpha_b_speed ?? 'n/a'}</td>
                          <td style={tableCellStyle}>{metrics.alpha_b_stderr ?? 'n/a'}</td>
                          <td style={tableCellStyle}>{metrics.alpha_b_tstat ?? 'n/a'}</td>
                          <td style={tableCellStyle}>{metrics.alpha_b_pvalue !== undefined ? metrics.alpha_b_pvalue.toFixed(4) : 'n/a'}</td>
                          <td style={{ ...tableCellStyle, color: '#16a34a', fontWeight: 600 }}>
                            Fails to Reject <MathText tex="H_0" /> (Weakly Exogenous Anchor)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '0.45rem', padding: '0.5rem 0.75rem', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '6px', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <strong>Weak Exogeneity Insight:</strong> Series B fails to reject <MathText tex="H_0: \alpha_B = 0" />
                    {metrics.alpha_b_pvalue !== undefined ? <> (<MathText tex={`p = ${Number(metrics.alpha_b_pvalue).toFixed(3)} > 0.05`} />)</> : null}
                    , so it is weakly exogenous. Unconstrained VECM still estimates a small nonzero loading
                    {metrics.alpha_b_speed !== undefined ? <> (<MathText tex={`\\hat{\\alpha}_B = ${Number(metrics.alpha_b_speed).toFixed(4)}`} />)</> : null}
                    {metricsB.pct_worse !== undefined ? <> which lets Series A&apos;s shock bleed into B (+{Math.abs(metricsB.pct_worse).toFixed(1)}% error)</> : null}.
                    Restricting <MathText tex="\alpha_B = 0" /> restores differenced-VAR accuracy
                    {metricsB.varima_rmse !== undefined ? <> (RMSE {Number(metricsB.varima_rmse).toFixed(2)})</> : null}.
                  </div>
                </div>
              )}
            </div>
          )
        }
        chartHeight="500px"
        chart={
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {tab8CommentaryTab === 1 && tab8View === 'levels' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.3)', borderRadius: '6px', marginBottom: '0.45rem', fontSize: '0.84rem' }}>
                  <span style={{ color: '#0284c7', fontWeight: 600 }}>
                    System in Levels: Series A and B track closely in long-run parity. At 2002Q4, a sudden supply shock displaces Series A
                    {shockDisplacement != null ? ` +${shockDisplacement.toFixed(1)} units` : ''} above Series B.
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {equilibriumGap != null ? `Equilibrium intercept = ${equilibriumGap.toFixed(1)} units` : 'Equilibrium intercept = n/a'}
                    {' | '}
                    {shockDisplacement != null ? `Shock ECT = +${shockDisplacement.toFixed(1)}` : 'Shock ECT = n/a'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  <span>Two-Variable System in Levels (1975–2006)</span>
                  <span style={{ color: 'var(--text-muted)' }}>Focusing on 1996–2006; scroll / drag to zoom &amp; pan (Y-axis auto-scales)</span>
                </div>
                <div style={{ flex: 1, minHeight: '420px', position: 'relative' }}>
                  <ZoomableChartShell key={`tab1_levels`} defaultDomain={defaultDomain} maxTime={Math.max(1, spreadTimeline.length - 1)}>
                    {(zoomDomain) => {
                      const yDomain = computeDynamicYDomain(spreadTimeline, ['series_a_actual', 'series_b_actual'], zoomDomain);
                      return (
                        <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                          <LineChart data={spreadTimeline} margin={{ top: 15, right: 25, left: 10, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(i) => spreadTimeline[Math.round(i)]?.quarter || ''} />
                            <YAxis domain={yDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => v.toFixed(0)} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                              formatter={(val, name) => [`${Number(val).toFixed(2)} pts`, name]}
                              labelFormatter={(i) => `Quarter: ${spreadTimeline[Math.round(i)]?.quarter || ''}`}
                            />
                            <Legend verticalAlign="top" height={32} />
                            {splitIndex >= 0 && (
                              <ReferenceLine x={splitIndex} stroke="#eab308" strokeDasharray="4 4" label={{ position: 'top', value: 'Shock Origin (2002Q4)', fill: '#eab308', fontSize: 11 }} />
                            )}
                            <Line type="monotone" dataKey="series_a_actual" name="Series A (Displaced / Follower)" stroke="#0284c7" strokeWidth={2.4} dot={{ r: 2 }} isAnimationActive={false} />
                            <Line type="monotone" dataKey="series_b_actual" name="Series B (Anchor)" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    }}
                  </ZoomableChartShell>
                </div>
              </>
            )}

            {tab8CommentaryTab === 1 && tab8View === 'spread' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.3)', borderRadius: '6px', marginBottom: '0.45rem', fontSize: '0.84rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    Equilibrium Error Term (ECT_t): Strictly stationary around ZERO. Notice the +7.6 spike rapidly mean-reverting back to parity!
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Differencing alone sees only Δy_t and forgets this +7.6 level deviation entirely!
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  <span>Equilibrium Error Spread: {currentScenarioData.cointegrating_vector?.equation || 'ECT_t'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Scroll / drag to zoom &amp; pan (Y-axis auto-scales)</span>
                </div>
                <div style={{ flex: 1, minHeight: '420px', position: 'relative' }}>
                  <ZoomableChartShell key={`tab1_spread`} defaultDomain={defaultDomain} maxTime={Math.max(1, spreadTimeline.length - 1)}>
                    {(zoomDomain) => {
                      const rawSpreadDomain = computeDynamicYDomain(spreadTimeline, ['ect_spread'], zoomDomain);
                      // Always include zero on the Y-axis so zero-parity is crystal clear
                      const yDomain = typeof rawSpreadDomain[0] === 'number' && typeof rawSpreadDomain[1] === 'number'
                        ? [Math.min(rawSpreadDomain[0], -2), Math.max(rawSpreadDomain[1], 2)]
                        : rawSpreadDomain;
                      return (
                        <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                          <LineChart data={spreadTimeline} margin={{ top: 15, right: 25, left: 10, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(i) => spreadTimeline[Math.round(i)]?.quarter || ''} />
                            <YAxis domain={yDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => v.toFixed(1)} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                              formatter={(val) => [Number(val).toFixed(4), 'Equilibrium Error (ECT)']}
                              labelFormatter={(i) => `Quarter: ${spreadTimeline[Math.round(i)]?.quarter || ''}`}
                            />
                            <Legend verticalAlign="top" height={32} />
                            <ReferenceLine y={0} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" label={{ position: 'top', value: 'Zero Parity Equilibrium (ECT = 0)', fill: '#3b82f6', fontSize: 11 }} />
                            {splitIndex >= 0 && (
                              <ReferenceLine x={splitIndex} stroke="#eab308" strokeDasharray="4 4" label={{ position: 'top', value: 'Shock Origin (2002Q4)', fill: '#eab308', fontSize: 11 }} />
                            )}
                            <Line type="monotone" dataKey="ect_spread" name="Equilibrium Error (ECT_t)" stroke="#0284c7" strokeWidth={2.4} dot={{ r: 2 }} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    }}
                  </ZoomableChartShell>
                </div>
              </>
            )}

            {tab8CommentaryTab >= 2 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  {currMetrics.pct_worse < 0 ? (
                    <>
                      <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.3)', borderRadius: '6px', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Winner: VECM Rank-1 (Anchored)</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>RMSE {currMetrics.vecm_rmse.toFixed(2)} {currentScenarioData.units || ''}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#16a34a', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>{Math.abs(currMetrics.pct_worse).toFixed(1)}% Lower Error</span>
                      </div>
                      <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '6px', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Differenced VAR (Extrapolates Shock)</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>RMSE {currMetrics.varima_rmse.toFixed(2)} {currentScenarioData.units || ''}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#dc2626', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>Unanchored Drift</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '6px', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>
                            {tab8CommentaryTab === 3 && activeSeriesKey === 'series_b' ? 'Unconstrained VECM (Weak Exogeneity Trap)' : 'Forced VECM Rank-1 (Phantom Anchor)'}
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>RMSE {is2Var ? `${currMetrics.vecm_rmse.toFixed(2)} ${currentScenarioData.units || ''}` : `$${currMetrics.vecm_rmse.toFixed(1)}B`}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#dc2626', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>+{currMetrics.pct_worse.toFixed(1)}% Worse</span>
                      </div>
                      <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.3)', borderRadius: '6px', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
                            Winner: Differenced {is2Var ? 'VAR' : 'VARIMA(2,1,0)'}
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>RMSE {is2Var ? `${currMetrics.varima_rmse.toFixed(2)} ${currentScenarioData.units || ''}` : `$${currMetrics.varima_rmse.toFixed(1)}B`}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#16a34a', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>Correct Baseline</span>
                      </div>
                    </>
                  )}
                </div>

                {tab8CommentaryTab === 3 && activeSeriesKey === 'series_b' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '0.45rem' }}>
                    <strong style={{ color: '#dc2626' }}>Weak-exogeneity trap:</strong> Series B is an autonomous anchor in the DGP (<MathText tex="\alpha_B = 0" />
                    {metrics.alpha_b_pvalue !== undefined ? <>; fails to reject <MathText tex="H_0" />, <MathText tex={`p = ${Number(metrics.alpha_b_pvalue).toFixed(3)}`} /></> : null}
                    ). Unconstrained estimation still yields a small nonzero loading
                    {metrics.alpha_b_speed !== undefined ? <> (<MathText tex={`\\hat{\\alpha}_B = ${Number(metrics.alpha_b_speed).toFixed(4)}`} />)</> : null}
                    . When Series A spiked before 2002Q4 (<MathText tex="\text{ECT} > 0" />), that loading pulled B and contaminated its forecast
                    {metricsB.pct_worse !== undefined ? <> (+{Math.abs(metricsB.pct_worse).toFixed(1)}% error)</> : null}
                    . Differenced VAR has no ECT
                    {metricsB.varima_rmse !== undefined ? <> (RMSE {Number(metricsB.varima_rmse).toFixed(2)})</> : null}.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  <span>
                    {seriesLabels[activeSeriesKey] || activeSeriesKey} 16Q Holdout: VECM vs VARIMA
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{currentScenarioData.units || ''} (Focus 1999–2006; drag/scroll to pan, Y-axis auto-scales)</span>
                </div>
                <div style={{ flex: 1, minHeight: '420px', position: 'relative' }}>
                  <ZoomableChartShell key={`${activeScenarioKey}_${activeSeriesKey}`} defaultDomain={defaultDomain} maxTime={Math.max(1, spreadTimeline.length - 1)}>
                    {(zoomDomain) => {
                      const yDomain = computeDynamicYDomain(spreadTimeline, [actualKey, varimaKey, vecmKey], zoomDomain);
                      return (
                        <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                          <LineChart data={spreadTimeline} margin={{ top: 15, right: 25, left: 10, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(i) => spreadTimeline[Math.round(i)]?.quarter || ''} />
                            <YAxis domain={yDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(v) => is2Var ? v.toFixed(0) : `$${v.toFixed(0)}B`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                              formatter={(val) => (val !== null && val !== undefined ? (is2Var ? `${Number(val).toFixed(2)} pts` : `$${Number(val).toFixed(1)}B`) : 'N/A')}
                              labelFormatter={(i) => `Quarter: ${spreadTimeline[Math.round(i)]?.quarter || ''}`}
                            />
                            <Legend verticalAlign="top" height={32} />
                            {splitIndex >= 0 && (
                              <ReferenceLine x={splitIndex} stroke="#eab308" strokeDasharray="4 4" label={{ position: 'top', value: 'Split Origin (2002Q4)', fill: '#eab308', fontSize: 11 }} />
                            )}
                            <Line type="monotone" dataKey={actualKey} name={`Actual ${seriesLabels[activeSeriesKey] || activeSeriesKey}`} stroke="#334155" strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
                            <Line
                              type="monotone"
                              dataKey={varimaKey}
                              name={currMetrics.pct_worse < 0 ? 'Differenced VAR (Extrapolates Shock)' : 'Differenced VARIMA (Wins)'}
                              stroke={currMetrics.pct_worse < 0 ? '#dc2626' : '#16a34a'}
                              strokeWidth={2.5}
                              strokeDasharray="3 3"
                              dot={{ r: 3 }}
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                            <Line
                              type="monotone"
                              dataKey={vecmKey}
                              name={
                                currMetrics.pct_worse < 0
                                  ? 'VECM Rank-1 Forecast (Wins, Anchored)'
                                  : tab8CommentaryTab === 3 && activeSeriesKey === 'series_b'
                                  ? 'Unconstrained VECM (Shock Contamination)'
                                  : 'VECM Rank-1 (Phantom Anchor)'
                              }
                              stroke={currMetrics.pct_worse < 0 ? '#16a34a' : '#dc2626'}
                              strokeWidth={2.5}
                              strokeDasharray="5 5"
                              dot={{ r: 3 }}
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    }}
                  </ZoomableChartShell>
                </div>
              </>
            )}
          </div>
        }
      />
    );
  }

  return null;
}
