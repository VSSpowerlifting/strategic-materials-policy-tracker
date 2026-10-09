# F5-0 — Evidence Pathways: structural audit and integrity contract

**Prepared:** 9 October 2026. **Parent:** [F5 epic #108](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/108). **Task:** [F5-0 #109](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/109).

## The reader decision this enables

SMPT currently records official policy measures, separate money instruments, controls, project designations, project registries, and source-reported financing-row implementation histories. It has a validated native **ProjectMilestone** schema, but its checked-out seed has **zero published `mil-*` entries**.

The F5 product goal is an *evidence pathway*, not a causal impact score: given an industrial undertaking, show documented policy and financing context, carefully scoped project execution assertions, and genuine gaps in evidence. F5-0 does not add physical evidence, make an analytic conclusion, or change the public site. It defines a **read-only audit contract** to make the future graph and casefiles defensible.

## Existing data and canonical edge semantics

`lib/evidence-pathway-contract.ts` defines a pure `auditEvidencePathways(input)` function. It takes existing published seed records as arguments, imports no private candidates, and returns sorted structural edges plus per-project coverage. Its edges have a stable `kind`, from/to IDs, directly registered source IDs/pinpoints and **separate** source publication/access dates. Every edge states `causalEffect: "not_asserted"`.

| Edge kind | One link expresses | Never means |
| --- | --- | --- |
| `event_finance` | Finance row identifies an event in `eventId` | That the event caused the recipient's construction or output |
| `event_control` | One control clause is tied to an event | That the measure imposed a total ban or affected a specific unrelated project |
| `event_designation` | A designation has an event parent | That designation conferred cash |
| `allocative_finance_project` | A financing row has singular `projectId`; this is a directly attributable *reference* | That every dollar was spent or the project was built |
| `nonallocative_finance_project_association` | An unsplit finance row explicitly lists one of `associatedProjectIds` | Any monetary allocation to that project |
| `project_designation` | A designation expressly identifies a project | Financial support, a signed contract or permit automatically granted |
| `reviewed_project_milestone` | A native `mil-*` assertion has project ID, reviewed statement and official source | A statement from a financier automatically becoming facility construction; a planned date becoming occurred |
| `finance_part_of` | A child states it belongs inside another financial row | Two additive grants |
| `finance_drawn_from` | A row names the financing facility it draws from | Two additive grants or the entire parent facility drawn |

The **source linked to the child record** supports the child record's presence, and the edge only represents its stated typed reference. Citations on an `event_finance` edge do **not** independently prove a new legal relationship, causal impact, shared contract or economic outcome. Graph consumers must not treat this contract as permission to invent undocumented link types. `allocative_finance_project` means direct project attribution **at the record-link level**, not disbursement or historic allocation of money.

## Fail-closed rules and non-goals

1. **Registry identity validation:** duplicate record or source IDs, unresolved project/event/finance-parent refs, and uncited edges stop the audit. The input is not changed and neither a missing project nor stale source can be silently dropped.
2. **Determinism:** sorted edges, evidence citations and project ledger; caller array order cannot affect the output; same seed produces identical JSON without clock/network calls.
3. **Reference provenance:** citation has sourceId, optional locator, source-publication day if reported, and source-access day. These are evidence observation boundaries, **not** the actual execution or agreement-effective day.
4. **Review gaps:** `projectsWithoutNativeMilestones` and `legacyObservationsNeedingReview` are *data coverage*, **not** inactive project counts. Legacy financing-row implementation histories remain separate, grouped only for review through existing `auditLegacyProjectExecution`.
5. **No monetary amounts in this audit:** existing current money metrics still belong exclusively in `totalCommitments`; neither source-count aggregation nor associated links may promote cash, make historical sums, or infer grant utilisation.
6. **No effects or risk scores:** a shared material, common policy actor, earlier date, or coincident region creates **zero new edges**. Only explicit registry links are included.
7. **No publication:** `scripts/audit-evidence-pathways.ts` is a CLI that writes stdout only. It is *not* imported by public UI, API, search, sitemap or exports. F5-0 contains no seed, policy-framing, finance, project or source edits. No private candidate ingestion.

## Use and interpretation

```sh
npm run audit:pathways
npm run audit:pathways -- --json
```

The first prints dynamic row counts, source-typed edge counts, native milestone coverage and legacy physical notes requiring review. The JSON includes *individual source IDs and locators* and a sorted project-specific ledger. An invalid argument exits with code 2.

Unlike the public `/response` analysis, this inventory **does not classify binding finance or physical maturity**. The two existing systems answer different questions:

- `/response` is an explicitly scoped **current-revision** project-count matrix. Its finance axis uses reviewed legal standing as of its cutoff; its physical axis is legacy finance-linked observations at the current corpus revision.
- `audit:pathways` inventories explicit reference links and **approved native milestone coverage only**. It cannot be misread as a second or historically accurate implementation summary.

Use the ledger as the construction input for **F5-1** source-reviewed native milestone pilots, then **F5-2** a read-only, per-project typed graph with richer evidence/clock facets. Do not build F5-3 interactive casefiles or F5-4 cross-project comparison from unreviewed implementation observations.

## Implementation acceptance

The `tests/f5-evidence-pathways.test.ts` suite checks full current corpus coverage, immutable seed and order invariance, valid source IDs/publication and access separation, nonallocative duplicate-connection behavior, missing/broken refs, no unauthorized causality or money, synthetic native milestone occurred/planned boundaries, and live CLI modes. All other repository validation, typecheck, lint, full tests, Next production build and production-dependency audit must pass on the exact final head.

**Review milestone:** #109 is ready to merge after final green CI and maintainer approval. #110 source adjudication and #111 read-only graph projection are future separate PRs, not assumed to be implemented by this contract.
