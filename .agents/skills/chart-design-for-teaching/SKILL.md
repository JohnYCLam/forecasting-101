---
name: chart-design-for-teaching
description: Choose and design the right graph or view to explain a concept (which chart type, what to annotate, what data it needs), including non-zoom Recharts patterns. Use when asked to add a new demo graph or view, or to make an existing chart explain better. Complements recharts-zoom-chart, which covers only zoom mechanics.
disable-model-invocation: true
---

# chart-design-for-teaching

## When to use
Adding a graph/view to a subtab, or replacing a chart that does not teach its point.

## Steps
1. Write the QUESTION the graph answers, in one sentence ("Does the GARCH threshold move when volatility moves?"). One graph = one question. If you need two, make two views.
2. Pick the chart from the table. Prefer the repo's existing patterns (Grep `Topic4.jsx` / `Topic5.jsx` for a similar one and copy its style).
3. Define the data: which `gen_*` function and which new JSON keys (follow `forecast-data-integrity`; keep the JSON small: round floats, downsample). Add keys to the plan.
4. Time-series x-axis (zoom/pan wanted) -> use the shells (`recharts-zoom-chart`). Non-time or static charts (bars, scatter of two quantities, curves like news impact) may use Recharts directly (the chart gate allows it).
5. Annotate so the reader sees the point without reading (see Annotation patterns).
6. Name every series in plain words; use the course colors (`ui-layout-patterns`: blue actual, red forecast, green second series, amber one-step/secondary, dark/grey for reference).
7. Write the commentary for the graph (`commentary-style-guide`): "What this chart shows" and "Visual reading guide", plus a sentence that says what to conclude.
8. Add a control only if it changes the lesson (a slider that reveals the effect). Default must show the key effect.
9. `visual-check` it (both themes, control extremes), then `demo-explainability`.

## Which chart for which teaching goal
| Goal | Chart | Notes |
|---|---|---|
| Compare model vs baseline over time | Line chart: actual, baseline (grey), model (red dashed) | shell for time axis; mark the forecast origin |
| Show uncertainty / risk range | Lines or Area bounds around the forecast | repo uses one-step vs multi-step bound lines in Topic 4.1 |
| Show a regime or period | `ReferenceArea` shading | label the regime in the commentary, colors per Topic 4.1 |
| Show where the forecast starts | `ReferenceLine x=` at the train end | Topic 4 uses `train_size` |
| Show a long-run level the forecast converges to | `ReferenceLine y=` with a label | Topic 4.1 "Long-run sigma" |
| Compare scores across models | Bar chart with winner highlighted | `Cell` per bar; table with winner cell style |
| Relationship between two quantities | Scatter | add a reference line (x = y) when comparing predicted vs actual |
| Events (breaches, outliers) | Scatter markers on top of the line | count them in the commentary, from data |
| Shape of a response (news impact, impulse response) | Line over a non-time axis | no zoom needed |
| A matrix (coefficients, attention) | Check Topic 5 for an existing matrix rendering first (Grep `matrix`); otherwise a simple CSS-grid table with colored cells | Recharts has no heatmap. Always print the numbers or a legend. |
| Training progress (DL topics) | Two-line loss curve (train vs validation) | log or linear axis, say which |

## Annotation patterns (all exist in the repo; copy from them)
- Forecast origin: `<ReferenceLine x={origin} stroke="#111827" strokeDasharray="4 4" />`
- Level line with label: `<ReferenceLine y={level} stroke="#6b7280" strokeDasharray="4 4" label={{ value: "Long-run level", fill: "var(--text-muted)", position: "insideTopRight" }} />`
- Shaded period: `<ReferenceArea x1={a} x2={b} fill="#ef4444" fillOpacity={0.08} />`
- Filled area: `<Area type="step" dataKey="x" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.25} />`
- Use `isAnimationActive={false}` on lines (existing style) and CSS variables for text/grid colors.

## Do not
- Do not add a graph that needs a paragraph to decode. Fix the labels first.
- Do not put more than about 4 series on one chart; split into views or panels (`SyncedDualChart`).
- Do not use dual y-axes unless the units truly differ; if you do, color-code the axis labels and say so in the text.
- Do not reimplement zoom, and do not use `domain={zoomDomain}` outside the shells.
- Do not compute plotted values in JS. They come from the JSON.

## Done when
The graph has a one-sentence question, a matching commentary paragraph, annotated reference points, plain-word series names, data keys in the plan, and a visual check.
