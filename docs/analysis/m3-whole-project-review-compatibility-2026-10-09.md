# M3 review queue — whole-project scope/null compatibility

**Date:** October 9, 2026. Scope: a validator/preview contract repair only. Related to [F5-1 #110](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/110) and [F5 source-preparation PR #117](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/pull/117).

## Actual contract mismatch

The published `validateProjectMilestones` validator requires **`scopeAsStated: null` when `scope: "whole_project"`** and a specific named component for `named_facility` or `funded_activity`. The existing M3.2 reviewer queue instead demanded a *nonblank string* for `scopeAsStated` regardless of `scopeProposal`, while its reviewer decision preview forwarded that field unchanged. Thus no approved whole-project claim could ever make it from M3 queue to the published milestone contract, even if a real reviewer attested the primary source.

This mismatch matters for the F5 Stibnite October 2025 early-works research proposal, which is currently marked `whole_project` and `scopeAsStated: null` in the **unreviewed** F5 source packet. The fix makes the queue capable of representing the schema; it **does not** decide whether early works justifies that scope.

## Narrow repair

- M3 review-intake `PilotRow.scopeAsStated` and decision-queue `PendingProjectExecutionRow.scopeAsStated` become `string | null` in TypeScript only. No seed or published `ProjectMilestone` schema change.
- For `scopeProposal: "whole_project"`, require literal null.
- For every other proposed scope, including unsupported taxonomy-held `named_infrastructure`, require a specific bounded nonblank scope name.
- Retain all other source-boundary, source confidence, linked finance observation, sorting, duplicate, review signature, corpus cutoff, taxonomy, and promotion gates.

Test synthetic `whole_project/null` succeeds through structural queue audit and **nonpublishing** preview only; `whole_project` with a name, `named_facility` with null, or `named_infrastructure` with null fail. The existing M3 public milestone seed remains unchanged and empty.

## Editorial decisions deliberately unresolved

1. Whether Perpetua's October 21, 2025 issuer statement supports `construction_started` of the Stibnite project *at the early-works stage*, or needs a more finely scoped reusable category, must be decided by human source review.
2. Before accepting that Stibnite candidate into the canonical M3 queue, register the currently absent first-party Perpetua source and establish its true access/date receipt; use the existing F5 research packet only as a review lead.
3. `named_infrastructure` for Burntlog Route and unsupported prototype kinds for INL remain taxonomy-blocked, unchanged by this compatibility fix.
4. A named human reviewer and independently authorized newer curated-corpus cutoff are still required for the actual publication step; no assistant identity, synthetic decision, or fictitious review date may be used.

**Verification:** `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` at exact head. This branch changes only M3 queue/preview type compatibility, tests and this design note; no public route, watcher, finance data, project seed, original source or reviewer attestation.
