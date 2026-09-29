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
