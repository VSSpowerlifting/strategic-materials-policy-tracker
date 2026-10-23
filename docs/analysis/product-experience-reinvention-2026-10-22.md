# SMPT research product experience

Revision: 2026-10-23. Original reference/base: `084078f3150089d933aa6f510723f10c64ebaa59`.
Continues reviewed head `a2492e8433978003b6852339241d01bf5ae57b11` on
`codex/smpt-product-experience-reinvention`, existing draft PR #181.

## Final direction

Restore Lattice Register: warm charcoal `#12110f`, card `#1a1814`, cream
`#f5f3ee`, gold `#e3b04b`, and the established three semantic marks. Remove the
navy body override. Raise faint text slightly to `#a39b8e` for AA contrast across
actual dark surfaces; cream-panel swatches gain an outline. Preserve the supplied
logo and the existing Newsreader, Archivo and JetBrains Mono families.

The opening pairs a compact 40px desktop Newsreader introduction with the existing
React/SVG/HTML-table lattice. A selected-cell summary and real evidence/project
links sit beside it. The complete selected-record panel follows, retaining
separate counts, funding options, ended rows and off-lattice explanations. Mobile
uses a material selector and readable stage buttons with a selected check mark,
then the same record panel. No modal, new chart engine or arbitrary project-pair
comparison. Keep the three investigations, material entry points, bounded corpus
coverage and reuse/methodology links below the opening.

The shell retains Overview, Explore, Compare, Projects and Methodology. Combine
the two former secondary bars on small screens; keep About in the mobile menu,
Data/API visible and specialist tools available. Use Archivo for analytical
controls, legends and instrument details; Newsreader for editorial headings and
reading. The skip link moves focus without replacing analytical URL state.

## Shared analytical query

`lib/research-query.ts` is browser-safe and deterministic. Home and Compare use
one URL-backed query through the same hook and record panel. It delegates counted
records to the existing `cellView` and authoritative lattice model; `cellKey` now
lives in browser-safe view logic rather than importing seed composition at runtime.

Supported state: `material` + `stage`, `government`, `kind`; canonical links retain
legacy `#material:stage` selection and encode filters in the query string.
Governments accept canonical IDs or their short codes, case-insensitively, then
serialize canonical IDs. Kinds are all, commitments, controls, designations, their three pairwise
combinations, or none, preserving existing kind visibility. No state selects the supported gallium/processing cell by default. Explicit
empty cells stay empty. Unknown, empty, conflicting, incomplete or repeated
analytical parameters produce visible errors and no selected records. Unrelated
query parameters survive interaction; standard focus/section anchors are exempt.
Browser Back, sharing and reload retain the analytical state.

Government means provider for commitments, issuer for clauses, designating
government for designations, never project geography. Counted IDs, options and
ended records are separate. Off-lattice records and related context do not inflate
counts. Project links come only from explicit financial `projectId`, separately
labelled nonallocative `associatedProjectIds`, or designation links. Controls
acquire no inferred project relationship from shared material or timing.

Example: gallium × processing → inspect the six commitments, one control clause
and one designation separately → follow a Wagerup financial project reference →
inspect its three direct instruments and one published groundbreaking observation
→ open original sources or download that investigation. Those project records
are a supported subset of cell evidence, not the cell's total.

## Public investigation projection and JSON

`getPublicProjectInvestigation` keeps the authoritative `projectStack` and
`buildProjectEvidencePathway`, and adds `packet` from
`buildPublicInvestigationPacket`. Financial chronology, policy context, native
milestones and unknowns on the actual page consume this shared projection.
Existing capital-stack calculations remain independent and unchanged.

Additive, read-only, statically generated resource:
`GET /api/v1/projects/[id]/investigation`. It returns UTF-8 JSON with attachment
filename `smpt-[projectId]-investigation.json`; unknown or unpublished IDs return
404. All public project IDs are generated at build time. The existing project
registry/stack endpoint and every existing dataset/CSV contract retain their
meaning. The Data/API page documents the new resource and links an example.

Projection version: `smpt-investigation-1`. Explicitly selected public fields:
project identity/materials/stages/locations, recorded organization roles, direct
instruments, distinct nonallocative associations, exact decimal amount strings
and original currency/qualifier/wording, financial histories, terms and
conditions, planned source-stated outcomes, legacy financier observations,
designations, parent policy context, announcement-sibling controls, published
native milestones and scope caveats, package references, field locators,
resolving source URLs, specific unknowns and analytical limitations.

No wholesale stack/pathway/internal-object serialization. Exclude lifecycle
maintenance metadata, adjudications, reviewer packets, filesystem paths and
unsupported fields. Milestone reviewer attribution is already legitimately
public in the existing register and is explicitly selected. The projection
preserves current corpus revision and legal-status cutoff `2026-10-17`; source
publication/access, status, occurrence, target and review clocks remain distinct.
No environment-dependent timestamp, historical known-as-of claim, historical
financial totals, invented project allocation or causal effect.

## Discovery and cost

The demonstrated search gap was `Wagerup groundbreaking`. Enrich existing project
search metadata with only published milestone wording and IDs; projects with
published claims link to their stable `#project-industrial` section. Preserve the
eleven existing search kinds, canonical identities, exact document identifiers,
original-language matching and registered organization names/aliases. No fuzzy
matching, private evidence import, milestone route or second index.

One local composition measurement: lattice ~9.2ms, public Wagerup investigation
~3.9ms; serialized lattice 91,557 bytes (12,356 gzip), packet 16,679 bytes
(4,142 gzip). These are bounded local observations, not production benchmarks.
The client receives the thin lattice display model, not the packet or full
financial histories. Packet composition occurs on the server/build path. No
additional cache, backend service or dependency was needed.

## Verification and review

- `npm run validate`: passed with existing incomplete-framing warnings. Published
  corpus remains 65 events, 96 instruments, 45 clauses, 76 projects and one native
  reviewed milestone. No research record or publication decision changed.
- `npm run typecheck`: passed.
- `npm run lint`: passed; nine pre-existing warnings in unchanged scripts/tests.
- `npm test`: **1,029 passed, zero failed**. Added all-cell ID reconciliation,
  URL normalization/roundtrip/error cases, government roles, page/packet byte
  parity, source resolution, amount/condition/undated history preservation,
  nonallocative treatment, unknown IDs, nested private-field sentinels, exact
  search discovery and a browser-safe import boundary. Updated an obsolete
  page-source regex to exercise actual public milestone rendering.
- `npm run build`: passed. The existing vulnerable-version reminder initially
  returned `SecurityFatalError`; the same ordinary command succeeded on retry.
  No bypass flags, dependency, CI or deployment configuration changes.
- Production-build Playwright: passed at **1440×900, 768×900, 390×900**, with
  reduced motion. Exercised material/stage keyboard and mobile selection,
  separate counts, government filtering, context transfer to Compare, Back,
  reload, invalid and empty cells, project links, financial/industrial evidence,
  actual JSON download bytes and filename, sources/citations, exact milestone
  search to its real investigation, skip-link focus/URL preservation, menus and
  Escape/focus return, plus 11 legacy routes. Captured and checked Overview,
  Explore, Compare, Wagerup/Stibnite, About, Methodology and Data/API for page
  overflow. Browser page-error collection was empty.
- Fonts awaited before screenshots. Chromium platform-font inspection confirmed
  custom Newsreader on the headline, Archivo on controls at all three widths,
  and JetBrains Mono on the visible desktop data token. No fallback accepted.

The original production layout was captured afresh at 1440×900 after fonts were
ready; it still matches the original reference implementation. Revised captures
use the same desktop viewport. Visual inspection confirms the restored warm
identity, subordinate headline, substantial first-screen interactive matrix,
selected evidence links, readable legend/conditions and retained project journeys.
Mobile presents usable analytical controls instead of miniaturized columns.

[Original production reference, 1440×900](product-experience/production-before.png) ·
[Revised overview, 1440×900](product-experience/overview-desktop.png) ·
[Revised mobile overview](product-experience/overview-mobile.png) ·
[Wagerup investigation](product-experience/wagerup-desktop.png).

Screenshots are generated QA artifacts, not research evidence. Source URLs were
compared with the stored public references; this is not a new publisher-source
verification. Representative responsive/keyboard checks are not a complete
accessibility certification. Full local screenshots and logs are retained outside
the checkout.

## Delivery limits

`npm audit --omit=dev --audit-level=moderate` still fails on unchanged Next.js
16.4.0 (critical/high advisories; npm suggests 16.4.2). Security remediation remains
a separate merge prerequisite. Exact final-head remote CI is reported in PR #181;
local success is not claimed as remote success or preview verification.

No changes to seed/research stores, eligibility, validators, source quotations,
financial calculations, legal standing, corpus dates, private evidence or existing
API/export schemas. The two stale unrouted-library comments were corrected;
comments grant no publication authority. Narva release #180, arbitrary project
comparison #166, finance guidance #162 and CSV security #167 remain separate.
No merge, production deployment, global CLI upgrade or monitoring activation.
