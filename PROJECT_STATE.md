# Project state

_Last updated: 2026-08-04 (repo housekeeping; no data or UI changes)._

## Branch

`ruflo-headroom-integration` — all integration and data work stays on this branch.
Nothing has been pushed, merged, or deployed.

## Latest commits

- `5767c20` Ignore graphify-out; track .graphifyignore; document Graphify navigation
- `df27e39` Surface framing categories at browse level (chips, filter, cross-links)
- `765e6b1` Recover interrupted session: move orphan sources to private candidates
- `ac6bf4b` Canonicalize JOGMEC source URL after site restructure
- `dfd3a1e` Complete framing coverage; code suspension primary (No. 70); add USGS antimony corroboration
- `3b4fcde` Validate material/jurisdiction eventIds stay in sync with events
- `66f1783` Add comparative control matrix (/compare)
- `0d8f1ab` Add verified record: China antimony export controls (Announcement No. 33/2024)

## What changed in this session

**Browse-level framing visibility** (UI only — no data, classification, or source
records touched). Official framing was previously visible only on event detail
pages and `/framing`; it is now discoverable while browsing:

- `lib/data.ts` — new `getFramingCategoriesByEvent()` loader: event id → its
  claims' category union, de-duplicated, in canonical taxonomy order. Every event
  is keyed; an event whose framing is not yet anchored gets an empty array
  ("not yet coded", never "no framing").
- `components/event-card.tsx` — `EventListItem` takes optional
  `framingCategories`: renders the existing `FramingBadges` markers under the
  mechanism row, or "Official framing not yet coded" when the array is empty.
  Undefined (profile pages) renders nothing — those call sites are unchanged.
- `components/events-explorer.tsx` — framing chips on every row plus a
  "Filter by framing category" select (options limited to categories present in
  the data, canonical order, short labels). Works with all existing filters;
  counted in `isFiltered`/reset; existing empty state covers zero matches.
  Filter grid is now `sm:2 / lg:3 / xl:7` columns so six controls stay clean on
  mobile. Footnote states framing markers are the government's official
  presentation, quoted not inferred, and do not restate legal effect; links
  to `/framing`.
- `components/timeline-view.tsx` — framing markers under each timeline node,
  linked to the category's `/framing#<category>` section; same methodology
  footnote, plus an explicit "no marker = not yet coded, not framing that does
  not exist" sentence.
- `components/labels.tsx` — `FramingBadge`/`FramingBadges` gained a `linked`
  prop (`/framing#<category>`); default rendering unchanged. Chips inside
  `EventListItem` stay unlinked because the whole row is already a link.
- `app/framing/page.tsx` — category sections now carry `id={category}` so the
  existing `scroll-mt-20` anchors actually resolve.
- `app/events/page.tsx`, `app/timeline/page.tsx` — pass the new prop.
- `tests/data.test.ts` — two new tests for the loader (coverage of every event,
  union correctness, de-duplication, canonical ordering).

No taxonomy change: the filter and chips reuse the eight existing
`FRAMING_CATEGORIES`, `framingCategoryShort` labels, and `FRAMING_HUES` tones.

## Checks

**Re-verified 2026-08-04** after four weeks idle, no drift: `npm run validate`
✓ (same counts as below), `npm run typecheck` ✓, `npm run lint` ✓,
`npm test` ✓ 36/36. `npm run build` not re-run — see the font-cache caveat
below.

Original run, 2026-07-10:

- `npm run validate` — ✓ 14 events · 15 framing claims · 11 materials ·
  6 jurisdictions · 30 sources · 4 candidates (private)
- `npm run lint` — ✓ clean
- `npm run typecheck` — ✓ clean
- `npm test` — ✓ 36/36 pass
- `npm run build` — ✓ static build succeeds (51 pages). Note: a sandboxed build
  cached failed Google-font fetches; `rm -rf .next node_modules/.cache` and a
  network-enabled rebuild fixed it.
- `npm run check:links` — 28 ok · 1 redirect (`src-fedreg-usgs-2025`) · 1 blocked
  405 (`src-usgs-news-2025`, USGS anti-bot) · 0 dead — same baseline as 2026-07-09.
  Back-to-back checker runs trip rate limiting and report false "dead" links;
  space runs out or trust curl spot-checks.
- Browser-verified on the dev server: chips render on `/events` rows and
  `/timeline` nodes; framing filter narrows correctly (leverage/retaliation → 1
  of 14) and combines with the actor filter into the empty state ("0 of 14",
  "No events match these filters."); `/framing#leverage_retaliation` scrolls to
  its section; mobile (375px) stacks cleanly; no console errors.

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

### Design/methodology points for maintainer judgment

- **Multi-claim flattening**: browse chips show the *union* of a record's framing
  categories across all claims, without per-actor attribution. On current data
  every claim's actor matches the event's jurisdiction, so nothing is misleading
  yet — but if a cross-actor claim is ever coded (e.g. a US framing claim on a
  Chinese measure), the flattened chips would silently mix actors. Decide whether
  to restrict browse chips to same-actor claims or annotate them at that point.
- **Framing filter semantics**: filtering by category matches events with *any*
  claim in that category (OR within an event's categories). Multi-select AND
  filtering was deliberately not built — single-select keeps the control compact.
- The `EventListItem` profile-page call sites (home, materials, actors) do not
  pass framing yet, so those lists show no framing row at all. Extending them is
  a one-line change per page if you want chips everywhere.

## Next recommended UI/UX task

The `/compare` matrix and profile-page event lists are now the only browse
surfaces without framing visibility. Either extend chips there (trivial via the
existing `framingCategories` prop), or move on to the roadmap data work — the
2023–2025 gallium/germanium/graphite event records — which would give the new
framing filter more to bite on.
