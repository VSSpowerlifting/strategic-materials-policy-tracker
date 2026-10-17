# F5-1: bounded project workstream taxonomy contract

October 17, 2026 — **engineering candidate; no publication or human source verdict.**
Related: #108, #110, source-research PR #132 and unsigned evidence PR #169.

## Decision recorded for implementation review

Use the single reusable canonical scope `bounded_project_workstream` for source-limited physical construction, such as the Stibnite early works phase or Burntlog Route site-access road. This resolves the naming conflict between `named_workstream` (#169) and `bounded_project_workstream` (#132) at the *type level only*. Do not create separate one-project `early_works` or `named_infrastructure` enum labels.

- `scopeAsStated` must be a nonempty, source-bounded physical activity description (max 250 characters). It cannot silently expand to the whole mine, refinery, factory, or commissioned facility.
- Only `groundbreaking_reported`, `construction_started`, and qualified `construction_progress_reported` may use this scope. Production, operations, commissioning, cessation and funded-activity completion require their own already-defined semantics.
- Progress reports remain **undated observations** with `occurredOn: null` and an explicit caveat; publication and access clocks are not event clocks.
- Financial instruments and government designations remain separate evidence lanes. One physical event does not become multiple milestones because several financial rows reference it.

## Review and integration boundary

This contract PR intentionally **does not edit** the Stibnite M3.2 queue, source rows, worksheet digests, F5-1 sidecar, reviewer decisions, public milestones, public routes, exports, or `site.lastUpdated`. The two existing Stibnite rows remain `taxonomy_blocked`, and the unresolved INL demonstration kind is unrelated.

A subsequent integration PR, coordinated with #132 and #169, must update the two queue scope proposals and their exact `scopeAsStated` values; regenerate M3 worksheet digests and any unsigned research sidecar; explicitly preserve the taxonomy holds pending genuine source review; and retain each original event day and source lineage. Any later decision to remove a taxonomy hold, curate more sources, advance the corpus cutoff, or publish a real milestone needs its own maintainer authorization and named original-source review.

## Verification contract

Run `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and the M3/F5 audits on this exact head. The synthetic regression fixture checks kinds, dates, caveats, queue holds and zero-publication invariants; it must not masquerade as a reviewer.
