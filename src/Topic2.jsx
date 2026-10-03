import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ZoomIn, ZoomOut } from 'lucide-react';

function ChartWithZoom({ chartData, lines, trainSize, yDomain = ['auto', 'auto'] }) {
  const maxTime = chartData.length > 0 ? chartData[chartData.length - 1].time : 100;
  const [zoomDomain, setZoomDomain] = useState([0, maxTime]);
  const [hoveredTime, setHoveredTime] = useState(maxTime / 2);
  const chartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastClientX, setLastClientX] = useState(0);

  useEffect(() => {
    setZoomDomain([0, maxTime]);
  }, [maxTime]);

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

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const formatDecimals = (val) => typeof val === 'number' ? Number(val.toFixed(4)).toString() : val;

  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', marginTop: '1rem' }}>
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
        style={{ width: '100%', height: '450px', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
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
            <XAxis dataKey="time" type="number" domain={zoomDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatDecimals} />
            <YAxis domain={yDomain} tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatDecimals} />
            <Tooltip 
              isAnimationActive={false} 
              formatter={formatDecimals} 
              labelFormatter={(l) => `Time: ${formatDecimals(l)}`} 
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

export default function Topic2() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(true);

  // Tab 1 state
  const [p, setP] = useState(2);
  const [q, setQ] = useState(1);

  // Tab 2 & 3 state
  const [tab2Dataset, setTab2Dataset] = useState('MA1');
  const [tab3Dataset, setTab3Dataset] = useState('Sunspots');

  // Tab 4 state
  const [autoArimaMode, setAutoArimaMode] = useState('manual');

  // Tab 6 state
  const [useExog, setUseExog] = useState(true);

  useEffect(() => {
    fetch('/topic2_data.json')
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

  // --- Tab 1 ---
  const renderTab1 = () => {
    const tabData = data.tab1[`p${p}_q${q}`];
    if (!tabData) return <div>Data not found</div>;
    
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      InSample: idx < tabData.train_size ? tabData.in_sample[idx] : null,
      Forecast: idx >= tabData.train_size ? tabData.out_sample[idx - tabData.train_size] : null
    }));

    return (
      <div className="glass" style={{ padding: '2rem' }}>
        <h2>Tab 1: The Basics of ARMA(p, q)</h2>
        <p className="commentary">
          This tab generates a brand new synthetic dataset for every combination of p and q.
          <br/><strong>p (AutoRegressive):</strong> Controls how many past values the model "remembers".
          <br/><strong>q (Moving Average):</strong> Controls how the model reacts to recent random shocks/errors.
        </p>
        
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <div className="slider-group" style={{ flex: 1 }}>
            <label>p (AutoRegressive Order): {p}</label>
            <input type="range" min="0" max="8" step="1" value={p} onChange={(e) => setP(parseInt(e.target.value))} />
          </div>
          <div className="slider-group" style={{ flex: 1 }}>
            <label>q (Moving Average Order): {q}</label>
            <input type="range" min="0" max="8" step="1" value={q} onChange={(e) => setQ(parseInt(e.target.value))} />
          </div>
        </div>
        
        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="2" type="monotone" dataKey="InSample" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} name="In-Sample Fit" />,
            <Line key="3" type="monotone" dataKey="Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Forecast" />
          ]} 
        />
      </div>
    );
  };

  // --- Tab 2 ---
  const renderTab2 = () => {
    const tabData = data.tab2[tab2Dataset];
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      ARIMA_Forecast: idx >= tabData.train_size ? tabData.arima_out[idx - tabData.train_size] : null,
      HW_Forecast: idx >= tabData.train_size ? tabData.hw_out[idx - tabData.train_size] : null,
    }));

    return (
      <div className="glass" style={{ padding: '2rem' }}>
        <h2>Tab 2: ARIMA vs Holt-Winters (Synthetic Battles)</h2>
        <p className="commentary">Holt-Winters completely fails to capture complex autocorrelation (like a variable cycle or mean reversion), while ARIMA nails the true future perfectly.</p>
        
        <select className="dropdown" value={tab2Dataset} onChange={e => setTab2Dataset(e.target.value)} style={{ padding: '0.5rem', marginBottom: '1rem', width: '100%', maxWidth: '300px' }}>
          <option value="MA1">MA(1) Transient Shock</option>
          <option value="AR2">AR(2) Variable Cycle</option>
          <option value="AR1">AR(1) High-Frequency Mean Reversion</option>
        </select>

        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="2" type="monotone" dataKey="ARIMA_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="ARIMA Forecast" />,
            <Line key="3" type="monotone" dataKey="HW_Forecast" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />
          ]} 
        />
      </div>
    );
  };

  // --- Tab 3 ---
  const renderTab3 = () => {
    const tabData = data.tab3[tab3Dataset];
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      ARIMA_Forecast: idx >= tabData.train_size ? tabData.arima_out[idx - tabData.train_size] : null,
      HW_Forecast: idx >= tabData.train_size ? tabData.hw_out[idx - tabData.train_size] : null,
    }));

    return (
      <div className="glass" style={{ padding: '2rem' }}>
        <h2>Tab 3: ARIMA vs Holt-Winters (Real World Data)</h2>
        <p className="commentary">Testing ARIMA against ETS models on real macroeconomic datasets.</p>
        
        <select className="dropdown" value={tab3Dataset} onChange={e => setTab3Dataset(e.target.value)} style={{ padding: '0.5rem', marginBottom: '1rem', width: '100%', maxWidth: '300px' }}>
          <option value="Sunspots">Sunspots Activity</option>
          <option value="TBill">US Treasury Bill Rate</option>
        </select>

        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="2" type="monotone" dataKey="ARIMA_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="ARIMA Forecast" />,
            <Line key="3" type="monotone" dataKey="HW_Forecast" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />
          ]} 
        />
      </div>
    );
  };

  // --- Tab 4 ---
  const renderTab4 = () => {
    const tabData = data.tab4;
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      Forecast: idx >= tabData.train_size ? (autoArimaMode === 'manual' ? tabData.manual_out[idx - tabData.train_size] : tabData.blind_out[idx - tabData.train_size]) : null,
      InSample: idx < tabData.train_size ? (autoArimaMode === 'manual' ? tabData.manual_in[idx] : tabData.blind_in[idx]) : null,
    }));

    return (
      <div className="glass" style={{ padding: '2rem' }}>
        <h2>Tab 4: Auto ARIMA vs Manual ARIMA</h2>
        <p className="commentary">
          <strong>The Danger of Algorithms:</strong> Blind Auto ARIMA mathematically chooses differencing (d=1) during a recession spike and predicts unemployment will rise to infinity. Manual constrained ARIMA (d=0) uses economic domain knowledge to capture the mean-reverting recovery.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: autoArimaMode === 'blind' ? 'var(--primary)' : 'var(--surface)', color: autoArimaMode === 'blind' ? 'white' : 'var(--text-main)' }} 
            onClick={() => setAutoArimaMode('blind')}
          >
            Blind Auto ARIMA (d=1)
          </button>
          <button 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: autoArimaMode === 'manual' ? 'var(--primary)' : 'var(--surface)', color: autoArimaMode === 'manual' ? 'white' : 'var(--text-main)' }} 
            onClick={() => setAutoArimaMode('manual')}
          >
            Constrained ARIMA (d=0)
          </button>
        </div>

        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="2" type="monotone" dataKey="InSample" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} name="In-Sample Fit" />,
            <Line key="3" type="monotone" dataKey="Forecast" stroke="#ef4444" strokeWidth={4} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Forecast" />
          ]} 
        />
      </div>
    );
  };

  // --- Tab 5 ---
  const renderTab5 = () => {
    const tabData = data.tab5["Gas"];
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      SARIMA_Forecast: idx >= tabData.train_size ? tabData.sarima_out[idx - tabData.train_size] : null,
      HW_Forecast: idx >= tabData.train_size ? tabData.hw_out[idx - tabData.train_size] : null,
    }));

    return (
      <div className="glass" style={{ padding: '2rem' }}>
        <h2>Tab 5: SARIMA vs Holt-Winters</h2>
        <p className="commentary">
          <strong>Australian Gas Production:</strong> Showcasing heteroskedasticity (expanding variance). SARIMA using a log transform handles the expanding variance beautifully, beating the standard Multiplicative ETS.
        </p>
        
        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="2" type="monotone" dataKey="SARIMA_Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="SARIMA Forecast" />,
            <Line key="3" type="monotone" dataKey="HW_Forecast" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Holt-Winters Forecast" />
          ]} 
        />
      </div>
    );
  };

  // --- Tab 6 ---
  const renderTab6 = () => {
    const tabData = data.tab6;
    const chartData = tabData.actual.map((val, idx) => ({
      time: idx,
      Actual: val,
      ExogFlag: tabData.exog[idx] === 1 ? 250 : null, // Just to visualize the spike periods
      Forecast: idx >= tabData.train_size ? (useExog ? tabData.exog_out[idx - tabData.train_size] : tabData.no_exog_out[idx - tabData.train_size]) : null,
    }));

    return (
      <div className="glass" style={{ padding: '2rem' }}>
        <h2>Tab 6: The Magic of SARIMAX (Exogenous Factors)</h2>
        <p className="commentary">
          <strong>A Charm to Prediction:</strong> Baseline models get completely confused by anomalous spikes (like Marketing Promotions or Holidays). When you pass that external knowledge (the "X") to SARIMAX, the forecast snaps into perfect accuracy.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: !useExog ? 'var(--primary)' : 'var(--surface)', color: !useExog ? 'white' : 'var(--text-main)' }} 
            onClick={() => setUseExog(false)}
          >
            Forecast WITHOUT Exogenous Data
          </button>
          <button 
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 500, background: useExog ? 'var(--primary)' : 'var(--surface)', color: useExog ? 'white' : 'var(--text-main)' }} 
            onClick={() => setUseExog(true)}
          >
            Forecast WITH Exogenous Data
          </button>
        </div>

        <ChartWithZoom 
          chartData={chartData} 
          trainSize={tabData.train_size} 
          lines={[
            <Line key="1" type="monotone" dataKey="Actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} isAnimationActive={false} />,
            <Line key="4" type="monotone" dataKey="ExogFlag" stroke="orange" strokeWidth={0} dot={{r: 4, fill: 'orange'}} isAnimationActive={false} name="Promo Occurred" />,
            <Line key="3" type="monotone" dataKey="Forecast" stroke="#ef4444" strokeWidth={4} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Forecast" />
          ]} 
        />
      </div>
    );
  };

  return (
    <div className="topic2-container">
      <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap', width: 'fit-content' }}>
        {[
          { id: 1, name: "1. ARMA(p, q) Basics" },
          { id: 2, name: "2. Synthetic Battles" },
          { id: 3, name: "3. Real World Data" },
          { id: 4, name: "4. Auto vs Manual" },
          { id: 5, name: "5. SARIMA vs ETS" },
          { id: 6, name: "6. SARIMAX" },
        ].map(tab => (
          <button 
            key={tab.id} 
            className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {activeTab === 1 && renderTab1()}
      {activeTab === 2 && renderTab2()}
      {activeTab === 3 && renderTab3()}
      {activeTab === 4 && renderTab4()}
      {activeTab === 5 && renderTab5()}
      {activeTab === 6 && renderTab6()}
    </div>
  );
}
