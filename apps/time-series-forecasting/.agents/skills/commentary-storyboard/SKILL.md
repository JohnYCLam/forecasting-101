---
name: commentary-storyboard
description: Plan commentary as a story BEFORE writing prose - one message per commentary tab, a beat sheet tied to graph elements, a guided walk along the controls, and a restructure pass so repeated edits never turn a tab into a pile of paragraphs. Use whenever you write, extend or restructure the commentary of a subtab, and whenever the user's questions or comments are about to be added to the page.
disable-model-invocation: true
---

# commentary-storyboard

Complements `commentary-style-guide` (voice of each paragraph) and `plain-language-guard` (words). This skill decides WHAT goes on the page, in WHAT ORDER.

## When to use
- Writing commentary for a new subtab or commentary tab.
- Adding answers, elaboration or new points to existing commentary (the trigger that usually ruins structure).
- The same tab has been edited 3 or more times since its last restructure (check the plan `## Changelog`), or `check-commentary-shape.mjs` reports LENGTH, QUESTION or DUP.

## Step 1: Triage every input (questions, comments, ideas) into PAGE / CHAT / DEEP-DIVE
For each question or point the user raised, decide:
- PAGE: a first-time reader will wonder this at a specific moment in the demo. Extract the LEARNING POINT, not the question. It becomes a beat in the story.
- CHAT: only the user needed it (verification, doubt, meta-discussion). Answer in chat, never on the page.
- DEEP-DIVE: true but secondary (derivation, proof, edge case). Goes into an optional deep-dive card or commentary tab, one or two short paragraphs.
NEVER paste the user's question or a Q&A pair onto the page. NEVER use a conversational question as a heading.

## Step 2: One message per commentary tab
Write it as one sentence a reader could repeat ("Granger rejects more often as the true effect grows, and sooner with more data."). If you need "and also", split into two tabs or move half to DEEP-DIVE. Keep the number of tabs small (3-4).

## Step 3: Write the beat sheet (a table in the plan, or a markdown block in chat for approval)
Use `templates/storyboard.md`. Each beat has: `Beat | What the reader looks at (graph element or control value) | The plain sentence | New term introduced (with its gloss)`.
For a substantive new sequence or restructure, show the beat sheet and wait for approval. For a scoped wording change that preserves the approved sequence, update only the affected beat without adding another approval round.
Standard spine (adapt):
1. The question the reader has, in plain words (no formula yet).
2. The idea in plain words, then at most ONE formula.
3. The setup: what the data/lab is (kept short; details live in the dataset card).
4. Guided walk (see Step 4).
5. Takeaway: one sentence, plus when it does NOT hold (limitation).

## Step 4: Guided walk along the controls (the core of a demo tab)
Narrate the demo as a path the reader can follow with the controls, in order of increasing effect:
"Start with b = 0 (no real effect): Granger rejects in {rej_b0}% of datasets, a false alarm by design, so {1-rej_b0}% correctly find nothing. Now move b up: ...".
- Each step names a control value, what to look at (colors, lines, which side of a crossing), what it means, and why.
- Say what the LEFT and RIGHT sides (or before/after) of a key point mean in terms of the data or model.
- Say what changes when the second control moves (for example sample size) and the plain reason.
- Every number comes from the loaded JSON (`commentary-style-guide`); if a needed number is not in the JSON, add it in the Python generator (for example the b where the median crosses the bar), never type it.

## Step 5: Place each thing in its card (card roles)
- Guide card (commentary tabs): the story. Concepts, reading guide, takeaway.
- Dataset card: data FACTS only (what, size, period, units, split, how models were chosen, the generating equation in one line). No concept explanations, no repeated commentary.
- Extra card: scorecard/table plus one sentence saying why each column is there.
- Chart: show only the series the current commentary tab talks about (reveal extra series, such as the AIC and holdout lines, when their tab is active, if the code allows; propose it if it needs a structural change).

## Step 6: Budgets and a restructure pass
- Commentary tab: at most about 5 short paragraphs or about 250 words of prose (the shape check uses 260). Equations count as one block each.
- After writing, re-read as the first-time reader: can they say the tab's message back? Does every paragraph serve a beat? Cut the rest or move it to DEEP-DIVE.
- Restructure pass: when the tab is already a pile, do NOT append. Rebuild it from a fresh beat sheet, keeping only facts that map to a beat, and note it in the plan `## Changelog` ("restructured 5.4 tab 1").

## Step 7: Check
Run `plain-language-guard` (jargon, names), `check-commentary-shape.mjs` (no new LENGTH/QUESTION/DUP/JARGON/BANNED), `check-commentary-numbers.mjs`, then `demo-explainability` and `visual-check`.

## Do not
- Do not write prose before the beat sheet is approved (for new tabs) or at least shown (for small edits).
- Do not put the same explanation in two cards.
- Do not explain a graph by listing every line; explain the one relationship the tab is about.
- Do not add a section "Understanding the Demo" that restates the chart panel by panel; integrate the reading guide into the walk.

## Done when
Every PAGE item maps to a beat, the tab has one message, card roles are respected, budgets pass, and the user can approve the beat sheet in under a minute.
