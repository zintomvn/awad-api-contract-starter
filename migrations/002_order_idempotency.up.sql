-- Persist successful idempotent order responses across requests and processes.
-- Entries remain available indefinitely (therefore at least 24 hours).
CREATE TABLE order_idempotency (
  key           TEXT PRIMARY KEY,
  fingerprint   TEXT NOT NULL,
  response_json TEXT NOT NULL,
  location      TEXT NOT NULL
);
