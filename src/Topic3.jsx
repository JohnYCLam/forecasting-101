import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { ZoomIn, ZoomOut, Info, BrainCircuit } from 'lucide-react';

function SyncedChartsWithZoom({ chartData, trainSize, timeLabels, showTrain }) {
  const maxTime = chartData.length > 0 ? chartData[chartData.length - 1].time : 100;
  const [zoomDomain, setZoomDomain] = useState([trainSize, maxTime]);
  const [hoveredTime, setHoveredTime] = useState(maxTime / 2);
  
  const chartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastClientX, setLastClientX] = useState(0);

  useEffect(() => {
    if (showTrain) {
      setZoomDomain([0, maxTime]);
    } else {
      setZoomDomain([trainSize, maxTime]);
    }
  }, [showTrain, maxTime, trainSize]);

  // Zoom handling functions
  const handleZoomIn = (anchor = (zoomDomain[0] + zoomDomain[1]) / 2) => {
    setZoomDomain(prev => {
      const range = prev[1] - prev[0];
      if (range <= 15) return prev;
      const shrink = range * 0.15;
      const anchorRatio = Math.max(0, Math.min(1, (anchor - prev[0]) / range));
      return [prev[0] + shrink * anchorRatio, prev[1] - shrink * (1 - anchorRatio)];
    });
  };

  const handleZoomOut = (anchor = (zoomDomain[0] + zoomDomain[1]) / 2) => {
    setZoomDomain(prev => {
      const range = prev[1] - prev[0];
      if (range >= maxTime) return [0, maxTime];
      const expand = range * 0.15;
      const anchorRatio = Math.max(0, Math.min(1, (anchor - prev[0]) / range));
      let newLeft = prev[0] - expand * anchorRatio;
      let newRight = prev[1] + expand * (1 - anchorRatio);
      if (newLeft < 0) { newRight -= newLeft; newLeft = 0; }
      if (newRight > maxTime) { newLeft -= (newRight - maxTime); newRight = maxTime; }
      return [Math.max(0, newLeft), Math.min(maxTime, newRight)];
    });
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) > 0) {
      if (e.deltaY < 0) handleZoomIn(hoveredTime);
      else handleZoomOut(hoveredTime);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastClientX(e.clientX);
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (isDragging && chartRef.current) {
      const deltaX = e.clientX - lastClientX;
      const width = chartRef.current.getBoundingClientRect().width;
      const range = zoomDomain[1] - zoomDomain[0];
      const pixelsPerUnit = width / range;
      const domainShift = -(deltaX / pixelsPerUnit);
      setZoomDomain(prev => {
        let newLeft = prev[0] + domainShift;
        let newRight = prev[1] + domainShift;
        if (newLeft < 0) { newRight -= newLeft; newLeft = 0; }
        if (newRight > maxTime) { newLeft -= (newRight - maxTime); newRight = maxTime; }
        return [Math.max(0, newLeft), Math.min(maxTime, newRight)];
      });
      setLastClientX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const preventScroll = (e) => e.preventDefault();
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventScroll);
  }, []);

  const formatXAxis = (val) => {
    const idx = Math.round(val);
    if (timeLabels && timeLabels[idx]) return timeLabels[idx];
    return typeof val === 'number' ? Number(val.toFixed(0)).toString() : val;
  };

  const minRes = Math.min(...chartData.map(d => Math.min(d.ResidualA || 0, d.ResidualB || 0)));
  const maxRes = Math.max(...chartData.map(d => Math.max(d.ResidualA || 0, d.ResidualB || 0)));
  const resDomain = [Math.floor(minRes * 1.1), Math.ceil(maxRes * 1.1)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', opacity: 0.7 }}>
        <button onClick={() => handleZoomOut()} title="Zoom Out" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
          <ZoomOut size={18} />
        </button>
        <button onClick={() => handleZoomIn()} title="Zoom In" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
          <ZoomIn size={18} />
        </button>
      </div>

      <div 
        ref={chartRef}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Main Chart */}
        <div style={{ flex: 2, minHeight: '300px' }}>
          <h4 style={{ margin: '0 0 0.5rem 1rem', color: 'var(--text-main)', fontSize: '1rem' }}>Forecasts vs Actual</h4>
          <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            <LineChart data={chartData} syncId="syncCharts" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }} onMouseMove={(e) => { if (e && e.activeLabel !== undefined && !isDragging) setHoveredTime(e.activeLabel); }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatXAxis} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} />
              <Tooltip isAnimationActive={false} labelFormatter={(l) => `Time: ${formatXAxis(l)}`} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
              <Legend />
              {trainSize > 0 && <ReferenceLine x={trainSize - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast Start', fill: 'var(--text-muted)' }} />}
              <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ModelA" name="Model A" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="ModelB" name="Model B" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Residual A */}
        <div style={{ flex: 1, minHeight: '150px' }}>
          <h4 style={{ margin: '0 0 0.5rem 1rem', color: '#3b82f6', fontSize: '1rem' }}>Model A Errors (Residuals)</h4>
          <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            <BarChart data={chartData} syncId="syncCharts" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} hide />
              <YAxis domain={resDomain} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip isAnimationActive={false} labelFormatter={() => ''} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
              <ReferenceLine y={0} stroke="var(--text-main)" />
              <Bar dataKey="ResidualA" name="Model A Error">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.ResidualA > 0 ? '#3b82f6' : '#93c5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Residual B */}
        <div style={{ flex: 1, minHeight: '150px' }}>
          <h4 style={{ margin: '0 0 0.5rem 1rem', color: '#ef4444', fontSize: '1rem' }}>Model B Errors (Residuals)</h4>
          <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            <BarChart data={chartData} syncId="syncCharts" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} hide />
              <YAxis domain={resDomain} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip isAnimationActive={false} labelFormatter={() => ''} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
              <ReferenceLine y={0} stroke="var(--text-main)" />
              <Bar dataKey="ResidualB" name="Model B Error">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.ResidualB > 0 ? '#ef4444' : '#fca5a5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const Layout = ({ commentary, dataset, controls, chart }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div className="top-panels">
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><BrainCircuit size={18} /> MAE vs RMSE Explained</h4>
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
    
    {controls && (
      <div className="glass controls-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
        {controls}
      </div>
    )}

    <div className="glass chart-container" style={{ width: '100%', height: '800px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      {chart}
    </div>
  </div>
);

export default function Topic3({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrain, setShowTrain] = useState(false);
  const [baselineSlider, setBaselineSlider] = useState(0);

  useEffect(() => {
    fetch(`/topic3_data.json?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading Topic 3 data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>Loading Topic 3 Data...</div>;
  }

  const renderTab1 = () => {
    const tabData = data.tab1;
    
    const chartData = tabData.actual.map((val, idx) => {
      const modelAVal = idx < tabData.train_size ? tabData.model_a_in[idx] : tabData.model_a_out[idx - tabData.train_size];
      const modelBVal = idx < tabData.train_size ? tabData.model_b_in[idx] : tabData.model_b_out[idx - tabData.train_size];
      
      return {
        time: idx,
        Actual: val,
        ModelA: modelAVal,
        ModelB: modelBVal,
        ResidualA: val - modelAVal,
        ResidualB: val - modelBVal
      };
    });

    const controls = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', width: '40%' }}>Model</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', width: '30%' }}>MAE (Winner: A)</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', width: '30%' }}>RMSE (Winner: B)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontWeight: 'bold', color: '#3b82f6' }}>Model A (Smooth Baseline)</td>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 'bold' }}>{Number(tabData.metrics_a.MAE).toFixed(2)}</td>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{Number(tabData.metrics_a.RMSE).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#ef4444' }}>Model B (Event-Aware)</td>
              <td style={{ padding: '0.75rem' }}>{Number(tabData.metrics_b.MAE).toFixed(2)}</td>
              <td style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 'bold' }}>{Number(tabData.metrics_b.RMSE).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            style={{ padding: '0.5rem 2rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: 'var(--primary)', color: 'white' }} 
            onClick={() => setShowTrain(!showTrain)}
          >
            {showTrain ? "Hide Training Data" : "Show Training Data"}
          </button>
        </div>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.95rem' }}>
        <p>
          <strong>MAE (Mean Absolute Error)</strong> strictly measures the average absolute distance from the true line. It treats all errors equally. Model A wins on MAE because its baseline is perfectly accurate 95% of the time.
        </p>
        <p>
          <strong>RMSE (Root Mean Squared Error)</strong> squares the errors before averaging them, massively punishing large outliers. Model A loses catastrophically on RMSE because it misses the 3 massive events. Model B wins on RMSE because it perfectly predicts the events (avoiding massive squared penalties), even though its day-to-day baseline is sloppy and punishing to its MAE.
        </p>
        <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />
        <p><strong>Real-World Use Cases:</strong></p>
        <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <strong>Optimize for MAE</strong> when all errors cost the same. <em>Example:</em> Standard inventory planning (toilet paper). Missing your forecast by 10 units every day costs you exactly the same in lost sales as missing by 300 units on a single day.
          </li>
          <li>
            <strong>Optimize for RMSE</strong> when large errors are catastrophically expensive or dangerous. <em>Example:</em> Energy grid forecasting. Under-forecasting by 300 megawatts on a single day causes a grid collapse and millions in damages, whereas over-forecasting by 15 megawatts every normal day just costs a bit of wasted fuel.
          </li>
        </ul>
      </div>
    );

    const datasetBox = (
      <p>
        A synthetic series with a steady trend, seasonality, and 3 injected outlier events in the test set. 
        <br/><br/>
        <strong>Model A</strong> perfectly fits the normal trend/seasonality but is totally unaware of the events (missing them entirely).
        <br/>
        <strong>Model B</strong> knows exactly when the events will occur (perfectly predicting the spikes), but its baseline is poorly calibrated and constantly misses by a flat 15 units.
      </p>
    );

    const chart = (
      <SyncedChartsWithZoom 
        chartData={chartData} 
        trainSize={tabData.train_size} 
        timeLabels={tabData.time_label}
        showTrain={showTrain}
      />
    );

    return <Layout controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} />;
  };

  const renderTab2 = () => {
    const tabData = data.tab2[baselineSlider.toString()];
    if (!tabData) return null;
    
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      InSample: idx < tabData.train_size ? tabData.in_sample[idx] : null,
      Forecast: idx >= tabData.train_size ? tabData.out_sample[idx - tabData.train_size] : null
    }));

    const metricsData = [
      { name: 'MAPE (%)', value: Math.min(tabData.metrics.MAPE, 300) },
      { name: 'sMAPE (%)', value: tabData.metrics.sMAPE }
    ];

    const metricsChart = (
      <>
        <h4 style={{ margin: '0 0 0.5rem 1rem', color: 'var(--text-main)', fontSize: '1rem' }}>Percentage Errors (Explode near zero)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metricsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fill: 'var(--text-muted)' }} domain={[0, 150]} /> 
            <Tooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} formatter={(val) => Number(val).toFixed(1) + '%'} />
            <Bar dataKey="value" name="Error Value">
              {metricsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name.includes('sMAPE') ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </>
    );

    const controls = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
        <div className="slider-container" style={{ flex: 1, minWidth: '200px', background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Data Baseline Shift (Distance from Zero)</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>+{baselineSlider}</span>
          </label>
          <input type="range" min="0" max="50" step="1" value={baselineSlider} onChange={(e) => setBaselineSlider(parseInt(e.target.value))} style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Crosses Zero</span>
            <span>Far from Zero</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ flex: 1, minWidth: '100px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>MAPE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{tabData.metrics.MAPE > 1000 ? '>1000' : Number(tabData.metrics.MAPE).toFixed(1)}%</div>
          </div>
          <div style={{ flex: 1, minWidth: '100px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>sMAPE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{Number(tabData.metrics.sMAPE).toFixed(1)}%</div>
          </div>
          <div style={{ flex: 1, minWidth: '100px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>wMAPE (Stable)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{Number(tabData.metrics.wMAPE).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.9rem' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>What is MAPE?</strong> The Mean Absolute Percentage Error measures the average error as a percentage of the actual value.
        </p>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>Why use percentages?</strong> MAE and RMSE are tied to the original units (e.g., dollars, quantities). If you want to compare accuracy across series with vastly different scales (a $10/day store vs. a $1,000,000/day store), MAE is useless. MAPE solves this scale problem.
        </p>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>The Limitation of MAPE:</strong> Because MAPE divides by the actual value at each time step, it artificially explodes to infinity as values approach zero. It is also highly asymmetrical, punishing over-forecasting far more severely than under-forecasting.
        </p>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>sMAPE (Symmetric MAPE):</strong> sMAPE attempts to fix MAPE's asymmetry by dividing by the average of the actual and forecasted values. However, as you can see by dragging the slider, both MAPE and sMAPE violently explode when the baseline nears zero!
        </p>
        <p style={{ margin: 0 }}>
          <strong>The Fix: wMAPE (Weighted MAPE)</strong> sums up all the absolute errors over the entire period and divides by the total sum of the actuals. By relying on the <em>total volume</em> rather than dividing point-by-point, it completely eliminates the zero-point explosion!
        </p>
      </div>
    );

    const datasetBox = (
      <p>
        A sinusoidal series that initially oscillates around zero. 
        <br/><br/>
        We artificially shift the entire dataset (both the actuals and the forecast) strictly upwards using the slider. The mathematical distance between the prediction and the actual line never changes.
      </p>
    );

    const mainChart = (
      <div style={{ flex: 2, minHeight: '350px' }}>
        <h4 style={{ margin: '0 0 0.5rem 1rem', color: 'var(--text-main)', fontSize: '1rem' }}>Forecast vs Actual (Baseline Shift)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tick={{ fill: 'var(--text-muted)' }} />
            <YAxis domain={[-30, 80]} tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip isAnimationActive={false} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
            <Legend />
            <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
            <ReferenceLine x={tabData.train_size - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Test Set', fill: 'var(--text-muted)' }} />
            <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={{ r: 2, fill: 'var(--text-muted)' }} isAnimationActive={false} />
            <Line type="monotone" dataKey="InSample" name="In-Sample Fit" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Forecast" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );

    const chart = (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
        {mainChart}
        <div style={{ flex: 1, minHeight: '200px' }}>
          {metricsChart}
        </div>
      </div>
    );

    return <Layout controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} />;
  };

  if (activeTab === 1) return renderTab1();
  if (activeTab === 2) return renderTab2();
  return null;
}
