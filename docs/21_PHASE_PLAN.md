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
- **Phase 2: COMPLETE / FROZEN** at git tag `phase2-complete`. Milestones 1–5.
  - Phase 2 also delivered the Android shell integration listed above under Phase 3: the single APK with WebView and Unity as a Library, Milestone 4, D-028.
  - Phase 2 Milestone 5 then validated the offline end-to-end flow, the certificate verification and the error handling.
- **Phase 3: IN PROGRESS. Not complete.**

| Milestone | Scope | Status |
|---|---|---|
| P3-M1 | Full demo-journey validation on the physical phone, no code changes | **COMPLETE: PASS** (2026-09-30, D-033). Dashboard, +7 days, Refresher Due and Reset time were physically verified inside the APK. |
| P3-M2 | Release build validation: build and sign the `release` build type with a local key, then run the offline smoke test on the phone | **COMPLETE: PASS** (2026-09-30, D-035). It behaves the same as P3-M1. |
| P3-M3 | Robustness and Santali decision: investigate D-032; look for approved Santali content | **COMPLETE: PASS WITH DEFERRALS** (2026-09-30, D-036). No product code changed. The D-032 fix is **deferred** (the cause is inside ARCore and not proven, and the fix would change every AR start-up). Santali: **no approved content** exists, so the fallback stays. |
| P3-M4 | Submission package: documentation cleanup, demo runbook, demo-phone and submission checklists, public dashboard. No product code. | **COMPLETE: PASS** (2026-09-30, D-037, D-038). The repository is public, and the dashboard is deployed to GitHub Pages and verified at https://chiragvaze.github.io/SurakshaAR/#/dashboard (seeded workers only). |
| P3-M5 | Final demo phone reset and checklist, timed rehearsal, demo video, final freeze | **PENDING** |
| (post-hackathon) | Camera-permission startup fix (D-032) | Deferred (D-036). Workaround: grant camera permission before launching AR. |
| (post-hackathon, or when approved text arrives) | Santali content | Deferred. Only with native-speaker-approved text (D-018, D-036). |
