---
name: verify-and-report
description: Final verification gate. Use at the end of ANY code change in ts-forecasting-demo, before saying a task is done. Runs lint, tests, build and the forecast validator, then writes a report.
disable-model-invocation: true
---

# verify-and-report

## When to use
Once at the final gate for a completed change set, and whenever the user asks "is it done / does it pass". Individual tasks use their targeted `Verify:` command instead of rerunning the full suite.

## Steps
1. `cd` to `ts-forecasting-demo/`.
2. Run `npm run lint`. Paste the last 15 lines of output.
3. Run `npm test`. Paste the last 15 lines.
4. If any `.jsx` file changed: run `npm run build`. Paste the last 15 lines.
5. If any `scripts/generators/generate_topic*_data.py` or `public/topic*_data.json` changed:
   run `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py`. Paste the output.
   If a topic JSON is new or changed, add `--max-kb 1024` and `--require-keys <keys from the plan>` (see `forecast-data-integrity`).
6. If reader-visible text in `src/*.jsx` changed: run `node .agents/skills/demo-explainability/scripts/check-commentary-numbers.mjs`. Paste the output. It must print `RESULT: PASS`.
7. If reader-visible text in `src/*.jsx` changed: also run `node .agents/skills/plain-language-guard/scripts/check-commentary-shape.mjs`. Paste the output. It must print `RESULT: PASS` (no new LENGTH/QUESTION/DUP/JARGON/BANNED hits).
8. If a step fails: read the error, fix the root cause, then rerun the failed command and any downstream command affected by the fix. Do not rerun unrelated passing commands. Max 3 attempts, then stop and report.
9. Fill in the template below. Do not skip fields.

## Report template (the single final-report format; `/ship-check` adds the review score table and the visual-check result)

```
## Verification report
Files changed:
- path: one-line reason
Commands:
- npm run lint: PASS/FAIL
- npm test: PASS/FAIL
- npm run build: PASS/FAIL/NOT NEEDED
- validate_forecast.py: PASS/FAIL/NOT NEEDED
- check-commentary-numbers.mjs: PASS/FAIL/NOT NEEDED
- check-commentary-shape.mjs: PASS/FAIL/NOT NEEDED
Plan items completed: (task ids)
Deviations from plan: (or "none")
Open questions: (or "none")
```

## Do not
- Do not report PASS without having run the command in this turn.
- Do not edit `scripts/check-chart-components.mjs` or lint config to make checks pass.

## Done when
The report is written and every command that was needed shows PASS with real output pasted.
