# F4-B1 — Historical financing amount coverage and review inventory

**Prepared October 9, 2026.** Baseline is F4-A squash merge `f2dfc4b`. This phase is a **read-only, source-linked coverage audit**, not a historical total, backfill, publication, or instrument amendment.

## Why this gate exists

SMPT's published financial-commitment corpus records current canonical amounts and source-linked financial standing. A single current amount does not prove the same amount was operative on every earlier date. F4-A introduced optional `financialAmountHistory` with independently supported earliest/latest operative-date boundaries, piloted on Thacker Pass. No comparable history was bulk-populated for legacy rows.

At the start of F4-B1 the repository holds **96** financial rows, including **74** with `valueRole: commitment`; **one** has structured historical amount versions (Thacker Pass), leaving **95** with their historical amount series unreviewed. These counts describe **record coverage**, not the percentage of money documented historically, and do not certify that Thacker's chain is exhaustive.

## Implemented audit

`npm run audit:f4` prints a compact deterministic inventory; `npm run audit:f4 -- --json` prints each row's classification. The CLI reads only the checked-out `data/seed` corpus and `research/f4/amount-history-review-queue.json`. It does not read network data, system time or environment state; it writes to standard output and never modifies the seed, archive, private M1 review queue or project execution evidence.

Each financial row receives precisely one **coverage** classification:

- `versions_recorded`: structured amount history present, **not** a guarantee of complete historical provenance or legal accuracy.
- `history_unreviewed`: no structured history reviewed; **not** evidence that the current amount was also historically applicable, and **not** an assertion the amount changed.

This is separate from whether a **current** amount is stated, its value role, instrument, or financial status. No sum, percent of capital, dated cash draw, as-of total, source-inferred amount, or exchange conversion is emitted. Output explicitly declares `historicalTotals: not_authorized`.

The four source-linked editorial review questions are **triage only**. At runtime they must resolve to existing unversioned financial rows and distinct registered sources already present in those rows' evidence. The audit fails on missing/repeated candidate references, empty histories, duplicate record IDs, and ambiguous queue metadata. Adding a history to a queued row requires explicitly retiring or editing that queue item rather than silently retaining it as unfinished.

## F4-B research priority and provenance gaps

1. **Perpetua DPA Technology Investment Agreement** (`fin-us-dod-perpetua-stibnite-dpa`). Original up-to **$24.8 million** in December 2022; Perpetua's [May 2, 2024 Form 8-K](https://www.sec.gov/Archives/edgar/data/1526243/000110465924056419/tm2413337d1_8k.htm) reports **$34.4 million additional** funding under that TIA, taking the same agreement to **$59.2 million**. This is a strong *versioning candidate*, not extra financing on top of the current $59.2M. The 2024 8-K must be registered in `sources.json` with correct public filing date, verified pinpoint and field evidence before promotion; official status and actual operative boundaries require independent review. The row's current 2024 Q2 10-Q also describes the amendment.
2. **Neo JTF Estonia magnet grant** (`fin-eu-jtf-2025-neo-magnet-project`). Existing cited issuer materials describe a 2022 **up-to €18.7 million** grant and a later approximately **€14.8 million** amount with a revised 23% rate. The amendment instrument, effective date, qualifier change and whether both disclosures concern the same binding award remain **unadjudicated**. The 2026 Annual Information Form is a review input, not a substitute for contract-effectiveness evidence.
3. **Perpetua Army/DOTC OTIA** (`fin-us-army-perpetua-antimony-otia`). Separate from the DPA TIA. Existing evidence refers to an original **up-to $15.5M** 2023 instrument and a later **approximately $27.1M** estimated amount. Trace additional tranches and each operative amendment independently; grants reimbursed are not versions of agreement face value.
4. **Rhyolite Ridge DOE guarantee** (`fin-us-doe-rhyolite-ridge-guarantee-2025`). Contrast review: distinguish earlier conditional indication from the January 2025 **$996M closed** guarantee. Do **not** populate a spurious earlier `contracted` amount or add a second guarantee from the 2023 conditional package.

The issuer may be an authoritative source for **its own** contracting and receipt statements. It is not a proxy for unspoken government purpose or industrial-policy framing. No publication date is inferred from a document's transaction date, and a later report's retrospective amount does not by itself prove a precise earlier public-knowledge boundary.

## Review process and next gate

After a human reviewer reads the complete original source, a **separate F4-B2 candidate** may register missing primary evidence and populate amount versions for **one** continuous instrument, with:
1. Proven identity of the same legal obligation across versions (not a second financing).
2. Original and amended amount, qualifier, date bounds and **independent, cited** evidence for each; no inferred effectiveness from announcement.
3. Current-canonical-last amount agreement, explicit source evidence, and tests for the uncertainty window.
4. Unchanged public financial totals, parent-child folding, instrument grouping, and financing status.
5. Explicit reviewer acceptance before expanding historical amount histories.

**F4-C historical sums/UI/API remain blocked.** The number of versioned rows alone cannot authorize totals: missing histories, statuses on a given day, children/parents, value-role distinctions and source publication horizons require a separately reviewed historical aggregation contract.

## Acceptance

Exact-head `npm audit --omit=dev --audit-level=moderate`, `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; separately run the `audit:f4` summary and JSON commands. Tests must prove exhaustive and stable classification, linked-source candidate validation, no hidden monetary aggregation and no mutation. No deployment, scheduler, network collector, editorial promotion or production data edit in this phase.
