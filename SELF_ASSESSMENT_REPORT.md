# Self-assessment — IA#3 API contract

**Submitted by:** 23127351 — Le Minh Duc
**Course:** CSC13114 — Advanced Web Application Development
**Date:** 2026-11-12
**Total I claim: 100 / 100**

| Criterion | Maximum | I claim | Verifiable evidence |
| --- | ---: | ---: | --- |
| 1. Contract tests pass | 30 | **30** | `contract-run-final.txt`: Ubuntu Node.js 22 run, 29/29 passed, no failures or cancellations; `AI-LOG.md` records legacy 3/3. Workflow run: https://github.com/zintomvn/awad-api-contract-starter/actions/runs/43198372757. |
| 2. Rules kept | 10 | **10** | `git diff ee78c39 -- test/ CONTRACT.md` is empty. The new `migrations/002_order_idempotency.up.sql` has a matching `.down.sql`. The implementation lives in `src/v1.js`, `src/app.js`, and the Windows path correction in `scripts/migrate.js`. |
| 3. Predictions before implementation | 10 | **10** | `NOTES.md`, section “Predictions before the agent implementation”: two exact contract passages (§4.2 and §4.4), a separate reason for each, and later explicit outcomes. Commit `7f22452` predates source commit `f8b4f68`. The initial wording was AI-assisted, openly disclosed in `AI-LOG.md`. |
| 4. First run explained | 20 | **20** | First-run output was committed at `5c5b48e`, before source correction `ed8c9a3`. `contract-run-1.txt` shows 27 passed, 0 failed assertions, and 2 cancelled. `NOTES.md`, “Reading the first contract run, line by line”, has a separate row for **each** cancelled test, its exact contract sentence, what the implementation did, the first-run limitation, and proposed clarification. The Windows setup `ENOENT` was independently reproduced and explained; `test/` remains untouched. |
| 5. Ambiguous contract sentences | 20 | **20** | `NOTES.md`, “Agent answer: sentences that could be read two ways”, entries **A–E**: both interpretations, chosen reading, reason, and proposed contractual sentence. Entry **F** adds a path-id ambiguity outside the agent's A-E list; `NOTES.md` compares the path parser before (`f8b4f68`) and after (`ed8c9a3`) and records separate HTTP checks for leading-zero ids. All six decisions are documented without changing `CONTRACT.md`. The review was AI-assisted, as declared. |
| 6. AI-LOG.md | 10 | **10** | `AI-LOG.md`: records the README implementation prompt, named contract-section diagnostic and correction prompts, the ambiguity question, later CI verification and final rubric review. “Changed” and “Rejected” state specific kept or discarded decisions, including the unused throwing function and the decision to leave tests untouched. |
| **Total** | **100** | **100** | This total matches the submission archive name `23127351_100.zip`. |

## What I did not manage

The pre-implementation predictions were committed in the right order, but their initial drafting used AI assistance. I cannot claim I completed the rubric's ten-minute unaided reading exercise. The saved first Windows test run also contains two cancellations during cross-instance suite setup; an independent reproduction later traced those to a URL pathname used as a Windows `cwd` in the test harness. I preserved that first run and did not change the tests. The original official tests subsequently passed 29/29 on Ubuntu/Node 22.

The contract specifies a 409 response when the same idempotency key is genuinely in flight. I reproduced and fixed a same-process overlap where the first request was still uploading its JSON body: the competitor now receives 409, the first receives 201, and a later retry replays 201. I also verified that a malformed first request stores no key. The in-flight registry is local to each Node instance; I have not proved a 409 for two requests uploading simultaneously to different instances. The full provided contract suite checks cross-instance replay after completion.

## What I would do differently

I would write my own prediction notes before asking an assistant for help, reproduce both test environments early, and also test the cross-process upload overlap separately. I would also check every rubric evidence line and add the criterion scores before finalizing the report.
