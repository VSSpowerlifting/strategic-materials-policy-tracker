# Public project directory usability and evidence discipline — 2026-10-16

The original `/projects` directory showed all 76 curated projects in an unfilterable card list, unlike events and capital. The public record also has direct financing links, explicitly nonallocative shared funding associations and project designations. None of these categories alone establishes industrial progress or policy causation.

## Reader experience

The `/projects` page now supports full-text search (project name, sponsor, location, notes, tracked material labels), tracked material, supply-chain stage, country, government-commitment presence and separate relationship filters. All filters intersect (AND), while a polymetallic/multicountry project still appears only once. Country, stage and material can be explicitly "not stated" rather than guessed. A result count, clear-filters control, empty-result guidance and shareable URL parameters `q`, `material`, `stage`, `country`, `government`, `relationship` make the curated registry browsable. Full unfiltered cards remain prerendered in the HTML so search engines can index the corpus without JavaScript.

## Semantics

- "Government commitment evidenced" means a **directly linked** financial row with `valueRole: commitment`, a government provider jurisdiction, and non-ended, source-evidenced legal standing at `site.lastUpdated`. The engine and evidence boundary come from existing `buildIndustrialResponse`, not a second author-written status classifier.
- "Direct finance" includes finance rows of any value role and status; it is not a claim of signed, paid or government capital.
- "Shared, unallocated" is an explicit `associatedProjectIds` link and carries *no* project-specific allocated amount, government backing or capitalization.
- "Designation" means source-linked recognition/priority, not a financing award.
- "No qualifying government commitment recorded" describes the dataset, never what may or may not exist beyond the tracker.
- Projects with missing stages, materials or country remain inspectable. No stage/material/country inference is made from finance or policy records.
- No project-native construction or output milestone is derived from legacy financier status. Private M3/F5 reviews remain unpublished.
- The publication is a usability improvement for existing **reviewed public registry records**, not new source evidence, a full historical comparison, or a causal score.

## Verification

Unit tests compare the full directory's government commitment subset against `/response` project-by-project; verify duplicate/shared link nonallocation, overlapping designations, search and filter semantics, unknown attributes, shuffled input determinism and broken sponsor identity. A separate path-filtered Chromium job exercises static HTML, deep-linked filters after reload, blank search, keyboard navigation, mobile/tablet/desktop sizing and unchanged code/seed files.

## Non-goals

No new seeds, financing amounts/statuses, source dates, review approvals, API schema, CSV fields, live collectors or Observatory publication. No open PR #86/#130/#132/#133/#134 touched. Public `/projects/[id]` and data exports remain independently intact.
