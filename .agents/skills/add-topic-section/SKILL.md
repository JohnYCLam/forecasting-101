---
name: add-topic-section
description: Add a new Topic (TopicN.jsx plus data script, plan doc, App.jsx nav) or a new subtab inside an existing Topic. Use when asked to create a new course section or subtab in ts-forecasting-demo.
disable-model-invocation: true
---

# add-topic-section

## When to use
- New topic (for example Topic 6 Traditional ML): do steps 1-10.
- New subtab in an existing topic: do steps 1-4, 5d, 6-10 (skip 5a-5c, the topic already exists).

## Inputs you must have before starting
An APPROVED `topicN_plan.md` (made by `/plan-topic` using `topic-content-planner`) that includes the subtab(s) you are building.
It must list per tab: key claim, dataset, controls, expected result, baseline, JSON keys. If missing or unapproved, stop and run `/plan-topic`.
For Topics 6-11 also read `model-family-playbooks`.

## Steps
1. Read `.agents/LESSONS.md`, the plan, and `src/Topic4.jsx` (first ~100 lines and one full subtab) for style. Use Grep and line ranges.
2. Data script: new topic -> create `scripts/generators/generate_topicN_data.py`; new subtab -> add one `gen_*` function to the existing script.
   `main()` writes `public/topicN_data.json` and prints `[OK] Saved ...`. Follow `forecast-data-integrity` and `notebook-to-demo`.
3. Run it, then `demo-correctness-review` Phase B. If the effect is not visible, redesign (data or claim), never patch. Stop and ask if unresolved.
4. Component: new topic -> create `src/TopicN.jsx`; new subtab -> add one `if (activeTab === k)` block. Start from
   `.agents/skills/ui-layout-patterns/examples/subtab-example.jsx` (local `Layout`, state, tabs, controls, chart).
   Fetch `/topicN_data.json` with loading and error states. Implement ONE subtab at a time and run `npm run lint` after each.
5. Wire into `src/App.jsx`, one edit at a time, verifying after each:
   a. (new topic) `import TopicN from './TopicN';` next to the other Topic imports.
   b. (new topic) nav item next to the others, copying the Topic 4/5 `nav-item` pattern, with `setActiveTopic(N); setActiveSubTopic(1);`.
   c. (new topic) render `<TopicN activeTab={activeSubTopic} />` the same way Topic 5 is rendered (search `<Topic5`).
   d. (new subtab) add the subtab nav item inside the existing `activeTopic === N` block, copying a sibling.
6. Commentary: write per `commentary-style-guide`, using the plan's drafts. Math per `math-katex-text`.
7. Charts per `recharts-zoom-chart`.
8. Run the `demo-explainability` checklist on every new subtab and fix FAILs.
9. Run the `visual-check` skill.
10. Update `README.md` progress (one bullet per subtab) and the plan's `## Changelog`. Then `/ship-check`.

## Do not
- Do not copy `Topic5.jsx` wholesale.
- Do not alter other topics' nav or logic.
- Do not build without an approved plan.
- Do not compute forecasts in JS.
- Do not write commentary before the data exists (numbers must come from the JSON).

## Done when
`/ship-check` passes, explainability checklist all PASS, visual check done, nav item opens the page in `npm run dev`.
