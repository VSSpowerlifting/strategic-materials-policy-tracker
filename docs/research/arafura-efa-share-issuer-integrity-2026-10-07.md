# Arafura EFA share-issuer / Nolans project reconciliation

Review date: 2026-10-07. Source-backed recipient identity correction only; no new dollars or lifecycle promotion.

## Governing source

[Arafura Rare Earths Limited, ASX announcement of 1 April 2026](https://wcsecure.weblink.com.au/pdf/ARU/03074414.pdf) (`src-arafura-nolans-efa-subscription-2026`):

- Cover (p. 1) identifies **Arafura Rare Earths Limited**, the ASX company issuing the announcement.
- The Export Finance Australia section (p. 2) says Arafura executed a binding subscription agreement and investor rights deed with **EFA** under the Critical Minerals Facility for **US$100 million**. The agreement is an equity commitment, not proof of settlement.
- Annexure B (p. 6) identifies **EFA as subscriber** and **fully paid ordinary shares in Arafura** as the securities. **Use of proceeds: development of Nolans**. This identifies the investee company, rather than an undefined "Arafura Nolans project", as the legal share issuer.
- The same ASX announcement describes unmet conditions to completion, including shareholder approval, interconditional project funding, key lender documents and construction approvals; the agreement's sunset is 1 December 2026 unless extended.

## Scoped decisions

1. Change only `fin-au-arafura-nolans-2025-equity` recipient to `Arafura Rare Earths Limited`, with new `org-arafura-rare-earths` organization ID and source evidence for share issuer. Retain `projectId: prj-au-nolans`.
2. Register Arafura as Nolans project sponsor/developer based on its own financing/operational description; make **no claim that the parent directly holds project property title**.
3. Do **not** change the previously coded US$100M, `contracted` status from 1 April 2026, conditions precedent, absence of disbursement evidence, or project physical status.
4. Do **not** create a €50M German Raw Materials Fund / KfW row here merely because the same agreement also covers that instrument. That is a separate financing backfill requiring policy-event/actor/accounting checks.
5. Preserve Australian and U.S. *Alcoa–Sojitz project-labelled* rows, which lack first-party documentation of the actual legal equity investee in the audited evidence; preserve unbounded CMPTI eligibility wording because it is not an individual recipient.

## Follow-up separate from this PR

The EBRD expressly identifies **Sarytogan Graphite Limited** as its investee (EBRD Project 54699 and 2024 release), but the EBRD's A$5M (€3M) direct amount and the 2025 European Commission's approximate €3.6M summary must be reconciled against the later A$1.4M follow-on before modifying the Sarytogan financing row or its status/amount. This PR does not touch that record.
