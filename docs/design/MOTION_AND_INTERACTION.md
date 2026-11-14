# Motion and interaction

This document sets the rules for motion on the SMPT website and records the first motion phase (13 November 2026,
branch `claude/smpt-motion-design-1ea91e`). It complements the Motion section of
`ARCHITECTURAL_RESEARCH_STUDIO.md`, which keeps the short version.

## Rules

1. **Motion states something the record states, or shows where the reader is.** Use it to show that a status
   changed, the order in which evidence arrived, or the section being read. Never use it to decorate a figure or
   make a page feel busy.
2. **No interpolation between data states.** A line that changes class is redrawn in its new class. It never
   morphs from one class into another, and no value is tweened between two dates. Lines are never sized by amount.
3. **The latest reading is the default.** Server HTML, the no-JavaScript view and the reduced-motion view all show
   the record as of `site.lastUpdated`. Anything that shows an earlier date waits for the reader to ask for it.
4. **Exhibits draw once, when they are seen.** An entrance runs when the figure enters the viewport, not on mount,
   and never again on scroll. A title block has a single page-load settle. Nothing else animates unprompted.
5. **The reader controls time.** Auto-play runs only after a button press. It advances one step at a time, stops
   at the latest reading, and stops as soon as the reader picks a date.
6. **No scroll-jacking and no layout shift.** Motion never scrolls the page, moves focus or resizes anything in
   the flow of the page. Lines and cards animate `transform`, `opacity` and `clip-path`; the section marker is an
   absolutely positioned pseudo-element whose length follows the current link. A sticky bar is part of the layout
   from the first paint, and focusable controls beneath it carry a scroll margin so focus never lands under it.
7. **Reduced motion means no movement.** Every animation and transition sits inside
   `@media (prefers-reduced-motion: no-preference)`, and the client enhancers return early under `reduce`. The
   state still changes (the selected date, the current section); only the movement goes. Print resets every
   entrance.
8. **Keyboard and screen readers get the same information.** Controls are real buttons with `aria-pressed`, a
   change is announced once in a polite live region, and the current section is `aria-current="location"`.

Timing grammar: entrances 560–900ms on `cubic-bezier(.2,.7,.2,1)`; state markers 200–420ms; colour changes
160–200ms; stagger 55–110ms per item. The one timed sequence, the replay, holds each step for 1.8s so a reader can
read the changed rows.

## What existed before this phase

| Motion | Where | Kept |
| --- | --- | --- |
| Title-block settle (`.settle`, 700ms, staggered) | Centred title blocks | Yes |
| `ScrollReveal` (`chart`, `cards`, `chain`) | Homepage, `/materials`, Market Monitor, FI002 featured exhibit | Yes |
| FI002 bars grow from zero on entry (`.exhibit-bar`) | Homepage featured analysis | Yes |
| Market Monitor coordinated emphasis (crosshair, hover panel, last-value tags, line reveal) | `/markets`, homepage preview | Yes, untouched |
| Supply-chain stage focus and element details | `/materials` | Yes |
| Reading progress bar | Research articles | Yes |
| `SiteMotion` scroll entrance | Every route except the homepage | Narrowed to result cards (see below) |
| Capital-flow line draw | Homepage, event pages | Rebuilt to run on entry |

## Audit findings

- `SiteMotion` (added in #254) faded in every `h1`, every `section`, every research `figure` and every dossier
  block. That contradicted the design rule of one page-load settle: record titles settled and then faded again,
  reading text waited on scroll, and the capital-flow exhibit's sub-sections faded independently of its own draw.
- The capital-flow draw ran on mount. On event pages the exhibit sits below the fold, so the animation had
  finished before anyone saw it.
- Record rails ("On this page") and the research section lists had no current-section state. On long event and
  research pages the rail could not tell the reader where they were.
- The exhibit had no way to show change. The model already supports an as-of date
  (`buildCapitalFlowModel(eventId, asOf)`), and 17 of the 35 drawn exhibits have status histories that change
  over time. The page showed only the final state, so the lapse of a private financing or the late arrival of a
  disbursement was invisible.
- The Market Monitor already has precise, data-tied interaction. Adding motion there would duplicate it.
- A JSX line break dropped a space in the homepage standfirst ("rising to416,000").

## Phase 1: what was built and why

### 1. Capital-flow status replay (signature interaction)

Files: `lib/capital-flow-timeline.ts`, `components/exhibits/capital-flow-replay-state.tsx`,
`components/exhibits/capital-flow-replay.tsx`, `components/exhibits/capital-flow-interactive.tsx`,
`components/exhibits/capital-flow.tsx`.

A "Status by date" bar above the drawing lists the dates on which the record's evidence changed a drawn line.
Choosing a date redraws the exhibit as the record stood then. Lines whose status changed at that date redraw once
and are labelled "Changed". "Replay changes" steps through every date and stops at the latest reading.

- **Step dates come from evidence, not from interpolation.** A step starts at a status entry's evidence boundary
  (`financialStatusEvidenceBoundary`): its own date, or for an undated entry the publication date of the source
  that evidences it. An undated status keeps its wording, for example "Disbursed, date not stated". Only drawn
  rows start steps; listed ceilings and budget lines follow the selected date but never add one.
- **A step says what kind of date it is.** A status's own date reads "Recorded by". The publication date of a
  source that reports an undated status reads "Reported on", and the date is tagged "Reported" in the bar. Where
  the source gives no publication date, SMPT's review or access date reads "Checked by", tagged "Checked". A note
  under the dates explains each tag in use. Where changes of both kinds fall on one date, the status's own date
  names the step, and each change below the dates and in the announcement carries its own kind of date. The
  basis comes from `financialStatusEvidence` in `lib/capital-control.ts`, the same fallback that sets the step date.
- **The layout is fixed.** Lanes keep the latest model's order at every step; only class and status change, so
  nothing jumps.
- **A row with no status yet reads "Not yet recorded".** It is drawn as a faint hairline with no marks. It is
  never given the "Status not stated" class, which means something different.
- **The key does not change under the reader.** It always lists the latest classes. After the reader picks a
  date, entries not drawn at that date are dimmed, and classes drawn only at earlier dates are listed separately
  under "Also drawn at earlier dates".
- **An exhibit with one reading has no controls.** 17 of the 35 exhibits get a replay, with up to five steps.
- On a figure wider than 48rem the date bar is sticky under the site header (its height is published as
  `--site-header-h`), so the dates stay in view while the lanes scroll. The bar publishes its own height as
  `--capflow-bar-h`, and every focusable control in the drawing takes that as `scroll-margin-top`, so a reader
  tabbing back up through the lines never lands under the bar.
- Without JavaScript the bar still lists the dates on which the status changed, but its buttons do nothing; the
  drawing shows the latest reading.
- Keyboard: Left/Right and Up/Down move one date, Home and End jump to the first and latest. Each change is
  announced once ("Status as recorded by 26 August 2025. Changed: …"). Nothing is announced before the reader
  interacts.

On the homepage MP Materials exhibit, the steps are 9 Jul 2025 (agreements), 10 Aug 2025 (Samarium loan
contracted), 26 Aug 2025 (bank financing lapses), 26 Feb 2026 (Samarium loan disbursed) and 7 Aug 2026 (preferred
equity disbursed).

### 2. Lines draw when the exhibit is seen

An `IntersectionObserver` on the diagram (threshold 0.15) sets `data-motion-ready` and then
`data-motion-entered`. Lines draw provider to recipient by `clip-path` (700ms, 70ms per lane) and end marks arrive
after their line. A changed line in the replay redraws at once (560ms) with no lane delay. The figure carries
`data-motion-kind="flow"`, so `SiteMotion` leaves it alone.

### 3. The current section on rails and research section lists

Files: `components/ui/section-spy.tsx`, `lib/section-spy.ts`, mounted once in `app/layout.tsx`.

The link to the section being read is set in ink and marked `aria-current="location"`. A malachite marker runs
along the list's own rule: the left rule of a vertical list, or the bottom rule of a single-row bar (Escondida).
The reading line sits 30% of the way down the area below the sticky header. A footer observer marks the last
section at the end of the page, and scrolling above the first section clears the mark. The enhancer only reads
positions: it adds no scroll listener and never scrolls the page or moves focus. It covers every record rail,
"Publication sections", "Report sections" and any `nav[data-section-nav]`. The Escondida section bar is now sticky
at 1024px and wider. Event pages list the exhibit in their rail as "Financing status".

### 4. Site-wide entrance limited to result cards

`lib/site-motion.ts` now targets only `[data-site-motion="card"]`, research index articles and material index
rows. Headings, sections, figures and dossier blocks render at once. **This partly reverses #254**: route
classification and the observer are unchanged, but the section, heading and figure reveals are gone.

### 5. Copy fix

"rising to 416,000 tonnes" in the homepage standfirst, guarded by `tests/featured-analysis.test.ts`.

## Suggestions from the brief

| Suggestion | Decision |
| --- | --- |
| Animated capital flows | **Modified.** Particles or flowing dashes would suggest money moving in proportion to something, and the exhibit never sizes by amount. Instead, lines draw once and the replay shows status changes by evidence date. |
| Milestone timelines | **Deferred.** Only eight reviewed project milestones exist; a timeline would be mostly empty. Revisit once more are reviewed. |
| Animated comparisons | **Rejected for phase 1.** Compare pages hold categorical labels and dated rows. Animating between them adds nothing a table does not show more precisely. |
| Scroll-linked exhibits | **Reinterpreted.** Scroll does not drive data. It marks the current section, and the replay's date bar stays in view while the lanes scroll. |
| Synchronized market interactions | **Not added.** The Market Monitor already links its crosshair, hover panel, navigator and tags. Linking prices to events is barred by hard rule 8. |
| Editorial transitions | **Deferred.** The Next.js documentation consulted ties view transitions to React 19.3; this repository is on React 19.2.4. |

My own concepts: the evidence-dated status replay, "Not yet recorded" as a distinct state, the fixed key with
earlier classes listed apart, the section marker on rails, and the change of the site-wide entrance to cards only.

## Verification (13 November 2026)

- Tests: `tests/capital-flow-replay.test.ts` (step dates and changed rows for MP, evidence boundaries for undated
  entries, lapse handling, last step equals the latest model across the corpus, ordering invariants, "Not yet
  recorded" rows on the G7 exhibit, key extras, default render with no change marks, single-reading exhibits with
  no controls, CSS guards, the focus scroll margin, event rail entry); `tests/section-spy.test.ts`; updated
  `tests/site-wide-motion.test.ts` and `tests/featured-analysis.test.ts`.
- Gates: `validate`, `typecheck`, `lint` (0 errors, 29 warnings that predate this branch), `build`,
  `editorial:check` (with `EDITORIAL_BASE_SHA` set to the merge base, as in CI) and the full test suite.
- Browser (Chromium): 16 routes at 1440 and 375px returned 200 with one `h1`, no horizontal overflow and no
  console errors. Checked: replay keyboard stepping, auto-play stopping at the latest reading, the sticky date bar,
  focus moving up through the drawing while the bar is stuck (no control hidden on the homepage, MP and G7
  exhibits), reduced-motion emulation (no animation or transition runs; lines fully drawn) and the section marker
  on event, Escondida and Tungsten pages. Screenshots: `docs/design/reviews/motion-phase-1/`.
- Not tested: a real screen reader, touch devices, Safari, Firefox, and a browser with JavaScript turned off (the
  server markup is covered by the render tests).

## Open for the maintainer

- Approve the partial reversal of #254 (headings, sections and figures no longer fade in).
- Approve the new interface copy: "Status by date", "Replay changes", "Changed", "Not yet recorded" ("No status is
  recorded for this line by the date shown."), "Also drawn at earlier dates", "Financing status". The strings were
  read against the house style's natural-language review; no editorial sign-off has been given.
- Confirm that an undated status entry may start a replay step at its source's publication date. The status text
  still says the date is not stated, and the step now reads "Reported on" (or "Checked by" for an SMPT review or
  access date) rather than "Recorded by".
- Approve the date-kind copy: "Reported on", "Checked by", the "Reported" and "Checked" tags, and the notes
  "Reported: the publication date of a source that reports a status without giving its date." and "Checked: the
  date SMPT reviewed the status or accessed its source, where neither the status nor the source is dated."

## Phase 2 backlog

1. Research cover view transitions from the index to the article, once React 19.3 is available.
2. Legend as filter: choosing a key entry emphasises those lines and dims the others, without hiding any.
3. FI002 featured exhibit: a base-case reference line that the stressed bars are read against.
4. Project milestone progression on `/projects/[id]`, once enough reviewed milestones exist.
5. Compare and explorer filters: announce the changed result count, and keep the reader's place when a filter
   removes cards above them. (Cards a filter adds already enter through `SiteMotion`.)
6. Sticky date bar refinements: a compact single-line form on narrow figures, and a check that it never covers
   an anchored heading.
