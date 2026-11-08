# Source register and claim matrix

## Cutoff

| Field | Value |
| --- | --- |
| Product ID | e.g. FI004 |
| Evidence cutoff | YYYY-MM-DD (sources published after this date are excluded or flagged) |
| Inherited holds / frozen inputs | path and reason, or "none found" |
| Register owner | name |

## Sources

| ID | Issuer | Title | Type | Published | As-of / effective | Locator | Accessed | Tier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | Issuer name | Exact title | 10-Q / statute / press release / award notice | YYYY-MM-DD | YYYY-MM-DD | URL + p. / § / table | YYYY-MM-DD | primary official · binding filing · issuer disclosure · secondary |

Tier guidance: a binding securities filing supports contract, financing and capacity facts it states directly, never government rationale. Secondary reporting may point to a primary; it does not replace an available one.

## Claims

| Claim ID | Claim or figure (as stated) | Unit / currency | Source ID | Locator | Class | Formula or assumption | Status (see ladder) | As-of |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | "US$400 million" preferred equity | USD m | S02 | §2.1 | reported | — | binding commitment | YYYY-MM-DD |
| C02 | Fee as % of facility | % | S03, S04 | — | derived | 7.4 / 1,000 | — | YYYY-MM-DD |

Classes: **reported** · **derived** · **modeled** · **judgment**. A derived figure names its inputs; a modeled one names its assumption; a judgment names whose judgment.

## Reconciliations

| Item | Source A says | Source B says | Reason for difference | Adopted | Note |
| --- | --- | --- | --- | --- | --- |

## Gaps

| Needed for | Missing evidence | Effect on conclusion | Treatment (limitation / diligence item / hold) |
| --- | --- | --- | --- |
