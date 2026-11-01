---
description: Process the user's questions, doubts, recommendations, updates or confusion about existing content. Evidence-based answers, approval gate for substantive changes.
---

# /content-feedback <paste notes, or reference a topic/subtab>

1. Read `.agents/rules/00-project-map.md`, `.agents/rules/10-guardrails.md`, `.agents/LESSONS.md`.
2. Identify the topic/subtab concerned. Read its plan (`docs/archive/topicN/` or `docs/topicN/`), `src/TopicN.jsx` section, and `scripts/generators/generate_topicN_data.py` function.
3. Read `evidence-first-demo-design` and `content-feedback-handler`. Load specialist skills only for the branch that needs them:
   wording/story -> `commentary-storyboard` and `commentary-style-guide`; data/model claim -> `demo-correctness-review`; final page audit -> `demo-explainability`.
4. Classify and number the items. Show the list.
5. Answer questions and doubts from evidence only. Make no edits while answering.
6. Assess recommendations honestly (agree or disagree with reasons).
7. Apply an explicitly requested scoped update without asking again. For an unsolicited recommendation or a substantive design the user has not specified,
   present the concept ledger/impact list and STOP for approval.
8. After approval, run `/implement-plan` on a short task list, then the follow-through checklist and `/ship-check`.
9. Use the reply format from the skill.
