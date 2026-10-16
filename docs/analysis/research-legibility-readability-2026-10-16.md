# Research legibility pass — October 16, 2026

## Purpose

SMPT's dark gold-and-graphite "Lattice Register" palette is visually coherent, but users encounter too much small, low-priority monospace labelling in the same visual plane as the research. Before this change, section headings in the shared `Section` component were 11px uppercase mono, data labels in `Fact` were 11px, evidence tables imposed a four-column 36rem layout on narrow viewports, the source-document URL was presented as the primary action, and filters were small 14px fields (which can cause zoom on iOS).

The aim is **more readable hierarchy without flattening provenance nuance**. No new design system, colours, fonts, editorial statuses or record transformations.

## Implementation

1. **Section headings:** headings become visually primary 20–22px Archivo while numerical sequence becomes a secondary gold mono reference. Section explanation is 15px with 28px line height and more contrast/space. Semantic `h2` hierarchy remains intact. Existing page headings/branding unchanged.
2. **Record facts:** paired labels increase to 12px bold Archivo (not tiny tracked capitals), body values 15px with 28px line height, rows have increased vertical rhythm and long content wraps safely.
3. **Evidence provenance:** mobile evidence tables become individually labelled, full-information citation cards with original-document links, exact supported fields, directness, precise locator, notes and a source dossier link; tablet/desktop keep a semantic native four-column table with captions, 12px readable headers, slightly more padding and dossiers. Only the **responsive presentation** differs; both layouts render the exact same published evidence input.
4. **Filters and badges:** 44px minimum select/search controls, 16px mobile field text to prevent platform zoom, 12px labels and visibly larger badge baselines. Existing shareable URL filters and IDs do not change.
5. **Source register cards:** larger titles and record notes, an explicit "Open original document" action (full URL remains printed), and easier-to-focus source-dossier links.
6. **Keyboard/text:** consistent visible 2px gold focus outline for native interactive elements, conservative text wraps, original palette and existing reduced-motion safeguards.

## Integrity and scope

No financing, project, programme, organization, source, control, export or API data changed. No M3/F5 research or reviewer workflow changed, and no interference with PR #160's unpublished Programme Evidence Trails. All changes are shared read-only UI components and their tests. The original source URL is preserved as an external link, and precise field-level provenance is preserved on phone and desktop.

## Measurable QA

- Unit contract tests verify existing exact URLs/links, semantic headings, responsive complete evidence fields, gold focus controls, and token-based contrast (text contrast at least 4.5:1 against the project's dark surfaces).
- Dedicated pinned Chromium QA checks actual typography and legibility on 320px, 375px, 768px and 1440px viewports; mobile citation cards vs desktop native table; complete document URLs; filter hit targets, keyboard focus, no page horizontal overflow and real navigation from capital citation to source dossier.
- All existing CI data validation, TypeScript, lint, production Next build and applicable source/other Chromium tests still run. Vercel preview must be successful before merge; a build-rate quota is an external blocker rather than a waiver of the release gate.

## Follow-on

This targeted change addresses readability rather than editorial density or vocabulary. A later independently reviewed copy pass can add concise plain-language explanations for specialized finance terms; do not silently change what a recorded financial status means.
