# Contract reading notes — IA#3

## Predictions before the agent implementation

1. **§4.2, Idempotency:** “Two bodies are *the same* when they are equal as JSON values: key order and whitespace do not matter, any other difference does.” I expect a first implementation to compare the raw request body or hash its original text. That would incorrectly reject a retry when the client reorders JSON object keys or changes whitespace.
2. **§4.4, Pagination:** “`nextCursor` is `null` **if and only if** there are no more orders after this page. A client never receives a cursor that leads to an empty page.” I expect the first implementation to return a cursor whenever the page contains exactly `limit` items, even if that page is the last one. It needs to check whether another matching row exists.

Prediction outcomes will be recorded after the first contract run.
