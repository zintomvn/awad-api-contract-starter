# Contract reading notes - IA#3

MSSV: 23127351

Full Name: Le Minh Duc

## Predictions before the agent implementation

### 1. **§4.2, Idempotency:**

“Two bodies are _the same_ when they are equal as JSON values: key order and whitespace do not matter, any other difference does.”

I expect a first implementation to compare the raw request body or hash its original text. That would incorrectly reject a retry when the client reorders JSON object keys or changes whitespace.

### 2. **§4.4, Pagination:**

“`nextCursor` is `null` **if and only if** there are no more orders after this page. A client never receives a cursor that leads to an empty page.” I expect the first implementation to return a cursor whenever the page contains exactly `limit` items, even if that page is the last one. It needs to check whether another matching row exists.

Prediction outcomes will be recorded after the first contract run.

## Prediction outcomes after the first agent run

- **Prediction 1, §4.2 — did not come true.** The agent used canonical JSON, recursively sorting object keys while keeping array order. The §4.2 test for JSON-value equality passed in contract-run-1.txt.
- **Prediction 2, §4.4 — did not come true.** The agent queried limit + 1 rows to establish whether a next page exists. The §4.4 nextCursor-null test passed in contract-run-1.txt.

## Reading the first contract run, line by line

The first run (contract-run-1.txt, commit 5c5b48e) had **27 passes, 0 failed assertions, and 2 cancelled tests**. The two cancellations came from a suite setup failure: “npm run migrate failed: undefined” with a null child-process exit status on Windows. A separate environment check showed that Node 24 spawnSync("npm", ...) reported ENOENT on this machine even though npm worked from PowerShell. These results are not evidence that the corresponding API behavior failed.

| Cancelled test | Contract sentence | What the agent did / first-run result | Clarifying wording |
|---|---|---|---|
| §4.2 a retry that lands on the other instance is still a replay | §4.2: “Same key, same body → the stored response: status 201, the identical body, the same Location...” | The agent stored key, canonical JSON fingerprint, response, and Location in SQLite in the same transaction. The test was **cancelled before reaching the API** because setup could not spawn npm on Windows. | “A successful idempotency key must be readable by any service instance using the same database file, and the replay must reproduce the original response.” |
| §4.4 a cursor from one instance works on the other | §4.4: “A cursor is opaque: the client stores it and sends it back unchanged...” and “A cursor stays valid for at least 24 hours.” | The agent encoded snapshot anchor, last seen id, and table filter into the cursor, permitting decoding by another instance without process memory. This test was **cancelled before it could run** for the same Windows setup failure. | “A cursor returned by one instance must remain usable by another instance sharing the same database.” |

**Additional direct verification:** Two HTTP servers with two SQLite connections shared one temporary database. A replay on the other server returned the original 201, identical JSON and Location, and Idempotent-Replayed: true. A cursor issued by server A worked on B; a new order did not shift an existing page; parallel duplicate requests created one order. This manual verification passed. It does not replace the two cancelled rubric tests.

## Agent answer: sentences that could be read two ways

Question asked: **“Which sentences of CONTRACT.md could be read two ways, and what did you choose for each?”**

### A. §1 and §4.2 — Unknown fields and the idempotency fingerprint

- **Reading 1:** Because unknown fields are ignored by the server (§1), ignored properties should also be ignored when comparing two requests.
- **Reading 2:** Because §4.2 says two bodies are the same only when their JSON values are equal and “any other difference” matters, even ignored properties affect idempotency.
- **Choice:** Reading 2. The fingerprint uses the entire parsed JSON value with canonical object-key order. This follows the explicit equality rule and the instruction to check a known key before validating fields.
- **Sentence to add:** “Idempotency compares the full parsed JSON request value, including fields the server otherwise ignores.”

### B. §4.4 — Can a client change limit between pages?

- **Reading 1:** Every query option from the first page, including limit, must stay the same.
- **Reading 2:** Only tableId is explicitly tied to the cursor, so a caller may change limit on a later page.
- **Choice:** Reading 2. The cursor records the snapshot and position; limit controls the number of further records to return.
- **Sentence to add:** “A client may change limit while following a cursor, but must preserve the tableId filter.”

### C. §4.4 — Does omitting tableId mean the same filter?

- **Reading 1:** The cursor remembers tableId, so the client may omit it on later requests.
- **Reading 2:** “Use a cursor with the same tableId it came from” means the client must repeat the same filter, including its absence.
- **Choice:** Reading 2. The implementation compares the cursor tableId to the query and returns 400 validation on a mismatch.
- **Sentence to add:** “When following a cursor, send exactly the same tableId query value as on the first page, or omit it on every page if the first page omitted it.”

### D. §2 and §4.2 — Counting errors under an invalid parent

- **Reading 1:** Report missing nested fields even when items is absent or is not an array.
- **Reading 2:** Report /items once for an invalid container and validate nested fields only when the container permits inspection.
- **Choice:** Reading 2. Speculative child errors would not describe actual order lines; independent fields such as tableId are still checked.
- **Sentence to add:** “If a parent field is missing or has the wrong container type, report that parent once and do not report errors for children that cannot be inspected.”

### E. §5 — Which responses are “legacy responses”?

- **Reading 1:** Every unversioned response, including /health, gets Deprecation and Sunset.
- **Reading 2:** “Legacy” refers to the listed /menu routes and their errors; /health is an operational endpoint.
- **Choice:** Reading 2. The headers attach to legacy menu responses, including errors, while /health remains a standard health response.
- **Sentence to add:** “The legacy sunset headers apply to the unversioned /menu routes and their error responses, but not to /health or /v1.”

## Additional review finding beyond the agent's ambiguity list

### F. §1, §4.1 and §4.3 — Leading zeroes in path ids

- **Reading 1:** The URL segment is a canonical decimal representation; /v1/menu/001 is malformed even when item 1 exists.
- **Reading 2:** The segment represents a positive base-10 integer; 001 and 1 name the same item.
- **Choice:** Reading 2 because the contract constrains the numeric id without forbidding leading zeroes. The implementation was revised after the first run to accept leading zeroes while rejecting zero, non-digits, and unsafe integers (commit ed8c9a3).
- **Sentence to add:** “Path ids consist of decimal digits and may contain leading zeroes; their numeric value must be a positive safe integer.”

## Remaining limits

The two official cross-instance tests could not finish on this Windows configuration; the independent check above supports their intended behavior but is not a replacement for the rubric run on a compatible environment. The exact observable 409 idempotency-key-in-flight timing during a competing write was not separately proved; SQLite serializes the insert and persistent key lookup.