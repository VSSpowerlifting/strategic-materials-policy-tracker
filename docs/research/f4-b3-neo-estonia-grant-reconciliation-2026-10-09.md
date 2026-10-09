# F4-B3 — Neo Estonia JTF historical amount evidence: amended month proven, legal amount unresolved

Reviewed **9 October 2026**. This is a research-and-integrity milestone **stacked on PR #105 (Perpetua F4-B2)**, not a publication or a version promotion. It does not change Neo's canonical present value, financial status, counted money, scope, or source attribution.

## Source ledger and chronology

| Distinct primary-source observation | Amount | Source / exact locator | What it establishes |
| --- | ---: | --- | --- |
| **9 November 2022** original award announcement | **up to €18.7M** | [Neo original JTF announcement](https://www.neomaterials.com/neo-performance-materials-european-grant/), opening bullets and paragraph | Original award ceiling; source describes dependence on eligible project costs and job creation. |
| **November 2024** amended terms, retrospectively published **18 March 2025** | **approximately €14.7M**, rate changed **18.75% → 23.3%**, eligible project base decreased to **€63.3M** | [Neo 2024 Annual Information Form](https://www.neomaterials.com/wp-content/uploads/2025/03/Neo-AIF-2025-vF.pdf), printed p. 9 / PDF page 10, "Rare Earth Magnet Plant in Europe" | Same JTF grant **was amended in November 2024**; **no exact legal-effective day** is supplied. |
| Independent European Commission retrospective case study | **€14.7M** JTF support | [European Commission Representation in Estonia](https://estonia.representation.ec.europa.eu/strateegia-ja-prioriteedid/eli-eelarve-eesti-jaoks/elu-edeneb-euroopa-liidu-eelarve-toel/neo-perfomance-materials-magnetitehase-rajamine_et), Estonian paragraph `Euroopa Liidu õiglase ülemineku fond toetas tehase rajamist 14,7 miljoni euroga` | Official EU public-facing corroboration of **€14.7M** support for the same Narva magnet-factory project; no dated signed amendment, and the verb 'supported' **does not prove full cash disbursement**. Web publication date not established. |
| **2025 reporting year** in March 2026 AIF | **approximately €14.8M**, rate **23%** | [Neo 2025 Annual Information Form](https://www.neomaterials.com/wp-content/uploads/2026/03/NPM-AIF-2026.pdf), printed p. 10 / PDF page 11 | Current issuer-reported estimate, carried as SMPT's canonical `approximately EUR 14,800,000`, as well as **US$8.4M aggregate JTF receipts by Dec 31 2025**, which must be treated separately from the grant ceiling. |
| Neo FY2025 Financial Statements | **up to €14.8M** in grant note; US-dollar receipts separate | [Neo 2025 YE consolidated FS](https://www.neomaterials.com/wp-content/uploads/2026/03/NPM-2025YE-FS.pdf), Note 4 "Government Grants" | Secondary issuer corroboration of the latest estimate, not evidence for an additional post-November 2024 signed amendment. |

## Finding

**One grant; one independently established amendment month; two different later rounded amount descriptions.**

The March 2025 annual information form is authoritative issuer evidence that an amendment took place **in November 2024**. It does not identify which day, and the source was published **in March 2025**, not November 2024. If an operative month-bound were eventually used in `financialAmountHistory`, the only defensible calendar interval from *that statement alone* is **November 1–30, 2024**. It is not evidence for **November 1** as a signed or effective day.

The 2025 issuer AIF's **€14.7M / 23.3% / €63.3M** and the later **€14.8M / rounded 23%** are **not proven to be two legal revisions**. Multiplying 0.233 × €63.3M gives **€14.7489M** using already-rounded inputs; the result straddles two one-decimal-million report conventions and **cannot** establish a precise legal award ceiling. Nor does an EC webpage's un-dated support figure establish a 2024 amendment effective day or prove what Neo had received in cash.

We must also distinguish the **beneficiary legal entity**. An Estonian [public procurement notice](https://riigihanked.riik.ee/rhr/api/public/v1/notice/4496004/html) identifies **NPM Narva OÜ (16493223)** as a factory-related contracting entity; this does not prove the named recipient on the actual JTF grant amendment. Confirm the beneficiary in the Estonian award decision, *not* by inferring that subsidiaries and Neo's listed parent are the same contracting recipient.

## Existing SMPT amount and source integrity

The financial row `fin-eu-jtf-2025-neo-magnet-project` keeps:
- **current `amount`: approximately €14.8M**;
- its existing `financialStatusHistory` including partially disbursed based on separately evidenced receipts;
- its exact single financing ID, `valueRole`, `instrument`, site/material/stage attributions and relationships;
- **NO `financialAmountHistory`** while the 2024/2026 amount discrepancy lacks adjudication.

Two newly registered primary-source IDs and **source-scoped** row evidence link the 2025 issuer AIF and EC Estonia amount observations. The latter is *not* linked as financial status/disbursement evidence. The source notes and F4 review queue describe the conflict rather than replacing the canonical figure or retroactively treating €14.8M as the historical 2024 ceiling.

`research/f4/neo-jtf-amount-reconciliation.json` encodes the known amendment month, conflicting sources and **`history_promotion_blocked`** finding. Exact source pointers, the €100,000 reporting discrepancy and independent primary evidence requirements are asserted by tests. This is **review state, not a second finance instrument, payout, policy event, project milestone, or exported dataset**.

## Conditions for F4-B4 historical promotion

1. Obtain the applicable signed **Estonian grant decision or amendment** (potential administering authority RTK / state support register), identify legal recipient, original award decision, amendment dates, gross eligible base and actual award ceiling. Do not confuse NPM Narva OÜ's corporate/business-register receipts with EU JTF grant ceiling.
2. Reconcile **€14.7M** vs **€14.8M**: rounding/estimate differences versus a real second contractual revision; record precision and source-date horizon transparently.
3. Only then construct source-resolved `financialAmountHistory` versions with independent date-bound evidence. Preserve uncertainty inside November if exact day not proven, rather than forcing an effective day.
4. Require a separately reviewed current canonical-last amount policy and no change to public totals unless specifically authorized in a distinct phase.
5. Keep F4-C historical aggregates, API/UI and parent-child dated folding **blocked** pending coverage and status-contract review.

## Acceptance

On exact PR head: run production dependency audit, data validation, typecheck, lint, complete tests and build. Source reviewer must inspect Neo 2024 AIF PDF page 10 (printed 9), Neo 2025 AIF page 11 (printed 10), original 2022 news release, EC Estonian text, and current SMPT finance row. Verify current amount, cash status and aggregate commitments unchanged. Human review before merging; **no merge/deploy/collector** in this phase.

## EIS original public grant-register cross-check (9 October 2026)

The Estonian Business and Innovation Agency's [official supported-project listing](https://eis.ee/toetatud-projektid/?grant_size_from=0&grant_size_to=30000000&recipient=&s%5Bprogram%5D=ida-viru-ettev-tluse-investeeringute-toetus&s%5Byear%5D=all&sort=project_recipient%3Aasc) independently identifies the specific beneficiary and project in Estonian:

| Register field | Verbatim / stated value | Interpretation |
| --- | --- | --- |
| Toetuse saaja | **NPM Narva OÜ** | Legal grant beneficiary **named by EIS**, not necessarily identical with listed Canadian sponsor |
| Toetuse saaja reg. kood | **16493223** | Estonian registered beneficiary identifier |
| Projekti nimi | **Magnetitehas Narva** | Narva magnet factory project |
| Toetuse suurus (eur) | **14 790 898.00** | Exact **current register support amount**, not a certified 2024 amendment day |
| Projekti maksumus (EUR) | **63 327 184.00** | Listed project budget/cost, not additional public grant |
| Rahastusallikas | **Õiglase ülemineku fond (ÕÜF)** | Just Transition Fund |
| Otsuse kuupäev | **2022 (year only)** | The listing does not show a legal day; do not equate this to the November 2024 amendment |

This official project entry gives an **exact listed grant amount of €14,790,898**. It is **€9,102 below** Neo's rounded current €14,800,000 presentation, and **€90,898 above** the older approximate €14,700,000. The precise current register number lends independent support to the **2026 ~€14.8M** disclosure, but does not prove why the 2025 AIF described ~€14.7M, whether an authorized post-November adjustment occurred, or the exact operative day.

A separate important entity-integrity issue is now explicit: the canonical finance row's `recipient` is `Neo Performance` with organization ID `org-neo-performance`, while the government funding register names **NPM Narva OÜ** as `Toetuse saaja`. Neither treating them as synonyms nor silently replacing the parent is appropriate without checking the award contract, entity relations and organization registry. The row therefore gains the EIS primary **amount/project** source pointer and a human-review warning, **not** an asserted citation to justify its existing recipient value. The EIS entry is not evidence of disbursement, and cannot replace the issuer's separately source-audited partial payment observation.

The new EIS source has an intentionally **null** publication date; the funding decision **year** is not the publication date and is not an effective amendment day. This is the third independent amount perspective alongside Neo's reports and the European Commission narrative. Structured history and as-of sums **remain blocked**. F4-B4 follow-up should source-review the actual signed Estonian grant decision(s), resolve parent/subsidiary contracting identities, and decide whether current amount's approximate presentation can coexist with a separate explicitly labeled exact register amount without modifying totals.

## Ministry of Finance project audit: original grant decision chronology (9 October 2026)

An additional **official first-party government audit** is now available: [Rahandusministeerium JTF-2/2025, final report dated 21 November 2025](https://www.fin.ee/sites/default/files/documents/2025-11/A1-1_Auditi_l6pparuanne.pdf) (**PDF page 3**, section 1.1, 'Taotluse rahuldamise otsuse (otsuse muutmise) number ja kuupäev'). This is documentary evidence from auditors who examined the structural-funds grant decisions for project **2021-2027.6.01.22-0002**:

| Administrative action | Decision identifier | Recorded date |
| --- | --- | --- |
| Original application approval | `11-2/22/3107` | **2022-11-03** |
| First amendment, including later transfer of recipient responsibility | `11-2/23/3085` | **2023-11-03** |
| Grant/project amendment contemporaneous with Neo's November 2024 issuer-reported funding revision | `11-2/24/4882` | **2024-11-28** |
| Subsequent project-grant amendment, exact amount effects not yet established | `11-2/25/4023` | **2025-09-16** |

This **fixes the exact date of the 2024 administrative decision**. It does **not** automatically establish the precise legally *operative* date of a changed grant ceiling, because the full amendment decision text, service/notification/effectiveness clauses, and the award amount in each amendment were not reproduced in the audit. Do not turn November 28 into a confirmed F4 `effectiveNotBefore=effectiveNoLaterThan` until the decision's conditions are reviewed; nor retroject the present EIS-listed €14,790,898 to November 2024. A **2025** amendment is independently documented and may or may not explain the €14.7M-versus-€14.8M discrepancy; the monetary effects are **not established**.

On **PDF pp. 7–9**, auditors additionally document that the original applicant/grant beneficiary was **NPM Silmet OÜ**, and that **95% of project activities and budget** were reassigned to **NPM Narva OÜ** by the 2023 amendment, while NPM Silmet remained a 5%-budget partner. This strongly confirms that `Neo Performance` is a parent/group description, not the precise Estonian legal recipient for this funding after the transfer. It also means that a historical amount series eventually needs recipient identity by date; simplistic substitution of the current recipient across all years could misstate the originally approved contracting party.

The audit records **formal procedural weaknesses** in the administering body's review and maintenance of amendments (including failure to update a project-investment indicator and a partner de-minimis amount in the November 2024 decision). Its overall conclusion was that grant use was **substantially compliant**, and the auditors did not invalidate the award. SMPT must not summarize these administrative findings as fraud, cancelled finance, clawback, or invalidated grant.

**Result:** `research/f4/neo-jtf-amount-reconciliation.json` now contains numbered original and amended decisions plus the known beneficiary transfer; the Neo financing row links the audit only to **project/decision provenance**, not to amounts, status, disbursement or the existing parent recipient. The record's current €14.8M, financial status, recipient label and `financialAmountHistory` remain untouched, with explicit pending human correction gates. Source registration retains a null publication date; the audit's **report date 21 November 2025** is not proof of its first public availability date.

**Next authoritative documents:** retrieve complete EIS decisions **11-2/24/4882 (2024-11-28)** and **11-2/25/4023 (2025-09-16)**, plus **11-2/23/3085 (2023-11-03)** for legally effective recipient transfer and **11-2/22/3107 (2022-11-03)** for initial amount. Compare document signing, notice/service and entry into force. Only independent review can authorize a later F4 historical version or canonical grantee correction; the present amount and total counting remain unchanged.
