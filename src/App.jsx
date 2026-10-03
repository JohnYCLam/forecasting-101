import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, TrendingUp, Waves, Info, Lock, BookOpen, LineChart as ChartIcon, Cpu, BrainCircuit, Sparkles } from 'lucide-react';
import './index.css';

export default function App() {
  const [data, setData] = useState(null);
  const [activeModel, setActiveModel] = useState('ses');
  const [paramIndex, setParamIndex] = useState(1); // 0, 1, 2

  useEffect(() => {
    fetch('/topic1_data.json')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Failed to load data", err));
  }, []);

  if (!data) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Time Series Engine...</div>;

  const modelConfig = {
    ses: {
      name: 'Simple Exponential Smoothing',
      icon: <Activity size={20} />,
      paramName: 'Alpha (Level Smoothing)',
      keys: ['0.2', '0.5', '0.8'],
      description: 'SES is the foundation. It calculates a weighted average of past observations. High Alpha means it forgets the past quickly and chases recent noise. Low Alpha means it remembers the deep past, creating a smoother line.'
    },
    holt: {
      name: "Holt's Linear",
      icon: <TrendingUp size={20} />,
      paramName: 'Beta (Trend Smoothing)',
      keys: ['0.05', '0.5', '0.9'],
      description: "Holt adds a 'Trend' component. When the underlying trend suddenly changes (a structural break), Beta determines how fast the model catches up to the new reality."
    },
    hw: {
      name: 'Holt-Winters',
      icon: <Waves size={20} />,
      paramName: 'Gamma (Seasonal Smoothing)',
      keys: ['0.05', '0.5', '0.9'],
      description: "Holt-Winters adds Seasonality. But what happens if the seasonal waves suddenly get bigger? Gamma determines how quickly the model learns the new amplitude of the wave."
    }
  };

  const config = modelConfig[activeModel];
  const activeKey = config.keys[paramIndex];
  
  const modelData = data[activeModel];
  const activeResult = modelData.results[activeKey];
  
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
          <h1>Topic 1: Exponential Smoothing</h1>
          <div className="subtitle">Understanding Level, Trend, and Seasonality</div>
        </header>

        <div className="dashboard">
          {/* Left Column: Chart */}
          <div className="glass chart-container">
            <div className="chart-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Forecast Visualization</h2>
              <div className="tabs">
                <button 
                  className={`tab ${activeModel === 'ses' ? 'active' : ''}`}
                  onClick={() => { setActiveModel('ses'); setParamIndex(1); }}
                >
                  SES
                </button>
                <button 
                  className={`tab ${activeModel === 'holt' ? 'active' : ''}`}
                  onClick={() => { setActiveModel('holt'); setParamIndex(1); }}
                >
                  Holt's
                </button>
                <button 
                  className={`tab ${activeModel === 'hw' ? 'active' : ''}`}
                  onClick={() => { setActiveModel('hw'); setParamIndex(1); }}
                >
                  Holt-Winters
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, minHeight: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <ReferenceLine x={modelData.train_size - 1} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Forecast Start', fill: '#94a3b8' }} />
                  
                  <Line type="monotone" dataKey="actual" stroke="#94a3b8" strokeWidth={2} dot={false} name="Actual Data" />
                  <Line type="monotone" dataKey="inSample" stroke="#3b82f6" strokeWidth={3} dot={false} name="In-Sample Fit" />
                  <Line type="monotone" dataKey="forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Forecast" />
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
              <div className="slider-container">
                <label>
                  <span>{config.paramName}</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeKey}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="1" 
                  value={paramIndex}
                  onChange={(e) => setParamIndex(parseInt(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
                  <span>Slow/Low</span>
                  <span>Medium</span>
                  <span>Fast/High</span>
                </div>
              </div>
            </div>

            <div className="commentary-box">
              <h4><Info size={18} /> Observation</h4>
              <p>{activeResult.description}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
