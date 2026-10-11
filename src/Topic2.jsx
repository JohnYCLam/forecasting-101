import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Scatter, BarChart, Bar, Cell } from 'recharts';
import { ZoomIn, ZoomOut, Info, BrainCircuit } from 'lucide-react';

import ZoomableChartWrapper from './ZoomableChartWrapper';
import { formatValue } from './utils';
import { MathText, MathOperator, ModelOrder } from './MathText';

const formatOrderLabel = (order) => String(order)
  .replace('x', ' × ')
  .replace(' [Log Transformed]', ' (log scale)');

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
        <ZoomableChartWrapper defaultDomain={[0, maxTime]} maxTime={maxTime}>
          {(zoomDomain) => (
            <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
              <LineChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                style={{ pointerEvents: 'auto' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatXAxis} />
                <YAxis domain={yDomain} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
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
          )}
        </ZoomableChartWrapper>
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

  useEffect(() => {
    fetch(`/topic2_data.json?t=${new Date().getTime()}`)
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
    return <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>Loading ARIMA Models... (This might take a moment if the python script is still running)</div>;
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
      ...arPoints.map((point, idx) => ({ label: `AR value t−${idx + 1}`, value: point.contribution, coefficient: point.coefficient, color: '#3b82f6' })),
      ...shockPoints.map((point, idx) => ({ label: `Shock t−${idx + 1}`, value: point.contribution, coefficient: point.coefficient, color: '#f59e0b' }))
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
        <p><strong>How to read the lower graph:</strong> positive bars pull the conditional mean upward and negative bars pull it downward. Their sum is <MathText tex="\hat y_t" />. The difference <MathText tex="y_t-\hat y_t=\varepsilon_t" /> is the new shock that could not have been known at <MathText>t − 1</MathText>.</p>
        <p><strong>Out-of-sample forecast:</strong> after the dashed split, future shocks are unknown and therefore set to their expectation of zero. AR and MA effects decay as the horizon increases, so a stationary ARMA forecast returns toward its long-run mean.</p>
        {p === 0 && q === 0 && <p><strong>Current selection:</strong> <ModelOrder name="ARMA">0, 0</ModelOrder> is white noise. It has no past-value or past-shock contributions, so its conditional mean is zero.</p>}
      </div>
    );

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ width: '100%', height: '500px' }}>
          <ZoomableChartWrapper defaultDomain={[0, xMax]} maxTime={xMax}>
            {(zoomDomain) => (
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
                  <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={(value) => `Time: ${value}`} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                  <Legend />
                  <ReferenceLine x={tabData.train_size - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast start', fill: 'var(--text-muted)' }} />
                  <ReferenceLine x={inspectTime} stroke="var(--text-main)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={1.6} dot={false} name="Observed series yₜ" isAnimationActive={false} />
                  <Line type="monotone" dataKey="GeneratedMean" stroke="#ef4444" strokeWidth={2} dot={false} name="Generated conditional mean ŷₜ" isAnimationActive={false} />
                  <Line type="monotone" dataKey="Forecast" stroke="#7c3aed" strokeWidth={3} strokeDasharray="5 5" dot={false} name={`ARMA(${p},${q}) out-of-sample forecast`} isAnimationActive={false} />
                  <Scatter data={arPoints} dataKey="value" fill="#3b82f6" name="AR lag inputs" isAnimationActive={false} />
                  <Scatter data={shockPoints} dataKey="value" fill="#f59e0b" name="Past-shock inputs" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ZoomableChartWrapper>
        </div>
        <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-main)', fontSize: '0.9rem' }}>
          <strong>Conditional-mean anatomy at t = {inspectTime}:</strong>{' '}
          <MathText tex={`\\hat y_t = c + \\sum_{i=1}^{p}\\phi_i y_{t-i} + \\sum_{j=1}^{q}\\theta_j\\varepsilon_{t-j} = ${predictedMean.toFixed(3)}`} />
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
        {tab2Dataset === 'MA1' && <><ModelOrder name="ARIMA">0, 0, 1</ModelOrder> captures a one-lag transient shock. After <MathText>q = 1</MathText> lag, the innovation has no further direct effect, so the forecast snaps back to the mean. Holt-Winters instead decays gradually.</>}
        {tab2Dataset === 'AR2' && <><ModelOrder name="ARIMA">2, 0, 0</ModelOrder> uses two autoregressive roots to represent an aperiodic oscillation. Its long-horizon forecast still damps toward the mean, while Holt-Winters cannot reproduce the changing cycle length.</>}
        {tab2Dataset === 'AR1' && <><ModelOrder name="ARIMA">1, 0, 0</ModelOrder> captures high-frequency mean reversion. Holt-Winters responds too slowly to the alternating pattern.</>}
      </p>
    );

    const chart = (
      <ChartWithZoom 
        chartData={chartData} 
        trainSize={tabData.train_size} 
        timeLabels={tabData.time_label}
        lines={[
          <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
          <Line key="4" type="monotone" dataKey="HW_InSample" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
          <Line key="2" type="monotone" dataKey="ARIMA_InSample" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`ARIMA In-Sample`} />,
          <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
          <Line key="3" type="monotone" dataKey="ARIMA_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`ARIMA ${tabData.arima_order} Forecast`} />
        ]} 
      />
    );

    const datasetBox = (
      <p>
        {tab2Dataset === 'MA1' && <>Synthetic MA(1) process with coefficient <MathText>θ = 0.9</MathText>. A 20-unit shock is injected at <MathText>t = 99</MathText>, echoes once at <MathText>t = 100</MathText>, and then leaves no direct MA effect.</>}
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
        {tab3Dataset === 'Sunspots' && (
          <>
            Sunspots follow an aperiodic cycle ranging from 8–16 years, with an average near 11 years. Holt-Winters forces a rigid 11-year seasonal period and therefore falls out of phase. <ModelOrder name="ARIMA">9, 0, 0</ModelOrder> instead uses deep autoregressive memory to represent the variable cycle.
            <br/><br/>
            <strong>How to predict cycle AND magnitude for Sunspots?</strong> ARIMA handles the aperiodic cycle frequency nicely but eventually suffers from mean-reversion damping. Holt-Winters and SARIMA completely fail because they force a rigid calendar frequency. Predicting BOTH variable frequencies and amplitudes requires advanced hybrid models (e.g., LSTMs or Dynamic State-Space models with time-varying seasonal components).
          </>
        )}
        {tab3Dataset === 'TBill' && <>Interest rates have strong inertia. <ModelOrder name="ARIMA">3, 0, 1</ModelOrder> was selected with Box–Jenkins diagnostics over candidate orders <MathText>(p, d, q)</MathText>. Its AR terms capture persistence and its MA term reacts to innovations; Holt-Winters extrapolates a linear trend.</>}
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
                stroke="#3b82f6" 
                strokeWidth={2} 
                strokeDasharray="3 3" 
                strokeOpacity={0.5} 
                label={{ value: `${length} yrs`, position: 'insideTopRight', fill: '#3b82f6', fontSize: 10, offset: 5 }} 
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
            <Line key="4" type="monotone" dataKey="HW_InSample" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
            <Line key="2" type="monotone" dataKey="ARIMA_InSample" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`ARIMA In-Sample`} />,
            <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
            <Line key="3" type="monotone" dataKey="ARIMA_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`ARIMA ${tabData.arima_order} Forecast`} />,
            ...cycleLines
          ]} 
        />
      </div>
    );

    const datasetBox = (
      <div>
        <p>
          {tab3Dataset === 'Sunspots'
            ? <>Yearly sunspot activity from 1700–2008. <ModelOrder name="ARIMA">9, 0, 0</ModelOrder> is compared with Holt-Winters using an 11-year seasonal period.</>
            : <>US 3-month Treasury bill rate. <ModelOrder name="ARIMA">3, 0, 1</ModelOrder> is compared with a Holt linear-trend model.</>}
        </p>
        {tab3Dataset === 'TBill' && (
          <div style={{ marginTop: '1rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Box-Jenkins Model Selection (AIC Scores):</strong>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '4px' }}>Model</th>
                  <th style={{ padding: '4px' }}>AIC</th>
                  <th style={{ padding: '4px' }}>BIC</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARIMA">1, 0, 0</ModelOrder></td><td style={{ padding: '4px' }}>281.43</td><td style={{ padding: '4px' }}>289.00</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARIMA">2, 0, 0</ModelOrder></td><td style={{ padding: '4px' }}>283.42</td><td style={{ padding: '4px' }}>293.51</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARIMA">3, 0, 0</ModelOrder></td><td style={{ padding: '4px' }}>279.19</td><td style={{ padding: '4px' }}>291.80</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARIMA">1, 0, 1</ModelOrder></td><td style={{ padding: '4px' }}>283.40</td><td style={{ padding: '4px' }}>293.49</td></tr>
                <tr><td style={{ padding: '4px' }}><ModelOrder name="ARIMA">2, 0, 1</ModelOrder></td><td style={{ padding: '4px' }}>280.03</td><td style={{ padding: '4px' }}>292.64</td></tr>
                <tr style={{ background: 'rgba(59, 130, 246, 0.1)' }}><td style={{ padding: '4px' }}><strong><ModelOrder name="ARIMA">3, 0, 1</ModelOrder></strong></td><td style={{ padding: '4px' }}><strong>277.02 (selected)</strong></td><td style={{ padding: '4px' }}><strong>292.15</strong></td></tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Although <ModelOrder name="ARIMA">3, 1, 1</ModelOrder> has a lower AIC (270.57), <MathText>d = 1</MathText> imposes a unit root. The search is constrained to <MathText>d = 0</MathText> because the application assumes mean-reverting rates.</p>
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
          <Line key="2" type="monotone" dataKey="InSample" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="In-Sample Fit" />,
          <Line key="3" type="monotone" dataKey="Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Forecast" />
        ]} 
      />
    );

    return <Layout controls={controls} commentary={commentary} dataset={<p>US unemployment rate. The unconstrained search selects <MathText>d = 1</MathText>; the domain-informed search imposes <MathText>d = 0</MathText> to represent mean reversion.</p>} chart={chart} />;
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
        This dataset exhibits heteroskedasticity. We apply a log transform before fitting <MathText><MathOperator>SARIMA</MathOperator>(0, 1, 1) × (0, 1, 1)<sub>12</sub></MathText>, then transform forecasts back to the original scale.
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
          <Line key="4" type="monotone" dataKey="HW_InSample" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
          <Line key="2" type="monotone" dataKey="SARIMA_InSample" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`SARIMA In-Sample`} />,
          <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
          <Line key="3" type="monotone" dataKey="SARIMA_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`SARIMA ${formatOrderLabel(tabData.sarima_order)} Forecast`} />
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
          <>By passing the promotion calendar as an exogenous regressor <MathText>X<sub>t</sub></MathText> (the “X” in SARIMAX), the model estimates the promotional lift separately from trend and seasonality. The yellow markers identify promotion dates.</>}
      </p>
    );

    const chart = (
      <ChartWithZoom 
        chartData={chartData} 
        trainSize={tabData.train_size} 
        timeLabels={tabData.time_label}
        lines={[
          <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
          <Line key="4" type="monotone" dataKey="HW_InSample" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="Holt-Winters In-Sample" />,
          <Line key="2" type="monotone" dataKey="Model_InSample" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name={`${useExog ? 'SARIMAX' : 'SARIMA'} In-Sample`} />,
          <Line key="5" type="monotone" dataKey="HW_Forecast" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />,
          <Line key="3" type="monotone" dataKey="Model_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`${useExog ? 'SARIMAX' : 'SARIMA'} Forecast`} />,
          <Line key="6" type="step" dataKey="Promo" stroke="#fbbf24" strokeWidth={0} dot={{ r: 6, fill: '#fbbf24', stroke: '#fff' }} isAnimationActive={false} name="Promo Active (Yellow Bulbs)" />
        ]} 
      />
    );

    return <Layout controls={controls} commentary={commentary} dataset={<p>Weekly retail sales with a binary promotion indicator <MathText>X<sub>t</sub> ∈ {'{'}0, 1{'}'}</MathText>. Comparing SARIMA with SARIMAX shows the value of known future promotional information.</p>} chart={chart} />;
  };

  const tabs = [renderTab1, renderTab2, renderTab3, renderTab4, renderTab5, renderTab6];
  return tabs[activeTab - 1]();
}
