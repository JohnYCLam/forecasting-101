---
name: plain-language-guard
description: Keep commentary friendly to readers - assumed reader level, jargon with plain glosses at first use, one agreed name per concept (the term register in .agents/TERMS.md), and the user's rejected names. Use whenever you write or edit any reader-visible text, chart legend, table header or control label.
disable-model-invocation: true
---

# plain-language-guard

Complements `commentary-style-guide` (voice) and `commentary-storyboard` (structure). This skill is about the WORDS.

## Reader level (assume this, nothing more)
The reader has followed Topics 1 to N-1: ARIMA, stationarity, white noise, residuals, AIC, variance, simple hypothesis testing ideas. The reader has NOT studied econometrics or mathematical statistics. If a word is not in that list, treat it as new.

## Steps
1. Read `.agents/TERMS.md` (term register). Use the registered name for each concept everywhere: commentary, chart legends, table headers, control labels, dataset card. If you need a new concept name, add a row to TERMS.md (plain name, one-line gloss, where first introduced) and tell the user.
2. First use of a new or advanced term in a topic: give the plain meaning in the same sentence, in 12 words or fewer, in parentheses or after "that is" / "meaning". Example: "the test rejects (says the effect is real, not luck)".
3. Prefer the plain phrase over the term when the term adds nothing ("a false alarm" over "Type I error"; "how small an effect the test can notice" over "power"). Terms in `scripts/jargon.json` "terms" need a gloss; if you cannot gloss one in a clause, rewrite the sentence without it.
4. Never use a name in `jargon.json` "banned" (for example "Detection Rate"). Use the listed replacement. The user's naming decisions are in TERMS.md; do not drift back.
5. One idea per sentence; define symbols when they first appear ("b, how strongly Y₂'s past drives Y₁"). Spell out abbreviations once (RSS, AIC, H₀).
6. Explain a formula in words BEFORE showing it; show at most one or two per tab (`commentary-style-guide`).
7. Check precision: do not trade accuracy for friendliness. If a plain phrase would be false ("AIC minimizes MSE"), use the accurate plain phrase ("AIC favours models that forecast new data well") and verify via `concept-explainer`.
8. Run `node .agents/skills/plain-language-guard/scripts/check-commentary-shape.mjs`. No new JARGON or BANNED hits. Fix them, do not edit the baseline.

## Do not
- Do not leave a term unexplained because it was explained in an earlier topic unless TERMS.md says it is introduced there.
- Do not coin synonyms for a registered term (rejection rate, detection rate, hit rate, power for the same thing).
- Do not edit `jargon.json` or TERMS.md without the user's approval (proposing additions is fine).
- Do not use the user's own Q&A wording as page text.

## Done when
Every advanced term at first use has a gloss, registered names are used consistently (legends and headers included), and the shape check shows no new JARGON or BANNED hits.
