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

## Submission artifact status (as of 2026-09-30)

| Artifact | Status |
|---|---|
| APK | A **debug**-signed APK exists and is validated on the phone: `android-shell/app/build/outputs/apk/debug/app-debug.apk`, 25.3 MB (Phase 2 M5, P3-M1). The release build is **pending** (P3-M4, D-031). |
| Public repository | The Git remote is `github.com/chiragvaze/SurakshaAR`. Its public visibility has not been confirmed in these docs. |
| README | Refreshed after P3-M1. The final release and demo details are pending (P3-M4). |
| Dashboard URL | **Pending** (P3-M5). The dashboard works inside the APK (P3-M1). A hosted copy would show only the seeded workers, because browser storage is separate per site. |
| Verification flow | Validated offline on the phone (Phase 2 M5, P3-M1) |
| 3–5 minute demo video | **Pending** (P3-M5) |
| Release freeze | Phase 2 is frozen at the `phase2-complete` tag. The final Phase 3 freeze is **pending** (P3-M5). |
