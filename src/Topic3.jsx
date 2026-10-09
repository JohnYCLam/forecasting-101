import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, ReferenceArea, Scatter } from 'recharts';
import { ZoomIn, ZoomOut, Info, BrainCircuit } from 'lucide-react';
import ZoomableChartWrapper from './ZoomableChartWrapper';
import { formatValue } from './utils';

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

  const handleZoomInRef = useRef();
  const handleZoomOutRef = useRef();
  const hoveredTimeRef = useRef();

  useEffect(() => {
    handleZoomInRef.current = handleZoomIn;
    handleZoomOutRef.current = handleZoomOut;
    hoveredTimeRef.current = hoveredTime;
  });

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    const handleNativeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (Math.abs(e.deltaY) > 0) {
        if (e.deltaY < 0) {
          handleZoomInRef.current && handleZoomInRef.current(hoveredTimeRef.current);
        } else {
          handleZoomOutRef.current && handleZoomOutRef.current(hoveredTimeRef.current);
        }
      }
    };
    
    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
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
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
              <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={(l) => `Time: ${formatXAxis(l)}`} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
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
              <YAxis domain={resDomain} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
              <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={() => ''} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
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
              <YAxis domain={resDomain} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
              <Tooltip isAnimationActive={false} formatter={formatValue} labelFormatter={() => ''} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
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


const Layout = ({ title = "Explanation", commentary, dataset, controls, chart, chartHeight = "800px" }) => (
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

export default function Topic3({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrain, setShowTrain] = useState(false);
  const [baselineSlider, setBaselineSlider] = useState(0);
  const [tab3Fold, setTab3Fold] = useState(1);
  const [tab4Fold, setTab4Fold] = useState(1);
  const [tab4Strategy, setTab4Strategy] = useState('expanding');
  const [tab4Window, setTab4Window] = useState(30);

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

    return <Layout title="MAE vs RMSE Explained" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} />;
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
      <div style={{ flex: 2, minHeight: '220px' }}>
        <h4 style={{ margin: '0 0 0.5rem 1rem', color: 'var(--text-main)', fontSize: '1rem' }}>Forecast vs Actual (Baseline Shift)</h4>
        <ZoomableChartWrapper defaultDomain={[0, chartData.length > 0 ? chartData.length - 1 : 100]} maxTime={chartData.length > 0 ? chartData.length - 1 : 100}>
          {(zoomDomain) => (
            <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis domain={[-30, 80]} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                <Tooltip isAnimationActive={false} formatter={formatValue} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} />
                <Legend />
                <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
                <ReferenceLine x={tabData.train_size - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Test Set', fill: 'var(--text-muted)' }} />
                <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={{ r: 2, fill: 'var(--text-muted)' }} isAnimationActive={false} />
                <Line type="monotone" dataKey="InSample" name="In-Sample Fit" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ZoomableChartWrapper>
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

    return <Layout title="The MAPE Family" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} />;
  };

  const renderTab3 = () => {
    const tabData = data.tab3;
    if (!tabData) return null;

    const chartData = tabData.actual.map((val, idx) => {
      let forecast = null;
      let inSample = null;
      
      const active = tabData.folds[tab3Fold - 1];
      if (idx > 1 && idx < active.train_end) inSample = active.sx_in[idx];
      if (idx >= active.train_end && idx < active.test_end) forecast = active.sx_out[idx - active.train_end];
      
      return {
        time: idx,
        Actual: val,
        Forecast: forecast,
        InSample: inSample,
      };
    });

    const getRowStyle = (foldNum) => {
      return tab3Fold === foldNum ? { background: 'rgba(59, 130, 246, 0.1)', fontWeight: 'bold' } : { opacity: 0.5 };
    };

    const controls = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {[1, 2, 3].map(f => (
            <button key={f} className={`nav-btn ${tab3Fold === f ? 'primary' : 'secondary'}`} onClick={() => setTab3Fold(f)}>
              Highlight Fold {f}
            </button>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Fold</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Training Period</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Test Period</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Test RMSE</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Test MAE</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Test MAPE</th>
            </tr>
          </thead>
          <tbody>
            {tabData.folds.map((fold, idx) => (
              <tr key={idx} style={getRowStyle(idx + 1)}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Fold {idx + 1}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Week 0 to {fold.train_end}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Week {fold.train_end} to {fold.test_end}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{Number(fold.metrics_sx.RMSE).toFixed(2)}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{Number(fold.metrics_sx.MAE).toFixed(2)}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>{Number(fold.metrics_sx.MAPE).toFixed(1)}%</td>
              </tr>
            ))}
            <tr style={{ background: 'var(--surface-hover)', fontWeight: 'bold' }}>
              <td style={{ padding: '0.75rem' }} colSpan={3}>Average (Walk-Forward Result)</td>
              <td style={{ padding: '0.75rem' }}>{(tabData.folds.reduce((s, f) => s + f.metrics_sx.RMSE, 0) / 3).toFixed(2)}</td>
              <td style={{ padding: '0.75rem' }}>{(tabData.folds.reduce((s, f) => s + f.metrics_sx.MAE, 0) / 3).toFixed(2)}</td>
              <td style={{ padding: '0.75rem' }}>{(tabData.folds.reduce((s, f) => s + f.metrics_sx.MAPE, 0) / 3).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.9rem' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>What is Walk-Forward Validation?</strong> In standard Machine Learning, we randomly split data into a train and test set (Cross-Validation). We cannot do this in Time Series because time flows strictly forward—you cannot use future data to predict the past.
        </p>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>The Solution:</strong> We create multiple "folds" sequentially. We train on the past, test on the immediate future. Then we <em>walk forward</em>, add the recent data to our training set, and test on the next block of the future. The average error across all folds is our true, robust model performance.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Why is this necessary?</strong> Look at Fold 1. The error is very low (RMSE ~4.5) because the model perfectly predicts the stable linear trend. This gives a false illustration that the model is a perfect fit. But it was just "lucky." Look at Fold 2 and Fold 3: the data suddenly changes behavior and becomes volatile/seasonal. The model fails completely (RMSE ~16-29). Walk-Forward protects you from deploying models based on a single lucky split.
        </p>
      </div>
    );

    const datasetBox = (
      <p>
        A synthetic series (156 weeks) evaluated across 3 consecutive 17-week test windows. 
        <br/><br/>
        Click the buttons to see how the Training Window (Blue) expands forward in time, and the Test Window (Green) shifts to the next unseen period.
      </p>
    );

    // Custom legend
    const renderLegend = () => (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#3b82f6', opacity: 0.15, border: '1px solid #3b82f6' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Training Region</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#10b981', opacity: 0.15, border: '1px solid #10b981' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Testing Region</span>
        </div>
      </div>
    );

    const activeFold = tabData.folds[tab3Fold - 1];
    const xMax = activeFold.test_end;
    
    // Physically cut off future data so Recharts doesn't plot it
    const displayData = chartData.filter(d => d.time <= xMax);

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', height: '320px' }}>
          <ZoomableChartWrapper defaultDomain={[0, xMax]} maxTime={xMax}>
            {(zoomDomain) => (
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                  <Tooltip isAnimationActive={false} formatter={formatValue} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)' }} />
                  <Legend verticalAlign="top" />
                  
                  <ReferenceArea x1={0} x2={activeFold.train_end} fill="#3b82f6" fillOpacity={0.15} />
                  <ReferenceArea x1={activeFold.train_end} x2={activeFold.test_end} fill="#10b981" fillOpacity={0.15} />
                  
                  <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="InSample" name="Training Fit" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Forecast" name="Test Forecast" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ZoomableChartWrapper>
        </div>
        {renderLegend()}
      </div>
    );

    return <Layout title="Walk-Forward Validation" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} chartHeight="auto" />;
  };

  const renderTab4 = () => {
    const tabData = data.tab4;
    if (!tabData) return null;

    const chartData = tabData.actual.map((val, idx) => {
      let expForecast = null;
      let sldForecast = null;
      let expInSample = null;
      let sldInSample = null;
      
      const activeExp = tabData.expanding[tab4Fold - 1];
      const sld_data = tabData.sliding["40"] || tabData.sliding["30"];
      const activeSld = sld_data[tab4Fold - 1];
      
      if (idx >= 0 && idx < activeExp.test_start) expInSample = activeExp.exp_in[idx];
      if (idx >= activeExp.test_start && idx < activeExp.test_end) expForecast = activeExp.exp_out[idx - activeExp.test_start];
      
      const window_size = tabData.sliding["40"] ? 40 : 30;
      const sld_train_start = activeSld.test_start - window_size;
      if (idx >= sld_train_start && idx < activeSld.test_start) sldInSample = activeSld.sld_in[idx - sld_train_start];
      if (idx >= activeSld.test_start && idx < activeSld.test_end) sldForecast = activeSld.sld_out[idx - activeSld.test_start];
      
      return {
        time: idx,
        Actual: val,
        ExpForecast: expForecast,
        SldForecast: sldForecast,
        ExpInSample: expInSample,
        SldInSample: sldInSample
      };
    });

    const getRowStyle = (foldNum) => {
      return tab4Fold === foldNum ? { background: 'rgba(59, 130, 246, 0.1)', fontWeight: 'bold' } : { opacity: 0.5 };
    };

    const controls = (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {[1, 2, 3, 4].map(f => (
            <button key={f} className={`nav-btn ${tab4Fold === f ? 'primary' : 'secondary'}`} onClick={() => setTab4Fold(f)}>
              Highlight Fold {f}
            </button>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)' }}>
              <th rowSpan={2} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Fold</th>
              <th colSpan={3} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--border)', color: '#3b82f6' }}>Expanding Window Strategy</th>
              <th colSpan={3} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--border)', color: '#f97316' }}>Sliding Window Strategy</th>
            </tr>
            <tr style={{ background: 'var(--surface-hover)' }}>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--border)', fontSize: '0.85rem' }}>Train Period</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>Test Period</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>Test RMSE</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--border)', fontSize: '0.85rem' }}>Train Period</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>Test Period</th>
              <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>Test RMSE</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((f, idx) => {
              const window_size = tabData.sliding["40"] ? 40 : 30;
              const sld_data = tabData.sliding["40"] || tabData.sliding["30"];
              const exp = tabData.expanding[idx];
              const sld = sld_data[idx];
              return (
                <tr key={idx} style={getRowStyle(f)}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>Fold {f}</td>
                  
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--border)' }}>t=0 to t={exp.test_start - 1}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>t={exp.test_start} to t={exp.test_end - 1}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', color: exp.metrics.RMSE <= sld.metrics.RMSE ? '#10b981' : 'inherit', fontWeight: exp.metrics.RMSE <= sld.metrics.RMSE ? 'bold' : 'normal' }}>{Number(exp.metrics.RMSE).toFixed(2)}</td>
                  
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', borderLeft: '2px solid var(--border)' }}>t={sld.test_start - window_size} to t={sld.test_start - 1}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>t={sld.test_start} to t={sld.test_end - 1}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', color: sld.metrics.RMSE < exp.metrics.RMSE ? '#10b981' : 'inherit', fontWeight: sld.metrics.RMSE < exp.metrics.RMSE ? 'bold' : 'normal' }}>{Number(sld.metrics.RMSE).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    const commentary = (
      <div style={{ fontSize: '0.9rem' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>Window Strategies:</strong> When performing walk-forward validation, how much historical data do you train on?
        </p>
        <ul style={{ paddingLeft: '1.2rem', margin: '0 0 0.5rem 0' }}>
          <li style={{ marginBottom: '0.25rem' }}><strong>Expanding Window:</strong> Trains on ALL available data from the beginning of time up to the cutoff. <em>Real-world use case:</em> Predicting stable macroeconomic trends (e.g. GDP growth) where long-term historical context makes the model smarter.</li>
          <li><strong>Sliding Window:</strong> Forgets old data. Only trains on the most recent <em>N</em> periods. <em>Real-world use case:</em> High-frequency stock trading or social media trends, where past data quickly becomes obsolete due to shifting market regimes or viral topics.</li>
        </ul>
        <p style={{ margin: 0 }}>
          <strong>The Demo:</strong> At time t=100, the data undergoes a massive "Regime Shift". Look at Fold 1: both strategies train on the exact same data (t=0 to 39) and produce identical results. In Fold 2, Expanding trains on more data, but both are still fine. But by Fold 3 and 4, the Expanding Window fails catastrophically because it is poisoned by old, pre-shift data. The Sliding Window forgets the old regime and adapts perfectly!
        </p>
      </div>
    );

    const datasetBox = (
      <p>
        A synthetic series (200 points) that undergoes a violent regime shift exactly at t=100. <br/><br/>
        Click the fold buttons to visualize what the two strategies are "looking at".
      </p>
    );

    const renderLegend = () => (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#3b82f6', opacity: 0.15, border: '1px solid #3b82f6' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Expanding Window</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#f97316', opacity: 0.15, border: '1px solid #f97316' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sliding Window</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '15px', height: '15px', backgroundColor: '#10b981', opacity: 0.15, border: '1px solid #10b981' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Test Window</span>
        </div>
      </div>
    );

    const activeExp = tabData.expanding[tab4Fold - 1];
    const activeSld = tabData.sliding["40"][tab4Fold - 1];
    const xMax = activeExp.test_end;
    const displayData = chartData.filter(d => d.time <= xMax);

    const chart = (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', height: '500px', display: 'flex', flexDirection: 'column' }}>
          <ZoomableChartWrapper defaultDomain={[0, xMax]} maxTime={xMax}>
            {(zoomDomain) => (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: '2.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <h4 style={{ margin: '0 0 0.5rem 1rem', color: '#3b82f6', fontSize: '0.9rem' }}>Expanding Strategy</h4>
                  <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                    <LineChart data={displayData} syncId="tab4Sync" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} hide />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                      <Tooltip isAnimationActive={false} formatter={formatValue} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)' }} />
                      
                      <ReferenceArea x1={0} x2={activeExp.test_start} fill="#3b82f6" fillOpacity={0.05} ifOverflow="hidden" />
                      <ReferenceArea x1={activeExp.test_start} x2={activeExp.test_end} fill="#10b981" fillOpacity={0.15} ifOverflow="hidden" />
                      <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Regime Shift', fill: '#ef4444' }} />
                      
                      <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="ExpInSample" name="Expanding Train" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="ExpForecast" name="Expanding Forecast" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <h4 style={{ margin: '0 0 0.5rem 1rem', color: '#f97316', fontSize: '0.9rem' }}>Sliding Strategy</h4>
                  <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                    <LineChart data={displayData} syncId="tab4Sync" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} style={{ pointerEvents: 'auto' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatValue} />
                      <Tooltip isAnimationActive={false} formatter={formatValue} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)' }} />
                      
                      <ReferenceArea x1={activeSld.test_start - 40} x2={activeSld.test_start} fill="#f97316" fillOpacity={0.15} ifOverflow="hidden" />
                      <ReferenceArea x1={activeExp.test_start} x2={activeExp.test_end} fill="#10b981" fillOpacity={0.15} ifOverflow="hidden" />
                      <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Regime Shift', fill: '#ef4444' }} />
                      
                      <Line type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="SldInSample" name="Sliding Train" stroke="#f97316" strokeWidth={2} strokeOpacity={0.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="SldForecast" name="Sliding Forecast" stroke="#f97316" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </ZoomableChartWrapper>
        </div>
        {renderLegend()}
      </div>
    );

    return <Layout title="Sliding vs Expanding Windows" controls={controls} commentary={commentary} dataset={datasetBox} chart={chart} chartHeight="auto" />;
  };

  if (activeTab === 1) return renderTab1();
  if (activeTab === 2) return renderTab2();
  if (activeTab === 3) return renderTab3();
  if (activeTab === 4) return renderTab4();

  return null;
}
