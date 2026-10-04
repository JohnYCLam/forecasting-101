import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ZoomIn, ZoomOut, Info, BrainCircuit } from 'lucide-react';

function ChartWithZoom({ chartData, lines, trainSize, timeLabels, yDomain = ['auto', 'auto'], hideXAxis = false }) {
  const maxTime = chartData.length > 0 ? chartData[chartData.length - 1].time : 100;
  const [zoomDomain, setZoomDomain] = useState([0, maxTime]);
  const [hoveredTime, setHoveredTime] = useState(maxTime / 2);
  const chartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastClientX, setLastClientX] = useState(0);

  useEffect(() => {
    setZoomDomain([0, maxTime]);
  }, [maxTime, chartData]);

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
      newLeft = Math.max(0, newLeft);
      newRight = Math.min(maxTime, newRight);
      return [newLeft, newRight];
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

  // ---- Touch Zoom & Pan (Mobile) ----
  const [initialPinchDist, setInitialPinchDist] = useState(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setInitialPinchDist(dist);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setLastClientX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDist) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = dist - initialPinchDist;
      if (Math.abs(delta) > 10) {
        if (delta > 0) handleZoomIn(hoveredTime); else handleZoomOut(hoveredTime);
        setInitialPinchDist(dist);
      }
    } else if (e.touches.length === 1 && isDragging && chartRef.current) {
      const deltaX = e.touches[0].clientX - lastClientX;
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
      setLastClientX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialPinchDist(null);
  };
  // -----------------------------------

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

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

  const formatDecimals = (val) => typeof val === 'number' ? Number(val.toFixed(4)).toString() : val;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', marginBottom: '0.5rem', opacity: 0.7 }}>
        <button onClick={() => handleZoomOut()} title="Zoom Out" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
          <ZoomOut size={18} />
        </button>
        <button onClick={() => handleZoomIn()} title="Zoom In" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
          <ZoomIn size={18} />
        </button>
      </div>
      <div 
        ref={chartRef}
        style={{ width: '100%', flex: 1, minHeight: '400px', height: '100%', paddingBottom: '20px', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
          <LineChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            style={{ pointerEvents: 'auto' }}
            onMouseMove={(e) => {
              if (e && e.activeLabel !== undefined && !isDragging) {
                setHoveredTime(e.activeLabel);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatXAxis} />
            <YAxis domain={yDomain} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatDecimals} />
            <Tooltip 
              isAnimationActive={false} 
              formatter={formatDecimals} 
              labelFormatter={(l) => `Time: ${formatTooltipXAxis(l)}`} 
              contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--border)', color: 'var(--chart-tooltip-text)' }} 
            />
            <Legend style={{ pointerEvents: 'none' }}/>
            <ReferenceLine x={trainSize - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast Start', fill: 'var(--text-muted)' }} />
            {lines}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const Layout = ({ commentary, dataset, controls, chart }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    {/* Top Panels */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="top-panels">
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
    <div className="glass chart-container" style={{ width: '100%', height: '550px', display: 'flex', flexDirection: 'column' }}>
      {chart}
    </div>
  </div>
);

export default function Topic2({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [p, setP] = useState(2);
  const [q, setQ] = useState(1);
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
    
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      InSample: idx < tabData.train_size ? tabData.in_sample[idx] : null,
      Forecast: idx >= tabData.train_size ? tabData.out_sample[idx - tabData.train_size] : null
    }));

    const controls = (
      <>
        <div className="slider-container" style={{ flex: 1, minWidth: '150px' }}>
          <label>
            <span>p (AutoRegressive Order)</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{p}</span>
          </label>
          <input type="range" min="0" max="8" step="1" value={p} onChange={(e) => setP(parseInt(e.target.value))} />
        </div>
        <div className="slider-container" style={{ flex: 1, minWidth: '150px' }}>
          <label>
            <span>q (Moving Average Order)</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{q}</span>
          </label>
          <input type="range" min="0" max="8" step="1" value={q} onChange={(e) => setQ(parseInt(e.target.value))} />
        </div>
      </>
    );

    const commentary = (
      <p>
        {p === 0 && q === 0 && "This is pure white noise. The forecast is simply the long-run mean (0) since there is no memory of the past."}
        {p > 0 && "The autoregressive (AR) component adds 'memory' to the system. Higher 'p' values mean the forecast considers more distant past values, creating complex decay patterns or cycles back to the mean. "}
        {q > 0 && "The moving average (MA) component reacts to past unobserved shocks. Higher 'q' values allow the forecast to carry the momentum of recent random spikes forward before returning to the AR-driven path. "}
        {p > 3 && "With such a high 'p', you can see very complex, oscillating decay in the forecast!"}
      </p>
    );

    const chart = (
      <ChartWithZoom 
        chartData={chartData} 
        trainSize={tabData.train_size} 
        timeLabels={tabData.time_label}
        lines={[
          <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
          <Line key="2" type="monotone" dataKey="InSample" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} dot={false} isAnimationActive={false} name="In-Sample Fit" />,
          <Line key="3" type="monotone" dataKey="Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`ARIMA(${p},0,${q}) Forecast`} />
        ]} 
      />
    );

    return <Layout controls={controls} commentary={commentary} dataset={<p>{tabData.description.replace(/Modelling Behaviour.*|Damping Effect.*/s, '')}</p>} chart={chart} />;
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
        <strong>Damping Effect:</strong> ARIMA models correctly understand when a shock is temporary or when the data is strictly stationary. The forecast mathematically "damps" (decays) back to the historical mean. This is mathematically the absolute best forecast under stationary conditions, preventing wild over-extrapolation!
        <br/><br/>
        {tab2Dataset === 'MA1' && "ARIMA(0,0,1) perfectly fits the immediate correlation of the transient shock. Its damping effect is mathematically optimal here: it cuts off its prediction instantly after q lags (1 lag) because it correctly assumes the shock has zero correlation afterwards. Holt-Winters, relying on continuous exponential smoothing, exponentially decays forever and completely fails to capture the sudden, instant snapback to the mean."}
        {tab2Dataset === 'AR2' && "Holt Winters cannot model aperiodic cycles, so it forecasts a straight line. ARIMA(2,0,0) uses its two autoregressive roots to successfully map the sinusoidal, aperiodic cycle and predict the turns! However, its damping effect causes the forecast to slowly flatten out towards the mean."}
        {tab2Dataset === 'AR1' && "ARIMA(1,0,0) captures the high-frequency mean reversion. Holt-Winters is too sluggish to keep up with the alternating current."}
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

    return <Layout controls={controls} commentary={commentary} dataset={<p>{tabData.description.replace(/Modelling Behaviour.*/s, '')}</p>} chart={chart} />;
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
            Sunspots follow an aperiodic cycle (ranging from 8-16 years, averaging ~11 years). Look at the Holt-Winters (Blue) forecast—because it forces a rigid 11-year seasonal period, it quickly falls out of phase with reality! Instead, ARIMA(9,0,0) uses its deep autoregressive lags (memory) to organically discover this cycle.
            <br/><br/>
            <strong>How to predict cycle AND magnitude for Sunspots?</strong> ARIMA handles the aperiodic cycle frequency nicely but eventually suffers from mean-reversion damping. Holt-Winters and SARIMA completely fail because they force a rigid calendar frequency. Predicting BOTH variable frequencies and amplitudes requires advanced hybrid models (e.g., LSTMs or Dynamic State-Space models with time-varying seasonal components).
          </>
        )}
        {tab3Dataset === 'TBill' && "Interest rates have strong inertia. The ARIMA(3,0,1) model was NOT randomly guessed—it was carefully discovered using Box-Jenkins methodology (minimizing the AIC/BIC scores over a grid of p,d,q parameters). This optimal ARIMA model elegantly captures the inertia (AR) and reacts to sudden economic shocks (MA). The Holt-Winters linear trend makes a naive assumption that rates will just keep going in a straight line forever."}
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
        <p>{tabData.description.replace(/Modelling Behaviour.*/s, '')}</p>
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
                <tr><td style={{ padding: '4px' }}>ARIMA(1,0,0)</td><td style={{ padding: '4px' }}>281.43</td><td style={{ padding: '4px' }}>289.00</td></tr>
                <tr><td style={{ padding: '4px' }}>ARIMA(2,0,0)</td><td style={{ padding: '4px' }}>283.42</td><td style={{ padding: '4px' }}>293.51</td></tr>
                <tr><td style={{ padding: '4px' }}>ARIMA(3,0,0)</td><td style={{ padding: '4px' }}>279.19</td><td style={{ padding: '4px' }}>291.80</td></tr>
                <tr><td style={{ padding: '4px' }}>ARIMA(1,0,1)</td><td style={{ padding: '4px' }}>283.40</td><td style={{ padding: '4px' }}>293.49</td></tr>
                <tr><td style={{ padding: '4px' }}>ARIMA(2,0,1)</td><td style={{ padding: '4px' }}>280.03</td><td style={{ padding: '4px' }}>292.64</td></tr>
                <tr style={{ background: 'rgba(59, 130, 246, 0.1)' }}><td style={{ padding: '4px' }}><strong>ARIMA(3,0,1)</strong></td><td style={{ padding: '4px' }}><strong>277.02 (Selected)</strong></td><td style={{ padding: '4px' }}><strong>292.15</strong></td></tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Note: While an ARIMA(3,1,1) scored slightly lower (270.57), the 'd=1' unit root forces permanent non-stationarity. We correctly bounded our search to stationary models (d=0) because interest rates are mean-reverting.</p>
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
          Blind Auto-ARIMA {tabData.blind_order}
        </button>
        <button 
          style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: autoArimaMode === 'manual' ? 'var(--primary)' : 'var(--surface)', color: autoArimaMode === 'manual' ? 'white' : 'var(--text-main)' }} 
          onClick={() => setAutoArimaMode('manual')}
        >
          Constrained ARIMA {tabData.manual_order}
        </button>
      </div>
    );

    const commentary = (
      <p>
        Auto-ARIMA automatically searches over thousands of combinations of p, d, and q to find the model with the lowest AIC score. However, it operates blindly on mathematics alone, lacking domain knowledge. 
        <br/><br/>
        {autoArimaMode === 'manual' ? 
          "In reality, we know Unemployment Rate is mean-reverting (it can't rocket to infinity). We constrained the search to d=0 (stationary). The Constrained ARIMA (3,0,1) correctly damps back down towards the historical long-run average of ~6%." : 
          "The Blind Auto-ARIMA mathematically selected d=1. A d=1 model contains a 'unit root', making it non-stationary. It blindly assumes the recent massive spike to 8.8% is a permanent structural shift in the economy, and permanently forecasts a high plateau around 9.0% rather than decaying!"}
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

    return <Layout controls={controls} commentary={commentary} dataset={<p>{tabData.description.replace(/Modelling Behaviour.*|Damping Effect.*/s, '')}</p>} chart={chart} />;
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
        This dataset exhibits heteroskedasticity (variance increases over time). We applied a log-transform before feeding it to SARIMA(0,1,1)x(0,1,1,12), which naturally models the exponential growth when exponentiated back. 
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
          <Line key="3" type="monotone" dataKey="SARIMA_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={`SARIMA ${tabData.sarima_order} Forecast`} />
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
          "By passing the Promotion Calendar as an Exogenous variable (the 'X' in SARIMAX), the model mathematically isolates the exact lift caused by a promotion. It perfectly predicts future sales spikes whenever a promotion is scheduled! The Yellow Bulbs indicate exactly when a promo was active."}
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

    return <Layout controls={controls} commentary={commentary} dataset={<p>{tabData.description.replace(/Modelling Behaviour.*/s, '')}</p>} chart={chart} />;
  };

  const tabs = [renderTab1, renderTab2, renderTab3, renderTab4, renderTab5, renderTab6];
  return tabs[activeTab - 1]();
}
