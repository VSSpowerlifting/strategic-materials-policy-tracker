# Economic-security research experience

Base: `084078f3150089d933aa6f510723f10c64ebaa59` (freshly fetched `origin/main`).
Branch: `codex/smpt-product-experience-reinvention`.

## Direction and review of the brief

Implement the brief as presentation engineering over published evidence. The
research question leads; the lattice becomes a specialized comparison tool.
Keep the existing record routes, citations, exports and APIs. One primary writer.
Do not merge #180 (Narva publication), #166 (project comparison), #162 (financial
reading guide), #167 (CSV security), or the other open research/reliability PRs.
The project directory and methodology are presentation overlap with #166/#162;
this phase does not import their code or publish their pending work.

Hierarchy: Overview `/`; Explore `/events` with material/government up front;
Compare `/compare` with a guided gallium investigation and existing matrix;
Projects `/projects` and reusable `/projects/[id]`; Methodology `/methodology`.
About, Data and advanced research tools are visible in a persistent resource bar
and footer. All existing routes and query parameter names remain valid.

Visual direction: deep maritime ink `#101e2b`, slate `#192b3b`, pale blue-grey
`#eaf0f4`, source-paper `#f4f6f7`, muted steel `#aabcca`, and the existing evidence
gold `#e3b04b`. Retain Archivo for navigation, Newsreader for reading, JetBrains
for identifiers. A broad question and an adjacent compact casefile, followed by
material entry points and evidence-led investigations; left-aligned reading,
bounded line lengths, no introductory modal. Gold marks actions and evidence,
not an implied risk or progress score. Dense detail uses native disclosures. The public palette is scoped to the layout body; standalone editorial review retains its established root tokens and styling checks.

## Authority and selected cases

`lib/data.ts` reads only public seed stores; its public milestone loader currently
returns one reviewed Wagerup observation. `site.lastUpdated` is 2026-10-17, a
curated revision date, not a verification date for every field. Coverage figures
come from `getDatasetSummary`, without adding overlapping classes.

Reuse `projectStack`, `layers`, `controlsAtProjectStages` (capital intelligence),
`currentFinancialStatus`, `controlStatusOn`, `getControlMatrix`, and
`buildProjectEvidencePathway` with explicitly public loader inputs. F5 structural
links never establish causation; its amount-free model stays separate from the
existing capital stack. No private review file is imported or read.

Examples: `prj-au-alcoa-sojitz-gallium`, `evt-us-au-framework-2025`,
`mil-au-alcoa-wagerup-groundbreaking-2026-08-24`, and their registered sources;
`evt-cn-gage-2023` / `ctl-cn-gage-2023-export-licensing` for operative control;
`prj-us-stibnite` for financing with no published project-native milestone.
Featured links resolve through public loaders and omit unavailable records.
Comparison uses the existing material/government matrix, accompanied by the
gallium control and framework records, not a new financial aggregation.

## Trade-offs and verification

Retain specialist framing, portfolios, capital/control and lattice tools in the
shared shell. No general comparison builder, new dependencies, currency
conversion, data acquisition, or factual publication. The project dossier shows
financial histories alongside reviewed physical observations, without combining
their clocks or assigning a project-wide success state.

Initial environment check: npm production audit fails on the unchanged pinned
Next.js 16.4.0 (critical advisory plus high advisories; patch 16.4.2 suggested by
npm). Dependency/security changes are outside this phase. CI has an audit gate,
so this pre-existing issue may stop remote validation. Record exact results below.

## Final verification and acceptance

- `npm ci`: restored the exact lockfile installation before final checks.
- `npm run validate`: passed; 65 events, 96 finance rows, 45 control clauses,
  76 projects, 1 published reviewed milestone. Existing incomplete framing
  warnings remain. No research/publication/security store or calculation changed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 9 pre-existing unused-variable warnings in unchanged
  scripts/tests; no new warnings.
- `npm test`: **1,017 passed, 0 failed**. Six new regression checks cover public
  lookup omissions, adapter/stack parity, milestone identity, missing dates and
  amounts (synthetic fixtures), financing without milestones, exact source links,
  coverage figures, removal of the opening modal and theme contrast.
- `npm run build`: passed, with all existing routes statically generated. Next's
  existing vulnerable-version advisory initially stopped the command after route
  generation; an ordinary retry completed. No advisory bypass flag, dependency
  upgrade or security configuration change was used.
- `npm audit --omit=dev --audit-level=moderate`: fails on unchanged Next 16.4.0;
  the existing CI audit gate will require a separate security patch. This phase
  does not claim the vulnerable dependency is safe.
- `PLAYWRIGHT_MODULE=/tmp/smpt-qa-tools/node_modules/playwright node
  scripts/qa-research-experience-browser.mjs`: passed against the local production
  build at **390 / 768 / 1440 CSS px**, reduced motion enabled. Runtime was installed
  outside the repository; no package or lockfile change.

Browser coverage: homepage → Wagerup → primary source link → About; gallium/China
filters → policy event → clause and citation; Stibnite financing/conditions →
explicit milestone gap; comparison cell → supporting records; record → BibTeX,
project JSON and CSV/full dataset. Checked filter changes, reload, Back, empty
results, clear filters, unrelated query/hash preservation, menu Escape/focus,
skip link, comparison keyboard disclosure, and 11 representative legacy routes.
Source URL fidelity was checked against stored references; this is not a new
publisher-source verification or a claim of successful outbound fetches.

Visual inspection found and fixed tablet overflow in the retained lattice by
adding a labelled keyboard-scrollable table region. Final desktop/mobile home,
project, exploration, About and comparison screenshots have no document-level
horizontal overflow in the exercised sizes. This is representative keyboard and
responsive QA, not a claim of complete accessibility certification.

[Production homepage before](product-experience/production-before.png) ·
[Desktop overview](product-experience/overview-desktop.png) ·
[Mobile overview](product-experience/overview-mobile.png) ·
[Wagerup investigation](product-experience/wagerup-desktop.png).
Additional full-page captures and logs were retained locally outside the checkout.
Screenshots are generated verification artifacts, not research data.

Acceptance: all seven journeys/boundaries in the brief are implemented. The shell,
homepage, exploration, reusable investigation, guided comparison and credibility
entry points form one phase. Framing, capital/control, portfolios, sources,
programme/organization directories, timeline, coverage, saved records and data
access remain available. APIs, exports, authoritative calculations, corpus date,
source quotations and publication decisions are unchanged. Narva remains absent
from published milestones; #180 was not absorbed. No deploy, merge or monitoring
activation was performed.

Limitations: comparison is a guided gallium case plus the existing analytical
matrix and specialist lattice, not a new arbitrary project-pair builder (#166
remains separate). The F5 public adapter accepts only the public seed loaders;
no review packets, candidates or private evidence enter it. Production was
inspected as a before reference; the redesigned experience was verified locally.
The dependency audit is the outstanding merge prerequisite. Exact remote CI
status belongs to the final PR head and is reported separately at delivery.
