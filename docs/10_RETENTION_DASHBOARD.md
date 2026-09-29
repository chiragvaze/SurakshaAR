# Retention Guard and Dashboard

## Risk
`min(100, days_since*5 + fails*15 + (100-score)/2)`

## Status
- Green: <30
- Amber: 30–59
- Red: >=60

## Refresher
Due after >=7 days without completed refresher.

## Demo
A +7-day logical time simulation changes:
- days_since
- risk
- status
- refresher state

Do not alter the device clock.

## Dashboard
Seed 8 workers.

Columns:
- Worker
- latest module
- score
- failures
- risk
- risk status
- refresher state

The dashboard is primarily a compliance/risk demonstration, not a production workforce-management system.

## Phase 1 implementation notes
- Code: `web-app/js/services/retention.js`. Screen: `web-app/#/dashboard`. Seed data: `web-app/js/data/seed-workers.js`.
- `days_since` = floor of whole days since the latest completed attempt. Risk is rounded to an integer before the status thresholds are applied (D-015).
- Refresher Due = `days_since >= 7`. A completed refresher is a new attempt and resets `days_since`.
- The dashboard shows the 8 seeded workers plus this phone's worker, labelled "this phone", once they have trained. Rows are sorted by risk.
- **Simulate +7 Days** adds 7 days to `retention.demoOffsetMs` (D-014), capped at 52 weeks. **Reset time** sets it back to 0. The worker home screen's Retention Guard card uses the same logical time.
