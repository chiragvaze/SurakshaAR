# Three-Phase Execution Plan

## Phase 1 — Web/business layer
Goal: complete the app brain before AR.

Build:
- UI
- languages
- worker
- scenario engine
- scoring
- certificate
- QR
- verification
- retention
- dashboard

Exit: `20_DEFINITION_OF_DONE.md` Phase 1 subset.

## Phase 2 — Unity AR
Goal: turn the scenario engine into real AR.

Build:
- AR scene
- plane/raycast
- placement
- Fire
- Gas
- touch options
- voice
- result bridge
- performance

Exit: both modules work on phone.

## Phase 3 — Integration/release
Goal: one coherent demoable product.

Build:
- Android shell integration
- offline end-to-end
- certificate verification
- dashboard
- error handling
- release APK
- README
- demo video

Exit: final DoD.

## Execution status (updated 2026-09-30)
- **Phase 1: complete.** Web/business layer.
- **Phase 2: complete and frozen at git tag `phase2-complete`.** Milestones 1–5.
  - Phase 2 also delivered the Android shell integration listed above under Phase 3: the single APK with WebView and Unity as a Library, Milestone 4, D-028.
  - Phase 2 Milestone 5 then validated the offline end-to-end flow, the certificate verification and the error handling.
- **Phase 3: in progress. Not complete.**

| Milestone | Scope | Status |
|---|---|---|
| P3-M1 | Full demo-journey validation on the physical phone, no code changes | **COMPLETE: PASS** (2026-09-30, D-033). Dashboard, +7 days, Refresher Due and Reset time were physically verified inside the APK. |
| P3-M2 | Camera-permission startup fix (D-032) | Pending (optional) |
| P3-M3 | Santali content | Pending. Only if native-speaker-approved text is supplied (D-018). |
| P3-M4 | Release APK (build and test the `release` build type) plus README/documentation cleanup | Pending. README and status docs were partly refreshed in the P3-M1 documentation update. The full cleanup, the release build and its test are still to do. |
| P3-M5 | Dashboard URL, timed rehearsal, demo video, final freeze | Pending |
