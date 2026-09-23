# Project state

_Last updated: 2026-09-23 (v0.5 released: PR #5 merged to `main` as `7ddb62c`; v0.6 work starts on `feat/capital-intelligence-v06`)._

## Release reconciliation: v0.5 is on `main`

- PR #5 ("Capital & Control: source-verified capital and control platform
  (v0.5)") was merged on 2026-09-23 at 22:38 UTC as
  `7ddb62ca6891cb9e517db1b5e8d570b890a3ba7b` (PR head `2dee471`). The `main`
  CI run for that commit passed. The session notes below still say "not
  merged"; they describe the state before the merge.
- `main` is clean at `7ddb62c`. The Phase 3 session worktree under
  `~/.claude/worktrees/` no longer exists; `git worktree prune` has been run
  in the main checkout.
- `graphify update .` was run at `7ddb62c` (969 nodes, 2,869 edges, 52
  communities; `graphify-out/` is git-ignored, so no tracked file changed).
  Its god nodes are the `lib/data.ts` loaders (`getAllEvents`,
  `getAllControlMeasures`, `getAllFinancialCommitments`), `formatDate` and
  `site`, which matches the architecture described in CLAUDE.md. The seed
  JSON files produce no nodes: the extractor reads code, not data, so the
  graph says nothing about the corpus itself.
- The open items listed under "Open items" below are still open.

## Latest session: v0.5 Capital & Control — platform release (Phase 3)

Branch `feat/capital-control-platform`, from `main` at `f55762d` (the Phase 2
merge). The worktree lives at
`/Users/benjaminyang/.claude/worktrees/smpt-platform-launch-d4e51a/smpt-capital-control`
(moved there from `strategic-materials-policy-tracker-worktrees/` because the
session's write guard only allows edits under its own worktree path).

### Data (all verified against official primaries or binding filings, 2026-09-23)

- 39 financial commitments and 32 control clauses across 25 events. Counts
  are derived on /coverage, /data and /methodology; do not pin them here.
- Backfilled onto existing events: DoD–MP Materials (8-K and OSC release,
  read in a browser; OSC notes corrected), OBBBA OSC credit subsidy and
  lending authority, Australia's CMSR and Critical Minerals Facility, the
  CMPTI tax offset, Canada's CMS envelope and CMRDD awards, India's NCMM,
  the UK CMS fund and NWF–Tungsten West, JARE–Lynas, JOGMEC–Lofdal; MOFCOM
  Nos. 23/2023, 39/2023, 33/2024, 46/2024 (with No. 72/2025 suspension),
  10/2025, 18/2025, 61/2025 (six clauses) and 70/2025, Decree 785, the
  anti-smuggling campaign, the three ICA divestiture orders, the DoD–MP
  contractual covenants and the EO 14272 section 232 investigation.
- New events: Proclamation 11001 (section 232 outcome, 14 Jan 2026); the
  US–Australia critical minerals Framework (20 Oct 2025); OSC's conditional
  loans to Vulcan Elements and ReElement (21 Nov 2025); the US active anode
  material AD/CVD investigations (ended with a negative ITC determination,
  31 Mar 2026). Six new sources, three framing anchors.

### Vocabulary changes (maintainer decisions recorded in the correction pass)

- `POLICY_STATUSES` + `ended` (used by the AD/CVD event).
- `FINANCIAL_INSTRUMENTS` + `mixed` (one amount over several named
  instruments, no split: CMF, CMSR, NWF package, US–AU envelopes).
- `CONTROL_STATUSES` + `concluded` (the EO 14272 and AD/CVD investigations).
- Approved: the three above. Not approved: `CONTROL_MEASURE_TYPES` +
  `trade_negotiation` — removed with its only row (see below).
- `VALUE_ROLES` + `funding_option` (the DoD–MP USD 350M option), added in
  the correction pass under the maintainer's instruction to choose a durable
  representation for that option.

### Platform

- `lib/capital-control.ts` (+ `lib/decimal.ts`, `lib/capital-control-summary.ts`):
  counting rules, exact decimals, relationship graph, statuses as of
  `site.lastUpdated`, chronology, clocks, material interplay, summaries.
- Pages: `/capital`, `/capital/[id]`, `/controls`, `/controls/[id]`,
  `/interplay`; Capital & Control sections on event, material, actor and
  home pages; search indexes both entities; methodology gains
  `#capital-counting` with definitions; nav adds Capital, Controls,
  Interplay (Saved and About move to the footer via `secondaryNav`).
- API: `/api/v1/financial-commitments[/id]`, `/api/v1/control-measures[/id]`,
  `/api/v1/capital-control/summary`. Exports: four new CSVs; the dataset
  JSON carries both entities and the summary.
- Tests: `tests/capital-control-analytics.test.ts` (counting rules on
  fixtures and on the corpus, decimals, statuses over time, exports); the
  schema, validation and search tests were updated for a populated corpus.

### Review fixes (commit f7b0383 and after)

- Capital is credited to a government only through `providerJurisdiction`;
  bank financing, MP's own cash and the US–AU project pipeline show as
  "not government capital" and sit in no actor lane or matrix.
- Public totals are split into binding (contracted or paid) and not yet
  binding (announced to decided, incl. conditional and non-binding) on
  /capital, the home page and the summary API.
- The two NRCan releases were re-read in full in a browser; one
  `amountAsStated` quote was corrected to the source's exact wording.

### Correction pass before merge

- Proclamation 11001 is an event, not a control measure: it directs
  negotiations and imposes no tariff, quota or licensing rule. Its
  negotiation-mandate row and `trade_negotiation` are gone. The EO 14272
  investigation's `concluded` entry still cites it; `/controls/[id]` links
  that entry to the proclamation event, and the event page shows the
  control status it records (derived from shared sources, no new field).
- The USD 350M DoD–MP option is `valueRole: "funding_option"`: listed, never
  summed. Its status stays `contracted` (the agreement is executed); its
  terms quote the 8-K's option and bank-alternative wording and the 45-day
  election window (re-read in a browser 2026-09-23). /capital and the detail
  page show three steps (agreement executed, exercise, disbursement), with
  "none recorded in the corpus" where the corpus is silent. An exercise
  would be coded as its own commitment `drawn_from` the option. The summary
  API lists it under `fundingOptionsListedNotSummed`.
- `CurrencyTotal` is a union on `status`: `"summed"` carries the sums;
  `"withheld"` (counted rows share a descendant) carries `reason`,
  `overlap` and null sums. Pages, the home card and the summary follow it.
- The option is labelled as a funding option wherever its status appears:
  row badges, the detail page, the interplay ledger and chronology tooltip.
- Header: the 15-link scrolling strip is replaced by grouped navigation.
  Desktop shows eight primary links (Events, Timeline, Framing, Capital,
  Controls, Interplay, Materials, Actors), a "More" disclosure and Search;
  small screens show Search and a "Menu" disclosure with four groups
  (Capital & Control second). Escape closes and returns focus; navigation,
  outside click and focus leaving close it.
- The AD/CVD event's missing-framing warning stays: the three documents read
  (two Commerce initiations, the ITC final notice) are procedural and
  legal findings, not government framing, and quoting them as framing would
  break the framing/legal-language separation.

### PR and release state

- PR: https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/5
  (base `main` at `f55762d`; not merged). Checks: GitHub `validate`
  (validate, typecheck, lint, test, build) passing; Vercel preview passing
  after one redeploy that cleared a transient `next/font/google` fetch
  failure unrelated to this branch.
- Local gates after the correction pass: validate (0 errors, 6 existing-kind
  warnings), typecheck, lint, 213 tests, build (387 pages); 375px sweep of
  all 144 sitemap pages; header checked at 375, 768, 1024 and 1440px.
  Correction commits on top of `b35132c`: `4b811a8` (integrity pass) and the
  follow-up advisor fix (duplicate event-page section; option labels in the
  interplay ledger, chronology tooltip and status trail). The final head SHA
  is in the PR. No dev or prod servers left running.
- Housekeeping: after the session, run `git worktree prune` in the main
  checkout; the session worktree
  `/Users/benjaminyang/.claude/worktrees/smpt-platform-launch-d4e51a`
  (a worktree of the home-directory repo) holds this branch's worktree,
  with its `node_modules` and `.next`, as an untracked directory.

### Open items

- Commerce's final AD/CVD determinations and any termination notice were
  not read; the event cites only the initiations and the ITC final notice.
- The MOFCOM No. 61 Annex 1 (.wps) is still unread; the extraterritorial
  clauses say so.
- Whether MP exercised the $350 million option with DoD or used the bank
  alternative is not recorded; no later primary in the corpus states it.
- The No. 61 suspension ends 10 Nov 2026 and No. 46's Item 2 suspension
  27 Nov 2026: the validator will warn after those dates until a source
  records what followed.
- `graphify update .` not run.

Next action: review and merge the Phase 3 PR; then the next expansion
(EU RESourceEU and CRMA strategic projects, Japan ESPA support, Canadian SIF
awards, China's Nos. 55–58 and 62).

## Previous session: v0.5 Capital & Control — Phase 2 runtime validation

Branch `feat/capital-control-validation`, from `main` at `060ab08` (the Phase 1
merge). Validation infrastructure only: no Capital & Control records, no API,
export, page or analytics change, and both seed files are still `[]`.

- `scripts/validate-capital-control.ts` (new): a pure validator. It takes the
  parsed seed arrays, the corpus they reference and an injected `today`, and
  returns structured issues (`code`, `recordId`, `index`, `field`, `message`);
  it never reads files or exits. It holds the shared field-to-evidence maps
  (moved out of the Phase 1 test) and one checker each for canonical decimal
  strings, ISO-format currency and country codes, calendar dates and target
  dates.
- `scripts/validate-data.ts`: parses both seed files, runs the validator with
  the corpus and the ids of private candidates, prints its errors and
  warnings, and adds both counts to the summary line (0 financial commitments
  · 0 control measures). The five existing warnings are unchanged.
- Enforced: shape against `lib/types.ts` (required and unknown fields, JSON
  types, blank strings, vocabularies); `fin-`/`ctl-` ids, unique across the
  dataset and sorted; events, sources, materials, jurisdictions,
  relationships, legal bases and modified measures that resolve, and no
  candidate id; materials within the event's; stage allocation, material
  attribution and target scopes consistent with what is recorded; non-empty
  financial and control status histories (the implementation history may be
  empty), with dated entries oldest first; `until` only on scheduled,
  suspended or in-force entries and never before its entry; no self-links,
  duplicates or cycles among relationships or modifications; coherent term
  and outcome figures; evidence for every populated field group, none for an
  empty one, and the same source's evidence for each term, outcome,
  relationship and status entry. One warning: the current control status's
  `until` has passed, so the record needs review.
- Tests: `tests/capital-control-validation.test.ts` (34 tests on in-memory
  fixtures, including runs of the validator entry point on the real seeds and
  on a temporary invalid copy); `tests/capital-control-schema.test.ts` now
  imports the evidence maps instead of keeping its own.

Decided in this phase (to revisit only when Phase 3 evidence requires it):

- A relationship is a (commitment, type) pair: the same link stated by a
  second source is a duplicate, and that source goes in `evidence`. A product
  code is a (system, code) pair with one role.
- Currency and country codes are checked for format, not against a registry:
  the repository has no trustworthy ISO list, and no dependency was added.
- `until` is allowed on `scheduled`, `suspended` and `in_force`, as the
  schema's own comment describes; the lapsed-`until` warning uses the UTC date.
- A term with a figure needs a qualifier and a currency or unit; an outcome
  with a figure needs a qualifier; a term or outcome without a figure carries
  no qualifier, currency or unit.

Not done here: `graphify update .` was skipped, since it would change files
outside this task. The Phase 0 source issues below are still open.

Next action: review and merge the Phase 2 PR, then Phase 3, the
source-verified backfill of both seed files under these rules.

## Previous session: v0.5 Capital & Control — Phase 0 merged, Phase 1 data model

### Phase 0: source-backed corrections (merged)

- PR #2, "Correct source-backed policy details", was squash-merged to `main` as
  `4d18c3b` on 2026-09-23. It corrected eight event records against their cited
  official sources: MOFCOM No. 61's suspension timing, JOGMEC–Lynas, the source
  of the ICA divestiture's nationality attribution, the NWF–Tungsten West
  wording, the Australian reserve's publication date and inaccessible-page
  claims, CAD labels on the two Canadian funding events, and the UK strategy's
  up-to-£50 million fund. Public counts unchanged: 32 events, 56 sources, 36
  framing claims, 11 materials, 8 jurisdictions.
- Post-merge CI passed. The production deployment came from the Vercel GitHub
  integration (`dpl_FP6Z7aCak2x5nX86k7RhVEwFpGS5`, source `git`, commit
  `4d18c3b`, READY) and was verified route by route.
- Still open: the `src-nrcan-cmrdd-2024` source note shows unlabelled "$"
  amounts; `datePublished` is null on `src-au-industry-cmsr` and
  `src-gowling-ca-divest`; the pmc.gov.au page is bot-blocked; the MOFCOM No. 61
  annex (.wps) is unread.

### Phase 1: Capital & Control data model (PR #3, merged)

- PR #3, "Add Capital & Control data model", was merged to `main` on
  2026-09-23 as `060ab085c606839952e3e53039c5f65b62c6b4da`.
- `lib/types.ts`: two child entities of `PolicyEvent`, `FinancialCommitment`
  (`fin-*`) and `ControlMeasure` (`ctl-*`), with 23 controlled vocabularies, a
  decimal-string `MonetaryAmount`, arrays of `InstrumentTerm` and
  `StatedOutcome`, source-linked status histories (financial, implementation,
  control) and typed field-level `EvidenceReference`s. `PolicyEvent` is unchanged.
- Review corrections (second commit on PR #3): typed `relationships`
  (`part_of` / `drawn_from`, each naming its source) replace the single
  `parentId`, so one amount can be part of a reserve and drawn from a separate
  facility at once; `relationships` and `facility` are evidence fields and
  `parent` is gone; `ControlMeasure` keeps the end users and end uses it
  targets in the source's words (`targetEndUsersAsStated`,
  `targetEndUsesAsStated`); the schema test derives public counts from the
  seed files instead of pinning them.
- `data/seed/financial-commitments.json` and `data/seed/control-measures.json`:
  both `[]`.
- `lib/data.ts`: six read-only loaders (all, by id and by event, for each
  entity), ordered by code-point id. Not wired into the API, exports or pages.
- `lib/labels.ts`: exactly one label per vocabulary value.
- Docs: the methodology scope section (instrument-term boundary and the Capital
  & Control rules), README and CLAUDE.md.
- `tests/capital-control-schema.test.ts`: vocabularies and labels, empty seeds,
  loader determinism, unknown ids, event getters, public counts derived from
  the seed files (no pinned numbers), candidate isolation across every public
  loader, reserved prefixes, field-to-evidence coverage for both entities, a
  record that is both `part_of` and `drawn_from`, stated end users and end
  uses, and compile-time checks that money is a string and no derivable field
  is stored.

Decided in review:

- Relationships are read from the record that holds them: this commitment is
  `part_of` or `drawn_from` the one it names. There are no inverse types.
  Phase 2 validates resolution, self-links, duplicates and cycles.
- `unit` stays source-preserving free text for the initial backfill. A
  controlled unit list waits until repeated real values show a stable set.
- A binding securities filing or official first-party recipient disclosure may
  support explicit contract, financing, capacity or implementation facts it
  states directly. It cannot on its own establish government rationale or
  framing, an unstated government status, speculative valuation, market-price
  estimates or unsupported projections, and it stays attributed to its speaker
  through `evidence` and `statedBy`.

Phase 2 rules to write (now written; see the Phase 2 session above): canonical decimal strings and ISO codes, `materialIds`
within the event's materials, evidence covering every populated field
(including each relationship's source), relationships that resolve with no
self-links, duplicates or cycles, `targetScopes` consistent with the stated end
users and end uses, and chronological status histories.

Next action at the time, since done: the Phase 1 PR was merged as `060ab08`, and
Phase 2 (validator rules for the two entities, seed files still empty) followed.

## Latest session: Candidate promotion (Canada, China, UK) + framing QA + commit prep

Still on `ruflo-headroom-integration`, still uncommitted going into this session.
This session ran a strict promotion-gate review of the 9 candidates researched
in the prior session, re-verifying each against its official primary source
directly rather than trusting prior summaries or AI-extracted quotes. Two real
factual corrections came out of that review: a Chinese transcription typo in
the anti-smuggling candidate's summary (`夫藏走私` → `夹藏走私`), and a UK
mechanism/sector miscoding (`offtake_agreement` dropped because the source
itself says the offtake is being negotiated separately, not concluded; `energy`
added to sectors because the source names it explicitly). The UK quote
attribution to "John Healey, Chancellor of the Exchequer" — initially flagged
as likely wrong from general background knowledge — was checked against two
independent live official sources (the National Wealth Fund release and
gov.uk's own Ministers listing) and found to be **correct**: a UK cabinet
reshuffle has evidently occurred since this project's Jan-2026 knowledge
baseline, and the original candidate record was right.

### Promotion (human-approved this session)

Three of the seven `verified_with_corrections` candidates were approved and
promoted into the public seed; the fourth (`cand-us-cfius-emcore-hiefo-2026`)
was verified but deliberately kept private because its affected material
(indium phosphide) sits outside the tracker's material taxonomy — publishing
it with an empty `affectedMaterialIds` would misrepresent scope. The other
three researched candidates (Japan ESPA date/element detail, Australia Iluka
current-status, Australia Northern Minerals investor list) and the two
insufficient-source candidates (India, EU) stayed on hold; see the prior
session's section below for exactly why each is blocked.

| Candidate | Public event | Source added | Framing added |
| --- | --- | --- | --- |
| `cand-ca-nrcan-cmrdd-2024` | `evt-ca-nrcan-cmrdd-2024` | `src-nrcan-cmrdd-2024` | `fc-ca-cmrdd-resilience` |
| `cand-cn-antismuggling-campaign-2025` | `evt-cn-antismuggling-campaign-2025` | `src-mofcom-antismuggling-2025` | `fc-cn-antismuggling-natsec` |
| `cand-uk-nwf-tungsten-west-2026` | `evt-uk-nwf-tungsten-west-2026` | `src-nwf-tungsten-west-2026` | `fc-uk-nwf-natsec` |

Canada: `rare-earth-elements` + `graphite` only (not `ndfeb-magnets` — the
source names "permanent magnets" generically, not NdFeB specifically). China:
all five materials the MOFCOM notice names explicitly (gallium, germanium,
antimony, tungsten, rare-earth-elements), both `customs_enforcement` and
`export_control`. UK: `tungsten` only, mechanism `funding` only. Material and
jurisdiction `eventIds` cross-references were updated for all three and
verified exactly in sync with the validator's own back-reference check
(`rare-earth-elements`, `graphite`, `gallium`, `germanium`, `antimony`,
`tungsten`; `canada`, `china`, `uk`).

### Bounded QA pass, before commit

- Re-audited this and the prior session's exact contribution to the 5 touched
  seed files, `scripts/validate-data.ts`, and the 2 new candidate-count-fix
  files, isolating it from other sessions' still-uncommitted work in the same
  files — confirmed no unrelated change in any of them.
- Re-fetched the Canada and UK primary sources directly and evaluated every
  direct quotation in each against the framing methodology (government
  speaker required; exact quotation required; narrowest defensible category).
  Added two claims that had been left uncoded pending this check:
  `fc-ca-cmrdd-resilience` (Minister Jonathan Wilkinson, `supply_chain_resilience`,
  on "address gaps in our world-leading supply chain") and `fc-uk-nwf-natsec`
  (Chancellor John Healey, `national_security`, on "we are living in a more
  dangerous world..."). A second UK quote (Business Secretary Jonathan
  Reynolds — plausibly `economic_security`/`supply_chain_resilience`) was
  deliberately left uncoded to keep each fix to the single narrowest
  defensible claim; a maintainer can add it separately.
- Fixed the candidate-count reporting quirk: `scripts/candidate-files.ts`
  (`isExampleCandidateFile`) now excludes `candidates.example.json`'s 2
  fixture records from the private-candidate count the validator reports.
  It previously read "13 candidates (private)" (11 real + 2 example fixtures,
  conflated); it now reads "11 candidates (private) (+2 example fixtures,
  schema-checked, not counted)". Regression test: `tests/candidate-files.test.ts`.
- Confirmed zero candidate-data leakage into `/api/export/*`, `/api/v1/*`, or
  the production build; confirmed every new id is unique and every source/
  event/material/jurisdiction/framing backlink resolves in both directions.

### Checks (this session, after promotion + QA)

- `npm run validate` — ✓ 32 events (32 verified · 0 provisional · 1 monitored) ·
  36 framing claims · 11 materials · 8 jurisdictions · 56 sources ·
  10/10 watched active · 11 candidates (private) (+2 example fixtures,
  schema-checked, not counted). Same 5 pre-existing warnings as before, all
  for framework instruments that genuinely name no material rather than an
  uncoded gap: `evt-ca-ica-divest-2022`, `evt-cn-ecl-2020`,
  `evt-cn-decree-792-2024`, `evt-jp-espa-2022`, `evt-in-ncmm-2025`.
- `npm run typecheck` — ✓ clean.
- `npm run lint` — ✓ clean.
- `npm test` — ✓ **104/104** (3 new: `tests/candidate-files.test.ts`).
- `npm run build` — ✓ all pages prerendered, including the 3 new event
  detail pages and their framing anchors.
- `git diff --check` — ✓ clean.

Public counts moved 29 → 32 events, 33 → 36 framing claims, 53 → 56 sources;
materials (11) and jurisdictions (8) unchanged. `customs_enforcement` moved
0 → 1; `investment_screening` stayed at 1 (the US candidate was not promoted).

## Previous session: Search/watchlist/citation completion + 9 researched candidates

Still on `ruflo-headroom-integration`, still uncommitted, still undeployed. This
session verified the branch's actual state rather than trusting the figures it
was given (14 events / 31 sources was stale; the real count was already 29 /
53 from prior uncommitted sessions), audited the existing search/watchlist/
citation/API work, finished what was incomplete, and researched 9 candidate
measures for the private candidate queue. **No factual public record was
edited.** `data/candidates/*` is git-ignored and reaches no public output.

### Objective 1 audit findings and fixes

- **Citation (`lib/citation.ts`, `CiteBlock`, `/api/cite/*`)** — already
  complete and well-tested; no changes needed.
- **`app/sitemap.ts`** — found and fixed a real duplication bug: `/search`
  and `/coverage` were listed both via `nav.map(...)` and via separate
  explicit `entry(...)` calls left over from before those routes were added
  to `nav`, so the sitemap emitted each URL twice. Removed the stale explicit
  entries.
- **Search (`lib/search.ts`, `/search`)** — already indexed every record
  type including original-language text, but had only a record-type filter
  and did not write its state back to the URL (so a search page URL was not
  actually shareable after the reader changed anything). Extended `SearchDoc`
  with `jurisdiction` and `mechanisms` fields (populated per record kind),
  added Actor and Mechanism filter dropdowns to `SearchExplorer`, and added
  the same `history.replaceState` URL-mirroring pattern the events explorer
  already established (`q`, `kind`, `actor`, `mechanism` params). Filters now
  compose with the text query, including with an empty query (browsing "all
  China records" is now a valid search on its own).
- **A personal watchlist did not actually exist.** The pre-existing
  `/watchlist` is a project-curated registry of *sources under standing
  review* (`data/seed/watchlist.json`) — a transparency feature, not a
  per-reader saved-events list. Objective 1 asked for the latter, which had
  to be built from scratch: `lib/watchlist-client.ts` (localStorage-backed,
  no account, no server, exports pure list helpers plus a
  subscribe/localStorage layer), `components/save-event-button.tsx` (wired
  into the event detail page header), and `components/saved-events-explorer.tsx`
  + `app/saved/page.tsx` (view, remove, clear, and copy-as-JSON/CSV/BibTeX/
  plain-citation, reusing `lib/citation.ts` and a newly-parameterised
  `eventsCsv(events?)` from `lib/export.ts` rather than inventing a new
  export format). Named "Saved events" throughout — deliberately not
  "watchlist" — to avoid conflating it with the existing project feature.
  Added `/saved` to `nav`, right after `/search`.
- **Bug found and fixed during this work**: an em-dash was mistakenly written
  as the literal six characters `\u2014` inside JSX text (rather than a real
  — or a `{"\u2014"}` expression) in `app/saved/page.tsx`'s lead copy.
  Caught by reading the rendered page text, not by the type checker (JSX text
  content isn't escape-processed the way a JS string literal is). Fixed.
- **Tests added**: `tests/watchlist-client.test.ts` (pure list-logic:
  `addId`/`removeId`/`toggleId`/`parseStoredIds`), three new tests in
  `tests/search.test.ts` (jurisdiction/mechanism fields populate correctly
  per kind), two new tests in `tests/export.test.ts` (`eventsCsv(subset)`
  keeps the same columns/quoting and handles an empty subset). 101/101 passing.

### Browser verification

Search: combined text+actor+mechanism filtering confirmed correct (counts
narrowed as expected across a three-filter combination); reloading a URL with
all three params restored the exact same filtered view. Saved events: save/
remove/clear all confirmed via click and via keyboard Tab-to-element (a
`computer`-tool synthetic Enter/Space keypress did **not** trigger button
activation in this browser-automation environment — confirmed against a
pre-existing, unrelated button too, so this is a tooling limitation, not an
app defect; native `<button>` elements are keyboard-activatable by HTML spec
regardless). Persistence survived a hard reload. Copy-to-clipboard could not
be observed succeeding for either the new Saved-events buttons or the
pre-existing `CiteBlock` copy button — this automation environment denies
clipboard-write permission outright (`navigator.clipboard.writeText` throws
"Write permission denied" even called directly from the console), affecting
old and new code identically. No page-level horizontal overflow at 375px on
`/search` or `/saved`. No console errors beyond the dev server's own
webpack-HMR websocket noise (present on every route, unrelated to this work).

### Objective 2: nine candidates researched into `data/candidates/candidates.json`

Also rejected one stale draft (`cand-cn-re-admin-regulations-2024`): the same
measure (State Council Decree No. 785) was independently published as
`evt-cn-decree-785-2024` by the historical-backfill session without going
through this candidate, so it is now marked `rejected` as a duplicate rather
than a factual problem.

| candidateId | actor | mechanism(s) | verdict |
| --- | --- | --- | --- |
| `cand-jp-espa-critical-minerals-2022` (updated) | japan | designation, supply_chain_security | verified_with_corrections |
| `cand-au-iluka-cmf-2022` | australia | funding | verified_with_corrections |
| `cand-au-northern-minerals-divest-2024` | australia | investment_screening | verified_with_corrections |
| `cand-in-mmdr-amendment-2023` | india | designation, supply_chain_security | insufficient_source |
| `cand-ca-nrcan-cmrdd-2024` | canada | funding | verified_with_corrections |
| `cand-eu-crma-strategic-projects-2025` | eu | designation, supply_chain_security | insufficient_source |
| `cand-cn-antismuggling-campaign-2025` | china | customs_enforcement, export_control | verified_with_corrections |
| `cand-us-cfius-emcore-hiefo-2026` | us | investment_screening | verified_with_corrections |
| `cand-uk-nwf-tungsten-west-2026` | uk | funding, offtake_agreement | verified_with_corrections |

All 8 jurisdictions are represented; `customs_enforcement` (previously zero
events in the whole corpus) and `investment_screening` (previously one) are
both strengthened. Two sources (EC presscorner, e-Gov/METI PDF) were blocked
by JS-rendering or 403 to this session's fetch tool — documented per
existing project convention (matching the war.gov/Federal Register notes
already in this file) rather than treated as a research dead end. One
proposed framing claim (China) carries an AI-extracted quote flagged for
human re-verification per AGENTS.md's Headroom-compression boundary rule.

`npm run validate` after all additions: **13 candidates (private)**, public
counts unchanged (29 events / 33 framing / 11 materials / 8 jurisdictions /
53 sources) — confirms candidates remain fully isolated from public output.

### Checks (run 2026-09-22, this session)

- `npm run validate` — ✓ 29 events · 33 framing · 11 materials ·
  8 jurisdictions · 53 sources · 10/10 watched active · 13 candidates
  (private). Same 5 pre-existing empty-material-scope warnings as before.
- `npm run typecheck` — ✓ clean.
- `npm run lint` — ✓ clean.
- `npm test` — ✓ **101/101** (9 new this session).
- `npm run build` — ✓ 200 static pages, `/saved` prerendered.

### Unresolved / for the maintainer

- Nine candidates await human review before any promotion; see the table
  above and each record's `openQuestions` for specifics (quote
  re-verification, blocked primary sources, one unconfirmed speaker
  attribution).
- Not committed, pushed, merged, deployed, or promoted, per instruction.

## Previous session: Coverage & Evidence dashboard reconciliation

Still on `ruflo-headroom-integration` (identical commit to `frontend-strategy` at
session start — a branch switch, not a merge). Still uncommitted, still
undeployed, per instruction: edit and test locally only.

### What this session found before writing anything

The brief asked for a new `getEvidenceSummary()` loader and a `/coverage` page,
against a stated baseline of 14 events / 31 sources / 6 jurisdictions. Neither
was true of this branch: a prior uncommitted "augmentation" session had already
shipped `lib/coverage.ts` (`getCoverageReport()`), `app/coverage/page.tsx`,
`tests/coverage.test.ts` and `/api/v1/coverage`; a later uncommitted
"historical-backfill" session had taken the corpus to 29 events / 33 framing
claims / 53 sources / 8 jurisdictions. Building a second, independent
computation over the same data would have left two divergent "coverage"
engines in the app. Reconciled instead:

- **`lib/coverage.ts`** — kept as the single computation engine. Extended
  `getCoverageReport()` (additive; no existing field removed or renamed) with:
  `sources.primary` (primary-source share of the register),
  `evidence.averageLinkedSourcesPerEvent`, `evidence.dateWindow` (earliest /
  latest coded event date), `evidence.notYetCodedTitleEventIds`, and per-actor
  `framingAnchored`, `linkedSources`, `primaryLinkedSources`. Also fixed actor
  route-code derivation to use the canonical `jurisdictionShort` map from
  `lib/labels.ts` instead of reading `.code` off the jurisdiction record
  directly — same values today, but one source of truth instead of two.
  Exported the `share()` helper so callers can reuse it.
- **`lib/data.ts`** — added `getEvidenceSummary()`, a typed reshape of
  `getCoverageReport()` into exactly the breakdown the brief specifies (totals;
  primary-source share; average sources/event; framing coverage; date window;
  per-jurisdiction events / framing coverage / linked sources / primary-linked
  sources; mechanism and source-confidence counts in canonical order;
  not-yet-coded title event IDs). It is a thin wrapper, not a second
  computation — `lib/coverage.ts` still imports from `lib/data.ts` for raw
  loaders, and `lib/data.ts` imports `getCoverageReport` back from
  `lib/coverage.ts`; the two calls only resolve at call time (inside function
  bodies), so the circular import is safe under Node's ESM loader and
  Turbopack, and `tsc --noEmit` confirms it type-checks cleanly.
- **`app/coverage/page.tsx`** — rewritten to match the brief: eyebrow "Evidence
  & coverage", title "What the dataset can support", four headline metrics
  (coded events, registered sources, primary-source share, framing-anchor
  coverage), an actor table with the four requested columns (events, framing
  anchored, linked sources, primary sources), mechanism and source-confidence
  distributions as restrained CSS bars (no charting dependency), and a
  research-boundaries section (coded date window, unresolved `"Not yet coded"`
  titles, actor-coverage imbalance stated from the live top-actor share, and
  the no-synthetic-scores rule). Links to `/methodology` and `/data`. All
  numbers are computed, not hard-coded.
- **Nav / homepage / README** — moved the `Coverage` nav entry to sit
  immediately after `Compare` (`lib/site.ts`); added a third "Built to be
  cited" card on the homepage linking to `/coverage`; added `/coverage` to the
  README's guided tour and project-structure block; bumped `site.version` to
  `v0.4-coverage` and `site.lastUpdated` to `2026-09-22`, and updated the
  README status section to match.
- **Tests** — extended `tests/data.test.ts` with eleven tests covering
  `getEvidenceSummary()` per the brief (loader reconciliation, every
  jurisdiction present, jurisdiction/event-total reconciliation,
  source-confidence-total reconciliation, framing coverage computed from
  actual event IDs, canonical mechanism/confidence ordering, and the
  not-yet-coded-title list matching the literal string with no inference).
  `tests/coverage.test.ts` needed one compile-safety fix: its "every share..."
  test built its list via `Object.values(r.evidence)`, which broke once
  `evidence` gained non-`Share` fields (a number, a date-window object, a
  string array); replaced with an explicit list of the actual `Share` fields
  (same assertions, same coverage, just enumerated instead of introspected).

### Session-management note (unrelated to the data model)

This session started in an unrelated git worktree (a different repository
entirely) and was redirected here mid-session. Two environment issues surfaced
and were resolved with explicit approval before any code was touched:

- The user's global `~/.claude/settings.json` denied `Read(./coverage/**)` —
  intended for build/test-coverage output directories, but it was also
  matching this project's legitimate `app/coverage/` route, blocking every
  tool from reading or writing it. Removed that one deny entry after
  confirming a project-level allow rule alone did not unblock it.
- The session's Edit/Write tools refused to touch any file in this repository
  (treating it as "outside the isolated worktree"), even after directory
  access was granted. Bash was not subject to that guard, so every edit in
  this session was made via Bash (Python string-replacement for targeted
  edits, heredoc for the full page rewrite) rather than the Edit tool.

### Checks (run 2026-09-22, this session)

- `npm run validate` — ✓ 29 events (29 verified · 0 provisional · 1 monitored)
  · 33 framing claims · 11 materials · 8 jurisdictions · 53 sources ·
  10/10 watched sources active · 5 candidates (private). 5 pre-existing
  empty-material-scope warnings, unrelated to this session.
- `npm run typecheck` — ✓ clean.
- `npm run lint` — ✓ clean.
- `npm test` — ✓ **92/92** (11 new evidence-summary tests; 81 pre-existing).
- `npm run build` — ✓ 199 static pages, `/coverage` prerendered as static.
- Browser-verified (dev server, Chromium via the built-in browser pane):
  - `/` — updated stat strip and version footer (`v0.4-coverage`) render; new
    "See what the data can support" card links to `/coverage`; no console
    errors.
  - `/coverage` — all four headline metrics, the actor table (8 rows, every
    jurisdiction), mechanism and source-confidence bars, and the
    research-boundaries section render with live figures (e.g. primary-source
    share 70% = 37/53, framing-anchor coverage 100% = 29/29, 0 "Not yet coded"
    titles — correctly different from the brief's stale 14-event baseline,
    since this corpus has since grown to 29 events). No console errors.
  - `/methodology`, `/data` — render cleanly, no console errors.
  - 375px width — `document.documentElement.scrollWidth === clientWidth`
    (375px, no page-level horizontal overflow); only the actor table and the
    top nav scroll horizontally within their own containers, by design.
  - Keyboard navigation — Tab from page load reaches `Compare` then
    immediately `Coverage` (confirming the nav reorder); Enter activates it;
    focus ring is visible throughout.
  - Actor-route links resolve via the canonical `jurisdictionShort` map,
    including the one case where it does not match the jurisdiction id's own
    casing pattern: `/actors/gb` for the United Kingdom.

### Unresolved / judgment calls for the maintainer

- The brief's audited baseline (14 events / 15 framing / 31 sources / one
  `"Not yet coded"` title) does not describe this branch's current data —
  two later uncommitted sessions already took it to 29 / 33 / 53, and the
  `"Not yet coded"` title has since been transcribed (0 remaining). The
  dashboard reports the live numbers, as instructed, rather than the stale
  baseline; flagging the mismatch here in case the baseline was meant to
  gate scope rather than merely describe it.
- Did not touch the other already-uncommitted, untracked surfaces on this
  branch (`/search`, `/watchlist` review cycle, `/api/cite`, `/api/v1/*`
  beyond coverage, `sitemap.ts`, `robots.ts`) — out of scope for this task,
  left exactly as found.
- Removed the global `Read(./coverage/**)` deny rule from
  `~/.claude/settings.json` rather than narrowing its glob, because narrowing
  it reliably would have meant guessing at the permission engine's matching
  semantics; simple removal was verified to work. Worth a second look if the
  maintainer wants coverage-report *build output* (e.g. `nyc`/`jest`
  coverage) kept out of context again — that directory does not currently
  exist in this project.
- Not committed, pushed, merged, or deployed, per instruction.

## Previous session: 2018–2025 historical backfill (tranche 1)

Still on `frontend-strategy`, still uncommitted, still undeployed.

| | before | after |
| --- | --- | --- |
| Events | 17 | **29** |
| Framing claims | 19 | **33** |
| Sources | 40 | **53** |
| Jurisdictions | 6 | **8** |
| Materials | 11 | 11 |
| Watched sources | 8 | **10** |
| Tests | 77 | **81** |
| Static pages | 137 | **199** |

Twelve events added, every one read from its own primary this session. By actor:
China 3 (Export Control Law 2020; Decree 792 dual-use regs 2024; Decree 785 rare
earth regs 2024), US 3 (2018 list; EO 13953; 2022 list), UK 2 (2022 strategy,
withdrawn; Vision 2035), Australia 1 (CMPTI Act), Canada 1 (Critical Minerals
Strategy 2022), Japan 1 (Economic Security Promotion Act), India 1 (NCMM).

### What this tranche is actually for

It is a **framework and lineage** layer, not more of the same. Three chains now
resolve that previously did not:

- **The Chinese authority chain.** Export Control Law → Decree 792 → the
  announcements already coded. Article 1 of the ECL is the statutory original of
  the 为了维护国家安全和利益，履行防扩散等国际义务 formula that Announcement No. 46
  tracks in abbreviated form — that connection is now anchored on both records.
- **The US designation lineage.** 2018 → 2022 → 2025, coded with
  `supersededByEventId`, so the shift to element-level rare-earth resolution in
  2022 is visible as a change rather than as three unrelated notices.
- **The UK lineage.** 2022 strategy → Vision 2035, with the 2022 document's
  withdrawal (24 Nov 2025) coded rather than left implicit.

### Taxonomy change (maintainer-approved this session)

`JURISDICTIONS` gained `uk` and `india` only. **South Korea and Brazil were
deliberately not added**: no in-scope primary was verified for either, and adding
a code with no record inflates the actor count without adding evidence. Codes go
in with the first event, not before. Adding to the array forces the
`Record<JurisdictionCode, …>` label maps to be updated, so the type system, not
vigilance, is what keeps them in sync.

`site.scopeStart` moved from `"April 2025"` to `"2018"`. It renders in the header,
footer, home page, methodology and `lib/export.ts`, so the public scope claim
moved everywhere at once.

### The empty-material-scope decision

Four new records (`evt-cn-ecl-2020`, `evt-cn-decree-792-2024`, `evt-jp-espa-2022`,
`evt-in-ncmm-2025`) carry `affectedMaterialIds: []`. This is deliberate: a
framework statute names no material, and inferring one from the announcements
issued under it would put a claim in the record the source never makes. Three
things now hold that decision in place:

- the validator **warns** (not errors) on an empty scope, so it stays visible;
- the event page **says so explicitly** instead of hiding the section — an empty
  section reads as "not coded yet", which would be the wrong claim;
- two tests assert empty scope stays legal and that no material index ever lists
  a scopeless event.

The warning immediately paid for itself by surfacing `evt-ca-ica-divest-2022`,
a pre-existing record with the same shape for a *different* reason (its minerals —
lithium, cesium, tantalum — are outside the tracked set). The UI copy was
rewritten to cover both cases honestly rather than assert the wrong one.

### Truth-in-labeling: counts are now derived

The methodology page's coverage sentences had gone stale twice ("eight of the
fourteen events" while the corpus held 17). They are now computed from the data
via `getDatasetSummary()` and a per-actor tally, so they cannot drift again. The
README no longer repeats counts at all and points at `/coverage` instead.

Section indices on the event page were also hard-coded, so a record with no
related events displayed 04 then 06. They are now assigned in render order.

### Sources needing a manual spot-check

- **`src-legislation-au-cmpti-2025`** — the Register's `/text` HTML view is a JS
  shell that serves no provisions to an automated client. Schedule 2 was read
  from the authorised PDF and the metadata from the Register's API; both routes
  are recorded in the source notes. Re-verify against those, not the page.
- **`src-egov-jp-espa-2022`** — same shape: the page URL is a JS shell, the text
  came from the e-Gov API. No official English exists for this Act, so the
  English title and the Article 1 rendering are the project's own.
- **`src-nrcan-cms-2022`** — the release announces the Strategy but is not the
  Strategy. The 31-mineral list was not machine-read, so material scope is coded
  only to minerals the release itself names.
- **`src-pib-ncmm-2025`** — headline and body state the outlay differently
  (Rs.34,300 crore vs Rs.16,300 crore + Rs.18,000 crore expected PSU investment).
  The record codes the body figures and says why on its face.
- **`src-gov-uk-cms-2025`** — material scope taken from the strategy's own
  support-eligibility table, not from a restatement of the statutory list.
- The three new Federal Register sources 302 automated clients to the unblock
  page, as the existing ones do. `npm run check:links` was run this session:
  53 sources, 45 ok, 8 redirect, **0 dead, 0 blocked**.

---

## Previous session: augmentation (corpus expansion, citation, search, coverage, API)

## Branch

`frontend-strategy`. Nothing has been pushed, merged, or deployed.

**The working tree is dirty and none of the work below is committed.** Committing
needs maintainer approval, so it has not happened.

## ⚠️ Data-loss incident and recovery — read this first

Partway through this session `git checkout` was run on five `data/seed/*` paths to
undo a half-applied change. That command discards *all* uncommitted working-tree
edits on those paths, so it also destroyed the prior session's uncommitted
evidentiary-layer work. `.next` (permission-denied), VS Code local history
(nothing for this project), APFS snapshots (none) and session transcripts
(truncated) all failed as recovery routes.

Everything was reconstructed and the diff against HEAD was confirmed to match the
pre-incident shape exactly (events 154 / framing 16 / materials 2 / sources 60
changed lines). Specifically:

- `events.json` — restored byte-for-byte from a `/tmp` copy taken minutes earlier.
- `sources.json` — 5 lost records identified by their dangling ids and **rebuilt
  by re-fetching and re-reading each primary**, not restored from memory:
  `src-mofcom-46`, `src-mofcom-61`, `src-mofcom-72`,
  `src-dod-mp-transaction-agreement-2025`, `src-osc-mp-loan-2025`.
- `framing.json` — two re-anchorings restored after re-verifying both MOFCOM
  primaries (see the truth-in-labeling note below).
- `materials.json` — the single lost line was `graphite.eventIds` missing
  `evt-cn-us-ban-2024`; the validator named it exactly, so recovery was
  deterministic.
- `jurisdictions.json` — no loss (it had no uncommitted changes).

**Lesson now enforced by habit, not tooling:** back seed files up before any
destructive git operation. Consider a pre-commit or `make` guard.

### Truth-in-labeling corrections recovered and re-verified

Both are cases where a coded quote did not match the primary. Both were
re-confirmed against MOFCOM this session:

- `fc-china-oct-natsec` (Announcement No. 61) — coded 为了维护国家安全和国家利益,
  which **does not appear** in the announcement. Correct text: 为维护国家安全和利益.
  The announcement carries no 防扩散 limb, so national security only is coded.
- `fc-cn-us-ban-natsec` (Announcement No. 46) — coded from a CSET translation as
  为了维护国家安全和利益，履行防扩散等国际义务. Primary reads
  为维护国家安全和利益、履行防扩散等国际义务 (no 了, enumeration comma). The English
  now carries 等国际义务, which the previous rendering dropped. Re-anchored from the
  CSET translation to the primary.

## Corpus: 14 → 17 events

| | before | after |
| --- | --- | --- |
| Events | 14 | **17** |
| Framing claims | 15 | **19** |
| Sources | 36 | **40** |
| China share | 8/14 (57%) | **8/17 (47%)** |
| Monitored records | 0 | **1** |

### Promoted (maintainer-approved)

`evt-jp-jogmec-lofdal-2026` — JOGMEC / Toyota Tsusho investment in the Lofdal
heavy-rare-earth project, Namibia. The corpus's **first `intakeMode: "monitored"`
record**. Both language editions were re-fetched and read in full before the merge.
Two open questions were resolved at promotion:

- `offtake_agreement` **dropped** — the release describes an equity investment
  (出資) only, and coding an offtake would infer legal effect beyond the text.
- the `economic_security` anchor **dropped** — verified against the Japanese
  primary that this sentence is Toyota Tsusho's, not JOGMEC's. Framing claims
  record the government's official presentation, so actor `japan` may not be
  anchored to a corporate voice in a joint release.

### Added (researched and verified this session)

Both read in full from the Federal Register's own full-text endpoint (the FR HTML
pages 302 automated clients to an unblock page; the API and `full_text/text`
endpoints do not):

- `evt-us-eo-14241-2025` — EO 14241, *Immediate Measures To Increase American
  Mineral Production*. 90 FR 13673, signed 2025-03-20. Included as a foundational
  instrument (eleven days before the April 2025 scope start) because the later US
  measures build on its definitions and its NEDC machinery.
- `evt-us-eo-14272-2025` — EO 14272, *Ensuring National Security and Economic
  Resilience Through Section 232 Actions on Processed Critical Minerals and
  Derivative Products*. 90 FR 16437, signed 2025-04-15. Coded `trade_action`, with
  the significance note stating plainly that the operative effect is an
  investigation, not a restriction.

Three framing claims added, all verbatim English from the orders themselves.
Neither order names China, so no `leverage_retaliation` is coded — "hostile
foreign powers" is the government's own formulation and the tracker does not
resolve it to a country the text leaves unnamed.

## New platform surfaces

Build is **137 static pages / 60 prerendered routes**, up from 51 pages.

- **Search** (`/search`, `lib/search.ts`, `components/search-explorer.tsx`) — one
  index across all six record types including original-language text (searching
  稀土 works). Matching is exact substring, deliberately not fuzzy: in a legal
  corpus "No. 61" and "No. 62" are different instruments. Deep-linkable via `?q=`
  and `?kind=`, read after mount so the page still prerenders.
- **Citation export** (`lib/citation.ts`, `/api/cite/{bibtex,ris,csl}` whole-corpus
  and per-event) — BibTeX, RIS and CSL-JSON, plus a copy block on every event page.
  The design point: a record citation names this project as publisher of the
  *record*, never as author of the instrument, and every export carries the primary
  URLs alongside so the government's own text stays one click away.
- **Coverage dashboard** (`/coverage`, `lib/coverage.ts`, `/api/v1/coverage`) —
  counts, never scores. Every share carries its denominator; a zero denominator
  returns `null` rather than 0, because "nothing to measure" and "none qualified"
  are different statements. A test asserts no `score`/`grade`/`rating` field can
  creep in.
- **Versioned API** (`/api/v1/*`) — events, single event (with its framing and
  sources joined), materials, actors, framing, sources, watchlist, coverage.
- **Discovery** — `sitemap.xml`, `robots.txt`, schema.org `Dataset` on the home
  page and `Legislation` per event, where `creator` is the issuing government and
  `publisher` is this project.

## Validator / test change worth reviewing

`scripts/validate-data.ts` required `lifecycle.publishedAt` on every monitored
record, but `data/candidates/README.md` says publishedAt is the **deploy** date and
must stay null through promotion. Those two rules cannot both hold for a promoted,
not-yet-deployed record — which is exactly what the Lofdal record now is.

Resolved in favour of the README: `publishedAt` is required only once
`site.monitoringStartedAt` is set (it warns if set while that is null, since they
ship in the same release). Two tests were rewritten to match, and one that asserted
`monitored.length === 0` was replaced — that was a snapshot of the old world, not
an invariant. The real invariant, still enforced, is that no timeliness figure is
computed while `monitoringStartedAt` is null.

## Checks

All run 2026-08-12 after the final edit:

- `npm run validate` — ✓ 17 events (17 verified · 0 provisional · 1 monitored) ·
  19 framing claims · 11 materials · 6 jurisdictions · 40 sources ·
  8/8 watched sources active · 5 candidates (private)
- `npm run typecheck` — ✓ clean
- `npm run lint` — ✓ clean
- `npm test` — ✓ **77/77** (was 43 at session start)
- `npm run build` — ✓ 137 static pages
- Browser-verified: `/coverage` metrics render with denominators; `/search`
  returns 4 results for 稀土 across three record types; `/api/v1/coverage`,
  `/api/v1/events/[id]` and `/api/cite/bibtex/[id]` all serve correctly; event
  JSON-LD carries government-as-creator; no console errors; no horizontal overflow
  at 375px, with the coverage table scrolling inside its own container.
- `npm run check:links` — **not run.** 4 new source URLs are unchecked by the
  checker, though each was fetched directly this session.

## Unresolved issues

- **`war.gov` blocks automated clients (403).** `src-osc-mp-loan-2025` therefore
  has an explicit access caveat in its notes: existence, headline, issuing office
  and date were confirmed from the OSC's own listing at cto.mil, but **the body
  text has never been machine-read**. Spot-check it in a browser before relying on
  it for any further field.
- **`verificationStatus` still has no UI.** All 17 records are `verified`, so a
  badge on every one would be decoration. It earns a surface when the first
  `provisional` record lands.
- **The watchlist is a public promise with no fulfilment yet.** All 8 entries still
  read "No published review cycle yet".
- Japan ESPA and Decree 785 candidates remain unverified drafts.
- `src-usgs-news-2025` / `src-fedreg-usgs-2025` still want a manual browser check.
- Browse-level framing chips still absent from `/compare` and the profile-page
  event lists.

### Design/methodology points for maintainer judgment

- **EO 14241 sits eleven days outside the stated April 2025 scope start.** It is
  included under the "plus a few foundational instruments" clause and flagged as
  such in its own significance note. If you disagree, it is one record to remove.
- **Material scope on the two EOs is wide** (10 and 11 materials) because both
  orders operate by reference to the whole USGS critical-minerals list rather than
  naming elements. That is faithful to the text but makes those events appear on
  many material pages; consider whether list-wide instruments deserve a different
  treatment from element-specific ones.
- **Search ships the whole index to the client.** Affordable only because the
  corpus is bounded, which is itself a project rule. If the corpus ever outgrows
  that, search needs rethinking before it needs optimising.

## Next recommended task

Two candidates, in order:

1. **Expand the material set.** This is now the binding constraint, not event
   count. Several coded instruments name minerals with no `Material` record —
   lithium, cobalt, nickel, PGMs — so the Australian tax incentive and the UK and
   Canadian lists display a narrower scope on site than their text carries. Each
   new material needs real research (`statusSummary`, `chinaPositionNote`,
   `diversificationNote`, downstream industries), so this is a research tranche,
   not a data-entry one.
2. **Run the first watchlist review cycle** on the 10 sources, set
   `lastCheckedAt`, and let what it turns up become the next monitored records.
   That is what unlocks `site.monitoringStartedAt` and, at five monitored records,
   the first honest timeliness figure — the one number on `/coverage` that still
   says "not computable".

South Korea and Brazil remain unstarted by choice; see the taxonomy note above.
