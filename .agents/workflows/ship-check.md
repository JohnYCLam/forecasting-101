---
description: Final gate. Runs lint, test, build, validator, topic review, and produces the single verification report.
---

# /ship-check [topic.subtab]

1. Read `.agents/skills/verify-and-report/SKILL.md` and follow it exactly (lint, test, build, validator). Paste real output.
2. If reader-visible teaching content changed, run `/review-topic` only for the changed subtab(s), not the whole topic. Reuse commentary-check output from step 1; do not rerun the same script. Infrastructure-only, test-only, and tooling changes skip the teaching review.
3. If UI behavior, layout, chart, controls, or reader-visible text changed, run `visual-check` at the scope defined by that skill.
4. If anything fails, fix at most 3 times, then report and ask. Rerun only the failed check and checks downstream of the fix.
5. Output the report template from `verify-and-report`, extended with any scoped review score and visual-check result.
   This is the ONLY final report format. Other workflows must not invent their own.
