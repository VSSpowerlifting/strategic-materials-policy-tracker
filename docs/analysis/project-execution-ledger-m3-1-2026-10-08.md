# M3.1 — Project execution evidence foundation (2026-10-08)

**Status: schema and shadow-audit infrastructure only. Zero project-native milestones published.**
The purpose is to give SMPT a second, independently sourced line of evidence:
what physically occurred at a *specified project scope*, distinct from what a
public financier announced, contracted or paid. This phase changes no public
financial measures, industrial-response counts, project pages or editorial
conclusions.

## Two evidence axes, not a readiness ladder

- **Finance**: existing FinancialCommitment rows establish their own announcement,
  agreement and drawdown history, through existing F4 as-of evidence rules.
- **Project execution**: a ProjectMilestone (mil-*) records one sourced
  assertion with a project ID, milestone kind, stated scope, occurred-versus-
  planned mode, source and precise passage. It carries no amount and cannot
  be inferred from the state of a financing instrument.
- **Scope is irreducible**: whole_project, named_facility and funded_activity
  are different factual propositions. Groundbreaking is not construction;
  completing a funded activity is not commissioning a facility.
- **Planned is not occurred**: targetOn is different from occurredOn.
  An expired target stays planned until new primary evidence confirms occurrence.
- **Unknown is unknown**: null event dates stay null; no milestone means
  "not documented in this corpus." Conflicting reports require human review.
- **Attribution**: primary company disclosures can support their own physical
  claims, not unstated government objectives or government endorsement.
- **No causality or score**: chronological overlap is not policy causation.

## Published-seed gate

The data/seed/project-milestones.json file is deliberately an empty array in
M3.1. The typed model and the validateProjectMilestones function enforce:

- canonical unique sorted mil- IDs and resolving project/source identifiers;
- an existing primary source, original passage and English text with
  source-language-appropriate translation provenance;
- explicit scope wording for named facilities and funded activities;
- real calendar dates and independent occurredOn/targetOn values;
- no future occurred event as of the corpus cutoff and no auto-promotion of
  a planned project; required human reviewer identity and review date;
- bounded prose and no duplicate source assertion under two IDs merely
  because multiple financiers mentioned it.

Review fields attest a completed human review; software cannot verify whether
the cited passage truly supports the claim. Reviewers must read the **full
original document**, confirm event vs publication dates, identify whose
activities occurred, distinguish plant vs workstream, and independently check
the quote and translation. A validator pass is necessary, not sufficient.

**Time semantics**: sourced event date and publication date are separate clocks.
The milestoneEvidenceBoundary helper returns the registered publication date
when valid, otherwise the source access date explicitly as an *observation
boundary*. A source published July 3 reporting a June 28 event must never
be shown as information demonstrably known on June 30. M3.1 exposes no as-of API.

Only lib/data.ts loads the empty seed, with read-only selectors. There is no
new API, export, search index, sitemap, project page, or response analysis
integration. Private candidates remain separate. The existing financial-row
physical histories are retained.

## Unreviewed legacy shadow audit

Run: npm run audit:project-execution -- --json

This no-network CLI reads only existing public seed entries. It outputs
deterministically sorted JSON and writes no files or source state.

- observations: finance-row physical status entries with resolvable singular
  projectId and sourceId. Scope remains not_adjudicated.
- repeatedEvidenceGroups: identical project/source/status/stated-date references
  carried by multiple financiers. This is a group to research, not proof of a
  single real-world event.
- mixedStatusProjects: projects with different recorded statuses. These could
  describe different sites or stages; this is NOT a confirmed contradiction.
- gaps: unresolved project/source, no allocative project, or multi-project
  associatedProjectIds with no allocation. Such finance cannot be converted
  into an individual project's occurred milestones automatically.
- Cyclic Materials Kingston's funded Extended Operations completion is flagged
  as a known_funded_activity_exception to prevent facility construction
  overreach. This does not change the legacy response matrix's current
  special-case rule.

The audit counts finance-row assertions, not the distinct government-backed
project denominator in the existing public industrial-response matrix.

## Migration decision and future phases

**M3.2**: independently inspect full original primary sources for a small
differentiated project sample. Verify occurrence, scope, source dates, source
language, and human review for each candidate. Preserve old histories and
write source-by-source reconciliation notes. Human editorial approval is
necessary before any new source-backed public milestone.

**M3.3**: only after reviewed evidence exists, build separate dated finance
and project-execution lanes on project pages; integrate with the response
matrix after comparison against legacy counts and scope semantics. Any new
public API/export or historical as-of behavior requires a separate decision.

## Acceptance

Run npm run validate, npm run typecheck, npm run lint, npm test, npm run build.
Tests exercise date/scope/review failures, duplicate financing observations,
unallocated multi-project financing, divergent reports and the Cyclic Kingston
exception. No production deployment or factual backfill is part of M3.1.
