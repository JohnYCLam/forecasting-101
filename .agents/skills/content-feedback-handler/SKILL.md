---
name: content-feedback-handler
description: Handle the user's questions, doubts, recommendations, update requests and "I did not understand this" remarks about EXISTING demo content. Classify each item, answer from evidence, assess recommendations honestly, and turn approved items into small scoped edits with follow-through.
disable-model-invocation: true
---

# content-feedback-handler

Use for any user message about existing content ("are these numbers real?", "why does X happen?", "add Y", "change the dataset", "this chart is confusing").
Brand-new content goes to `/plan-topic`. Approval and evidence rules are in `10-guardrails.md`; this skill is the procedure.

## 1. Split and classify
Number every point. Label each: QUESTION (wants to understand), DOUBT (suspects something is wrong or fake), RECOMMENDATION (suggests an improvement),
UPDATE (directs a specific change), CONFUSION (did not understand the page: a defect in the page, not the user).
Show the list. Ask ONE short question for any ambiguous point. Never drop a point.

## 2. Handle by type
**QUESTION / DOUBT (read-only):**
1. Find evidence: generator function and line, `TopicN.jsx` line, the JSON key and value, the notebook cell (`notebook-to-demo` extractor),
   and for honesty doubts run `validate_forecast.py`.
2. Answer with the quoted evidence. Never answer from memory or from what the commentary claims. Say what you could not verify.
3. Doubt valid: say "You are right" and propose a fix. Doubt invalid: show the evidence that settles it. A question the page failed to answer becomes a CONFUSION item.

**CONFUSION:** find the element that confused (chart, term, control, number); pick the cheapest fix (legend name, "what to look for" sentence,
definition at first use, better default, a "Why ... looks like that" paragraph) per `commentary-style-guide`; apply as a wording-only edit.

**RECOMMENDATION:** write Benefit, Risk, Effort and Verdict (AGREE / AGREE WITH CHANGES / DISAGREE, with reasons). Offer an alternative if the idea
would mislead readers or break correctness. Ask approval before changing anything.

**UPDATE:** restate the change and list everything it affects (section 3). An explicit imperative such as "change/add/remove X" is already authorization for that scoped change; do not ask the user to approve it again. If the update requires a new teaching sequence, show the storyboard before implementation because its content has not yet been specified.

**Hand-off:** if an approved item adds a new graph/view, or needs a substantial new explanation, continue with `/enhance-demo <subtab> add-view` or
`elaborate` (they use `chart-design-for-teaching` and `concept-explainer`). If the user instead asks what you would recommend, use `/advise`.

## Page, chat or deep-dive? (every answer, before anything reaches the page)
Your answers to QUESTION, DOUBT and CONFUSION items are for CHAT. Only put something on the page if a first-time reader would wonder it at a specific moment of the demo.
Triage each as PAGE / CHAT / DEEP-DIVE exactly as in `commentary-storyboard` step 1. For PAGE and DEEP-DIVE: extract the learning point, never paste the question or Q&A pair,
never use a conversational question as a heading, and place it by the storyboard (beat sheet), not at the end of the tab.
If the tab already has 3 or more edits since its last restructure, or the shape check reports LENGTH / QUESTION / DUP, run `/enhance-demo <subtab> restructure` instead of appending.
Words follow `plain-language-guard` (gloss jargon, registered names from `.agents/TERMS.md`).

## 3. Follow-through after each applied change
Wording-only: changelog line, `npm run lint`, `visual-check` of that tab. Anything touching data, numbers, claims or controls: all of these.
- Data changed: regenerate the JSON, validator, `demo-correctness-review` Phase B.
- Numbers in commentary still interpolated from JSON and still true (search the topic file for related text).
- Other tabs using the same data/control, and later topics or README that refer to this one, still consistent.
- Dated line in `topicN_plan.md` `## Changelog` (create the section if missing).
- `demo-explainability` re-run for the tab; `.agents/LESSONS.md` lesson if a mistake was found.
- `visual-check`, then `/ship-check`.
Several approved items: make a short task list (`plan-to-tasks` format) and run them one at a time.

## 4. Reply format
```
## Items
1. [TYPE] <restated item>
## Answers and evidence
Item n: <answer>. Evidence: <file:line / JSON key = value / notebook cell>. Not verified: <...>
## Assessment (recommendations)
Item n: Benefit / Risk / Effort / Verdict
## Proposed changes
- <task> (needs approval: yes/no, why)
## Applied so far
- <wording-only edits, file and line>
## Question for you
<one concrete question, or "none">
```

## Do not
- Edit during a QUESTION or DOUBT, or bundle unapproved changes with approved ones.
- Agree automatically, or get defensive.
- Make unrelated improvements, or change numbers by hand (regenerate data instead).

## Done when
Every item has an answer, assessment or applied/approved change, follow-through is done for each applied change, and the reply follows the format.
