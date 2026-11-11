# Site redesign and editorial overhaul: route review (November 2026)

Branch `claude/smpt-redesign-editorial-377bee`. Draft PR only; nothing merged or deployed.

**Scope.** This phase covers:

- a new homepage;
- a revised header and page-heading system, shared by every page;
- progressive disclosure on the five longest directory pages;
- one overflow fix on `/markets`;
- denser project cards.

It is **not** a full-site redesign. Most other routes inherit only the shared header and heading changes. The research index and articles are untouched (see "Research pages" below).

Screenshots are in [`redesign-2026-11/`](redesign-2026-11/). They come from the local dev server at 1440, 768, 390 and 320 px.

## What changed in shared components

| Component | Change | Reaches |
| --- | --- | --- |
| `components/site-header.tsx`, `lib/site.ts` | Publications (Research, Markets) sit before a divider, followed by the database journeys. The menu collapses below `xl`. | Every route |
| `PageHeading` in `components/ui/container.tsx` | Shared `.page-title` scale (smaller, semibold) with a shorter lead measure. | 25 index pages (see table) |
| `Section` | `id`, a record `count` in the heading, and an optional `collapsed` disclosure. The `h2` stays outside `<summary>` so it remains a heading for screen readers. | Opt-in. Used on `/capital` |
| `PageContents` (new) | An "On this page" jump-link row. | `/capital`, `/controls` |
| `ShowMore` / `useIncremental` (new) | Renders 25 rows at a time, with "Show N more" and "Show all". The count resets whenever a filter changes. | `/capital` financial explorer |
| `SourceCard compact` | Register row with: the title (linking to the dossier), an "Original" link, and one provenance line (publisher · type · language · published · accessed). Notes and the raw URL stay on the dossier. | `/sources` |

## Route-by-route

Status key:

- **Changed:** the page's own file was edited.
- **Inherited:** only the shared header, heading or section changes apply.
- **Reviewed, no change:** checked and deliberately left alone.
- **Deferred:** a known improvement is left for a later phase.

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Changed | Order: masthead with Latest research; FI002 Escondida featured analysis; database sections and materials in scope; market preview; examples; method and inquiry. The FI002 exhibit draws the four model requirements (199/275/333/416 ktpa) from `lib/fi002.ts` and labels them model-derived requirements, not forecasts. The hover-only element tiles were replaced by plain material-name links, which work on touch. |
| `/materials` | Changed | Now hosts the supply-chain strip and the material × stage lattice that used to sit on the homepage. |
| `/capital` | Changed | One-line summary, contents nav, then public commitments with counted rows collapsed per currency, then all records (incremental), the stage matrix, and the separately listed groups collapsed with counts. Every counting note, basis note and binding gloss is kept. 1440 px: 23,973 → 8,654 px tall. 390 px: 39,337 → 13,317. |
| `/sources` | Changed | Compact register rows. All 209 records still render (the QA gate requires it). 1440: 98,416 → 22,417. 390: 147,010 → 38,713. |
| `/framing` | Changed | The category legend doubles as jump links. Six quotations per category stay open; the rest sit behind "Show N more quotations". Ornamental "01" numbering removed. The lead keeps the qualifier that a stated rationale is not evidence of effect. 1440: 26,362 → 9,251. 390: 60,358 → 19,737. |
| `/controls` | Changed | One-line summary, contents nav. The clause list now follows the stated-end-date finding instead of coming last. The matrix heading was renamed from "Who uses which tool". |
| `/markets` | Changed (fix only) | Hover labels on right-hand material tiles caused horizontal scroll at 390 px (434 px of content in a 390 px viewport). They now anchor right by column. There is no overflow at 320, 390, 430, 768, 1024 or 1440. |
| `/projects` | Changed | Denser cards (three columns at `xl`, smaller padding, no mono metadata). All 110 records still render (QA gate). 1440: 14,711 → 10,054. 390: 31,165 → 26,045. |
| `/events` | Inherited · Deferred | The list prerenders every event by design (`events-explorer.tsx` comment), so incremental rendering was not applied. |
| `/organizations` | Inherited · Reviewed, no change | Rows are already compact. All 134 records must render (QA gate). |
| `/programmes`, `/portfolios`, `/interplay`, `/response`, `/compare`, `/projects/compare`, `/timeline`, `/watchlist`, `/coverage`, `/data`, `/search`, `/saved`, `/about`, `/actors` | Inherited | Header and heading scale only. |
| `/methodology` | Inherited · Deferred | Long (24,469 px at 390). It is the reference page; contents navigation is a candidate for the next phase. |
| `/actors/[code]`, `/events/[id]`, `/capital/[id]`, `/controls/[id]`, `/projects/[id]`, `/programmes/[id]`, `/organizations/[id]`, `/sources/[id]` | Inherited | Header and `Section` heading style. Detail content unchanged. |
| `/materials/[slug]` | Inherited · Deferred | The dossier components are unchanged. Progressive disclosure there is a candidate for the next phase (gallium: 21,302 px at 390). |
| `/research` and the five articles | Header only | See below. |

## Research pages

`npm run editorial:check` binds `app/research/page.tsx` and each article to a hash-recorded human review. Editing them would require a new human review, so this phase leaves every research file unchanged. They pick up the new header and nothing else. The homepage links to them through the Latest research list and the FI002 feature.

## Constraints observed

- **QA count gates.** `scripts/qa-*-browser.mjs` requires every `source-record`, `project-record` and `organization-record` to render, so those lists are denser but never truncated. The source register keeps `#source-query`, `#source-cited`, "Show all sources", "Clear filters" and the `/sources/src-*` dossier links. The reading-key `details` stay keyboard operable.
- **No data changes.** No file under `data/`, no calculation in `lib/capital-*`, and no research finding or frozen publication artefact changed.
- **No claimed credentials.** The inquiry band describes research inquiries without implying a client base.

## Verification

All results below are for this branch.

**Repository checks**

- `npm test`: 1,224/1,224 pass.
- `npm run validate`, `npm run lint` and `npm run typecheck` all pass.
- `npm run build` exits 0 with no errors or warnings.
- `editorial:check` against the merge base: no research page or review record changed.

**Browser checks** (dev server)

- Every page in the matrix (12 routes × 4 widths) has one `h1`, no horizontal overflow and no page errors.
- QA-equivalent assertions run in the browser:
  - projects 110/110, organizations 134/134 and sources 209/209 at 390 and 1440;
  - source search and clear filters work;
  - the capital and projects reading keys open by keyboard;
  - `/capital/fin-jp-jare-lynas-2023-equity` has no overflow at 375 or 1440.
- Interactions:
  - the mobile menu opens, Escape closes it and focus returns to the button;
  - capital disclosures open with Enter;
  - "Show 25 more" goes from 25 to 50 of 109, and "Show all" removes the control;
  - framing disclosures open by keyboard.

**Not run locally.** The `scripts/qa-*-browser.mjs` scripts import the `playwright` npm package, which this checkout does not have. CI runs them.
