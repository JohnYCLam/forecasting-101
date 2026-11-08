# Section 6 introduction split — experiment B, 2026-11-03

The experiment's shared `COMMON_BRIEF.md` supersedes the old four-tab 6.1 storyboard for this isolated copy. No other method's implementation was inspected or copied.

6.1: Why ML -> Build training examples -> Learn the relationship. 6.2: Issue a forecast -> Respect the information cutoff -> Features shape the forecast. Existing later sections are renumbered to 6.3-6.7, with unchanged stored model results.

The fitted example remains German daily load at the 2019-09-30 cutoff, horizons 1-30, Ridge alpha=10, and the original sampled training origins. LinearRegression is fitted on the same standardized full-feature rows. A calendar-only cumulative Ridge tier separates calendar effects from observed renewables. Commentary preserves the full-feature versus seasonal-naive MAE/RMSE disagreement and the absence of a holiday flag.

The generator adds `tab1.intro_evidence` (linked examples, regression comparison, per-horizon contribution traces, exact input columns, sampled/label spans and availability/units facts), plus calendar and invalid-future-input series in the existing timeline. Two focused generations were equal, all contribution reconstructions were checked, and metadata/tab2-tab6 were preserved.

See the method root's `IMPLEMENTATION_REPORT.md` for commands, provisional scoring and the unperformed browser check. This note does not imply the historical evidence report or ledger's old section numbering describes the new UI.

## Main application promotion — 2026-11-03

The user selected Method B for the main demo. Its reviewed application files and generated payload were copied into the main app after confirming that the affected originals still matched the experiment baseline. Existing originals were backed up under the experiment's `promotion/20261103T042428Z/before/` directory. Unrelated working changes were preserved.

The earlier browser limitation above is historical: Method B subsequently completed its Chrome review, and the promoted main app has its own verification report in `METHOD_B_PROMOTION_VERIFICATION_2026-11-03.md`. The experimental A and B snapshots remain separate comparison artifacts. Follow-up teaching improvements will be made from the user's next comments.

## Subsequent main-app revision — 2026-11-03

After reviewing the promoted version, the user approved consolidating the introduction into four tabs within 6.1 and using ordinary linear regression throughout it. This split-version note is historical. The current design and verification are recorded in `SECTION_6_1_CONSOLIDATION_2026-11-03.md` and `SECTION_6_1_CONSOLIDATION_VERIFICATION_2026-11-03.md`; the original experiment copies remain unchanged.
