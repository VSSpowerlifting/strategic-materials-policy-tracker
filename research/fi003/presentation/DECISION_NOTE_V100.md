# FI003 draft 1.0: decision note

**Status:** draft 1.0 candidate, 11 November 2026, including a second-pass editorial revision and a new cover. Research cutoff 6 November 2026. Pushed to PR #215 for review.

- The publication HOLD stands. Nothing is merged, deployed or published.
- Benjamin and Jiho have not completed their reviews of this version, and no counsel has read the legal mechanics. The proposed commercial reviewer withdrew before submitting findings; Benjamin retains the commercial cash-flow review.
- Unchanged: model 1.0, the 0.7–0.9.1 outputs and the registered source fingerprints.

This is editorial analysis from public filings. It is not legal or investment advice.

## Recommendation

> Raise permanent equity first. Keep the revolving facility for letters of credit and as conditional liquidity. Judge 10X construction spending against covenant-compliant resources under realistic downside conditions: projected quarter-end cash of at least $500m before the covenant trigger, and covenant EBITDA of at least about $232m by the first leverage test.

In plain terms, equity is the money that stays. The revolver is useful while everything is going well. It is least reliable when a Defense agreement is in trouble, because the agreements that support MP are also revolver default triggers.

## Why the revolver is a secondary buffer

- **The $500m minimum is a quarter-end test (§7.11(a), C68).** It is measured at each quarter-end until the covenant trigger. Spending that leaves cash under $500m at a quarter-end is an immediate Event of Default; no equity cure was found (C60). Between quarter-ends the cash can be spent. The test sets the planning floor for each quarter-end.
- **An actual suspension blocks draws at once (§8.01(m)(i), §4.02, C55–C56).** The clock starts when a Defense payment obligation is actually suspended or released, and a Default exists from that point, so new loans and LCs stop.
  - If the obligation is not restored, an Event of Default follows on day 60, or on day 90 if MP certifies cash of at least $343.75m.
  - The §8.02 remedies need Required Lenders to act. With no loans drawn, the live remedies are ending commitments and demanding cash cover for the $72m of LCs (C58).
  - Whether a right to suspend is already a Default is arguable. A late DoD payment is not clearly a trigger.
- **DoD's suspension rights are narrow (S03 §8.4.1, S04 §8, C66).**
  - DoD may suspend offtake performance only after an uncured Project Company payment default.
  - The filed price-protection agreement contains no suspension right. Payment depends on appropriations (§8(q)), and non-payment is a material breach that gives rise to damages (§8(p)).
- **The likelier path is a 10X breach (S02 §9.02(a)(ii), C65).** An uncured material breach of MP's 10X development, construction or commissioning obligations lets DoD terminate, after at least 120 days including cure and at least 90 days' notice. A Defense agreement that becomes terminable is an immediate revolver Event of Default (§8.01(m)(ii)). A cost overrun that delays 10X therefore reaches the revolver through termination rights, not through suspension.
- **Covenant thresholds (C63, C64, C67).**
  - The covenant trigger falls no later than 14 August 2027, absent a late filing, and earlier if covenant EBITDA reaches $400m. The first leverage test falls no later than 30 September 2027, before expected 2028 commissioning.
  - On $1,043.1m of reported debt, 4.00x leverage needs about $232m of covenant EBITDA under the 50% cash-netting cap, which the agreement applies to Article VII. Under the 100% reading it needs $209m.
  - 3.00x interest coverage needs at most $108–109m, so leverage binds first.
  - These are the covenant EBITDA levels each test requires. Actual headroom is not public.
- **Springing maturity (C61).** If enough 2030 notes remain outstanding, the revolver matures on 30 November 2029. That is avoided only if cash plus availability tops $1,078.5m, or if leverage is 2.00x or less.

## Alternatives on consistent dates

| Alternative | Assessment |
|---|---|
| Equity only | Strongest when Defense payments are under stress, because there are no lender remedies. But the $72m of letters of credit would need cash collateral or another issuer, and a fundable overrun would have no committed backstop. Better than equity plus revolver if covenant EBITDA would fall short of about $232m at the first test. |
| Committed construction debt | The $1bn joint commitment lapsed undrawn. Its terms were never disclosed, so cost, covenants and its own government-linked defaults cannot be compared. |
| Larger revolver or more debt first | Adds capacity that disappears in the stresses that matter. |
| Phase or delay 10X | Preserves cash, but a delay can itself become a §9.02(a)(ii) breach. A response to a trigger, not a base case. |

Public sources give no cost to complete, covenant headroom, DSCR, WACC, funding gap or bank-fee comparison. The deck marks each as "Not determined". The one fee shown, about $0.71m a year, is the contractual 0.35% commitment fee on $203m of reported unused capacity. It excludes LC fees.

## What would reverse it (slide 17)

1. The equity window closes on acceptable terms → committed debt or delay.
2. A verified cost to finish exceeds cash on hand → raise more equity first.
3. Defense payments are at risk of suspension or dispute → fund on cash, and treat the revolver as unavailable.
4. Covenant EBITDA would be below about $232m at the first test → equity only, or amend first.

## What changed since 0.9.1

- **Default linkage.** The recommendation is narrowed, not reversed. 0.9.1 treated the revolver as general conditional liquidity. 1.0 identifies §8.01(m) and S02 §9.02(a) as the mechanisms that disable it in Defense-agreement stress (slides 2, 9, 12, 16 and 18).
- **Quarter-end test.** The $500m minimum is measured at each quarter-end, and cash can be spent between them (slides 2, 10, 16 and 17).
- **Quantified covenants.** Covenant thresholds ($232m / $209m / $108–109m) and contract deadlines (14 Aug and 30 Sep 2027) replace illustrative dates (slide 11).
- **Timeline labels.** The renderer gains `contractual` and `conditional` milestone states. No slide labels a contract deadline "targeted".
- **Replacement costs and sources.**
  - Letter-of-credit replacement is named for the equity-only path (slides 13 and 16).
  - Missing slide sources were added on slides 3, 4, 7, 12 and 16.
- **Bank roles.** Morgan Stanley's underwriting share and the joint lead arrangers are stated (slides 3 and 18).
- **Structure.** The deck grew from 16 to 18 slides. New: default path (9), cash tests (10), timing (11), strongest alternative by stress (16).
- **Evidence.**
  - New claims C55–C68.
  - C56 and C63 were revised in the final pass.
  - C67 supersedes C50's illustrative date.
  - C01–C54 are unchanged apart from C50's supersession note in the QC record.
- **Editorial pass and cover.** Every slide's copy was reread and revised: titles name their reasons and drivers, process narration and repeated status stamps are gone, and criteria and qualifiers read as plain financial statements. Legal and factual qualifications stay. The generic cover is replaced by an original one with the series line, the two-tier title, 10X context, the byline, five linked citations and a ledger of the three instruments on one scale, never summed. Details in the QC record.
- **Model.** Model 1.0 is unchanged. New figures are clause arithmetic, computed and asserted in `build_spec.py`.

Gates, hashes, the adversarial reads and open items: [QUALITY_REVIEW_V100.md](QUALITY_REVIEW_V100.md).

## Decisions that remain with people

1. Benjamin: accept the narrowed recommendation, or send it back.
2. Counsel, if Benjamin wants one, on four points:
   - §8.01(m)(i): a right to suspend versus an actual suspension;
   - which netting cap governs Article VII;
   - §8.02 remedies;
   - the S02 §9.02(a)(ii) path.
3. Jiho: independent financial-strategy review pending. Benjamin: internal commercial cash-flow and contract-quality review pending; no external commercial reviewer is assigned.
4. Publication: the HOLD lifts only on Benjamin's separate authorization.
