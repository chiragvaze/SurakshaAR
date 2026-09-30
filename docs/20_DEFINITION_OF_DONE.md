# Definition of Done

Status as of 2026-09-30. `[x]` means verified, with the evidence noted. `[ ]` means not yet met.

## Product
- [x] Language picker works. (P3-M1, on the phone)
- [x] Worker profile works. (P3-M1, on the phone)
- [x] Fire AR works on a physical phone. (Phase 2 M2/M4/M5; P3-M1)
- [x] Gas AR works on a physical phone. (Phase 2 M3/M4/M5; P3-M1)
- [x] Scoring works. (Phase 2 M2–M5, on the phone; automated tests)
- [x] Passing generates certificate. (P3-M1)
- [x] QR works locally. (P3-M1: QR displayed; automated tests decode it)
- [x] Offline verification works. (Phase 2 M5; P3-M1, airplane mode)
- [x] Tampering produces INVALID. (Phase 2 M5; P3-M1)
- [x] Dashboard works. (P3-M1: first physical verification inside the APK)
- [x] +7 days works. (P3-M1)
- [x] Refresher Due works. (P3-M1)

## Engineering
- [x] Unity build uses required configuration. (D-021, D-022)
- [x] Android 10+ target. (minSdk 29)
- [ ] No critical console/runtime errors.
  - Open: the D-032 ARCore crash when the first camera prompt is denied.
  - Non-blocking: the D-034 offline-cache console error.
- [x] Core flow works offline. (Phase 2 M5; P3-M1)
- [x] No production credentials committed. (Only the disclosed demo HMAC secret, D-005/D-012)
- [ ] README is complete. (Refreshed after P3-M1; release and final demo details are pending, P3-M4)
- [x] Repository is reproducible. (Phase 2 M5 rebuild using only Unity's toolchain)

## Demo
- [ ] 3–5 minute script rehearsed. (The full journey was run in P3-M1; a timed rehearsal is pending, P3-M5)
- [ ] Airplane-mode test rehearsed. (Run during Phase 2 M5 and P3-M1; the final rehearsal is pending)
- [ ] Tamper test rehearsed. (Run during Phase 2 M5 and P3-M1; the final rehearsal is pending)
- [ ] APK installed on demo phone. (The release APK is installed and validated on the test phone, P3-M2. The final demo phone and a cleared storage state are pending.)
- [ ] Dashboard accessible. (Works inside the APK; the hosted dashboard URL from `17_DEPLOYMENT.md` is pending)
