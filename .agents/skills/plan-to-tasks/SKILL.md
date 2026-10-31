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
4. Each task = ONE file change (or one function) + ONE verification command. Split anything bigger.
5. Order tasks: data script -> run script -> validator -> component -> App wiring -> charts -> math text -> docs.
6. Give each task an id (T1, T2, ...) and an exact `Verify:` command with its expected result.
7. Stop. Show the task file to the user and wait for approval.

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
  - Verify: <command> -> <expected>
- [ ] T2 ...

## Final gate
- [ ] verify-and-report skill: lint, test, build, validator all PASS
```

## Do not
- Do not start coding in this skill.
- Do not write tasks like "implement the section". Too big.
- Do not omit `Verify:` lines.

## Done when
`TASKS_<slug>.md` exists, every task has File + Verify, and the user has approved it.
