# FI003 reader guide — draft 0.5

**JPMorgan and MP Materials: Financing Through 10X Construction**

Benjamin Yang · Codex-assisted SMPT research · source cutoff November 6, 2026

**Ready for human financial/editorial review. Publication authorization pending.**

The primary audience is a finance team arranging a comparable industrial build. The case examines replacement financing and monitoring through commissioning. It does not recommend an investment in MP Materials or certify completion funding.

## Finding and strongest alternative

JPMorgan participated across a joint replaceable construction commitment, completed common-equity underwriting and corporate credit. Goldman shared the original commitment and the same approximately 40% initial underwriting allocation; Morgan Stanley underwrote approximately 20% initially and helped arrange the revolver. Initial underwriting obligations do not establish retained holdings or fee shares. JPMorgan’s adviser description is its own account. The evidence supports continuity across financing stages, with substantial partner roles.

An ordinary equity takeout during an available financing window best explains the observed transition. Apple’s July 15, 2025 agreement is a credible contemporaneous influence on investors. Government support is documented in cash receipts and the credit contract, but its contribution to equity demand and pricing is unisolated. Neither unique bank indispensability nor an optimal capital mix is established.

## Financial results and limits

| Measure | Result and interpretation |
|---|---|
| Construction commitment | At least $1bn jointly committed; issuer reports August 26, 2025 expiration undrawn after replacement financing. It was never a received $1bn construction loan |
| Common equity | 13,590,908 shares at $55; $747.499940m gross, $725.0749418m after underwriting discount/before other expenses, $724.2m reported final net cash. The discount is 3%, a transaction cost rather than cost of equity |
| Isolated ownership dilution | New shares / (163,477,816 July-9 basic shares + new shares) = 7.675499%. Share-base growth against the old denominator is 8.313610%. Other issuances, preferred conversion, warrants, options and convertibles are excluded |
| Corporate revolver | $275m commitment including a $200m letter-of-credit sublimit. At September 30, 2026: zero loans, implied $72m letters of credit, $203m conditional borrowing capacity. Capacity is separate from cash |
| Price-protection cash | MP reports $110.9m receipts in the first nine months of 2026. $51.016m opening receivable + $67.962m income − $8.109m closing receivable = $110.869m, consistent with the rounded disclosure |
| Corporate liquid assets | $1,830.286m at December 31, 2025 to $1,337.911m at September 30, 2026: −$492.375m. This company-wide historical change is separate from remaining 10X cost or covenant-eligible cash |

Equity removes scheduled principal/coupon claims on those proceeds and transfers residual ownership. Specified-source/use rules constrain allocation. The government agreement includes a conditional preferred-purchase fallback below $350m incremental net financing; the July equity raise exceeded that threshold. No additional fallback cash is counted. MP also undertakes reasonable best efforts to raise further capital if enumerated funding proves insufficient.

The credit agreement permits a Test-Period Defense-contract EBITDA adjustment above attributable net income, supported by the borrower’s certificate and a later reversal for duplicative cash. **Actual use and financial effect remain unknown.** Defense-contract performance is also a covenant, with a Material Adverse Effect exception. No existing default is inferred.

Before the trigger, minimum unrestricted contractual cash/Cash Equivalents is $500m. The trigger is the earlier delivery of a qualifying certificate showing at least $400m covenant EBITDA over the applicable four-quarter Test Period, or required Q2 2027 statements. Leverage and cash-interest tests begin at the first subsequent quarter-end. An assumed August 15, 2027 delivery gives September 30, 2027, before the calendar bounds of management’s expected 2028 commissioning. That date is an illustration, not a legal deadline or COD forecast.

COD means commercial operation date: operations have begun, any quantity of magnets can be produced, and notice has been given. The production milestone is the quarter-end of written notice that the plant has achieved commercial operation and can produce the annual target capacity. These are distinct from commissioning. The illustrative 2029 threshold is $75.770m at 50% pre-milestone capacity and $151.541m after the milestone. These full-year definitions exclude payment stubs and annual true-up. Future appropriations and payment timing remain material conditions.

NdPr means neodymium-praseodymium. PPA means price protection agreement. HREE means heavy rare earth elements. TSIF means Texas Semiconductor Innovation Fund. Section 45X is the manufacturing production tax credit. Contractual EBITDA (earnings before interest, taxes, depreciation and amortization, with specified adjustments) differs from reported Adjusted EBITDA and from cash available for debt service.

## Decision implications

A comparable sponsor should confirm settled replacement proceeds, permitted uses and usable remaining credit before cancelling a committed route. Treasury and lenders should reconcile eligible liquidity, letters of credit, construction/ramp spending, collections and certificates by date. A projected shortfall calls for earlier financing, revised spending or an amendment under the operative terms. Public-support assessments should distinguish entitlement and contract performance from covenant recognition.

Original commitment/fee terms, actual certificates and remaining project spend/collection schedules are unavailable. They prevent capital-cost optimization, demonstrated addback/headroom and a completion-funding forecast respectively. The $0.8m final-net-plus-capacity cancellation comparison remains unresolved; issuer-reported expiration controls instrument status.

## Files and reproduction

The candidate package contains the editable draft 0.5 PowerPoint, its matching PDF, unchanged model 1.0 XLSX, claim/source registers, this guide, the full text/data slide manifest, eleven schedules, model inputs/specification and calculation/verification scripts. The manifest supplies selectable text and numeric equivalents for the deck’s evidence, including all three charts and the complete waterfall. Chart workbooks inside the PPTX contain literal snapshots; they do not automatically synchronize with model edits.

In the package’s `research/fi003/` directory, use Python 3 to run:

```sh
python3 -m unittest discover -s . -p 'test_*.py' -v
python3 prototype.py --check
python3 model.py --check
python3 presentation/prepare.py --check
```

The delivered XLSX has six editable tabs and 388 formula cells. Model recalculation was historically verified in LibreOffice and native Sheets. This phase rechecked delivered caches and saved scenario evidence; it does not claim a new Microsoft Excel or live Sheets session. Later copies are independent.

Source URLs link to original documents; originals, bank articles/transcripts and standalone fonts are excluded. Exhibits and prose are original SMPT transformations/paraphrases. Archivo is used under the [SIL Open Font License](https://github.com/Omnibus-Type/Archivo/blob/master/OFL.txt), with font embedding in the PDF only. The package excludes internal trackers, private native-Sheet links and sharing records. It conveys no institutional endorsement or publication permission.

Draft 0.5 adds an ownership donut beside the original share calculation and replaces the government-support table with a relationship diagram showing all four instruments and their retained conditions. Five precise tables, three editable native charts and the full-precision waterfall remain. The PDF contains selectable text, language and structure tags. Text-free decorative vectors are marked as artifacts; all fifteen slide headlines have H1 tags and selected subheadings have H2 tags. Twelve meaningful evidence descriptions, five table structures and 46 hyperlinks remain. Automated structural/contrast checks and visual inspection do not establish PDF/UA compliance or assistive-technology usability. Native Microsoft PowerPoint compatibility, manual accessibility and assistive-technology review and Benjamin’s exact-file approval remain release gates.
