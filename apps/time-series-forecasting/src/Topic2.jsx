import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Scatter, BarChart, Bar, Cell } from 'recharts';
import { Info, BrainCircuit } from 'lucide-react';

import { ZoomableChartShell } from './charts';
import { formatValue } from './utils';
import { MathText, ModelOrder } from './MathText';

const formatOrderLabel = (order) => String(order)
  .replace('x', ' × ')
  .replace(' [Log Transformed]', ' (log scale)');

/** Display (p, 0, q) as ARMA(p, q) when the integrated order is zero. */
const formatAsArma = (order) => {
  const match = String(order).match(/\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/);
  if (!match) return String(order);
  const [, p, d, q] = match;
  if (d === '0') return `(${p}, ${q})`;
  return String(order);
};

function ChartWithZoom({ chartData, lines, trainSize, timeLabels, yDomain = ['auto', 'auto'], hideXAxis = false }) {
  const maxTime = chartData.length > 0 ? chartData[chartData.length - 1].time : 100;

  const formatXAxis = (val) => {
    const idx = Math.round(val);
    if (timeLabels && timeLabels[idx]) return timeLabels[idx];
    if (hideXAxis) return ''; 
    return typeof val === 'number' ? Number(val.toFixed(0)).toString() : val;
  };
  
  const formatTooltipXAxis = (val) => {
    const idx = Math.round(val);
    if (timeLabels && timeLabels[idx]) return timeLabels[idx];
    return typeof val === 'number' ? Number(val.toFixed(0)).toString() : val;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ width: '100%', flex: 1, minHeight: '400px', height: '100%', paddingBottom: '20px' }}>
        <ZoomableChartShell defaultDomain={[0, maxTime]} maxTime={maxTime} data={chartData}>
          {(zoomDomain, computeYDomain, autoYDomain) => {
            const activeYDomain = yDomain && yDomain[0] !== 'auto' ? yDomain : autoYDomain;
            return (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <LineChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatXAxis} />
                  <YAxis domain={activeYDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                <Tooltip 
                  isAnimationActive={false} 
                  formatter={formatValue} 
                  labelFormatter={(l) => `Time: ${formatTooltipXAxis(l)}`} 
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} 
                />
                <Legend style={{ pointerEvents: 'none' }}/>
                <ReferenceLine x={trainSize - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast Start', fill: 'var(--text-muted)' }} />
                {lines}
              </LineChart>
              </ResponsiveContainer>
            );
          }}
        </ZoomableChartShell>
      </div>
    </div>
  );
}

const Layout = ({ commentary, dataset, controls, chart, chartHeight = '550px' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    {/* Top Panels */}
    <div className="top-panels">
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><BrainCircuit size={18} /> Model Behaviour</h4>
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
    
    {/* Controls */}
    {controls && (
      <div className="glass controls-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
        {controls}
      </div>
    )}

    {/* Chart */}
    <div className="glass chart-container" style={{ width: '100%', height: chartHeight, display: 'flex', flexDirection: 'column' }}>
      {chart}
    </div>
  </div>
);

export default function Topic2({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [p, setP] = useState(2);
  const [q, setQ] = useState(1);
  const [tab1InspectTime, setTab1InspectTime] = useState(80);
  const [tab2Dataset, setTab2Dataset] = useState('MA1');
  const [tab3Dataset, setTab3Dataset] = useState('Sunspots');
  const [autoArimaMode, setAutoArimaMode] = useState('manual');
  const [useExog, setUseExog] = useState(true);
  const [showCycles, setShowCycles] = useState(true);
  const [tab4SubTab, setTab4SubTab] = useState(1);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}topic2_data.json?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading Topic 2 data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>Loading ARMA Models... (This might take a moment if the python script is still running)</div>;
  }

  // Removed Layout from inside Topic2

  const renderTab1 = () => {
    const tabData = data.tab1[`p${p}_q${q}`];
    if (!tabData) return <div>Data not found</div>;
    const maxLag = Math.max(p, q, 1);
    const inspectTime = Math.min(Math.max(tab1InspectTime, maxLag), tabData.train_size - 1);
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      GeneratedMean: idx < tabData.train_size ? tabData.generated_mean[idx] : null,
      Forecast: idx >= tabData.train_size ? tabData.out_sample[idx - tabData.train_size] : null
    }));
    const arPoints = tabData.phi.map((coefficient, idx) => ({
      time: inspectTime - idx - 1,
      value: tabData.actual[inspectTime - idx - 1],
      contribution: coefficient * tabData.actual[inspectTime - idx - 1],
      coefficient
    }));
    const shockPoints = tabData.theta.map((coefficient, idx) => ({
      time: inspectTime - idx - 1,
      value: tabData.innovations[inspectTime - idx - 1],
      contribution: coefficient * tabData.innovations[inspectTime - idx - 1],
      coefficient
    }));
    const contributionData = [
      ...arPoints.map((point, idx) => ({ label: `AR value t−${idx + 1}`, value: point.contribution, coefficient: point.coefficient, color: 'var(--teal)' })),
      ...shockPoints.map((point, idx) => ({ label: `Shock t−${idx + 1}`, value: point.contribution, coefficient: point.coefficient, color: 'var(--gold)' }))
    ];
    const predictedMean = contributionData.reduce((sum, item) => sum + item.value, tabData.intercept);
    const xMax = chartData.length - 1;

    const controls = (
      <>
        <div className="slider-container" style={{ flex: 1, minWidth: '150px' }}>
          <label>
            <span><MathText>p</MathText> (autoregressive order)</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{p}</span>
          </label>
          <input type="range" min="0" max="8" step="1" value={p} onChange={(e) => setP(parseInt(e.target.value))} />
        </div>
        <div className="slider-container" style={{ flex: 1, minWidth: '150px' }}>
          <label>
            <span><MathText>q</MathText> (moving-average order)</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{q}</span>
          </label>
          <input type="range" min="0" max="8" step="1" value={q} onChange={(e) => setQ(parseInt(e.target.value))} />
        </div>
        <div className="slider-container" style={{ flex: 1.4, minWidth: '230px' }}>
          <label>
            <span>Inspect training time</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>t = {inspectTime}</span>
          </label>
          <input type="range" min={maxLag} max={tabData.train_size - 1} step="1" value={inspectTime} onChange={(e) => setTab1InspectTime(parseInt(e.target.value))} />
        </div>
      </>
    );

    const commentary = (
      <div>
        <p><strong>How an ARMA value is formed:</strong> the conditional mean combines an intercept, the previous <MathText>p</MathText> observations, and the previous <MathText>q</MathText> shocks. The current observation then equals that predictable mean plus a new, unpredictable shock.</p>
        <p><strong>AR memory:</strong> blue circles mark the observations <MathText tex="y_{t-1},\ldots,y_{t-p}" />. Each contributes <MathText tex="\phi_i y_{t-i}" />. Higher <MathText>p</MathText> means more past values can shape the current conditional mean.</p>
        <p><strong>MA shock memory:</strong> amber circles mark past innovations <MathText tex="\varepsilon_{t-1},\ldots,\varepsilon_{t-q}" />. Each contributes <MathText tex="\theta_j\varepsilon_{t-j}" />. These are earlier forecast errors, not moving averages of the observed series.</p>
        <p><strong>How to read the lower graph:</strong> positive bars pull the conditional mean upward and negative bars pull it downward. Their sum is <MathText tex="\hat{y}_t" />. The difference <MathText tex="y_t - \hat{y}_t = \varepsilon_t" /> is the new shock that could not have been known at <MathText tex="t - 1" />.</p>
        <p><strong>Out-of-sample forecast:</strong> after the dashed split, future shocks are unknown and therefore set to their expectation of zero. AR and MA effects decay as the horizon increases, so a stationary ARMA forecast returns toward its long-run mean.</p>
        {p === 0 && q === 0 && <p><strong>Current selection:</strong> <ModelOrder name="ARMA">0, 0</ModelOrder> is white noise. It has no past-value or past-shock contributions, so its conditional mean is zero.</p>}
      </div>
    );

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ width: '100%', height: '500px' }}>
          <ZoomableChartShell defaultDomain={[0, xMax]} maxTime={xMax} data={chartData} dataKeys={['Actual', 'GeneratedMean', 'Forecast']}>
            {(zoomDomain, computeYDomain, autoYDomain) => (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  style={{ pointerEvents: 'auto' }}
                  onClick={(event) => {
                    const time = Number(event?.activeLabel);
                    if (Number.isFinite(time) && time >= maxLag && time < tabData.train_size) setTab1InspectTime(Math.round(time));
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis domain={autoYDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={(value) => `Time: ${value}`} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                  <Legend />
                  <ReferenceLine x={tabData.train_size - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast start', fill: 'var(--text-muted)' }} />
                  <ReferenceLine x={inspectTime} stroke="var(--text-main)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={1.6} dot={false} name="Observed series yₜ" isAnimationActive={false} />
                  <Line type="monotone" dataKey="GeneratedMean" stroke="var(--coral)" strokeWidth={2} dot={false} name="Generated conditional mean ŷₜ" isAnimationActive={false} />
                  <Line type="monotone" dataKey="Forecast" stroke="var(--chart-violet)" strokeWidth={3} strokeDasharray="5 5" dot={false} name={`ARMA(${p},${q}) out-of-sample forecast`} isAnimationActive={false} />
                  <Scatter data={arPoints} dataKey="value" fill="var(--teal)" name="AR lag inputs" isAnimationActive={false} />
                  <Scatter data={shockPoints} dataKey="value" fill="var(--gold)" name="Past-shock inputs" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ZoomableChartShell>
        </div>
        <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-main)', fontSize: '0.9rem' }}>
          <strong>Conditional-mean anatomy at t = {inspectTime}:</strong>{' '}
          <MathText tex={`\\hat{y}_t = c + \\sum_{i=1}^{p}\\phi_i y_{t-i} + \\sum_{j=1}^{q}\\theta_j\\varepsilon_{t-j} = ${predictedMean.toFixed(3)}`} />
        </div>
        <div style={{ width: '100%', height: '220px' }}>
          {contributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionData} margin={{ top: 8, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="label" interval={0} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                <Tooltip
                  formatter={(value, name, item) => [formatValue(value), `Contribution (coefficient ${item.payload.coefficient.toFixed(3)})`]}
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                />
                <ReferenceLine y={0} stroke="var(--text-main)" />
                <Bar dataKey="value" name="Contribution to conditional mean" isAnimationActive={false}>
                  {contributionData.map((entry, idx) => <Cell key={`${entry.label}-${idx}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
              ARMA(0,0) has no lag contributions; its conditional mean is zero.
            </div>
          )}
        </div>
      </div>
    );

    return <Layout controls={controls} commentary={commentary} dataset={<p>Synthetic <ModelOrder name="ARMA">p, q</ModelOrder> process with 100 training observations and 20 held-out observations. Here <MathText>p = {p}</MathText> is the number of autoregressive lags and <MathText>q = {q}</MathText> is the number of lagged shock terms. Every order uses the same innovation sequence so differences reflect model structure.</p>} chart={chart} chartHeight="800px" />;
  };

  const renderTab2 = () => {
    const tabData = data.tab2[tab2Dataset];
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      ARIMA_InSample: idx < tabData.train_size ? tabData.arima_in[idx] : null,
      HW_InSample: idx < tabData.train_size ? tabData.hw_in[idx] : null,
      ARIMA_Forecast: idx >= tabData.train_size ? tabData.arima_out[idx - tabData.train_size] : null,
      HW_Forecast: idx >= tabData.train_size ? tabData.hw_out[idx - tabData.train_size] : null,
    }));

    const controls = (
      <select className="dropdown" value={tab2Dataset} onChange={e => setTab2Dataset(e.target.value)} style={{ padding: '0.5rem', width: '100%', background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
        <option value="MA1">MA(1) Transient Shock</option>
        <option value="AR2">AR(2) Variable Cycle</option>
        <option value="AR1">AR(1) High-Frequency Mean Reversion</option>
      </select>
    );

    const commentary = (
      <p>
        <strong>Damping effect:</strong> under a correctly specified stationary model, the minimum-MSE forecast converges toward the unconditional mean as the horizon grows.
        <br/><br/>
        {tab2Dataset === 'MA1' && <><ModelOrder name="ARMA">0, 1</ModelOrder> captures a one-lag transient shock. After <MathText>q = 1</MathText> lag, the innovation has no further direct effect, so the forecast snaps back to the mean. Holt-Winters instead decays gradually.</>}
        {tab2Dataset === 'AR2' && <><ModelOrder name="ARMA">2, 0</ModelOrder> uses two autoregressive roots to represent an aperiodic oscillation. Its long-horizon forecast still damps toward the mean, while Holt-Winters cannot reproduce the changing cycle length.</>}
        {tab2Dataset === 'AR1' && <><ModelOrder name="ARMA">1, 0</ModelOrder> captures high-frequency mean reversion. Holt-Winters responds too slowly to the alternating pattern.</>}
      </p>
    );

    const chart = (
      <ChartWithZoom 
        chartData={chartData} 
        trainSize={tabData.train_size} 
        timeLabels={tabData.time_label}
        lines={[
          <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
          <Line key="4" type="monotone" dataKey="HW_InSample" stroke="var(--teal)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
          <Line key="2" type="monotone" dataKey="ARIMA_InSample" stroke="var(--coral)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`ARMA In-Sample`} />,
          <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="var(--teal)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
          <Line key="3" type="monotone" dataKey="ARIMA_Forecast" stroke="var(--coral)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`ARMA ${formatAsArma(tabData.arima_order)} Forecast`} />
        ]} 
      />
    );

    const datasetBox = (
      <p>
        {tab2Dataset === 'MA1' && <>Synthetic MA(1) process with coefficient <MathText tex="\theta = 0.9" />. A 20-unit shock is injected at <MathText tex="t = 99" />, echoes once at <MathText tex="t = 100" />, and then leaves no direct MA effect.</>}
        {tab2Dataset === 'AR2' && <>Synthetic AR(2) process with complex roots, producing a damped aperiodic cycle.</>}
        {tab2Dataset === 'AR1' && <>Synthetic AR(1) process with a negative coefficient, producing rapid alternation around the mean.</>}
      </p>
    );

    return <Layout controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} />;
  };

  const renderTab3 = () => {
    const tabData = data.tab3[tab3Dataset];
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      ARIMA_InSample: idx < tabData.train_size ? tabData.arima_in[idx] : null,
      HW_InSample: idx < tabData.train_size ? tabData.hw_in[idx] : null,
      ARIMA_Forecast: idx >= tabData.train_size ? tabData.arima_out[idx - tabData.train_size] : null,
      HW_Forecast: idx >= tabData.train_size ? tabData.hw_out[idx - tabData.train_size] : null,
    }));

    const controls = (
      <select className="dropdown" value={tab3Dataset} onChange={e => setTab3Dataset(e.target.value)} style={{ padding: '0.5rem', width: '100%', background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
        <option value="Sunspots">Sunspot Activity (Cycle)</option>
        <option value="TBill">US Treasury Bill (Inertia)</option>
      </select>
    );

    const commentary = (
      <p>
        <strong>From ARMA to ARIMA:</strong> Sections 2.1–2.2 used stationary <ModelOrder name="ARMA">p, q</ModelOrder> models — autoregressive memory plus moving-average shock memory. The “I” in ARIMA stands for <em>integration</em>: the series is differenced <MathText>d</MathText> times before an ARMA model is fit, written <ModelOrder name="ARIMA">p, d, q</ModelOrder>. When <MathText>d = 0</MathText>, ARIMA collapses back to ARMA. The demos below stay at <MathText>d = 0</MathText>; Section 2.4 shows why choosing <MathText>d</MathText> is a modelling decision, not only an AIC decision.
        <br/><br/>
        {tab3Dataset === 'Sunspots' && (
          <>
            Sunspot counts rise and fall with the solar magnetic cycle. Cycle length is not fixed: peaks are typically 8–16 years apart (about 11 years on average), so a rigid seasonal calendar misaligns. Holt-Winters forces an 11-year period and falls out of phase. <ModelOrder name="ARMA">9, 0</ModelOrder> instead uses deep autoregressive memory to track the variable cycle.
            <br/><br/>
            <strong>How to predict cycle AND magnitude?</strong> ARMA handles aperiodic cycle timing better than fixed-seasonality models, but long-horizon forecasts still damp toward the mean. Predicting both variable frequency and amplitude usually needs richer tools (e.g. state-space models with time-varying seasonality, or nonlinear methods).
          </>
        )}
        {tab3Dataset === 'TBill' && (
          <>
            The 3-month Treasury bill rate is a short-term U.S. funding benchmark: it moves with monetary policy and market conditions, and tends to be persistent from month to month. <ModelOrder name="ARMA">3, 1</ModelOrder> was selected with Box–Jenkins diagnostics among stationary candidates (<MathText>d = 0</MathText>). Its AR terms capture that inertia and its MA term reacts to recent shocks; Holt-Winters instead extrapolates a linear trend.
          </>
        )}
      </p>
    );

    let cycleLines = [];
    if (tab3Dataset === 'Sunspots' && showCycles) {
      let lastPeakIdx = -1;
      for (let i = 1; i < tabData.actual.length - 1; i++) {
        const val = tabData.actual[i];
        if (val > tabData.actual[i-1] && val > tabData.actual[i+1] && val > 40) {
          if (lastPeakIdx === -1 || (i - lastPeakIdx) > 6) {
            const length = lastPeakIdx === -1 ? i : (i - lastPeakIdx);
            cycleLines.push(
              <ReferenceLine 
                key={`c${i}`} 
                x={i} 
                stroke="var(--teal)"
                strokeWidth={2} 
                strokeDasharray="3 3" 
                strokeOpacity={0.5} 
                label={{ value: `${length} yrs`, position: 'insideTopRight', fill: 'var(--teal)', fontSize: 10, offset: 5 }}
              />
            );
            lastPeakIdx = i;
          }
        }
      }
    }

    const chart = (
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {tab3Dataset === 'Sunspots' && (
          <button 
            onClick={() => setShowCycles(!showCycles)} 
            style={{ position: 'absolute', top: 0, left: 20, zIndex: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.9, backdropFilter: 'blur(4px)' }}
          >
            {showCycles ? 'Hide Cycle Lengths' : 'Show Cycle Lengths'}
          </button>
        )}
        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          timeLabels={tabData.time_label}
          hideXAxis={tab3Dataset === 'TBill'}
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="4" type="monotone" dataKey="HW_InSample" stroke="var(--teal)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
            <Line key="2" type="monotone" dataKey="ARIMA_InSample" stroke="var(--coral)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`ARMA In-Sample`} />,
            <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="var(--teal)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
            <Line key="3" type="monotone" dataKey="ARIMA_Forecast" stroke="var(--coral)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`ARMA ${formatAsArma(tabData.arima_order)} Forecast`} />,
            ...cycleLines
          ]} 
        />
      </div>
    );

    const datasetBox = (
      <div>
        <p>
          {tab3Dataset === 'Sunspots'
            ? <>
                <strong>Background:</strong> Yearly mean sunspot numbers (SIDC / Wolf series), 1700–2008. Dark patches on the Sun mark magnetic activity; astronomers have counted them for centuries, which makes this one of the longest continuous natural time series. Activity waxes and wanes in irregular ~11-year cycles whose length and height both vary — useful for testing models that must track aperiodic oscillation rather than a fixed calendar season.
                <br /><br />
                <ModelOrder name="ARMA">9, 0</ModelOrder> is compared with Holt-Winters using a fixed 11-year seasonal period.
              </>
            : <>
                <strong>Background:</strong> Monthly U.S. 3-month Treasury bill secondary-market rate. T-bills are short-term government securities; this rate is a standard proxy for the risk-free short rate and closely tracks monetary-policy stance. Over long samples it shows strong month-to-month inertia, but rates are usually treated as mean-reverting: they do not wander without bound the way a pure random walk would.
                <br /><br />
                <ModelOrder name="ARMA">3, 1</ModelOrder> is compared with a Holt linear-trend model.
              </>}
        </p>
        {tab3Dataset === 'TBill' && (
          <div style={{ marginTop: '1rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Box-Jenkins Model Selection (AIC Scores, d = 0):</strong>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '4px' }}>Model</th>
                  <th style={{ padding: '4px' }}>AIC</th>
                  <th style={{ padding: '4px' }}>BIC</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARMA">1, 0</ModelOrder></td><td style={{ padding: '4px' }}>281.43</td><td style={{ padding: '4px' }}>289.00</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARMA">2, 0</ModelOrder></td><td style={{ padding: '4px' }}>283.42</td><td style={{ padding: '4px' }}>293.51</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARMA">3, 0</ModelOrder></td><td style={{ padding: '4px' }}>279.19</td><td style={{ padding: '4px' }}>291.80</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARMA">1, 1</ModelOrder></td><td style={{ padding: '4px' }}>283.40</td><td style={{ padding: '4px' }}>293.49</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARMA">2, 1</ModelOrder></td><td style={{ padding: '4px' }}>280.03</td><td style={{ padding: '4px' }}>292.64</td></tr>
                <tr style={{ background: 'rgba(59, 130, 246, 0.1)' }}><td style={{ padding: '4px' }}><strong><ModelOrder name="ARMA">3, 1</ModelOrder></strong></td><td style={{ padding: '4px' }}><strong>277.02 (selected)</strong></td><td style={{ padding: '4px' }}><strong>292.15</strong></td></tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              The search is constrained to <MathText>d = 0</MathText> because the application assumes <em>mean-reverting</em> rates: after a shock, the bill rate is expected to drift back toward a long-run normal level rather than treat every change as a permanent new plateau. Setting <MathText>d = 1</MathText> would impose a unit root (random-walk-like behaviour in levels). That can improve in-sample AIC, but it conflicts with the economic view that short rates eventually return — the same tension Section 2.4 explores with unemployment.
            </p>
          </div>
        )}
      </div>
    );

    return <Layout controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} />;
  };

  const renderTab4 = () => {
    const tabData = data.tab4;
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      InSample: idx < tabData.train_size ? (autoArimaMode === 'blind' ? tabData.blind_in[idx] : tabData.manual_in[idx]) : null,
      Forecast: idx >= tabData.train_size ? (autoArimaMode === 'blind' ? tabData.blind_out[idx - tabData.train_size] : tabData.manual_out[idx - tabData.train_size]) : null
    }));

    const subTabSelector = (
      <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          className={`tab ${tab4SubTab === 1 ? 'active' : ''}`}
          onClick={() => setTab4SubTab(1)}
        >
          1 Forecast Demo (Unemployment)
        </button>
        <button
          className={`tab ${tab4SubTab === 2 ? 'active' : ''}`}
          onClick={() => setTab4SubTab(2)}
        >
          2 AIC Primer: How Information Criteria Work
        </button>
      </div>
    );

    if (tab4SubTab === 1) {
      const controls = (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button 
            style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: autoArimaMode === 'blind' ? 'var(--primary)' : 'var(--surface)', color: autoArimaMode === 'blind' ? 'white' : 'var(--text-main)' }} 
            onClick={() => setAutoArimaMode('blind')}
          >
            Blind Auto-ARIMA <MathText>{tabData.blind_order}</MathText>
          </button>
          <button 
            style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: autoArimaMode === 'manual' ? 'var(--primary)' : 'var(--surface)', color: autoArimaMode === 'manual' ? 'white' : 'var(--text-main)' }} 
            onClick={() => setAutoArimaMode('manual')}
          >
            Constrained ARIMA <MathText>{tabData.manual_order}</MathText>
          </button>
        </div>
      );

      const commentary = (
        <p>
          Auto-ARIMA searches candidate orders <MathText>(p, d, q)</MathText> and selects the lowest information criterion. The search still needs domain constraints.
          <br/><br/>
          {autoArimaMode === 'manual'
            ? <>Unemployment is assumed to be mean-reverting, so the search is constrained to <MathText>d = 0</MathText>. The selected <ModelOrder name="ARIMA">3, 0, 1</ModelOrder> forecast damps toward the historical level of approximately 6%.</>
            : <>The unconstrained search selects <MathText>d = 1</MathText>, introducing a unit root. It treats the recent 8.8% spike as a permanent level shift and forecasts a plateau near 9%.</>}
        </p>
      );

      const chart = (
        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          timeLabels={tabData.time_label}
          hideXAxis={true}
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="2" type="monotone" dataKey="InSample" stroke="var(--coral)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="In-Sample Fit" />,
            <Line key="3" type="monotone" dataKey="Forecast" stroke="var(--coral)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Forecast" />
          ]} 
        />
      );

      return (
        <div>
          {subTabSelector}
          <Layout controls={controls} commentary={commentary} dataset={<p>US unemployment rate. The unconstrained search selects <MathText>d = 1</MathText>; the domain-informed search imposes <MathText>d = 0</MathText> to represent mean reversion.</p>} chart={chart} />
        </div>
      );
    }

    // Sub-tab 2: AIC Primer
    const primerCommentary = (
      <div style={{ fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <p>
          <strong>Why information criteria exist:</strong> Adding more parameters (higher lag order <MathText tex="p" /> or moving-average order <MathText tex="q" />) always improves in-sample fit. Without a penalty, model selection would always pick the most complex model, leading to severe overfitting and poor out-of-sample forecasts.
        </p>
        <p>
          <strong>What is RSS (Residual Sum of Squares)?</strong> In any fitted time series model, the residual at step <MathText tex="t" /> is the in-sample prediction error <MathText tex="\hat{\varepsilon}_t = y_t - \hat{y}_t" />. The Residual Sum of Squares is the total squared in-sample error:
        </p>
        <div style={{ background: 'var(--primary-bg)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
          <MathText tex="\text{RSS} = \sum_{t=1}^{T} \hat{\varepsilon}_t^2 = \sum_{t=1}^{T} (y_t - \hat{y}_t)^2" />
        </div>
        <p>
          Smaller <MathText tex="\text{RSS}" /> means the model fits historical data closer. Because estimation algorithms optimize parameters to minimize squared errors, adding extra parameters can never increase in-sample error: <MathText tex="\text{RSS}_{\text{larger}} \le \text{RSS}_{\text{smaller}}" /> always holds on training data.
        </p>
        <p>
          <strong>How AIC penalises complexity:</strong> Under Gaussian errors, the maximized log-likelihood is directly linked to residual variance: <MathText tex="\ln(\hat{L}) \approx -\frac{T}{2}\ln(\text{RSS}/T) + \text{constant}" />. Substituting this into Akaike&rsquo;s criterion gives the standard regression and time-series formula:
        </p>
        <div style={{ background: 'var(--primary-bg)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <MathText tex="\text{AIC} = -2\ln(\hat{L}) + 2k \approx T\ln\left(\frac{\text{RSS}}{T}\right) + 2k" />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            where <MathText tex="T" /> is sample size, <MathText tex="k" /> is number of estimated parameters, and <MathText tex="\text{RSS}" /> is residual sum of squares
          </div>
        </div>
        <p>
          <strong>How to read the trade-off:</strong> Lower AIC is better. The first term rewards fit (smaller <MathText tex="\text{RSS}" /> makes <MathText tex="T\ln(\text{RSS}/T)" /> more negative). The second term, <MathText tex="+2k" />, penalises complexity. Each added parameter costs exactly <strong>+2 points</strong>. Therefore, a new parameter is only accepted if the fit improvement reduces deviance <MathText tex="-2\ln \hat{L}" /> by more than 2 points.
        </p>
        <p>
          <strong>What is an F-test and F-value?</strong> When deciding whether to add <MathText tex="m" /> extra parameters (comparing a simpler &ldquo;restricted&rdquo; model with <MathText tex="\text{RSS}_r" /> to an expanded &ldquo;unrestricted&rdquo; model with <MathText tex="\text{RSS}_u" />), classical statistics tests the null hypothesis <MathText tex="H_0" /> that the extra coefficients are all zero using an <MathText tex="F" />-test:
        </p>
        <div style={{ background: 'var(--primary-bg)', padding: '0.55rem', borderRadius: '6px', textAlign: 'center' }}>
          <MathText tex="F = \frac{(\text{RSS}_r - \text{RSS}_u) / m}{\text{RSS}_u / (T - k_u)}" />
        </div>
        <p>
          The <MathText tex="F" />-value measures the relative reduction in <MathText tex="\text{RSS}" /> per added parameter divided by estimated noise variance per remaining degree of freedom (<MathText tex="T - k_u" />). If the extra parameters capture only random noise, <MathText tex="F \approx 1" /> on average. For a single added parameter (<MathText tex="m = 1" />), AIC&rsquo;s inclusion rule (<MathText tex="\Delta\text{AIC} < 0" />) corresponds mathematically to an <MathText tex="F" />-cutoff of <MathText tex="F \approx 2.0" />.
        </p>
      </div>
    );

    const primerDataset = (
      <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <p>
          <strong>Worked Example from Section 2.3 (T-Bills):</strong> In Section 2.3 Tab 3, we compared candidate ARMA models for the 3-month Treasury bill rate with <MathText tex="d = 0" />:
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '3px' }}>Model</th>
              <th style={{ padding: '3px' }}>k</th>
              <th style={{ padding: '3px' }}>AIC</th>
              <th style={{ padding: '3px' }}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '3px' }}><ModelOrder name="ARMA">1, 0</ModelOrder></td>
              <td style={{ padding: '3px' }}>1</td>
              <td style={{ padding: '3px' }}>281.43</td>
              <td style={{ padding: '3px' }}>Baseline</td>
            </tr>
            <tr>
              <td style={{ padding: '3px' }}><ModelOrder name="ARMA">2, 0</ModelOrder></td>
              <td style={{ padding: '3px' }}>2</td>
              <td style={{ padding: '3px' }}>283.42</td>
              <td style={{ padding: '3px', color: 'var(--text-muted)' }}>Fit didn't beat +2 penalty</td>
            </tr>
            <tr>
              <td style={{ padding: '3px' }}><ModelOrder name="ARMA">3, 0</ModelOrder></td>
              <td style={{ padding: '3px' }}>3</td>
              <td style={{ padding: '3px' }}>279.19</td>
              <td style={{ padding: '3px', color: 'var(--text-muted)' }}>Better fit</td>
            </tr>
            <tr style={{ background: 'rgba(59, 130, 246, 0.1)', fontWeight: 600 }}>
              <td style={{ padding: '3px' }}><ModelOrder name="ARMA">3, 1</ModelOrder></td>
              <td style={{ padding: '3px' }}>4</td>
              <td style={{ padding: '3px' }}>277.02</td>
              <td style={{ padding: '3px', color: 'var(--primary)' }}>Selected (lowest AIC)</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Moving from ARMA(1,0) to ARMA(3,1) added 3 parameters (+6 penalty), but the fit improvement (-10.41) exceeded the penalty, producing a net 4.41 point drop in AIC.
        </p>
      </div>
    );

    const primerChart = (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              1. AIC (Akaike Information Criterion)
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <strong>Penalty:</strong> <MathText tex="+2k" /> (fixed per parameter)<br />
              <strong>Philosophy:</strong> Optimized for out-of-sample predictive accuracy. Favors richer models that don't omit real but modest signals.<br />
              <strong>Equivalent F-cutoff:</strong> <MathText tex="F \approx 2.0" /> for a single restriction.
            </div>
          </div>
          
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--blue)' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--blue)' }}>
              2. BIC (Bayesian Information Criterion)
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <strong>Penalty:</strong> <MathText tex="+k \ln(T)" /> (grows with sample size)<br />
              <strong>Philosophy:</strong> Consistent order selection: identifies the true data-generating process as <MathText tex="T \to \infty" />.<br />
              <strong>Equivalent F-cutoff:</strong> <MathText tex="F \approx \ln(T)" /> (stricter penalty in large samples).
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--coral)' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--coral)' }}>
              3. Statistical Hypothesis Test (F-Test at 5%)
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <strong>Criterion:</strong> <MathText tex="p < 0.05 \implies F > F_{\text{crit}} \approx 3.84" /><br />
              <strong>Why F_crit varies:</strong> Under <MathText tex="H_0" />, <MathText tex="F \sim F(1, T - k_u)" />. In large samples (<MathText tex="T \to \infty" />), <MathText tex="F_{\text{crit}} = 1.96^2 \approx 3.84" />. In small samples (e.g. <MathText tex="T = 60, k_u = 3 \implies \text{df}=57" />), finite-sample variance raises <MathText tex="F_{\text{crit}} \approx 4.01" />.<br />
              <strong>Philosophy:</strong> Controls false-positive rate under the null hypothesis (rejects chance correlation 95% of the time).<br />
              <strong>Contrast:</strong> Notice that <MathText tex="F_{\text{crit}} \approx 3.84 > F_{\text{AIC}} \approx 2.0" />.
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <strong>Key Takeaway for Model Selection:</strong> When deciding whether to add an extra lag or parameter, AIC asks: <em>&ldquo;Does adding this parameter improve expected out-of-sample forecast accuracy?&rdquo;</em> (a lower bar, <MathText tex="F > 2.0" />). An <MathText tex="F" />-test asks: <em>&ldquo;Is the reduction in <MathText tex="\text{RSS}" /> statistically distinguishable from random noise at a 5% error rate?&rdquo;</em> (a stricter bar, <MathText tex="F > 3.84" />). Because AIC aims to minimize predictive error rather than minimize false discovery, it accepts milder signals that classical hypothesis testing rejects.
        </div>
      </div>
    );

    return (
      <div>
        {subTabSelector}
        <Layout 
          controls={null} 
          commentary={primerCommentary} 
          dataset={primerDataset} 
          chart={primerChart} 
          chartHeight="480px"
        />
      </div>
    );
  };

  const renderTab5 = () => {
    const tabData = data.tab5["Gas"];
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      SARIMA_InSample: idx < tabData.train_size ? tabData.sarima_in[idx] : null,
      HW_InSample: idx < tabData.train_size ? tabData.hw_in[idx] : null,
      SARIMA_Forecast: idx >= tabData.train_size ? tabData.sarima_out[idx - tabData.train_size] : null,
      HW_Forecast: idx >= tabData.train_size ? tabData.hw_out[idx - tabData.train_size] : null,
    }));

    const commentary = (
      <p>
        This dataset exhibits heteroskedasticity. We apply a log transform before fitting <MathText tex="\operatorname{SARIMA}(0, 1, 1) \times (0, 1, 1)_{12}" />, then transform forecasts back to the original scale.
        <br/><br/>
        Holt-Winters uses a multiplicative error and seasonality model to achieve a similar result. Holt-Winters is a strong, explainable, and simple baseline. As you can see, it has extremely competitive forecasting power compared to SARIMA. Complex models do not always win!
      </p>
    );

    const chart = (
      <ChartWithZoom 
        chartData={chartData} 
        trainSize={tabData.train_size} 
        timeLabels={tabData.time_label}
        lines={[
          <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
          <Line key="4" type="monotone" dataKey="HW_InSample" stroke="var(--teal)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
          <Line key="2" type="monotone" dataKey="SARIMA_InSample" stroke="var(--coral)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`SARIMA In-Sample`} />,
          <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="var(--teal)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
          <Line key="3" type="monotone" dataKey="SARIMA_Forecast" stroke="var(--coral)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`SARIMA ${formatOrderLabel(tabData.sarima_order)} Forecast`} />
        ]} 
      />
    );

    return <Layout commentary={commentary} dataset={<p>{tabData.description.replace(/Modelling Behaviour.*/s, '')}</p>} chart={chart} />;
  };

  const renderTab6 = () => {
    const tabData = data.tab6;
    if (!tabData) return <div>Data not found</div>;
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      Promo: tabData.exog_marker[idx],
      Model_InSample: idx < tabData.train_size ? (useExog ? tabData.sarimax_in[idx] : tabData.sarima_in[idx]) : null,
      HW_InSample: idx < tabData.train_size ? tabData.hw_in[idx] : null,
      Model_Forecast: idx >= tabData.train_size ? (useExog ? tabData.sarimax_out[idx - tabData.train_size] : tabData.sarima_out[idx - tabData.train_size]) : null,
      HW_Forecast: idx >= tabData.train_size ? tabData.hw_out[idx - tabData.train_size] : null,
    }));

    const controls = (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <button 
          style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: !useExog ? 'var(--primary)' : 'var(--surface)', color: !useExog ? 'white' : 'var(--text-main)' }} 
          onClick={() => setUseExog(false)}
        >
          Compare HW vs SARIMA (No Exog)
        </button>
        <button 
          style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: useExog ? 'var(--primary)' : 'var(--surface)', color: useExog ? 'white' : 'var(--text-main)' }} 
          onClick={() => setUseExog(true)}
        >
          Compare HW vs SARIMAX (With Exog)
        </button>
      </div>
    );

    const commentary = (
      <p>
        {!useExog ? 
          "The baseline Holt-Winters model sees the random spikes from promotions but doesn't know *why* they happen. It tries to smooth them out into the general trend and seasonality, completely failing to forecast future spikes. SARIMA without exogenous variables suffers the same fate." :
          <>By passing the promotion calendar as an exogenous regressor <MathText tex="X_t" /> (the “X” in SARIMAX), the model estimates the promotional lift separately from trend and seasonality. The yellow markers identify promotion dates.</>}
      </p>
    );

    const chart = (
      <ChartWithZoom 
        chartData={chartData} 
        trainSize={tabData.train_size} 
        timeLabels={tabData.time_label}
        lines={[
          <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
          <Line key="4" type="monotone" dataKey="HW_InSample" stroke="var(--teal)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
          <Line key="2" type="monotone" dataKey="Model_InSample" stroke="var(--coral)" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`${useExog ? 'SARIMAX' : 'SARIMA'} In-Sample`} />,
          <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="var(--teal)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
          <Line key="3" type="monotone" dataKey="Model_Forecast" stroke="var(--coral)" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`${useExog ? 'SARIMAX' : 'SARIMA'} Forecast`} />,
          <Line key="6" type="step" dataKey="Promo" stroke="#fbbf24" strokeWidth={0} dot={{ r: 6, fill: '#fbbf24', stroke: 'var(--on-accent)' }} isAnimationActive={false} name="Promo Active (Yellow Bulbs)" />
        ]} 
      />
    );

    return <Layout controls={controls} commentary={commentary} dataset={<p>Weekly retail sales with a binary promotion indicator <MathText tex="X_t \in \{0, 1\}" />. Comparing SARIMA with SARIMAX shows the value of known future promotional information.</p>} chart={chart} />;
  };

  const tabs = [renderTab1, renderTab2, renderTab3, renderTab4, renderTab5, renderTab6];
  return tabs[activeTab - 1]();
}
