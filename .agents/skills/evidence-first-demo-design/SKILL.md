---
name: evidence-first-demo-design
description: Orchestrate evidence-first design and revision of statistical teaching demos. Use before planning or substantively changing a demo's claim, data, model, chart, or explanation; prevents premature implementation, unsupported theory, and demos whose visible result contradicts the lesson.
---

# evidence-first-demo-design

Use this as the short entry gate. Load specialist skills only when the relevant phase requires them.

## 1. Identify the request mode
- **Question or doubt:** investigate and answer only. Do not edit files.
- **Recommendation or plan:** produce an evidence-backed design and stop for approval.
- **Direct change request:** continue through the gates below; do not ask the user to approve the same instruction again.
- If one message mixes questions and changes, answer the questions first. Do not implement until the answers establish a coherent claim.

## 2. Build a concept ledger before designing UI
Record, briefly:
1. **Claim:** one sentence the demo will support.
2. **Definitions:** each new term and symbol in plain language.
3. **Equation:** at most the equation needed for the claim; define every term and sign.
4. **Assumptions and scope:** exact test/model variant, deterministic terms, sample conditions, and what is not universal.
5. **Evidence:** notebook cell, generator/model call, library documentation, or a reproducible calculation.
6. **Observable:** what the reader should literally see in the default chart.
7. **Falsifier:** a result that would make the claim or demo unacceptable.

Do not promote a convenient rule of thumb into a theorem. In particular, verify critical values, asymptotic distributions, sample-size claims, significance rules, and parameter interpretations for the exact method used.

## 3. Prove the demo before polishing it
Use `demo-correctness-review` and `forecast-data-integrity` when data or model output changes.
- Inspect every plotted series and every model/parameter discussed, not only the intended winner.
- Check signs, units, dates, train/test discipline, baseline fairness, and whether commentary matches the generated values.
- For synthetic data, specify the data-generating process and expected result before generation. Do not tune seeds, shocks, windows, or holdout periods after seeing test results.
- Reject or redesign a demo if the key effect is visually absent, the forecast direction contradicts the story, or a secondary series creates an unexplained failure.
- Prefer changing the claim to the honest result over engineering a prettier outcome.

## 4. Design the teaching sequence
Use `commentary-storyboard` only after the concept ledger and demo proof agree.
- Connect to the assumption established in the preceding section.
- One commentary tab = one message = one matching view.
- Order ideas by learner need: motivation -> mechanism -> diagnostic/evidence -> decision or limitation.
- A chart must answer one stated question. Remove controls, cards, or tables that do not advance that question.
- Show the storyboard for approval before a substantive new or restructured teaching sequence.

## 5. Implement and verify proportionately
Load only the skills named by the task. Use targeted checks during implementation and the scaled final gate in `verify-and-report`.

## Contradiction check
Before reporting completion, ask:
- Does every equation sign match the verbal direction?
- Does every control and plotted series have a purpose?
- Are theoretical claims separated from this sample's empirical result?
- Is a weak/borderline result described as weak/borderline?
- Can the reader see the claimed effect at the default view without relying on the commentary?

## Done when
The concept ledger is sourced, the generated result passes its falsifier, the storyboard matches the visible demo, and no question-only request caused an edit.
