---
name: topic-content-planner
description: Plan the teaching content of a new course topic or subtab (syllabus fit, learning goals, tab sequence, dataset, controls, expected result, limitations) as a topicN_plan.md matching the style of topic4_plan.md. Use before building any new topic or subtab, or when asked to plan future topics.
disable-model-invocation: true
---

# topic-content-planner

## When to use
Planning Topics 6-11 from the README syllabus, or adding a new subtab. Output is a PLAN, not code.

## Inputs
- Topic number and name from the syllabus in `README.md` ("The Syllabus" list).
- Reference notebook(s) in `../references/` if any.
- Reference plans: `docs/archive/topic4/topic4_plan.md` (best template), `docs/archive/topic3/topic3_plan.md`, `docs/archive/topic5/SECTION_5_VARIMA_PLAN.md`.

## Steps
1. Read `README.md` (syllabus + progress), `docs/archive/topic4/topic4_plan.md`, `.agents/LESSONS.md`.
2. Read the previous topic's last tab in `src/TopicN-1.jsx` (just its commentary) so the new topic bridges from it.
3. Write the Topic header: Title, one-line subtitle, bridge sentence from the previous topic ("X assumed ..., this fails when ...").
4. Fix the tab list (4-6 tabs). Standard arc, adapt as needed:
   - N.1 Why the previous approach is insufficient + the new idea (intuition first)
   - N.2 Mechanics: how the model works, with a parameter/order control
   - N.3 Real or realistic data application
   - N.4 Validation: out-of-sample, compared with a baseline
   - N.5 Practical use case / decision
   - N.6 Extensions, limitations, when NOT to use
5. For EACH tab fill the per-tab block from `templates/topic_plan.md`. FIRST read the filled example in `examples/worked_tab_example.md`
   and imitate its depth and shape. Every field is mandatory:
   Goal, Key claim (one sentence), Narrative contract (5 parts), Dataset + why it shows the effect, Controls + defaults,
   Expected result (what viewer should see, stated BEFORE building), Baseline compared, Limitations to state, Notebook source.
6. Choose datasets: prefer data shipped with statsmodels/sklearn, or synthetic with a fixed seed, so it is reproducible and
   needs no downloads. State why the data contains the effect being taught.
7. Add a "Data plan": which `gen_*` functions, which JSON keys, which model calls (no fabricated numbers).
8. Add a "Risks" section: what could make the honest result disappointing and what you will do (see `demo-correctness-review`).
9. Save to `topicN_plan.md` in `ts-forecasting-demo/`. Do not overwrite an existing plan; if one exists, append a dated section.
10. STOP and ask the user to approve.

## Content quality bar
- Each tab teaches ONE idea. If you need "and" in the key claim, split the tab.
- Progressive disclosure: commentary must change with the active control (view, slider, step).
- A reader with only the previous topics' knowledge must follow. Define each new term at first use.
- Every demo must have a simple baseline, so the viewer sees WHY the new model matters.
- State at least one limitation per tab.

## Do not
- Do not write code.
- Do not put numeric results in the plan unless they came from a notebook cell (cite the cell).
- Do not plan a demo whose effect you cannot explain in one sentence.
- Do not skip the Expected result field.

## Done when
`topicN_plan.md` exists with all fields for all tabs and the user approved it.
