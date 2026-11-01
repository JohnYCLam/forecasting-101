---
description: Read-only quality review of a topic/subtab against narrative contract, story flow, plain language, explainability and correctness. Outputs a scored report.
---

# /review-topic <N> [subtab]

Read-only. Do NOT edit files. Run from `ts-forecasting-demo/`.

1. Read its plan (`docs/archive/topicN/` or `docs/topicN/`), `src/TopicN.jsx` (the requested subtab; Grep and line ranges for big files), the matching `scripts/generators/generate_topicN_data.py`, and `.agents/TERMS.md`.
2. Read `evidence-first-demo-design` and `demo-explainability`. Load only the specialist skill needed to investigate a failed criterion
   (story -> `commentary-storyboard`; wording -> `plain-language-guard`; statistics -> `demo-correctness-review`; forecast provenance -> `forecast-data-integrity`).
3. Run only the review-specific mechanical checks below. Lint, unit tests, build, and forecast validation belong to `/ship-check` and must not be duplicated here:
   - `node .agents/skills/demo-explainability/scripts/check-commentary-numbers.mjs`
   - `node .agents/skills/plain-language-guard/scripts/check-commentary-shape.mjs`
   Report how many baseline (known debt) entries exist for the subtab you review, not only the NEW hits.
4. For each subtab, evaluate and score 0-2 per criterion (0 fail, 1 partial, 2 pass), with a quote or line reference as evidence:
   - Narrative contract (5 parts present, in order)
   - Story flow: one message per commentary tab; beats follow the question -> idea -> setup -> guided walk -> takeaway; no pasted Q&A or question headings
   - Guided walk: narrates along the controls and explains what each side of the key point means
   - Plain language: first-time reader can follow; jargon glossed at first use; registered names (`TERMS.md`) used in text, legends and headers
   - Card roles and duplication: guide card = story; dataset card = data facts only; nothing repeated
   - Length: each commentary tab within budget (about 250 words or 5 short paragraphs)
   - Commentary voice matches Topic 4/5 (labels, color references)
   - Explainability checklist (all items)
   - Controls reactivity (commentary changes with control state)
   - Data honesty (every number from JSON, no typed results, no hardcoded fallbacks); spot-check 3 typed or computed claims against the JSON
   - Statistical correctness (split, leakage, baseline, metrics, notebook cross-check; claims precise, for example AIC wording)
   - Layout consistency (guide card, dataset card, controls, chart; shared chart shells)
   - Limitations stated
5. Output a table: subtab | criterion | score | evidence | fix suggestion.
6. Output total score and a prioritized fix list (max 10 items, highest impact first). If story flow or length scores 0, the first fix is `/enhance-demo <subtab> restructure`.
7. Ask which fixes to apply. Do not apply any.
