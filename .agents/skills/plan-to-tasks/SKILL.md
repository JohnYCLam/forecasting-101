---
name: plan-to-tasks
description: Convert a plan or idea (for example SECTION_5_VARIMA_PLAN.md or a user idea) into an ordered checklist of small tasks with acceptance criteria. Use before implementing anything larger than one file, and when asked to plan.
disable-model-invocation: true
---

# plan-to-tasks

## When to use
Before any multi-file work. Also when the user gives a vague idea.

## Scope note
This skill plans IMPLEMENTATION work. For planning teaching content (tabs, datasets, claims) use `topic-content-planner` first.

## Steps
1. Read the source plan/idea in full. Read `.agents/rules/00-project-map.md`.
2. List unknowns. If any blocks implementation (missing notebook, unclear model, unclear UI), ask the user. Max 5 questions, concrete and answerable.
3. Write the task file `TASKS_<slug>.md` in `ts-forecasting-demo/` using the template below.
4. Each task delivers one coherent, observable outcome with a bounded file list. Keep data generation and evidence review ahead of UI that depends on them. Several closely related files may belong to the same outcome; do not split work solely to produce more checklists.
5. Order tasks: data script -> run script -> validator -> component -> App wiring -> charts -> math text -> docs.
6. Give each task an id (T1, T2, ...), an `Accept:` behavior or invariant, and a `Verify:` procedure with expected evidence. Use an exact command where it can check the requirement; use a browser action or source/data comparison for a human-facing claim. A text search proves presence, not teaching quality or statistical correctness.
7. For planning-only requests, show the task file and stop. If the user already authorized the design and its implementation, continue through `/implement-plan`; do not request approval again for formatting the task list.

## Task file template

```
# Tasks: <title>
Source: <plan file>
Skills to use: <list>

## Open questions
- (none) or list

## Tasks
- [ ] T1 <imperative sentence>
  - File: <path>
  - Details: <exact function/section, source of numbers (notebook cell)>
  - Accept: <observable behavior or invariant; scope of the empirical claim>
  - Verify: <command, browser action or source/data comparison> -> <expected evidence>
- [ ] T2 ...

## Final gate
- [ ] verify-and-report: applicable checks pass; content/visual evidence where relevant; skipped checks explicitly identified
```

## Do not
- Do not start coding in this skill.
- Do not write tasks like "implement the section". Too big.
- Do not omit `Verify:` lines.

## Done when
The task file exists, every task has Files + Accept + Verify, and authorization is recorded or the planning-only result has been presented for review.
