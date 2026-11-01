# Topic N: <Title> — <subtitle>

## Bridge from previous topic
<One or two sentences: what Topic N-1 could not do, so this topic is needed.>

## Narrative Contract
Every tab follows this sequence:
1. Background / limitation
2. What the model is
3. What it forecasts
4. Real-world use case
5. Guided demo (what to look for)

Progressive disclosure: commentary reacts to the active control (view, slider, step).

## Data plan
- Script: `scripts/generators/generate_topicN_data.py`; output `public/topicN_data.json`
- Functions: `gen_tab1`, `gen_tab2`, ...
- Models fitted (library calls): <e.g. statsmodels ARIMA, VAR>
- Seed: 42
- Datasets and why they show the effect: <...>

---

## Tab N.1 — <Title>
**Goal:** <one sentence>
**Key claim:** <one sentence the viewer should be able to repeat>

- Background / limitation: <...>
- What the model is (plain language, then one equation): <...>
- What it forecasts: <target, horizon>
- Real-world use case: <...>
- Dataset: <name, size, why it contains the effect>
- Controls: <name, options, DEFAULT (default must already show the key effect)>
- Demo flow (views/steps):
  - Step 1: <...>
  - Step 2: <...>
  - Step 3: <...>
- Baseline compared: <simple model>
- Expected result (stated before building): <what the viewer should see, with rough magnitude>
- Commentary changes per control state: <list>
- Limitations to state: <...>
- Notebook source: <file, cell>
- JSON keys needed: <...>

## Tab N.2 — ...
(repeat the block)

---

## Risks
- <What if the honest result is weak or surprising?> -> <plan: more informative training data / different model / show honest gap>

## Out of scope
- <...>

## Changelog
- <YYYY-MM-DD>: initial plan
