# Guardrails (hard rules, no exceptions)

## NEVER

1. NEVER fake a forecast. A forecast shown in the UI must come from a model really fitted in a `scripts/generators/generate_topicN_data.py` script.
   Do not derive a "forecast" from the actual series plus an offset, noise, scaling or closed-form formula. If the real model
   disagrees with the actual, SHOW the gap and explain it.
2. NEVER hardcode numeric results (RMSE, AIC, coefficients, forecasts) in JSX or commentary. They come from the JSON.
   No hardcoded fallbacks such as `?? 76.4`; show "n/a" instead.
3. NEVER reimplement zoom or pan. Use the shells in `src/charts` (see `recharts-zoom-chart`).
4. NEVER claim an implementation is verified without the applicable checks in `verify-and-report`. Documentation/instruction-only changes need a diff and reference review, not application tests. Report checks not performed explicitly.
5. NEVER edit files outside the scope of the current plan or task. No drive-by refactors.
6. NEVER delete or rewrite existing plan/review files. Append a dated section or add a new file.
7. NEVER add an npm dependency without asking. Python libraries needed by a plan (for example scikit-learn, prophet, torch): ask ONCE,
   then record them in `requirements.txt` (create it if missing, one line per package, no pinned versions unless the user asks).
8. NEVER silence errors, lint rules or the chart gate to make a check pass. Fix the cause.
9. NEVER invent math. Take formulas and numbers from `../references/*.ipynb` or the plan. If not found, say so and ask.
10. NEVER run `git commit`, `git push`, `git reset`, `git checkout -- .` or delete files unless the user asks.
11. NEVER read a whole big file (`Topic5.jsx` ~3400 lines, `scripts/generators/generate_topic5_data.py` ~1900). Use Grep and line ranges.

## Content rules (details live in the named skills; do not duplicate them here)

1. Every subtab follows the narrative contract and commentary voice of Topics 4 and 5 (`commentary-style-guide`, `topic-content-planner`).
2. Commentary reacts to the active control; every demo has a baseline and states a limitation (`demo-explainability`).
3. State the expected result BEFORE building. If the data does not show it, redesign data or claim; never patch numbers (`demo-correctness-review`).
4. Work order for new content: approved claim and scope -> data script -> data review -> storyboard -> UI and commentary -> one final `/ship-check`. If an already approved storyboard still matches the generated evidence, reuse it. Do not ask for approval again unless the substantive design changes.
5. Commentary is planned as a story before it is written (`commentary-storyboard`); words follow `plain-language-guard` and `.agents/TERMS.md`. The user's questions never go onto the page verbatim.

## Answering and feedback rules (details in `content-feedback-handler`)

1. Answer from evidence (file:line, JSON value, model call, notebook cell), not memory. Say what you could not verify.
2. Do not agree just to agree; do not defend the demo when the user is right.
3. A question or doubt is read-only. Do not edit while answering.
4. A direct imperative to change/add/remove something authorizes that scoped work; do not ask for duplicate approval. A question, doubt, or recommendation does not.
   For a substantive new claim, dataset, model, control, or chart sequence whose design the user has not specified, show the concept ledger/storyboard and ask first.
5. Reader confusion is a defect in the page: fix the page, not just the chat reply.

## ALWAYS

1. Read `.agents/LESSONS.md` and the relevant plan before editing.
2. For a substantive statistical-demo change, run the `evidence-first-demo-design` gate before planning UI or prose.
3. Work in small, coherent tasks. Use targeted checks during implementation; reuse passing results until the relevant inputs change. `/ship-check` owns final verification; do not recursively run it from every task or follow-through checklist.
4. Match nearby code style (inline styles, CSS variables such as `var(--text-muted)`, `var(--border)`).
5. Use `MathText` / `ModelOrder` for math and model names.
6. Keep generated data deterministic (seeded) and compact: round floats to 3-4 decimals, aim for each `topicN_data.json` under ~1 MB.
7. Ask only about an ambiguity that blocks correctness, changes the intended lesson, or needs authorization. Resolve routine implementation choices from the approved scope and existing patterns. Continue independent work while a blocking question is pending.
8. If the same task fails 3 times, stop and report: what you tried, the exact error, your hypothesis.

## Final report
The only final report format is the one in `verify-and-report` (used by `/ship-check`). Answer-only replies to feedback use the format in
`content-feedback-handler`; advice-only replies use the format in `/advise`. Do not invent other formats.
