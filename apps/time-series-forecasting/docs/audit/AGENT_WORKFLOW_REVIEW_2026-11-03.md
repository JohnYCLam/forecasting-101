# Agent workflow review — 2026-11-03

## Finding

The repository contains concrete sources of execution overhead and inconsistent instructions. They are fixable independently of model capability. No Gemini execution trace, exact model configuration or controlled comparison was available, so this review does not establish how much time the changes save or whether a particular Gemini model meets the teaching-quality bar.

The workspace-root `.agents` is a junction to the app's `.agents`; these are not two divergent copies. The root Cursor orchestration rule delegates through an Antigravity bridge when available. That bridge is not available in this session. Gemini CLI documentation was consulted for general guidance only; this review does not establish which skills/instructions the Antigravity host actually injects. Inspect an actual run's loaded context before attributing latency to automatic loading.

## Concrete repairs

| Problem observed | Repair |
|---|---|
| Guardrail put storyboard after UI; evidence-first workflow required it before UI | Storyboard precedes UI; reuse an approved design if evidence still supports it |
| Approved updates could restart advice/planning and receive another approval request | Approved briefs route to implementation; ask again only for substantive scope/design changes |
| Feedback -> implementation -> final checks, followed by feedback's own final checks | One owner for final verification; reuse its report across callers |
| Every task had to be one file and one command | One bounded, observable outcome; tightly coupled files can be grouped |
| A grep/compile/schema pass could satisfy a nominal Verify line without demonstrating the lesson | Separate acceptance behavior from mechanical checks; require evidence appropriate to the claim |
| Explainability required every criterion, including irrelevant ones, and exhaustive reporting | Apply criteria to changed views; justify N/A and report outcomes/failures rather than unchanged checklist rows |
| Previous passing output could not be reused in a later turn | Reuse observed evidence until relevant inputs change; summaries alone do not count as observed output |
| Documentation/instruction changes could trigger application checks | Review instruction diffs/references and metadata; skip unrelated app builds, generators and browser work |

Forecast provenance, chronological evaluation, honest empirical results, shared chart shells, check baselines and relevant browser verification remain required. No application implementation, data, dependencies, runtime model configuration or delegation preference was changed by this task.

## More useful handoffs

Use the existing `/implement-plan` workflow with a short execution brief. Keep detailed specialist references available on demand; do not copy the entire skill collection into each prompt.

```text
Implement the approved design at <path and section>.
Outcome: <one thing a first-time reader should understand or do>.
Scope: <specific files/functions/views>; defer <explicit non-goals>.
Accept: <observable result, invariant and important limitation>.
Evidence: <data/model source, appropriate checks and browser actions>.
Authorization: <the user instruction or approved design to execute>.
Use /implement-plan. Reuse the design; do not create another plan.
Report changed behavior, observed evidence and remaining limitations.
```

For this course, examples of meaningful acceptance include:

- A selected raw observation can be traced into its transformed input; the row's target comes from the stated later date.
- Switching horizon changes target date/calendar but does not introduce observations after the forecast origin.
- The invalid leakage diagnostic visibly identifies the unavailable future input; it is excluded from valid-model rankings.
- Added feature groups are isolated so the commentary does not attribute a bundled improvement to one group.
- A reader sees and can interpret a mixed MAE/RMSE result; the text does not declare a universal winner.

Give the implementer one short nearby exemplar of the desired voice and one concrete example of an unacceptable result. Do not require it to reproduce an anticipated winner. For section 6's proposed split, consolidate the latest agreed two-section design first: the current task file still contains a four-tab 6.1 plan, and existing navigation/ledger still have the original six sections. Passing all of those documents together without identifying the current decision would create another conflicting handoff.

## Measure before blaming the model

Use a few representative tasks: a commentary restructure, an origin/horizon data change, and a control/chart change. Compare the current workflow against the revised workflow on isolated copies of the same starting state, using the same Gemini version/settings and equivalent tools. For a cleaner comparison, keep prior review findings out of the implementer's context. Repeat runs when feasible; one outcome is weak evidence.

Record elapsed time, tokens where available, user interruptions, repeated checks and first-pass review defects. Review the artifacts with the same criteria in both conditions: statistical correctness, visible demo evidence, narrative sequence and scope compliance. If possible, review without knowing which workflow produced the result.

Interpretation: fewer repeated commands demonstrates reduced overhead; it does not by itself demonstrate better teaching. If the simpler, concrete brief still produces recurring conceptual mistakes, compare models on the same tasks or restrict the implementer to well-specified coding while a reviewer owns statistical and narrative decisions. No instruction set guarantees that the implementer can make judgments it repeatedly fails to make.

## Validation of this repair

- Documentation/instruction changes only; application suites and browser checks are not applicable to these edits.
- Diff whitespace check and local workflow/reference review performed.
- Standard skill metadata validator was attempted but could not run because its Python environment lacks PyYAML. Do not claim a validator PASS. No dependency was installed for this documentation repair.
- Behavioral improvement remains unmeasured: no Gemini execution capability is connected in this session.

## Sources

- Repository rules, workflows and skills under `.agents/`, and the root `.cursor/rules/antigravity-orchestration.mdc`.
- Google prompting guidance: https://ai.google.dev/gemini-api/docs/prompting-strategies
- Gemini CLI on-demand skills: https://geminicli.com/docs/cli/skills/
