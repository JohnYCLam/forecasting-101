---
name: demo-explainability
description: Checklist and procedure to make a demo understandable to readers without outside help - the page must explain what the data is, what each line means, what to look for, and what to conclude. Use when designing or reviewing any subtab, and before calling a demo finished.
disable-model-invocation: true
---

# demo-explainability

A reader who only knows the previous topics must understand the page without asking anyone.

## When to use
- While designing a subtab (apply the checklist as requirements).
- After building it (self-review, fix all failures).

## Mechanical check (run first)
For changed reader-visible content, run BOTH scripts once at the final gate, or reuse their results if the relevant inputs have not changed. During implementation run a script early only when it helps diagnose the current edit. Each tolerates known debt in its baseline file and fails only on NEW hits. NEVER run either with `--update-baseline` unless the user asks, and never edit a baseline to hide a violation.
1. `node .agents/skills/demo-explainability/scripts/check-commentary-numbers.mjs` flags typed-in non-zero fallbacks (`?? 76.4`), typed metrics (`RMSE = 12.34`),
   typed percentages and "~n" claims in prose (standard levels 1/5/10/90/95/99/100 % are allowed), and typed critical F values. Fix by interpolating from loaded data or showing "n/a".
2. `node .agents/skills/plain-language-guard/scripts/check-commentary-shape.mjs` flags commentary bodies over 260 words, conversational question headings, repeated text between paragraphs,
   advanced jargon with no gloss at first use, and the user's rejected names (see `.agents/TERMS.md`).

## Procedure
1. Open the page using the `visual-check` skill (or read the JSX if no browser is available, and say so). Walk through it as a first-time reader.
2. Apply the relevant checklist items to the changed views. Mark irrelevant criteria N/A (for example, a table transformation does not need a forecast baseline or zoom). Record evidence for the reader outcome, failures and material limitations; do not generate a separate report row for every unchanged criterion.
3. Fix each FAIL (edit commentary, labels, defaults). Re-check.

## Checklist (applicable items must PASS)

### Title and claim
- [ ] Title states the idea ("5.1 What VARMA Is"), not a vague label.
- [ ] The key claim is stated in the first paragraph and is visible in the chart at default settings.

### Data
- [ ] Dataset card says: what, period/size, units, train/test split, how models were chosen.
- [ ] Synthetic data is labeled "Synthetic" and says what behavior was built in.

### Story and plain language
- [ ] Opens with a narrative hook connecting directly to assumptions in preceding topics.
- [ ] Each commentary tab has ONE message the reader can repeat (see `commentary-storyboard`); a beat sheet exists in the plan.
- [ ] The walk goes along the controls (start value, then what changes, then the second control) and says what the left and right sides of the key point mean.
- [ ] No question-as-heading, no Q&A pasted from the conversation, no "Understanding the Demo" panel-by-panel restatement.
- [ ] Dataset card holds data facts only; nothing in it repeats the guide card.
- [ ] Every advanced term has a plain gloss at first use; names match `.agents/TERMS.md` (`plain-language-guard`).
- [ ] A first-time reader (knows ARIMA, not econometrics) can follow without outside help.
- [ ] Dates use human-readable calendar periods (e.g. 1980Q1 to 2002Q4); zero raw index ranges ($N=84$, $T=84$).

### Multi-tab & diagnostic architecture
- [ ] Each tab and chart answers one stated question. When the lesson is detect -> diagnose -> act, those stages and their incompatible units are separated.
- [ ] Series with different units or conceptual roles share a chart only when their relationship is the question and the encoding is unambiguous.
- [ ] Commentary tabs directly switch chart views; no redundant "Active Chart View" button panels in controls.
- [ ] Playbook / action tabs without time series data cleanly omit the chart container (`chart={null}`).
- [ ] Extra cards are strictly non-redundant: no extra cards that merely re-state chart metrics or commentary text.

### Chart readability
- [ ] Every series has a plain-words legend name ("Actual", "Joint VAR forecast"), not variable names (`y1_hat`).
- [ ] Axis meaning is clear (units in tick formatter or title; time shown as human-readable where possible).
- [ ] Forecast region is visually distinct from the fit/training region (dashed line, shaded area, or ReferenceLine at the origin).
- [ ] Same concept uses the same color across tabs and topics.
- [ ] Tooltip shows readable labels and rounded values.
- [ ] Zoom/pan works (shared shells) and a reset is available. Single `ZoomableChartShell` wraps conditional charts.

### Commentary & parameter explanations
- [ ] Follows the narrative contract: limitation -> what it is -> what it forecasts -> use case -> what to look for.
- [ ] Contains a "what to look for" paragraph that references colors/line styles.
- [ ] Explains any visually surprising behavior ("Why ... looks like that").
- [ ] Defines new terms on first use. No undefined math symbols like $W_t$.
- [ ] Contains at least one limitation or assumption.
- [ ] Parameter-shift claims use a predefined, sourced test or comparison appropriate to parameter constancy; significance against zero is not substituted for stability.
- [ ] No deceptive percentage changes on near-zero baseline numbers.
- [ ] Never claims estimates "break out of their standard error bands" (estimates are centered in bands).
- [ ] Sample size band narrowing ($1/\sqrt{N}$) is not presented as an economic discovery.
- [ ] Every interactive control button is explicitly accounted for in commentary.
- [ ] Spatial references ("below", "above") match real layout.
- [ ] ML bridges are concise (< 4 lines), formula-free, explain sample-size limits, and avoid future topic teases.
- [ ] Ends with a takeaway the viewer can repeat.

### Controls
- [ ] Each control has a visible name and shows its current value.
- [ ] Defaults show the key effect immediately.
- [ ] Changing a control changes the commentary text where relevant (numbers, which paragraph is shown).
- [ ] No control produces an empty or broken chart for any allowed value.

### Honesty
- [ ] Numbers in text are interpolated from data. No hardcoded fallbacks like `?? 76.4`.
- [ ] If the model performs poorly in some case, the page says so.
- [ ] Alert honesty: plots that merely graze/touch boundaries are labeled early warnings/borderline alerts, not catastrophic breaches.

## Do not
- Do not tick items without evidence.
- Do not fix explainability by adding long text; prefer better labels, defaults and short targeted paragraphs.

## Done when
Applicable items pass with evidence in the single final report. Report any unverified browser behavior explicitly; a prose self-score or a passing regex check does not prove a first-time reader understands the demo.
