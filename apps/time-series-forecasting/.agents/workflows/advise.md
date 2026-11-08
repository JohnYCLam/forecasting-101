---
description: Give a recommendation on a concept, topic, demo idea or teaching approach. Read-only. Options with trade-offs, one clear recommendation, then stop.
---

# /advise <question>

Examples: "What should Topic 6 cover first?", "What concept would explain why trees can't extrapolate?", "Is a heatmap or a table better for the Granger results?"
This workflow never edits files and never writes a plan. Approval rules and evidence rules are in `10-guardrails.md`.

1. Read `.agents/LESSONS.md`. Find what already exists: Grep the topic files, `README.md` syllabus, `GLOSSARY.md` (if it exists), the relevant `topicN_plan.md`.
2. Ground the question: which topic, which tab, which reader level (reader knows Topics 1..N-1 only). Ask ONE question if the target is unclear.
3. Gather evidence for each option (notebook cell, existing code, data keys). Use `notebook-to-demo` extractor for notebooks. If a statement is from general knowledge
   and you cannot verify it, label it UNVERIFIED.
4. For concept questions use `concept-explainer` rules (sources, tiny example, misconception). For graph questions use `chart-design-for-teaching` (question the graph answers,
   chart table). For topic-scope questions use `topic-content-planner` (syllabus fit, narrative contract) and `model-family-playbooks` for Topics 6-11.
5. Offer 2-3 options. For each: what it teaches, what it needs (data keys, new code, new library), risk (correctness, clarity, size), effort (files).
6. Recommend ONE option with reasons. Say plainly if the user's own idea is weaker than an alternative, with evidence. Do not agree just to agree.
7. Reply in this format and STOP:
```
## Question
<restated>
## What exists today
<evidence: file:line / JSON keys / plan sections>
## Options
1. <name>: teaches / needs / risk / effort
2. ...
## Recommendation
<option and why> (UNVERIFIED items listed)
## Next step if you agree
<which workflow: /plan-topic, /enhance-demo <mode>, /new-topic, /plan-feature>
```
