import React, { useEffect, useState } from 'react';
import { BrainCircuit, Cpu, Info } from 'lucide-react';
import Topic6PairedIntro from './Topic6PairedIntro';
import Topic6Pairs, { CaseControl, OriginControl } from './Topic6Pairs';

const Layout = ({
  title = "Explanation",
  commentary,
  dataset,
  controls,
  chart,
  chartHeight = "540px",
  extraCardTitle = null,
  extraCard = null,
  controlsPosition = "belowExtraCard",
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, maxWidth: '100%' }}>
    <div className="top-panels" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', minWidth: 0 }}>
      <div className="glass controls-panel" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><BrainCircuit size={18} /> {title}</h4>
          {commentary}
        </div>
      </div>
      <div className="glass controls-panel" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><Info size={18} /> Dataset Details</h4>
          {dataset}
        </div>
      </div>
    </div>

    {controls && controlsPosition === "aboveExtraCard" && (
      <div className="glass controls-panel" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem 1.25rem' }}>
        {controls}
      </div>
    )}

    {extraCard && (
      <div className="glass controls-panel">
        <div className="commentary-box" style={{ height: '100%' }}>
          <h4><Cpu size={18} /> {extraCardTitle || 'Deep Dive'}</h4>
          {extraCard}
        </div>
      </div>
    )}

    {controls && controlsPosition !== "aboveExtraCard" && (
      <div className="glass controls-panel" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem 1.25rem' }}>
        {controls}
      </div>
    )}

    {chart && (
      <div className={`glass ${chartHeight === 'auto' ? 'controls-panel' : 'chart-container'}`} style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', height: chartHeight, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        {chart}
      </div>
    )}
  </div>
);

export default function Topic6({ activeTab = 1 }) {
  const [data, setData] = useState(null);
  const [origin, setOrigin] = useState(0);
  const [scenario, setScenario] = useState('controlled');
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}topic6_data.json`).then(response => {
      if (!response.ok) throw new Error('Topic 6 data request failed');
      return response.json();
    }).then(value => { if (!cancelled) setData(value); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  if (error) return <p role="alert">Topic 6 data could not be loaded. Refresh the page to try again.</p>;
  if (!data) return <p>Loading Topic 6?</p>;
  const selected = { ...data.datasets[scenario], tab5: data.tab5 };
  const shared = selected.progression.shared;
  const caseControl = <CaseControl value={scenario} onChange={setScenario} comparison={data.comparison} />;
  return activeTab === 1 ? <Topic6PairedIntro data={selected.tab1.origins[origin]} Layout={Layout}
    shared={shared} caseControl={caseControl} originControl={<OriginControl shared={shared} value={origin} onChange={setOrigin} />} />
    : <Topic6Pairs activeTab={activeTab} data={selected} paired={data.comparison} origin={origin} setOrigin={setOrigin} caseControl={caseControl} Layout={Layout} />;
}
