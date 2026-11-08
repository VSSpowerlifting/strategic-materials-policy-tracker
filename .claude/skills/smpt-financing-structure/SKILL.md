---
name: smpt-financing-structure
description: Analyse how a strategic-materials company or project is financed — instrument by instrument, commitment versus drawdown, substitution and takeout, fee and dilution bases, use-of-proceeds restrictions, backstops, liquidity snapshots and cash bridges. Use when a product reads filings, credit agreements or government financing terms, when a draft compares fees or dilution, or when it attributes a financing change to a policy.
---

# SMPT financing structure

Reconstructs a capital structure from binding documents so each instrument keeps its own amount, role, date, conditions and source, and so changes over time are shown as substitutions and drawdowns rather than as new money. It is the skill for questions like "what actually funded this?", "what is still available?" and "what did the government's support change?".

Governing rules: `docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md` §1 (capital layer), §4 and §5 Financial integrity; Capital & Control rules 6–7 in `CLAUDE.md` (no adding unlike instruments or roles, no counting a child with its parent, private capital is not public support, options are not backing); `docs/operating-playbook.md` on separate status dimensions.

## When to use

- Reading a 10-K/10-Q, 8-K, prospectus, credit or commitment letter, government award or preferred-equity agreement.
- A draft compares two fees, two dilution figures or two financing routes.
- A draft says a policy or award "enabled" or "caused" a financing.

Start from `smpt-evidence-baseline`; this skill assumes each figure already has a locator and status.

## Method

1. **Instrument register.** One row per instrument in `references/instrument-register-template.md`: type (term loan, RCF, bridge commitment, convertible, common equity, preferred, warrant, grant, guarantee, offtake prepayment), provider, amount *as stated* in original currency, role (ceiling, committed, drawn, repaid, ended), key dates (signed, available, expiry, maturity), conditions, use restrictions and source locator.
2. **Commitment versus use.** For each facility keep the committed amount, the drawn amount and the available capacity apart at each reporting date. Letters of credit reduce availability; they are not borrowings. A commitment that expired undrawn stays in the register with its end date.
3. **Substitution and takeout.** When one instrument replaces another, link them (`replaced_by`, `refinanced_by`, `drawn_from`, `part_of`). Never present the replacement as additional to the original. `strategy_calc.py totals` reads only `part_of` and `drawn_from`: it drops an item whose ancestor through those links, direct or indirect, sits in the same currency/instrument/status group. It does not read `replaced_by`, `refinanced_by` or `backstopped_by`, so before totalling give each replaced or refinanced original its ended status, or leave it out; otherwise an original and its replacement in the same group are summed. Net and gross proceeds stay distinct (gross, discount/fees, net).
4. **Fee and cost bases.** State each fee's numerator, denominator and period. A commitment fee on a headline facility amount and an underwriting discount on gross proceeds have different bases; do not rank them as if comparable, and do not annualise a one-off fee unless the source does. See `references/financing-traps.md`.
5. **Dilution.** State which base each figure uses: new shares ÷ post-offering shares (ownership dilution) versus new shares ÷ pre-offering shares (share-count increase). Report both with labels if both are useful; never swap one for the other.
6. **Obligations and backstops.** Record incremental-financing obligations, backstops, put/call rights and covenants as conditional terms. A backstop is not cash unless exercised; do not model backstop cash unless the scenario says so and labels it.
7. **Use-of-proceeds restrictions.** Quote the clause (section number) that restricts sources or uses; summarise its effect without widening it.
8. **Bridge.** Where the product explains a change in cash or liquidity between two dates, build a bridge from reported cash-flow lines and run `strategy_calc.py bridge` (in `smpt-investment-appraisal/scripts/`) so components must tie to the reported change with a zero residual. Any residual is shown, not absorbed.
9. **Attribution.** Rank candidate explanations for a financing event (ordinary takeout, policy-enabled terms, covenant pressure, market window) by evidence. A shared date is not causation; state the strongest explanation as a judgment and what would refute it.

## Deliverables

- Instrument register with roles and dates.
- Facility timeline (committed / drawn / available / ended) at each reporting date.
- Substitution map.
- Fee and dilution table with explicit bases.
- Liquidity snapshot at a stated date and, if needed, a tied cash bridge.
- Attribution note: competing explanations, evidence, judgment, refuting evidence.

## Verification

- Bridge ties (script output `ties: true`, residual 0) or the residual is displayed.
- `strategy_calc.py totals` used for any subtotal: groups by currency, instrument and status; no grand total.
- Every fee and dilution figure names its numerator, denominator and period.
- No replaced, expired or undrawn amount is counted as funding; no backstop shown as cash.
- Run `references/financing-traps.md` against the draft.

## Completion

Complete when a reviewer can tell, for any date in scope, what was committed, drawn, available and ended, what replaced what, and why the preferred explanation for the financing beats the alternatives.

## Boundaries

- Securities filings and recipient disclosures support contract and financing facts they state directly; they do not support government rationale or framing (`CLAUDE.md` rule 6).
- No valuations, credit ratings, or price targets. No investment advice.
- Do not edit `data/seed/financial-commitments.json`; propose tracker changes through the candidate workflow separately.
