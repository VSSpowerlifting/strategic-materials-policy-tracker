# FI003 draft 1.0: what changed from 0.9.1 and why

**Status:** a draft 1.0 candidate dated 10 November 2026. It is waiting for review by Benjamin, Jiho and Ambrose. The publication HOLD stands. Nothing has been merged, pushed, published or deployed. The research cutoff remains 6 November 2026. The 0.7–0.9.1 outputs, model 1.0 and the registered source fingerprints are unchanged.

## The recommendation: narrowed, not reversed

0.9.1 recommended equity plus a revolver. Its main trade-off was conditional overrun liquidity, paid for with fees, draw conditions, covenants and repayment.

Draft 1.0 keeps equity first and keeps the revolver, but it narrows the revolver's job. The deciding new fact is credit agreement §8.01(m) (S09, C55–C56). The same Defense agreements that support MP's commercial outlook are also revolver default triggers.

- Once a DoD payment obligation is suspended or released, a Default exists. A late payment, or a price-protection payment that is not due, is not clearly covered; that needs counsel. §4.02(b) then blocks every new loan and letter of credit.
- After 60 days, or 90 days if MP certifies cash of at least 125% of commitments ($343.75m), the default becomes an Event of Default. The lenders' §8.02 remedies then become available but are not automatic.
- Written disaffirmation of a Defense agreement is an Event of Default at once, with no grace period.

The revolver therefore works in a *company-specific* overrun and fails in the *government-payment* stress, which is the one this sponsor is most exposed to. The board-level answer becomes:

> Raise equity first. Use the revolver for letters of credit and company-specific overruns. Set go/slow decisions on 10X on cash above the $500m floor. In a suspension of Defense payment obligations, liquidity rests on cash thresholds that the revolver cannot help meet.

An independent adversarial read (see QUALITY_REVIEW_V100) produced the trigger-wording correction, the $500m floor qualification and the break-even. This is an editorial judgment from a plain reading of the filed agreement, not legal advice. Whether an event that merely *permits* suspension, before DoD acts, is already a Default is arguable (C56). Counsel review is warranted before publication.

## Alternatives considered and rejected

| Alternative | Why it does not displace equity first |
|---|---|
| Equity only | Strongest in the government-payment stress, because no lender remedies exist. But letters of credit ($72m outstanding) would need cash collateral or another facility, and a company-specific overrun would have no committed backstop. It wins only if the revolver's fees and conditions outweigh its LC and overrun value. That is not determined from public data. |
| Committed construction debt | The original $1bn joint commitment was undrawn and lapsed. Its terms were never disclosed, so its cost and its own government-linked defaults are not determined. |
| Phase or delay 10X | Preserves cash but may forfeit milestone and commercial value that is material yet unquantified. It is a reversal response, not a base case. |
| Larger revolver / more debt first | Adds capacity that disappears in exactly the stress that matters (correlated availability). |

## What would reverse it

Slide 17 sets out four conditions:

1. the equity window closes;
2. a verified cost to finish exceeds cash on hand;
3. Defense payments are credibly at risk;
4. covenant EBITDA would fall below about $232m at the first leverage test, or about $209m if the 100% cash-netting cap governs (C63, clause arithmetic on reported debt principal; not headroom).

Any one of them points to a different action. Public sources do not provide a cost to complete, covenant headroom, DSCR, funding gap or WACC. The deck writes "Not determined" in each place where one would go.

## Structural changes

- Slides grow from 16 to 18, still under the 20-slide limit. New or rebuilt slides:
  - S09: default-path state diagram
  - S10: cash tests
  - S11: dated covenant and maturity timing, with the springing maturity to 30 Nov 2029 if the 2030 notes stay outstanding
  - S16: strongest alternative by stress
- Reworked slides:
  - S02: executive answer
  - S12: government-support counterparty map, retitled around the default link
  - S14: criteria, with the new row "No lender remedies on a DoD suspension" and two debt-service rows merged
  - S17: reversal tree, with a fourth condition
  - S18: objections, where "Correlated availability is overstated" replaces "A revolver is conditional"
- New claims C55–C63 were added to `evidence.csv`. C01–C54 are untouched.
- Title: *MP Materials' 10X Financing: Cash, Covenants, and Construction Risk*. JPMorgan is named for its documented roles. The cover states that the work was neither commissioned nor reviewed by JPMorgan or MP Materials.
- Model 1.0 is unchanged; no scenario extension was needed. The new numbers ($343.75m, $1,078.491m and the $232m/$209m leverage break-even) are clause arithmetic. `build_spec.py` computes them from `inputs.json` and asserts them.
