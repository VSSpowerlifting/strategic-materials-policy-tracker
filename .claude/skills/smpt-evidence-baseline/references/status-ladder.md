# Status dimensions

The exhibit rules show a single ladder (announcement → authorization → binding commitment → drawdown → expenditure → operational milestone) for display. For coding, treat these as **separate dimensions** (`docs/operating-playbook.md`): a figure can be binding but conditional, drawn but not spent, or announced and later withdrawn. Record each dimension that applies, with its own source and date.

## Money

| Role | Meaning | Typical evidence | Never treat as |
| --- | --- | --- | --- |
| Ceiling / envelope | Maximum a programme or facility may provide | Programme notice, facility agreement | Money committed to a recipient |
| Announced | Stated intention, not yet binding | Press release, speech | A commitment |
| Authorized / approved | Body with authority has approved | Board or agency decision, conditional commitment | A signed agreement |
| Committed (binding) | Signed, enforceable obligation (may carry conditions) | Executed agreement, filing exhibit | Cash received |
| Drawn / disbursed | Funds actually advanced or paid | 10-Q borrowings, agency disbursement data | Spent on the project |
| Spent | Applied to the stated use | Capex disclosure | Outcome achieved |
| Ended | Expired, terminated, withdrawn, lapsed, replaced | Notice, filing | Zero history (keep the record and its date) |

Rules: never add amounts in different roles, instruments or currencies; never count a child (`part_of`, `drawn_from`) with its parent; private capital and total project cost are not public support; an option or backstop is not cash until exercised.

## Legal and policy

announced · proposed / consultation · adopted / enacted · published · effective · implemented / enforced · suspended · repealed. A restriction's existence is not a measured supply effect.

## Physical

planned capacity · permitted · under construction · commissioned · nameplate · achieved output · qualified / sold. Capacity is not output; issuer-reported output is not independently verified output.

## Recording one figure

`<amount> <currency> · <instrument> · <role> · conditions: <…> · as of <date> · source <ID locator>`

Example: `1,000 USD m · committed revolving / bridge commitment · committed then ended (expired undrawn) · as of 2026-08-26 · S07 p.12`.
