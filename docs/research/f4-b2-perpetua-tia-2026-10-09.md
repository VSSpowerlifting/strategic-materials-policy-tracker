# F4-B2 — Perpetua DPA TIA operative amount history (isolated candidate)

**Reviewed 9 October 2026.** F4-B1 coverage inventory #104 merged as `d0fd8a8`. This source-scoped review promotes **one** existing Perpetua DoD Defense Production Act Title III Technology Investment Agreement (TIA) to structured date-bounded amount history. No new financial row, project, status, transfer, or policy event is created.

## Legal continuity and full historical timeline

The agreement concerns **Perpetua Resources Idaho, Inc.** and the **DoD Air Force Research Laboratory** for Stibnite antimony-trisulfide permitting, environmental/engineering work, and construction readiness. The official legal records describe **the same agreement** at three different stages:

| Operative event (agreement day) | Agreement ceiling as characterized by source | Primary legal evidence |
| --- | --- | --- |
| **2022-12-16** undefinitized original TIA | **up to $24,800,000** | [Perpetua Form 8-K, Item 1.01 (signed 2022-12-19)](https://www.sec.gov/Archives/edgar/data/1526243/000110465922128035/tm2232993d1_8k.htm) |
| **2023-07-25** agreement definitized | **not-to-exceed $24,812,062** | [Perpetua Form 8-K, Item 1.01 (signed 2023-07-26)](https://www.sec.gov/Archives/edgar/data/1526243/000110465923084027/tm2322087d1_8k.htm) |
| **2024-05-02** executed amount amendment | **exact legal ceiling $59,224,176**, with **$34,412,114** added within the same TIA | [Perpetua Form 8-K, Item 1.01 (signed 2024-05-02)](https://www.sec.gov/Archives/edgar/data/1526243/000110465924056419/tm2413337d1_8k.htm) |

**2022 availability is not the face amount.** The initial undefinitized award capped reimbursable availability pending definitization at **$18.6M** (75% of stated $24.8M). This is neither a second grant nor the correct historical award-face value; the original `financialAmountHistory` remains up-to $24.8M.

**The 2023 definitization matters.** The July 2023 SEC filing documents an exact legal not-to-exceed amount of $24,812,062, and says the definitized agreement did not change any other material terms. The previously rounded $24.8M and the new precise $24,812,062 cannot be indiscriminately collapsed into one exact value for every historical date.

**February 2024 was conditional, not an executed modification.** The [February 12, 2024 issuer announcement](https://perpetuaresources.com/perpetua-resources-receives-up-to-an-additional-34-6-million-under-the-defense-p/) described *conditional* additional support, and explicitly warned additional funding would be unavailable until the agreement was amended. The May 2 signed SEC Form 8-K states the company **entered into** the amendment that day. Therefore the date-sliced operative series preserves $24,812,062 on 2024-02-12 and 2024-05-01, and changes only on 2024-05-02. There is no justification for backdating it to the conditional announcement.

**Current presentation deliberately stays rounded.** The existing canonical current row says `up_to` **$59,200,000** (originally source-characterized as $59.2M). That current value is unchanged, so the latest F4 historical version reuses that same `MonetaryAmount` object to satisfy the strict invariant that the final version equals the public current amount. The exact May 2024 legal ceiling **$59,224,176**, not a new amount added to public totals, is preserved in the original SEC document, registered evidence locator, and amount-version note. This is a precision/presentation boundary worth reconsidering in a separate full current-corpus amount-policy review, **not** silently changed here.

The primary-source dates above establish **legal action/effectiveness** as specifically stated by the issuer, not when a reader first saw each source. For the two newly registered 2023 and 2024 SEC entries, `datePublished` is intentionally `null` because the original EDGAR filing/publication day has not independently been established; an SEC report's event or signature date is not automatically a publication date.

## F4 contract implementation

- `fin-us-dod-perpetua-stibnite-dpa` retains its identity, current amount, `valueRole: commitment`, capital source, instrument, project association, financial-status history (including 2026 disbursement verification) and implementation status.
- The added history holds **original → definitization (`reason: other`) → executed amendment**. Each version has independently referenced source/locator for the nominal award and both legal date bounds; all are exact single-day bounds, unlike the conditional Thacker Pass amendment.
- Added explicit row-level source evidence for the original 2022 8-K and two newly registered 8-Ks. These sources support contractual facts only, not a claim about construction or publicly known amounts in an earlier source horizon.
- Removes **only this record** from the F4-B1 unresolved review queue. Neo JTF, Perpetua Army/DOTC OTIA, and Rhyolite Ridge remain untouched and unreviewed.
- Strict tests verify the day-before/day-of behavior, February 2024 guard, immutable current aggregation, one legal agreement, evidence fields, incorrect chronology rejection, and invalid-as-of dates.

## Constraints and audit handoff

This pilot tests **operative-as-of agreement ceiling**, not reimbursement/disbursement amounts, grant income recognition, authorized but unavailable cash, project construction, amount-known-as-of, or converted/aggregated finance. Do not add any `$34.4M` row, sum the three versions, or interpret $59.2M as dollars already spent. F4-C historical commitment totals, public date-sliced API/UI, and production scheduling remain blocked.

**Acceptance:** verify exact-head GitHub Actions production audit, data validation, TypeScript, ESLint, complete tests and Next build. Independently inspect these three SEC Item 1.01 sections against the `amount` and `effective*` evidence locators. No merge/deployment without maintainer approval; require source review for exact effective-date characterization.
