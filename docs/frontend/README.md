# Frontend: research journeys and navigation (2026-10-31)

This note covers the navigation and homepage overhaul on `claude/smpt-frontend-overhaul-335dcc`, branched from `main` at `66ad5f5`. It records what was wrong, the direction chosen, the conventions new pages should follow, and what this pass left alone.

No record, taxonomy, classification, status, review decision, financial calculation, API contract, export or validation rule was changed. Every count on the homepage comes from the existing `getDatasetSummary()`.

## Diagnosis (before)

Screenshots: `screenshots/before-*.png`.

1. **The header was organized around the site's internal modules, not reader questions.** It had five inline tabs: Overview, Explore, Compare, Projects and Methodology. Beside them, a "Research tools" disclosure panel listed all 21 `navGroups` destinations (`before-research-tools-1440.png`). "Explore" was current for ten unrelated sections, among them events, capital, controls, sources and search. A reader could not tell which page answered "who is paying for what" and which answered "what is restricted".
2. **Which item was current was unreliable.** `/watchlist`, `/coverage` and `/data` marked no tab at all. Every current link, including a section tab while the reader was on a detail page, carried `aria-current="page"`.
3. **The homepage opened on a dense, full-width material × stage lattice** (`before-home-1440.png`). That is a powerful tool for an expert, but it is opaque as a first screen, and the page never said what kinds of question SMPT can answer.
4. **Detail pages had no consistent route back.** Some had a bare "← All events" link, others nothing. Event pages repeated Status and Mechanism in the sidebar right below the same badges under the title.
5. **Numbered section indices ("01", "05") drifted.** A section that rendered conditionally left gaps in the sequence.

## Direction

**Five research journeys, each a question the corpus can answer.** The header holds those five questions, not twenty pages. A journey's own views appear in a second row only while the reader is inside it (progressive disclosure, no mega-menu). Every existing URL is preserved.

The visual identity is unchanged: warm charcoal ground, cream paper bands and gold accent, set in Newsreader, Archivo and JetBrains Mono. No dependency was added, and every route stays statically generated.

## Journeys map (`lib/site.ts` → `journeys`)

| Journey | Landing | Question | Views (second header row) |
|---|---|---|---|
| Government action | `/events` | What have governments decided, and in what legal form? | `/events`, `/timeline`, `/controls`, `/framing`, `/actors`, `/materials`, `/watchlist` |
| Public capital | `/capital` | Which public money and instruments are committed, and at what status? | `/capital`, `/programmes`, `/organizations` |
| Projects | `/projects` | What does the record show for one industrial project? | `/projects` |
| Compare | `/compare` | How do approaches differ across governments and supply-chain stages? | `/compare`, `/portfolios`, `/interplay`, `/response` |
| Evidence | `/sources` | Where does each claim come from, and what does the corpus leave out? | `/sources`, `/methodology`, `/coverage`, `/data` |

The search box, `/saved` and `/about` are utilities and stay outside the journeys. `navGroups`, `nav`, `primaryNav` and `secondaryNav` are unchanged, so the footer, sitemap and any other consumers see the same list as before.

**Adding a page:** add it to exactly one journey's `views`. The test `tests/navigation-journeys.test.ts` fails if any page in `nav` belongs to zero or two journeys, or if a journey link points at a route that does not exist.

## Conventions

### `aria-current`

- `"page"` only on a link whose `href` is exactly the current path.
- `"true"` on the journey (header) and view (second row) that contain the current page. This covers detail routes: `/capital/fin-…` marks Public capital and Financial commitments with `"true"`.
- Nothing otherwise.

`isNavCurrent` / `isActivePath` in `lib/site.ts` match whole path segments, so `/eventsfoo` matches nothing.

### Breadcrumbs (`components/ui/breadcrumbs.tsx`)

- Rendered as `<nav aria-label="Breadcrumb">` around an ordered list. Earlier items are links. The last item is a plain `<span aria-current="page">` and never a link. Separators are `aria-hidden`.
- The first crumb names the **journey** ("Government action", "Public capital", "Evidence"), so the trail and the header use the same words.
- `PageHeading` accepts `breadcrumbs`. When it is given, the trail replaces the eyebrow kicker, so a page states its place once.
- Long titles truncate with an ellipsis on narrow screens. The full title remains in the `<h1>`.
- Applied to events, actors, sources, organizations and programmes detail pages. Capital and project detail pages are deliberately left out (see *Overlap*).

### Homepage (`app/page.tsx`)

The page answers its questions in reading order:

1. **What SMPT is.** The hero, followed by "Scope and freshness": the curated-revision date, a statement that coverage is selective and uneven, and four counts. These are policy events, financial instruments, registered projects and reviewed industrial observations, with a link to `/coverage`. These are the same four figures the previous homepage showed. Because the brief rules out vanity stats, they are set at body size as scope metadata, not as headline numerals, and sit beside their qualification. No totals or ratios were added, and the test asserts that the page has exactly four `<dd>`.
2. **What you can investigate.** The five journeys and their questions.
3. **Try a worked question.** The existing `getInvestigationEntries()` examples.
4. **Or browse by material and stage.** The existing lattice, unchanged, now reached after orientation.
5. **Start with a material.** Links to `/events?material=…`.
6. **Records, not articles.** How evidence is layered, with links to the methodology and the data.

### Section numbering

`AtlasIndex` and `Section` still accept `index` so existing callers compile, but they no longer draw it.

## Responsive and accessibility results

These checks ran on a production build (`next build && next start`) in a browser at 375, 768 and 1440 px.

- **Overflow.** No horizontal overflow on the home page (all three widths), on an event detail page (375 and 1440), or on `/capital` and `/events` (1440).
- **Small-screen menu.** Below `lg` the header collapses into one disclosure. It lists Overview, the five journeys with their questions, then Search, Saved and About. It closes on Escape (returning focus to the toggle), on an outside click or focus, on navigation, and when any of its links is tapped, including the link to the page already open. Its height leaves room for the sticky bar and, inside a journey, the views row too, so its last link can always scroll into view. At 375×667 on `/events`, the last link ends at 626px. Inside a journey, the second row scrolls horizontally within itself.
- **Console.** Zero console errors or warnings on the production build.
- **Not done.** No automated axe or Lighthouse pass was run. Screen-reader testing was limited to checking the markup.

## Screenshot index (`screenshots/`)

| Before | After |
|---|---|
| `before-home-1440.png` | `after-home-1440.png` (full page) |
| `before-home-768.png` | `after-home-768.png` |
| `before-home-375.png` | `after-home-375.png` |
| `before-menu-375.png` | `after-menu-375.png` |
| `before-event-1440.png` | `after-event-1440.png`, `after-event-375.png` |
| `before-capital-1440.png` | `after-capital-1440.png` |
| `before-events-1440.png` | `after-events-1440.png` |
| `before-research-tools-1440.png` | (panel removed; see the second header row in any `after-*` capture) |

## Overlap with open PRs

- **#166 (project comparison)**: touches `app/projects/*` and `app/sitemap.ts`. This pass does not edit those files. `/projects/compare` is already current under Projects through segment matching. If #166 adds a new top-level route, add it to one journey's `views`.
- **#164 (saved events)**: no shared files. `/saved` stays a header utility.
- **#162 (finance legibility)**: touches `app/capital/*`, `app/programmes/page.tsx` and `app/methodology/page.tsx`. This pass edits only `app/programmes/[id]/page.tsx`, for the breadcrumb, and leaves `app/capital/[id]` without one so the two PRs do not conflict. Add the capital breadcrumb after #162 lands.

## Limitations and follow-ups

- Breadcrumbs are not yet on `/capital/[id]`, `/projects/[id]` or `/materials/[slug]`, because those files overlap the PRs above or carry their own header layout.
- The journey views are a navigation grouping, not a methodology claim. "Compare" groups pages that share an analytical purpose, not a single data model.
- The lattice itself was not redesigned. Its density on phones is unchanged from `main`.
- **Data and methodology issues:** none were found that this pass needed to touch, and none were changed.
