# AI-LOG.md — IA#3 API contract

Date: 2026-11-12
Tool throughout: ChatGPT (GPT-6 via Codex Native2, working in the local repository).

## 2026-11-12 — Contract prediction draft

Tool: ChatGPT (GPT-6 via Codex Native2).
Asked for: Identify two contract sentences likely to be misunderstood and draft predictions before any source implementation.
Kept: The JSON-value equality prediction (§4.2) and the last-page cursor prediction (§4.4), both recorded in the pre-implementation NOTES.md commit 7f22452.
Changed: The NOTES.md layout and student identification were subsequently revised in the working copy; prediction outcomes were added only after the first run.
Rejected: No prediction was discarded. The initial note wording was AI-assisted; it should not be represented as an unaided ten-minute human reading.

## 2026-11-12 — First implementation of the contract

Tool: ChatGPT (GPT-6 via Codex Native2).
Asked for (README prompt): “Implement the /v1 API in src/v1.js exactly as CONTRACT.md specifies, and the headers its section 5 requires on the legacy API in src/app.js. Put any new table in a new migration with a down. Do not read or edit anything under test/, and do not edit CONTRACT.md. Run npm test when you are done; it must stay green.”
Kept: RFC 9457 problem responses, ordered validation, canonical JSON idempotency, SQLite transaction and persisted replay, order-price snapshots, stable cursor pagination, and the legacy Deprecation/Sunset/Link headers. Initial implementation: f8b4f68.
Changed: After the saved first run, accepted leading zeroes on numeric URL ids and removed unreachable code (ed8c9a3). This came from a contract ambiguity review, not a copied test body.
Rejected: The first draft's unused placeOrder function, which threw an error but was never called. Keeping dead throwing code would mislead a maintainer.

## 2026-11-12 — First-run diagnosis using test names and contract sections

Tool: ChatGPT (GPT-6 via Codex Native2).
Asked for (fix/diagnosis prompt): “Investigate ‘§4.2 a retry that lands on the other instance is still a replay’ using CONTRACT.md §4.2 and ‘§4.4 a cursor from one instance works on the other’ using CONTRACT.md §4.4. Use only those test names and contract sections, without reading or editing test code.”
Kept: The shared-database key record and self-contained cursor; a direct two-server HTTP check passed for both behaviors and concurrent duplicates.
Changed: Diagnosed two cancelled tests as a Windows child-process setup issue (the suite's Node migration subprocess had a null exit status), not a proven API assertion failure. A separate npm spawn check returned ENOENT but did not establish the suite's precise cause. The authentic first-run output was committed at 5c5b48e and its encoding converted to UTF-8 at f6ba33c, without rerunning it.
Rejected: Any change to test/ or CONTRACT.md to hide the environment failure. A runtime diagnostic instrumentation attempt was blocked by the local execution policy and was not used.

## 2026-11-12 — Post-run review and implementation correction

Tool: ChatGPT (GPT-6 via Codex Native2).
Asked for (review prompt): “Re-check §1, §4.1, and §4.3 for valid path-id representations, and remove the unused placeholder in src/v1.js. Keep legacy tests passing.”
Kept: Decimal positive-integer parsing and the unchanged API structure.
Changed: Accepted /v1/menu/001 as item 1, while still rejecting zero and nonnumeric ids, because the contract does not specify canonical path formatting; documented the choice in NOTES.md.
Rejected: Treating a noncanonical-looking but positive decimal id as an automatic 404 without an explicit contract rule.

## 2026-11-12 — Ambiguity review and evidence report

Tool: ChatGPT (GPT-6 via Codex Native2).
Asked for: “Which sentences of CONTRACT.md could be read two ways, and what did you choose for each?” Also asked for NOTES.md explanations, AI-LOG.md, and SELF_ASSESSMENT_REPORT.md using the supplied rubric and formats.
Kept: Five agent-identified ambiguity decisions and the additional leading-zero review point, with proposed clarification sentences in NOTES.md.
Changed: Distinguished the two cancelled cross-instance tests from failed API assertions; scored the submission using actual test outcomes and commit evidence.
Rejected: Claiming 29/29 before it had been verified, or suppressing the real Windows setup limitation. The pre-CI transcript recorded 27 passed, 0 failed, and 2 cancelled.

## 2026-11-12 — CI rerun and final contract evidence

Tool: ChatGPT (GPT-6 via Codex Native2, with GitHub Actions job-log access).
Asked for: Rerun the contract tests, fix remaining contract problems if found, and update the student GitHub repository.
Kept: The existing /v1 implementation and the unchanged test/ and CONTRACT.md files. The Ubuntu Node 22 workflow passed the legacy suite (3/3) and the full contract suite (29/29), including the two cross-instance cases.
Changed: Saved the successful CI contract output to contract-run-final.txt with the job URL and tested commit identified; updated NOTES.md and SELF_ASSESSMENT_REPORT.md using the new evidence. No source-code correction was necessary.
Rejected: Introducing a code change merely to address the Windows test-launch anomaly or presenting CI output as a local Windows test run.

## 2026-11-12 — Rubric review, reproducibility check, and packaging

Tool: ChatGPT (GPT-6 via Codex Native2).
Asked for: Check the current submission against the IA#3 rubric, improve the evidence and self-assessment, reproduce the remaining Windows cancellation, and prepare a complete zip including Git history.
Kept: The original `contract-run-1.txt`, the successful Ubuntu Node.js 22 `contract-run-final.txt`, the existing /v1 code and migrations, and the original commit sequence.
Changed: Re-ran migration, seeding, legacy and contract scripts on Windows (legacy 3/3; contract 27 passed, 0 assertions failed, 2 cancelled), then independently reproduced the suite's `spawnSync` failure. Its `new URL('..', import.meta.url).pathname` produces a non-native Windows `cwd` (`/D:/...` with URL-escaped spaces), yielding `ENOENT` and a null process status. Documented the confirmed setup cause in `NOTES.md` and revised the rubric score with specific evidence.
Rejected: Modifying the forbidden `test/` path to fix the Windows-only suite setup or overwriting the authentic first-run and Linux-final transcripts with a known incomplete Windows rerun. Did not claim that the historical predictions were independently drafted without AI.

No test files or CONTRACT.md were edited, and no new dependency was added.
