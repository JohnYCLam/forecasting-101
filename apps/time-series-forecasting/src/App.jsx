import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, TrendingUp, Waves, Info } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import Topic2 from './Topic2';
import Topic3 from './Topic3';
import Topic4 from './Topic4';
import Topic5 from './Topic5';
import { ZoomableChartShell } from './charts';
import { formatValue } from './utils';
import { MathText, ModelOrder } from './MathText';
import { pendingTopics } from '../../../site/navigation.js';
import scope from '../../../course-scope.json';

export default function App() {
  const [activeTopic, setActiveTopic] = useState(1);
  const [activeSubTopic, setActiveSubTopic] = useState(1);
  const [data, setData] = useState(null);
  const [activeModel, setActiveModel] = useState('ses');

  // Parameter states (0.0 to 1.0)
  const [alpha, setAlpha] = useState(0.2);
  const [beta, setBeta] = useState(0.5);
  const [gamma, setGamma] = useState(0.5);

  const maxTime = 119;

  useEffect(() => {
    window.dispatchEvent(new Event('hub:controls-ready'));
  }, [data]);

  useEffect(() => {
    document.querySelectorAll('#navigation .nav-item').forEach(button => {
      if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }, [activeTopic, activeSubTopic, data]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}topic1_data.json`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Failed to load data", err));
  }, []);

  if (!data) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Time Series Engine...</div>;

  const modelConfig = {
    ses: {
      name: 'Simple Exponential Smoothing',
      icon: <Activity size={20} />,
      description: <>SES is the foundation. It calculates a weighted average of past observations. High <MathText tex="\alpha" /> means it forgets the past quickly and chases recent noise. Low <MathText tex="\alpha" /> means it remembers the deep past, creating a smoother line.</>,
      datasetDescription: <>Stationary data (flat level plus high noise): a horizontal baseline subjected to large random fluctuations. This isolates how the level-smoothing parameter <MathText tex="\alpha" /> controls responsiveness.</>
    },
    holt: {
      name: "Holt's Linear",
      icon: <TrendingUp size={20} />,
      description: <>Holt adds a trend component. When the underlying trend suddenly changes, <MathText tex="\beta" /> determines how quickly the estimated slope catches up.</>,
      datasetDescription: <>Structural break (changing trend): the series begins with a slow upward trend and then accelerates. This isolates how the trend-smoothing parameter <MathText tex="\beta" /> learns a new slope.</>
    },
    hw: {
      name: 'Holt-Winters',
      icon: <Waves size={20} />,
      description: <>Holt-Winters adds seasonality. When the seasonal amplitude changes, <MathText tex="\gamma" /> determines how quickly the model learns the new seasonal pattern.</>,
      datasetDescription: <>Amplitude jump (changing seasonality): a 12-month cycle becomes three times larger halfway through. This isolates how the seasonal-smoothing parameter <MathText tex="\gamma" /> adapts.</>
    }
  };

  const config = modelConfig[activeModel];
  const modelData = data[activeModel];

  // Construct the lookup key based on the active model's required parameters
  let activeKey = '';
  if (activeModel === 'ses') {
    activeKey = `${alpha.toFixed(1)}`;
  } else if (activeModel === 'holt') {
    activeKey = `${alpha.toFixed(1)}_${beta.toFixed(1)}`;
  } else if (activeModel === 'hw') {
    activeKey = `${alpha.toFixed(1)}_${beta.toFixed(1)}_${gamma.toFixed(1)}`;
  }

  const activeResult = modelData.results[activeKey] || { in_sample: [], out_sample: [] };

  // Build chart data array
  const chartData = [];
  const totalLength = modelData.actual.length;

  for (let i = 0; i < totalLength; i++) {
    const isTrain = i < modelData.train_size;
    chartData.push({
      time: i,
      actual: modelData.actual[i],
      inSample: isTrain ? activeResult.in_sample[i] : null,
      forecast: !isTrain ? activeResult.out_sample[i - modelData.train_size] : null
    });
  }

  return (
    <div className="main-layout">
      <a className="skip" href="#main">Skip to lesson</a>
      <aside id="sidebar" className="sidebar course-sidebar">
        <div className="sidebar-heading">
          <a className="brand" href="/time-series-forecasting/" aria-label="Time-series forecasting home"><span className="brand-mark" data-icon="wave" aria-hidden="true" /><span>Time-series<br />forecasting</span></a>
          <button className="shell-collapse" data-sidebar-toggle aria-controls="sidebar" aria-label="Hide navigation"><span data-icon="panel" aria-hidden="true" /></button>
        </div>
        <a className="all-topics" href="/"><span data-icon="arrow" aria-hidden="true" />All topics</a>
        <div className="side-caption">AN INTERACTIVE INTRODUCTION</div>
        <details id="mobile-menu" open><summary>Contents <span data-icon="chevron" aria-hidden="true" /></summary>
        <nav id="navigation" className="nav-menu" aria-label="Lesson chapters">
          <button type="button" className={`nav-item ${activeTopic === 1 ? 'active' : ''}`} onClick={() => { setActiveTopic(1); }} style={{ cursor: 'pointer' }}>
            <span className="nav-number">1</span><span>Basic Forecast</span>
          </button>
          <button type="button" className={`nav-item ${activeTopic === 2 ? 'active' : ''}`} onClick={() => { setActiveTopic(2); setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
            <span className="nav-number">2</span><span>ARIMA & Selection</span>
          </button>
          {activeTopic === 2 && (
            <div className="nav-subsections">
              <button type="button" className={`nav-item ${activeSubTopic === 1 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
                <span>2.1 <ModelOrder name="ARMA">p, q</ModelOrder> Basics</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 2 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(2); }} style={{ cursor: 'pointer' }}>
                <span>2.2 ARMA vs HW Behaviours</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 3 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(3); }} style={{ cursor: 'pointer' }}>
                <span>2.3 Real World Data</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 4 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(4); }} style={{ cursor: 'pointer' }}>
                <span>2.4 Auto ARIMA</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 5 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(5); }} style={{ cursor: 'pointer' }}>
                <span>2.5 SARIMA vs HW</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 6 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(6); }} style={{ cursor: 'pointer' }}>
                <span>2.6 SARIMAX</span>
              </button>
            </div>
          )}
          <button type="button" className={`nav-item ${activeTopic === 3 ? 'active' : ''}`} onClick={() => { setActiveTopic(3); setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
            <span className="nav-number">3</span><span>Metrics & Validation</span>
          </button>
          {activeTopic === 3 && (
            <div className="nav-subsections">
              <button type="button" className={`nav-item ${activeSubTopic === 1 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
                <span>3.1 MAE vs RMSE</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 2 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(2); }} style={{ cursor: 'pointer' }}>
                <span>3.2 MAPE Family</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 3 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(3); }} style={{ cursor: 'pointer' }}>
                <span>3.3 Walk-Forward Validation</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 4 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(4); }} style={{ cursor: 'pointer' }}>
                <span>3.4 Validation Strategy</span>
              </button>
            </div>
          )}
          <button type="button" className={`nav-item ${activeTopic === 4 ? 'active' : ''}`} onClick={() => { setActiveTopic(4); setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
            <span className="nav-number">4</span><span>Volatility: GARCH</span>
          </button>
          {activeTopic === 4 && (
            <div className="nav-subsections">
              <button type="button" className={`nav-item ${activeSubTopic === 1 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
                <span>4.1 Introduction to ARCH</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 2 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(2); }} style={{ cursor: 'pointer' }}>
                <span>4.2 The <ModelOrder name="GARCH">p, q</ModelOrder> Model</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 3 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(3); }} style={{ cursor: 'pointer' }}>
                <span>4.3 Performance Validation</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 4 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(4); }} style={{ cursor: 'pointer' }}>
                <span>4.4 Value at Risk (VaR)</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 5 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(5); }} style={{ cursor: 'pointer' }}>
                <span>4.5 ARIMA-GARCH</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 6 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(6); }} style={{ cursor: 'pointer' }}>
                <span>4.6 Extensions & Limits</span>
              </button>
            </div>
          )}
          <button type="button" className={`nav-item ${activeTopic === 5 ? 'active' : ''}`} onClick={() => { setActiveTopic(5); setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
            <span className="nav-number">5</span><span>VARIMA</span>
          </button>
          {activeTopic === 5 && (
            <div className="nav-subsections">
              <button type="button" className={`nav-item ${activeSubTopic === 1 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(1); }} style={{ cursor: 'pointer' }}>
                <span>5.1 What VARMA Is</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 2 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(2); }} style={{ cursor: 'pointer' }}>
                <span>5.2 Coefficient Matrices</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 3 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(3); }} style={{ cursor: 'pointer' }}>
                <span>5.3 Problems with VARMA</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 4 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(4); }} style={{ cursor: 'pointer' }}>
                <span>5.4 Granger Causality</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 5 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(5); }} style={{ cursor: 'pointer' }}>
                <span>5.5 Walk-Forward Validation</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 6 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(6); }} style={{ cursor: 'pointer' }}>
                <span>5.6 Curse of Dimensionality</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 7 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(7); }} style={{ cursor: 'pointer' }}>
                <span>5.7 Coefficient Stability</span>
              </button>
              <button type="button" className={`nav-item ${activeSubTopic === 8 ? 'active' : ''}`} onClick={() => { setActiveSubTopic(8); }} style={{ cursor: 'pointer' }}>
                <span>5.8 Cointegration & VECM</span>
              </button>
            </div>
          )}
        </nav>
        <div dangerouslySetInnerHTML={{ __html: pendingTopics('forecasting', scope.forecastingMax) }} />
        </details>
        <div className="side-foot"><span className="status-dot" /> Learn by changing one thing.<br /><small>All experiments run on your device.</small></div>
      </aside>

      {/* Main Content */}
      <div className="course-page">
        <header className="topbar">
          <div className="topbar-location"><button className="shell-expand" data-sidebar-toggle aria-controls="sidebar" aria-label="Show navigation"><span data-icon="panel" aria-hidden="true" /></button><span>{activeTopic} / TIME-SERIES FORECASTING</span></div>
          <div className="top-actions"><button className="theme-toggle" data-theme-toggle><span data-theme-icon aria-hidden="true" /><span data-theme-label>Dark mode</span></button></div>
        </header>
      <main id="main" className="app-container" tabIndex={-1}>
        <div className="chapter-top">
          <div className="chapter-num">SECTION {activeTopic}</div>
          <div>
            <h1>{activeTopic === 1 ? 'Topic 1: Exponential Smoothing' : activeTopic === 2 ? 'Topic 2: ARIMA and Model Selection' : activeTopic === 3 ? 'Topic 3: Metrics & Validation' : activeTopic === 4 ? 'Topic 4: Volatility & GARCH' : activeTopic === 5 ? 'Topic 5: VARIMA — Forecasting Connected Series' : ''}</h1>
            <div className="subtitle">{activeTopic === 1 ? 'Understanding Level, Trend, and Seasonality' : activeTopic === 2 ? 'Autoregressive, Moving Average, and Exogenous variables' : activeTopic === 3 ? 'Understanding Errors, Evaluation, and Robustness' : activeTopic === 4 ? 'Modeling Dynamic Risk and Market Shocks' : activeTopic === 5 ? 'Using Cross-Series Feedback to Improve Forecasts, Model Selection, and Long-Run Equilibrium' : ''}</div>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {activeTopic === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Top Panels */}
              <div className="top-panels">
                {/* Left: Commentary */}
                <div className="glass controls-panel">
                  <div className="commentary-box" style={{ height: '100%' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {config.icon}
                      {config.name}
                    </h4>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      {config.description}
                    </p>
                  </div>
                </div>

                {/* Right: Dataset Details */}
                <div className="glass controls-panel">
                  <div className="commentary-box" style={{ height: '100%' }}>
                    <h4><Info size={18} /> Dataset Details</h4>
                    <p>{config.datasetDescription}</p>
                  </div>
                </div>
              </div>

              {/* Middle: Controls */}
              <div className="glass controls-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
                {/* Alpha Slider */}
                <div className="slider-container" style={{ flex: 1, minWidth: '150px' }}>
                  <label>
                    <span><MathText tex="\alpha" /> (level)</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{alpha.toFixed(1)}</span>
                  </label>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  />
                </div>

                {/* Beta Slider */}
                {(activeModel === 'holt' || activeModel === 'hw') && (
                  <div className="slider-container" style={{ flex: 1, minWidth: '150px' }}>
                    <label>
                      <span><MathText tex="\beta" /> (trend)</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{beta.toFixed(1)}</span>
                    </label>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={beta}
                      onChange={(e) => setBeta(parseFloat(e.target.value))}
                    />
                  </div>
                )}

                {/* Gamma Slider */}
                {activeModel === 'hw' && (
                  <div className="slider-container" style={{ flex: 1, minWidth: '150px' }}>
                    <label>
                      <span><MathText tex="\gamma" /> (seasonality)</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{gamma.toFixed(1)}</span>
                    </label>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={gamma}
                      onChange={(e) => setGamma(parseFloat(e.target.value))}
                    />
                  </div>
                )}
              </div>

              {/* Bottom: Wide Chart */}
              <div className="glass chart-container" style={{ width: '100%', height: '550px', display: 'flex', flexDirection: 'column' }}>
                <div className="chart-header">
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                    Forecast Visualization
                  </h2>
                  <div className="tabs">
                    <button
                      className={`tab ${activeModel === 'ses' ? 'active' : ''}`}
                      onClick={() => { setActiveModel('ses'); setAlpha(0.2); }}
                    >
                      SES
                    </button>
                    <button
                      className={`tab ${activeModel === 'holt' ? 'active' : ''}`}
                      onClick={() => { setActiveModel('holt'); setAlpha(0.8); setBeta(0.5); }}
                    >
                      Holt's Linear
                    </button>
                    <button
                      className={`tab ${activeModel === 'hw' ? 'active' : ''}`}
                      onClick={() => { setActiveModel('hw'); setAlpha(0.2); setBeta(0.5); setGamma(0.5); }}
                    >
                      Holt-Winters
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: '400px', height: '100%', paddingBottom: '20px' }}>
                  <ZoomableChartShell
                    key={activeModel}
                    defaultDomain={[0, maxTime]}
                    maxTime={maxTime}
                    data={chartData}
                    dataKeys={['actual', 'inSample', 'forecast']}
                  >
                    {(zoomDomain, computeYDomain, autoYDomain) => (
                      <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                          style={{ pointerEvents: 'auto' }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="time"
                            type="number"
                            domain={zoomDomain}
                            allowDataOverflow={true}
                            tick={{ fill: 'var(--text-muted)' }}
                            tickFormatter={(val) => typeof val === 'number' ? Number(val.toFixed(0)).toString() : val}
                          />
                          <YAxis
                            domain={autoYDomain}
                            allowDataOverflow={true}
                            tick={{ fill: 'var(--text-muted)' }}
                            tickFormatter={formatValue}
                          />
                          <Tooltip
                            isAnimationActive={false}
                            contentStyle={{ pointerEvents: 'none', backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }}
                            formatter={formatValue}
                            labelFormatter={(label) => `Time: ${typeof label === 'number' ? Number(label.toFixed(0)).toString() : label}`}
                          />
                          <Legend verticalAlign="top" height={36} style={{ pointerEvents: 'none' }} />
                          <ReferenceLine x={modelData.train_size - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast Start', fill: 'var(--text-muted)' }} />

                          <Line type="monotone" dataKey="actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} name="Actual Data" isAnimationActive={false} />
                          <Line type="monotone" dataKey="inSample" stroke="var(--coral)" strokeWidth={2} strokeOpacity={0.4} dot={false} name="In-Sample Fit" isAnimationActive={false} />
                          <Line type="monotone" dataKey="forecast" stroke="var(--coral)" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Forecast" isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </ZoomableChartShell>
                </div>
              </div>
            </div>
          ) : activeTopic === 2 ? (
            <Topic2 activeTab={activeSubTopic} />
          ) : activeTopic === 3 ? (
            <Topic3 activeTab={activeSubTopic} />
          ) : activeTopic === 4 ? (
            <Topic4 activeTab={activeSubTopic} />
          ) : activeTopic === 5 ? (
            <Topic5 activeTab={activeSubTopic} />
          ) : null}
        </div>
      </main>
      <footer className="course-footer"><span>Time-series forecasting · Learning Hub</span><a href="/">All topics →</a></footer>
      </div>
      <Analytics />
    </div>
  );
}
