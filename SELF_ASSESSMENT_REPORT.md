# Self-assessment — IA#3 API contract

Submitted by: **23127351 — Le Minh Duc**
Course: CSC13114, Advanced Web Application Development
Date: 2026-11-12

**Total I claim: 88 / 100**

| Criterion | Max | I claim | Evidence |
|---|---:|---:|---|
| 1. Contract tests pass | 30 | 28 | contract-run-final.txt: legacy 3/3, contract 27/29 with 0 failed assertions and 2 cancelled suite tests caused by Windows npm child-process startup. NOTES.md, “Reading the first contract run,” records separate two-instance verification. |
| 2. Rules kept | 10 | 10 | No tracked changes under test/ or in CONTRACT.md. Added matching migrations/002_order_idempotency.up.sql and .down.sql; src/v1.js and src/app.js are the implementation. |
| 3. Predictions before agent ran | 10 | 9 | NOTES.md has two §4.2/§4.4 predictions with reasons and later outcomes; commit 7f22452 precedes first source commit f8b4f68. The initial prediction wording was AI-assisted and disclosed in AI-LOG.md. |
| 4. First run examined line by line | 20 | 16 | contract-run-1.txt first saved in commit 5c5b48e, before source correction ed8c9a3. NOTES.md has one row for each of the two cancelled tests, with the relevant contract sentence, observed setup result, implementation behavior, and proposed wording. |
| 5. Sentences with two readings | 20 | 15 | NOTES.md “Agent answer” entries A–E present two readings, a decision, a reason and an added contract sentence. Entry F is a separate additional review finding. |
| 6. AI-LOG.md | 10 | 10 | AI-LOG.md records the README implementation prompt, named §4.2 and §4.4 diagnostic prompt, correction prompt, and ambiguity prompt. Changed and Rejected cite actual code and verification decisions. |
| **Total** | **100** | **88** | The zip file name uses the same score. |

## What I did not manage

The Windows machine running Node 24 could not execute the official test suite's two-instance setup, because its child process failed to start npm. The saved final transcript consequently shows 27 passed and 2 cancelled, so I do not claim a verified 29/29 official run. An independent direct test of two HTTP servers sharing one SQLite database passed replay, cross-instance cursor usage, a stable page snapshot, and duplicate-write prevention. The contract's precise 409 in-flight race timing was not independently demonstrated.

I used AI assistance to draft the initial predictions and implementation. The pre-implementation commit order is genuine, but the assisted note drafting should be considered when evaluating the human-reading aspect of the rubric.

## What I would do differently

I would rerun the unmodified contract suite on a supported Linux Node 22.13+ environment before submission so the two-instance setup can be judged by the same test harness as the rest of the API. I would also verify concurrent in-flight responses under a deliberately held write lock and record the observed 409 behavior.
