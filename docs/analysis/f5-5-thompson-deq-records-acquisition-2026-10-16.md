# F5-5 — Montana DEQ records acquisition: actionable Thompson Falls handoff

**Research checked 2026-10-16. STATUS: DRAFT ONLY — NO PUBLIC-RECORDS REQUEST SUBMITTED, NO SOURCE-TEST REPORT LOCATED, NO PHYSICAL MILESTONE APPROVED.**

## Why this is the next real bottleneck

The December 23, 2025 [Montana DEQ MAQP #2973-05](https://deq.mt.gov/files/Air/AirQuality/Documents/ARMpermits/2973-05_FNL.pdf) establishes the regulated **nine new furnace units** (five reduction, two remelt, two oxidizer) at the **Thompson Falls facility**. Unlike the manufacturer's construction commentary or a newspaper site visit, a **completed original regulator-held source-test report** might identify when specific industrial units actually operated, when the agency accepted tests and whether output-related measurements were taken. A contemporaneous regulator field inspection might independently document equipment state and reconcile the six-versus-seven **older building** furnace discrepancy. But a permit is **permission/conditions**, not proof of completed startup, capacity or testing.

**Most important permit triggers (physical PDF page indexes 4–5):**

- **§II.B.1:** The company must conduct initial EPA source tests on the new reduction, remelt and oxidation furnaces in relation to the **initial startup of *all* new furnace units**, with the specific **within-60-days / no-later-than-180-days** language. The permit does not supply actual startup dates or completed results. The physical event triggering a particular test deadline is **unverified**, so do **not** claim a past-due test or regulatory noncompliance. Also ask for **test protocols, schedules, acknowledgments and associated regulator findings** if held, since an indexed permit list typically doesn't contain post-issuance field evidence.
- **§II.C.2:** A notification duty applies to **qualifying de minimis construction/improvement changes** (e.g. a new emissions unit or changed control equipment). **This is not a universal required startup notice for the nine new furnaces**; previous speculative references to “startup notices under Section II.C” are narrowed. A record might voluntarily mention first startup, but do not presume mandatory notices exist.
- **§II.C.4 / General Conditions §III.A:** Five-year operating records must be **maintained at the company site** and supplied to the agency **upon request**; DEQ has inspection powers. A record required to be kept by the **company** does not automatically mean DEQ has received it. A missing portal listing cannot prove non-operation.
- **§II.C.1:** Annual information is based on calendar-year production, submitted in response to the agency's inventory request. **Calendar 2026 is not finished as of this research**; do not assert a complete 2026 inventory is due, has been filed, or is absent.

**Current public discovery limitation:** Official [DEQ permit registry](https://deq.mt.gov/air/assistance) makes #2973-05 publicly available, but the separately linked [archive of public information requests](https://montanadeq.govqa.us/WEBAPP/_rs/) was not fully searchable in this review session. We did **not** identify a completed source test or independent 2026 DEQ inspection in indexed public pages. That is a **negative discovery result**, not a DEQ answer on whether records exist.

## Submit through the official state process

**Official target:** Montana Department of Environmental Quality (Air Quality Bureau / Air, Energy & Mining Division), request **MAQP #2973-05** and, if a record is indexed under it, predecessor **#2973-04**.

**Official portal:** https://mt-pir.arkcase.us/pir/portal/reading-room — reached from [Montana DEQ's public records page](https://www.deq.mt.gov/about/public-records). OPIR confirms [DEQ is a supported state agency](https://doa.mt.gov/OPIR/agencies), and the DEQ page lists `DEQRecords@mt.gov` as a records contact. This is a **Montana public information request**, not a federal FOIA filing. **User submission or explicit permission remains necessary**; no outreach was performed.

**Fees:** DEQ says requests costing **less than $25** are waived, and that it waives fees for **students with proof of current enrollment** (also for qualifying journalistic requests). Student enrollment information is **not** stored in SMPT or this git repository; provide proof only directly through the agency's authorized process if claiming eligibility. Charges can otherwise apply and may require advance payment; request a fee estimate before chargeable work. DEQ aims to fulfill requests within 30 days, but this is a service goal, **not a guaranteed delivery date**. Agency advises precise subjects and bounded dates. <https://www.deq.mt.gov/about/public-records>

### Request A — file first: initial source-testing documents (2026-05-01 through 2026-10-16)

**Subject:** Records request — MAQP #2973-05 initial source-testing records (May–October 2026)

> I request electronic copies of records currently held by the Montana Department of Environmental Quality concerning the United States Antimony Corporation Thompson Falls Facility, Montana Air Quality Permit #2973-05, dated May 1 through October 16, 2026, limited to initial compliance source testing under Section II.B.1 for the nine new reduction, remelt, and oxidizer furnaces: source-test protocol submissions, schedules or notifications specifying actual initial-startup or testing dates; any received completed test reports and associated compliance determinations; and any DEQ correspondence acknowledging receipt or review of those particular protocols or results. Please include the relevant furnace ID or emissions-unit ID where present. If no responsive records are held, please indicate that rather than inferring that a test did or did not occur. If these records are maintained under predecessor MAQP #2973-04, please search that permit file too. I prefer electronic records, existing documents rather than new analysis, and a notice of estimated fees before chargeable work. Please provide reasonably segregable nonexempt portions if any material is withheld.

**Research purpose:** A *submitted original* source test may identify startup/test dates, equipment IDs and compliance measurements; however, it would still need physical-scope interpretation and actual source review. It does not by itself prove nameplate production or grant-related causality.

### Request B — separate, second priority: independent field inspections and equipment identities

**Subject:** Follow-up records request — MAQP #2973-05 DEQ furnace inspections (May–October 2026)

> I request electronic copies of any Montana DEQ Air Quality Bureau facility inspection reports or contemporaneous regulator field-visit notes currently held for United States Antimony Corporation's Thompson Falls Facility, MAQP #2973-05, dated May 1 through October 16, 2026, to the extent they document operation, startup, installed equipment, furnace identifiers, or inspection of the nine new reduction/remelt/oxidizer furnace units. Where an inspection report contains an equipment inventory or permitted emissions-unit list, please include that page or attachment; I am trying to distinguish the six older units listed in the December 2025 permit from a later press account referring to seven furnaces in the old building. Please also include DEQ-issued or DEQ-received changes/amendments to #2973-05 during this period that expressly modify the furnace list, if any; do not perform a new compliance assessment. If no responsive inspection or amendment records are held, please state that. I prefer electronic copies, estimated fees before chargeable work, and reasonably segregable nonexempt portions if needed.

**Research purpose:** Actual regulator observations may provide independent evidence for specific physical operations and clear up the **six *permitted legacy* versus seven *reported older-building*** units; a count mismatch alone does **not** prove noncompliance.

The two literal requests are mirrored in the machine-readable, **unsent** `research/f5/thompson-deq-records-access-handoff.json`. Do not automatically send either request, create an account with stored secrets, falsify a PIR receipt number, or treat any pending request as newly received evidence.

## Intake when the agency responds — preserve provenance, no automatic authority

1. Save **original returned source versions** outside the public repository, under the existing gitignored private source-evidence process. Record the actual DEQ response and document dates, request ID, original filenames, SHA-256 hashes and relevant furnace-unit identity; handle withheld or confidential attachments outside public git. Do **not** assert content authentication without receiving and checking actual bytes.
2. Map each response explicitly: source-test **protocol** or **scheduled date** is not a completed **test**; a **test report** is not automatically a successful **compliance determination**; an on-site **inspection** is not a year of sustained production; a “no responsive records” agency statement means only no responsive agency-held records within the request parameters.
3. If truly material, propose a bounded evidence candidate to the **existing** `review-m3-2-thompson-falls-q2-expansion` reviewer workflow or a *separately authorized* new review queue entry. Keep the SEC Q2 construction-progress claim and later DEQ records as different source observations. No second review approval authority.
4. No publisher-source registration, industrial outcome seed, finance status/amount history, reviewer decision, monitor, route/export, project data or `site.lastUpdated` changes are authorized by response or this research packet. Real human signed M3 review and separately approved corpus-date/seed release remain required.

**Repository phase scope:** public-origin source discovery and a usable records handoff, *not* an external request on the user's behalf or source-body capture. Protect other open PRs #86/#130/#132/#133/#134.
