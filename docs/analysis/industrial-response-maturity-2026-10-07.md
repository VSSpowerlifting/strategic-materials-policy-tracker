# Industrial Response Maturity — new corpus-revision analysis, 2026-10-07

**Status:** proposed public analytical view, not a revised factual classification or approved editorial conclusion. Repository baseline: `main` at `286e3852a3ebf1d4ba22bf87578929634a23f67d` (PR #67 merged); isolated feature branch.

## Reader decision

Ask **which government-backed registered projects have documented binding financial instruments, and which have separately documented industrial implementation?** A binding loan or equity subscription is not cash disbursed and is not evidence that a plant is running. Construction can start before a specific public agreement is executed. The tracker cannot infer the causal effect of a public policy from co-occurring evidence.

## Method and counting boundary

- On this baseline the seed includes 94 financial rows and 74 registered projects. The public page derives its actual counts from live seed data during server rendering, so it does not embed a stale baseline number. Financial status is evaluated at `site.lastUpdated = 2026-10-07`, the revision boundary.
- Denominator: **distinct registered projects** with at least one financial commitment row whose **singular** `projectId` directly names that project, whose `providerJurisdiction` names a tracked government and whose commitment is evidenced by the as-of date and not withdrawn/lapsed. Projects with only multilateral or private money, non-binding indications, designations alone or programme envelopes do not enter this government-commitment denominator.
- `associatedProjectIds` indicates shared but **non-allocative** financing and does not qualify a project for attribution. A parent financial package and child allocation cannot double-count a project: count distinct `projectId` identities rather than summing financial records or monetary values.
- Financial axis: **binding** if any eligible commitment is `contracted`, `partially_disbursed` or `disbursed` on the specified as-of date using `financialStatusEntryOn` and `legalStandingOn` (F4 evidence-boundary rules); otherwise **binding not established**, with visible differentiation between not-yet-binding and status-not-stated evidence. This is not a judgement on any entire project's financing.
- Physical axis: on the **current corpus revision**, inspect the last `implementationStatusHistory` entry **from any directly linked financing row**, including private/indication rows. `construction`, `commissioning`, `operational`, `completed` are *as recorded*; `announced`, `feasibility`, `suspended`, `cancelled` are other physical histories; empty, `not_stated`, and `not_applicable` give no usable recorded milestone. No physical history means **not documented**, not absent or inactive.
- **Conservative physical comparison**: the 2026-10-03 baseline already identified `prj-ca-cyclic-kingston-demonstration-plant` as an exception. `completed` means the funded “Extended Operations” activity completed, not necessarily that construction of a physical facility did. The page shows both the broad literal milestone count and a strict count excluding this one completion, with an explicit explanatory note.
- Each matrix cell and material row counts unique *projects*, not amounts. Material rows are **nonadditive**: a multi-material project appears in multiple material categories.
- Project ledger links every financial and physical status to the relevant financial row and source URL. No fabricated links between a policy's stated rationale and the subsequent project activity are introduced.

## Snapshot findings: corpus revised through 2026-10-07

These counts were independently re-derived from the 94 financing entries, 74 registered projects and source-date evidence boundaries in the branch's seed. They are **project counts** under the specific current-corpus denominator, not causal impacts or an assessment of total project finance. They are not comparable to the October 3 historical baseline without accounting for the expansion from 57 to 74 registered projects and changed financial-status evidence.

| Measure | Projects | Interpretation |
| --- | ---: | --- |
| Registered projects | 74 | Full registry, irrespective of backing |
| Projects with directly linked government commitment evidenced as of 2026-10-07 | **42** | The six-cell matrix denominator |
| With at least one binding government commitment | **23** | Signed/partly paid/fully paid are grouped only for agreement standing |
| With construction or later **recorded** on any linked financial row | **10** | Record-level implementation, not verified operational output |
| Construction or later, strict treatment of funded-activity completion | **9** | Excludes the Kingston Demonstration Plant “Extended Operations” completion alone |
| No usable physical milestone recorded | **24** | Missing evidence, not physical inactivity |

The exclusive two-axis cells are:

| Financial standing | Construction or later recorded | Other status reported | No usable physical milestone |
| --- | ---: | ---: | ---: |
| Binding public instrument evidenced | **8** | **3** | **12** |
| Binding public instrument not established | **2** | **5** | **12** |

**Interpretation.** Documented legally binding public support and documented physical progress do not form a single ordered maturity ladder: **8** projects have both, while **12** have binding public support with no usable physical milestone in the database, and **2** have construction or later reported without a binding public instrument evidenced in SMPT. The last observation does **not** establish that those projects lack binding finance elsewhere. Nor does the absence of a recorded physical milestone establish no construction.

Named cases for editorial inspection are **Nolans** (binding EFA equity agreement, no physical milestone), **Alcoa–Sojitz Gallium Recovery** (groundbreaking reported but the specific government equity instruments not yet documented as binding), **Keliber** (signed EIB loan plus project construction evidence), and **Stibnite Gold** (DPA grant with source-documented construction; the separate EXIM loan remains board-approved, not signed). Each row on `/response` links directly to its financial status source and the underlying project page. These are illustrations of different evidence types, not comparisons of government effectiveness.

The **Sarytogan Graphite** project does not enter the 42-project denominator merely because its EBRD equity was legally contracted and paid. The EBRD is a multilateral with `providerJurisdiction: null` in this tracker, and the scope of this specific matrix is *tracked-government* commitments. Sarytogan remains visible in the ordinary project/capital registry.

### Audit boundary for this snapshot

- Counts were checked against **94** financing and **74** project seed records after PR #67, without changing those files; each direct `projectId` qualifies a registered project at most once.
- Binding uses the **status evidence on or before 2026-10-07**; physical statuses remain current as recorded at this corpus revision.
- Each source citation resolves through an existing financial status-history `sourceId`; the site shows a source link, but its absence cannot prove nothing occurred.
- `prj-ca-cyclic-kingston-demonstration-plant` is the single broad-vs-strict exception already documented in the first analysis. Its completed funded activity does not independently establish that facility construction was completed.
- This snapshot is documentary, not a causal study, regional production estimate, common-currency capital total, or fully revalidated inventory as of October 7.

## Time semantics and historic comparison

The 2026-10-03 `docs/analysis/strategic-concern-industrial-response-2026-10-03.md` and its generated tables remain untouched, tied to their old source revision. This new view is a **new corpus-revision comparison**, not a rewrite of that baseline.

`site.lastUpdated` now means the **latest curated corpus revision** (2026-10-07), not that *every* source, policy, financing record or project status was comprehensively rechecked on that day. The overview's old “when the data was last checked” wording has been corrected. The UI explicitly states physical implementation is **revision-current**, not historically date-sliced (F4 only covers financial status). It cannot reconstruct historical corpus membership or unknown implementation dates.

## Scope and review gates

Changed surfaces: new `lib/industrial-response.ts`, `app/response/page.tsx`, project tests, navigation/overview link, `site.lastUpdated`, and documentation. No seed data, material taxonomy, accounting semantics, money amounts, project facts, API response shapes, or historical analysis files are changed.

Required checks: `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, plus manual desktop/mobile browser review if a deploy preview becomes available. The build alone cannot verify small-screen or interactive behavior. Keep merge and deployment as separate maintainer authorizations.
