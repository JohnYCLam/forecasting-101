---
description: Turn an idea into an approved task list. No code is written.
---

# /plan-feature

Input: the user's idea (text) or a plan file path.

1. Read `.agents/rules/00-project-map.md`, `.agents/rules/10-guardrails.md`, `.agents/LESSONS.md`.
2. Read the idea. Find related files: `topic*_plan.md`, `SECTION_*`, the matching notebook in `../references/`.
3. Read `.agents/skills/plan-to-tasks/SKILL.md` and follow it exactly.
4. Ask the user the open questions (max 5). WAIT for answers. Do not assume.
5. Write `TASKS_<slug>.md`.
6. Print the task file. Ask: "Approve this plan?" and STOP. Do not edit any source file.
