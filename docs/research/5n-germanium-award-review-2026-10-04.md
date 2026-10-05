# 5N Plus St. George germanium awards: source-to-claim ledger

Review date and read date for every source below: **2026-10-04**. Every source in rows 1–12 was read twice that day: a first pass
(filings and pages read 16:14–16:21 UTC) and an independent second pass that re-fetched and re-read each row (finished 16:37 UTC).
Row 13 (the web search for further primary documents) was run once, in the first pass. Rows 14–18 and the sections on the 2024
outlay lines, amounts, rendered output and `site.lastUpdated` come from a second, narrower accounting review the same day
(rows 14–18 retrieved once each, 2026-10-04, after 17:00 UTC).
Baseline: `origin/main` `b4183f8`. Scope: `fin-us-dod-5n-germanium-2024` and `fin-us-dow-5n-germanium-2025` only.
This is a dated research record. PR #44's baseline tables (`docs/analysis/`, branch
`analysis/concern-response-baseline-2026-10-03`, head `b2cbd41`) are not edited; the comparison is in the last sections.

Attribution key: **GOV** = government statement; **FED-DATA** = federal award data reported by the agency;
**RECIPIENT** = 5N Plus statement (a press release, a securities filing or a company publication, never government confirmation).

> **Unresolved: the announced $14.4M does not reconcile with the federal record.** USAspending reports a federal obligation of
> $12,458,128 and non-federal funding of $2,505,981 ($14,964,109 together) for the 2024 award. The federal dataset does report an
> obligation; what is unresolved is how the announced $14.4M relates to it. None of the three figures is confirmed as the amount
> executed or paid, and no reconciliation is invented. See "Amounts kept distinct".

## Answers

| Question | 2024 award (`fin-us-dod-5n-germanium-2024`, $14.4M, space-qualified substrate capacity) | 2025 award (`fin-us-dow-5n-germanium-2025`, $18.1M, germanium recovery and refining) |
| --- | --- | --- |
| 1. Executed agreement? | **Established by the federal award record** (FED-DATA): cooperative agreement FA86502425501 signed **2024-04-11**, definitized by modification PZ0001 on 2025-05-20. The agreement text was not inspected. | **No execution or payment evidence established in the reviewed sources.** GOV says an "investment" was made on 15 December 2025; RECIPIENT says "has been awarded". No source says an agreement was executed, and USAspending lists no matching award (searched 2026-10-04, an absence that can lag). |
| 2. Payment disclosed? Date or amount? | **Not stated by DoD or by 5N+** in any release or filing through 3 August 2026. **Reported in federal data only:** USAspending's File C (reported by DoD on federal account 097-0360 and linked to the award by its FAIN) carries three gross-outlay lines for the award: $998,701.28 (FY2024 period 9), $1,032,342.24 (FY2025 period 9) and $399,308.73 (FY2026 period 6). Each is a fiscal-year-beginning-to-period-end figure, so they are observations from three separate fiscal years; they are not totalled. By the official definition an outlay is a payment made to liquidate an obligation. The award summary's $0 account outlay is explained by USAspending counting only each fiscal year's latest closed DoD submission: the FY2024 and FY2025 year-end submissions are available and carry no line for the award, and FY2026's year-end submission did not yet exist at retrieval on 2026-10-04. Recorded as `partially_disbursed` with **federal-reporting attribution only**: payment date null (a reporting period is not a payment date), no amount paid recorded, payee unknown. See "The 2024 outlay lines". | **No execution or payment evidence established in the reviewed sources** (no date or amount of payment found; this describes the sources read, not whether a payment has been made). |
| 3. Physical implementation stage supported for the funded scope | **Announced only** (DoD, 2024-04-16: "upgrading and expanding production facilities and tools"). "Announced" records the stated plan, not construction; no later stage is evidenced. | **Announced only** (DoW, 2026-01-29: "will expand"), a stated plan and not construction. RECIPIENT wording stays future-tense through its 2025 Sustainability Report (undated; file metadata April 2026) ("planned expansion", "will increase … over the next four years"). No later stage is evidenced. |
| 4. Same facility and project? | **Yes at announcement level.** GOV, RECIPIENT release and RECIPIENT MD&As name the St. George, Utah facility and germanium substrates. The USAspending place of performance is "multi-state", so it does not confirm the facility. | **Yes at announcement level.** GOV and RECIPIENT release name St. George and germanium recycling/refining; RECIPIENT's 2025 sustainability report (p. 42) also ties the U.S.-government award to St. George. The FY2025 MD&A does not name St. George. |
| 5. Amount: announced versus federal record | **Unresolved.** Announced $14.4M; reported federal obligation $12,458,128; non-federal funding $2,505,981 ($14,964,109 together). None is confirmed as executed or paid. See "Amounts kept distinct". | $18.1M announced; no federal record found to compare, so nothing to reconcile. |

Three cautions on question 4.
(a) The 2024 GOV release also lists "improvements in germanium sourcing, recovery, and refining", the same subject as the
2025 scope. The awards stay distinct on award, date, amount and stated scope, and no money is split between them.
(b) 5N+'s 22 September 2026 release announces a roughly 50% St. George facility expansion. It says the expansion "follows
two recently announced U.S. government awards" and "will be funded within the Company's existing capital expenditure plans
and support from customers". It does not say either award funds it, so it is general site expansion and is **not**
physical-stage evidence for either funded scope. It also reads inconsistently on construction: "While construction is
ongoing" in one paragraph, "Construction is expected to begin in Q3 2026" in the next.
(c) The 2025 sustainability report attaches space-qualified solar-cell capacity to the germanium recovery award; that is
the 2024 award's subject. It also says the award was announced "in 2025", where GOV and the company's release say January 2026.
Neither point is coded.

## Ledger

| # | Source | URL | Locator | Published | Read | Attribution | Supports | Does not support |
| - | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | DoD release, "DOD Awards $14.4 Million to Sustain and Enhance the Space-Qualified Solar Cell Supply Chain" (`src-dod-5n-germanium-2024`) | <https://www.war.gov/News/Releases/Release/Article/3743467/dod-awards-144-million-to-sustain-and-enhance-the-space-qualified-solar-cell-su/> (seed keeps the `defense.gov` URL for the same article; `curl` gets 403 from both, read in the browser pane on `war.gov`) | Paragraph 1 (award of $14.4M via DPAI to 5N Semi); paragraph 3 (scope, "St. George, Utah", "planned to last four years") | 2024-04-16 | 2026-10-04 | GOV | Announced award, amount, provider, program, recipient, facility, four-year plan, scope including sourcing, recovery and refining; "upgrading and expanding production facilities and tools" (the `announced` physical entry) | Executed agreement, payment, any later physical stage |
| 2 | USAspending award record `ASST_NON_FA86502425501_097` (`src-usaspending-fa86502425501`), plus `/transactions/` and `/awards/funding/` | <https://www.usaspending.gov/award/ASST_NON_FA86502425501_097/> (read through `https://api.usaspending.gov/api/v2/awards/ASST_NON_FA86502425501_097/`) | Summary: type "Cooperative Agreement", FAIN FA86502425501, description "DPA Title III – Sustainment and Enhancement of Space-Qualified Solar Cell Supply Chain", recipient 5N PLUS SEMICONDUCTORS LLC (Saint George, UT), `date_signed` 2024-04-11, period 2024-04-11 to 2028-07-30, `total_obligation` $12,458,128, `non_federal_funding` $2,505,981, `total_account_outlay` $0, `total_account_obligation` $10,027,775.75. Transactions: modification 0 "New Award" 2024-04-11 ($3,999,799), PZ0001 "modification to definitize the agreement" 2025-05-20 ($4,784,881), P00002 and P00003 non-financial, P00004 2026-03-26 ($3,673,448). Funding: gross-outlay lines $998,701.28 (FY2024 month 9), $1,032,342.24 (FY2025 month 9), $399,308.73 (FY2026 month 6) | no publication date (living record; last modified 2026-04-01) | 2026-10-04 | FED-DATA | Executed cooperative agreement signed 2024-04-11; provider, authority and recipient; identity with the DoD release (the description matches its title and the signing precedes the announcement by five days); federal obligation $12,458,128 | The $14.4M amount (not reconciled: $12,458,128 federal obligation and $2,505,981 non-federal funding, which the record's own `total_funding` field adds to $14,964,109); the facility (place of performance "multi-state"); **a payment date, a payee or an amount paid**. The outlay lines support only the `partially_disbursed` status entry, as federal-reporting attribution; see "The 2024 outlay lines" and rows 14–18 |
| 3 | 5N+ release, "5N+ Awarded US$14.4 Million by U.S. Department of Defense" (`src-5n-germanium-2024`) | <https://www.5nplus.com/media/uploads/news/2024-04/b2024-04-18_dod_award_kYnCTid.pdf> | Opening paragraph; second paragraph ("Based on meeting certain conditions, over the next four years …") | 2024-04-18 | 2026-10-04 | RECIPIENT | Award, amount, "certain conditions", four years, manufacturing upgrades at St. George | The phrase "pre-set milestones" (it is not in this release; the seed previously implied it was), sourcing/recovery/refining, execution, payment |
| 4 | 5N+ Q1 2024 MD&A (`src-5n-mda-q1-2024`) | <https://www.5nplus.com/media/uploads/documents/b2024-05-06_mda_q1_2024.pdf> | p. 4, "Subsequent to quarter end, the Company also announced …" (the PDF uses non-breaking hyphens in "pre‐set" and "four‐year") | 2024-05-06 | 2026-10-04 | RECIPIENT (securities filing) | "subject to certain conditions and the achievement of pre-set milestones over a four-year term"; St. George germanium-substrate facility | Execution date, receivable, payment |
| 5 | 5N+ Q2 2024 MD&A (`src-5n-mda-q2-2024`) | <https://www.5nplus.com/media/uploads/documents/b2024-08-05_mda_q2_2024.pdf> | p. 4, "Earlier in Q2 2024, the Company also announced …" | 2024-08-05 | 2026-10-04 | RECIPIENT (securities filing) | Same wording as #4 | Same as #4 |
| 6 | Sweep of all 42 PDFs on 5N+'s financial-documents pages for 2024, 2025 and 2026: every MD&A, financial statement, press release, AIF (FY2024, FY2025), management circular, annual report and sustainability report (`https://www.5nplus.com/en/investors/financial-documents/?year=2024`, `2025`, `2026`) | same index pages | Text extracted and searched (hyphen- and whitespace-normalised) for germanium, Department of Defense/War, DPA/Defense Production, $14.4/$18.1 million, St. George, milestone, government grant/assistance; hits read in context | 2024-05-06 to 2026-08-03 | 2026-10-04 | RECIPIENT | Negative findings only. Department of Defense appears only in the Q1 and Q2 2024 documents; "DPA" and "Defense Production" appear nowhere; the Q3 2024 to Q2 2026 MD&As do not discuss the 2024 award. The **Q1 and Q2 2026 MD&As have no hit** for germanium, St. George, Department, DoD, DPA or government grant/assistance. The only "government assistance" ($1,332 thousand in 2024, $345 thousand in 2025, $120 thousand in H1 2026) relates to interest-free loans (FY2025 FS p. 26; Q2 2026 FS p. 12), not these awards. The FY2025 FS carry only a generic government-grants accounting policy (p. 17). AIFs describe St. George as an existing germanium site; sustainability reports mention it in site descriptions, plus row #9 | Any payment or receivable. A text search cannot prove absence; this is "none found", not "none exists" |
| 7 | DoW release, "Department of War Invests $18.1M to Increase U.S. Refining Capacity for Germanium Metal" (`src-dow-5n-germanium-2026`) | <https://www.war.gov/serve-from-netstorage/News/Releases/Release/Article/4393075/department-of-war-invests-181m-to-increase-us-refining-capacity-for-germanium-m/index.html> | Paragraph 1 ("a 15 December 2025 investment of $18.1 million in Defense Production Act (DPA) Title III funds"; delayed by the shutdown; "will use"; St. George); paragraph 4 (sevenfold to more than 20 metric tons annually) | 2026-01-29 | 2026-10-04 | GOV | Announced investment dated 15 December 2025, provider, authority, recipient, facility, intended scope. It also names the Additional Ukraine Supplemental Appropriations Act of 2022 as the funding source (not coded) | Executed agreement, payment, physical stage beyond announced (all verbs are future) |
| 8 | 5N+ release, "5N+ Awarded US$18.1 Million by U.S. Government …" (`src-5n-germanium-2026`) | <https://www.5nplus.com/en/news/5n-awarded-us181-million/> | Opening paragraph; second paragraph (48 months; "In time, it should enable … up to 20 metric tons") | 2026-01-30 | 2026-10-04 | RECIPIENT | "has been awarded" a US$18.1M grant; St. George; recycling and refining; 48 months; up to 20 t/yr | Execution, conditions, payment, any stage |
| 9 | 5N+ FY2025 MD&A (`src-5n-mda-q4-2025`) | <https://www.5nplus.com/media/uploads/documents/b2026-02-24_mda_q4_2025.pdf> | p. 4, Specialty Semiconductors discussion, "In early 2026, the Company announced that it has been awarded a US$18.1 million grant …" (repeated in the 2025 annual report, p. 24) | 2026-02-24 | 2026-10-04 | RECIPIENT (securities filing) | The company's filing describes it as awarded, for germanium recycling and refining | St. George, execution, conditions, payment |
| 10 | 5N+ 2025 Sustainability Report (`src-5n-sustainability-2025`) | <https://www.5nplus.com/media/uploads/documents/b5n_sustainability_report_2025.pdf> | p. 42, Waste Management, "Driving Circularity Through Germanium Recovery" | not stated (PDF created 2026-04-27, server last-modified 2026-04-28; file metadata only, so the seed records `datePublished` null) | 2026-10-04 | RECIPIENT (company publication, not a filing) | "planned expansion" of germanium recovery and recycling at St. George, "supported by a significant financial award from the U.S. government", to increase recovery "over the next four years": same facility and the planned stage, as of about April 2026 | Execution, payment, any stage beyond planned; the award's date (it says 2025) |
| 11 | USAspending searches, recipient text "5N PLUS" and "5N+", and keyword "germanium" from 2024-01-01, run over contract, IDV, grant, direct-payment and other award-type groups (to 2026-09-30). The recipient-name searches returned far fewer than the 50-row limit per group, so they are complete and carry the negative finding; the keyword search read only the top 50 by amount per group, filtered to 2024 starts, and is corroborating | `https://api.usaspending.gov/api/v2/search/spending_by_award/` | Result lists: assistance FA86502425501 (2024), FA86502025525 (2020, $9,336,759, to 2027-08-22), FA86501225503 (2012, $11,454,939), DEEE0011418 (DOE, 2025, $53,331.64, a tellurium-extraction project description); contracts and IDVs are small DLA germanium-wafer storage and rotation orders. The loan group returned HTTP 400 and was not read | n/a | 2026-10-04 | FED-DATA | Negative finding: no record after 2024-04-11 matches the $18.1M refining scope. The 2012 and 2020 DPA Title III awards to the same recipient are earlier, separate records and out of scope; only FA86502425501 fits the DoD release's title and the April 2024 timing | A guarantee that a record will not appear later; coverage of an agreement vehicle outside these groups |
| 12 | 5N+ release, "5N+ to Expand St. George, Utah Production Facility by 50% …" (`src-5n-st-george-expansion-2026`) | <https://www.5nplus.com/en/news/5n-to-expand-st-george-utah-production-facility-by/> | Paragraphs 1–3 (plan, construction timing); paragraph 5 ("follows two recently announced U.S. government awards"); final paragraph (funding) | 2026-09-22 | 2026-10-04 | RECIPIENT | A forward-looking facility expansion plan. Construction is *expected* to begin Q3 2026 | That either award funds it; that construction has begun; any stage for either funded scope |
| 13 | Web search for further primary documents on `businessdefense.gov`, `sam.gov`, `war.gov`, `defense.gov` (first pass) | n/a | Results were the two releases above and unrelated awards | n/a | 2026-10-04 | n/a | Nothing further located | An exhaustive search: no agreement text or DPA project page was found |
| 14 | USAspending File C downloads, "Account Breakdown by Award", for federal account id 5985 (097-0360, Defense Production Act Purchases, Defense), FY2024, FY2025 and FY2026, requested through `POST https://api.usaspending.gov/api/v2/download/accounts/` (`account_level` treasury_account, `submission_types` award_financial, period 12) and fetched from the returned `files.usaspending.gov` URLs. All 343 rows in the files are account 097-0360. Files: `FY2024P01-P12_All_TAS_Assistance_AccountBreakdownByAward_2026-10-04_H17M02S47_01.csv`, `FY2025P01-P12_…_H17M07S43_01.csv`, `FY2026P01-P12_…_H17M07S45_01.csv` (and the Contracts and Unlinked files, read for the same FAIN; the Unlinked files hold no rows) | the `files.usaspending.gov/generated_downloads/` URL named in each job's status response | Rows where `award_unique_key` = `ASST_NON_FA86502425501_097`: eight, listed in "The 2024 outlay lines". Per-period row counts for the account computed from the same files | USAspending `last_updated` 09/30/2026 (data), files generated 2026-10-04 | 2026-10-04 | FED-DATA | The eight lines, their field names, fiscal periods, TAS, program activity, object class, DEFC and award linkage; which periods hold rows for the account | A payment date, a payee, or the final FY position of the award. Retrieved as scratch copies outside the repository and not committed |
| 15 | USAspending data dictionary (`https://api.usaspending.gov/api/v2/references/data_dictionary/`) | same | Element `GrossOutlayAmountByAward_CPE`: account file `FA_AccountBreakdownByAward.csv, TAS_AccountBreakdownByAward.csv`, account element `gross_outlay_amount_FYB_to_period_end`, table `financial_accounts_by_awards`, database element `gross_outlay_amount_fyb_to_period_end`. Definition (from OMB Circular A-11 section 20, June 2015) begins "Payments made to liquidate an obligation" and continues "Outlays generally are equal to cash disbursements". The sibling element `GrossOutlayAmountByAward_FYB` (database `gross_outlay_amount_by_award_fyb`) carries the same text and is not the downloaded column | n/a | 2026-10-04 | FED-DATA (definition) | What an outlay is, and which dictionary element and database column the downloaded field is | The time basis (the definition does not state it; it comes from the column name `FYB_to_period_end`); that a given line is a payment *to this recipient* |
| 16 | USAspending's published source, `github.com/fedspendingtransparency/usaspending-api`, **commit `7c86854720d7a1e4cd4f8b426e4135d275ad19d2`** (`master` HEAD on 2026-10-04, committed 2026-09-30T18:46:37Z, "Merge pull request #4789 from fedspendingtransparency/staging"), read through the GitHub API on 2026-10-04. All 191 files read are byte-identical to the blobs at that commit (git blob hashes checked) | `https://github.com/fedspendingtransparency/usaspending-api/tree/7c86854720d7a1e4cd4f8b426e4135d275ad19d2` | `usaspending_api/awards/v2/data_layer/orm.py` lines 791 and 798-840 (`total_account_outlay`, `fetch_total_outlays`); `usaspending_api/etl/management/commands/populate_is_final_balances_for_fy.py` (the final-balances flag); `usaspending_api/accounts/v2/filters/account_download.py` lines 272-289 (the downloaded outlay column is `gross_outlay_amount_by_award_cpe`); `usaspending_api/etl/submission_loader_helpers/file_c.py` lines 105-108 (non-zero filter); `usaspending_api/etl/management/sql/c_file_linkage/C_to_D_Linkage.md` (File C to File D link by exact upper-cased FAIN); the `/awards/` and `/awards/funding/` contracts under `usaspending_api/api_contracts/contracts/v2/awards/` | n/a (living code) | 2026-10-04 | FED-DATA (method) | A mechanism **consistent with the API behavior observed** (row 17) for the $0 award summary | That the deployed API runs this code: the commit was read and the deployed version was not verified |
| 17 | USAspending award summaries, `GET https://api.usaspending.gov/api/v2/awards/<generated_unique_award_id>/`, for the 49 awards on account 097-0360 that carry any outlay line in the three File C files (used as controls for the $0 behavior) | `https://api.usaspending.gov/api/v2/awards/` | Fields `total_account_outlay` and `date_signed` | n/a (living records) | 2026-10-04 | FED-DATA | Whether the award-summary outlay equals what the final-balances rule predicts from the File C lines (see "The 2024 outlay lines", controls) | Anything about the 2024 award beyond row 2 |
| 18 | USAspending submission-period schedule (`https://api.usaspending.gov/api/v2/references/submission_periods/`) and agency reporting overview (`https://api.usaspending.gov/api/v2/reporting/agencies/overview/?fiscal_year=<year>&fiscal_period=<period>&filter=Defense`) | same | Window dates and reveal dates for FY2025 and FY2026 periods; DoD (toptier code 097) `recent_publication_date` for FY2024 P12 (2025-01-09), FY2025 P12 (2026-01-30) and FY2026 P11 (2026-09-25); FY2026 period 12 returns "outside the range of current submissions" | n/a (living records) | 2026-10-04 | FED-DATA | Which year-end submissions existed at retrieval | Whether a submission holds rows for this account (that comes from the File C files, row 14) |

## Amounts kept distinct

The row keeps the announced figure as its one `amount`. The other figures are federal-record facts, written into notes and
evidence notes and never substituted for it, added to it or netted against it.

| Figure | Value | Source | What it is |
| --- | --- | --- | --- |
| Announced | $14.4M (stored `14400000`, USD, qualifier `exact`, as stated) | DoD release (row 1, GOV); 5N+ release (row 3, RECIPIENT) | The announced award amount. The one amount on the row |
| Reported federal obligation | $12,458,128 | USAspending `total_obligation` (row 2, FED-DATA) | The three obligating transactions through 2026-03-26: $3,999,799 (2024-04-11), $4,784,881 (PZ0001, 2025-05-20), $3,673,448 (P00004, 2026-03-26) |
| Non-federal funding | $2,505,981 | USAspending `non_federal_funding` | Funding other than the federal obligation, as the record states it |
| USAspending `total_funding` | $14,964,109 | USAspending | The record's own sum of the two figures above |
| File C obligation total | $10,027,775.75 | USAspending `total_account_obligation` | DoD's account-level obligation lines, carried net of the outlay lines (see below) |

None of these is confirmed as the amount executed or paid. The federal dataset does report an obligation; the unresolved question is how the
announced figure relates to it. The announced figure is $1,941,872 above the reported federal obligation and
$564,109 below `total_funding`. No source read states what relationship, if any, holds between them, so none is asserted: the
difference is **unreconciled**. The federal obligation may still grow (the agreement runs to 2028-07-30), and the announced figure
may be a ceiling, a total or neither; this review does not know.

## The 2024 outlay lines

**Records inspected.** The three File C downloads (row 14) hold 8 rows for `award_unique_key` `ASST_NON_FA86502425501_097`. Every row
carries reporting agency Department of Defense, federal account 097-0360, DEFC Q, `award_id_fain` FA86502425501, period of
performance 2024-04-11 to 2028-07-30. The File C-to-File D link is the exact upper-cased FAIN (row 16); the award summary has
`id` 266749515, `generated_unique_award_id` `ASST_NON_FA86502425501_097`, `total_account_outlay` 0.0, `total_account_obligation`
10027775.75 and `total_outlay` null.

| # | Field | Fiscal period (period end) | TAS | Program activity | Object class | Value |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `gross_outlay_amount_FYB_to_period_end` | FY2024 P09 (June 2024) | 097-X-0360-000 | 0020 UNDISTRIBUTED | 25.1 | **998,701.28** |
| 2 | `transaction_obligated_amount` | FY2024 P09 | 097-X-0360-000 | 0020 UNDISTRIBUTED | 25.1 | 3,001,097.72 |
| 3 | `transaction_obligated_amount` | FY2025 P09 (June 2025) | 097-2025/2029-0360-000 | 0001 N/A | 25.1 | 4,784,881.00 |
| 4 | `gross_outlay_amount_FYB_to_period_end` | FY2025 P09 | 097-X-0360-000 | 0020 UNDISTRIBUTED | 25.1 | **1,032,342.24** |
| 5 | `transaction_obligated_amount` | FY2025 P09 | 097-X-0360-000 | 0020 UNDISTRIBUTED | 25.1 | -1,032,342.24 |
| 6 | `transaction_obligated_amount` | FY2026 P06 (March 2026) | 097-2025/2029-0360-000 | (blank) | 25.1 | -399,308.73 |
| 7 | `transaction_obligated_amount` | FY2026 P06 | 097-X-0360-000 | (blank) | 25.5 | 3,673,448.00 |
| 8 | `gross_outlay_amount_FYB_to_period_end` | FY2026 P06 | 097-2025/2029-0360-000 | (blank) | 25.1 | **399,308.73** |

Rows 4 and 8 also carry `USSGL487200_downward_adj_prior_year_prepaid_undeliv_order_oblig` = 0.00. The three outlay lines are the
only rows for the award with a value in `gross_outlay_amount_FYB_to_period_end`.

**What the field is.** The File C download column is `gross_outlay_amount_FYB_to_period_end` (files
`FA_AccountBreakdownByAward.csv` and `TAS_AccountBreakdownByAward.csv`). USAspending's data dictionary (row 15, retrieved
2026-10-04) maps that account element to the dictionary element `GrossOutlayAmountByAward_CPE`, table
`financial_accounts_by_awards`, database column `gross_outlay_amount_fyb_to_period_end`. The published download code (row 16)
fills the column from the database column `gross_outlay_amount_by_award_cpe` (`usaspending_api/accounts/v2/filters/account_download.py`
lines 272-289), which is the column the award summary sums. The dictionary definition, taken from OMB Circular A-11 section 20
(June 2015), begins "Payments made to liquidate an obligation" and continues "Outlays generally are equal to cash disbursements".
The definition does not itself state the time basis. The fiscal-year-to-date basis comes from the column name (`FYB_to_period_end`,
fiscal-year beginning to period end) and is corroborated by the observed behavior below. The three lines are therefore
**fiscal-year-to-date** figures, one per fiscal year, and do not overlap each other. They are not period amounts and not
inception-to-date amounts. They are not totalled in the record: each is the position at one period end, and the later periods of those
years are not in the data. Across the whole account, 8 of the 9 award-fiscal-years with two or more observation periods rise
monotonically, as a fiscal-year-to-date measure should; the exception is a different award (FA86502025531, period 9 $3,288,566 to
period 12 $2,003,092), which shows a later figure can be lower. This award has one observation per fiscal year, so its own
monotonicity cannot be tested.

**Retrieval.** All File C data and API responses were retrieved on 2026-10-04 (file names in row 14; USAspending data `last_updated`
09/30/2026). The retrieval date matters for FY2026, which ended four days earlier (below).

**Year-end data: unavailable is not the same as available and empty.** `total_account_outlay` reads only year-end-type data
(next paragraph), so each fiscal year is classified by whether that data existed at retrieval and, if it did, whether it holds a
row for this award. Sources: USAspending's submission-period schedule (`/api/v2/references/submission_periods/`) and agency
reporting overview (`/api/v2/reporting/agencies/overview/`), row 18; and the File C downloads, row 14.

| Fiscal year | Year-end window | Status at retrieval (2026-10-04) | Rows for account 097-0360 in the retrieved File C | Rows for this award |
| --- | --- | --- | --- | --- |
| FY2024 | Period 12 | **Available.** DoD's most recent publication of it is dated 2025-01-09 | 27 assistance rows (29 contract rows) | None, so an available submission with no row for the award |
| FY2025 | Period 12 (window revealed 2025-12-06) | **Available.** DoD's most recent publication of it is dated 2026-01-30 | None in the assistance or contract files; the account's rows are in periods 3, 6 and 9 | None; the reason the available submission holds no rows for the account in the retrieved files is not known |
| FY2026 | Period 12 | **Not available.** The schedule lists no period-12 window and the overview rejects period 12 as "outside the range of current submissions". The fiscal year ended 2026-09-30; the latest DoD submission is period 11 (DoD publication 2026-09-25; window revealed 2026-10-02) | None; the account's rows in the files are periods 3 and 6 | The period-6 outlay line only. Its year-end submission was not yet due, so nothing is inferred from the absence of a year-end line |

For FY2026 the award summary's $0 therefore rests on a period-11 or earlier submission, and could change once the year-end
submission exists. Whether the final-balances flag had been refreshed after period 11's reveal on 2026-10-02 was not checked.

**Why the award summary shows $0 (rows 16 and 17).** `total_account_outlay` is built in `fetch_total_outlays`
(`usaspending_api/awards/v2/data_layer/orm.py`, lines 798-840) from `gross_outlay_amount_by_award_cpe` plus the two USSGL
down-adjustment columns, only over submissions flagged `is_final_balances_for_fy`. The flag is set by
`usaspending_api/etl/management/commands/populate_is_final_balances_for_fy.py`: for each top-tier agency and fiscal year, the
submission that falls in the latest submission window whose reveal date has passed. All 191 files read are **byte-identical to the
blobs at commit `7c86854720d7a1e4cd4f8b426e4135d275ad19d2`**, the `master` HEAD on 2026-10-04 (committed 2026-09-30T18:46:37Z,
"Merge pull request #4789 from fedspendingtransparency/staging"). That code is **consistent with the API behavior observed below; it is not
proof of the deployed implementation**, which was not verified. The behavior was tested against the live API (row 17):

- Awards signed on or after 2023-10-01 cannot have pre-FY2024 submissions. Fourteen such awards (this one included) carry interim
  outlay lines but no year-end line in the retrieved data; all 14 show `total_account_outlay` $0, the value the rule predicts.
- Of the 8 awards with a FY2024 period-12 line, 7 show the identical figure as `total_account_outlay`. The exception (FA86502025531, signed 2020) shows $22,538,644
  against $2,003,092 in FY2024, so earlier-year submissions, which were not retrieved, are the likely source.
- Nine of the 27 awards signed before 2023-10-01 without a FY2024 year-end line show a non-zero summary, explained only by earlier
  fiscal years that were not retrieved. This review did not retrieve them, so that explanation is an inference.

The $0 therefore does not contradict the lines: it counts a different population (year-end-type submissions only).

**Identity check.** File C's obligation lines for this award net to $10,027,775.75, which equals the federal obligation
$12,458,128 less the three outlay lines: line 2 equals the $3,999,799 initial obligation less line 1, and lines 5 and 6 are
equal-and-opposite to lines 4 and 8. This pattern (an outlay line with an equal-and-opposite obligation line in the same
award-period) holds for 25 of 34 FY2024, 15 of 16 FY2025 and 26 of 29 FY2026 outlay lines on the account, so it is the account's common reporting
pattern and not specific to this award. It is consistent with the lines being liquidations carried through DoD's own obligation accounts. It does
not say who was paid or when.

**Reading under the repository schema.** A `partially_disbursed` status means some of the money has been paid out. Lines that,
by definition, record payments made to liquidate an obligation, reported by the agency against this award, meet that for the
award as a whole. The row is therefore recorded as `partially_disbursed` with these limits, all written into the status note:

- Attribution is **federal-reporting data only**. Neither DoD nor 5N+ states a payment, receivable or payment date.
- The payment date is **null**. A reporting period is not a payment date.
- **No amount paid is recorded** and none is totalled; the lines name no payee.
- It is the corpus's first partial disbursement that rests on federal-reporting data and not on a government or recipient
  statement. The reading is left to human review.

**What stays open.**

1. Whether the award was reported as zero or omitted in the available year-end submissions (FY2024, FY2025). The broker query that
   loads File C keeps a row only if its obligation, its outlay or either USSGL down-adjustment is non-zero (`etl/submission_loader_helpers/file_c.py`,
   lines 105-108 at the pinned commit), so a reported zero would be invisible. Omission is the account's usual pattern (10 of 13
   FY2024 assistance awards with a period-9 outlay line have none at period 12), but the public data cannot distinguish the two.
2. Why FY2025's available year-end submission holds no rows for the account in the retrieved files.
3. FY2026's year-end position: its submission did not exist at retrieval (see the table).
4. The payee and payment dates (the lines are at account level and carry neither).
5. Whether later periods revised the lines, and each year's year-end position.
6. That the deployed API runs the pinned code.

**Revert path.** If the maintainer does not accept this precedent, delete the third `financialStatusHistory` entry of the 2024
row and revert test 1 in `tests/germanium-5n-award-review.test.ts`; the `contracted` entry, the amounts and the
outlay-line description in notes then still stand.

## Historical as-of behavior of the undated entry

The `partially_disbursed` entry is undated, so the record says nothing about **when** payment occurred. The classification reflects
evidence reviewed on 2026-10-04 and must not be read as establishing disbursement at any earlier date. How the unmodified shared code
treats the entry (probed on 2026-10-04 with `lib/capital-control.ts` and `lib/lifecycle-refresh.ts`):

- `currentFinancialStatus` returns the last history entry and takes no date. Financial status is not date-sliced anywhere in the
  shared code (only control statuses are, through `controlStatusOn`). So every as-of derivation (the corpus status counts, the binding
  and funded totals, PR #44's `--as-of` runs) classifies the row as `partially_disbursed` at every as-of date. Probed at 2024-03-01
  (before the agreement was signed), 2024-04-11, 2024-05-01, 2024-06-30, 2025-01-01 and 2026-10-03, the result is `partially_disbursed`
  each time. This is how the shared code treats every financial row: the `contracted` entry's date of 2024-04-11 is not used to hold a
  status back either.
- The refresh queue's reference date is the later of the latest dated entry (2024-04-11) and the review stamp (2026-10-04). At as-of
  dates before 2026-10-04 the age is therefore negative (-947 days at 2024-03-01, -1 at 2026-10-03), and the row reads P3.
- Timeline marks and dated-status displays use dated entries only, so the undated entry adds no timeline mark and shows "date not stated".

No date of payment is invented and the shared derivation code is unchanged. An as-of run over this tree, including the PR #44
sensitivity comparison, is a retrospective sensitivity run with 2026-10-04 evidence, not a reconstruction of what was known at that
date. Follow-up F4 records the date-slicing limitation.

## Rendered output check

Both rows were rendered on the dev server after restarting it (the first render after the status change was stale, because the
server held the seed JSON loaded at start-up).

- **2024 award page.** Status badge "Partially disbursed"; amount block "USD 14.4 million · As stated · Exact · Currency read from
  the issuing government". Financial history shows three entries (Decided, date not stated; Contracted, 11 Apr 2024; Partially
  disbursed, date not stated, current), each with its source link. The partially-disbursed note opens "Federal-reporting
  attribution only". The Notes block states the three amounts, that none is confirmed as executed or paid, and that the physical
  stage "records the stated plan and not construction". The DoD evidence note states "$14.4M is the announced amount and is not confirmed as the executed,
  obligated or paid amount", and the USAspending evidence note names the lines as federal-reporting attribution only.
- **2025 award page.** Status "Decided", 15 Dec 2025; amount "USD 18.1 million · As stated". The status note and the Notes block
  carry the approved wording ("no execution or payment evidence established in the reviewed sources"), and the implementation note
  says "'Announced' records this stated plan, not construction."
- **Amount presentation: partial pass.** No page or derived total presents $14.4M as the confirmed amount paid: the only totals
  that include it are the binding bucket (`binding.exact` `14400000`, `/api/v1/capital-intelligence/summary`; the project and
  organization pages show "Binding · Stated exactly · 14.4 million · 1 counted"). No derived total sums the outlay lines or the
  other figures. The amount discrepancy is carried in the row's notes and evidence notes and in this ledger. Three presentation
  issues remain in shared code and are recorded as follow-up work F1-F3; this PR changes no schema or UI.

## `site.lastUpdated`

`lib/site.ts` holds `lastUpdated` = **2026-10-02**. It is the dataset's record-as-of date: it drives the as-of dating of derived
outputs (status as of a date, the export `generatedAt`, structured-data `dateModified`) and the "Record as of" banner. It is not a
page-edit timestamp and not the date any single record was reviewed. No status entry written here postdates it: the 2024 entries
carry dates 2024-04-11 and null, and the 2025 entry 2025-12-15. Only the review stamps and `dateAccessed` values carry 2026-10-04,
as in the #43 precedent, where the maintainer left it unchanged (`PROJECT_STATE.md`). It is left at 2026-10-02: moving it is a
site-wide as-of change that would re-date every derived status, so it is a maintainer decision.

## Follow-up work (not in this PR)

Recorded for the maintainer; none is done here, because each touches shared code or schema, which this branch does not change.

- **F1. Amount basis.** The amount block shows "USD 14.4 million · As stated · Exact" with no "announced" qualifier, because `MonetaryAmount`
  has no amount-basis field. Adding one (for example announced, obligated, as reported) is a schema decision.
- **F2. Caption wording.** The project, organization and material pages caption the binding total "A contracted row is an executed
  agreement, which need not mean funds are obligated or paid". The 2024 row is `partially_disbursed`, so the caption does not literally cover it.
  Wording that covers every binding status would fix this.
- **F3. Generic binding label.** The material page shows "Binding: an agreement is executed, which is not a payment"
  (`lib/material-dossier.ts:325`) beside the "Partially disbursed" status. Other `partially_disbursed` rows already share the pairing, so it is not new.
- **F4. Date-sliced financial status.** `currentFinancialStatus` ignores the as-of date (see "Historical as-of behavior"), so historical
  runs show the latest status at every date. A date-aware status helper would be needed for true as-of reconstruction.
- **F5. Re-read after FY2026 year-end.** Once DoD's FY2026 year-end submission exists, check whether the award carries a year-end outlay line and whether
  the award summary changes.

## Record changes made

- `fin-us-dod-5n-germanium-2024`: financial history is `decided` (date null), `contracted` 2024-04-11 (row #2) and
  `partially_disbursed` (date null; federal-reporting attribution; row #2; classification approved by the maintainer on 2026-10-04). The
  announced $14.4M stays as the one amount; the reported federal obligation and non-federal funding are written into the notes, the contracted note and the DoD evidence
  note as distinct, unreconciled figures, with the relationship to the announced figure named as the open question. The status note also separates available year-end submissions from the FY2026 one that
  did not yet exist, and states that the undated entry reflects evidence reviewed on 2026-10-04. The status note
  lists the three outlay lines and their limits. Implementation history gains `announced` 2024-04-16 (row #1), worded as the
  stated plan, not construction. The "pre-set milestones" attribution moves from the April 2024 release to the Q1 and Q2 2024
  MD&As. Evidence added for rows #2, #4, #5.
- `fin-us-dow-5n-germanium-2025`: stays `decided` 2025-12-15, noted as "no execution or payment evidence established in the
  reviewed sources", not advanced to `contracted`. Implementation history gains `announced` 2026-01-29 (row #7). Notes and evidence
  record the negative findings, plus rows #9 and #10.
- Both rows: `lifecycleReview` financial and implementation dates 2026-10-04 (separate fields).
- Projects `prj-us-5n-st-george-germanium-substrates` and `-refining`: evidence entries added (rows #2, #4, #9, #10). Nothing else changed.
- Sources: five added (`src-usaspending-fa86502425501`, `src-5n-mda-q1-2024`, `src-5n-mda-q2-2024`, `src-5n-mda-q4-2025`,
  `src-5n-sustainability-2025`). `dateAccessed` moved to 2026-10-04 on the five sources re-read. The notes on `src-5n-germanium-2024`
  and `src-5n-st-george-expansion-2026` were corrected, and the USAspending and MD&A source notes now state what each does and does not support.
- `tests/germanium-5n-award-review.test.ts` (new): seven tests covering the status histories, the three distinct figures, the
  outlay-line attribution, banned wording (outright denials of payment or funding, descriptions of the outlay lines as non-payments, and any total of the outlay lines),
  the 2025 wording, the announced-not-construction wording, the review-stamp clocks and the single binding germanium commitment.
- Final scope: six files only (`PROJECT_STATE.md`, the three seed files, this ledger, the test). No shared code, schema, taxonomy or UI changed.
- Not touched: the events `evt-us-dod-5n-germanium-2024` and `evt-us-dow-5n-germanium-2025`, `site.lastUpdated`, taxonomy, schema,
  shared UI code, any other record.

## Retrospective sensitivity comparison with PR #44

PR #44's baseline tables (`docs/analysis/`, branch `analysis/concern-response-baseline-2026-10-03`, head `b2cbd41` when this comparison ran; PR #44 later merged as `f190651` after a documentation-only correction that left the tables byte-identical) are **not
edited**; this branch holds no change under `docs/analysis/`. The comparison below is a **retrospective sensitivity comparison,
not the original historical baseline**: it runs PR #44's unmodified script (`scripts/analyze-concern-response.ts` at `b2cbd41`, in
scratch copies that are not in the repository) with `--as-of 2026-10-03`, the date of PR #44's tables, over records that
include evidence reviewed on 2026-10-04. The review stamps dated 2026-10-04 therefore postdate the as-of date, which is
anachronistic by design; the run asks only how PR #44's measures would move with this review's evidence.

Three variants separate the causes: **A** the real tree (status and implementation entries, review stamps, `partially_disbursed`);
**B** A with the review stamps removed; **C** A with the 2024 row held at `contracted` (the earlier reading).

| Measure | PR #44 baseline | A: real tree | B: stamps removed | C: held at `contracted` |
| --- | --- | --- | --- | --- |
| Binding government rows (corpus) | 34 | 35 | 35 | 35 |
| Not-yet-binding rows (corpus) | 49 | 48 | 48 | 48 |
| Projects with at least one funded government row | 6 of 29 | 7 of 29 | 7 of 29 | 6 of 29 |
| Projects with a recorded physical status | 13 | 15 | 15 | 15 |
| Queue P1 bundles / rows | 18 / 25 | 16 / 23 | 18 / 25 | 16 / 23 |
| Queue P3 bundles / rows | 19 / 33 | 21 / 35 | 19 / 33 | 21 / 35 |
| Germanium rows: government commitment / funded / contracted only / not yet binding | 3 / 0 / 0 / 3 | 3 / 1 / 0 / 2 | 3 / 1 / 0 / 2 | 3 / 0 / 1 / 2 |
| Germanium rows P1-exposed | 3 | 1 | 3 | 1 |
| Germanium binding rows, all / without P1-exposed rows | 0 / 0 | 1 / 1 | 1 / 0 | 1 / 1 |
| Germanium funded rows, all / without P1-exposed rows | 0 / 0 | 1 / 1 | 1 / 0 | 0 / 0 |
| Germanium rows at construction or later | 0 | 0 | 0 | 0 |

What each comparison isolates:

- **Status and implementation entries** (baseline to B; B includes the `partially_disbursed` entry): binding 34 to 35,
  not-yet-binding 49 to 48, projects with a funded row 6 to 7 of 29, recorded physical status 13 to 15, germanium binding 0 to 1,
  funded 0 to 1. The queue does not move, because the stamps are what reset it.
- **Review stamps** (B to A): the queue moves (P1 bundles 18 to 16, P3 19 to 21) and the germanium P1-exposed rows fall from 3 to 1. The queue
  treats a review date as a clock reset, so the move is not new status evidence.
- **The partial-disbursement reading** (C to A): funded germanium rows 0 to 1, projects with a funded row 6 to 7 of 29. It does not
  affect any other measure.

So PR #44's germanium conclusion, "no binding public germanium commitment is recorded", is superseded by the review's status
evidence (one binding row, the 2024 award) in every variant. "No funded germanium row" survives only if the maintainer does not
accept the federal-reporting reading (variant C). PR #44's figures were correct for the records it had; the differences come from records added after it.

## Conclusion

**The 2024 award (`fin-us-dod-5n-germanium-2024`).** Execution is established by the federal award record: cooperative agreement
FA86502425501, signed 2024-04-11, definitized 2025-05-20; the agreement text was not inspected. Some payment is reported in
federal-reporting data: three File C gross-outlay lines on account 097-0360 (fiscal-year-to-date, one per fiscal year), which by
definition record payments made to liquidate an obligation. The row is recorded as `partially_disbursed` on that federal-reporting
attribution only, with a null payment date, no amount paid and no total. Neither DoD nor 5N+ states a payment. The award summary's $0
is a counting rule (each fiscal year's latest closed submission), not evidence of non-payment; FY2026's year-end submission did not yet exist at retrieval.
**The announced $14.4M, the reported federal obligation $12,458,128 and the non-federal funding $2,505,981 are kept distinct and unreconciled**:
the federal dataset does report an obligation, and what is unresolved is how the announced figure relates to it. None is confirmed as the amount executed or paid.
The `partially_disbursed` entry is undated and reflects evidence reviewed on 2026-10-04; it does not establish disbursement at any earlier date, although the
shared derivations show it at every as-of date. The physical stage is announced only (the stated plan, not construction).

**The 2025 award (`fin-us-dow-5n-germanium-2025`).** No execution or payment evidence is established in the reviewed sources. It stays
`decided`, announced only.

## Remaining uncertainties

1. **First File C-based partial disbursement (approved).** On 2026-10-04 the maintainer approved recording `partially_disbursed` on
   federal-reporting attribution, with a null payment date and no asserted amount paid. It remains a methodology precedent for review;
   the revert path is above.
2. **Amount presentation (shared code, not changed).** Recorded as follow-up work F1-F3.
3. **`site.lastUpdated`** stays 2026-10-02 (maintainer decision; see above).
4. **Provenance limits of the outlay lines**: omission versus reported zero in the available year-end submissions (FY2024, FY2025), why FY2025's
   year-end submission holds no rows for the account in the retrieved files, FY2026's year-end position (no such submission at retrieval), the unknown
   payee and dates, one account-wide non-monotone case, and nine older awards whose non-zero summaries are explained only by earlier-year
   data not retrieved. The code was read at commit `7c86854` and is consistent with the observed API behavior; the deployed implementation was not verified.
5. The announced $14.4M and the reported federal record ($12,458,128 federal obligation, $2,505,981 non-federal, $14,964,109 together) are
   unreconciled. The federal dataset reports an obligation; the open question is how the announced figure relates to it, so any dollar total
   over "binding" germanium rests on the announced figure.
6. Whether a 2025-award agreement has been signed is unknown. USAspending lag is possible, and the Department's "investment" date of
   15 December 2025 may or may not be an agreement date. An agreement vehicle outside the assistance, contract and IDV groups searched
   would not appear.
7. Agreement terms, the milestone schedule and any payment schedule are unknown for both awards. The 2024 agreement was definitized on
   2025-05-20, which suggests it was initially undefinitized. The 2024-04-11 status date is the signing date reported in federal data,
   not a date taken from the agreement.
8. The physical state of both funded scopes is unknown beyond announced. The facility expansion announced 2026-09-22 is a related but
   separate plan, and its own construction wording is internally inconsistent.
9. The `decided` entry on the 2024 row is undated: the DoD release does not date the decision and the signing precedes the announcement.
10. The 2025 sustainability report has no stated publication date, and its 2025 announcement date and space-qualified wording conflict
    with the Department and company releases.
11. The `partially_disbursed` entry is undated, and the shared derivations show it at every as-of date; see "Historical as-of behavior" and follow-up F4.
