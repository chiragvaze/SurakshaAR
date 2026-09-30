# Deployment Specification

## Phase 1
Run web app locally/static hosting.

No backend required.

## Dashboard
Static HTML deployment is sufficient for prototype.
Possible hosting:
- GitHub Pages
- Vercel

## Phase 2
Unity Android build on physical ARCore device.

## Phase 3
Release APK + dashboard + public repository.

## Required submission artifacts
- APK
- public repository
- README
- dashboard URL
- verification flow
- 3–5 minute demo video

## Release freeze
Freeze new features before the final testing/video window.

## Public dashboard (deployed 2026-09-30, P3-M4)
**Public dashboard: https://chiragvaze.github.io/SurakshaAR/#/dashboard** (site root: https://chiragvaze.github.io/SurakshaAR/)

**Deployment:**
- The repository `chiragvaze/SurakshaAR` is **public**. GitHub Pages is enabled with source **GitHub Actions**, with HTTPS enforced.
- The workflow `.github/workflows/pages.yml` runs on pushes to `main` that change the web app or the workflow, and can also be started manually.
  - It copies only `web-app/index.html`, `sw.js`, `css/` and `js/`, the same set the Android build packages, into the Pages artifact.
  - It uses `actions/checkout@v7`, `configure-pages@v6`, `upload-pages-artifact@v5` and `deploy-pages@v5`. There is no build step and there are no dependencies.
- The first deployment was run `36751977536` for commit `7439947`. It succeeded, and GitHub reported `environment_url: https://chiragvaze.github.io/SurakshaAR/`.
- `tests/` and `package.json` are **not** published (they return 404).

**Verified on the live site** (headless Microsoft Edge 154):
- Home loads, with its CSS and all scripts.
- The service worker activates with scope `/SurakshaAR/` and precaches 28 files. The app needed no change for the repository subpath.
- The first visit goes through the language picker, then to `#/dashboard`.
- The dashboard shows **8 seeded workers**: 3 Green, 3 Amber, 2 Red, 2 Refresher due.
- **Simulate +7 Days** gives 0 Green, 3 Amber, 5 Red and 8 Refresher due.
- **Reset time** restores the exact baseline.
- There are no console errors. The only 404 is the browser's automatic `/favicon.ico` request, and the app has no favicon.

**Public dashboard vs APK dashboard:**
- The public site holds **seeded demo data only**, stored in each visitor's browser.
- The APK dashboard adds the phone's own worker and attempts.
- They are **not synchronised**, and there is no cloud sync (D-003, D-004).

## Final submission checklist (P3-M4, as of 2026-09-30)
`[x]` means evidence exists (the source is in brackets). `[ ]` means not done yet.

### Technical
- [x] Release APK: `android-shell/app/build/outputs/apk/release/app-release.apk`, 22.8 MB, local prototype signing, not production (P3-M2, D-035). A known-good copy is kept outside the repository on the build machine.
- [x] SHA-256 recorded: `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0` (README, `12_ANDROID_BUILD_SPEC.md`).
- [x] Public repository: `https://github.com/chiragvaze/SurakshaAR` (`visibility: public`, checked with the GitHub API in P3-M4).
- [x] README: evaluator-facing, with capabilities, validation, APK identity and limitations (P3-M4).
- [x] Architecture docs: `02_ARCHITECTURE.md`, `07_API_AND_BRIDGE_CONTRACTS.md`, D-028/D-029.
- [x] Test evidence:
  - automated web 72, shell 6, Unity 26;
  - device records in `11_UNITY_AR_SPEC.md` and `12_ANDROID_BUILD_SPEC.md`;
  - test-case status in `14_TEST_CASES.md`.
- [x] Known limitations documented: README, `18_FALLBACKS_AND_RISKS.md`, D-032/D-034/D-036.
- [x] Dashboard URL: https://chiragvaze.github.io/SurakshaAR/#/dashboard (deployed and verified in P3-M4; seeded workers only).

### Demo
- [ ] Final demo phone chosen and prepared (checklist in `19_DEMO_SCRIPT.md`). The Redmi Note 11 test phone has the release APK, with test data still on it.
- [ ] Camera permission granted on the final phone, after clearing storage.
- [ ] ARCore on the final phone. It is installed on the test phone (1.56); recheck on the final phone.
- [ ] Hindi TTS on the final phone. It is available on the test phone; recheck.
- [ ] Airplane mode ON and Wi-Fi OFF on the final phone.
- [ ] Demo data reset: storage cleared, and the +7 offset reset.
- [x] 3–5 minute script: `19_DEMO_SCRIPT.md`, demo order and constraints (P3-M4).
- [ ] Timed rehearsal.
- [ ] Demo video (3–5 minutes).

### Evidence (physically verified on the Redmi Note 11, recorded in `12_ANDROID_BUILD_SPEC.md`)
- [x] Fire AR (Hindi, 100) (P3-M1, P3-M2)
- [x] Gas AR (Hindi, 100) (P3-M1, P3-M2)
- [x] Scoring: 100, 67 and 33, with no certificate below 70 (Phase 2 M2–M5; P3-M1/M2)
- [x] Certificate (P3-M1, P3-M2)
- [x] QR (P3-M1, P3-M2)
- [x] Tamper gives INVALID; restore gives VALID (P3-M1, P3-M2)
- [x] Dashboard (P3-M1, P3-M2)
- [x] +7 days (P3-M1, P3-M2)
- [x] Refresher Due (P3-M1, P3-M2)
- [x] Reset time (P3-M1, P3-M2)

The records are written logs and measurements. Screenshots from P3-M2 exist only on the build machine and the phone, not in the repository. The demo video is the planned visual evidence.
