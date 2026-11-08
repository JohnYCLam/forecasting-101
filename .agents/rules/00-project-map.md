# Project map (always read first)

Project: interactive time-series forecasting course dashboard.
Stack: Vite 8, React 19 (plain JSX, no TypeScript), Recharts 3, KaTeX, lucide-react.
Working directory for ALL commands: `ts-forecasting-demo/` (this folder). Shell on Windows is PowerShell.

## Where things live

| Path | What it is |
|---|---|
| `src/App.jsx` (~450 lines) | Shell, sidebar nav, Topic 1 inline. Holds `activeTopic` / `activeSubTopic` state |
| `src/Topic2.jsx` ... `src/Topic6.jsx` (700-3400 lines) | One component per topic, switches on subtab (`activeTab`). Each has its own local `Layout` |
| `src/charts/` | Shared zoom/pan chart layer. The ONLY place zoom logic may live |
| `src/MathText.jsx` | `MathText`, `ModelOrder` (KaTeX) |
| `src/utils.js` | `formatValue` and helpers |
| `scripts/generators/` | Python data generators fitting real models and writing `public/topicN_data.json` |
| `public/topicN_data.json` | Static precomputed data. The React app only reads it with `fetch` |
| `docs/` | Project documentation, audit reports, and archived topic plans |
| `docs/archive/topicN/` | Archived past topic plans and reviews (Topics 1–5, gitignored) |
| `../references/*.ipynb` | Source notebooks for the math and numbers. Ground truth. Read only via the extractor (see `notebook-to-demo`) |
| `scripts/check-chart-components.mjs` | Hard gate for chart rules (`npm run test:charts`) |
| `docs/audit/INCIDENT_REPORT_FORECAST_AUDIT.md` | Why faking forecasts is forbidden |

## Commands (from `ts-forecasting-demo/`)

- `npm run lint` (oxlint + chart gate; existing warnings are OK), `npm test`, `npm run build`, `npm run dev`
- `npm run data:topicN` or `python scripts/generators/run.py N` regenerates topic N JSON (`--validate` checks integrity)
- `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py [json] [--max-kb 1024] [--require-keys a.b,c]` honesty, NaN, size, keys
- `node .agents/skills/demo-explainability/scripts/check-commentary-numbers.mjs` no typed numbers/fallbacks in `src/*.jsx` (known debt in Topic5 is baselined)
- `node .agents/skills/plain-language-guard/scripts/check-commentary-shape.mjs` commentary length, question headings, duplicates, unglossed jargon, rejected names (known debt baselined)
- `python .agents/skills/notebook-to-demo/scripts/extract_notebook.py <nb> [from to | --find text]` read notebook cells
- Windows PowerShell 5.1: never rewrite source files with `Get-Content | Set-Content` (corrupts encoding/line endings); use the edit tools.

## Data flow
Python script fits models -> `public/topicN_data.json` -> `TopicN.jsx` fetches `/topicN_data.json` -> renders. JS only formats and draws.

## Course syllabus (README)
1 Basic Forecast, 2 ARIMA, 3 Metrics & Validation, 4 GARCH, 5 VARIMA, 6 Traditional ML, 7 Prophet, 8 Traditional DL,
9 Modern DL (Transformers), 10 RAG demo, 11 Foundation models. Topics 1-5 exist.

## Router: which workflow to use (pick the FIRST that matches)

| The user wants... | Use |
|---|---|
| Implement an already approved task brief or plan, including existing-content revisions | `/implement-plan`; do not restart the advice/planning workflow |
| Asks Gemini "what do you recommend / which concept or chart would explain X / what should we cover" (advice, no changes yet) | `/advise` |
| Ask, doubt, suggest or change something about EXISTING content, or says a page is confusing (the user is reacting to the page) | `/content-feedback` |
| Asks Gemini to proactively improve a subtab: elaborate commentary, add a graph/view, or make it clearer | `/enhance-demo <subtab> <elaborate\|add-view\|clarify>` |
| Commentary has the facts but the structure is a pile (pasted Q&A, too long, jargon, repeated cards) | `/enhance-demo <subtab> restructure` |
| Something is broken (error, blank chart, wrong layout, failing check) | `/fix-bug` |
| Plan teaching content for a new topic or subtab | `/plan-topic` |
| Build an approved new topic or subtab | `/new-topic` |
| Plan or do a technical change that is not new content (refactor, small feature, tooling) | `/plan-feature`, then `/implement-plan` |
| Quality audit of a topic | `/review-topic` |
| Check forecast honesty everywhere | `/audit-forecasts` |
| Final check before finishing | `/ship-check` |

## Skills (read the SKILL.md in full before using)
- Entry gate for substantive statistical-demo work: evidence-first-demo-design. It decides which specialist skills are needed; do not load every skill by default.
- During implementation, use the current task's skills, not every skill mentioned by a workflow it links to. References to another workflow do not start a second execution/reporting loop. Reuse material already read in the current context.
- Planning: topic-content-planner, plan-to-tasks, model-family-playbooks (Topics 6-11)
- Data: forecast-data-integrity, notebook-to-demo, demo-correctness-review
- UI: ui-layout-patterns, chart-design-for-teaching (which chart/annotations), recharts-zoom-chart (zoom mechanics), math-katex-text, visual-check
- Writing: commentary-storyboard (structure, beat sheet, guided walk), plain-language-guard (words; `.agents/TERMS.md` register), commentary-style-guide (voice), concept-explainer (accurate, sourced explanations), demo-explainability
- Delivery: add-topic-section, verify-and-report
- Feedback: content-feedback-handler

Read `.agents/LESSONS.md` before implementing. Append a lesson after any mistake.
