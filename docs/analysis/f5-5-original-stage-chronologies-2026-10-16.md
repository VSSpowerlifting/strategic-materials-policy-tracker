# F5-5 — original-publisher stage chronologies, not reviewer signoff

**2026-10-16. Internal research-only handoff for canonical M3 cases.** This phase supplies original publisher documents and discrete industrial stage clocks for **Thompson Falls** and **Cyclic Kingston**. It does not publish new source records, industrial milestone seeds or revenue/financing statuses, capture immutable source-body copies, or assert that any human read and signed the documents. The authoritative decisions still live only in the gitignored `.project-execution-review/adjudications.json`, with their genuine M3 worksheet digests.

## One source can describe several clocks without proving a new day

**Thompson Falls** (canonical `review-m3-2-thompson-falls-q2-expansion`; primary `src-usac-2026-q2-10q`): this sequence is more precise than any isolated press headline:

1. [**October 2, 2025, original Sanders County Ledger reporting**](https://www.scledger.net/story/2025/10/02/news/usac-celebrates-expansion/12856.html): the reporter says expansion work **began in May 2025**, although the photographed public ceremony was held in September 2025. Do not turn a ceremony or October publication day into the May commencement day.
2. [**June 9, 2026, original USAC company press release**](https://usantimony.com/press-release/united-states-antimony-corporation-provides-status-update-on-new-antimony-smelter/): issuer reports initial commissioning began **in May 2026** with the first of **nine new** gas furnaces fired; expectations about bringing further furnaces up are projections. This is neither proof of full capacity nor an exact first furnace date. Compare company-hosted release with publisher PDF only during human source access; the script does not fetch the PDF.
3. [**August 11, 2026 original SEC Form 10-Q**](https://www.sec.gov/Archives/edgar/data/101538/000110465926094035/uamy-20260630x10q.htm), period ended **June 30**: Note 9 reports the *expansion* substantially completed and about **$4.1M of related assets** placed in service late Q2; Note 16 still reports construction-in-progress. This is an issuer's accounting-period and construction-progress observation, **not a known physical completion date** or audited full output. It remains the **one canonical M3 source**.
4. [**August 27, 2026 original Sanders County Ledger on-site report**](https://www.scledger.net/story/2026/08/27/news/usac-capacity-expands-with-new-t-falls-facility/14209.html): an independent reporting/photograph lead about processing activity inside the **new** nine-furnace building and **seven of nine operational, but not all operating simultaneously**. The old smelter's **seven legacy furnaces** must not be confused with these seven new ones; the site-visit day is unknown. No evidence of all nine concurrently operating at nameplate.

**Cyclic Kingston** (canonical `review-m3-2-cyclic-extended-operations`; primary `src-nrcan-cmrdd-programme`): the chronology protects distinct plant and award identities.

1. [**June 6, 2024 original Cyclic Materials Hub100 opening release**](https://cyclicmaterials.earth/resources/cyclic-materials-opens-hub100-facility-for-production-of-recycled-mixed-rare-earth-oxide): company announces opening of its **100-tonnes/year design-capacity** Kingston REEPure demonstration Hub100; its announcement describes technology scale-up and capacity, not verified annual throughput. This opening predates the subsequent CMRDD agreement and is not the end of the Extended Operations funded activity.
2. [**Original NRCan CMRDD2-048 government grant registry**](https://search.open.canada.ca/grants/record/nrcan-rncan%2C115-2024-2025-Q2-15713%2Ccurrent): C$4,893,125 for *Kingston Demonstration Plant – Extended Operations*, agreement **July 17, 2024 to March 31, 2026**. These are **contractual dates**, not an actually witnessed March 31 project-completion day. Other NRC-IRAP company grants are separate programmes, not extra CMRDD financing.
3. [**June 11, 2025 original Cyclic Kingston Centre of Excellence release**](https://cyclicmaterials.earth/resources/cyclic-materials-announces-usd-25m-investment-to-establish-centre-of-excellence-for-rare-earth-recycling-in-kingston-ontario): separately describes a planned **500-tonnes/year design-capacity commercial Hub/R&D centre**, with **Q1 2026** target for operations. It is the *different registered project* `prj-ca-cyclic-kingston-centre-of-excellence`; planned capacity and target are not achieved output or proof of commissioning. Its broader USD $25M company investment is not a substitute for the NRCan CMRDD award.
4. [**NRCan original programme page**](https://www.canada.ca/en/campaign/critical-minerals-in-canada/federal-support-for-critical-mineral-projects-and-value-chains/critical-minerals-research-development-and-demonstration-program.html) lists the *specific funded Extended Operations* activity as completed **in March 2026**. The government page is updated in place and has no proven publication day for Cyclic's individual status. It does **not** establish March 31 physical completion, reached Hub100 production capacity, the CoE's separate commercial start, or grant cash paid.

No independent physical inspection has been obtained for the Cyclic case. Company press releases are original recipient evidence, but not an independent third-party site verification. Neither an established design capacity nor a programme status alone is permission to state realized industrial output.

## Deliverable for an actual human reviewer

From the repository root, run:

```sh
npx tsx scripts/print-f5-stage-chronology.ts
npm run review:m3-packets -- --id review-m3-2-thompson-falls-q2-expansion
npm run review:m3-packets -- --id review-m3-2-cyclic-extended-operations
```

The first command **prints**, never stores or publishes, two original-source timelines together with the **current canonical M3 worksheet metadata digest** and five **unchecked, case-specific reviewer questions** for each facility. It fails closed if any source-role URL, evidence/publication clock, scope, registered-source identity, distinct Kingston project or unsigned M3 review changes. It cannot validate publisher source-body integrity without fresh access or replace the actual human adjudication.

A human reviewer may use the original M3 authority only after reading the originals, identifying the actual source statements and stage boundaries, preserving unknown physical event dates as null, and recording a true source decision using their real name/date and exact current digest. Source links flagged **unregistered** here are only research leads; formal citing/registration (if desired) requires a separately approved data curation step. Only a separate reviewed seed/corpus PR may ever expose a new project-native milestone to the public.

**What remains unresolved:** Thompson nine-furnace concurrent operation and sustained output; exact first commissioning and construction-progress dates; Cyclic funded-activity technical closure and any actual CoE commercial start/output; first-public status-update clock; original-body capture; genuine signed M3 approvals. Do not add data to empty `project-milestones.json`, silently advance cutoff, or change finance histories, monitors, sources, exports or routes. Respect open PRs #86, #130, #132, #133 and #134.

## Internal files

- `research/f5/industrial-stage-chronology-original-publishers.json` — public source navigation, with original issuer, date, event period, limitations, and original canonical M3 IDs; **not** authoritative facts, approvals, or a source capture.
- `scripts/f5-stage-chronology-review.ts` + `scripts/print-f5-stage-chronology.ts` — read-only and fail-closed M3 reviewer supplement, preserving the *existing* digest.
- `tests/f5-stage-chronology-review.test.ts` — deterministic integration and regression against actual M3 queue, registered source/project/finance data and synthetic compromised clocks/scope/reviewer claims.

Run exact-head full CI and private Chromium QA prior to any merge. This engineering phase intentionally avoids all production/publication inputs.
