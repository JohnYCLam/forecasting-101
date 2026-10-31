---
name: concept-explainer
description: Write or elaborate an explanation of a statistics/forecasting concept (for commentary, a deep-dive card, or an answer to the user) so that it is accurate, sourced and in the course voice. Use when asked to elaborate existing commentary, explain a concept better, or add a new explanation. Prevents confident but wrong statistics from memory.
disable-model-invocation: true
---

# concept-explainer

Complements `commentary-style-guide` (voice) and `demo-correctness-review` (numbers). This skill is about the CONTENT of the explanation being true.

## When to use
- "Elaborate this paragraph", "explain X more", "why does Y happen?" (when the answer becomes page text)
- Adding a new explanatory paragraph, deep-dive card or glossary entry.

## Steps
1. Start with the concept ledger in `evidence-first-demo-design`: claim, definitions, exact method variant, assumptions, evidence, observable, falsifier.
2. Locate the concept in the course: Grep the topic files and `GLOSSARY.md` (if it exists) so you reuse its definition and notation. Never redefine a term differently.
3. Gather sources, in this order: (a) the reference notebook cell (`notebook-to-demo` extractor), (b) the generator code and JSON for this demo,
   (c) the library docs or behavior you can check by running code. If none supports a statement, mark it UNVERIFIED and ask the user before putting it on a page.
4. Draft the explanation in this fixed shape (drop a part only if truly not needed):
   - **Plain statement:** one or two sentences, no jargon, say what it IS.
   - **Tiny worked example:** use the demo's own series or a 3-5 number toy example, so the reader can follow along.
   - **Why it matters here:** tie it to what is on the chart (name colors, lines, controls).
   - **Common misconception or limitation:** one sentence ("not direction, but magnitude").
5. Verify every NEW factual claim:
   - formulas: match the notebook or the plan; for numeric statements recompute with a throwaway Python snippet (do not save it in the repo);
   - behavior claims ("converges to long-run variance", "trees cannot extrapolate"): check against the generator output or a tiny experiment; if you cannot, soften the wording or mark UNVERIFIED.
6. Run a contradiction check: equation signs versus prose, theoretical statement versus sample result, and every discussed series versus its actual data.
7. Numbers in the text come from loaded JSON (`commentary-style-guide`, guardrails). Use placeholders in drafts.
8. Length budget: a paragraph stays 1-3 sentences; a card at most about 5 paragraphs. Extra depth goes into a deep-dive `extraCard` or an in-card commentary tab ("What X is" | "The demo" | "How to read the chart"; see `ui-layout-patterns`), never into one growing wall of text.
9. Run the `commentary-style-guide` checklist and the commentary part of `demo-explainability`.
10. Tell the user: what you added, the source for each non-obvious claim, and anything UNVERIFIED.

## Do not
- Do not state statistical facts from memory without a source or check.
- Do not introduce new notation when the course already has one.
- Do not explain by adding more words; prefer a better example or a clearer label.
- Do not paste notebook prose verbatim; adapt it to the course voice.

## Done when
Every claim has a source or an UNVERIFIED flag, the explanation fits the length budget, and the style checklist passes.
