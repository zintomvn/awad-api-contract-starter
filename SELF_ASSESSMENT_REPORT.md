# Self-assessment — IA#3 API contract

Submitted by: **23127351 — Le Minh Duc**
Course: CSC13114, Advanced Web Application Development
Date: 2026-11-12

**Total I claim: 90 / 100**

| Criterion | Max | I claim | Evidence |
|---|---:|---:|---|
| 1. Contract tests pass | 30 | 30 | GitHub Actions on Ubuntu Node.js 22 passed legacy 3/3 and contract 29/29 with 0 failures and 0 cancellations, including both cross-instance tests. The authentic output is in contract-run-final.txt and the workflow evidence is https://github.com/zintomvn/awad-api-contract-starter/actions/runs/43198372757. |
| 2. Rules kept | 10 | 10 | No tracked changes under test/ or in CONTRACT.md. Added matching migrations/002_order_idempotency.up.sql and .down.sql; src/v1.js and src/app.js are the implementation. |
| 3. Predictions before agent ran | 10 | 9 | NOTES.md has two §4.2/§4.4 predictions with reasons and later outcomes; commit 7f22452 precedes first source commit f8b4f68. The initial prediction wording was AI-assisted and disclosed in AI-LOG.md. |
| 4. First run examined line by line | 20 | 16 | contract-run-1.txt first saved in commit 5c5b48e, before source correction ed8c9a3. NOTES.md has one row for each of the two cancelled tests, with the relevant contract sentence, observed setup result, implementation behavior, and proposed wording. |
| 5. Sentences with two readings | 20 | 15 | NOTES.md “Agent answer” entries A–E present two readings, a decision, a reason and an added contract sentence. Entry F is a separate additional review finding. |
| 6. AI-LOG.md | 10 | 10 | AI-LOG.md records the README implementation prompt, named §4.2 and §4.4 diagnostic prompt, correction prompt, and ambiguity prompt. Changed and Rejected cite actual code and verification decisions. |
| **Total** | **100** | **90** | The zip file name uses the same score. |

## What I did not manage

On Windows with Node 24, the two-instance suite setup did not finish because a Node migration subprocess exited with a null status; the exact cause was not established. The first-run log preserves 27 passed and 2 cancelled. The identical source code subsequently passed all 29 official tests on Ubuntu with Node.js 22, as recorded in the final transcript and the linked GitHub Actions run. An earlier independent two-server check also passed replay, cross-instance cursor usage, a stable page snapshot, and duplicate-write prevention. The contract's precise 409 in-flight race timing was not independently demonstrated.

I used AI assistance to draft the initial predictions and implementation. The pre-implementation commit order is genuine, but the assisted note drafting should be considered when evaluating the human-reading aspect of the rubric.

## What I would do differently

I would establish a Linux Node 22 test environment earlier in the assignment so the complete test suite runs before the first diagnosis. I would also verify concurrent in-flight responses under a deliberately held write lock and record the observed 409 behavior.
