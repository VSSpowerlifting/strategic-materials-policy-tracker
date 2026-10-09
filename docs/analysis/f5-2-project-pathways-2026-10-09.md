# F5-2 — Read-only, project-scoped Evidence Pathways projection

**Prepared:** 9 October 2026. Parent [F5 epic #108](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/108); scoped task [#111](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/111). Based on **merged F5-0 #115**. This phase changes **no factual seed records and publishes no public UI/API**.

## Outcome

Given one existing registered project, produce an **inspectable document trail** from its explicit project and financing references back to the originating event, status evidence and approved project-native milestones. Every included connection is audited by **F5-0 `auditEvidencePathways`** first; no relation is proposed from a common material, date, jurisdiction or inferred industrial narrative.

Pure model `buildProjectEvidencePathway(projectId, input)` in `lib/project-evidence-pathway.ts`. It takes existing F5-0 corpus inputs, returns `ProjectEvidencePathway`, never fetches external URLs, never writes, and uses only published verified-corpus seed data **passed by the caller**. The existing source records provide document URLs/titles/publishers, original source publication and first known registered access dates; status and milestone dates remain independent.

## Project pathways are not causal graphs

Output lanes:

1. **Project identity**: canonical project name, registered tracked materials/stages and source references, no new entity resolution.
2. **Financing**: each *distinct* existing row, `eventId`, normalized provider/recipient, instrument, value role, all recorded financial status entries and legacy finance-row implementation observations. `projectRelationship` explicitly distinguishes **directly_attributable** from **nonallocative_association**; **no monetary amount or allocation is returned**. The distinction remains visible with a single project selected.
3. **Designations**: linked CRMA/etc project recognition rows, clearly **not monetary**; independent status history and government source references.
4. **Reviewed project-native milestones**: only an independently attested `mil-*` row, with occurred/planned mode, exact scope, original-language passage, English rendering/translation provenance, source pinpoint, separately source date and reviewer/date. **Existing legacy financial implementation histories are not promoted into this lane**.
5. **Originating policy contexts**: only PolicyEvents that directly parent included finance or designation rows, and their actual issuer/document sources. A co-announced control clause may be shown as an **event sibling**, not as proof of a project-specific export restriction, causal consequence or a claim about cross-border market effect.
6. **Financing package references**: directly linked row→parent `part_of` and `drawn_from` references, source cited, deliberately non-allocative in this projection. Parent packages are not automatically separately “funding” the project.

Every returned lane is deterministic, keyed by registered IDs, and source inspectable. Unknown/broken IDs or citations fail **closed** through F5-0 and `sourceRef`. Missing project returns error. The function does not compute “known on date X” legal/financial histories: the view is **current corpus revision**. If a source announced the operation of a plant in 2026, that cannot become a finding known at a 2024 cutoff.

## Pilot fixture verification (no milestone publication)

| Project | Source-backed inputs already in SMPT | Critical guard |
| --- | --- | --- |
| `prj-au-alcoa-sojitz-gallium` | Three direct finance rows carry **one repeated** Alcoa Aug 24, 2026 groundbreaking issuer update | 3 finance rows remain 3 financial instruments, not 3 independently attested project-native milestones or 3 separate construction events |
| `prj-ee-neo-rare-earth-magnet-project` | One JTF grant, currently NPM Narva OÜ recipient; 2026 Neo commercial-production observation | Existing `operational` legacy financial status stays unreviewed as project scope; native `mil-*` list currently empty; amount history remains unreviewed |
| `prj-us-stibnite` | Distinct DPA and EXIM support, Perpetua reports construction, actual recorded finance-row implementation day is **null** | No invented day, funded money or entire mine operational conclusion from a construction status. Issuer Oct 21 2025 early-works and May 30 2026 Burntlog activity remain **F5-1 review leads**, not published assertions here |
| `prj-us-usar-magnet-project-2` | CHIPS event contains finance and control clause | Control is correctly an **event sibling** only; no automatically asserted project-specific policy constraint |

Synthetic milestone fixtures in tests show precisely how an **already independently reviewed** project milestone would enter this output, retaining original statement, scope, asserted date vs target date, and review attestation. **No user/AI review attestation is invented and no `data/seed/project-milestones.json` entries are added.**

## Exclusions and later dependencies

No current/historical financial summation, policy cause, project output prediction, site-wide commissioning inference, capacity calculations, private candidate ingestion, event/status backfill, source rewrite, extra organisation relationship, new grant or disbursement, web route, static export, or monitoring trigger. The graph represents source-linked facts and transparent absence of *approved native* physical evidence.

Next [F5-1 #110](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/110) requires human review of original issuer passages and the correct `ProjectMilestone` scope. Only after human-attested milestone and validated projection are merged should [F5-3 #112](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/112) build interactive casefiles, with source and browser/accessibility QA. The subsequent F5-4 comparison must transparently show denominators and cannot treat no recorded milestone as inactivity.

## Review gate

Test `tests/f5-project-evidence-pathway.test.ts` against the real three-pilot corpus and synthetic, non-published milestone fixtures; assert independence from input ordering, no seed mutation, exact sources/statuses, nonallocative association, only parent-event contexts, failed missing IDs and sources, and no “amount”/causal exposure. Full exact-head production dependency audit, `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; maintainers separately review/squash merge; **no deployment**.
