# Verification report — consolidated 6.1, 2026-11-03

Files changed:
- `src/Topic6Intro.jsx`: four approved guide/view pairs; remove first-tab controls/prediction cards and Ridge lesson; display complete records, weights, aligned valid/invalid inputs and two connected baseline messages.
- `scripts/generators/topic6_linear_intro.py`: genuine fitted ordinary regressions for four feature sets; same legitimate inputs plus one future-answer column for the deliberately invalid fit; original-unit weights, signed contributions, complete source records and weekly baseline source mapping.
- `scripts/generators/generate_topic6_data.py`: call the focused evidence helper from canonical gen_tab1; retain legacy evidence for compatibility and later independent comparisons.
- `scripts/generators/regenerate_topic6_intro.py`: regenerate/check tab1 only, with deterministic reruns, source/contribution checks and strict JSON serialization.
- `public/topic6_data.json`: regenerate tab1; metadata/tab2–tab6 remain equal to the reviewed pre-change payload.
- `src/Topic6.jsx`, `src/App.jsx`: one introduction route and later sections 6.2–6.6, with matching cross-references. Route renumbering used a single replacement pass.
- `README.md`, the topic plan changelog and `SECTION_6_1_CONSOLIDATION_2026-11-03.md`: current sequence and approved expected results. This report records verification.

Acceptance evidence:
- Full-set OLS MAE/RMSE = 1,692.688414 / 3,338.047396 MW, matching the earlier same-row OLS comparison (1,692.69 / 3,338.05 after rounding). Weekly baseline = 1,870.533333 / 2,941.566600 MW. The lower-MAE/higher-RMSE result is preserved rather than forcing an overall winner.
- Four feature-set OLS MAEs = 5,508.176329, 5,486.164107, 2,179.265374, 1,692.688414 MW. The target-weekday representation supplies the observed weekly shape. The claim explicitly concerns the current shared additive representation, not all lag models.
- Each weight comes from the trained pipeline and is converted back from training-standardized units. Intercept plus the 16 contributions reconstructs all exported example/forecast predictions within 1e-6 MW before display rounding. Weight×input reconstructions, latest source values, training targets and baseline source-date mappings are checked by the focused script.
- The invalid ordinary regression receives the same 16 legitimate inputs plus actual future target load; its MAE rounds to 0.00 MW because it is supplied the answer. It is visibly invalid and excluded from model rankings. Valid input lists exclude that column. All training labels end by 2019-09-30; valid evaluation targets begin 2019-10-01; training-only preprocessing is unchanged.
- Source records contain missing, unused prices in some historical rows. An initial validator caught NaN serialization; the generator now exports null and the UI shows n/a. No price values were imputed or used for prediction. Strict JSON serialization rejects nonfinite values.
- The complete training record has 16 inputs plus a separate answer, with all raw source fields and expandable 28-day history. Chrome exercised two origins × three horizons, confirmed fixed learned weights, and checked all three forecast-record horizons. The valid/invalid records agree on all legitimate inputs and differ on the unavailable extra column.
- Google Chrome captured all four views in light/dark at 1440/400px (16 screenshots plus two mobile chart crops). No document overflow or JavaScript page exceptions; all four feature choices, diagnostic toggle, baseline mapping, zoom/pan and six sidebar destinations exercised. First-tab selectors are absent. Guide lengths are 157, 184, 197 and 224 words in the captured default states. Desktop full training records and final dark mobile chart were visually inspected; legend/zoom spacing was corrected and rechecked.
- Browser evidence: `experiments/section6_methods_2026-11-03/promotion/consolidated_browser/` under the workspace parent. The existing local-preview request to `/_vercel/insights/script.js` still returns 404; no lesson/data requests failed. The strict zero-console-error gate therefore retains this known local analytics exception. The integration is outside this change's scope.

Commands:
- `npm run lint`: PASS, pre-existing warnings retained; no new Topic 6 warning.
- `npm test`: PASS, 11 unit tests and shared-chart architecture check. Reused after final prose/legend adjustments because shared test inputs were unchanged; final build/chart and browser checks cover the adjusted UI.
- `npm run build`: PASS after final UI adjustment, existing bundle-size warning retained.
- `validate_forecast.py public/topic6_data.json --max-kb 1024 --require-keys tab1.linear_intro,tab2,tab3,tab4,tab5,tab6`: PASS after correcting unused-price null serialization. Payload is approximately 305 KB.
- `check-commentary-numbers.mjs`: PASS, zero new heuristic hits.
- `check-commentary-shape.mjs`: PASS, zero new heuristic hits; rendered guide lengths additionally checked in Chrome.
- `regenerate_topic6_intro.py --check`: PASS; two canonical generations agree and match saved tab1. Numeric/source/contribution and cutoff assertions pass.
- Instruction/reference review: PASS, approved four-tab storyboard and data expectations; OLS objective follows sklearn LinearRegression, and the baseline follows the seasonal-naive repeat-last-season rule. No new synthetic mechanism, seed, hyperparameter search or holdout selection.
- `git diff --check`: pre-existing trailing whitespace remains in legacy generator lines inherited from Method B; no unrelated cleanup was applied. Removing this revision's helper import/call reproduces the earlier generator text exactly. Newly added component/helper files have no nonempty trailing-whitespace lines.

Plan items completed: 1–4 in `SECTION_6_1_CONSOLIDATION_2026-11-03.md`.

Deviations from plan: no substantive changes. Complete records are displayed one field per table row for readability, retaining every input. Missing raw prices are displayed as n/a. Legacy Ridge payloads remain internal for compatibility; the four-tab introduction uses only the new ordinary-regression evidence. Existing local analytics console exception is recorded above.

Open questions: none blocking the approved update. A single forecast window supports the displayed comparison, not universal superiority or a causal holiday explanation.

Review preview: http://127.0.0.1:5185/ → 6. Traditional ML → 6.1. The existing main production preview remains available for the user's follow-up review. Experimental A/B snapshots were not changed.

## Subsequent tab 4 simplification — 2026-11-03

At the user's request, removed the seasonal-naive source-date mapping, expandable original-week table and their explanatory heading/paragraph. A short commentary paragraph now explains that every future weekday copies the latest observed value for that weekday, reusing the same known week throughout the forecast. The forecast chart, feature controls, MAE/RMSE table and miss comparison remain.

Verification: lint, build and both commentary checks PASS (existing warnings retained). A targeted Chrome pass checks both removed tables are absent, the commentary rule is present, all four feature choices retain their chart/error table, and light/dark desktop/400px layouts have no document overflow or JavaScript page exception. Four screenshots and observations are in `experiments/section6_methods_2026-11-03/promotion/tab4_simplified/`. No data or shared chart/test inputs changed; previous model/data and 11 unit-test evidence is reused. The pre-existing local analytics endpoint exception remains as previously documented.
