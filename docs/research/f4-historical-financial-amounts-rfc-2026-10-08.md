# F4 RFC: source-grounded historical financing amounts

**Status:** design proposal only; not a new funding record, schema migration, or production change.
**Prepared:** 2026-10-08. **Base:** `9e5f779ed3257d71b7764a8960b3a153bbb53b54`.
**Review priority:** after the closed-loan audit backfills; independently review before implementation.

## 1. Problem statement

SMPT separates *financial standing* from *physical execution* and has source-first `financialStatusHistory`. The historical helper `financialStatusOn(row, date)` respects status effective dates or conservative evidence boundaries for undated status entries.

The **financial amount** on a row is presently a single `FinancialCommitment.amount: MonetaryAmount | null`, with no revision history. `totalCommitments` uses that current amount and the **current** legal standing (see `lib/capital-control.ts`), while `buildCapitalControlSummary()` emits a current-corpus snapshot. The concern-response CLI's `--as-of` already date-slices legal standing; it deliberately **does not** historically reconstruct the record corpus and **does not sum money**. Its row-level text and any future historical figures must not present revised **current** amounts as if they were operative at an earlier date.

Concrete case: DOE Thacker Pass ATVM loan `fin-us-doe-thacker-pass-atvm-2024`:
- **2024-10-28:** signed facility **approximately $2.26 billion**, including **$1.97B principal** and about **$289.6–$289.7M estimated capitalized interest**.
- **2025-10-07:** same facility amended to **approximately $2.23 billion**, including unchanged **$1.97B principal** and **approximately $256M estimated capitalized interest**.
- The current row correctly carries **~$2.23B** with historical values in its notes, but its amount does not date-slice. The two amounts are **versions of one loan**, not separate commitments.
- Cumulative **$1.209B advances as of 2026-06-30** concern *money drawn*, **not** a third facility amount/version. The original and amended total *include capitalized interest* and must not be conflated with authorized principal or accounting carrying value.

An additional source-review candidate is the Neo Performance Estonia magnet JTF grant's reported revision from about €18.7M to €14.8M. **Do not migrate those figures until the transaction identity, governing source, exact amount qualifier, amendment effective date and source publication date are independently re-verified.**

## 2. Two distinct time concepts

1. **Operative/effective date**: when a legally or contractually changed facility amount was applicable according to evidence. A signed 2025 amendment can be *retrospectively reconstructed* on its October 2025 effective date even if the source used to establish that fact was published later.
2. **Evidence/publication boundary**: when a reader could verify the stated amount from the source's public availability or later review. Never quietly claim this date equals the contract effective date.

Use **operative-as-of** as the default meaning of `amountOn(row, asOf)`. If a future product offers *known-as-of*, it must be named separately and use documented `publishedAt`/access evidence rather than reusing effective dates. Do not call operative-as-of a reconstruction of what SMPT had ingested or the public knew in 2024.

An uncertain effective date must not be inferred from the publication or repository access date. `null` means **effective day unknown**. Undated revisions cannot be placed in a precise chronological snapshot without an explicit documented conservative evidence boundary and labeling; default is to **withhold a precise historical figure**, not silently use the latest one.

## 3. Proposed additive data contract (NOT yet implemented)

Maintain `amount` as the present/current canonical amount for API and UI backward compatibility. Add an optional append-only amount-version series; suggested type:

```ts
type AmountVersion = {
  /** The facility's sourced revised or original total; null means source states no amount. */
  amount: MonetaryAmount | null;
  /** Source-supported operative date; null when a precise effective date is unavailable. */
  effectiveDate: string | null;
  sourceId: string;
  /** Pinpoint within source; the primary evidence for amount and date. */
  locator: string;
  /** Replaces the preceding amount for the same legal instrument, not new capital. */
  reason: "original" | "amendment" | "correction" | "withdrawal" | "other";
  /** Explicit note about date support, components or legal-continuity proof. */
  note: string | null;
};
// Optional: financialAmountHistory?: AmountVersion[];
```

Possible rename: `amountHistory`, `amountVersionHistory`. Pick one in review and enforce it throughout the TypeScript type, validator, seed and API. Avoid `amountEffectiveDate` as a single scalar; the instrument needs multiple versions.

*Rules:*
- For versioned rows, a nonempty series must have oldest-to-newest chronological **effective** dates where stated, with no two entries on the same effective date unless explicitly adjudicated as one superseding correction. Historical queries never read a later version.
- Last entry's `amount` must deep-equal the row's canonical `amount` on committed data. No second independently mutable monetary source of truth.
- Each version's `sourceId` must be registered and the same row must carry field-level `evidence` linking it with `supports: ["amount"]`. The source's `datePublished` and `dateAccessed` remain independently preserved on `Source`.
- Do not add up original/revised versions or turn versions into children, `part_of`/`drawn_from` relationships, or extra rows.
- Values stay decimal strings and keep existing **currency, qualifier, amountAsStated, currencyBasis** (including `approximately` for the amended Thacker amount).
- Changes in **instrument identity**, facility composition, provider identity or capital tranche that cannot be proven to be one continuing instrument must be reviewed as **potential new rows**, not forced into a revision chain.
- Never treat paid/drawn milestone amounts as facility amount versions. Disbursements require their own future sourced paid-amount mechanism, and financial *status* is not proof of how much cash moved.

## 4. Proposed read-path contract and fail-closed rules

Introduce a *pure* `amountOn(row, operativeAsOf)` helper distinct from `financialStatusOn`. Return a tagged result, not `MonetaryAmount | null`, to preserve missing-information semantics:

```ts
type HistoricalAmount =
  | { kind: "quantified"; amount: MonetaryAmount; effectiveDate: string; sourceId: string }
  | { kind: "unquantified"; effectiveDate: string; sourceId: string }
  | { kind: "not_yet_evidenced" }
  | { kind: "history_unreviewed"; currentAmount: MonetaryAmount | null };
```

For reviewed/versioned rows:
- Pick the **last** applicable version whose documented effective date is <= operative-as-of, after a nonfuture financial agreement identity is established.
- Before the first effective amount, return `not_yet_evidenced`, **not** zero.
- An explicit sourced revision to `null` returns `unquantified`, not a numeric zero.
- A version with unknown effective date must cause an explicitly **withheld/unknown historical boundary** until date is adjudicated. In particular, do not prematurely adopt the current amount.

For the other **unreviewed/unversioned** existing records:
- Preserve current (non-historical) rendering and sums without changing behavior.
- For a *historical-amount-specific* query return `history_unreviewed`. **Do not** assume the current value was also the historical value simply because the last financial status was known.
- If a report wants a partially known historical subset, label it **partial and incomplete** with the exact excluded IDs. If the interface promises comprehensive historical totals, **withhold** those totals until all participating rows have reviewed history. Do not publish a misleading exact all-row total.

A future `totalCommitmentsOn(rows, all, asOf)` must first evaluate historical amount and legal standing, then rerun the existing currency/qualifier/instrument/parent-child folding algorithm **for that exact date**. A parent only suppresses children when the parent is historically countable in the same currency/role at the selected date. A currently active parent may have been absent, unquantified or ended at an earlier cutoff. Do not use current standing or current amount to determine historical nesting.

*Do not alter* `totalCommitments` or existing `buildCapitalControlSummary` silently as part of the first additive phase; use explicit new functions and explicit historical labels.

## 5. Acceptance matrix: test cases before shipping

| Case | Required result |
|---|---|
| Thacker 2024-10-27 | No executed facility amount claimed before signing |
| Thacker 2024-10-28 | Original **approximately $2.26B** |
| Thacker 2025-10-06 | Still original **approximately $2.26B** |
| Thacker 2025-10-07 | Amended **approximately $2.23B** |
| Thacker 2026-06-30 | **~$2.23B face amount** with financial status partially disbursed; **$1.209B draws remain notes**, not extra rows |
| Current Thacker UI/API | Same canonical **~$2.23B** until explicitly selecting historical mode |
| Original amount and amendment together | Exactly **one** counted facility at any cutoff; no $4.49B false sum |
| Qualifiers/currencies | No conversion and no coercion of `approximately` to `exact` |
| Unreviewed legacy row queried historically | `history_unreviewed`, excluded from fully certified historical totals |
| Before first evidence and unknown effective day | Distinct withheld/not-evidenced behavior, not zero/current fallback |
| Changed/ended package before/after a date | Parent-child folding recomputed against snapshot, preserving unlike value roles |
| Same-source duplicated revision | Validator rejects or requires explicit adjudication; no implicit last-write-wins |
| Missing source, unsupported amount claim, out-of-order version or present-amount mismatch | Validator fails closed |
| Export / API / UI | Historical amount comes with date and source metadata, and the report differentiates *as-of-effective* from *known as-of* |

## 6. Delivery path and scope gates

**F4-A — schema/helper pilot (one reviewable PR):** implement optional history type, validator, `amountOn`, and fixture tests; backfill **Thacker Pass alone** after re-verifying the original/2025 amended legal documents. No public historical aggregate, no new financier, no UI. Preserve all production summaries and financial amount totals byte-for-byte aside from explicitly permitted new optional fields.

**F4-B — coverage and audit (separate PRs):** audit major revised facilities (Neo JTF a candidate) with source provenance; record a per-row historical coverage summary. Do not auto-fill 90+ rows with the current amount; do not manufacture effective dates.

**F4-C — date-sliced sums/consumers:** wire the historical-amount helper into an *opt-in* source-labeled `totalCommitmentsOn`; ensure exact-date parent folding, role separation and qualified currency sums. Only then extend the concern-response analysis and public UI/API with an explicit historical amount mode and coverage warning.

**F4-D — independent reviewer acceptance:** review legal continuity, dates, amount qualifiers, as-of semantics, historical source publication and aggregate treatment against original instruments; require schema validation, TypeScript, lint, full test suite, build, and database preservation. No deployment during design.

## 7. Non-goals and blockers

This RFC does **not** imply versioned project stage/status, physical-status as-of reconstruction, financial *cash advance* history, inflation adjustment, FX conversion, separate retrospective ingestion snapshots, or a guarantee-draw model. Each needs its own source and semantics.

Other active engineering work (EXIM shadow bootstrap, Rhyolite Ridge #84 and Thompson Falls #85) is **not** modified by this document. Schema design should remain blocked until reviewers accept the distinction between **operative historical truth**, **publication visibility**, and **current-corpus coverage**.
