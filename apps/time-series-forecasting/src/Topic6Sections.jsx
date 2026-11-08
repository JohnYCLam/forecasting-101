import React, { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ZoomableChartShell } from './charts';
import { MathText } from './MathText';

const prose = { display: 'flex', flexDirection: 'column', gap: '.7rem', fontSize: '.92rem', lineHeight: 1.65 };
const box = { padding: '1rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--primary-bg)' };
const cell = { padding: '.55rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'left', verticalAlign: 'top' };
const names = { linear: 'Linear regression', tree: 'Single tree', forest: 'Random forest', boosting: 'XGBoost', naive: 'Repeat last week', sarima: 'SARIMA', raw: 'Raw-level XGBoost', detrended: 'Trend + XGBoost remainder', calibrated: 'Calibrated quantiles', fixed: 'Calibrated fixed width' };
const colors = { actual: 'var(--text-main)', linear: '#147d70', tree: '#c084fc', forest: '#147d70', boosting: '#5169a5', naive: '#d97706', sarima: '#06b6d4', raw: '#d76448', detrended: '#147d70', recursive: '#d76448', pooled: '#5169a5' };
const n = (v, digits = 1) => v == null ? 'n/a' : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
const mw = v => `${n(v)} MW`;
const label = key => names[key] || key;
export const P = ({ title, children }) => <p style={{ margin: 0 }}><strong>{title}:</strong> {children}</p>;

export function Table({ title, headers, rows }) {
  return <div style={{ overflowX: 'auto', maxWidth: '100%' }}><table aria-label={title} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem', minWidth: headers.length > 3 ? 560 : undefined }}>
    <caption style={{ textAlign: 'left', fontWeight: 600, margin: '.5rem 0' }}>{title}</caption>
    <thead><tr>{headers.map(h => <th key={h} scope="col" style={{ ...cell, background: 'var(--primary-bg)' }}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => j === 0 ? <th key={j} scope="row" style={cell}>{v}</th> : <td key={j} style={cell}>{v}</td>)}</tr>)}</tbody>
  </table>{headers.length > 3 && <p style={{ margin: '.4rem 0', fontSize: '.78rem', color: 'var(--text-muted)' }}>Scroll the table horizontally on narrow screens to see every column.</p>}</div>;
}

export function Select({ title, value, onChange, options }) {
  return <label style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>{title}<select aria-label={title} value={value} onChange={e => onChange(e.target.value)} style={{ padding: '.45rem', maxWidth: '100%', color: 'var(--text-main)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5 }}>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></label>;
}

export function Frame({ Layout, title, tabs, tab, setTab, guide, dataset, controls, children }) {
  return <Layout title={title} commentary={<><div className="tabs" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>{tabs.map((name, i) => <button key={name} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{i + 1}. {name}</button>)}</div><div style={prose}>{guide}</div></>}
    dataset={<div style={{ ...prose, fontSize: '.85rem' }}>{dataset}</div>} controls={controls}
    chart={<div style={{ ...prose, width: '100%', minWidth: 0 }}>{children}</div>} chartHeight="auto" />;
}

export function Plot({ data, series, title, x = 'time', xLabel = 'Date', origin, band, bandColor = '#5169a5', bandName, dateKey = 'date', unit = 'MW', hourly = false }) {
  const bandTitle = bandName || `Prediction interval (${unit})`;
  const amount = value => `${n(value)} ${unit}`;
  const min = data[0][x], max = data[data.length - 1][x];
  const ticks = [...new Set([0, .25, .5, .75, 1].map(f => Math.round(min + f * (max - min))))];
  const lookup = Object.fromEntries(data.map(r => [r[x], r[dateKey] ?? r[x]]));
  const keys = [...series.map(s => s.key), ...(band ? [band.replace('_band', '_lo'), band.replace('_band', '_hi')] : [])];
  const chartData = data.map(row => ({ ...row, time: row[x] }));
  return <div><h4 style={{ margin: '.25rem 0 .7rem' }}>{title}</h4><div style={{ height: 380, width: '100%' }}>
    <ZoomableChartShell key={`${title}-${min}-${max}`} defaultDomain={[min, max]} minTime={min} maxTime={max} minRange={Math.min(4, max - min)} data={chartData} dataKeys={keys}>
      {(zoomDomain, _computeYDomain, autoYDomain) => <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
        <ComposedChart data={chartData} margin={{ top: 40, right: 12, left: 0, bottom: 30 }} style={{ pointerEvents: 'auto' }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={x} type="number" domain={zoomDomain} allowDataOverflow={true} ticks={ticks} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => dateKey === 'date' ? hourly ? `${String(lookup[v] ?? '').slice(5, 10)} ${String(lookup[v] ?? '').slice(11, 13)}h` : String(lookup[v] ?? '').slice(5, 10) : n(v, 0)} label={{ value: hourly && xLabel === 'Date' ? 'Date and hour (local clock)' : xLabel, position: 'insideBottom', offset: -18, fill: 'var(--text-muted)' }} />
          <YAxis domain={autoYDomain} allowDataOverflow={true} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={56} tickFormatter={v => Math.abs(v) >= 1000 ? `${n(v / 1000, 0)}k` : n(v, 0)} />
          <Tooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-main)' }} labelFormatter={v => dateKey === 'date' ? lookup[v] : `${xLabel}: ${n(v)}`} formatter={(v, name) => [Array.isArray(v) ? v.map(amount).join(' – ') : amount(v), name]} />
          {band && <Area type="linear" dataKey={band} name={bandTitle} stroke={bandColor} fill={bandColor} fillOpacity={.16} isAnimationActive={false} />}
          {origin != null && <ReferenceLine x={origin} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Forecast cutoff', position: 'insideTopRight', fill: 'var(--text-muted)', fontSize: 11 }} />}
          {series.map(s => <Line key={s.key} type="linear" dataKey={s.key} name={s.name} stroke={s.color || colors[s.key]} strokeWidth={s.dots ? 0 : 2} strokeDasharray={s.dash} dot={s.dots ? { r: 3, fill: s.color } : false} connectNulls={false} isAnimationActive={false} />)}
        </ComposedChart>
      </ResponsiveContainer>}
    </ZoomableChartShell>
  </div><div aria-label="Chart legend" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '.4rem 1rem', padding: '.35rem 0 .7rem', fontSize: '.78rem' }}>
    {[...series.map(s => ({ name: s.name, color: s.color || colors[s.key], dash: s.dash, dots: s.dots })), ...(band ? [{ name: bandTitle, color: bandColor, area: true }] : [])].map(s => <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', maxWidth: '100%' }}><span aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, width: s.dots ? 6 : 18, height: s.dots ? 6 : s.area ? 10 : 0, borderRadius: s.dots ? '50%' : 0, background: s.area || s.dots ? s.color : undefined, opacity: s.area ? .4 : 1, borderTop: !s.area && !s.dots ? `2px ${s.dash ? 'dashed' : 'solid'} ${s.color}` : undefined }} />{s.name}</span>)}
  </div><p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '.3rem 0' }}>Vertical axis: {unit}. Use the chart buttons to zoom or reset; drag to pan.</p></div>;
}

export function MetricTable({ metrics, keys = Object.keys(metrics), title = 'Forecast error comparison', labels = {} }) {
  return <Table title={title} headers={['Method', 'MAE (MW)', 'RMSE (MW)']} rows={keys.map(k => [labels[k] || label(k), n(metrics[k].mae), n(metrics[k].rmse)])} />;
}

export function FittedTree({ nodes, leaves, example, unit = 'MW', labels = {} }) {
  const scrollRef = useRef(null);
  const spacing = 178, nodeWidth = 158, nodeHeight = 76;
  const width = Math.max(520, leaves * spacing + 24);
  const height = (Math.max(...nodes.map(node => node.depth)) + 1) * 132 + 32;
  const position = node => ({ x: 101 + node.column * spacing, y: 54 + node.depth * 132 });
  const rootX = position(nodes[0]).x;
  const active = new Set([...example.path.map(item => item.node), example.leaf_id]);
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;
    const center = () => { container.scrollLeft = Math.max(0, rootX - container.clientWidth / 2); };
    center();
    const observer = new ResizeObserver(center);
    observer.observe(container);
    return () => observer.disconnect();
  }, [rootX, example.name]);
  const shortNames = { temp: 'Temperature (°C)', weekend: 'Weekend flag', dow: 'Weekday', lag_1: 'Origin load (MW)', lag_7: 'Load: origin −6d (MW)', lag_2: 'Load: origin −1d (MW)', lag_3: 'Load: origin −2d (MW)', lag_14: 'Load: origin −13d (MW)', lag_28: 'Load: origin −27d (MW)', roll_7: '7-day mean (MW)', roll_28: '28-day mean (MW)', dow_sin: 'Weekday sine', dow_cos: 'Weekday cosine', is_weekend: 'Weekend flag', solar_lag1: 'Origin solar (MWh)', wind_lag1: 'Origin wind (MWh)', h: 'Days ahead', h_sin: 'Horizon sine', h_cos: 'Horizon cosine' };
  return <div><h4 style={{ margin: '.2rem 0' }}>The fitted tree: {example.name.toLowerCase()}</h4>
    <p style={{ margin: '.4rem 0' }}>Start at the top. “Yes” follows the ≤ branch; “No” follows the &gt; branch. Blue marks this record's route; the green leaf is its prediction. Other branches may be collapsed. Scroll the drawing horizontally to explore its branches.</p>
    <div ref={scrollRef} tabIndex={0} role="region" aria-label="Scrollable fitted decision tree" style={{ overflowX: 'auto', maxWidth: '100%', border: '1px solid var(--border)', borderRadius: 8 }}>
      <svg role="img" aria-label={`Fitted decision tree for ${example.name.toLowerCase()}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <title>Actual learned tree with the selected prediction route highlighted</title>
        <desc>Every box shows a fitted split or a leaf prediction and its training-record count. The selected record follows the highlighted path to the green leaf. The complete input record and text decisions are available below.</desc>
        {nodes.filter(node => !node.leaf).flatMap(parent => [parent.left, parent.right].map((id, branch) => {
          const child = nodes.find(node => node.id === id), a = position(parent), b = position(child);
          const highlighted = active.has(parent.id) && active.has(child.id);
          const top = b.y - nodeHeight / 2, bottom = a.y + nodeHeight / 2, mid = (top + bottom) / 2;
          return <g key={`${parent.id}-${id}`}><path d={`M ${a.x} ${bottom} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${top}`} fill="none" stroke={highlighted ? '#147d70' : 'var(--text-muted)'} strokeWidth={highlighted ? 3 : 1.2} /><text x={(a.x + b.x) / 2} y={mid - 5} textAnchor="middle" fontSize={12} fill={highlighted ? '#147d70' : 'var(--text-muted)'}>{branch === 0 ? 'Yes' : 'No'}</text></g>;
        }))}
        {nodes.map(node => {
          const pos = position(node), selected = active.has(node.id), reached = node.id === example.leaf_id;
          return <g key={node.id} data-node-id={node.id} data-selected={selected} data-leaf={node.leaf}>
            <rect x={pos.x - nodeWidth / 2} y={pos.y - nodeHeight / 2} width={nodeWidth} height={nodeHeight} rx={8} fill={reached ? 'rgba(16,185,129,.14)' : selected ? 'rgba(59,130,246,.12)' : 'var(--surface)'} stroke={reached ? '#147d70' : selected ? '#147d70' : 'var(--border)'} strokeWidth={selected ? 2.5 : 1.2} />
            <text x={pos.x} y={pos.y - 14} textAnchor="middle" fill="var(--text-main)" fontSize={12} fontWeight={600}>{node.collapsed ? 'Further splits' : node.leaf ? 'Leaf prediction' : (labels[node.feature] || shortNames[node.feature] || node.feature)}</text>
            <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="var(--text-main)" fontSize={13}>{node.collapsed ? 'Branch collapsed' : node.leaf ? `${n(node.prediction)} ${unit}` : `≤ ${n(node.threshold, 2)}?`}</text>
            <text x={pos.x} y={pos.y + 24} textAnchor="middle" fill="var(--text-muted)" fontSize={11}>{node.samples} training records</text>
          </g>;
        })}
      </svg>
    </div>
  </div>;
}

export function Trend({ data: d, Layout }) {
  const [tab, setTab] = useState(0);
  const p = d.protocol, train = d.training_example, future = d.forecast_example;
  const guide = [
    <><P title="From strategy to representation">Section 6.4 changed how we produced future steps. Here a separate synthetic load series isolates extrapolation: it continues rising with a weekly cycle after training ends. Keep one forecast origin and change what the tree is trained to predict.</P><P title="Read the plateau">The dark actual path rises, while red raw-level XGBoost remains near its learned level. The amber vertical line separates training context from the future. All future raw predictions are generated recursively, without new actual loads.</P><P title="Scope">The same trend continues throughout this simulation. It illustrates extrapolation, predicting beyond familiar input ranges; it does not demonstrate a trend break or automatic detection of changing conditions.</P></>,
    <><P title="Why a tree does not continue a slope">A fitted tree divides inputs at learned split thresholds. An input beyond the last threshold still reaches a boundary leaf; increasing that input further does not automatically increase the leaf's prediction. Other inputs can still change which leaf is reached.</P><P title="Distinguish trees and boosting">A squared-error regression tree predicts a leaf's training mean, and a forest averages such predictions. XGBoost instead adds learned tree corrections. Its prediction is not generally bounded by the original target minimum and maximum. The plateau here is an observed result, not that claimed universal bound.</P><P title="Where a slope can come from">A separate fitted trend supplies an explicit rule for continuing growth. The next step lets the tree focus on the remaining weekly structure instead of asking it to invent that rule.</P></>,
    <><P title="Separate two prediction tasks">Fit a straight trend using training observations, subtract it, and train XGBoost on the remainder. For a future date, predict the remainder and add back the extrapolated trend.</P><P title="Read the reconstruction">The training example shows load minus estimated trend. Its lagged remainder inputs come from the earlier observations identified in the table. The forecast example then shows the projected trend plus a fitted remainder prediction.</P><P title="The assumption">A trend fitted on past data can be extended mathematically; that does not establish that the real future will continue at the same rate. Removing a trend also does not prove the remainder is stationary.</P></>,
    <><P title="Check the simpler explanation too">The green hybrid adds a trend to the XGBoost remainder forecast. The blue baseline is ordinary linear regression on time and weekday indicators, so it can represent both the continuing trend and the weekly cycle.</P><P title="Compare accuracy">Raw XGBoost has MAE {mw(d.metrics.raw.mae)}; trend plus remainder has MAE {mw(d.metrics.detrended.mae)}; the linear trend-and-weekday baseline has MAE {mw(d.metrics.linear.mae)}. A simple model can be competitive on a simple data-generating process.</P><P title="Choose a representation by evidence">Detrending is useful here because the designed series has a continuing linear trend. It is not a requirement for every tree model or every nonstationary series. A changed future slope would challenge both trend-based approaches.</P><P title="From a path to a range">These methods still give one predicted value per future day. Section 6.6 returns to the paired rental examples and adds prediction ranges to their fixed-origin next-day forecasts.</P></>
  ];
  const series = [{ key: 'actual', name: 'Actual synthetic load (MW)' }, { key: 'raw', name: 'Raw-level XGBoost (MW)' }, ...(tab === 3 ? [{ key: 'detrended', name: 'Trend + XGBoost remainder (MW)' }, { key: 'linear', name: 'Linear trend + weekday (MW)' }] : [])];
  return <Frame Layout={Layout} title="6.5 Trend and extrapolation" tabs={['A continuing trend', 'Explain the plateau', 'Predict the remainder', 'Compare and qualify']} tab={tab} setTab={setTab} guide={guide[tab]} dataset={<>
    <P title="Data">Seeded synthetic load: linear growth of {n(p.dgp_slope, 2)} MW per simulation day, a weekly cycle and random noise. Seed {p.seed}; no change in the generating slope.</P><P title="Split">Training indices {p.train_start}–{p.cutoff} ({p.train_rows} usable records); future indices {p.test_start}–{p.test_end} ({p.test_rows} predictions). Only the late training context is plotted.</P><P title="Forecast task">One fixed origin; raw and remainder trees roll their own predictions forward. The trend is estimated on training observations only.</P><details><summary>Fitted trend and historical inputs</summary><p>Estimated slope: {n(p.slope, 4)} MW per day; intercept: {mw(p.intercept)}. The remainder tree uses weekday and previous-day/previous-week remainders. Earlier available observations supply the first usable lags.</p><p>The linear comparator uses time and weekday indicators fitted to the same training target dates. The displayed training maximum is not used to constrain XGBoost predictions.</p></details>
  </>}>
    {tab === 2 ? <><div style={box}><MathText tex="\text{forecast load}=\text{projected trend}+\text{predicted remainder}" /></div><Table title="Transform one historical training record" headers={['Part', 'Value']} rows={[[`Observed load at index ${train.t}`, mw(train.actual)], ['Training-fitted trend', mw(train.trend)], ['Load minus trend', mw(train.remainder)], [`Previous remainder (index ${train.lag_dates[0]})`, mw(train.inputs.lag_1)], [`Previous-week remainder (index ${train.lag_dates[1]})`, mw(train.inputs.lag_7)], ['Weekday input', n(train.inputs.dow, 0)]]} /><Table title={`Reconstruct the first future prediction (index ${future.t})`} headers={['Part', 'Value']} rows={[["Projected trend", mw(future.trend)], ['Fitted remainder prediction', mw(future.remainder)], ['Their sum: forecast load', mw(future.prediction)]]} /></> : <><Plot data={d.timeline} title="A continuing trend beyond the training cutoff" dateKey="time" xLabel="Simulation day index" origin={p.cutoff} series={series} />{tab === 3 && <MetricTable metrics={d.metrics} title="Errors over the complete future path" labels={{ linear: 'Linear trend + weekday' }} />}</>}
    {tab === 1 && <><Table title="Boundary routing in a small fitted time-only tree" headers={['Time input', 'Reached leaf', 'Prediction (MW)']} rows={d.boundary_example.rows.map(r => [r.t, r.leaf, n(r.prediction)])} /><div style={box}>This separate teaching tree uses time alone; its last split is at {n(d.boundary_example.last_split)}. All displayed inputs beyond that split reach the same leaf. The raw XGBoost path above also uses weekly and lag inputs, which still move: its plateau has repeating variation rather than an exactly constant forecast.</div></>}
  </Frame>;
}

