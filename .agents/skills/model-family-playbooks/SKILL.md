---
name: model-family-playbooks
description: Planning and data-generation guidance for the future topics 6-11 (Traditional ML, Prophet, Traditional DL, Transformers, RAG, Foundation models) - environment, leakage-safe protocol, determinism, runtime/JSON budgets, honest comparison, what not to fake. Use when planning or building any topic from 6 to 11.
disable-model-invocation: true
---

# model-family-playbooks

These topics need libraries beyond statsmodels. The package names and approaches below are planning hints from general knowledge; confirm with the user
and by importing the package before relying on them.

## Universal checklist (all families)
1. Environment: check imports first, for example `python -c "import sklearn, lightgbm"`. If a package is missing, ask the user ONCE, then record it in `requirements.txt`.
2. Never fabricate outputs because a package or model could not be installed or downloaded. Stop and ask the user (smaller model, different library, or skip).
3. Evaluation protocol (leakage-safe):
   - chronological split only; walk-forward / expanding-window validation when tuning
   - fit scalers, encoders, feature selection and hyperparameters on TRAIN only
   - features use only the past (`shift(1)` before rolling stats); no future values in any feature
   - say whether multi-step is recursive (feed back predictions) or direct (one model per horizon)
4. Baselines in every demo: seasonal naive and the best classical model from Topics 1-5 (ARIMA/ETS), tuned fairly. Show when the new model does NOT win.
5. Determinism: set all seeds (`np.random.seed`, `random.seed`, `torch.manual_seed`, framework equivalents). Run the generator twice and compare file hashes.
6. Budgets: whole generator runs in minutes on a laptop CPU; each `topicN_data.json` under ~1 MB (round floats, downsample curves, store only what the UI draws).
7. Metadata block in each JSON: `{"model": ..., "library_versions": {...}, "seed": ..., "train_range": ..., "test_range": ...}`. Use it in the dataset card.
8. No model weights, API keys or downloaded datasets committed. The app only ships the JSON.
9. Teaching angle: each new family exists to fix a limitation of the previous one. State it in tab 1 (see `topic-content-planner`).

## Per-family notes
Read `reference.md` in this folder for Topic 6, 7, 8, 9, 10, 11 specifics. Also look in `../references/`: the folders `boost-vs-forest-ts`,
`forecasting-model-comparison`, `varima-vs-arima-analysis` and the notebooks may already contain ideas and data for Topic 6.

## Do not
- Do not copy the Topic 1-5 pattern blindly: statsmodels `.forecast()` does not exist for most of these libraries.
- Do not tune on the test set. Do not report a metric from a different window than the baseline's.
- Do not hide a failure case (for example DL losing to ETS on small data). Showing it is the lesson.

## Done when
The plan or data script lists, for the family: environment check result, protocol, baselines, seeds, JSON size, metadata block.
