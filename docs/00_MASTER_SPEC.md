# SurakshaAR — Master Technical & Product Specification

**SIH 2026 | Problem Statement 26041**  
**AR-Based Vocational Training Simulator for Industrial Safety in Jharkhand's Mining & Manufacturing Sector**

## 1. Purpose
This documentation package is the single working specification for the SurakshaAR prototype.

It converts the established PRD and architecture decisions into implementation-ready documents for a three-phase build:
- Phase 1 — Web/business layer
- Phase 2 — Unity AR layer
- Phase 3 — Android integration, release and demo

## 2. Prototype north star
A worker should be able to:
1. choose Hindi, Santali or English;
2. train on Fire & Explosion;
3. train on Gas Leak & Confined Space;
4. complete scored assessments;
5. receive a locally generated signed QR certificate after passing;
6. verify the certificate without network access;
7. demonstrate retention risk and a refresher due state;
8. let a supervisor view a simple compliance/risk dashboard.

## 3. Hard constraints
- Team: 3 people.
- Target build window: 24 hours.
- Android 10+ with ARCore.
- Unity is used for AR only.
- Offline-first prototype.
- Hardcoded/seeded data is acceptable where it is not visible as a limitation.
- No production backend is required for the prototype.
- No production AI is required.
- No API keys/cloud accounts are required for the core prototype.
- If Unity library integration fails by the planned cutoff, the documented two-app deep-link fallback is acceptable.

## 4. Architecture summary
```text
Android APK
├── Kotlin Android shell
│   ├── MainActivity
│   ├── WebView
│   └── JavaScript bridge
├── Web app
│   ├── UI
│   ├── language/content
│   ├── scoring/business logic
│   ├── certificate + QR
│   ├── verification
│   └── retention state
└── Unity as Library
    └── AR trainer

Static admin dashboard
└── seeded worker/risk data
```

## 5. Phase boundaries
### Phase 1
Build the complete browser/web business layer. No Unity.

### Phase 2
Build the real Unity AR engine and both modules.

### Phase 3
Integrate web + Unity + Android, test offline, package APK, dashboard and demo assets.

## 6. Required modules
- Fire & Explosion
- Gas Leak & Confined Space

### Fire steps
1. Find exit — Exit sign correct; lift/window wrong.
2. Electrical fire extinguisher — CO2 correct; water/foam wrong.
3. Smoke response — crawl low correct; run upright/go back wrong.

### Gas steps
1. Gas hazard zone — red leak zone correct; open area/office wrong.
2. Confined-space PPE — gas detector + breathing set correct; cap/gloves wrong.
3. Buddy system — standby attendant correct; nobody/phone later wrong.

## 7. Scoring
`score = round(100 * (steps - wrong) / steps)`

Pass threshold: `>= 70`.

## 8. Certificate
Certificate body:
`{name, module, score, issuedMs, expiryMs}`

Encode JSON as Base64. Sign with HMAC-SHA256 using the demo embedded secret. Store/represent the first 16 hexadecimal characters of the signature.

This is explicitly demo security. Production should move signing server-side to asymmetric cryptography.

## 9. Retention
Risk:
`min(100, days_since * 5 + fails * 15 + (100 - score) / 2)`

Status:
- Green `<30`
- Amber `<60`
- Red `>=60`

Refresher Due:
- >=7 days without completed refresher.

The prototype includes a +7-day demonstration control.

## 10. Localization
Prototype:
- English: `en`
- Hindi: `hi`
- Santali: `sat`

Fallback:
`sat -> hi -> en`

Every Santali string/audio used in a public/demo build should be native-speaker approved. If Santali audio is unavailable, Hindi audio may be used with Santali text.

## 11. Performance
Unity target:
- 30 FPS target
- 24 FPS minimum
- models <5k triangles
- textures <=1024
- no real-time lights
- mono OGG audio
- Unity assets <60 MB
- APK <=150 MB
- cold start <5 seconds target

## 12. Privacy
- Personal data: worker name + worker ID only.
- Camera frames never leave the device.
- No Aadhaar or unnecessary personal information.
- Offline writes first.
- Cloud sync, if ever added, must be non-blocking.

## 13. Critical demo journey
Language -> worker -> Fire AR -> score -> certificate -> airplane mode verify VALID -> tamper one character -> INVALID -> Gas AR -> dashboard -> +7 days -> risk/red/refresher.

## 14. Deferred
Advanced PPE CV, AI coach, production backend, cloud sync, production signing infrastructure, live QR camera scanning if time is insufficient, full five-domain coverage, enterprise authentication and notification systems.

## 15. Document map
- `01_PRD.md`
- `02_ARCHITECTURE.md`
- `03_UI_UX.md`
- `04_SECURITY.md`
- `05_DATA_MODEL.md`
- `06_SCENARIO_ENGINE.md`
- `07_API_AND_BRIDGE_CONTRACTS.md`
- `08_LOCALIZATION.md`
- `09_CERTIFICATE_QR.md`
- `10_RETENTION_DASHBOARD.md`
- `11_UNITY_AR_SPEC.md`
- `12_ANDROID_BUILD_SPEC.md`
- `13_TEST_STRATEGY.md`
- `14_TEST_CASES.md`
- `15_PERFORMANCE.md`
- `16_PRIVACY.md`
- `17_DEPLOYMENT.md`
- `18_FALLBACKS_AND_RISKS.md`
- `19_DEMO_SCRIPT.md`
- `20_DEFINITION_OF_DONE.md`
- `21_PHASE_PLAN.md`
- `22_REPO_STRUCTURE.md`
- `23_ROADMAP.md`
- `24_DECISION_LOG.md`

## 16. Implementation status (as of 2026-09-30)
- **Phase 1:** complete.
- **Phase 2:** complete and frozen at git tag `phase2-complete`. It also delivered the single-APK Android integration planned for Phase 3 (D-028).
- **Phase 3:** COMPLETE / FINAL FREEZE (D-039, tag `v1.0.0-sih-final`).
  - **P3-M1 (full demo-journey validation) is COMPLETE: PASS** (D-033). The whole §13 critical demo journey ran offline, in airplane mode, on a physical Redmi Note 11 with the frozen APK. That includes the dashboard, +7 days, Refresher Due and Reset time.
  - **P3-M2 (release build validation) is COMPLETE: PASS** (D-035). A locally signed, non-production release APK passed the same offline journey on the phone.
  - **P3-M3 (robustness and Santali decision) is COMPLETE: PASS WITH DEFERRALS** (D-036). The D-032 fix is deferred; there is no approved Santali content, so the fallback stays.
  - **P3-M4 (submission package) is COMPLETE: PASS** (D-037, D-038): documentation cleanup, the demo runbook, the demo-phone and submission checklists, and the public dashboard at https://chiragvaze.github.io/SurakshaAR/#/dashboard (seeded workers only, no sync with phones).
  - **P3-M5 is COMPLETE: PASS** (D-039): the final demo phone, the release-APK rehearsal (about 3 min 43 s, no blocking issues) and the final freeze. The video is recorded by the team.
  - Deferred until after the hackathon: the D-032 fix, and Santali (until approved text exists).
- Milestone status: `21_PHASE_PLAN.md`. Known issues: `24_DECISION_LOG.md` (D-031, D-032, D-034) and `18_FALLBACKS_AND_RISKS.md`.
