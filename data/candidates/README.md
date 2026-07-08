# Candidate records (private / pre-publication)

Candidate records are **drafts**. They hold proposed policy events, their source
verification, a proposed classification, reviewer notes, and promotion status —
everything needed to review a measure *before* it becomes public.

## Why they are safe

Candidate data is **structurally isolated** from the published site:

- Candidates live only in `data/candidates/*.json`.
- **No file under `app/`, `components/`, or `lib/` imports this directory.**
  `lib/data.ts` (the only loader the pages/exports use) reads `data/seed/*` and
  nothing else, so candidates cannot reach public pages, `/api/export/*`,
  search, filters, or the production build.
- `npm run validate` proves this on every run: it fails if any build-graph file
  references `data/candidates`, and if any `candidateId` collides with a
  published id.

## What is tracked vs. private

| File | Tracked in git? | Purpose |
| --- | --- | --- |
| `candidates.example.json` | yes | Synthetic, illustrative records; the shape reference; validated in CI |
| `candidates.json` | **no** (git-ignored) | Your real working candidates — stays local until you promote |
| `README.md` | yes | This document |

Real candidate content is git-ignored so pre-publication drafts and reviewer
notes are never committed or deployed by accident. Add more private files as
`*.local.json` if you want (also ignored).

## Record shape

See `CandidateRecord` in `lib/types.ts`. Key parts:

- `candidateId` — unique, `cand-…` namespace; must not collide with any published id.
- `status` — `draft → in_review → verified → promoted` (or `rejected`).
- `proposedEvent` / `proposedFraming` / `proposedSources` — the payload being proposed
  (same shapes as the published entities; fields may be incomplete while `draft`).
- `verification` — the source-verifier's `verdict` and corrections.
- `classification` — proposed framing categories, `confidence` (high/medium/low), evidence.
- `reviewerNotes`, `openQuestions`.
- `promotion` — `promoted`, `promotedEventId`, `promotedAt`, `approvedBy`.

## Workflow

### 1. Add a candidate
Append a record to `data/candidates/candidates.json` with `status: "draft"`.
Minimum at draft: `candidateId`, `createdAt`, a `proposedEvent.jurisdiction`, and a
title (`proposedEvent.titleOriginal` or `titleEn`). The **policy-researcher** agent
produces this; it never invents missing fields.

### 2. Review
- Move to `status: "in_review"`.
- The **source-verifier** reads the full official source and sets
  `verification.verdict` (`verified` / `verified_with_corrections` /
  `insufficient_source` / `reject`) with `corrections`.
- The **policy-classifier** sets `classification.proposedFramingCategories`
  (existing taxonomy only), `confidence`, and `evidence`.
- Run `npm run validate` — verified candidates are held to the full published-field
  rules (complete event, resolving sources, allowed labels).

### 3. Reject
Set `status: "rejected"` and record why in `reviewerNotes`. Keep the record for the
audit trail (it stays private).

### 4. Promote (human-approved only)
Promotion is **manual and human-gated** — the AI agents never publish.
1. A maintainer approves a `verified` candidate.
2. Move its `proposedEvent` into `data/seed/events.json` with a real published `id`,
   its `proposedFraming` into `data/seed/framing.json`, and any `proposedSources`
   into `data/seed/sources.json` (dropping the `cand-` ids for published ids).
3. Set the candidate's `status: "promoted"`, `promotion.promoted: true`,
   `promotion.promotedEventId` to the new event id, `promotedAt`, and `approvedBy`.
4. Run `npm run validate` (gates both published and candidate rules) then
   `npm run lint && npm run typecheck && npm run build`.

Nothing is published until a human completes step 4 and commits/deploys.
