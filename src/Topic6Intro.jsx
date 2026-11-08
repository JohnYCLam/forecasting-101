import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { MathText } from './MathText';
import { ZoomableChartShell } from './charts';

const number = (value, places = 0) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: places, minimumFractionDigits: places }) : 'n/a';
const mw = (value, places = 0) => `${number(value, places)} MW`;
const signed = value => `${value >= 0 ? '+' : ''}${number(value, 2)}`;
const weight = value => Number.isFinite(value) ? Number(value.toPrecision(6)).toString() : 'n/a';
const cell = { padding: '0.65rem', borderBottom: '1px solid var(--border)', textAlign: 'left', verticalAlign: 'top' };
const prose = { display: 'flex', flexDirection: 'column', gap: '0.7rem', lineHeight: 1.55 };
const panel = { padding: '1rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--primary-bg)' };
const choices = [
  { key: 'lags_only', label: 'History', added: 'Six observed load readings and three days-ahead inputs.', meaning: 'Six origin-anchored load readings establish a recent demand level.' },
  { key: 'lags_rolling', label: '+ Recent averages', added: 'Means of the 7 and 28 observations ending at the origin.', meaning: 'Recent averages summarize demand levels, without adding target-weekday timing.' },
  { key: 'history_calendar', label: '+ Calendar', added: 'Target-weekday sine/cosine and a weekend flag.', meaning: 'Target-weekday inputs vary across horizons, adding weekday/weekend shape.' },
  { key: 'safe_full', label: '+ Renewable observations', added: 'Solar and wind generation observed on the origin day.', meaning: 'Origin-day generation adds information beyond the calendar, without supplying future renewable outcomes.' },
];

function Table({ label, headers, children }) {
  return <div style={{ overflowX: 'auto', maxWidth: '100%' }}><table aria-label={label} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
    <thead><tr>{headers.map(text => <th key={text} style={{ ...cell, background: 'var(--primary-bg)' }}>{text}</th>)}</tr></thead><tbody>{children}</tbody>
  </table></div>;
}

function RawRecords({ rows, label }) {
  return <Table label={label} headers={['Date', 'Load (average MW)', 'Solar (MWh)', 'Wind (MWh)', 'Price (unused)', 'Role']}>
    {rows.map(row => <tr key={row.date}><td style={cell}>{row.date}</td><td style={cell}>{number(row.load, 2)}</td><td style={cell}>{number(row.solar, 2)}</td><td style={cell}>{number(row.wind, 2)}</td><td style={cell}>{number(row.price, 2)}</td><td style={cell}>{row.role}</td></tr>)}
  </Table>;
}

export default function Topic6Intro({ data: t, Layout, shared, originControl }) {
  const [tab, setTab] = useState(1);
  const [origin, setOrigin] = useState(t.training_origin_start);
  const [horizon, setHorizon] = useState(7);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [showInvalid, setShowInvalid] = useState(true);
  const e = t.linear_intro;
  if (!e) return <p>This introduction requires regenerated Topic 6 data.</p>;
  const titles = ['Start with linear regression', 'Build training examples', 'Forecast without leakage', 'Features and a strong baseline'];
  const selected = choices[featureIndex];
  const origins = [...new Set(e.training_examples.map(row => row.origin))];
  const selectedOrigin = origins.includes(origin) ? origin : origins[0];
  const example = e.training_examples.find(row => row.origin === selectedOrigin && row.h === horizon);
  const forecast = e.forecast_records.find(row => row.h === horizon);
  const selectedMetrics = e.metrics[selected.key].test;
  const fullMetrics = e.metrics.safe_full.test;
  const baseline = e.repeat_week.metrics;
  const valueText = (value, feature) => `${number(value, feature.key === 'is_weekend' || feature.unit === 'days' ? 0 : feature.unit === 'unitless' ? 6 : 2)}${feature.unit === 'unitless' ? '' : ` ${feature.unit}`}`;

  const controls = tab === 1 ? null : <>
    {originControl}
    {tab === 2 && <label>Historical origin <select aria-label="Historical origin" value={selectedOrigin} onChange={event => setOrigin(event.target.value)}>{origins.map(date => <option key={date}>{date}</option>)}</select></label>}
    {(tab === 2 || tab === 3) && <label>Days ahead <select aria-label="Days ahead" value={horizon} onChange={event => setHorizon(Number(event.target.value))}>{[1, 7, t.horizon].map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
    {tab === 3 && <label><input type="checkbox" checked={showInvalid} onChange={event => setShowInvalid(event.target.checked)} /> Show invalid future-input diagnostic</label>}
    {tab === 4 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}><strong>Input features:</strong>{choices.map((choice, index) => <button key={choice.key} className={`nav-btn ${featureIndex === index ? 'primary' : 'secondary'}`} onClick={() => setFeatureIndex(index)}>{choice.label}</button>)}</div>}
  </>;

  const guides = [
    <div style={prose} key="model">
      <p><strong>From Chapter 5:</strong> VAR and VECM used relationships between series to help forecast. We now take a general-purpose machine-learning approach: arrange useful observations into input columns, called features, and learn how they relate to a future value, called the target. Statistical models can use external inputs too.</p>
      <p><strong>Start with a simple learner:</strong> Our ML baseline is ordinary linear regression. It predicts daily average electricity load from a starting level, called the intercept, plus a weighted sum of inputs. A positive contribution raises the prediction; a negative contribution lowers it.</p>
      <p><strong>What training learns:</strong> Past input/answer pairs determine the intercept and weights. Training chooses them to minimize the sum of squared prediction errors. Once fitted, the model applies those weights to a new input row whose answer is unknown.</p>
      <p><strong>What comes next:</strong> The equation below defines the learner. The next tab constructs its input rows from the original time series, then shows how learned weights turn one complete record into a prediction.</p>
    </div>,
    <div style={prose} key="training">
      <p><strong>Make time explicit:</strong> ARIMA and Holt models specify how a series evolves through time. Our general-purpose regressor expects input/answer rows, so we reconstruct historical forecasting tasks. One daily source record is not enough: lags and averages also need earlier observations.</p>
      <p><strong>Follow one complete record:</strong> At {example.origin}, latest load is {mw(example.raw_origin.load)}. The answer for {example.target_date}, {horizon} days later, is {mw(example.target)}. Below, the source records lead to every input column and the separate training answer.</p>
      <p><strong>Read the learned weights:</strong> The last table multiplies each input by its fitted weight, then adds the intercept. These contributions reconstruct the model's prediction of {mw(example.prediction)}. Weights are displayed in the original input units; their sizes alone are not feature importance or causal effects.</p>
      <p><strong>Use the controls:</strong> Change days ahead: history stays fixed while target calendar and answer change. Change historical origin: the source history changes too. The model's weights stay fixed; selecting a record does not retrain it.</p>
      <p><strong>Keep the sample count honest:</strong> The {number(e.protocol.training_rows)} rows reuse observations and target dates. They are historical forecasting tasks, not independent daily samples. The next tab applies the fitted model with future answers hidden.</p>
    </div>,
    <div style={prose} key="forecast">
      <p><strong>From known answers to unknown ones:</strong> At the {t.origin_date} issue date, we predict {t.horizon} days ahead. For the selected target, {forecast.target_date}, historical inputs and calendar information are available, but the answer is unknown. Compare the complete correct and incorrect records below.</p>
      <p><strong>Issue the whole forecast:</strong> One model scores one row per horizon. Observed history stays fixed; days ahead and target calendar change. Predictions do not feed later predictions, and post-origin actuals never update valid inputs. Fixing the issue date holds available information constant for the comparison.</p>
      <p><strong>Locate the leakage:</strong> The incorrect record adds actual load on the future target date. A separate linear regression trained with that extra column nearly copies the supplied answer: its invalid MAE is {mw(e.invalid_metrics.mae, 2)}. This is an unavailable-information diagnostic, excluded from valid-model rankings.</p>
      <p><strong>Read the chart:</strong> Blue is the valid forecast. Toggle the red invalid path: it follows actuals because it receives those answers. Actual load after the vertical cutoff is shown only for evaluation.</p>
      <p><strong>Keep training honest too:</strong> Training labels must be observed by the fit cutoff; fit preprocessing on training rows only. Do not randomly split overlapping forecast tasks. Training-history span, feature lookback and forecast horizon are separate choices, recorded in Dataset Details.</p>
    </div>,
    <div style={prose} key="comparison">
      <p><strong>First, supply the weekly shape:</strong> With history alone, each horizon receives the same observed lags and the same weights. They contribute the same level throughout the forecast. Days-ahead inputs permit variation but do not explicitly encode a seven-day cycle. Add Calendar to supply target-weekday timing. Other lag-based models can represent cycles; this limitation concerns our shared additive representation.</p>
      <p><strong>Selected inputs — {selected.label}:</strong> {selected.meaning} The blue forecast has MAE {mw(selectedMetrics.mae)} and RMSE {mw(selectedMetrics.rmse)}. Every choice refits ordinary linear regression on the same training tasks and cutoff.</p>
      <p><strong>Then compare with a strong baseline:</strong> The amber seasonal-naive forecast repeats the last observed week's seven values, matching weekdays: every future Tuesday uses the last observed Tuesday. The same week is reused throughout the forecast, without adding post-origin observations.</p>
      <p><strong>Shape is not the same as accuracy:</strong> With all inputs, regression has MAE {mw(fullMetrics.mae)} versus {mw(baseline.mae)} for repeat last week; RMSE is {mw(fullMetrics.rmse)} versus {mw(baseline.rmse)}. RMSE gives large misses more influence, so the rankings may differ. Neither model has an explicit holiday flag.</p>
      <p><strong>The remaining challenge:</strong> Preparing valid records and useful features takes work, and a weighted sum needs engineered inputs for nonlinear responses and interactions. {shared && <>Across the displayed origins, full-feature regression has mean MAE {mw(shared.aggregate.linear.mae)} versus {mw(shared.aggregate.naive.mae)} for repeat last week, and mean RMSE {mw(shared.aggregate.linear.rmse)} versus {mw(shared.aggregate.naive.rmse)}. </>}That preparation has not established a reliable advantage over the seasonal baseline. Section 6.2 tries support vector regression with the same training records, issue date and horizon.</p>
    </div>,
  ];

  const dataset = <div style={{ ...prose, fontSize: '0.85rem' }}>
    <div><strong>Data:</strong> German daily electricity records, {t.dataset_start} to {t.dataset_end}, OPSD / ENTSO-E. Load is daily average MW; solar/wind are daily energy sums in MWh. Price is unused; missing source prices show as n/a.</div>
    <div><strong>Training:</strong> {e.protocol.origins} origins, {e.protocol.origin_start} to {e.protocol.origin_end}, sampled every {t.origin_stride} days; {t.horizon} horizons each. Labels span {e.protocol.label_start} to {e.protocol.label_end}. {number(e.protocol.training_rows)} rows, {e.protocol.unique_targets} distinct target dates.</div>
    <div><strong>Evaluation:</strong> One fixed {t.origin_date} issue date; targets {t.holdout_start} to {t.holdout_end}. Feature lookback is at most 28 observed days. No post-origin observations update the valid forecast. The shared origin selector retains the same issue date across learner comparisons.</div>
    <div><strong>Model:</strong> Ordinary linear regression, one fit per input set. Scaling is fitted on training rows only. Displayed weights are converted back to original input units.</div>
    <div><strong>Availability:</strong> Origin-day actuals are assumed published once that day is observed; reporting delays are not modelled.</div>
    <details><summary>Feature definitions and sources</summary>
      <p>History columns count backwards from the origin: lag_1 is the origin's load, lag_7 is six days earlier, and lag_28 is twenty-seven days earlier. Recent means include the origin and span 7 or 28 readings.</p>
      <p>Calendar uses target-weekday sine/cosine and a weekend flag. Days-ahead inputs are the lead h and sine/cosine over the 30-day horizon; that position encoding is not a seven-day seasonal cycle. Renewable inputs are observed at the origin.</p>
      <Table label="Feature definitions" headers={['Input', 'Column', 'Units', 'Changes with horizon?']}>
        {e.features.map(feature => <tr key={feature.key}><th style={cell}>{feature.label}</th><td style={cell}><code>{feature.key}</code></td><td style={cell}>{feature.unit}</td><td style={cell}>{feature.changes_with_horizon ? 'Yes' : 'No'}</td></tr>)}
      </Table>
    </details>
  </div>;

  const graph = () => {
    const key = tab === 4 ? selected.key : 'safe_full';
    const keys = ['actual', key, ...(tab === 4 ? ['repeat_week'] : []), ...(tab === 3 && showInvalid ? ['invalid'] : [])];
    return <div style={{ height: 420, marginTop: '1rem' }}><ZoomableChartShell data={e.timeline} dataKeys={keys} defaultDomain={[0, e.timeline.length - 1]} minTime={0} maxTime={e.timeline.length - 1}>
      {(domain, computeYDomain, autoYDomain) => <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}><LineChart data={e.timeline} margin={{ top: 12, right: 22, left: 15, bottom: 20 }} style={{ pointerEvents: 'auto' }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="time" type="number" domain={domain} allowDataOverflow tickFormatter={value => e.timeline[Math.round(value)]?.date.slice(5) || ''} tick={{ fill: 'var(--text-muted)' }} />
        <YAxis domain={autoYDomain} allowDataOverflow tickFormatter={value => `${number(value / 1000)}k`} tick={{ fill: 'var(--text-muted)' }} label={{ value: 'Average load (MW)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} />
        <Tooltip labelFormatter={value => e.timeline[Math.round(value)]?.date} formatter={value => mw(value)} contentStyle={{ background: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', borderColor: 'var(--border)' }} />
        <Legend verticalAlign="top" height={85} wrapperStyle={{ paddingTop: 28, fontSize: '0.8rem' }} />
        <ReferenceLine x={t.origin_index} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: 'Cutoff', position: 'insideTopLeft', fill: 'var(--text-muted)' }} />
        <Line dataKey="actual" name="Actual load" stroke="var(--text-main)" dot={false} isAnimationActive={false} strokeWidth={2} />
        <Line dataKey={key} name="Linear regression" stroke="#3b82f6" strokeDasharray="5 3" dot={false} isAnimationActive={false} strokeWidth={2} />
        {tab === 4 && <Line dataKey="repeat_week" name="Repeat last week" stroke="#d97706" dot={false} isAnimationActive={false} strokeWidth={2} />}
        {tab === 3 && showInvalid && <Line dataKey="invalid" name="Future answer (invalid)" stroke="#ef4444" strokeDasharray="3 3" dot={false} isAnimationActive={false} strokeWidth={2} />}
      </LineChart></ResponsiveContainer>}
    </ZoomableChartShell></div>;
  };

  let visual;
  if (tab === 1) {
    visual = <div style={prose}><h4>A starting level plus weighted inputs</h4><div style={{ ...panel, fontSize: '1.3rem', textAlign: 'center' }}><MathText tex="\hat y=b+w_1x_1+\cdots+w_px_p" /></div><p><MathText tex="\hat y" /> is predicted load, <MathText tex="b" /> is the intercept, each <MathText tex="x_j" /> is an input, and <MathText tex="w_j" /> is its learned weight. Each product is a contribution to the prediction.</p><p>Training uses many historical records to learn one set of weights. The following tab shows all columns in one such record and reconstructs its fitted prediction.</p></div>;
  } else if (tab === 2) {
    visual = <div style={prose}>
      <h4>Original records: origin {example.origin}, later answer {example.target_date}</h4>
      <RawRecords label="Complete raw records" rows={[example.raw_origin, example.raw_target]} />
      <details><summary>All 28 source observations used by the history features</summary><RawRecords label="Full source history" rows={example.history} /></details>
      <h4>One complete training record — {e.features.length} inputs and a separate answer</h4>
      <p>Origin: {example.origin}; target: {example.target_date} ({example.weekday}); days ahead: {example.h}. Dates identify the task; date strings are not numeric predictors. Tables scroll horizontally on narrow screens.</p>
      <Table label="Complete training record" headers={['Input', 'Column', 'Value', 'Source']}>
        {e.features.map((feature, index) => <tr key={feature.key}><th style={cell}>{feature.label}</th><td style={cell}><code>{feature.key}</code></td><td style={cell}>{valueText(example.values[index].value, feature)}</td><td style={cell}>{example.values[index].source}</td></tr>)}
        <tr style={{ background: 'var(--primary-bg)' }}><th style={cell}>Target load — training answer</th><td style={cell}>y</td><td style={cell}>{mw(example.target, 2)}</td><td style={cell}>{example.target_date}, observed later</td></tr>
      </Table>
      <h4>Learned weights applied to this record</h4>
      <p>A weight multiplies its input in the units shown above. All records share these fitted weights; their input values and contributions differ. Display rounding may leave a small difference in the sum.</p>
      <Table label="Learned weights and contributions" headers={['Part', 'Learned weight', 'Contribution (MW)']}>
        <tr><th style={cell}>Intercept</th><td style={cell}>Starting level</td><td style={cell}>{signed(e.intercept)}</td></tr>
        {e.features.map((feature, index) => <tr key={feature.key}><th style={cell}>{feature.label}</th><td style={cell}>{weight(feature.weight)}</td><td style={cell}>{signed(example.values[index].contribution)}</td></tr>)}
        <tr><th style={cell}>Total fitted prediction</th><td style={cell}>Intercept + all contributions</td><td style={cell}>{number(example.prediction, 2)}</td></tr>
      </Table>
    </div>;
  } else if (tab === 3) {
    visual = <div style={prose}>
      <h4>Forecast input records for {forecast.target_date} ({forecast.weekday}), {horizon} days ahead</h4>
      <Table label="Correct and incorrect forecast inputs" headers={['Input column', 'Correct record', 'Incorrect record', 'Source / availability']}>
        {e.features.map((feature, index) => <tr key={feature.key}><th style={cell}>{feature.label} <code>({feature.key})</code></th><td style={cell}>{valueText(forecast.values[index].value, feature)}</td><td style={cell}>{valueText(forecast.values[index].value, feature)}</td><td style={cell}>{forecast.values[index].source}</td></tr>)}
        <tr style={{ background: 'var(--primary-bg)' }}><th style={cell}>Actual future target load</th><td style={cell}><strong>Unknown — excluded</strong></td><td style={cell}><strong>{mw(forecast.actual_later, 2)} — forbidden input</strong></td><td style={cell}>Observed on {forecast.target_date}, after the issue date</td></tr>
      </Table>
      <p>Both records share the same legitimate inputs. The invalid model additionally receives the future answer. Actual load in the incorrect column is revealed for this diagnostic only.</p>
      <div style={panel}>Valid full-feature MAE: <strong>{mw(fullMetrics.mae, 2)}</strong>. Invalid future-input MAE: <strong>{mw(e.invalid_metrics.mae, 2)}</strong>, excluded from valid rankings.</div>
      {graph()}
      <details><summary>One target date, different forecast origins</summary><p>October 7 can be forecast on September 23 at 14 days ahead or on September 30 at 7 days ahead. Both forecasts exist by September 30; the later issue has newer observations. These dates illustrate separate forecasting tasks, not extra fitted values in this demo.</p><p>Combining older and newer predictions is a separate technique, used as lagged ensembles in weather forecasting. Older runs may add different errors or simply stale, redundant information; a blend needs evaluation against the latest forecast. Pooling training rows estimates shared weights and does not average predictions.</p><a href="https://confluence.ecmwf.int/spaces/FUG/pages/673550774/Section+6.1.1.2+Lagged+ensembles" target="_blank" rel="noreferrer">ECMWF: lagged ensembles</a></details>
    </div>;
  } else {
    visual = <div style={prose}>
      <h4>1. Features change the forecast's shape</h4><div style={panel}><strong>{selected.label} — {e.metrics[selected.key].feature_count} inputs:</strong> {selected.added}</div>
      {graph()}
      <h4>2. Check accuracy against repeat last week</h4>
      <Table label="Forecast error comparison" headers={['Method / inputs', 'MAE (MW)', 'RMSE (MW)']}>
        <tr><th style={cell}>Linear regression: {selected.label}</th><td style={cell}>{number(selectedMetrics.mae, 2)}</td><td style={cell}>{number(selectedMetrics.rmse, 2)}</td></tr>
        <tr><th style={cell}>Repeat last week (seasonal naive)</th><td style={cell}>{number(baseline.mae, 2)}</td><td style={cell}>{number(baseline.rmse, 2)}</td></tr>
      </Table>
      <p>The largest full-model miss is {e.largest_miss.date}: {mw(e.largest_miss.model_error)} versus {mw(e.largest_miss.baseline_error)} for repeat last week. Both miss that day; the comparison does not establish the effect of adding a holiday flag.</p>
    </div>;
  }

  return <Layout title="6.1 From time series to machine learning" commentary={<><div className="tabs" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>{titles.map((title, index) => <button key={title} className={`tab ${tab === index + 1 ? 'active' : ''}`} onClick={() => setTab(index + 1)}>{index + 1}. {title}</button>)}</div>{guides[tab - 1]}</>} dataset={dataset} controls={controls} chart={visual} chartHeight="auto" />;
}
