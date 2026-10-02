# Lifecycle review ledger

This directory holds tracked **maintenance metadata**, not policy evidence.

`lifecycle-reviews.json` records when an already-published financial commitment was last checked for later lifecycle evidence. It deliberately sits outside `data/seed/` so a maintenance action is never confused with a source-backed claim about the commitment itself.

Each record has:

- `commitmentId` — resolves to `data/seed/financial-commitments.json`.
- `financialStatusCheckedAt` — the last date a follow-up search checked for a later financial milestone.
- `implementationStatusCheckedAt` — the last date a follow-up search checked for later physical-project progress.
- `flags` — optional queue overrides:
  - `internal_contradiction`
  - `known_milestone_passed`
- `note` — optional maintainer context.

A check date means only **the search was performed through that date**. It does not mean the current status was newly evidenced on that date.

When a review finds a real change, append the normal source-linked status entry to the financial commitment and update the corresponding check date. When a review finds no later evidence, leave status history unchanged and update only the check date.

Run:

```bash
npm run audit:lifecycle
npm run audit:lifecycle -- --as-of 2026-10-02
npm run audit:lifecycle -- --as-of 2026-10-02 --all
```

The audit defaults to `site.lastUpdated` for deterministic output. `--all` includes routine P3 bundles; otherwise the report prints P0–P2 only.
