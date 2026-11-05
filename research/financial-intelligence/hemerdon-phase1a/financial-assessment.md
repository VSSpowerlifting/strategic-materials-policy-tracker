# Government capital supports Hemerdon's restart; short debt tenor leaves execution and refinancing exposure

Research cutoff: **4 November 2026**. Internal analytical foundation for review. Values are GBP unless indicated. Financial years end on 31 March. IDs in parentheses resolve through [the claim matrix](claim-source-matrix.csv) and [source register](sources.json). Management guidance remains attributed to the company.

## £61m of core NWF financing sits inside the £71m headline

The National Wealth Fund announced £36m of equity and up to £35m of lending on 25 August. The company accounts and October presentation identify the lending as a £25m core facility and a £10m **uncommitted** accordion. The accounts state that the £25m facility was drawn in full by their 2 September approval date. The transaction adviser independently describes the same structure and says part of the equity refinanced existing short-term debt. Therefore £61m is the gross equity-plus-core-loan transaction amount. £71m includes contingent additional lending, and neither figure is current cash available for construction. (`hfi-nwf-equity`, `hfi-nwf-loan`, `hfi-nwf-accordion`; [NWF release](https://www.nationalwealthfund.org.uk/news-and-publications/news/national-wealth-fund-backs-tungsten-west-to-unlock-critical-uk-tungsten-supply/), [adviser account](https://www.mayerbrown.com/en/news/2026/09/mayer-brown-advises-tungsten-west-on-strategic-investment-by-the-uk-governments-national-wealth-fund-in-the-hemerdon-tungsten-tin-project))

This is a useful reconciliation of disclosure granularity. The public £35m maximum is compatible with a £25m drawn core plus £10m uncommitted option. It does not support describing £35m as fully committed or disbursed. Existing SMPT seed records preserve the August announcement vintage; this research does not alter them.

The accounts describe a 366-day term from drawdown, while the original August RNS says from the definitive agreement date; October slide33 states the tenor without a start date. That conflict prevents an exact maturity date. The October presentation states SONIA plus 5.5%, increasing by one percentage point per quarter, and a fixed and floating debenture. Equipment finance is secured on equipment. These are issuer disclosures, not a review of executed agreements. Exact draw date, rate fixing, fees, covenant tests, security ranking and cure rights remain unresolved. The August proposed terms identify DRL as borrower and PLC, Tungsten West Services and Aggregates West as guarantors; those roles require confirmation in executed documents. FY2028 NWF principal-and-interest guidance of approximately £26m is a fiscal-year cash estimate, not a reconstructed full-life interest schedule. (`hfi-nwf-tenor`, `hfi-maturity-conflict`, `hfi-nwf-borrower`, `hfi-nwf-margin`, `hfi-nwf-step`, `hfi-nwf-security`, `hfi-nwf-service`; October presentation slides 23, 33; [issuer RNS9611R](https://www.lse.co.uk/rns/strategic-investment-by-the-uk-government-nwf-yqliknoaeuaxugf.html))

## The August plan depended on £15m of forecast receipts before peak funding

The original funding appendix sets £88m stated sources against £88m stated uses to an unspecified scheduled peak funding date. Sources comprise £7m opening cash, £5m provision recovery, £36m equity, £25m core debt and £15m anticipated revenue receipts. Uses include £18m bridge repayment and a £13m cash reserve. The £15m is a forecast operating cash source, not additional financing or revenue verified as collected. (`hfi-aug-*`; RNS9611R Appendix)

The rounded detailed uses sum to £87m, £1m below the published £88m total. The release includes a rounding note. The workbook retains that difference and uses the issuer's stated total for the reserve calculation rather than inventing a balancing expenditure. On that basis, non-reserve uses are £75m and planned ending reserve is £13m. Holding other plan items constant, delaying all £15m of expected receipts beyond the peak date leaves a **£2m cash deficit**, or a £15m shortfall against the target reserve. This boundary sensitivity is useful evidence of collection-timing exposure; it is not a forecast that the receipts failed to occur.

The separate August-plan worksheet also permits a core-loan timing counterfactual. With the planned revenue included but the £25m loan delayed, plan cash would be negative £12m. Later full draw disclosure supersedes that hypothetical funding-timing condition as a historical status. Neither this exercise nor the original appendix supplies current cash or the complete November funding gap. October remaining-spend guidance is not added to August uses because the dates and scopes overlap.

## Corporate cash improved before the government transaction

| Consolidated measure | FY2025 restated | FY2026 |
|---|---:|---:|
| Revenue | £0 | £601,550 |
| Operating loss | (£19,013,454) | (£7,905,318) |
| Loss after tax | (£24,693,013) | (£175,446,271) |
| General-use cash and equivalents | £18,442 | £25,485,511 |
| Restricted escrow, separately presented | £14,633,857 | £14,912,042 |
| Operating cash outflow | (£8,078,462) | (£15,058,419) |
| Cash acquisition of PPE | (£19,885) | (£5,633,715) |
| Net equity cash proceeds | £16,572 | £41,029,253 |

Source: FY2026 audited accounts, printed pp.33–36, notes 20, 22 and 37. FY2025 values use those restated comparatives, rather than mixing the original FY2025 balance sheet with the newer accounts. The £43m February gross equity amount is rounded; one directors' passage uses approximately £44m. Exact net equity cash is the appropriate reconciliation input. (`hfi-equity-gross-feb2026`, `hfi-equity-net-2026`)

The reported loss includes £167,324,341 of non-cash convertible-note fair-value remeasurement. The £197,212,441 liability conversion to equity also moved no cash. Neither amount is a measure of operating burn or newly received financing. The note rollforward reconciles opening liability £24,683,100 plus £5,205,000 cash issuance plus £167,324,341 remeasurement to the conversion. (`hfi-cln-*`; accounts note25 printed p.57)

Operating cash outflow includes a substantial receivables increase. An annual historical outflow divided by 12 would misrepresent the restart's prospective monthly requirements. The model therefore does not extrapolate a runway from FY2026 burn. Restricted escrow cannot fund general operations. No complete cash rollforward from 31 March to 4 November was obtained; adding March cash to the later NWF amounts would omit construction, other financing and bridge repayments.

The original FY2025 accounts show £34,065,367 assets and (£520,408) equity. The FY2026 restated comparative shows £31,887,582 and (£4,434,160). Note37 explains restoration, escrow, goodwill and cost-classification corrections. Its narrative refers to escrow within cash and equivalents, while the face statement separates it as non-current escrow. This model follows the face statements and excludes escrow from general-use cash. A public accounting discussion should obtain clarification of that wording.

## PLC shareholders and the mine are different financial exposures

Tungsten West plc is the AIM:TUN issuer, registration 11310159. The audited accounts identify Drakelands Restoration Limited, registration 11854467, as the directly owned operating subsidiary, with 100% ownership. Tungsten West Services Limited and Aggregates West Limited are also wholly owned within the group. The accounts mark only DRL as direct investment; the October group chart depicts all three beneath PLC. That chart is useful orientation, while exact legal ownership chains and borrower/guarantor identities still warrant a Companies House and facility-document check. (`hfi-legal`, `hfi-drl`; accounts note19, printed p.53; October slide33)

The October snapshot has 1,355,958,899 ordinary shares and 257,075,833 non-voting B shares. NWF subscribed for 100m ordinary shares: approximately 7.4% of ordinary voting capital and 6.2% of both share classes before options. This distinction matters when discussing dilution. The presentation says founders' options were likely to expire in October; its fully diluted share total is not treated as a verified November 4 count. No share-price target, equity valuation or forecast equity issue is modeled. (`hfi-ordinary`, `hfi-b-shares`, `hfi-nwf-shares`)

## £40–45m of remaining project spend excludes operating costs

October slide20 forecasts £134m total project expenditure against a £122m budget. Its original restart scope is £5m below budget, mining equipment £3m below, property/bonds/contractual commitments £6m above, and expansion/improvements £14m above. Net £12m growth therefore includes scope changes; treating it all as a construction overrun would be misleading.

Remaining spend is £40–45m, of which £25–35m falls in the financial year ending March 2027 and the balance in the following financial year. The presentation excludes operating costs. Independent extreme combinations imply £5–20m in FY2028, but those are bounds rather than paired management cases. The model does not subtract the remaining number from total project expenditure to label the residual audited historic cash spent: equipment finance, bonds and contractual items complicate that inference. (`hfi-capex-*`, `hfi-remaining-*`, `hfi-fy27-*`)

October equipment-finance disclosure gives £11m current and approximately £22m committed for machines ordered, with 3–5-year terms and approximately 10% pricing tied to GBP swap rates at commissioning. Whether the £22m is entirely incremental to £11m is not established by the available slide. The model does not sum them as £33m debt outstanding. FY2028 approximate £6m equipment principal and interest is used separately as guidance. (`hfi-fleet-*`)

## Cost scenarios quantify incremental requirements without inventing a cash balance

| Scenario | Remaining project spend | Incremental delay | Incremental annual interest proxy | Increment above £42.5m reference | Accordion assumed |
|---|---:|---:|---:|---:|---:|
| Base convention | £42.5m | £0 | £0 | £0 | £0 |
| Upside cost case | £40m | £0 | £0 | (£2.5m) | £0 |
| Downside cost case | £45m | £3m | £0.25m | £5.75m | £0 |

The base uses the midpoint of disclosed remaining-spend guidance; it is an analyst convention. The downside combines the range's upper end with the company's approximately £3m three-month crushing-delay sensitivity and an explicit one-percentage-point, one-year stress on a constant £25m balance. That rate stress is a simple incremental exposure measure, not a prediction or contractual interest calculation. Delay cost has no fiscal-year assignment and is not inserted into FY2028 cash guidance.

The £5.75m downside amount is the increase above the midpoint reference, not a complete financing gap. The upside's negative £2.5m is a reduction in uses, not cash generated. An explicitly hypothetical £10m accordion draw would cover this measured stress but would require agreement and add indebtedness; it cannot establish that the company is fully funded. No availability or timing is assumed by default.

Government support has already occurred, so a “no government” case is a financing counterfactual. Removing gross £61m without reversing the bridge refinancing and reconstruction of contemporaneous alternatives would overstate a precise shortfall. The supported conclusion is narrower: NWF provided material capital access and replaced earlier short debt, while the new short tenor still exposes lenders and shareholders to production and refinancing outcomes. The evidence does not quantify a financing-cost subsidy against a verified private-market alternative.

## FY2028 coverage thresholds isolate cost exposure, without forecasting APT

The company's October outlook is more than 3,300 tonnes contained WO3 and more than 600 tonnes tin for FY2028. The model uses 3,300 tonnes as a conservative **reference volume**, not exact guidance. At the 79.5% FS25 payability coefficient and a modeled 3% deduction on payable metal receipts, each £1/mtu of GBP APT reference supports £254,479.50 of annual tungsten receipts:

`3,300 tonnes × 100 mtu/tonne × 79.5% × (1 − 3%)`.

Cash opex plus sustaining capex is guided at £70–75m. Add approximately £6m fleet debt service, approximately £26m NWF principal and interest, and the £7m Hargreaves termination payment excluded from operating-cost guidance. The resulting core annual cash requirement is £109–114m, with a £111.5m midpoint. (`hfi-wo3-fy28`, `hfi-payability`, `hfi-royalty`, `hfi-opex-*`, `hfi-fleet-service`, `hfi-nwf-service`, `hfi-hargreaves`; slides22–23)

The corresponding **tungsten-only core coverage reference** is £428.33/mtu, £438.15/mtu and £447.97/mtu for upside, base and downside costs. It excludes tin and aggregates receipts, remaining restart capital, new discretionary growth, cash taxes and working-capital changes. Those omissions work in both directions, so the threshold is not a conservative bound on total project break-even. Contract-specific payability and the royalty base also require confirmation. It is not a commodity forecast, NPV, all-in sustaining cost or lender DSCR.

At fixed coefficients, a £100/mtu change in GBP reference price changes the annual tungsten receipt proxy by approximately £25.45m. This is a local linear sensitivity, subject to delivery, recovery, contract and collection assumptions. The workbook intentionally leaves a forward APT price blank. Users may enter a clearly independent GBP assumption; no USD price or exchange-rate forecast is silently supplied.

## Commercial contracts improve market access without fixing revenue

The 23 September issuer announcement describes a binding eight-year Elmet agreement for 1,000 tonnes contained WO3 annually. Pricing is variable and APT-linked; its stated nominal value exceeding £1.4bn at prevailing prices is expressly not guaranteed revenue. The further 500 tonnes processing provision requires commercially reasonable endeavours and agreement of commercial and delivery terms. It cannot be added as firm annual sales. ([Issuer RNS in FCA NSM](https://data.fca.org.uk/artefacts/NSM/RNS/5863657b-8c2a-4537-999f-c7e5ee92f995.html); `hfi-elmet-*`)

The government's negotiation right for up to 50% of study production remains distinct from the Elmet volume. The disclosed evidence does not establish a completed UK purchase agreement, guaranteed floor price or prepaid funding. EU Strategic Project recognition in existing SMPT records is designation evidence, with no cash award attributed here.

## The strongest remaining diligence questions concern timing and enforceability

For investors, recent concentrate sales do not establish steady-state recoveries, margins or cash conversion. The prior operator's failure, processing changes, ramp-up and larger owned fleet make operating performance material. Strong APT markets can improve prospective receipts independently of government financing. The government transaction alone does not validate the company's cost or volume claims.

For lenders, the critical sequence is commissioning, reliable production, product acceptance, receivable collection and repayment before or at the NWF maturity. A short-term loan against a long-lived industrial asset creates refinancing dependence if ramp-up slips. Public backing does not itself provide a guarantee of further funding. Full security priority, DSCR tests, liquidity reserves and covenant headroom require executed documents.

For corporate liquidity, the next useful evidence is a same-date unrestricted-cash and debt snapshot, April-to-cutoff cash bridge, committed/paid/outstanding capex ledger and a monthly forecast through NWF maturity. A current standalone DRL financial statement, tax/working-capital schedules, remaining equipment drawdowns, and contract-specific pricing/collection terms would permit a stronger project model. Production-life and permitting extensions should be established from current operative permissions before adding terminal periods.

The current artifact can support source-attributed conclusions about financing structure, historical cash and costs. It cannot yet support publication-grade claims about a precise current funding gap, independent project value, equity upside, repayment sufficiency or the causal value created by industrial policy.
