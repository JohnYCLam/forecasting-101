import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea, Area, ComposedChart, Scatter, BarChart, Bar, Cell } from 'recharts';
import { Info, BrainCircuit } from 'lucide-react';
import { ZoomableChartShell, SyncedDualChart } from './charts';
import { formatValue } from './utils';
import { MathText, ModelOrder } from './MathText';

const comparisonTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'center',
  background: 'var(--surface)',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid var(--border)',
  fontSize: '0.88rem'
};
const tableHeaderCellStyle = { padding: '0.65rem', borderBottom: '1px solid var(--border)' };
const tableCellStyle = { padding: '0.65rem', borderBottom: '1px solid var(--border)' };
const winnerCellStyle = { color: '#16a34a', fontWeight: 700, background: 'rgba(34, 197, 94, 0.1)' };

const Layout = ({ title = "Explanation", commentary, dataset, controls, chart, chartHeight = "860px", extraCardTitle = null, extraCard = null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div className="top-panels">
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><BrainCircuit size={18} /> {title}</h4>
          {commentary}
        </div>
      </div>
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><Info size={18} /> The Example Dataset</h4>
          {dataset}
        </div>
      </div>
    </div>

    {extraCard && (
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><BrainCircuit size={18} /> {extraCardTitle || 'Guide'}</h4>
          {extraCard}
        </div>
      </div>
    )}
    
    {controls && (
      <div className="glass controls-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
        {controls}
      </div>
    )}

    <div className="glass chart-container" style={{ width: '100%', height: chartHeight, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      {chart}
    </div>
  </div>
);

const baseDate = new Date('2022-01-01T00:00:00Z');
const formatDateFromIndex = (idx, short = true) => {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + Number(idx || 0));
  return short ? d.toISOString().slice(5, 10) : d.toISOString().slice(0, 10);
};
const dateTick = (value) => formatDateFromIndex(value, true);
const dateTooltip = (value) => `Date: ${formatDateFromIndex(value, false)} (t=${value})`;
const axisShort = (value) => Number(value).toFixed(2);
const quantile = (arr, q) => {
  const clean = arr.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (clean.length === 0) return 0;
  const pos = (clean.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return clean[lo];
  const w = pos - lo;
  return clean[lo] * (1 - w) + clean[hi] * w;
};
const robustDomain = (arr, lowQ = 0.01, highQ = 0.99, minFloor = null) => {
  const lo = quantile(arr, lowQ);
  const hi = quantile(arr, highQ);
  const pad = (hi - lo) * 0.12 + 1e-6;
  const left = minFloor === null ? lo - pad : Math.max(minFloor, lo - pad);
  return [left, hi + pad];
};
const tightDomain = (arr, minFloor = null) => {
  const clean = arr.filter((value) => Number.isFinite(value));
  if (clean.length === 0) return minFloor === null ? [-1, 1] : [minFloor, minFloor + 1];
  const lo = Math.min(...clean);
  const hi = Math.max(...clean);
  const pad = Math.max((hi - lo) * 0.04, 0.05);
  return [minFloor === null ? lo - pad : Math.max(minFloor, lo - pad), hi + pad];
};

export default function Topic4({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab 1 state
  const [tab1View, setTab1View] = useState('returns'); // returns | variance | forecast
  
  // Tab 2 state
  const [tab2P, setTab2P] = useState(1);
  const [tab2Q, setTab2Q] = useState(1);
  const [tab2InspectTime, setTab2InspectTime] = useState(450);
  // Tab 4 state
  const [varConfLevel, setVarConfLevel] = useState(5); // 5%
  
  // Tab 5 state
  const [tab5Step, setTab5Step] = useState(1);
  
  // Tab 6 state
  const [tab6View, setTab6View] = useState('ts'); // 'ts' or 'ni'

  useEffect(() => {
    fetch(`/topic4_data.json?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading Topic 4 data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>Loading Topic 4 Data...</div>;
  }

  const renderTab1 = () => {
    const tabData = data.tab1;
    const chartData = tabData.real_noise.map((_, idx) => ({
      time: idx,
      RealReturn: tabData.real_noise[idx],
      FakeReturn: tabData.fake_noise[idx],
      RealVar: tabData.real_rolling_var[idx],
      FakeVar: tabData.fake_rolling_var[idx]
    }));
    const forecastData = tabData.forecast_series.map((val, idx) => {
      const meanCenter = Number.isFinite(tabData.point_mean[idx]) ? tabData.point_mean[idx] : tabData.mu;
      const oneStepSigma = Number.isFinite(tabData.one_step_sigma[idx]) ? tabData.one_step_sigma[idx] : null;
      const multiStepSigma = Number.isFinite(tabData.multi_step_sigma[idx]) ? tabData.multi_step_sigma[idx] : null;

      return ({
        time: idx,
        TrainReturn: idx < tabData.train_size ? val : null,
        TestReturn: idx >= tabData.train_size ? val : null,
        PointMean: meanCenter,
        OneStepUpper: idx < tabData.train_size && oneStepSigma !== null ? meanCenter + oneStepSigma : null,
        OneStepLower: idx < tabData.train_size && oneStepSigma !== null ? meanCenter - oneStepSigma : null,
        MultiUpper: idx >= tabData.train_size && multiStepSigma !== null ? meanCenter + multiStepSigma : null,
        MultiLower: idx >= tabData.train_size && multiStepSigma !== null ? meanCenter - multiStepSigma : null,
        OneStepSigma: idx < tabData.train_size ? oneStepSigma : null,
        MultiStepSigma: idx >= tabData.train_size ? multiStepSigma : null,
        RealizedAbs: Math.abs(val - tabData.mu),
        LongRunSigma: tabData.unconditional_vol,
        LongRunUpper: tabData.mu + tabData.unconditional_vol,
        LongRunLower: tabData.mu - tabData.unconditional_vol
      });
    });

    const xMax = chartData.length > 0 ? chartData.length - 1 : 100;
    const forecastMax = forecastData.length > 0 ? forecastData.length - 1 : 100;

    const alignedReturnDomain = robustDomain(chartData.flatMap((d) => [d.RealReturn, d.FakeReturn]), 0.01, 0.99);
    const alignedVarDomain = robustDomain(chartData.flatMap((d) => [d.RealVar, d.FakeVar]), 0.01, 0.99, 0);
    const pickLongestRun = (predicate, minLength = 10) => {
      let runStart = null;
      let bestStart = null;
      let bestEnd = null;
      for (let i = 0; i < chartData.length; i += 1) {
        if (predicate(chartData[i])) {
          if (runStart === null) runStart = i;
        } else if (runStart !== null) {
          if (bestStart === null || (i - 1) - runStart > bestEnd - bestStart) {
            bestStart = runStart;
            bestEnd = i - 1;
          }
          runStart = null;
        }
      }
      if (runStart !== null && (bestStart === null || (chartData.length - 1) - runStart > bestEnd - bestStart)) {
        bestStart = runStart;
        bestEnd = chartData.length - 1;
      }
      return bestStart !== null && bestEnd !== null && bestEnd - bestStart + 1 >= minLength
        ? { start: bestStart, end: bestEnd }
        : null;
    };
    const fakeHighThreshold = quantile(chartData.map((d) => d.FakeVar), 0.7);
    const fakeLowThreshold = quantile(chartData.map((d) => d.FakeVar), 0.3);
    const fakeHighClusterWindow = pickLongestRun((d) => Number.isFinite(d.FakeVar) && d.FakeVar >= fakeHighThreshold, 12);
    const fakeLowClusterWindow = pickLongestRun((d) => Number.isFinite(d.FakeVar) && d.FakeVar <= fakeLowThreshold, 12);
    const forecastDomain = robustDomain(
      forecastData.flatMap((d) => [d.TrainReturn, d.TestReturn, d.OneStepLower, d.OneStepUpper, d.MultiLower, d.MultiUpper, d.LongRunLower, d.LongRunUpper]),
      0.01,
      0.99
    );
    const sigmaDomain = robustDomain(
      forecastData.flatMap((d) => [d.OneStepSigma, d.MultiStepSigma, d.RealizedAbs, d.LongRunSigma]),
      0.01,
      0.99,
      0
    );

    const controls = (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
        <button className={`nav-btn ${tab1View === 'returns' ? 'primary' : 'secondary'}`} onClick={() => setTab1View('returns')}>Returns (Real vs Fake)</button>
        <button className={`nav-btn ${tab1View === 'variance' ? 'primary' : 'secondary'}`} onClick={() => setTab1View('variance')}>Rolling Variance (Real vs Fake)</button>
        <button className={`nav-btn ${tab1View === 'forecast' ? 'primary' : 'secondary'}`} onClick={() => setTab1View('forecast')}>ARCH Forecast</button>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.95rem' }}>
        <p><strong>Why ARIMA alone fails for risk:</strong> ARIMA is built for conditional mean behavior and typically assumes stable residual variance. Financial returns violate that through volatility clustering: calm regimes and stressed regimes persist.</p>
        <p><strong>What ARCH is forecasting:</strong> not direction, but next-step conditional variance. This is a risk-magnitude signal that can be converted into position sizing and limit controls.</p>
        <p><strong>How traders use this:</strong> when predicted variance rises, desks often reduce gross exposure, widen stop-loss bands, raise margin buffers, and hedge more aggressively. When variance normalizes, those controls can be relaxed.</p>
        {tab1View === 'variance' && (
          <>
            <p><strong>What this chart shows:</strong> rolling variance at time <strong>t</strong> is the average of squared returns over the latest 20 days. It is a local volatility meter, so it exposes variance structure that raw return lines can hide.</p>
            <p><strong>Visual reading guide (top: real white noise):</strong> look for isolated bumps that quickly revert. You should not see long elevated plateaus. That "spike then fade" behavior is what no-volatility-memory looks like.</p>
            <p><strong>Visual reading guide (bottom: fake white noise from ARCH):</strong> look for persistent elevated zones, where variance rises and stays high across many consecutive points. Those sustained blocks indicate clustering (volatility memory), not independent noise.</p>
            <p><strong>Shaded zones:</strong> red marks a persistent high-volatility regime, while blue marks a persistent low-volatility regime. This contrast between long high and low patches is evidence of volatility persistence (clustering).</p>
          </>
        )}
        {tab1View === 'forecast' && (
          <>
            <p><strong>What this tab is showing:</strong> ARCH forecasts risk size (volatility), then converts that risk into return uncertainty bands around the mean.</p>
            <p><strong>How to interpret quickly:</strong> wider upper/lower distance means higher expected turbulence; narrower distance means calmer regime. Bands are probabilistic, so occasional breaches are expected.</p>
            <p><strong>Why test-period bands converge:</strong> with stationary ARCH assumptions (stable parameters, finite long-run variance, no future shocks known), the minimum-MSE multi-step forecast reverts toward long-run variance <MathText tex="\bar{\sigma}^2" />, so out-of-sample band width gradually stabilizes.</p>
          </>
        )}
      </div>
    );

    const archGuideCard = tab1View === 'forecast' ? (
      <div style={{ fontSize: '0.92rem' }}>
        <p><strong>Step 1 - ARCH output:</strong> the model predicts conditional volatility <MathText tex="\sigma_t" /> and mean <MathText tex="\mu_t" />.</p>
        <p><strong>Step 2 - Build bounds:</strong> <MathText tex="\text{Upper}_t = \mu_t + \sigma_t" /> and <MathText tex="\text{Lower}_t = \mu_t - \sigma_t" />.</p>
        <p><strong>Step 3 - Map charts:</strong> top-chart amber train bounds come from one-step <MathText tex="\sigma_t" />; red dashed test bounds come from multi-step <MathText tex="\sigma_{t+h \mid t}" /> shown below.</p>
        <p><strong>Step 4 - Read width:</strong> wider gap means higher predicted risk; narrower gap means calmer expected moves.</p>
        <p><strong>Step 5 - Compare with realized magnitude:</strong> <MathText tex="|r_t - \mu_t|" /> is plotted as a proxy for the realized shock size. It is only a proxy because the latent <MathText tex="\sigma_t" /> is not observed: one realized return is a noisy draw whose magnitude also depends on the random innovation. Under a stable innovation distribution, larger <MathText tex="\sigma_t" /> raises the expected absolute shock, but the two need not match at every date.</p>
      </div>
    ) : null;

    const datasetBox = (
      <p>Two synthetic daily return series over one calendar timeline: true white noise (constant variance) and fake white noise generated from an ARCH process (time-varying variance). Forecast view shows both return forecasts and direct volatility forecasts after a train/test split.</p>
    );

    const chart = tab1View === 'forecast' ? (
      <div style={{ width: '100%', height: '560px', padding: '0.25rem 0.5rem 0.75rem 0.25rem' }}>
        <SyncedDualChart
          defaultDomain={[0, forecastMax]}
          maxTime={forecastMax}
          gap="0.7rem"
          top={{
            flex: 0.62,
            minHeight: '320px',
            content: (zoomDomain) => (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <ComposedChart data={forecastData} margin={{ top: 12, right: 36, left: 18, bottom: 4 }} style={{ pointerEvents: 'auto' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} hide />
                  <YAxis yAxisId="left" domain={forecastDomain} tick={{ fill: 'var(--text-muted)' }} tickFormatter={axisShort} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                  <Legend />
                  <ReferenceLine x={tabData.train_size} stroke="#111827" strokeDasharray="4 4" />
                  <ReferenceLine y={tabData.mu} yAxisId="left" stroke="#111827" strokeDasharray="3 3" />
                  <ReferenceLine y={tabData.mu + tabData.unconditional_vol} yAxisId="left" stroke="#6b7280" strokeDasharray="4 4" />
                  <ReferenceLine y={tabData.mu - tabData.unconditional_vol} yAxisId="left" stroke="#6b7280" strokeDasharray="4 4" />
                  <Line yAxisId="left" type="monotone" dataKey="TrainReturn" stroke="var(--text-muted)" strokeOpacity={0.55} strokeWidth={0.9} dot={false} name="Train returns" isAnimationActive={false} />
                  <Line yAxisId="left" type="monotone" dataKey="TestReturn" stroke="#111827" strokeWidth={1.2} dot={false} name="Test returns" isAnimationActive={false} />
                  <Line yAxisId="left" type="step" dataKey="PointMean" stroke="#111827" strokeWidth={2} dot={false} name="Point mean forecast" isAnimationActive={false} />
                  <Line yAxisId="left" type="stepAfter" dataKey="OneStepUpper" stroke="#d97706" strokeOpacity={0.65} strokeWidth={1.3} dot={false} name="One-step ARCH boundary (train only)" isAnimationActive={false} />
                  <Line yAxisId="left" type="stepAfter" dataKey="OneStepLower" stroke="#d97706" strokeOpacity={0.65} strokeWidth={1.3} dot={false} name="One-step ARCH boundary (train only)" legendType="none" isAnimationActive={false} />
                  <Line yAxisId="left" type="stepAfter" dataKey="MultiUpper" stroke="#ef4444" strokeWidth={1.8} strokeDasharray="6 4" dot={false} name="Multi-step ARCH boundary (test, converging)" isAnimationActive={false} />
                  <Line yAxisId="left" type="stepAfter" dataKey="MultiLower" stroke="#ef4444" strokeWidth={1.8} strokeDasharray="6 4" dot={false} name="Multi-step ARCH boundary (test, converging)" legendType="none" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ),
          }}
          bottom={{
            flex: 0.38,
            minHeight: '180px',
            content: (zoomDomain) => (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <LineChart data={forecastData} margin={{ top: 4, right: 36, left: 18, bottom: 14 }} style={{ pointerEvents: 'auto' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis domain={sigmaDomain} tick={{ fill: 'var(--text-muted)' }} tickFormatter={axisShort} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                  <Legend />
                  <ReferenceLine x={tabData.train_size} stroke="#111827" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="RealizedAbs" stroke="var(--text-muted)" strokeWidth={1} dot={false} name="Realized |r_t - μ_t| proxy" isAnimationActive={false} />
                  <Line type="monotone" dataKey="OneStepSigma" stroke="#f59e0b" strokeWidth={1.7} dot={false} name="One-step σ_t (train only)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="MultiStepSigma" stroke="#7c3aed" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Multi-step σ_{t+h|t} (converging)" isAnimationActive={false} />
                  <ReferenceLine y={tabData.unconditional_vol} stroke="#6b7280" strokeDasharray="4 4" label={{ value: "Long-run σ", fill: "var(--text-muted)", position: "insideTopRight" }} />
                </LineChart>
              </ResponsiveContainer>
            ),
          }}
        />
      </div>
    ) : (
      <SyncedDualChart
        defaultDomain={[0, xMax]}
        maxTime={xMax}
        gap="0.9rem"
        top={{
          title: 'Real White Noise',
          titleAlign: 'center',
          minHeight: '260px',
          content: (zoomDomain) => (
            <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
              <ComposedChart data={chartData} syncId={`tab1-${tab1View}`} margin={{ top: 12, right: 36, left: 18, bottom: 4 }} style={{ pointerEvents: 'auto' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} hide />
                <YAxis domain={tab1View === 'returns' ? alignedReturnDomain : alignedVarDomain} tick={{ fill: 'var(--text-muted)' }} tickFormatter={axisShort} />
                <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                <Legend />
                {tab1View === 'returns' && <Line type="monotone" dataKey="RealReturn" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Real White Noise Returns" isAnimationActive={false} />}
                {tab1View === 'variance' && <Area type="step" dataKey="RealVar" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.25} name="Real Rolling Variance (20d)" isAnimationActive={false} />}
              </ComposedChart>
            </ResponsiveContainer>
          ),
        }}
        bottom={{
          title: 'Fake White Noise (ARCH process)',
          titleAlign: 'center',
          minHeight: '260px',
          content: (zoomDomain) => (
            <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
              <ComposedChart data={chartData} syncId={`tab1-${tab1View}`} margin={{ top: 12, right: 36, left: 18, bottom: 14 }} style={{ pointerEvents: 'auto' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis domain={tab1View === 'returns' ? alignedReturnDomain : alignedVarDomain} tick={{ fill: 'var(--text-muted)' }} tickFormatter={axisShort} />
                <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                <Legend />
                {tab1View === 'variance' && fakeHighClusterWindow && (
                  <ReferenceArea
                    x1={fakeHighClusterWindow.start}
                    x2={fakeHighClusterWindow.end}
                    fill="#ef4444"
                    fillOpacity={0.14}
                    label={{ value: 'Persistent high-vol regime', position: 'insideTop', fill: '#b91c1c' }}
                  />
                )}
                {tab1View === 'variance' && fakeLowClusterWindow && (
                  <ReferenceArea
                    x1={fakeLowClusterWindow.start}
                    x2={fakeLowClusterWindow.end}
                    fill="#3b82f6"
                    fillOpacity={0.12}
                    label={{ value: 'Persistent low-vol regime', position: 'insideBottom', fill: '#1d4ed8' }}
                  />
                )}
                {tab1View === 'returns' && <Line type="monotone" dataKey="FakeReturn" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Fake White Noise Returns" isAnimationActive={false} />}
                {tab1View === 'variance' && <Area type="step" dataKey="FakeVar" fill="#ef4444" stroke="#ef4444" fillOpacity={0.25} name="Fake Rolling Variance (20d)" isAnimationActive={false} />}
              </ComposedChart>
            </ResponsiveContainer>
          ),
        }}
      />
    );

    return <Layout title="4.1 Introduction to ARCH" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} chartHeight={tab1View === 'forecast' ? '620px' : '650px'} extraCardTitle="ARCH Forecast Reading Guide" extraCard={archGuideCard} />;
  };

  const renderTab2 = () => {
    const tabData = data.tab2;
    const modelKey = `p${tab2P}_q${tab2Q}`;
    const selectedModel = tabData.models[modelKey] || tabData.models.p1_q1;
    const trainSize = selectedModel.train_size;
    const maxLag = Math.max(tab2P, tab2Q, 1);
    const inspectTime = Math.min(Math.max(tab2InspectTime, maxLag), trainSize - 1);
    const chartData = selectedModel.returns.map((val, idx) => ({
      time: idx,
      SquaredReturns: selectedModel.squared_returns[idx],
      GeneratedVariance: idx < trainSize ? selectedModel.true_cond_var[idx] : null,
      TrueTestVariance: idx >= trainSize ? selectedModel.true_cond_var[idx] : null,
      ForecastVariance: idx >= trainSize ? selectedModel.forecast_var[idx - trainSize] : null
    }));
    const shockPoints = selectedModel.alpha.map((alpha, idx) => ({
      time: inspectTime - idx - 1,
      value: selectedModel.squared_returns[inspectTime - idx - 1],
      contribution: alpha * selectedModel.squared_returns[inspectTime - idx - 1],
      weight: alpha
    }));
    const variancePoints = selectedModel.beta.map((beta, idx) => ({
      time: inspectTime - idx - 1,
      value: selectedModel.true_cond_var[inspectTime - idx - 1],
      contribution: beta * selectedModel.true_cond_var[inspectTime - idx - 1],
      weight: beta
    }));
    const contributionData = [
      { label: 'Baseline ω', value: selectedModel.omega, weight: null, color: '#6b7280' },
      ...shockPoints.map((point, idx) => ({ label: `Shock t−${idx + 1}`, value: point.contribution, weight: point.weight, color: '#f59e0b' })),
      ...variancePoints.map((point, idx) => ({ label: `Variance t−${idx + 1}`, value: point.contribution, weight: point.weight, color: '#3b82f6' }))
    ];
    const contributionTotal = contributionData.reduce((sum, item) => sum + item.value, 0);
    
    const xMax = chartData.length > 0 ? chartData.length - 1 : 100;

    const controls = (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', width: '100%', maxWidth: '1000px' }}>
        <div className="slider-container" style={{ flex: '1 1 220px' }}>
          <label>
            <span>p (shock lags)</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{tab2P}</span>
          </label>
          <input type="range" min="1" max="5" step="1" value={tab2P} onChange={(e) => setTab2P(parseInt(e.target.value, 10))} />
        </div>
        <div className="slider-container" style={{ flex: '1 1 220px' }}>
          <label>
            <span>q (variance-memory lags)</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{tab2Q}</span>
          </label>
          <input type="range" min="0" max="5" step="1" value={tab2Q} onChange={(e) => setTab2Q(parseInt(e.target.value, 10))} />
        </div>
        <div className="slider-container" style={{ flex: '1 1 300px' }}>
          <label>
            <span>Inspect training date</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{formatDateFromIndex(inspectTime, false)}</span>
          </label>
          <input type="range" min={maxLag} max={trainSize - 1} step="1" value={inspectTime} onChange={(e) => setTab2InspectTime(parseInt(e.target.value, 10))} />
        </div>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.92rem' }}>
        <p><strong>From ARCH to GARCH:</strong> <ModelOrder name="ARCH">p</ModelOrder> uses the last <MathText>p</MathText> squared shocks. <ModelOrder name="GARCH">p, q</ModelOrder> also uses the last <MathText>q</MathText> conditional variances, so it can represent persistent volatility with fewer lag coefficients.</p>
        <p><strong>What this demo does:</strong> each slider combination generates a different synthetic series from the selected <ModelOrder name={selectedModel.model_type}>{tab2Q === 0 ? tab2P : `${tab2P}, ${tab2Q}`}</ModelOrder> process. It is a behavior generator like the ARMA demo—not a competition between models fitted to one fixed dataset.</p>
        <p><strong>What <MathText>p</MathText> and <MathText>q</MathText> mean:</strong> <MathText>p</MathText> controls how many past squared shocks enter the variance equation; <MathText>q</MathText> controls how many past conditional variances carry volatility forward. Setting <MathText>q = 0</MathText> gives <ModelOrder name="ARCH">p</ModelOrder>. Increasing either order spreads the effect of past information across more lags.</p>
        <p><strong>What is the baseline <MathText tex="\omega" />?</strong> <MathText tex="\omega" /> is the positive variance intercept added at every date, even if all lagged inputs were zero. It prevents predicted variance from collapsing to zero. It is not the long-run variance. For a stationary GARCH model, <MathText tex="\displaystyle \bar{\sigma}^{2}=\frac{\omega}{1-\sum_{i=1}^{p}\alpha_i-\sum_{j=1}^{q}\beta_j}" />.</p>
        <p><strong>How to read the timeline:</strong> before the dashed split, the red line is the generated conditional variance. Amber circles identify the <MathText>p</MathText> squared shocks used at the inspected date; blue circles identify the <MathText>q</MathText> lagged variances. Their weighted contributions are expanded in the lower graph.</p>
        <p><strong>Does a short bar mean no dependence?</strong> No. Each selected lag has a nonzero generating coefficient. Bar height is the product of its coefficient and its input—for example, <MathText tex="\alpha_i\varepsilon_{t-i}^2" />. A lag can therefore be part of the model but contribute almost nothing on a date when its squared shock is near zero. Move the inspection date to see its contribution change.</p>
        <p><strong>Out-of-sample forecast:</strong> at the split, the fitted model forecasts variance for the next 100 dates without seeing future returns. The purple line is that multi-step forecast; the green dashed line is the simulated true variance revealed afterward. Because unknown future squared shocks are replaced by their conditional expectations, the forecast becomes smooth and converges toward long-run variance. It does not attempt to forecast return direction.</p>
        <p><strong>What to compare:</strong> keep one order fixed and change the other. Larger <MathText>p</MathText> lets several earlier shocks shape today’s variance; larger <MathText>q</MathText> gives the variance process longer internal memory. Because each selection generates its own series, compare pattern and persistence—not individual observations at the same date.</p>
        <p><strong>Current process:</strong> <ModelOrder name={selectedModel.model_type}>{tab2Q === 0 ? tab2P : `${tab2P}, ${tab2Q}`}</ModelOrder> has persistence <MathText>{selectedModel.persistence.toFixed(2)}</MathText>. Its unconditional variance is normalized to <MathText>1</MathText>, so the examples remain on a comparable vertical scale.</p>
        <p><strong>Connection to ARMA:</strong> after rearranging the variance equation, GARCH implies ARMA-like persistence in <MathText tex="r_t^2" />. This explains why autocorrelation in squared returns is informative about volatility memory, but it does not mean raw returns follow the same ARMA model.</p>
      </div>
    );

    const datasetBox = (
      <div>
        <p>Each selection generates 600 observations directly from the displayed ARCH/GARCH order. The model is fitted to the first 500 observations and produces a 100-step out-of-sample variance forecast, paralleling the train/test structure in the ARMA demo.</p>
        <p>All selections use the same innovation sequence and unconditional variance of <MathText>1</MathText>. Coefficients decrease across lags, and a 300-step burn-in reduces initialization effects.</p>
      </div>
    );

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ width: '100%', height: '500px' }}>
          <ZoomableChartShell
            defaultDomain={[0, xMax]}
            maxTime={xMax}
            data={chartData}
            dataKeys={['SquaredReturns', 'GeneratedVariance', 'TrueTestVariance', 'ForecastVariance']}
          >
            {(zoomDomain, computeYDomain, autoYDomain) => (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  style={{ pointerEvents: 'auto' }}
                  onClick={(event) => {
                    const time = Number(event?.activeLabel);
                    if (Number.isFinite(time) && time >= maxLag && time < trainSize) setTab2InspectTime(Math.round(time));
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/>
                  <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis domain={autoYDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                  <Legend />
                  <ReferenceLine x={trainSize} stroke="var(--text-main)" strokeDasharray="4 4" label={{ value: 'Forecast start', fill: 'var(--text-muted)', position: 'insideTopRight' }} />
                  <ReferenceLine x={inspectTime} stroke="#111827" strokeDasharray="3 3" />
                  <Area type="step" dataKey="SquaredReturns" fill="var(--text-muted)" stroke="none" fillOpacity={0.2} name="Squared returns r_t^2 (proxy)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="GeneratedVariance" stroke="#ef4444" strokeWidth={2} dot={false} name="Generated variance σ_t^2 (train)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="TrueTestVariance" stroke="#16a34a" strokeWidth={1.8} strokeDasharray="4 3" dot={false} name="True variance (test, simulation only)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="ForecastVariance" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Multi-step variance forecast" isAnimationActive={false} />
                  <Scatter data={shockPoints} dataKey="value" fill="#f59e0b" name="Shock inputs at inspected date" isAnimationActive={false} />
                  <Scatter data={variancePoints} dataKey="value" fill="#3b82f6" name="Variance-lag inputs at inspected date" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ZoomableChartShell>
        </div>
        <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-main)', fontSize: '0.9rem' }}>
          <strong>Variance anatomy at {formatDateFromIndex(inspectTime, false)}:</strong>{' '}
          <MathText tex={`\\sigma_t^2 = \\omega + \\sum_{i=1}^{p}\\alpha_i\\varepsilon_{t-i}^2 + \\sum_{j=1}^{q}\\beta_j\\sigma_{t-j}^2 = ${contributionTotal.toFixed(3)}`} />
        </div>
        <div style={{ width: '100%', height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contributionData} margin={{ top: 8, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} interval={0} />
              <YAxis domain={[0, Math.max(contributionTotal * 1.15, 0.1)]} tick={{ fill: 'var(--text-muted)' }} tickFormatter={axisShort} />
              <Tooltip
                formatter={(value, name, item) => [
                  formatValue(value),
                  item?.payload?.weight == null
                     ? 'Intercept contribution'
                    : `Weighted contribution (coefficient ${item.payload.weight.toFixed(3)})`
                ]}
                contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
              />
              <ReferenceLine y={contributionTotal} stroke="#111827" strokeDasharray="4 4" label={{ value: `Total σ_t² = ${contributionTotal.toFixed(3)}`, fill: 'var(--text-muted)', position: 'insideTopRight' }} />
              <Bar dataKey="value" name="Variance contribution" isAnimationActive={false}>
                {contributionData.map((entry, idx) => <Cell key={`${entry.label}-${idx}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    return <Layout title="4.2 The GARCH(p,q) Model" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} chartHeight="800px" />;
  };

  const renderTab3 = () => {
    const tabData = data.tab3;
    const chartData = tabData.returns.map((val, idx) => ({
      time: idx,
      TrueVol: tabData.true_vol[idx],
      GarchVol: tabData.garch_vol[idx],
      ConstVol: tabData.const_vol[idx],
      ProxyAbs: Math.sqrt(tabData.proxy[idx])
    }));
    
    const xMax = chartData.length > 0 ? chartData.length - 1 : 100;

    const commentary = (
      <div style={{ fontSize: '0.92rem' }}>
        <p><strong>Validation question:</strong> does a time-varying GARCH(1,1) estimate risk better than a constant-volatility model? Both models see the same returns, so the comparison isolates whether modeling volatility dynamics adds value.</p>
        <p><strong>Why simulation helps:</strong> real conditional variance is latent. In this simulation, the green true-volatility path is recorded by the generator, giving us ground truth that real markets cannot provide.</p>
        <p><strong>How to read the chart:</strong> the blue line is GARCH’s filtered one-step-ahead <MathText tex="\sigma_t" />, using information through <MathText tex="t - 1" />. The red line is the competing constant-volatility estimate. The gray <MathText tex="|r_t|" /> line is a noisy realized-volatility proxy, not ground truth.</p>
        <p><strong>What QLIKE measures:</strong> for realized proxy <MathText tex="v_t" /> and forecast variance <MathText tex="h_t" />, the score used here is <MathText tex="\frac{v_t}{h_t} - \ln\left(\frac{v_t}{h_t}\right) - 1" />, averaged over time. Zero is ideal and lower is better. It strongly penalizes variance forecasts that are too small when a large shock occurs.</p>
        <p><strong>What this demo shows:</strong> GARCH is closer to the simulated true variance and has lower QLIKE than the constant model. The result links the moving blue path in the graph to the lower numerical losses in the comparison table.</p>
        <p><strong>In real data:</strong> remove the green line and the true-variance MSE. Compare models out of sample using QLIKE with <MathText tex="r_t^2" /> or another realized-volatility proxy, plus VaR breach tests and stability checks.</p>
      </div>
    );

    const datasetBox = (
      <div>
        <p>Simulated GARCH returns with recorded latent variance. The two candidates are a fitted GARCH(1,1) model and a constant-variance baseline.</p>
        <p><strong>Fair comparison:</strong> both models are scored on the same 500 observations. Lower MSE and lower QLIKE are better.</p>
      </div>
    );

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem' }}>
        <table style={comparisonTableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderCellStyle}>Model</th>
              <th style={tableHeaderCellStyle}>MSE vs true variance ↓</th>
              <th style={tableHeaderCellStyle}>MSE vs <MathText tex="r_t^2" /> proxy ↓</th>
              <th style={tableHeaderCellStyle}>QLIKE ↓</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>GARCH(1,1)</td>
              <td style={tableCellStyle}>{tabData.metrics.garch.mse_true.toFixed(4)}</td>
              <td style={tableCellStyle}>{tabData.metrics.garch.mse_proxy.toFixed(4)}</td>
              <td style={tableCellStyle}>{tabData.metrics.garch.qlike_proxy.toFixed(4)}</td>
            </tr>
            <tr>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>Constant volatility</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>{tabData.metrics.constant_vol.mse_true.toFixed(4)}</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>{tabData.metrics.constant_vol.mse_proxy.toFixed(4)}</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>{tabData.metrics.constant_vol.qlike_proxy.toFixed(4)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ width: '100%', height: '430px' }}>
          <ZoomableChartShell
            defaultDomain={[0, xMax]}
            maxTime={xMax}
            data={chartData}
            dataKeys={['ProxyAbs', 'TrueVol', 'GarchVol', 'ConstVol']}
          >
            {(zoomDomain, computeYDomain, autoYDomain) => (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/>
                  <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis domain={autoYDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                  <Legend />
                  
                  <Line type="step" dataKey="ProxyAbs" stroke="var(--text-muted)" strokeWidth={1} dot={false} opacity={0.5} name="Realized |r_t| proxy" isAnimationActive={false} />
                  <Line type="monotone" dataKey="TrueVol" stroke="#10b981" strokeWidth={3} dot={false} name="True latent σ_t (simulation)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="GarchVol" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={false} name="GARCH one-step σ_t" isAnimationActive={false} />
                  <Line type="monotone" dataKey="ConstVol" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Constant σ baseline" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ZoomableChartShell>
        </div>
      </div>
    );

    return <Layout title="4.3 Performance: Validating the Unobservable" commentary={commentary} dataset={datasetBox} chart={chart} chartHeight="600px" />;
  };

  const renderTab4 = () => {
    const tabData = data.tab4;
    const confidenceLabel = varConfLevel === 10 ? '90% VaR (10% tail)' : varConfLevel === 5 ? '95% VaR (5% tail)' : '99% VaR (1% tail)';
    const evaluationCount = tabData.returns.length - tabData.window;
    const expectedBreaches = evaluationCount * varConfLevel / 100;
    const historicalBreachRate = tabData.hist_breaches[varConfLevel] / evaluationCount * 100;
    const garchBreachRate = tabData.garch_breaches[varConfLevel] / evaluationCount * 100;
    const chartData = tabData.returns.map((val, idx) => ({
      time: idx,
      Returns: val,
      HistVaR: tabData.hist_var[varConfLevel][idx],
      GarchVaR: tabData.garch_var[varConfLevel][idx],
      HistBreach: tabData.hist_breach_flags[varConfLevel][idx] ? val : null,
      GarchBreach: tabData.garch_breach_flags[varConfLevel][idx] ? val : null
    }));
    
    const xMax = chartData.length > 0 ? chartData.length - 1 : 100;

    const controls = null;

    const commentary = (
      <div style={{ fontSize: '0.92rem' }}>
        <p><strong>Goal:</strong> Value at Risk (VaR) converts a volatility estimate into a downside return threshold. A 95% one-day VaR says that, under the model, only about 5% of next-day returns should fall below the threshold.</p>
        <p><strong>Historical VaR:</strong> at each date, take the empirical lower-tail percentile of the previous 100 returns. For 95% VaR, this is the rolling 5th percentile. It assumes the recent window is representative and does not explicitly model volatility.</p>
        <p><strong>GARCH VaR:</strong> apply the conditional-volatility method from Tabs 4.2–4.3 and combine it with a distributional quantile: <MathText tex="\operatorname{VaR}_t(\alpha) = \mu_t + z_\alpha \sigma_t" />. Here <MathText tex="\mu_t = 0" /> and <MathText tex="z_\alpha" /> is the lower-tail Normal quantile. Changing confidence changes the quantile; changing market risk changes <MathText tex="\sigma_t" />.</p>
        <p><strong>Why a larger tail percentage gives more breaches:</strong> 90% VaR uses a 10% lower tail, so its threshold is closer to zero and is easier for returns to cross; roughly 10% of dates should breach. 99% VaR uses only a 1% tail, places the threshold farther into the loss tail, and should produce roughly 1% breaches. Thus larger <em>tail probability</em> means more expected breaches, while larger <em>confidence</em> means fewer.</p>
        <p><strong>Why use a Normal quantile here:</strong> it keeps the teaching link transparent: estimate <MathText tex="\sigma_t" />, then multiply by a familiar Normal quantile. It is appropriate only when standardized GARCH residuals are approximately symmetric and light-tailed. Financial returns are often heavier-tailed, so Normal VaR can underestimate extreme losses.</p>
        <p><strong>Can Student-t be used?</strong> Yes. Fit GARCH with Student-t innovations, estimate the degrees of freedom <MathText tex="\nu" />, and replace <MathText tex="z_\alpha" /> with the standardized t-quantile <MathText tex="t_{\nu,\alpha}" />. Prefer it when standardized residuals show excess kurtosis or heavy tails. Choose between Normal and t using residual histograms/QQ plots, likelihood or AIC/BIC, and—most importantly—out-of-sample VaR breach frequency and breach independence.</p>
        <p><strong>How this chart is produced:</strong> fit GARCH to returns → obtain daily <MathText tex="\sigma_t" /> → convert each <MathText tex="\sigma_t" /> into a VaR threshold → mark a breach whenever <MathText tex="r_t < \operatorname{VaR}_t" />. This is the practical risk-control use of the volatility forecasts introduced earlier.</p>
        <p><strong>Interpretation:</strong> a line that moves downward in turbulent periods is allowing for more downside risk. A breach is not automatically a failure; approximately the selected tail percentage is expected. Persistent excess breaches indicate underestimated risk and may trigger lower position limits, more capital, stronger hedges, or recalibration.</p>
      </div>
    );

    const datasetBox = (
      <div>
        <p>Simulated clustered-volatility returns. The first 100 observations initialize Historical VaR; the remaining {evaluationCount} dates are evaluated.</p>
        <p><strong>Important:</strong> this is an instructional comparison. A production backtest should estimate parameters only from information available before each forecast date and should also test breach independence.</p>
      </div>
    );

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
          <button className={`tab ${varConfLevel === 10 ? 'active' : ''}`} onClick={() => setVarConfLevel(10)}>90% (10% tail)</button>
          <button className={`tab ${varConfLevel === 5 ? 'active' : ''}`} onClick={() => setVarConfLevel(5)}>95% (5% tail)</button>
          <button className={`tab ${varConfLevel === 1 ? 'active' : ''}`} onClick={() => setVarConfLevel(1)}>99% (1% tail)</button>
        </div>
        <table style={comparisonTableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderCellStyle}>Method</th>
              <th style={tableHeaderCellStyle}>Breaches</th>
              <th style={tableHeaderCellStyle}>Observed rate</th>
              <th style={tableHeaderCellStyle}>Target rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>Historical VaR (100-day rolling)</td>
              <td style={tableCellStyle}>{tabData.hist_breaches[varConfLevel]}</td>
              <td style={tableCellStyle}>{historicalBreachRate.toFixed(1)}%</td>
              <td style={tableCellStyle}>{varConfLevel}% (≈ {expectedBreaches.toFixed(0)} breaches)</td>
            </tr>
            <tr>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>GARCH VaR (dynamic <MathText tex="\sigma_t" />)</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>{tabData.garch_breaches[varConfLevel]}</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>{garchBreachRate.toFixed(1)}%</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>{varConfLevel}% (≈ {expectedBreaches.toFixed(0)} breaches)</td>
            </tr>
          </tbody>
        </table>
        <div style={{ width: '100%', height: '430px' }}>
          <ZoomableChartShell
            defaultDomain={[tabData.window, xMax]}
            maxTime={xMax}
            data={chartData}
            dataKeys={['Returns', 'HistVaR', 'GarchVaR']}
          >
            {(zoomDomain, computeYDomain, autoYDomain) => (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis domain={autoYDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                  <Legend />
                  
                  <Line type="monotone" dataKey="Returns" stroke="var(--text-muted)" strokeWidth={1} dot={false} name="Daily returns" isAnimationActive={false} />
                  <Line type="step" dataKey="HistVaR" stroke="#f59e0b" strokeWidth={2} dot={false} name={`Historical ${confidenceLabel}`} isAnimationActive={false} />
                  <Line type="step" dataKey="GarchVaR" stroke="#ef4444" strokeWidth={2} dot={false} name={`GARCH ${confidenceLabel}`} isAnimationActive={false} />
                  <Scatter dataKey="HistBreach" fill="#f59e0b" name="Historical breaches" />
                  <Scatter dataKey="GarchBreach" fill="#ef4444" name="GARCH breaches" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ZoomableChartShell>
        </div>
      </div>
    );

    return <Layout title="4.4 Application: Value at Risk (VaR)" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} chartHeight="640px" />;
  };

  const renderTab5 = () => {
    const tabData = data.tab5;
    const constantOutside = tabData.metrics.constant_band.outside_count;
    const garchOutside = tabData.metrics.garch_band.outside_count;
    const constantCoverageWins = tabData.metrics.constant_band.coverage_error < tabData.metrics.garch_band.coverage_error;
    const constantWidthWins = tabData.metrics.constant_band.average_width < tabData.metrics.garch_band.average_width;
    const constantScoreWins = tabData.metrics.constant_band.interval_score < tabData.metrics.garch_band.interval_score;
    const garchWidthReduction = 100 * (1 - tabData.metrics.garch_band.average_width / tabData.metrics.constant_band.average_width);
    const garchScoreReduction = 100 * (1 - tabData.metrics.garch_band.interval_score / tabData.metrics.constant_band.interval_score);
    const chartData = tabData.actual.map((val, idx) => ({
        time: idx,
        Actual: val,
        Residual: tabData.residuals[idx],
        RollingVar: tabData.rolling_var[idx],
        ConstantLower: tabData.arma_mean[idx] - 1.96 * tabData.arma_vol[idx],
        ConstantUpper: tabData.arma_mean[idx] + 1.96 * tabData.arma_vol[idx],
        GarchLower: tabData.arma_mean[idx] - 1.96 * tabData.garch_vol[idx],
        GarchUpper: tabData.arma_mean[idx] + 1.96 * tabData.garch_vol[idx],
        ConstantBreach: tabData.const_outside_flags[idx] ? val : null,
        GarchBreach: tabData.garch_outside_flags[idx] ? val : null
      }));
    
    const xMax = chartData.length > 0 ? chartData.length - 1 : 100;

    const controls = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button className={`nav-btn ${tab5Step !== 2 ? 'primary' : 'secondary'}`} onClick={() => setTab5Step(1)}>Interval Comparison</button>
          <button className={`nav-btn ${tab5Step === 2 ? 'primary' : 'secondary'}`} onClick={() => setTab5Step(2)}>Analyze Residuals</button>
        </div>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.92rem' }}>
        <p><strong>Why combine them:</strong> ARIMA models the conditional mean <MathText tex="\mu_t = \mathbb{E}(y_t \mid \mathcal{F}_{t-1})" />; GARCH models the conditional residual variance <MathText tex="\sigma_t^2 = \operatorname{Var}(\varepsilon_t \mid \mathcal{F}_{t-1})" />. ARIMA answers “where is the series expected to be?” while GARCH answers “how uncertain is that expectation now?”</p>
        <p><strong>What <MathText tex="\mathcal{F}_{t-1}" /> means:</strong> it is the information set available immediately before time <MathText tex="t" />—past observations, past forecast errors, and past conditional variances through <MathText tex="t - 1" />. The notation makes the no-look-ahead rule explicit: forecasts for time <MathText tex="t" /> cannot use <MathText tex="y_t" />.</p>
        <p><strong>How this demo estimates the model:</strong> it uses a common two-stage procedure. First fit ARIMA(1,0,1) on training data. Then fit GARCH(1,1) to the ARIMA residuals. In the held-out period, update both models one observation at a time without refitting parameters. Joint maximum-likelihood estimation is possible, but it is not used here.</p>
        <p><strong>What is held constant:</strong> ARIMA-only and ARIMA-GARCH use exactly the same one-step mean forecast. Therefore their point RMSE is identical ({tabData.metrics.point_rmse.toFixed(3)}). The mean line is intentionally omitted from the comparison graph: the only difference being evaluated is whether interval width remains constant or changes with GARCH volatility.</p>
        <p><strong>What “outside” means:</strong> an observation is outside when <MathText tex="y_t < \mu_t - 1.96\sigma_t" /> or <MathText tex="y_t > \mu_t + 1.96\sigma_t" />. Under a well-calibrated conditional Normal 95% interval, about 5% should be outside—not zero.</p>
        <p><strong>How to interpret the table:</strong> coverage should be close to 95%, not maximized. Fewer outside points can be achieved by making intervals uselessly wide, so outside count alone does not determine the winner. <strong>Average width</strong> is the mean value of <MathText tex="U_t-L_t" />. Smaller width means a more precise, sharper interval, but it is better only when coverage remains close to its target; shrinking a band simply to reduce width would create too many misses. <strong>Interval score</strong> evaluates both sharpness and those misses:
          <span style={{ display: 'block', maxWidth: '100%', overflowX: 'auto', padding: '0.35rem 0' }}>
            <MathText tex="\operatorname{IS}_{\alpha}=(U-L)+\frac{2}{\alpha}(L-y)\mathbf{1}(y<L)+\frac{2}{\alpha}(y-U)\mathbf{1}(y>U)" />
          </span>
          Lower is better.
        </p>
        <p><strong>Result here:</strong> GARCH coverage is {tabData.metrics.garch_band.inside_pct.toFixed(1)}%, closer to the 95% target than the constant model’s {tabData.metrics.constant_band.inside_pct.toFixed(1)}%. It also reduces average width by {garchWidthReduction.toFixed(1)}% and interval score by {garchScoreReduction.toFixed(1)}%. This is a clear interval-forecast win: GARCH is better calibrated, sharper, and less heavily penalized for misses.</p>
        {tab5Step !== 2 && <p><strong>How to compare the overlaid intervals:</strong> blue boundaries are ARIMA with constant residual volatility; amber boundaries are ARIMA with dynamic GARCH volatility. The blue pair keeps approximately the same separation, while the amber pair narrows in calm periods and widens after volatility shocks. Bright blue diamonds and bright orange circles highlight observations outside the respective intervals. In this sample GARCH has {garchOutside} outside points versus {constantOutside} for the constant band, but its lower interval score ({tabData.metrics.garch_band.interval_score.toFixed(3)} vs {tabData.metrics.constant_band.interval_score.toFixed(3)}) is the meaningful improvement.</p>}
        {tab5Step === 2 && <p><strong>Why analyze residuals separately:</strong> the residuals fluctuate around zero, but their 20-day rolling variance changes over time. ARIMA has handled mean dependence; remaining variance clustering motivates fitting GARCH to those residuals. This diagnostic is separated from the interval comparison so it does not clutter the two-model result.</p>}
      </div>
    );

    const datasetBox = (
      <div>
        <p>Synthetic ARMA(1,1)-GARCH(1,1) series with strong volatility persistence: <MathText tex="\alpha=0.22" />, <MathText tex="\beta=0.76" />, and <MathText tex="\alpha+\beta=0.98" />. There are 500 observations for estimation and {tabData.test_size} held-out observations for walk-forward testing.</p>
        <p>The table and chart report test-period results only. This prevents in-sample fit from being presented as forecast performance.</p>
      </div>
    );

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem' }}>
        {tab5Step !== 2 && <table style={comparisonTableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderCellStyle}>Interval model</th>
              <th style={tableHeaderCellStyle}>Coverage (target 95%)</th>
              <th style={tableHeaderCellStyle}>Outside points</th>
              <th style={tableHeaderCellStyle}>Average width ↓</th>
              <th style={tableHeaderCellStyle}>Interval score ↓</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>ARIMA + constant <MathText tex="\sigma" /></td>
              <td style={{ ...tableCellStyle, ...(constantCoverageWins ? winnerCellStyle : {}) }}>{tabData.metrics.constant_band.inside_pct.toFixed(1)}%</td>
              <td style={tableCellStyle}>{constantOutside} / {tabData.test_size}</td>
              <td style={{ ...tableCellStyle, ...(constantWidthWins ? winnerCellStyle : {}) }}>{tabData.metrics.constant_band.average_width.toFixed(3)}</td>
              <td style={{ ...tableCellStyle, ...(constantScoreWins ? winnerCellStyle : {}) }}>{tabData.metrics.constant_band.interval_score.toFixed(3)}</td>
            </tr>
            <tr>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>ARIMA + GARCH <MathText tex="\sigma_t" /></td>
              <td style={{ ...tableCellStyle, borderBottom: 'none', ...(!constantCoverageWins ? winnerCellStyle : {}) }}>{tabData.metrics.garch_band.inside_pct.toFixed(1)}%</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none' }}>{garchOutside} / {tabData.test_size}</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none', ...(!constantWidthWins ? winnerCellStyle : {}) }}>{tabData.metrics.garch_band.average_width.toFixed(3)}</td>
              <td style={{ ...tableCellStyle, borderBottom: 'none', ...(!constantScoreWins ? winnerCellStyle : {}) }}>{tabData.metrics.garch_band.interval_score.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>}
        <div style={{ width: '100%', height: tab5Step === 2 ? '530px' : '430px' }}>
          <ZoomableChartShell defaultDomain={[0, xMax]} maxTime={xMax}>
            {(zoomDomain) => {
              const visibleData = chartData.filter((point) => point.time >= zoomDomain[0] && point.time <= zoomDomain[1]);
              const comparisonYDomain = tightDomain(visibleData.flatMap((point) => [
                point.Actual,
                point.ConstantLower,
                point.ConstantUpper,
                point.GarchLower,
                point.GarchUpper
              ]));
              const residualYDomain = tightDomain(visibleData.map((point) => point.Residual));
              const rollingVarianceYDomain = tightDomain(visibleData.map((point) => point.RollingVar), 0);
              return <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                {tab5Step === 2 ? (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                    <YAxis yAxisId="left" domain={residualYDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                    <YAxis yAxisId="right" orientation="right" domain={rollingVarianceYDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                    <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                    <Legend />
                    <ReferenceLine y={0} yAxisId="left" stroke="var(--text-main)" strokeDasharray="3 3" />
                    <Line yAxisId="left" type="monotone" dataKey="Residual" stroke="#ef4444" strokeWidth={1} dot={false} name="ARIMA Residuals (Errors)" isAnimationActive={false} />
                    <Area yAxisId="right" type="step" dataKey="RollingVar" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.3} dot={false} name="Rolling Variance (20-day)" isAnimationActive={false} />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                    <YAxis domain={comparisonYDomain} allowDataOverflow tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                    <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                    <Legend />

                    <Line type="monotone" dataKey="Actual" stroke="var(--text-main)" strokeWidth={1.2} dot={false} name="Observed value" isAnimationActive={false} />
                    <Line type="step" dataKey="ConstantUpper" stroke="#3b82f6" strokeWidth={1.7} strokeDasharray="6 3" dot={false} name="ARIMA + constant σ boundary" isAnimationActive={false} />
                    <Line type="step" dataKey="ConstantLower" stroke="#3b82f6" strokeWidth={1.7} strokeDasharray="6 3" dot={false} name="ARIMA + constant σ boundary" legendType="none" isAnimationActive={false} />
                    <Line type="step" dataKey="GarchUpper" stroke="#d6a11d" strokeWidth={1.9} dot={false} name="ARIMA + GARCH σ_t boundary" isAnimationActive={false} />
                    <Line type="step" dataKey="GarchLower" stroke="#d6a11d" strokeWidth={1.9} dot={false} name="ARIMA + GARCH σ_t boundary" legendType="none" isAnimationActive={false} />
                    <Scatter dataKey="ConstantBreach" fill="#0057ff" stroke="#ffffff" strokeWidth={1.2} shape="diamond" name="Outside constant interval" isAnimationActive={false} />
                    <Scatter dataKey="GarchBreach" fill="#ff5a00" stroke="#ffffff" strokeWidth={1.2} shape="circle" name="Outside GARCH interval" isAnimationActive={false} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>;
            }}
          </ZoomableChartShell>
        </div>
      </div>
    );

    return <Layout title="Putting It Together: ARIMA-GARCH" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} chartHeight="600px" />;
  };

  const renderTab6 = () => {
    const tabData = data.tab6;
    const chartData = tabData.returns.map((val, idx) => ({
      time: idx,
      Returns: val,
      GARCH: tabData.garch_vol[idx],
      EGARCH: tabData.egarch_vol[idx],
      APARCH: tabData.aparch_vol[idx]
    }));
    
    const niData = tabData.news_impact.z.map((val, idx) => ({
      z: val,
      GARCH: tabData.news_impact.garch[idx],
      EGARCH: tabData.news_impact.egarch[idx],
      APARCH: tabData.news_impact.aparch[idx]
    }));
    
    const xMax = chartData.length > 0 ? chartData.length - 1 : 100;

    const controls = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={`nav-btn ${tab6View === 'ts' ? 'primary' : 'secondary'}`} onClick={() => setTab6View('ts')}>Time Series View</button>
          <button className={`nav-btn ${tab6View === 'ni' ? 'primary' : 'secondary'}`} onClick={() => setTab6View('ni')}>News Impact Curve</button>
        </div>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.92rem' }}>
        <p><strong>Starting limitation—standard GARCH:</strong> its shock term is squared, so shocks of <MathText tex="+x" /> and <MathText tex="-x" /> have the same variance effect. That symmetry is often unrealistic for equities, where negative news raises volatility more than equally sized positive news.</p>
        <p><strong>EGARCH:</strong> models <MathText tex="\ln(\sigma_t^2)" /> and includes a signed-shock term. The log form keeps variance positive without non-negativity constraints, while the sign term captures leverage effects. It is useful when downside news causes sharp, asymmetric risk responses.</p>
        <p><strong>APARCH:</strong> models a learned power <MathText tex="\sigma_t^\delta" /> and uses <MathText tex="(|\varepsilon_{t-1}| - \gamma \varepsilon_{t-1})^\delta" />. It can learn both asymmetry and whether absolute shocks, squared shocks, or an intermediate power best describe the asset. This flexibility is useful across assets with different tail and leverage behavior.</p>
        <p><strong>How the two demo views connect:</strong> the time-series view filters each model through actual dated returns. The news-impact curve is a controlled “what-if” calculation from the same fitted parameters, not the dated series with its x-axis renamed.</p>
        {tab6View === 'ts'
          ? <p><strong>Read the time-series view:</strong> compare how quickly the three volatility estimates react after negative return shocks and how slowly they decay afterward. Similar-looking paths can still imply very different responses to shock sign.</p>
          : (
            <>
              <p><strong>How one curve point is derived:</strong> choose an x-value such as <MathText tex="z_{t-1}=-2" />. This means a prior shock two conditional standard deviations below the mean. Hold prior variance at the shared baseline <MathText tex="\bar{\sigma}^{2}" />, convert the standardized shock to <MathText tex="\varepsilon_{t-1}=z_{t-1}\bar{\sigma}" />, and substitute those values into each fitted variance equation.</p>
              <p><strong>For standard GARCH:</strong> the plotted y-value is <MathText tex="\sigma_t^2=\hat{\omega}+\hat{\alpha}\varepsilon_{t-1}^{2}+\hat{\beta}\bar{\sigma}^{2}" />. Squaring removes the sign, so <MathText tex="z=-2" /> and <MathText tex="z=+2" /> produce the same response.</p>
              <p><strong>For EGARCH/APARCH:</strong> the same hypothetical shock enters a signed term. EGARCH uses a term proportional to <MathText tex="\hat{\gamma}z_{t-1}" /> in log variance; APARCH uses <MathText tex="(|\varepsilon_{t-1}|-\hat{\gamma}\varepsilon_{t-1})^{\hat{\delta}}" />. Their y-values can therefore differ for equally sized positive and negative shocks.</p>
              <p><strong>Relationship to a dated point:</strong> no news-impact point is copied directly from the time-series graph. A dated filtered value uses that date’s actual standardized shock and its actual lagged variance. It would coincide with a curve point only if its lagged variance equaled the chosen baseline. The curve deliberately fixes history so shock sign and magnitude are the only changing inputs.</p>
              <p><strong>Read the curve:</strong> compare points equally far from zero. GARCH is symmetric; EGARCH/APARCH can be higher on the negative side. The curve isolates model mechanics, whereas the dated view combines shock size, sign, and volatility history.</p>
            </>
          )}
        <p><strong>General limitation of the GARCH family:</strong> these models impose a fixed low-dimensional recurrence and usually a chosen innovation distribution. They can miss structural breaks, long-range nonlinearities, cross-asset spillovers, and information in text, order flow, or macro variables. Those limits motivate regime-switching, multivariate, realized-volatility, and deep-learning models—but more flexible models still need disciplined out-of-sample risk validation.</p>
      </div>
    );

    const datasetBox = (
      <div>
        <p>Synthetic equity-style returns generated with a stronger response to negative shocks. GARCH(1,1), EGARCH(1,1), and APARCH(1,1) are fitted to the same series.</p>
        <p>The news-impact curves use the fitted parameters and a shared baseline variance, making sign-response differences comparable.</p>
      </div>
    );

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {tab6View === 'ts' ? (
          <div style={{ width: '100%', height: '500px' }}>
            <SyncedDualChart
              defaultDomain={[0, xMax]}
              maxTime={xMax}
              top={{
                title: 'Observed returns by date',
                titleAlign: 'center',
                minHeight: '200px',
                content: (zoomDomain) => (
                  <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                    <LineChart data={chartData} syncId="tab6" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/>
                      <XAxis dataKey="time" type="number" domain={zoomDomain} tickFormatter={dateTick} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                      <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                      <Line type="monotone" dataKey="Returns" stroke="var(--text-muted)" strokeWidth={1} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ),
              }}
              bottom={{
                title: 'Filtered conditional volatility σ_t by date',
                titleAlign: 'center',
                minHeight: '200px',
                content: (zoomDomain) => (
                  <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                    <LineChart data={chartData} syncId="tab6" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/>
                      <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} hide />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                      <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={dateTooltip} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="GARCH" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="EGARCH" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="APARCH" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ),
              }}
            />
          </div>
        ) : (
          <div style={{ width: '100%', height: '400px' }}>
            <h4 style={{ textAlign: 'center' }}>Fitted-model scenario: next variance <MathText tex="\sigma_t^2" /> vs prior standardized shock <MathText tex="z_{t-1}" /></h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={niData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
                <XAxis dataKey="z" type="number" domain={[-3, 3]} tick={{ fill: 'var(--text-muted)' }} label={{ value: 'Prior standardized shock z_{t-1}', position: 'bottom', fill: 'var(--text-muted)' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} label={{ value: 'Next-step variance σ_t²', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} />
                <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={(l) => `Prior shock z_{t-1}: ${Number(l).toFixed(2)}`} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                <Legend verticalAlign="top" />
                <Line type="monotone" dataKey="GARCH" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="EGARCH" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="APARCH" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                <ReferenceLine x={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );

    return <Layout title="4.6 Extensions: EGARCH, APARCH, and Limits" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} chartHeight={tab6View === 'ts' ? '570px' : '480px'} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {activeTab === 1 && renderTab1()}
      {activeTab === 2 && renderTab2()}
      {activeTab === 3 && renderTab3()}
      {activeTab === 4 && renderTab4()}
      {activeTab === 5 && renderTab5()}
      {activeTab === 6 && renderTab6()}
    </div>
  );
}
