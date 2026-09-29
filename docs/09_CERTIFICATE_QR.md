# Certificate and QR Specification

## Pass condition
Score >=70.

## Body
```json
{
  "name": "...",
  "module": "...",
  "score": 100,
  "issuedMs": 0,
  "expiryMs": 0
}
```

## Encoding
`body = base64(JSON)`

## Signature
`sig = first16hex(HMAC_SHA256(DEMO_SECRET, body))`

## QR payload
```text
body=<base64>&sig=<signature>
```

## Verification
- parse payload;
- decode body;
- recompute HMAC;
- compare signature;
- check expiry;
- return VALID or INVALID.

## Offline
No network.

## Tamper demonstration
Change one character in body/signature -> INVALID.

## QR scanning
Live camera scanning is optional and can be cut if time is short. Paste/use-last-certificate verification is the required fallback.

## Phase 1 implementation (`web-app/js/certificate/certificate.js`)
HACKATHON DEMO SECURITY ONLY. The secret ships in the client and can be extracted.
- `DEMO_SECRET = "SurakshaAR-SIH2026-HACKATHON-DEMO-SECRET-NOT-FOR-PRODUCTION"`.
- `body` = Base64 (standard alphabet, padded) of the UTF-8 JSON with keys in the order `name, module, score, issuedMs, expiryMs`.
- `sig` = first 16 lowercase hex characters of `HMAC-SHA256(key = UTF-8(DEMO_SECRET), msg = body string)`.
- Validity: `expiryMs = issuedMs + 365 days`. Timestamps use logical prototype time.
- Verification order: parse payload, check format, recompute HMAC with a constant-time compare, decode and validate the body, then check expiry.
- Results: `VALID`, or `INVALID` with a reason: `malformed`, `signature` (tampered), `content`, or `expired`.
- The QR encodes the payload string as-is and is generated locally (`web-app/js/utils/qr.js`).
- The verify screen has **Use Last Certificate**, a paste box, and a **Change 1 character (demo)** button for the tamper demonstration.
- Decisions: `24_DECISION_LOG.md` D-012, D-013, D-019, D-020.
