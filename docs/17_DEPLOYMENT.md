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

## Dashboard URL status (checked 2026-09-30, P3-M4)
**Dashboard URL not currently deployed.**

Evidence:
- The repository has no deployment configuration: no Vercel, Netlify or GitHub Pages files or workflows, and no hosted URL anywhere.
- The GitHub repository `chiragvaze/SurakshaAR` is **private**.
- GitHub Pages is **not enabled** (the Pages API returns 404).

The dashboard itself works:
- inside the APK (P3-M1, P3-M2);
- locally in a browser: `cd web-app && npm start`, then `http://127.0.0.1:5173/#/dashboard`. The first visit asks for a language.

A hosted copy would show only the 8 seeded workers, because each site has its own browser storage.

**Smallest safe path to a public URL.** Not done: it needs the owner's decision.
1. **Repository visibility:** GitHub Pages on a free account needs a **public** repository. The submission also requires a public repository. Making it public is the owner's decision.
2. **Publish `web-app/`:** Pages can only serve a branch's root or `/docs` folder, so `web-app/` needs either a small GitHub Actions Pages workflow (uploading `web-app/` as the site) or a `gh-pages` branch with its contents. Neither exists yet.
3. **Expected URL once deployed** (not live): `https://chiragvaze.github.io/SurakshaAR/#/dashboard`.
- Alternative: Vercel. It needs a Vercel account connected to the repository, which is not configured.

## Final submission checklist (P3-M4, as of 2026-09-30)
`[x]` means evidence exists (the source is in brackets). `[ ]` means not done yet.

### Technical
- [x] Release APK: `android-shell/app/build/outputs/apk/release/app-release.apk`, 22.8 MB, local prototype signing, not production (P3-M2, D-035). A known-good copy is kept outside the repository on the build machine.
- [x] SHA-256 recorded: `e69b221623d34397c86dec0a4be369f7040384da12dc5353d0eb7c83d9276fd0` (README, `12_ANDROID_BUILD_SPEC.md`).
- [ ] **Public repository.** The repository exists on GitHub but is **private**. Owner decision needed.
- [x] README: evaluator-facing, with capabilities, validation, APK identity and limitations (P3-M4).
- [x] Architecture docs: `02_ARCHITECTURE.md`, `07_API_AND_BRIDGE_CONTRACTS.md`, D-028/D-029.
- [x] Test evidence:
  - automated web 72, shell 6, Unity 26;
  - device records in `11_UNITY_AR_SPEC.md` and `12_ANDROID_BUILD_SPEC.md`;
  - test-case status in `14_TEST_CASES.md`.
- [x] Known limitations documented: README, `18_FALLBACKS_AND_RISKS.md`, D-032/D-034/D-036.
- [ ] **Dashboard URL.** Not deployed (see above).

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
