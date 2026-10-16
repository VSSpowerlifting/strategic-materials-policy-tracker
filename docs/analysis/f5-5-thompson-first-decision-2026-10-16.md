# F5-5 — First physical-milestone decision brief: Thompson Falls

**Researched October 16, 2026. PRIVATE-REVIEW RESEARCH / UNSIGNED / NOT A PUBLIC MILESTONE.**

## Decision recommended for an actual reviewer

The strongest currently eligible Thompson Falls claim is **`construction_progress_reported` scoped to the named Thompson Falls smelting/refining expansion**, against the already-existing, still unsigned `review-m3-2-thompson-falls-q2-expansion` in `research/project-execution/m3-2-source-review-queue.json`. **Recommend that a human consider approving *only* the narrow issuer-reported Q2 construction-progress observation after examining the complete original Form 10-Q**, not any broader plant completion, nine-furnace start date, nameplate output or funding disbursement.

This is a *research recommendation*, **not** an editorial `approved` verdict and **not** a release instruction. The existing M3 draft fields, original source ID and reviewer authority are unchanged; `occurredOn` remains **null**. The existing source-review worksheet digest is generated live from the actual M3 queue, source/project/finance registry and curated cutoff. A new research JSON file must not impersonate that digest or record a real reviewer.

### What we independently read in the original SEC filing

**Registered primary source** `src-usac-2026-q2-10q`, [USAC 2026 Form 10-Q](https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm). The issuer signed/filed the report on **August 11, 2026**, for the period ended **June 30, 2026**. Source registry `dateAccessed` is **October 2, 2026** and remains unchanged. These are three **different** clocks.

- [**Note 16 — Commitments and Contingencies, “Thompson Falls, Montana Facility Expansion”**](https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/R22.htm) puts the issuer's *substantially completed* construction statement **during Q2**, while reporting approximately **US$39M planned expansion capital expenditures**, **US$33M incurred by June 30**, about **US$4M transferred to property, plant and equipment**, and approximately **US$29M of gross project costs** remaining in construction in progress. A “substantially completed” phrase is narrower than every asset line placed in service or zero CIP.
- [**Note 9 — Government Grant**](https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/R15.htm) separately describes approximately **US$4.1M of related assets placed in service late Q2**. Note 9 reports the **US$27M DPA award**, consisting of **US$16.2M currently obligated** and **US$10.8M subject to future authorization**. It also describes formal **DIBC acceptance of three funding-performance milestones on March 25** associated with **US$12.8M recognized as a grant receivable and collected in April**. **Those are contractual funding-performance milestones, not three separately observed furnace commissioning events.**
- [**August 11 SEC-furnished earnings Exhibit 99.1**](https://www.sec.gov/Archives/edgar/data/101538/000110465926094130/tm2622899d1_ex99-1.htm) still **forecast** full operation of all new furnaces in Q3. Issuer forward guidance is a different assertion from past Q2 construction progress.
- [**August 27 original Sanders County Ledger on-site report**](https://www.scledger.net/story/2026/08/27/news/usac-capacity-expands-with-new-t-falls-facility/14209.html), by Annie Wooden, offers genuinely independent original reporting of activity at the **new** plant. It describes **seven of nine *new* furnaces operational but not all concurrently**. The **old** smelter contains another seven furnaces. Reporter publication day is not a verified physical first-operation day; no permission to republish original photos or article text is implied. This independent article is still only an *unregistered* research lead, not a new canonical M3 `sourceId`.
- [**October 2, 2025 original Ledger groundbreaking report**](https://www.scledger.net/story/2025/10/02/news/usac-celebrates-expansion/12856.html) says the construction **began in May 2025** and separately describes the **late September** celebration. Both are prior to the government grant funded in 2026. Neither supplies a verified *day* of original construction commencement. Funding cannot retroactively be labeled the *cause* of work that preceded it.

### Human decision boundaries

The existing one-and-only review source is the SEC **10-Q**, not the SEC-furnished company press release, the 2025 Ledger account or the 2026 local visit. Different records have separate publishers, access dates and facts; borrowing later independent field observations as if the 10-Q itself asserted them would contaminate the candidate.

**Proposed narrow reviewer-facing claim:** “US Antimony reported that the Thompson Falls antimony smelter expansion was substantially completed during the second quarter of 2026, with some related assets in service.” This uses a reported construction-state kind with no fabricated day. Do **not** substitute `construction_started`, `operations_started`, `facility_commissioned` or `whole_project`.

**Proposed publication-note wording for later human consideration only** (the **existing M3 queue's editorialCaution remains operative** until a separate authorized editorial step):

> USAC reports substantial construction completion of the Thompson Falls expansion during Q2 2026, with $4.1M of related assets placed in service late Q2 and about $29M of gross project costs still in construction in progress. This is issuer-reported construction progress, not a dated completion, full nine-furnace operation, proven production rate, or proof that all grant milestones are fulfilled. The $27M grant, $20M Montana allocation, $12.8M April receipt and roughly $39M company expansion budget have distinct bases.

The numbers are **different denominators**, not additive totals. The signed $27M federal DPA parent, the company's $20M Thompson Falls/$7M Alaska workstream split, the approved/collected $12.8M and ~$39M corporate capital budget must remain separately represented in finance and project metadata.

### To obtain an actual first milestone (requires a human)

1. Print **the existing** worksheet with `npm run review:m3-packets -- --id review-m3-2-thompson-falls-q2-expansion`. Open and read the full official 10-Q Notes 9 and 16, verify exact source language, finance identity, facility scope and date boundaries, and inspect counterevidence linked above. The published corpus cutoff is currently `2026-10-09`.
2. If a real reviewer is satisfied, the human can copy `research/project-execution/m3-2-adjudications.example.json` into gitignored `.project-execution-review/adjudications.json`, leave all other candidates pending, and record their **real name, review date, substantive rationale, the five genuinely performed original-source checks and the current M3 worksheet digest**. An approved verdict additionally proposes one unique `mil-...` ID. **Do not create, falsify or commit the local decision as part of this research PR.**
3. Run `npm run audit:project-execution-adjudications` locally. Since any genuine new review after October 9, 2026 postdates the current `site.lastUpdated`, the preview's **corpus-cutoff hold is expected**, not a defect to bypass. No backdating: update the curated cutoff only in a **separately authorized publication PR**, and repeat the real review against the new digest as required.
4. A maintainer then independently reviews the original-source decision and the final narrow `ProjectMilestone` contract, approves public disclosure and only **then** creates a separate public-seed PR with full validations and public casefile/finance non-regression checks. This work ends **before** any seed, review-signature, site date or export mutation.

### What this focused engineering phase adds

The machine-readable public evidence **decision brief** in `research/f5/thompson-first-human-decision-brief.json` is **not** a signed M3 review or a second candidate queue. It specifies one narrow existing M3 ID, one registered primary source, five accounting observations, four disambiguating original records, and five actual human decisions. Tests reconcile those source/project/finance identities against the *live* registered corpus and existing M3 worksheets, and catch manufactured approvals, fake day claims or accidental milestone publication.

**Publication blocker remaining:** original-source named human adjudication and separately authorized corpus cutoff/seed publication. The local independent field report cannot itself authorize a new source or be counted as an approved second physical milestone. Existing separate PRs #86, #130, #132, #133 and #134 remain untouched.
