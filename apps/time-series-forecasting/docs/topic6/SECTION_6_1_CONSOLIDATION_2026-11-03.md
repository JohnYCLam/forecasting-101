# Approved four-tab introduction — 2026-11-03

The user approved consolidating 6.1 and 6.2 after reviewing the four-tab sequence in chat. This supersedes the split introduction for the main app; experimental snapshots remain untouched.

| Tab | Message | Visible evidence |
|---|---|---|
| Start with linear regression | Learn an intercept and weighted inputs from past input/answer pairs | One defined equation, no day selector or prediction cards |
| Build training examples | Explicit inputs connect observations to learned predictions | Complete raw records including source history, every transformed input plus target, fitted weights and signed contributions |
| Forecast without future information | Forecast rows exclude unavailable future answers | Complete aligned valid/invalid input records, fixed-origin explanation, future-informed diagnostic outside valid rankings |
| Features and a strong baseline | Features supply forecast shape; accuracy must be checked against repeat-last-week | Four cumulative OLS fits, source-date mapping for the weekly baseline, same holdout MAE/RMSE and forecast chart |

Concept ledger: ordinary linear regression minimizes squared training errors; one model per feature set pools origins/horizons and emits a scalar per row. Same cutoff (2019-09-30), 30 horizons, historical rows, source and feature definitions. Fit preprocessing on training only; all training labels end by the fit cutoff. Repeated targets are dependent tasks, not independent daily evidence. No Ridge lesson in the introduction; later model comparisons retain their actual Ridge results.

Expected results, before fitting: full OLS matches the already computed 1,692.69 MW MAE / 3,338.05 MW RMSE; repeat-last-week remains 1,870.53 / 2,941.57. Smaller additive representations lack explicit seven-day timing, while weekday features add weekly shape. More features need not improve both metrics. The fitted future-answer diagnostic should nearly copy the supplied answers, explicitly an invalid condition.

Falsifiers: source rows/targets or contributions disagree; any future actual enters a purported valid input; mixed model types hidden under one label; nearly flat paths described as universally noncyclic; universal superiority inferred from one window; legacy section outputs change. Keep honest results if an expected feature gain is absent. Both baseline and learned model can miss October 3; no counterfactual holiday effect is claimed.

Tasks: (1) generate/verify full OLS evidence and source mapping; (2) implement four coherent guide/views; (3) return later navigation to 6.2–6.6 with one-pass renumbering; (4) run data/code/commentary and Chrome checks and record actual results. Existing tab2–tab6 outputs must remain equal.

## Outcome

All four tasks are complete. The expected mixed MAE/RMSE result is reproduced by the new ordinary-regression fits. Full records, original-unit weights and contributions, aligned valid/invalid input conditions and weekly source mapping are available in the main demo. Later stored experiments are unchanged. See `SECTION_6_1_CONSOLIDATION_VERIFICATION_2026-11-03.md` for measured checks, Chrome observations and the retained local analytics exception.
