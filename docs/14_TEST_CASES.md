# Detailed Test Cases

## TC-001 Language
Select Hindi. Reload. Hindi remains active.

## TC-002 Santali fallback
Remove a Santali string. UI falls back to Hindi, then English.

## TC-003 Fire perfect
Answer all 3 correctly. Expected score 100, pass.

## TC-004 Fire one wrong
Answer one wrong. Expected score 67, fail.

## TC-005 Gas perfect
Answer all 3 correctly. Expected score 100, pass.

## TC-006 Gas two wrong
Expected score 33, fail.

## TC-007 Certificate
Passing result creates certificate with correct worker/module/score/timestamps.

## TC-008 QR
QR renders from local payload.

## TC-009 Valid verify
Untouched certificate -> VALID.

## TC-010 Tampered body
Alter one payload character -> INVALID.

## TC-011 Tampered signature
Alter one signature character -> INVALID.

## TC-012 Expired
Set expiry before logical now -> INVALID.

## TC-013 Offline
Enable airplane mode and run train/pass/cert/verify -> success.

## TC-014 Retention
Advance +7 days. Eligible worker becomes Refresher Due.

## TC-015 Risk
Verify risk formula and thresholds.

## TC-016 Unity placement
Tap detected floor -> object anchored.

## TC-017 Unity fallback
No plane detected within timeout -> auto-place.

## TC-018 Unity result
Complete scenario -> Web receives score/wrong.

## TC-019 Low FPS
If performance falls below target, reduce model complexity/options before adding infrastructure.

## TC-020 APK
Release APK installs and launches on target device.

## Execution status (as of 2026-09-30)
"Phone" means the Redmi Note 11 (Android 13). "Auto" means the automated suites: web 72, shell 6, Unity 26.

| Case | Status | Evidence |
|---|---|---|
| TC-001 Language | PASS (auto) | Automated tests. On the phone (P3-M1), the saved language persisted across a cold relaunch. |
| TC-002 Santali fallback | PASS (auto) | Automated tests. Santali → Hindi fallback also seen in AR (Phase 2 M2). |
| TC-003 Fire perfect | PASS (phone) | Phase 2 M2/M4/M5; P3-M1 (Hindi, 100) |
| TC-004 Fire one wrong | PASS (phone) | Phase 2 M2/M3 (67, not passed) |
| TC-005 Gas perfect | PASS (phone) | Phase 2 M3/M4/M5; P3-M1 (Hindi, 100) |
| TC-006 Gas two wrong | PASS (phone) | Phase 2 M3/M4 (33, not passed, no certificate) |
| TC-007 Certificate | PASS (phone) | P3-M1: Ramesh Kumar / JH-2001, Fire, 100, 365 days |
| TC-008 QR | PASS (phone) | P3-M1: QR displayed. Decoding is verified by the automated tests. |
| TC-009 Valid verify | PASS (phone) | Phase 2 M5; P3-M1 |
| TC-010 Tampered body | PASS (phone) | Phase 2 M5; P3-M1 (Change 1 character → INVALID, signature mismatch) |
| TC-011 Tampered signature | PASS (auto) | Automated tests only |
| TC-012 Expired | PASS (auto) | Automated tests only. It can't be shown in the app: +7 is capped at 52 weeks, and certificates are valid 365 days. |
| TC-013 Offline | PASS (phone) | Phase 2 M5; P3-M1, the full journey in airplane mode |
| TC-014 Retention | PASS (phone) | P3-M1: all 9 workers Refresher Due after +7 days; Reset time restored the state |
| TC-015 Risk | PASS (phone + auto) | P3-M1: every value matched the formula (phone worker 0 → 35, red count 2 → 5) |
| TC-016 Unity placement | PASS (phone) | Phase 2 M1/M2 (placed on a detected plane) |
| TC-017 Unity fallback | PASS (phone) | Phase 2 M1–M3. P3-M1 used it in both runs because no plane was detected. |
| TC-018 Unity result | PASS (phone) | Phase 2 M4/M5; P3-M1 |
| TC-019 Low FPS | Not triggered | No low-FPS condition seen: about 29.9 FPS sustained in Phase 2 M5 |
| TC-020 APK | **Partial** | The **debug** APK installs and launches (Phase 2 M5 clean install, P3-M1). The **release** APK has not been built or tested (P3-M4). |
