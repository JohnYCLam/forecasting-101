---
description: Plan, build and review a new Topic or a new subtab end to end.
---

# /new-topic <N> [subtab]   (omit subtab to build the whole topic)

1. Read `.agents/LESSONS.md`.
2. If `topic<N>_plan.md` does not exist, or the requested subtab is not in it, or it is not approved:
   run `/plan-topic <N> [subtab]` first and stop for approval.
3. Read `.agents/skills/add-topic-section/SKILL.md`.
4. Read `.agents/skills/model-family-playbooks/SKILL.md` if Topic N is 6-11 (new model family).
5. Generate `TASKS_topic<N>[_<subtab>].md` with `.agents/skills/plan-to-tasks/SKILL.md`: one task per add-topic-section step and, per subtab:
   data function, data review (demo-correctness-review Phase B), UI, commentary, explainability check, visual check. Each with a Verify line.
   Show it and WAIT for approval.
6. Run `/implement-plan TASKS_topic<N>...md`. (This ends with `/ship-check`, which includes `/review-topic`.)
7. Fix every review item scoring 0 (ask before fixing items scoring 1), then re-run `/ship-check` until no 0s remain.
