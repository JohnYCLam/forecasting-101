# Term register (one name per concept; edit only with the user's approval)

Use these names in commentary, chart legends, table headers and control labels. `plain-language-guard` enforces them.

| Concept | Use this name | Plain gloss (first use) | Do NOT use | Introduced in |
|---|---|---|---|---|
| % of simulated datasets where the Granger test rejects H0 | Granger rejection rate | how often the test says "Y2 helps predict Y1" | Detection Rate, Granger Detection Rate, hit rate | 5.4 |
| Rejection rate when the true effect is zero | false-alarm rate | how often the test finds an effect that is not there | Type I error, size | 5.4 |
| How small an effect the test can notice | sensitivity of the test | how small a true effect the test can pick up | statistical power, detection power (only if glossed and the user approves) | 5.4 |
| Median F crosses the 5% critical line | the crossing point | the b where a typical dataset first gives convincing evidence | Median Detection Threshold | 5.4 |
| Share of datasets where adding Y2's past gives lower forecast error on new data | forecast improves on new data | the share of datasets where using Y2 forecasts better | Holdout: unrestricted wins, unrestricted wins | 5.4 |
| Model with Y2's past / without | model with Y2 / model without Y2 | the equation that uses Y2's past / only Y1's own past | unrestricted / restricted (unless showing the F formula, then gloss once) | 5.4 |
| H0 | "no effect" assumption (H0) | the assumption the test tries to reject | null hypothesis (gloss once if used) | 5.4 |
| Critical F value | the 5% cut-off | the value the F statistic must beat to reject | F_crit typed as a number (read it from the data) | 5.4 |
| Cross-lag coefficient | b (or a12) | how strongly the past of Y2 feeds into Y1 | cross-effect parameter | 5.1-5.4 |

## Decisions made by the user (do not revert)
- 2026-10-18: Do not call it "Granger Detection Rate" (confusing). Say "Granger rejection rate" or "% of datasets where Granger rejects H0".
- 2026-10-18: Explain the "sensitivity of the test" in plain words (how small an effect it can notice) and show why more data (larger T) shifts the crossing point.

## Adding a term
Propose a row (concept, name, gloss, where first introduced). The user approves. Then use it everywhere.
