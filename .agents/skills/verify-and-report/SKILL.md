---
name: verify-and-report
description: Verify the completed change set using checks appropriate to the affected code, data or content; produce one evidence-based report.
disable-model-invocation: true
---

# verify-and-report

## When to use
Once at the final gate for a completed change set, and whenever the user asks "is it done / does it pass". Individual tasks use targeted checks. Reuse a recorded result if its relevant inputs have not changed; a new chat turn alone does not invalidate it.

Documentation/instruction-only changes: review the diff, links and workflow consistency; validate changed skill metadata when a validator is available. Application lint/tests/build, generator runs and browser checks are NOT NEEDED unless executable application inputs also changed in this task. Pre-existing user changes are not changes made by this task.

## Steps
1. `cd` to `ts-forecasting-demo/`.
2. For application code or configuration changes, run `npm run lint`. Record the result and a short relevant output excerpt.
3. For application code or configuration changes, run `npm test`. Record the result and a short relevant output excerpt.
4. If application source, styles, build configuration or dependencies changed: run `npm run build`. Record the result and a short relevant output excerpt.
5. If any `scripts/generators/generate_topic*_data.py` or `public/topic*_data.json` changed:
   run `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py <changed JSON path>` for each affected topic payload. Record the output.
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
Acceptance evidence: <observable outcome/source comparison; unverified items stated>
Commands:
- npm run lint: PASS/FAIL/NOT NEEDED
- npm test: PASS/FAIL/NOT NEEDED
- npm run build: PASS/FAIL/NOT NEEDED
- validate_forecast.py: PASS/FAIL/NOT NEEDED
- check-commentary-numbers.mjs: PASS/FAIL/NOT NEEDED
- check-commentary-shape.mjs: PASS/FAIL/NOT NEEDED
- instruction/reference review: PASS/FAIL/NOT NEEDED
Plan items completed: (task ids)
Deviations from plan: (or "none")
Open questions: (or "none")
```

## Do not
- Do not report PASS without observed command output for the current relevant inputs. Identify reused results and their scope. Never infer success merely from a prior agent's summary.
- Do not edit `scripts/check-chart-components.mjs` or lint config to make checks pass.

## Done when
The report identifies observed results, applicable acceptance evidence, checks not needed and checks not performed. Keep output excerpts short; do not paste the same log into multiple reports.
