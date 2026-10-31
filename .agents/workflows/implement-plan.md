---
description: Execute an approved TASKS_*.md one task at a time with verification after each task.
---

# /implement-plan <path to TASKS_*.md>

Work from `ts-forecasting-demo/`. Never batch tasks. (Rules in `.agents/rules/` are always loaded; read `.agents/LESSONS.md`.)

## Setup
1. Read `.agents/LESSONS.md`.
2. Read the task file fully and `evidence-first-demo-design`. For the current task, read only the specialist skills that task actually uses; do not preload the task file's entire skill list.
3. Run `npm run lint` and `npm test` once to record the baseline. Existing lint warnings are OK; existing errors or test failures: tell the user and stop.

## Loop (repeat for the first unchecked task)
1. Announce: "Starting Tn: <title>".
2. Read only the files the task lists (use Grep and line ranges for big files such as `Topic5.jsx`). Copy the style of a similar existing example.
3. Make the smallest edit that satisfies the task. Touch only the files named in the task.
4. Run the task's `Verify:` command. Paste the output tail.
5. If it passes: tick the box in the task file (`- [x]`), then go to the next task.
6. If it fails: read the error, fix the root cause, rerun. After 3 failed attempts on the same task: STOP. Report the task id,
   the exact error, what you tried, your hypothesis. Ask the user.
7. Use each task's targeted verification during the loop. Full lint/test/build runs once in `/ship-check`, unless a targeted result gives evidence of a broader regression.

## Content gates (for tasks that touch data, UI or commentary)
- After a data task: run `demo-correctness-review` Phase B and compare with the plan's Expected result before building UI.
- After a UI/commentary task: read `commentary-style-guide` and `examples/excerpts.md`, rewrite any paragraph that does not match,
  then run the `demo-explainability` checklist for that subtab.

## Finish
1. Run `/ship-check <changed topic.subtab>` (it runs scaled verification and a scoped review).
2. Append any new lesson to `.agents/LESSONS.md`.
3. Output the ship-check report. Do not claim success without pasted command output.

## Stop conditions (stop and ask)
- A task needs a file or a decision not covered by the plan.
- A check would need to be weakened to pass.
- The real model result disagrees strongly with the notebook or plan. Report both numbers.
