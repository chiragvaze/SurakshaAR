# Definition of Done

**Final status: FINAL FREEZE, 2026-09-30** (D-039, tag `v1.0.0-sih-final`). `[x]` means verified, with the evidence noted. `[ ]` means not met, and is a documented known limitation.

"Phone" means the Redmi Note 11 (2201117TI), Android 13, Google Play Services for AR 1.56. Every phone run was in airplane mode with Wi-Fi off.

## Product
- [x] Language picker works. (P3-M1, P3-M2, P3-M5 on the phone)
- [x] **Hindi** text and Hindi voice work, including in AR. (TTS `hi usable=true` in P3-M1, P3-M2 and P3-M5; the voice was heard in P3-M1 and P3-M2)
- [x] Worker profile works. (P3-M1, P3-M2, P3-M5)
- [x] **Fire AR** works on a physical phone. (Phase 2 M2/M4/M5; P3-M1, P3-M2, P3-M5, each scoring 100)
- [x] **Gas AR** works on a physical phone. (Phase 2 M3/M4/M5; P3-M1, P3-M2, P3-M5, each scoring 100)
- [x] **Scoring** works: 100, 67 and 33, with no certificate below 70. (Phase 2 M2–M5 on the phone; 100 in P3-M1, P3-M2 and P3-M5; automated tests)
- [x] Passing generates a **certificate**. (P3-M1, P3-M2, P3-M5)
- [x] **QR** works locally. (QR displayed in P3-M1, P3-M2 and P3-M5; automated tests decode it)
- [x] Offline verification works. (Phase 2 M5; P3-M1, P3-M2, P3-M5 in airplane mode)
- [x] **Tampering** produces INVALID, and Use Last Certificate gives VALID again. (Phase 2 M5; P3-M1, P3-M2, P3-M5)
- [x] **Dashboard** works inside the APK. (P3-M1, P3-M2, P3-M5)
- [x] **+7 days** retention simulation works. (P3-M1, P3-M2, P3-M5; public site in P3-M4 and P3-M5)
- [x] **Refresher Due** works. (P3-M1, P3-M2, P3-M5; public site in P3-M4 and P3-M5)
- [x] **Reset time** restores the baseline. (P3-M1, P3-M2, P3-M5; public site in P3-M4 and P3-M5)

## Engineering
- [x] Unity build uses the required configuration. (D-021, D-022)
- [x] Android 10+ target. (minSdk 29, targetSdk 34, arm64-v8a)
- [x] **Release APK:**
  - `app-release.apk`, `com.surakshaar.app` 0.4.0-m4, 22.8 MB;
  - SHA-256 `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0`;
  - CAMERA and VIBRATE only, no INTERNET, not debuggable.
  - Evidence: P3-M2; re-verified in P3-M5 and at the freeze.
- [x] **Release signing:** APK Signature Scheme v2 with a local **prototype** key (`CN=SurakshaAR SIH 2026 Prototype (not production)`). It is not store or production signing. (D-031, D-035)
- [x] **Physical-device validation** of the full demo on the release APK. (P3-M2 smoke test; P3-M5 timed rehearsal, 27 steps, about 3 min 43 s)
- [x] **Automated tests:** web 72/72, shell 6/6, Unity 26/26. (P3-M5)
- [x] No critical runtime errors in the validated demo flow: 0 crashes or ANRs in P3-M1, P3-M2 and P3-M5.
- [ ] Camera-denial edge case: **D-032 is deferred**. Denying the first camera prompt can crash ARCore. Workaround: grant camera permission before launching AR. (D-032, D-036)
- [x] Core flow works offline. (Phase 2 M5; P3-M1, P3-M2, P3-M5)
- [x] No production credentials committed. Only the disclosed demo HMAC secret is in the repository (D-005, D-012); the git history was scanned in P3-M4.
- [x] README is complete. (P3-M4; final status at the freeze)
- [x] Repository is reproducible. (Phase 2 M5 rebuild with Unity's toolchain only; release build P3-M2)

## Demo
- [x] 3–5 minute script rehearsed. (P3-M5: about 3 min 43 s on the release APK, no blocking issues)
- [x] Airplane-mode test rehearsed. (P3-M5)
- [x] Tamper test rehearsed. (P3-M5)
- [x] APK installed on the demo phone:
  - the release APK, with its SHA-256 matching on the device;
  - no debug build installed;
  - Hindi selected and demo worker ready, with no attempts or certificates yet. (P3-M5)
- [x] Dashboard accessible: inside the APK, and publicly at https://chiragvaze.github.io/SurakshaAR/#/dashboard with the seeded workers only and no sync with phones. (P3-M4, P3-M5)

## Known limitations (unchanged at the freeze)
- **D-032:** OPEN, deferred until after the hackathon.
- **D-034:** the service-worker registration fails inside the APK only. It is non-blocking.
- **Santali:** mostly the Hindi fallback, because no approved content exists (D-036).
- **Certificate signing:** demo-only (an HMAC secret inside the app).
- **Hardware coverage:** one physical phone model tested.
