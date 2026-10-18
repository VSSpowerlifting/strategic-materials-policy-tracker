# SMPT — Conceptual financing legibility, 2026-10-16

## Editorial problem

SMPT's accounting semantics are rigorously distinguished in its Methodology page but are hard to encounter in the individual record and directory flow. Terms such as contracted, authorized, obligated, disbursed, programme envelope, nonbinding indication and shared unallocated financing are not self-explanatory. Readers may infer a payment from a signed agreement, an obligation from a decision, or project-level capital from a multi-project financing reference.

## Single source of truth

Extract the existing four methodological dictionaries for value roles, capital sources, financial statuses, and controls **verbatim** from `app/methodology/page.tsx` into `lib/capital-vocabulary.ts`. The methodology itself now imports this module. This move changes no label or definition, and all existing published records, classifications, status histories, sources, endpoints and accounting algorithms remain unmodified.

## Reader journeys

- Every `/capital/[id]` page gains an immediately visible, static `What the evidence says — and does not say` summary alongside its existing category/status badges. Four separate explanatory dimensions state what the figure represents, what its most recent source-linked financial status means, whether that status actually establishes payment, and whether there is a direct registered project link versus a **shared, unallocated** association (or no typed project link).
- The summary is derived deterministically from the original typed value role, capital source, final financial-history entry and exact project ID fields. It **does not** recalculate binding standing, imply obligation, sum amounts, infer an allocation, construct a milestone or replace human review.
- `/capital`, `/projects` and `/programmes` gain small, closed-by-default **keyboard-operable reading guides** with terms anchored in the same authoritative methodology. The body is statically present for all readers; the original data remains visible with JavaScript disabled.

## Important boundaries

- An authorized budget is not disbursed capital. A signed contract can be binding without establishing an obligation or payment of funds.
- Obligation is not an SMPT status field: do not create or quietly map an `obligated` state.
- A funding option's contractual status describes the agreement granting the option, **not its exercise**. An exercised amount is a separate drawn commitment with its own status.
- Nonbinding letters of interest, appropriations, ceilings, project costs and private capital remain outside government-recipient commitment totals.
- A `disbursed` status may establish paid capital but is not physical construction. `partially_disbursed` is not full payment. Ended rows retain their history.
- A directly linked `projectId` is one registry association, not proof of payment. An `associatedProjectIds` relationship is **unallocated**; money cannot be assigned to constituent projects.
- A missing registered project link or source category says nothing conclusive about real-world inactivity.

## Verification

Focused tests verify every categorical definition is complete, preserved from Methodology and used for every published finance row; exercise options, private financing, nonbinding indications, binding contract not paid/obligated, partial/full disbursement, lapsed/withdrawn histories, shared versus direct projects, fail-closed invalid reference shapes, immutable inputs and actual page wiring.

The path-scoped pinned Chromium QA opens three actual capital detail cases on mobile/tablet/desktop, checks all distinctions, responsive layout and keyboard-operated glossaries in each of the three directories, and follows the methodology anchor. Exact-head CI and Vercel approval remain merge gates.

## Next

A separate editorial project could add source-specific one-sentence narratives to high-priority measures. Such narratives would require human review, particularly where issuers disagree or dates are disputed. This PR supplies neutral categorical definitions without inventing case-level judgments.
