# F5 — Industrial Outcome Observatory engineering blueprint
**SMPT / October 9, 2026 · prepublication architecture, not an outcome claim or production release**

## Product goal and epistemic standard

The Observatory should answer **which strategic-material policy actions and funding instruments were recorded around an identified industrial project, what source-linked physical activity was subsequently reported, and what is still unknown**. It must **not** answer "did policy X cause Y?" absent a separate attribution research design. Source registration and funding documentation are not independently verified construction, disbursement, or industrial output.

The product's authority rests on three independently auditable distinctions:
1. **Policy/intention:** verified government interventions, award announcements and project designations, sourced to actual instruments. Each is a record of the action taken or announced, not a demonstrated effect.
2. **Financial exposure:** specific financing instruments with their own provider, recipient, financial status and parent/package identity. Do not add grant + loan + tax credit + corporate capex or associate multi-project money with a particular project without allocative primary-source evidence.
3. **Physical outcome evidence:** *project-native*, human-reviewed primary-source assertions with precisely scoped activity and honest event dates (or `null`), plus a separate non-promoted legacy-financier-evidence queue. Issuer-reported production is not independent physical-site inspection. Nothing in a financial-status note creates an industrial milestone.

The Observatory initially compares **Alcoa–Sojitz gallium**, **Neo Narva magnets**, **Stibnite**, and **Thompson Falls antimony**. The first three are F5 pilots; Thompson Falls is a deliberate extended comparator. This is a purposive evidence pilot, **not** a sample suitable for generalization or a project-success ranking.

## Implemented data/contract scaffolding in this PR

| File | Contract and scope |
|---|---|
| `lib/evidence-pathway-contract.ts` (existing) | Validates typed event ↔ finance ↔ project, designation ↔ project, and project ↔ reviewed-milestone structural links. Coannouncement and association never imply causation |
| `lib/project-evidence-pathway.ts` (existing) | Project-local source and instrument evidence lanes; no capital sums and no inferred time-sliced history |
| `lib/f5-casefile-readiness.ts` (existing) | Source-pinpoint and registered occurred-claim structural eligibility, **never release authorization** |
| `lib/f5-casefile-preview.ts` (existing) | Private four-lane casefile draft; no route; unknown occurrence dates stay `null` |
| `lib/f5-observatory-scaffold.ts` (**new**) | Four-case cohort, noncausal cross-project comparison contract, per-case deduplicated primary-source index, editorial questions, QA blockers, immutable `publicReleaseAuthorized: false` |
| `scripts/audit-f5-observatory.ts` (**new**) | Read-only CLI; `--json`, `--project <id>`, and `--strict`; whole cohort validated before filtering; no `--publish` |
| `tests/f5-observatory-scaffold.test.ts` (**new**) | Corpus/clock integrity, four-case evidence matrix, no sums/attribution, synthetic readiness and blocked empty states, order-independent output, prohibited release options |

Run locally:
```sh
npm run audit:f5-observatory
npm run audit:f5-observatory -- --json
npm run audit:f5-observatory -- --project prj-ee-neo-rare-earth-magnet-project
npm run audit:f5-observatory -- --strict
```

**Why no public site yet?** Currently `data/seed/project-milestones.json` is `[]`; all seven M3 reviewer decisions remain unsigned/pending. Building a public interface that presents unreviewed progress as observed outcomes would misrepresent evidence maturity. **No new route, header link, sitemap entry, API, export, publication toggle or external monitoring job** belongs in this PR.

## Intended eventual information architecture (future PRs, not enabled here)

### A. Observatory landing / industrial-evidence comparison

**Intro/reader contract** — scope of record coverage, date of curated data revision, explicit separation of reported activity from independent confirmation and no implication of policy causality.

**Comparison table** — project name, materials, linked policy contexts, distinct direct financial references, nonallocative financial associations, designations, number of *reviewed* occurred project milestones, and unreviewed legacy physical reports. These are **coverage counts**, not expenditure or impact ranks. Show `No reviewed physical evidence registered` instead of `No progress`.

**Filters** — material, location/jurisdiction, stage and reviewer-evidence coverage. Filtering must not invent rows, reassign financial amounts or silently remove disclosures from returned casefiles. No cross-case `$ total`.

### B. Individual project casefile

**Source-provenanced project identity**, bounded case question and jurisdiction/material context.

Four separately labeled lanes:
- **Policy record:** actual interventions and designations as contexts only; preserve issuing body, status, announcement/event date and direct sources.
- **Financial commitments:** distinct provider/recipient/instrument and as-recorded status history, with package references and explicit nonallocative badges; do not add numbers until the independently audited F4 date-sliced and monetary semantics have been approved.
- **Industrial progress evidence:** reviewed occurred vs planned *project-native* observations, scope, exact source quote, pinpoint, reviewer date and null/known occurred-day semantics. Keep *unreviewed financing-row physical reports* visible only as counts or editorial caveats, never native achieved milestones.
- **Evidence and uncertainty:** original documents and language, date clocks, evidence gaps, caveats and limits of causal inference.

**Do not draw a directional causal arrow** from financing to construction because records concern the same project. Use a source-linked *association* layout. Explicitly distinguish source publication/access from physical occurrence; `null` is not zero, project failure, or a default filing day.

### C. Method and quality assurance

Explain selection bias (three curated pilot projects plus one comparator), source quality, reviewer workflow, instrument accounting semantics and why observations do not establish causation. Provide full original-source links and pinpoints. Disclosure of an unreviewed article must not masquerade as documented industrial outcomes.

## Delivery sequence and strict acceptance gates

| Phase | Deliverable | Acceptance / prohibited shortcut |
|---|---|---|
| **O0 — model scaffold** (this PR) | Exact-four-case internal comparison and casefile interface | GitHub full CI + Next production build; contract always nonpublishing; no seed change |
| **O1 — first independent evidence** | Human reviewer evaluates Alcoa, Narva, Stibnite and Thompson Falls original sources using M3 review packets and local digest-pinned decisions | Actual original-source reading, exact quoted passage and scope; manual named reviewer/date; zero synthetic signatures; corpus cutoff refreshed only through independently approved revision |
| **O2 — narrow source-reviewed seed** | One PR per independently approved project-native milestone tranche; no duplicate financier statuses or invented start days | Valid `data/seed/project-milestones.json`, valid provenance, source-review handoff and true human/maintainer signoff; fail on quote, identity, source or financial contradictions |
| **O3 — private responsive casefile UI** | Keyboard-navigable SSR/React components consuming `F5EditorialCasefilePreview` and Observatory typed contract, with **no public route** | 320/768/1440px visual review; visible empty/error states; WCAG contrast, heading hierarchy, keyboard focus; clickable genuine source links/pinpoints; automated accessibility and responsive tests where feasible |
| **O4 — public casefile pilot** | Source-audited public individual casefiles, then a cohort landing page; nav/sitemap separately approved | Dedicated manual acceptance receipt for each launch case; explicit maintainer authorization; zero inferred causal/financial impact; no fabricated readiness flags |
| **O5 — longitudinal comparison** | Revision history and later known-as-of timeline only after F4 amount versioning and stable observation persistence | Independently certified snapshot coverage and denominator definitions; no revision-time known-as-of inference from today's status |
| **O6 — methodological research expansion** | Larger sample and independently defined descriptive indicators | Coverage bias analysis; reproducible source-selection protocol; correlations cannot be described as causal policy effects |

### Release blockers

- **Unreviewed source claim:** *block public physical outcome*.
- **Named infrastructure vs whole-project scope unresolved:** *block that milestone; never normalize a road into production-facility operations*.
- **Unknown physical event day:** preserve `null`, label reported/observed status; never use the publication date to fill it.
- **Financial accounting ambiguous:** display instrument references only; block aggregate commitments, realized disbursement totals, causally attributed amounts.
- **QA or reviewer receipt absent:** *block public route/deployment*, regardless of green CI and structurally valid milestone rows.
- **Vercel preview quota exceeded:** do not call a failed/blocked preview green; independently verify GitHub Next build and require actual browser/device QA before authorizing a public release.
- **No reviewed physical milestones registered:** treat as missing reviewed evidence, not absent industry activity; do not market a blank casefile as verified industrial progress.

## Explicit out-of-scope work

No financial as-of recomputation (F4 remains a separate RFC), no causal analysis, no automatic LLM reviewer, no added government grant row, no new source-monitor admission, no public homepage redesign, and no cross-jurisdiction performance score. The O0 scaffold does not affect the live SMPT corpus or its front end.

**Repository decision:** keep `F5_OBSERVATORY_COHORT` canonical, deterministic and human-reviewed at PR time; do not introduce a second independent source-review queue. This document and the code define the boundary for later F5 UI/analysis PRs; they are not a launch authorization.
