---
description: Audit every generate_topic*_data.py and topic JSON for hardcoded or faked forecasts.
---

# /audit-forecasts

1. Read `docs/audit/INCIDENT_REPORT_FORECAST_AUDIT.md` and `.agents/skills/forecast-data-integrity/SKILL.md`.
2. Run `python .agents/skills/forecast-data-integrity/scripts/validate_forecast.py`. Paste the output.
3. For each generator script, manually list every array that ends up under a key named like forecast/pred/fitted, and
   for each state the exact line and model call that produces it (for example `res.forecast(...)` at line 123).
   Use the Grep tool on `forecast|predict|\.fit\(`.
4. Flag anything that is: computed from the actual series, a literal list, or lacks a fitted model upstream.
5. Report as a table: file | line | variable | producing call | verdict (OK / SUSPECT).
6. Do NOT fix anything. Only report. Ask the user which suspects to fix.
