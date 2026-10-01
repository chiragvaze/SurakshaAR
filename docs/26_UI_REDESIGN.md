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
