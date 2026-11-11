# Site-wide readability and editorial audit — November 2026

## Goal

Make SMPT understandable on first visit and readable throughout. Prioritize published research and the task a reader came to complete. Preserve all research records, original links, legal-status distinctions, financing-counting rules, and downloadable evidence.

## Rules for every public route

1. Put the main task or finding above definitions, corpus diagnostics, and technical qualifications.
2. Write page introductions as one sentence where possible. Lead with the actor, instrument, amount, date or practical reader action.
3. Show summaries first; provide methods, classifications and source detail through descriptive links or accessible disclosure controls.
4. Avoid repeating source caveats on every card. Keep substantive qualifications where they change an interpretation; link to the full evidence and method.
5. Use Archivo throughout the UI; normal reading copy should not be 10–11px. Reserve small text for optional provenance details.
6. Keep the main header focused on Research, Markets, Policy, Capital, Projects and Compare. Secondary routes must stay reachable from More, search, and page-level links.
7. Prefer a single dominant graphic or tool per viewport. Charts must retain axes, units, source dates, and reduced-motion support.
8. Test at 320px, 390px, 768px, 1024px and 1440px; verify keyboard access, interactive disclosures, scrolling, focus visibility, and no clipped tables.
9. Do not modify frozen research outputs or the corpus under a design/editorial PR.

## Phase 1 — focused reading-order foundation

- [x] Homepage: research-first introduction, compact market preview and focused entry links; move the lattice and supply-chain breakdown to their dedicated tools
- [x] Navigation: direct Research and Markets access and an accessible More disclosure for specialist views
- [x] Capital: search first; advanced funding summaries, counts, classifications and status definitions remain available on demand
- [x] Projects: project directory and filters before terminology
- [x] Shared headings, footer and language: lighter hierarchy, fewer redundant messages, consistent Archivo in lattice details
- [x] Update the tests that specified old homepage ordering rather than deleting evidence-integrity assertions
- [ ] CI checks and screenshots: verify actual PR head before marking ready or merging

## Phase 2 — deep-page cleanup (separate engineering session / PR)

- [ ] Markets: chart-first interface; simpler benchmark selection; accessible secondary panels for specifications, heatmap, raw values, licensing and coverage
- [ ] Material dossiers: reduce repeated stage-record presentation, add quick navigation to Policy, Capital, Projects and Sources, and verify responsive markup does not duplicate visible content
- [ ] Individual capital, control, project, event, programme and organization records: make the summary legible before raw field inventories, without removing evidence
- [ ] Compare, portfolios, interplay, framing, response, timeline and coverage: simplify page introductions and visual hierarchy without changing the underlying models
- [ ] Research index and article pages: editorial pass on titles, summary text and long-form reading layouts; comply with existing research review/attestation process
- [ ] Methods, sources, data, search and watchlist: trim repeated UI explanations, standardize help labels and make detailed references accessible when needed
- [ ] Run a site-wide copy inventory covering source strings, generated labels, metadata, tooltips and empty states; extend editorial regression checks beyond /research while preserving valid legal negatives
- [ ] QA each affected route on desktop and mobile, including keyboard interaction, screen readers, responsive data tables and source links

## Acceptance gate

- A visitor can reach the latest research, a market chart or a relevant records search without first reading a glossary.
- No public route exposes redundant full-document explanations when a brief summary and accessible evidence link suffice.
- All research sources, numbers, dates, finance/legal state distinctions, exports and routes still work.
- The changed tests plus lint/typecheck/build and the full suite pass.
- Rendered screenshots at mobile and desktop widths receive an actual editorial/design review. Build success alone is insufficient.
