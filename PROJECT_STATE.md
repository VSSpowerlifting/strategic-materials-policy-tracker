# Project state

_Last updated: 2026-07-09 (recovery session after the previous session hit its usage limit)._

## Branch

`ruflo-headroom-integration` — all integration and data work stays on this branch.
Nothing has been pushed, merged, or deployed.

## Latest commits

- `ac6bf4b` Canonicalize JOGMEC source URL after site restructure
- `dfd3a1e` Complete framing coverage; code suspension primary (No. 70); add USGS antimony corroboration
- `3b4fcde` Validate material/jurisdiction eventIds stay in sync with events
- `66f1783` Add comparative control matrix (/compare)
- `0d8f1ab` Add verified record: China antimony export controls (Announcement No. 33/2024)

## What changed in this session

The previous session was interrupted mid-task with one uncommitted edit: three new
entries appended to `data/seed/sources.json` (China State Council Decree No. 785
rare-earth regulations; Cabinet Office ESPA supply-chain page; METI critical-minerals
policy PDF). All three were **orphan sources** — no event or framing claim referenced
them, which would have contradicted the `/sources` page's claim that every register
entry backs a record.

Recovery actions taken:

- **Reverted** the `data/seed/sources.json` edit (public register unchanged).
- **Preserved** the three sources — including the prior session's direct-inspection
  notes verbatim — as two `status: "draft"` records in the private, git-ignored
  `data/candidates/candidates.json`:
  - `cand-cn-re-admin-regulations-2024` — Rare Earth Administration Regulations
    (State Council Decree No. 785, signed 2024-06-22, effective 2024-10-01).
  - `cand-jp-espa-critical-minerals-2022` — Japan ESPA designation of specified
    critical materials (critical minerals, permanent magnets). Left dateless: only
    "December 2022" is recorded; the cabinet-order promulgation date is unconfirmed.
- No public data, framing, or UI files were changed. Framing coverage, the antimony
  record, and JOGMEC source canonicalization were already committed before the
  interruption — nothing to finish there.

## Checks (all run 2026-07-09)

- `npm run validate` — ✓ 14 events · 15 framing claims · 11 materials ·
  6 jurisdictions · 30 sources · 4 candidates (private)
- `npm run lint` — ✓ clean
- `npm run typecheck` — ✓ clean
- `npm test` — ✓ 34/34 pass
- `npm run build` — ✓ static build succeeds
- `npm run check:links` — 28 ok · 1 redirect (`src-fedreg-usgs-2025`, Federal
  Register anti-bot interstitial) · 1 blocked 405 (`src-usgs-news-2025`, USGS
  anti-bot) · 0 dead. Both flagged as verify-in-browser, not failures.

## Unresolved issues

- **Japan ESPA candidate**: exact promulgation/effective date of the December 2022
  cabinet order (e-Gov `504CO0000000394`) must be verified against the official text;
  choice of anchoring instrument (cabinet order vs. METI 取組方針) is open; source
  verification and classification not yet done.
- **Decree 785 candidate**: source-verifier pass and framing classification pending;
  mechanism choice from the existing taxonomy is open.
- `src-usgs-news-2025` and `src-fedreg-usgs-2025` should be spot-checked manually in
  a browser (anti-bot responses to the link checker).
- Roadmap items still open (from CLAUDE.md): dedicated event records for the
  2023–2025 gallium/germanium, graphite controls beyond what is already coded, and
  remaining `"Not yet coded"` original-language titles.

## Next recommended UI/UX task

Framing coverage is now complete (`dfd3a1e`), but framing is only visible on event
detail pages. Surface it at browse level: add compact framing-category chips (reuse
the existing badge tones from `lib/labels.ts`) to the event cards in
`EventsExplorer` and `TimelineView`, with a framing-category filter alongside the
existing mechanism/jurisdiction filters. This makes the project's signature
dataset — official framing language — discoverable without opening each record.
