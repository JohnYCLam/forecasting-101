---
description: Plan the teaching content for a future topic or subtab (syllabus fit, tabs, datasets, controls, expected results). No code.
---

# /plan-topic <N> [subtab] [title]

1. Read `.agents/LESSONS.md` and `evidence-first-demo-design`. Read `README.md` syllabus and progress; confirm Topic N's place and what precedes it.
2. Read `docs/archive/topic4/topic4_plan.md` (template), the previous topic's commentary (Grep, line ranges), and any notebook in `../references/` for Topic N
   (use `notebook-to-demo` extractor). If no notebook exists, say so and plan the data from statsmodels/sklearn datasets or seeded synthetic data.
3. If Topic N is 6-11, read `.agents/skills/model-family-playbooks/SKILL.md`.
4. Read `.agents/skills/topic-content-planner/SKILL.md` and follow it exactly. If a plan file exists and a subtab is given, append the subtab
   block and a changelog line; do not rewrite the file.
5. For each tab, also apply Phase A of `.agents/skills/demo-correctness-review/SKILL.md` (claim, expected result, mechanism, baseline, falsifier).
6. For each tab write the concept ledger and storyboard beats, not polished prose. Draft prose only after the data result passes its falsifier.
7. Write or update `topicN_plan.md`.
8. Ask up to 5 concrete open questions. Print the plan summary. STOP and wait for approval. Edit no source files.
9. After approval the next step is `/new-topic N [subtab]`.
