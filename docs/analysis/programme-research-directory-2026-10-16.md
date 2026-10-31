# Public Programme Directory — 2026-10-16

## Problem

SMPT publishes 12 source-backed programmes, including lending facilities, strategic reserves, grant programmes, tax incentives, multi-instrument frameworks and project-designation schemes. Previously /programmes displayed static jurisdiction groups without any way to locate a particular scheme by legal authority, administrator or its recorded evidence relationships.

## Improvement

Readers can now search programme names (including original-language names), legal authority, source-provided administrator and registry ID, then filter by government, programme type, named/unstated administrator and evidence relationship. Result counts, shareable URL parameters, responsive groups, keyboard links and no-result reset improve use without changing any policy or financial record. Complete unfiltered cards remain in the initial server-rendered HTML.

Each programme card shows **separate** stated envelopes (in original currencies/qualifiers), public-commitment row counts, other financial row counts and project-designation counts. All categorization and parent/child membership reuse the exact existing programmeLedger function. Each candidate is a programme, not a finance instrument. No capital or award totals are computed in this directory.

## Core integrity boundaries

- A named scheme ceiling, appropriation or lending authority is a stated upper envelope, **not** cash provided. It must not be summed with recipient commitments or divided to invent budget utilization.
- Existing recorded public-commitment rows may have different legal standings, including prospective or ended. The directory never calls all of them cash paid or government-caused industrial progress.
- Parent programme ledgers include child records; those entries are not additive across parent and child programme cards. Only the original underlying financial IDs can be used for aggregation via established finance accounting contracts.
- A project designation confers priority/recognition, not capital. No award is imputed from designation alone.
- A programme with no published finance/designation entry may nevertheless operate outside this curated corpus. Empty is not zero real-world activity.
- Missing source-named administrators remain unknown. Links to admins depend exclusively on canonical organization IDs, never inference from actor or jurisdiction.
- No source seeds, financing histories, M3/F5 milestone approvals, private casefiles, collectors, public API, export rows or release gates changed.

## Verification

Focused deterministic tests compare all programme directory entries against canonical programmeLedger ledgers, including parent/child overlaps and designation-only schemes; test exact actor/type/role/administrator filtering and missing/duplicated identity. A separate path-scoped Chromium workflow verifies original HTML and browser filtering, shareable URL restoration, empty states, keyboard navigation, and mobile/tablet/desktop breakpoints. All normal CI and deployment gates must pass before merging.
