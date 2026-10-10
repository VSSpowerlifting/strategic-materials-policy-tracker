# F5 O3a — Private Industrial Outcome Observatory UI contract
**October 9, 2026 · internal view components only · NO PUBLIC RELEASE**

## Delivered

`components/observatory/private-observatory-review.tsx` provides a **stateless, React server-renderable**, structurally accessible design for four current-corpus projects. It consumes only the existing `F5ObservatoryScaffold` produced by `lib/f5-observatory-scaffold.ts`; it never reads M3 private-review files, calls external models, fetches any remote publisher, alters seed data, or writes state.

- `<PrivateObservatoryReview model={scaffold} />`: internal document heading, corpus clock and manuscript warning, responsive cross-project evidence-coverage table, four casefiles, and release-blocker footer.
- `<PrivateObservatoryCasefile item={case} />`: project identity and bounded research question; visibly labeled source-review gate; four separate lanes (policy, finance, designations and physical evidence); deduplicated source/provenance index.
- **Policy lane:** linked parent events are descriptive contexts only. It does not import project-unrelated control clauses or draw policy-to-outcome causal arrows.
- **Finance lane:** distinct instrument and recorded status history (not disbursement derived by UI); directly attributable instrument reference versus nonallocative association; no amount, currency conversion, grand total or package double count. Legacy financier progress notes are disclosed as *unreviewed counts*, not native project outcomes.
- **Designation lane:** formal recognition; emphatically not money. The source and status are linked where recorded.
- **Physical lane:** occurred and planned project-native rows only, with source quote/pinpoint/review metadata and correctly labeled null occurrence or target date. A source publication date or reviewer date cannot fill an unknown physical day.
- **Provenance index:** genuine registered source URLs, publication/access clocks and source-lane roles. External link targets open with `noopener noreferrer`; unsafe, user-credential-embedded or non-HTTP(S) links fail closed.
- **Empty states:** `No reviewed occurred physical milestone is registered` explicitly means missing reviewed evidence, **not** a failed, inactive or delayed industrial project.
- **Release flags:** components reject an Observatory model carrying authorization, policy causality, historical money totals or independently approved editorial claims. No launch controls exist.

Existing Lattice Register theme tokens and Tailwind breakpoints are reused; two-column casefile lanes only appear at `lg`, source index at `sm`, and the comparison table scrolls horizontally at narrow widths with a keyboard-focusable labeled region. Semantic `h1`/casefile `h2`/lane `h3` hierarchy, table caption and scoped headers, focus-visible outlines, internal jump links and native ordered lists provide an accessible baseline. **These tests are not a replacement for actual browser/device or screen-reader QA.**

## Confirmed nonpublication boundary

There is deliberately **no** `app/observatory`, `app/pathways`, public API, route, navigation change, sitemap reference or static dataset export in this PR. No input seeds, monitors, currencies, project classifications or `site.lastUpdated` change. The React component has no public URL and is **not** deployed as a browsable site; a green preview build proves compilation only.

The current public project-milestone seed remains `[]`, and seven original-source candidate reviews still await real human action (five canonical, two taxonomy blocked). The empty physical lane is an accurate status of *the reviewed evidence register*, not a claim about real-world construction.

## Machine checks

`tests/f5-observatory-private-ui.test.ts` exercises actual `react-dom/server` static HTML rendering from the real curated corpus:

- Four casefiles and their unique landmark/heading IDs, scrollable comparison table, keyboard navigation affordances and responsive layout classes
- Correct four-lane separation, external-source links with secure target attributes, readable empty-state warnings and registered financing status references
- Synthetic physical milestone fixture with an **unknown event day** but known *issuer publication* and review dates; no automatic publication
- Strict failure on unauthorized model flags and unsafe source URLs
- Deterministic render order and no corpus mutation; no app/ route or public nav injection

Required exact-head repository checks: production dependency audit, seeded data validation, typecheck, lint, full tests and Next production build. CI passing is necessary for integration, **not** for public source approval or final visual accessibility signoff.

## O3b / O4 work remaining

1. Add an **explicitly local-only, gitignored browser-preview harness** for the rendered component (not a production page). Use the actual bundled Lattice Register stylesheet or a scoped build asset; no public deployment URLs or unreviewed release claims.
2. Perform and record **manual browser QA** at 320px, 768px and 1440px; ensure horizontal scroll/focus is usable, no overflow/overlapping source text, touch labels and link targets work.
3. Perform **keyboard-only tab order** and screen-reader headings/table check; check color contrast on the real rendered page, not merely class names.
4. Verify live original-source HTTP destinations and exact source pinpoints, distinguishing legitimate source unavailability from proof the claim is wrong.
5. Human adjudicate Alcoa, Narva, Stibnite and Thompson Falls; only then propose native seed milestone records in separate PRs with real reviewer attestations and independently approved curated corpus cutoff.
6. Only after positive reviews and manual responsive/a11y release receipt, propose any `/observatory` page, source-visible casefile detail route, sitemap and navigation changes in a separate **maintainer-approved** release PR.

**Stopping point:** the private casefile UI is a correct architectural bridge from F5-O0 casefile contracts to future O4 public research. It neither fabricates missing source review nor prematurely publishes claims.
