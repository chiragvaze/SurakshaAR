# UI / UX Redesign — "Suraksha Drishti" design system (post-freeze)

Status: in progress. This document is the Phase 0 audit + implementation map and is updated per phase.
The frozen SIH submission (`v1.0.0-sih-final`, release APK `e69b2216…d9276fd0`) is not affected.

## Phase 0 — codebase audit

### What actually exists
| Area | Reality in this repository |
|---|---|
| Mobile app | `web-app/` (vanilla JS classic scripts on the `SA` namespace, hash router) running inside the Kotlin WebView shell (`android-shell/`, `MainActivity`), served from APK assets. |
| AR | Unity 2022.3 AR Foundation / ARCore library in its own `:unity` process. HUD is built in code (`unity-ar/Assets/Scripts/UI/TrainerHUD.cs`), Hindi text rendered by Android (`UIText`/`NativeText`). Entry: `Android.launchAR(module, lang)`; result back through `SurakshaAR.onARResult`. |
| Web dashboard | The same `web-app/`: supervisor dashboard `#/dashboard` (public on GitHub Pages) and the Local Role-Based Dashboard Prototype `#/manage` (Trainer / Mine Safety Officer / Contractor, D-040). |
| Data | `localStorage` only: `sa_v1` (worker, attempts, certs, logical-time offset, language; strict sanitising in `store.js`) and `sa_mgmt_v1` (role, assignments). |
| Business logic | `scenario/` (engine, scoring 70 pass mark), `services/training.js` (single result pipeline), `certificate/` (demo HMAC + QR), `services/retention.js` (risk formula), `services/management.js`. |
| Auth | None. Worker "login" is name + worker ID; role selection is not authentication. |
| i18n | `SA.STRINGS` en / hi / sat (sat falls back to hi). A test enforces every English key exists in Hindi. AR strings (`ar.*`) are exported to Unity. |
| Styling | One dark amber stylesheet (`css/app.css`), a few CSS variables, emoji icons, no theme support. |
| Constraints | Strict CSP from `tools/serve.js` (`script-src 'self'`, `style-src 'self'` → no inline scripts or `style=` attributes; CSSOM is fine). No network calls (test-enforced). `sw.js` must list every asset (test-enforced). No runtime dependencies. |

### Not present (and not invented by this redesign)
React/Tailwind, FastAPI, PostgreSQL, Firebase, object storage, cloud sync, login/auth, TensorFlow Lite PPE detection, Vosk speech recognition, Vuforia markers, live QR camera scanning, an AI model, SOS dispatch, near-miss backend.
Following the brief's rule 53, screens that need these get an **honest local version**, clearly labelled, never presented as the missing system:

| Requested | What is built instead | Label shown |
|---|---|---|
| PPE camera detection | Manual PPE self-check, stored on device, trainer review queue | "Self-check — camera detection is not in this build" |
| AI Safety Coach | Offline guide that answers from the approved training content | "Offline guide · answers from your training content (not AI)" |
| Voice input | Not available (no offline speech recogniser); AR keeps Hindi text-to-speech | Mic shown disabled with reason |
| SOS | Records an auditable local event; nothing is sent (no network in this build) | "Prototype — no alert is sent from this device" |
| Near-miss report | Local report form + officer status workflow; no photos (needs shell file-picker support) | "Stored on this device only" |
| QR scanner | Existing paste-based offline verification | — |
| Zone clearance | Derived: cleared for a module's hazard area while its certificate is VALID and no refresher is due | "Demo rule" |
| Haadsa Replay / Pressure Drill | Practice walk-through of the real scenario steps (untimed / timed); not scored, never issues certificates | "Practice — not recorded" |
| Sync status | Offline indicator only ("All training is stored on this device") | — |
| Khortha, Nagpuri, Ho, Mundari | Listed as "awaiting native-speaker content", not selectable (D-018) | — |
| Trend charts (7D/30D/3M/1Y) | Built only from real attempt timestamps on this device + seeded demo rows | seeded data labelled |

### Implementation map — mobile (worker app)
| Screen | Existing | New |
|---|---|---|
| Onboarding / Welcome | `screens/onboarding.js` `welcome` | Hero + brand mark, ThemeToggle |
| Login | `onboarding.js` `profile` (worker details) | Glass form, privacy note |
| Language | `onboarding.js` `language` | LanguageSelector (available + awaiting review) |
| Home | `screens/home.js` | Greeting, SafetyStatus ring (Retention Guard), Continue training, Quick actions, Today's safety, Coach card |
| Training library | (module cards on Home) | `#/train` TrainingCards |
| Training details / LEARN | `training.js` `briefing` | LEARN → FIND → PROVE stepper, hazard briefing |
| FIND / PROVE | `training.js` `assess` + Unity AR | Restyled browser trainer; Unity HUD restyle (Phase 4) |
| Result | `training.js` `result` | TrainingResult: score ring, metrics from the real attempt |
| Haadsa Replay / Pressure Drill | — | `#/replay/<module>` (practice) |
| PPE Check | — | `#/ppe` (self-check) |
| Passport | `certificate.js` `certificate` | `#/certificate` → PassportCard + QRCard + zone clearance |
| Verify | `certificate.js` `verify` | Restyled verdict |
| SOS / Near-miss | — | `#/sos`, `#/nearmiss` |
| Coach | — | `#/coach` |
| Notifications | — | `#/alerts` (derived, local) |
| Profile / Settings / Theme | — | `#/me` (theme, effects, language, worker details) |
| Navigation | top app bar only | App bar + bottom NavigationBar (Home, Verify, Train ●, Passport, Profile) |

### Implementation map — web dashboard
| Screen | Existing | New |
|---|---|---|
| Login | `#/manage` role cards | "Choose your role" (prototype, not secure) |
| Shell | header + tabs | Glass Sidebar (desktop), drawer + bottom bar (mobile), header with search, alerts, ThemeToggle |
| Dashboard | role dashboards | MetricCards + ChartCards per role |
| Workers / Worker profile | worker cards | WorkerTable (cards below 768px), search + filters, profile view |
| Training / Modules / Assessments | trainer "training" tab | Module cards, assignments, attempt history |
| Passports / Zone clearance | certificates tab | Passport list + derived clearance |
| Near-Miss / Alerts / Trainer mode | placeholder | Local reports, derived alerts, PPE review queue |
| Analytics | officer trends | Line / bar / donut charts (inline SVG, no library) |
| Supervisor dashboard | `#/dashboard` | Restyled; ids and +7 / Reset behaviour unchanged |

### Rules for this redesign
- Presentation only: scoring, retention, certificates, storage sanitising, the bridge contract and AR logic are not changed.
- Existing element ids used by tests and the demo script are kept.
- New local data lives in new validated keys; `sa_v1` is never extended (its sanitiser drops unknown fields).
- No dependencies, web fonts or remote assets: system font stack, in-repo SVG icons.

## Implementation status (2026-10-01, branch `ui-redesign`)

| Phase | Commit | State |
|---|---|---|
| 0 Audit | `phase-0-audit` | Done |
| 1 Design system | `phase-1-design-system` | Done |
| 2 App shell + navigation | `phase-2-app-shell` | Done |
| 3 Home + LEARN → FIND → PROVE | `phase-3-mobile-training` | Done |
| 4 AR HUD + PPE | `phase-4-ar-ppe` | Done (Unity HUD restyle is visual only; AR verified on the Redmi Note 11) |
| 5 Passport | `phase-5-passport` | Done |
| 6 SOS + near-miss | `phase-6-emergency` | Done (local logging only, nothing is sent) |
| 7 Coach + language | `phase-7-ai-language` | Done (offline content-based guide, not AI; voice input not available) |
| 8–10 Web dashboard, operations, analytics | `phase-8-9-10-dashboard` | Done |
| 11–12 Polish, performance, accessibility | `phase-11-12-polish-a11y` | Done |
| 13 Final QA | this document | Done (see below) |

### Design system
- **Tokens:** `web-app/css/tokens.css` defines colour, radius, spacing, type, shadow, blur, motion and gradient tokens. The light and dark sets are test-enforced to match.
- **Themes:** `html[data-theme]` selects the theme. Light is always the default; the device's dark mode is not followed. The user's choice is stored under `sa_ui_v1` by `js/services/prefs.js`, which is loaded in `<head>` so there is no flash on load.
- **Low-performance fallback:** `html[data-effects="reduced"]` removes blur and makes surfaces opaque. It is chosen:
  - automatically on devices with 2 GB of memory or less, or 2 CPU cores or fewer;
  - by the user in Settings;
  - when `backdrop-filter` is unsupported.
- **Icons:** `js/components/icons.js` draws inline SVG icons using Lucide geometry (ISC licence). There is no dependency and no network access.
- **Components:** `js/components/ui.js` provides:
  - GlassCard, the buttons, IconButton, StatusBadge, chips and Avatar;
  - ProgressRing, MetricCard and bars;
  - the LEARN/FIND/PROVE stepper;
  - Toast, BottomSheet/Modal, skeleton, empty and error states;
  - the segmented control and ThemeToggle;
  - the NavigationBar and the app bar with a notifications bell.
- **Stylesheets:**
  - `tokens.css`, `base.css`, `components.css`;
  - `screens.css` (onboarding, settings, library), `training.css` (home and training), `safety.css`, `passport.css`;
  - `manage.css` (dashboard shell) and `manage-pages.css` (dashboard pages and charts).

### New local data (each in its own validated key; `sa_v1` unchanged)
- **`sa_ui_v1`:** `{theme, effects}`.
- **`sa_safety_v1`:**
  - `{ppe[], nearmiss[], sos[], audit[]}`, sanitised field by field.
  - SOS records can only ever have the status `logged`.
  - `audit` is append-only.

### AR HUD (Unity)
- `TrainerHUD.cs` now has rounded, translucent dark "glass" panels (a 9-slice sprite generated in code) and indigo primary buttons.
- Panels are inset from the edges, and the safe area is taken from `Screen.safeArea`.
- Events, the scenario flow, scoring and the bridge are unchanged.

### Android shell
- The window theme is now light.
- An optional `Android.setDarkTheme(boolean)` call lets the web app colour the status and navigation bars. No data crosses this call.
- Nothing else changed: no permission, package, version, signing or Gradle changes.

### Final QA results
- **Automated:**
  - web 114/114 (the 86 pre-redesign tests are unchanged and pass);
  - Unity EditMode 26/26;
  - Android shell 6/6.
- **Real browser (headless Edge):**
  - The existing 14-step worker flow regression passes: Hindi → Fire 100 → certificate + QR → VALID → tamper INVALID → Gas → dashboard → +7 days → Reset → reload.
  - No console errors and no external requests.
- **Accessibility and layout audit:**
  - 36 routes at 320, 393, 820 and 1440 px, in light and dark;
  - 0 issues: accessible names, 44×44 px touch targets, no duplicate ids, no horizontal overflow, one h1 per screen;
  - WCAG AA contrast checked for the token pairs.
- **Redmi Note 11 (Android 13, airplane mode), debug build:**
  - install and launch work, and the light status bar follows the theme;
  - Fire AR 100 and Gas AR 100 with the restyled HUD; both results reached the web app;
  - certificate, Passport QR, theme toggle and SOS cancel work;
  - no crashes;
  - one bug was fixed (no duration shown for AR attempts). See D-041.
