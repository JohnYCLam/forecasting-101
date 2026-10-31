---
name: recharts-zoom-chart
description: Add or modify a zoomable/pannable time-series chart in a Topic component using the shared shells in src/charts (ZoomableChartShell, SyncedDualChart, SyncedStackedChart). Use for any new line/area/composed time-series chart.
disable-model-invocation: true
---

# recharts-zoom-chart

## When to use
Any time-series chart that should zoom/pan. Static bar charts or non-time charts may use plain Recharts.

## First decide WHAT to draw
Which chart, annotations and data keys teach the concept: `chart-design-for-teaching`. This skill only covers the zoom/pan mechanics below.

## Choose the shell
- 1 chart -> `ZoomableChartShell`
- 2 charts that zoom together -> `SyncedDualChart`
- 3+ charts that zoom together -> `SyncedStackedChart`

## Steps
1. Open `src/Topic5.jsx` and find an existing usage to copy (search `SyncedDualChart`).
2. Ensure the import: `import { ZoomableChartShell, SyncedDualChart, SyncedStackedChart } from './charts';`
3. Copy the matching example from `examples/` in this skill and adapt only: data key names, titles, colors, domain numbers.
4. Wrap the chart container in a div with an explicit height (for example `height: 380`). Shells fill 100% height.
5. The X axis MUST be `type="number"`, `domain={zoomDomain}`, `allowDataOverflow={true}`.
6. The Y axis MUST auto-scale on zoom: pass `data={chartData}` and `dataKeys={['actual', 'forecast']}` to `ZoomableChartShell`, then render with `{(zoomDomain, computeYDomain, autoYDomain) => ...}` and set `<YAxis domain={autoYDomain} allowDataOverflow={true} ... />`.
7. For synced panels give every `LineChart` the same `syncId`.
8. `defaultDomain` = initial visible [min, max] in x units. `minTime`/`maxTime` = full data range. `minRange` = smallest zoom window.
9. Run `npm run test:charts`. It must pass.

## Do not
- Do not write `handleZoomIn`, `handleZoomOut`, `handleResetZoom`, `zoomDomain` state or wheel handlers.
- Do not import `ZoomIn` / `ZoomOut` from lucide-react.
- Do not put two sibling `ZoomableChartShell`s side by side for charts that should sync.
- Do not edit files in `src/charts/` unless the task explicitly says so.
- Do not forget `style={{ pointerEvents: 'none' }}` on `ResponsiveContainer` and `pointerEvents: 'auto'` on the chart (needed for drag-pan). The examples show it.

## Done when
`npm run test:charts` passes, the chart renders with zoom buttons in the top-right, and dragging pans it.
