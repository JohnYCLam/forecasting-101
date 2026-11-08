---
description: Diagnose and fix a bug (error, blank chart, wrong layout, failing check) with a minimal change and a regression check.
---

# /fix-bug <description of the problem>

1. Read `.agents/LESSONS.md`.
2. Reproduce first. Run the failing command or open the page (`visual-check` for UI). Paste the exact error or describe what you see.
   If you cannot reproduce, say so and ask for steps. Do not guess.
3. Locate the cause: Grep for the error text, component name or data key. Read only the relevant line ranges.
4. State your hypothesis in one sentence with the evidence (file:line). If the cause is in data, check the JSON key and the generator function;
   if in a chart, check the `src/charts` usage against `recharts-zoom-chart`.
5. Make the smallest fix. Do not refactor. Do not weaken lint, tests or the chart gate. Do not change numbers by hand.
6. Verify: rerun the reproduction, then `/ship-check`.
7. If the fix alters what the page says or shows (numbers, claims), also run the follow-through checklist in `content-feedback-handler`.
8. Append a lesson to `.agents/LESSONS.md`: symptom -> cause -> rule.
9. After 3 failed attempts stop and report: what you tried, exact error, hypothesis. Ask the user.
