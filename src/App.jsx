import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, TrendingUp, Waves, Info, Lock, BookOpen, LineChart as ChartIcon, Cpu, BrainCircuit, Sparkles, Sun, Moon, ZoomIn, ZoomOut } from 'lucide-react';
import './index.css';

export default function App() {
  const [data, setData] = useState(null);
  const [activeModel, setActiveModel] = useState('ses');
  
  // Parameter states (0.0 to 1.0)
  const [alpha, setAlpha] = useState(0.2);
  const [beta, setBeta] = useState(0.5);
  const [gamma, setGamma] = useState(0.5);
  
  // Theme state
  const [theme, setTheme] = useState('light');

  // Zoom and Pan states
  const maxTime = 119;
  const [zoomDomain, setZoomDomain] = useState([0, maxTime]);
  const [hoveredTime, setHoveredTime] = useState(maxTime / 2);
  
  // Dragging states
  const chartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastClientX, setLastClientX] = useState(0);

  useEffect(() => {
    // Apply theme class to body
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    fetch('/topic1_data.json')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Failed to load data", err));
  }, []);

  if (!data) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Time Series Engine...</div>;

  const modelConfig = {
    ses: {
      name: 'Simple Exponential Smoothing',
      icon: <Activity size={20} />,
      description: 'SES is the foundation. It calculates a weighted average of past observations. High Alpha means it forgets the past quickly and chases recent noise. Low Alpha means it remembers the deep past, creating a smoother line.'
    },
    holt: {
      name: "Holt's Linear",
      icon: <TrendingUp size={20} />,
      description: "Holt adds a 'Trend' component. When the underlying trend suddenly changes (a structural break), Beta determines how fast the model catches up to the new reality."
    },
    hw: {
      name: 'Holt-Winters',
      icon: <Waves size={20} />,
      description: "Holt-Winters adds Seasonality. But what happens if the seasonal waves suddenly get bigger? Gamma determines how quickly the model learns the new amplitude of the wave."
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

  // ---- Advanced Zoom & Pan Logic ----
  const handleZoomIn = (anchor = (zoomDomain[0] + zoomDomain[1]) / 2) => {
    setZoomDomain(prev => {
      const range = prev[1] - prev[0];
      if (range <= 15) return prev; // max zoom depth
      
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
      
      if (newLeft < 0) {
        newRight -= newLeft; // push remainder to right
        newLeft = 0;
      }
      if (newRight > maxTime) {
        newLeft -= (newRight - maxTime); // push remainder to left
        newRight = maxTime;
      }
      
      // Final clamp just in case
      newLeft = Math.max(0, newLeft);
      newRight = Math.min(maxTime, newRight);
      
      return [newLeft, newRight];
    });
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) > 0) {
      if (e.deltaY < 0) {
        handleZoomIn(hoveredTime);
      } else {
        handleZoomOut(hoveredTime);
      }
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
      
      // Calculate how many 'time' units this pixel delta represents
      const pixelsPerUnit = width / range;
      const domainShift = -(deltaX / pixelsPerUnit);
      
      setZoomDomain(prev => {
        let newLeft = prev[0] + domainShift;
        let newRight = prev[1] + domainShift;
        
        // Block panning out of bounds
        if (newLeft < 0) {
          newRight -= newLeft;
          newLeft = 0;
        }
        if (newRight > maxTime) {
          newLeft -= (newRight - maxTime);
          newRight = maxTime;
        }
        
        return [Math.max(0, newLeft), Math.min(maxTime, newRight)];
      });
      
      setLastClientX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };
  // -----------------------------------

  return (
    <div className="main-layout" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Sidebar Navigation */}
      <aside className="glass sidebar">
        <div className="brand">
          <ChartIcon size={24} color="#60a5fa" />
          <span>Forecasting 101</span>
        </div>
        
        <nav className="nav-menu" style={{ overflowY: 'auto', paddingRight: '0.5rem', maxHeight: 'calc(100vh - 120px)' }}>
          <div className="nav-item active">
            <BookOpen size={18} />
            <span>1. Basic Forecast</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>2. ARIMA & Selection</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>3. Metrics & Validation</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>4. VARIMA</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>5. Traditional ML</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>6. Facebook Prophet</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>7. Traditional DL</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>8. Modern DL</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>9. RAG Demo</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>10. Foundation Models</span>
          </div>
          <div className="nav-item locked">
            <Lock size={16} />
            <span>11. Volatility: GARCH</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="app-container">
        <header>
          <div>
            <h1>Topic 1: Exponential Smoothing</h1>
            <div className="subtitle">Understanding Level, Trend, and Seasonality</div>
          </div>
          <button 
            className="theme-toggle" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        <div className="dashboard">
          {/* Left Column: Chart */}
          <div className="glass chart-container">
            <div className="chart-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                Forecast Visualization
                {/* Zoom Controls */}
                <div style={{ display: 'flex', gap: '0.25rem', opacity: 0.7 }}>
                  <button onClick={() => handleZoomOut()} title="Zoom Out" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
                    <ZoomOut size={18} />
                  </button>
                  <button onClick={() => handleZoomIn()} title="Zoom In" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}>
                    <ZoomIn size={18} />
                  </button>
                </div>
              </h2>
              <div className="tabs">
                <button 
                  className={`tab ${activeModel === 'ses' ? 'active' : ''}`}
                  onClick={() => { setActiveModel('ses'); setAlpha(0.2); setZoomDomain([0, maxTime]); }}
                >
                  SES
                </button>
                <button 
                  className={`tab ${activeModel === 'holt' ? 'active' : ''}`}
                  onClick={() => { setActiveModel('holt'); setAlpha(0.8); setBeta(0.5); setZoomDomain([0, maxTime]); }}
                >
                  Holt's Linear
                </button>
                <button 
                  className={`tab ${activeModel === 'hw' ? 'active' : ''}`}
                  onClick={() => { setActiveModel('hw'); setAlpha(0.2); setBeta(0.5); setGamma(0.5); setZoomDomain([0, maxTime]); }}
                >
                  Holt-Winters
                </button>
              </div>
            </div>
            
            <div 
              ref={chartRef}
              style={{ flex: 1, minHeight: '400px', paddingBottom: '20px', cursor: isDragging ? 'grabbing' : 'grab' }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
                <LineChart 
                  data={chartData} 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  style={{ pointerEvents: 'auto' }}
                  onMouseMove={(e) => {
                    // Track which data point the mouse is hovering over for mouse-centered zooming
                    if (e && e.activeLabel !== undefined && !isDragging) {
                      setHoveredTime(e.activeLabel);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={zoomDomain}
                    allowDataOverflow={true}
                    tick={{ fill: 'var(--text-muted)' }}
                    tickFormatter={(val) => typeof val === 'number' ? Number(val.toFixed(4)).toString() : val}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tick={{ fill: 'var(--text-muted)' }}
                    tickFormatter={(val) => typeof val === 'number' ? Number(val.toFixed(4)).toString() : val}
                  />
                  <Tooltip 
                    isAnimationActive={false}
                    contentStyle={{ pointerEvents: 'none' }}
                    formatter={(val) => typeof val === 'number' ? Number(val.toFixed(4)).toString() : val}
                    labelFormatter={(label) => `Time: ${typeof label === 'number' ? Number(label.toFixed(4)).toString() : label}`}
                  />
                  <Legend verticalAlign="top" height={36} style={{ pointerEvents: 'none' }}/>
                  <ReferenceLine x={modelData.train_size - 1} stroke="var(--text-muted)" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast Start', fill: 'var(--text-muted)' }} />
                  
                  <Line type="monotone" dataKey="actual" stroke="var(--text-muted)" strokeWidth={2} dot={false} name="Actual Data" isAnimationActive={false} />
                  <Line type="monotone" dataKey="inSample" stroke="var(--primary)" strokeWidth={3} dot={false} name="In-Sample Fit" isAnimationActive={false} />
                  <Line type="monotone" dataKey="forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Forecast" isAnimationActive={false} />
                  
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Controls & Commentary */}
          <div className="glass controls-panel">
            <div className="control-group">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {config.icon}
                {config.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {config.description}
              </p>
            </div>

            <div className="control-group">
              {/* Alpha Slider (Always visible) */}
              <div className="slider-container">
                <label>
                  <span>Alpha (Level)</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{alpha.toFixed(1)}</span>
                </label>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                />
              </div>

              {/* Beta Slider (Holt and HW) */}
              {(activeModel === 'holt' || activeModel === 'hw') && (
                <div className="slider-container">
                  <label>
                    <span>Beta (Trend)</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{beta.toFixed(1)}</span>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                  />
                </div>
              )}

              {/* Gamma Slider (HW only) */}
              {activeModel === 'hw' && (
                <div className="slider-container">
                  <label>
                    <span>Gamma (Seasonality)</span>
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

            <div className="commentary-box">
              <h4><Info size={18} /> Dataset Details</h4>
              <p>{modelData.dataset_description}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
