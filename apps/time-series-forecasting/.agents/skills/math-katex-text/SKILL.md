---
name: math-katex-text
description: Write equations, model names and Greek/subscript symbols in the dashboard UI using MathText and ModelOrder (KaTeX). Use whenever UI text contains math, ARIMA(p,d,q) style names, or symbols.
disable-model-invocation: true
---

# math-katex-text

## When to use
Any JSX text containing equations, subscripts, Greek letters, or model orders.

## Steps
1. Import: `import { MathText, ModelOrder } from './MathText';` (path relative to the file).
2. Model names: `<ModelOrder name="ARIMA">1, 1, 1</ModelOrder>` renders ARIMA(1,1,1). For a string like `"VAR(2)"` from JSON, split it with a regex and pass the parts (see `OrderLabel` in `src/Topic5.jsx`).
3. Equations: `<MathText>{'y_t = \\phi_1 y_{t-1} + \\epsilon_t'}</MathText>`.
4. In JS string literals, every LaTeX backslash is doubled: `\\phi`, `\\sqrt{x}`, `\\hat{y}`.
5. Look at `src/MathText.jsx` once to see what it converts automatically (unicode subscripts like `y₁`, `σ̄`, `ŷ`). Plain unicode symbols are allowed and are converted.
6. In NEW code prefer `<MathText tex="..." />` or unicode subscripts over raw `<sub>` / `<sup>` HTML. Older topics use `<MathText>σ<sub>t</sub></MathText>`; leave it, do not mass-rewrite.
7. Block equation: wrap in `<div style={{ background: 'var(--primary-bg)', padding: '0.55rem', borderRadius: '6px', textAlign: 'center' }}>` (matches Topic 5).

## Known-good examples
```jsx
<MathText>{'\\hat{y}_{t+1|t} = \\alpha y_t + (1-\\alpha)\\hat{y}_{t|t-1}'}</MathText>
<MathText>{'\\Delta y_t = \\mu + \\sum_{i=1}^{p} \\phi_i \\Delta y_{t-i} + \\epsilon_t'}</MathText>
<MathText>{'\\mathbf{y}_t = \\mathbf{c} + A_1 \\mathbf{y}_{t-1} + \\mathbf{u}_t'}</MathText>
<MathText>{'F = \\frac{(RSS_r - RSS_u)/q}{RSS_u/(n-k)}'}</MathText>
<ModelOrder name="VARIMA">2, 1, 1</ModelOrder>
```

## Do not
- Do not use single backslashes inside JS strings.
- Do not hand-type numbers into formulas. Interpolate from data: `{`...${value.toFixed(3)}`}`.
- Do not invent formulas. Take them from the notebook or the plan.

## Done when
`npm run build` passes and the equation renders without red KaTeX error text in `npm run dev`.
