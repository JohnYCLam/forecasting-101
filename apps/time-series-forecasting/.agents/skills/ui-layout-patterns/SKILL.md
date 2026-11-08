---
name: ui-layout-patterns
description: Build a topic subtab page with the repo's real layout - the local Layout component (guide card, dataset card, optional extra card, controls bar, chart container), in-card tab buttons, button and slider controls. Use for any new subtab UI in a Topic component.
disable-model-invocation: true
---

# ui-layout-patterns

Each `TopicN.jsx` defines its OWN local `Layout` component (not shared). Copy it from `src/Topic5.jsx` (search `const Layout`).

## Page anatomy (top to bottom)
1. `top-panels` row with two `glass` cards: left = guide/commentary (`BrainCircuit` icon), right = dataset (`Info` icon).
2. Optional `extraCard`: a third full-width card (metrics table, deep dive).
3. `controls` bar (centered, wraps).
4. `chart-container`: the chart(s), fixed height (`chartHeight`, 720px typical).

Card roles: guide card = story; dataset card = data facts only (no concept text, no repeated commentary); extra card = table or deep-dive. See `commentary-storyboard`.
When a chart carries many series, show only the series the active commentary tab discusses (extra lines appear in the tab that explains them). This is a chart-structure change, so propose it first.

## Multi-tab subtab architecture & diagnostic hierarchy
When a subtab covers testing, diagnostics, or model comparison:
1. **Separate distinct conceptual spaces:**
   - Start from the sequence approved in the storyboard. A detect -> diagnose -> act sequence is useful when the actual lesson follows that investigation.
   - Keep two measures in separate views when they answer different questions or incompatible units would obscure the lesson. Do not force every diagnostic topic into the same three stages.
2. **Tab-driven view switching:**
   - Let the top-level commentary tabs (`commentaryTab`) directly switch both the chart view and active controls.
   - **Do NOT add redundant secondary toggle panels** like `"Active Chart View: [View 1] [View 2]"` in the controls bar. Clicking the tab is sufficient.
3. **Strategy / playbook tabs have no charts:**
   - On final operational playbook or takeaway tabs, set `chart={null}` and `controls={null}`. The layout will cleanly skip rendering empty chart containers.
4. **ExtraCard discipline (no redundancy):**
   - Do NOT add an `extraCard` that merely repeats metrics, summaries, or scorecard cards already presented in the commentary or visible on the chart.
   - Use `extraCard` ONLY for non-redundant, distinct tabular data (e.g., Johansen cointegration rank tables, out-of-sample forecast comparison matrices).
5. **Single `ZoomableChartShell` rule:**
   - When switching chart variants conditionally within one subtab, use a **single** `<ZoomableChartShell>` and switch the `<ComposedChart>` child inside it:
     ```jsx
     <ZoomableChartShell ...>
       {(zoomDomain) => (
         <ResponsiveContainer ...>
           {commentaryTab === 1 ? <ComposedChart ... /> : <ComposedChart ... />}
         </ResponsiveContainer>
       )}
     </ZoomableChartShell>
     ```
   - Declaring multiple adjacent `<ZoomableChartShell>` sibling elements triggers the architecture gate (`npm run test:charts`).

## Steps
1. Open `examples/subtab-example.jsx` and copy the shape.
2. Make sure the Topic file has the local `Layout` (copy from Topic5, do not import it from elsewhere).
3. Commentary: write using `commentary-style-guide`. If more than ~4 paragraphs, use in-card tab buttons
   (state `commentaryTab`, buttons with `className="tabs"` / `tab` / `tab active`).
4. Controls, by type:
   - Option picker: buttons `className={`nav-btn ${selected ? 'primary' : 'secondary'}`}`.
   - Slider: `<label>` row with name left and value right (bold), then `<input type="range" .../>`.
   - Keep default control values such that the key effect is visible at first load.
5. Chart: use `recharts-zoom-chart`.
6. Colors: use CSS variables (`var(--text-main)`, `var(--text-muted)`, `var(--border)`, `var(--surface)`, `var(--primary-bg)`,
   `var(--chart-grid)`, `var(--chart-tooltip-bg)`, `var(--chart-tooltip-text)`). Series colors: blue `#2563eb`, red `#ef4444`,
   green `#10b981`, amber `#d97706`, dark `#111827`. Reuse the same color for the same concept across tabs.
7. Table styles: reuse `comparisonTableStyle`, `tableHeaderCellStyle`, `tableCellStyle` (copy from Topic5). Highlight winners
   with `winnerCellStyle` in Topic4.
8. Loading state: until JSON loads show a simple centered "Loading..." panel. Missing data: show a visible message, never fake values.
9. Dark/light themes both must read well, so never hardcode white/black backgrounds. Use variables.

## Do not
- Do not create a new design. Match the existing cards.
- Do not import a Layout from another topic file.
- Do not use `<sub>` inside new commentary; prefer `MathText tex="..."` (old code uses `<sub>` and may stay).
- Do not put long commentary inside the chart container.
- Do not add duplicate "Active Chart View" button panels in controls when tabs already switch the view.
- Do not add redundant extraCards that duplicate chart numbers or commentary text.

## Done when
The page has the four regions above and looks like a Topic 5 subtab in both themes (`npm run dev`).
