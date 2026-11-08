---
description: Execute an approved task brief in coherent stages, verify outcomes, and run one final gate.
---

# /implement-plan <path to approved task brief or TASKS_*.md>

Work from `ts-forecasting-demo/`. Follow the approved scope; do not restart planning or rewrite the task into another task file. Do not mix unrelated tasks. Read `.agents/LESSONS.md` once in the current context.

## Execution brief

Use an existing brief if it already states the outcome, affected files, acceptance evidence and constraints. If a detail is missing, infer a routine choice or ask only if it blocks correctness or changes the design. Do not require a particular filename or another approval merely to reformat an authorized task.

A useful brief states:
- Outcome: what the reader can understand or do after the change.
- Scope: affected files/sections and what is deliberately deferred.
- Acceptance: concrete observable results, including counterexamples or limitations; distinguish a required invariant from a hoped-for empirical improvement.
- Evidence: source data/model call, applicable checks and browser states.
- Authorization: the user instruction or approved design to execute.

For example, "improve storytelling" is insufficient acceptance. "A reader can trace one raw observation into an input column, distinguish the training target from forecast-time inputs, and identify why the future-informed score is invalid" is observable. A successful text search, compile or JSON-schema check does not establish these learning outcomes.

## Setup
1. Read `.agents/LESSONS.md`.
2. Read the task brief fully. Use `evidence-first-demo-design` for substantive teaching changes. For the current stage, read only specialist skills needed for its decisions; do not preload the brief's entire skill list. Reuse an approved ledger/storyboard rather than drafting it again.
3. Inspect the working diff before editing and preserve existing user changes. Run baseline checks only if needed to distinguish an existing failure from a regression; otherwise leave full checks to the final gate. Record any baseline failure and continue independent work unless it prevents reliable verification of the requested change.

## Loop (repeat for the first unchecked task)
1. Announce: "Starting Tn: <title>".
2. Read the listed files and necessary dependencies (use Grep and line ranges for big files such as `Topic5.jsx`). Use one relevant existing example to resolve style choices.
3. Make the smallest edit that satisfies the task. Touch only the files named in the task.
4. Run the task's targeted check when its relevant inputs have changed. Record the command, result and a short evidence excerpt. Check its acceptance behavior as well; a green command is not a substitute for reading the result or inspecting the page.
5. If it passes: tick the box in the task file (`- [x]`), then go to the next task.
6. If it fails: read the error, fix the root cause, rerun. After 3 failed attempts on the same task: STOP. Report the task id,
   the exact error, what you tried, your hypothesis. Ask the user.
7. Use each task's targeted verification during the loop. Full lint/test/build runs once in `/ship-check`, unless a targeted result gives evidence of a broader regression.

## Content gates (for tasks that touch data, UI or commentary)
- After a changed data/model stage: apply the relevant `demo-correctness-review` Phase B criteria and compare with Expected result before building UI. Reuse earlier validator/hash evidence if those inputs are unchanged. Do not regenerate data for wording-only work.
- During UI/commentary work: apply `commentary-style-guide` and one relevant excerpt already read. Check the current stage's reader outcome. Apply the final scoped `demo-explainability` review once after the affected views are complete, rather than a full audit after each paragraph or file.

## Finish
1. Run `/ship-check <changed topic.subtab>` (it runs scaled verification and a scoped review).
2. Append any new lesson to `.agents/LESSONS.md`.
3. Output the ship-check report. Do not claim success without pasted command output.

## Stop conditions (stop and ask)
- A necessary mutation expands the authorized scope, or a missing decision changes the statistical claim or teaching sequence. Reading a dependency or choosing a routine implementation detail is not such a blocker.
- A check would need to be weakened to pass.
- The real model result disagrees strongly with the notebook or plan. Report both numbers.
