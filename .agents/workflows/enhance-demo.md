---
description: Improve an EXISTING subtab proactively - elaborate commentary, add a new graph/view, or make the demo clearer. Modes: elaborate | add-view | clarify | restructure.
---

# /enhance-demo <topic.subtab, e.g. 4.2> <mode: elaborate | add-view | clarify | restructure> [goal in a sentence]

Approval rules (from `10-guardrails.md`): wording-only edits may be applied directly; ASK FIRST before changing any number, claim, dataset, model, seed, split,
control range or default, chart structure, or anything in `src/charts/`. If the user is reacting to a specific confusion, doubt or question, use `/content-feedback` instead.

## Common start (all modes)
1. Read `.agents/LESSONS.md`, `evidence-first-demo-design`, the topic plan (`topicN_plan.md`), and only the relevant subtab block in `src/TopicN.jsx` (Grep + line ranges).
2. Open the page with `visual-check` and take a BEFORE screenshot of the default state (if no browser is available, say so and read the JSX instead).
3. State the goal in one sentence and what "better" means (a reader can do X without help).

## Mode: elaborate (more or better explanation)
1. Identify exactly which paragraph or concept needs more. Read `commentary-style-guide` and its `examples/excerpts.md`.
2. Use `concept-explainer` to write the addition (sources, tiny example, misconception, UNVERIFIED flags, length budget).
3. Place it by the length budget: short addition inside the existing paragraph; more depth in an in-card commentary tab or a deep-dive `extraCard` (`ui-layout-patterns`).
4. If the new text states a claim or number that is not already on the page, show the user the text and its source first (claims need approval). Pure rewording: apply.

## Mode: add-view (new graph or view in the same subtab)
1. Use `chart-design-for-teaching`: one-sentence question, chart choice, annotations, data keys.
2. Run `demo-correctness-review` Phase A for the new view (claim, expected result, mechanism, baseline, falsifier). Write it into the plan under the subtab.
3. Present the design to the user and WAIT for approval (new data and new chart structure always need approval).
4. After approval: make `TASKS_<slug>.md` with `plan-to-tasks` (data function, run + validate, chart, commentary, checks) and run `/implement-plan` on it.
   Data goes through `forecast-data-integrity` (`validate_forecast.py` with `--require-keys` for the new keys); do `demo-correctness-review` Phase B.
5. Chart per `recharts-zoom-chart` (time axis) or the non-zoom patterns; commentary per `commentary-style-guide`.

## Mode: clarify (make the existing demo clearer)
1. Run the `demo-explainability` checklist (including its mechanical check) on the subtab. List every FAIL with evidence.
2. Rank fixes by impact on a first-time reader; take the top 3. Typical cheap fixes: legend names, a "what to look for" sentence, definition at first use,
   better default control value, marking the forecast origin, naming colors in the text, splitting a crowded chart.
3. Apply wording-only and label fixes. For default/control/chart-structure/number changes show a proposal and ask.
4. Re-run the checklist; the FAIL count must go down.

## Mode: restructure (the commentary has the facts but not the story)
Use when a tab is a pile of paragraphs, was edited 3+ times, pastes questions/answers, is over the length budget, or the shape check reports LENGTH / QUESTION / DUP.
1. Read `commentary-storyboard`, `plain-language-guard`, `commentary-style-guide`, `.agents/TERMS.md`, and the whole commentary of the subtab (all tabs and the dataset card).
2. Inventory: list each existing fact or point and triage it PAGE / CHAT / DEEP-DIVE / CUT (duplicate or unsupported).
3. Write the storyboard (`commentary-storyboard/templates/storyboard.md`) per commentary tab: one message, beat sheet, guided walk, numbers needed, card placement, terms used.
4. Show the storyboard to the user and WAIT for approval. No code changes before approval. Flag any number the JSON lacks (to add in the generator) and any claim to verify.
5. After approval, rebuild the tabs from the beat sheet (do not append to the old text); fix typed numbers by reading from the JSON; move or drop duplicated cards/panels; apply TERMS names in legends and headers.
6. Run `check-commentary-numbers` and `check-commentary-shape`; the subtab's baseline entries should drop (the stale count tells you). Tell the user which baseline entries are now fixed.

## Common finish (all modes)
1. Follow-through from `content-feedback-handler` section 3 (scaled: wording-only is light, data/numbers/claims/controls is full): plan `## Changelog` line, other tabs and later topics consistent, `.agents/LESSONS.md` if useful.
2. `visual-check` AFTER screenshot; compare with BEFORE.
3. `/ship-check <topic.subtab>` (the only final report format). In the report add: goal, mode, before/after summary, items needing approval or left undone.
