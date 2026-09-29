# Data Model

## Worker
```json
{
  "id": "W001",
  "name": "Demo Worker",
  "language": "hi"
}
```

## Attempt
```json
{
  "id": "attempt-...",
  "workerId": "W001",
  "module": "fire_explosion",
  "steps": 3,
  "wrong": 1,
  "score": 67,
  "passed": false,
  "startedMs": 0,
  "completedMs": 0
}
```

## Certificate
```json
{
  "body": "<base64>",
  "sig": "<16 hex>",
  "issuedMs": 0,
  "expiryMs": 0
}
```

## Local state
Key: `sa_v1`

Implemented (Phase 1):
```json
{
  "v": 1,
  "worker": {"id": "JH-1024", "name": "Demo Worker"},
  "attempts": [],
  "certs": [{"body": "<base64>", "sig": "<16 hex>", "issuedMs": 0, "expiryMs": 0, "attemptId": "attempt-...", "workerId": "JH-1024"}],
  "last": {"attemptId": "attempt-..."},
  "inProgress": null,
  "retention": {"demoOffsetMs": 0},
  "settings": {"language": null}
}
```
- `worker` is `null` until the profile is saved. `settings.language` is `null` until a language is chosen; the UI renders Hindi by default.
- `retention.demoOffsetMs` replaces the originally suggested `demoNowMs`. Logical now = device now + offset (see `24_DECISION_LOG.md` D-014).
- `inProgress` holds the resumable scenario session `{module, order, stepIndex, answers, startedMs}`.
- Everything loaded from storage is treated as untrusted and validated field by field. Attempt score/pass values are recomputed. Unparseable JSON resets the state.
- Limits: 200 attempts, 50 certificates.

## Dashboard seed
Eight workers with varied score/failure/date combinations.

## Source of truth
Scenario JSON is authoritative for module prompts/options/correct answers.
