# Programme Evidence Research Trails — 2026-10-16

## Problem

The public SMPT register now lets a reader identify a financing or recognition programme, but a researcher must manually open each programme's individual instrument rows, project-designation entries, organization profiles and source links to reconstruct what documents support an intervention. This loses the critical distinction between shared and directly attributed project finance, and between a parent programme and its descendant schemes.

## What was added

Every existing `/programmes/[id]` detail page now includes a statically rendered, read-only "Trace the evidence" section linked directly from the searchable programme directory. For each programme, it displays:

1. **Programme identity**: only source-named administrators and original source citations.
2. **Financial rows**: the original individual financial record, value role, instrument category, financial status, original stated amount, named provider and recipient organizations, an attributable project link or an explicitly **shared/unallocated** project association, and original documents actually citing that same financial row. A row from a descendant programme is labeled inherited, retaining the identical `fin-...` ID.
3. **Designation rows**: recognized project, named holders and direct original citations. These confer standing, not financing.
4. **Nonadditive counts**: financial rows, designations, unique linked projects and distinct source documents. Counts never aggregate monetary amounts or try to calculate utilization, industrial progress or causal effects.

Existing `programmeLedger` remains the **only** authority for scheme financial and designation membership. Existing `source-usage` reverse provenance remains the only authority for citation links; a source cited by the parent scheme is NOT automatically attributed to each child instrument. The public-only projection does not load any private F5/M3 review packet, novel evidence assertion or synthetic financial milestone. The new server-side component does not send private raw seed files or the citation graph to browser clients.

## Research boundaries

- Government programme affiliation never turns a named organization into a state-owned finance provider, or an allocation into disbursement.
- Finance value roles (envelope, commitment, option, etc.) and statuses remain the legally meaningful unit; exact amounts are displayed *as stated*, never summed by this feature.
- Recipient text alone is not an organization link; only canonical organization IDs generate links. Project text alone is not a funded undertaking; only an exact `projectId` generates an attributed-project link.
- `associatedProjectIds` is an **unallocated** association, never attributable capital to an individual project.
- Original document citations come from a `SourceUse` entry matching the exact `capital`, `designation` or `programme` record type and ID. No source inheritance across a parent event, programme, financed company or project.
- Parent programme views include child programme finance/designation rows exactly once each, and explicitly label the child relationship. One underlying row may be visible in both parent and child pages; it is not additive.
- Designations do not evidence a financial award or industrial development. No human milestone review is bypassed.

## Verification

10 unit tests check real programmes, source citation identity, Canadian parent–child inheritance, EU designation-only schemes, tax-credit standing and zero amount, explicit organization/project identities, synthetic unallocated project finance, invalid identity/cross-scope failures, determinism and server rendering. Separate pinned Chromium QA opens directory deep links, checks real parent child rows, drills from a designation to its source dossier, visits instrument and organization links with keyboard, and exercises 375/768/1440px viewports. Existing programme directory QA and normal validation/build remain mandatory.

## Non-goals

No source registrations, financial histories, project/designation seeds, timestamps, public APIs/exports, collectors, F4 versioning, private human adjudication, physical milestone seeds, or Observatory publication. The interface navigates vetted public references; it does not claim a verified history of physical outcomes.
