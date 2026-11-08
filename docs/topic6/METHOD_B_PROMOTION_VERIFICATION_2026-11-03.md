# Verification report — Method B promotion, 2026-11-03

Files changed:
- `src/Topic6Intro.jsx`: reviewed Method B introduction, with three guide views in each of 6.1 and 6.2.
- `src/Topic6.jsx`: use that introduction, renumber later destinations to 6.3–6.7, and preserve the reviewed responsive layout fixes.
- `src/App.jsx`: seven Topic 6 sidebar destinations.
- `scripts/generators/generate_topic6_data.py` and `public/topic6_data.json`: reviewed fitted evidence, linked examples, contributions and feature comparisons.
- `README.md` and `SECTION_6_INTRO_SPLIT_EXPERIMENT_B.md`: section summary and original experiment note, with a dated promotion addendum.
- `topic_6_ml_story_a4881878.plan.md`: dated changelog for the selected implementation.
- This file: transfer and verification evidence.

Acceptance evidence:
- All seven transferred files matched the reviewed Method B hashes before transfer. All affected original files matched the experiment baseline, so no intervening edits were overwritten. Existing versions were backed up at `experiments/section6_methods_2026-11-03/promotion/20261103T042428Z/before/` in the workspace parent.
- Unrelated baseline files were verified unchanged during transfer. Independently compared JSON metadata/tab2–tab6 remain equal to the baseline. Existing unrelated working changes and both experiment artifacts are preserved.
- The previously recorded Method B deterministic-generation, source-row and fitted-contribution checks are reused: generator and payload were copied byte-for-byte from that reviewed artifact. No new model/data experiment was performed.
- Actual Google Chrome checks on the main production preview cover six guide views, 24 light/dark desktop/400px screenshots, six historical row states, three prediction traces, four input choices, invalid-diagnostic visibility, zoom/pan and later navigation. Zero document horizontal overflow; all 11 unit tests pass. Desktop dark feature and mobile light training screenshots were visually inspected.
- Browser evidence is under `experiments/section6_methods_2026-11-03/promotion/browser_main/`. The console records one pre-existing local-preview 404 for `/_vercel/insights/script.js`, confirmed by `network_report.json`; the existing Vercel Analytics integration requests a hosting endpoint unavailable in this local preview. This was not changed as part of selecting Method B. No JavaScript page exception was observed. The visual functionality checks pass, but the strict zero-console-error gate has this recorded exception.

Commands:
- `npm run lint`: PASS, existing warnings retained.
- `npm test`: PASS, 11/11 tests and shared chart architecture check.
- `npm run build`: PASS, existing bundle-size warning retained.
- `validate_forecast.py public/topic6_data.json --max-kb 1024 --require-keys metadata,tab1,tab2,tab3,tab4,tab5,tab6`: PASS. An initial invocation used the wrong argument format; the corrected invocation above passed.
- `check-commentary-numbers.mjs`: PASS, 0 new heuristic hits.
- `check-commentary-shape.mjs`: PASS, 0 new heuristic hits.
- Instruction/reference review: PASS; reused the experiment's approved brief, storyboard and data evidence. No new substantive teaching design was introduced.

Plan items completed: promote selected Method B source/evidence; preserve other changes; verify main application; document the transfer.

Deviations from plan: production preview used for Chrome verification. Strict zero-console-error requirement has the pre-existing local analytics endpoint exception above. No new dependency explanation or other content improvements were added; those await the user's next comments.

Open questions: none blocking this transfer.

Main-app review preview: http://127.0.0.1:5185/ . Choose **6. Traditional ML**, then **6.1** or **6.2**. The production preview is retained for the user's requested follow-up review; no new development server was started.
