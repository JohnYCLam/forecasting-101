---
name: commentary-style-guide
description: Write on-page commentary (guide card, dataset card, reading guides, takeaways) in the same voice as Topics 4 and 5. Use whenever writing or editing any text a reader sees in a Topic component.
disable-model-invocation: true
---

# commentary-style-guide

Voice: Topics 4 and 5. Plain-language, teacher-like, concrete, tied to what is on the chart.
Read `examples/excerpts.md` BEFORE writing. Imitate their shape.

## Paragraph types (each paragraph starts with a bold label then a colon)
Use these labels, adapting the noun:
- **Why X alone fails:** the limitation of the previous model, concrete.
- **What X is:** plain-language definition first, then one equation.
- **What X is forecasting:** target and horizon. State what it does NOT forecast if there is a common confusion.
- **How people use this:** real-world action that follows from the forecast.
- **What this chart shows:** define axes and every plotted series in plain words.
- **Visual reading guide (top: ... / bottom: ...):** what pattern to look for, per panel, in colors and shapes.
- **Shaded zones / dashed lines / markers:** what each visual element means.
- **Step 1 - ... / Step 2 - ...:** numbered procedure when explaining a calculation.
- **Why <surprising result> happens:** causal explanation of anything a viewer may find odd.
- **Out-of-sample <metric>:** numbers from the data, with comparison to baseline.
- **Limitation:** where it breaks or what is assumed.

## Structure of a commentary card
1. 3-5 paragraphs, ordered: limitation -> what it is -> what it forecasts -> use case.
2. For tabs with many ideas use the in-card tab buttons pattern (see `ui-layout-patterns`): "What X is" | "The demo" | "How to read the charts".
3. A dataset card: what the data is, size and period, units, split (train/test), how models were selected.
4. A control-reactive part: text that changes with the control value (interpolate values from data).

## Structure and card roles
- Plan the story first with `commentary-storyboard`: one message per commentary tab, a beat sheet, a guided walk along the controls.
- **Narrative Continuity (The Opening Hook):** Never start a tab or refactored view in isolation. The opening sentence must anchor back to previous topics: *"Sections X.Y assumed [core assumption]. But is that assumption realistic? What happens when it breaks down?"*
- Headings are statements ("Why a fixed window lags"), not conversational questions. Short definitional headings ("What is MAPE?") are fine.
- Never put the user's questions, or Q&A pairs, on the page. Extract the learning point and place it where the reader would wonder.
- Guide card = story. Dataset card = data facts only (what, size, period, units, split, how models were chosen, the generating equation in one line). Do not repeat commentary in the dataset card.
- Words: `plain-language-guard` (reader level, glosses, registered names in `.agents/TERMS.md`).

## Statistical notation & plain-language hygiene
- **Human-readable dates:** Never refer to raw index counts like $N = 84 \to 174$ or $T = 84 \to 175$ in commentary or dataset details. Always write out human calendar spans: *"1980Q1 to 2002Q4"*, *"expanding over 22 years"*.
- **No unannounced math symbols:** Never drop raw notation symbols ($W_t$, $\lambda_i$, $\Omega$) into prose without definition. Use plain terms: *"the CUSUM statistic"*, *"the cumulative error path"*.
- **Theoretical vs. empirical bounds:** State whether a threshold comes from a null distribution, simulation, fitted data, or a heuristic. Verify it for the exact test variant, deterministic specification, normalization, and sample convention; never call a critical value universal merely because it is not fitted from this sample.
- **Visual honesty for alerts:** If a plot merely grazes or touches a threshold (e.g. $+0.951$ vs $+0.948$), label it an *"Early Warning / Borderline Alert"*, not an explosive *"Catastrophic Breach"*. Explain that the model is straining under one-sided errors.

## Machine learning bridges (ML bridge)
- **Concise & targeted:** 3 to 4 lines maximum. Centered in a `var(--primary-bg)` box.
- **Explain the concept directly:** Define the ML term plainly and only make distinctions relevant to this demo.
- **No complex formulas:** Never display dense ML loss/divergence equations ($D_{\text{KL}}$) in the bridge card. Explain what the tool measures in plain words (e.g. *"measures how much recent prediction error distributions shift away from baseline"*).
- **State trade-offs without invented cut-offs:** Explain the actual limitation for this sample and estimator. Do not claim a method needs a fixed number such as "thousands" unless a cited source or experiment establishes it.
- **No future topic teases:** Ban phrases like *"Bridge to Machine Learning (Topics 6–9)"*. Focus strictly on practical time series forecasting.

## Parameter trajectory & sensitivity commentary
- **Predefine comparison criteria:** Before labeling a parameter a surge, break, stable channel, or noise, state the criterion and its source in the concept ledger. Significance against zero, parameter constancy, and economic importance are different questions; one does not prove the others.
- **Compare like with like:** Use an appropriate stability test or uncertainty for the difference between periods. A coefficient's confidence interval around zero does not by itself test whether that coefficient changed over time.
- **No percentage comparisons on near-zero values:** A drop from $0.08$ to $0.03$ is not a "large 60% crash"—it is minor fluctuation around zero. Use absolute shifts ($\Delta \beta$) relative to standard errors.
- **Never say point estimates "break out of their standard error bands":** Point estimates are centered in their bands by definition.
- **Never highlight sample-size band narrowing ($1/\sqrt{N}$) as a domain insight:** Asymptotic tightening as $N$ grows is a basic mathematical property of OLS, not an economic discovery.
- **Cover every UI button:** If there are 4 parameter buttons in the controls panel, the commentary MUST explicitly explain all 4. Never leave buttons unmentioned.
- **Spatial references must match layout:** Check the DOM. Say *"in the controls panel below"*, never *"above"* if the panel is located underneath the cards.

## Length and progressive disclosure
- Paragraph: 1-3 sentences. Card: about 5 paragraphs at most.
- When a tab needs more, do NOT lengthen the main card. Use in-card commentary tabs or a deep-dive `extraCard` (`ui-layout-patterns`).
- Elaborating = better example, clearer label or one more targeted paragraph, not more words. Write new explanations with `concept-explainer`
  (sources, tiny example, misconception, UNVERIFIED flags).

## Tone rules
- Second-person is allowed ("you should see"), but mostly describe the chart ("look for", "notice").
- Define a term the first time it appears, in half a sentence.
- Name colors and line styles ("red dashed", "amber band", "faint lines").
- One idea per paragraph, 1-3 sentences, no walls of text.
- Use "forecast" for the future and "fit" for the training window. Do not mix.
- Explain WHY, not just WHAT.
- Numbers in text come from loaded data via interpolation, rounded sensibly (`toFixed`). Do not type numbers.
- Equations: only the key one per card, centered in a `var(--primary-bg)` box. Use `MathText` (see `math-katex-text`).
- Honest framing: when the model is imperfect, say so and say why.

## Banned
- Empty hype: "powerful", "amazing", "revolutionary", "simply", "obviously", "just".
- Unexplained jargon and acronyms.
- Claims not visible in the demo.
- Paragraphs that restate the title.
- Passive filler: "It can be seen that ...".
- Hardcoded fallback numbers like `?? 76.4` inside text. Show nothing or "n/a" instead.
- Raw sample index ranges like $N = 84 \to 174$ in prose.
- Teasing future topics ("Topics 6–9").
- Charts that combine unrelated questions merely to save space.

## Checklist before finishing
- [ ] Opens with a narrative hook connecting to assumptions in previous topics.
- [ ] Every series on the chart is named in plain words in the text.
- [ ] Every interactive control button is explicitly accounted for in the commentary.
- [ ] Spatial references ("below", "above") match real UI positioning.
- [ ] All dates are human-readable (e.g. 1980Q1 to 2002Q4), no raw observation indices ($N$, $T$).
- [ ] Parameter-shift labels use a predefined, sourced criterion; no deceptive percentages near zero.
- [ ] ML bridges are concise (< 4 lines), formula-free, and explain the sample-size trade-off.
- [ ] At least one "what to look for" paragraph.
- [ ] At least one limitation/assumption sentence.
- [ ] Control changes are reflected in text.
- [ ] No number typed by hand.
- [ ] New terms defined at first use.

## Done when
The checklist passes and the text reads like it belongs next to Topic 4/5 cards.
