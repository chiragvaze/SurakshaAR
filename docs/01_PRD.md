# Product Requirements Document

## Problem
SurakshaAR is an AR-based vocational safety training prototype for workers in Jharkhand mining/manufacturing environments.

The product goal is to replace passive, difficult-to-repeat safety instruction with short, repeatable, phone-based practice and a verifiable training result.

## Users
### Worker
A worker/recruit or trainee who needs simple, low-literacy-friendly safety training.

### Supervisor / Safety Officer
Needs visibility into completion, scores, risk and refresher state.

### Inspector / Auditor
Needs a certificate that can be verified.

## Product goals
- real AR training on two priority modules;
- assessment and score;
- offline certificate verification;
- Hindi/Santali support;
- retention/risk demonstration;
- simple dashboard.

## Functional requirements
1. Language selection.
2. Worker name + worker ID.
3. Fire module.
4. Gas module.
5. Three scored steps per module.
6. Pass at 70.
7. Certificate after pass.
8. QR representation.
9. Offline verification.
10. Tamper detection.
11. Risk calculation.
12. +7-day refresher simulation.
13. Seeded dashboard.

## Non-functional
- Android 10+ / ARCore.
- Offline core journey.
- High contrast.
- Large tap targets.
- Minimal personal data.
- Camera data local.
- 24 FPS minimum AR target.
- APK <=150 MB.

## Out of scope
- production cloud backend;
- advanced AI;
- full enterprise identity/access;
- all five domains;
- production-grade certificate PKI;
- live QR scanning if it threatens schedule;
- adaptive learning engine.

## Demo acceptance
The seven-step demo journey in `19_DEMO_SCRIPT.md` is the practical product acceptance path.
