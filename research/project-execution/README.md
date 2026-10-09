# M3.2 — Source-first physical execution review queue

**Status:** draft research intake, not an approved factual backfill. **No records have been added to the public project-milestones seed.**

This phase converts the M3.1 legacy shadow-audit findings into four precisely delimited, original-source-anchored editorial proposals. They live at `research/project-execution/m3-2-source-review-queue.json` and can be inspected/validated only from `scripts/` or tests. They are not imported by application routes, `lib/data.ts`, exports, search or public financial calculations.

## Read-only audit

Run `npm run audit:project-execution-pilot -- --json` locally. It reports source-observation boundaries, source/project/financier reference resolution, candidate gate, and why no automatic milestone promotion is permitted. The auditor fails on:
- duplicate or unsorted review identities; unknown source/project/finance references;
- finance rows that belong to another project or do not contain the cited legacy source observation;
- invented or impossible dates, physical occurrence claimed after the cited source, or source observation after the curated corpus cutoff;
- attempts to put an approval date, reviewer identity, or public milestone ID into an **unreviewed** queue;
- funded workstream completion elevated to full-facility status;
- unknown `kindProposal`/`scopeProposal` presented as if they were canonical publishable values.

**The script cannot adjudicate quoted evidence**: the original primary URL must be independently read in full before a human supplies `reviewedBy`/`reviewedAt` via the separate, explicitly authorized promotion process. An exact quote and correct identifiers are necessary, not sufficient.

## Cases and precise source boundaries

1. **Wagerup gallium recovery** — `review-m3-2-alcoa-wagerup`, one `construction_started` proposal at the named Wagerup plant, supported by original [Alcoa August 24, 2026 release](https://news.alcoa.com/press-releases/press-release-details/2026/Australia-Japan-the-United-States-and-Alcoa-Break-Ground-on-Gallium-Project-in-Western-Australia/default.aspx). Alcoa explicitly says the ceremony marked the construction start; three financial records quote the same physical evidence. No inference about equity payment or output.
2. **Cyclic Kingston demonstration plant, Extended Operations** — `review-m3-2-cyclic-extended-operations`, one `funded_activity_completed` proposal confined to NRCan's named Extended Operations grant-funded activity. Original [NRCan funded project entry](https://www.canada.ca/en/campaign/critical-minerals-in-canada/federal-support-for-critical-mineral-projects-and-value-chains/critical-minerals-research-development-and-demonstration-program.html) reports completion in March 2026, but not a day: `occurredOn` is null. Registered source publication date is null, so October 7 **source-access** is a conservative observation boundary, not a completion date. The demonstration plant and the separately tracked commercial Centre of Excellence must not be conflated.
3. **INL antimony sulfide prototype** — `review-m3-2-inl-demonstration` is **taxonomy blocked**. [U.S. Army, August 6, 2026](https://www.army.mil/article/294430/u_s_army_perpetua_resources_and_inl_launch_domestic_antimony_sulfide_processing_facility) reports the July 29 opening ceremony and commencement of demonstration activities, but does not prove demonstrations began specifically July 29. Keep the **demonstration start date null**. A reusable `demonstration_started` category would need explicit owner approval, not a silent rename to commercial `operations_started`.
4. **Stibnite Burntlog Route** — `review-m3-2-stibnite-burntlog` is **taxonomy blocked**. [Perpetua Resources, June 1, 2026](https://www.investors.perpetuaresources.com/investors/news/perpetua-resources-advances-construction-of-the-stibnite-gold-project) names May 30 as the commencement of **additional** critical-path construction activities, including the access road. It expressly says earlier early works began in October 2025. Calling this the first whole-project construction start would be misleading. Whether `named_infrastructure` is an appropriate reusable scope requires separate maintainer agreement; the existing `named_facility` kind is not silently extended.

## Non-publication and promotion sequence

- **Step 1:** Human reviewer examines entire original publisher document, identifies the precise original quotation, whose report it is, source publication/access boundary, project vs facility vs workstream scope, and dates. The research JSON expressly contains `reviewVerdict: "unreviewed"` and **must never contain a fake reviewer or approval date**.
- **Step 2:** Only once A/B interpretation is approved may a separate change create one `mil-*` record per real-world sourced milestone, with actual reviewer name/date. If review happens later than `site.lastUpdated` (currently 2026-10-07), advance the **curated corpus cutoff deliberately as part of the authorized publication phase**; never falsify `reviewedAt`.
- **Step 3:** C/D require a separately approved taxonomy/semantic change (or an alternative admissible, narrower evidence model). Any enum extension must be justified against the broader corpus and regression-tested; avoid a label created merely for one pilot example.
- **Step 4:** Keep existing finance-row physical history intact; audit conservation of financing aggregates and the response matrix. Do not remove Kingston's funded-activity exception or assert that public funding *caused* construction.
- **Step 5:** No merge, production deployment, or promotional publication without maintainer review and green CI. A passing M3.2 pilot audit is only a **research-intake** check.

## Source-integrity note

The research queue references source IDs in SMPT's current registry rather than inventing new citations. The original wording is a short review anchor. The live government and corporate pages remain the editorial sources of authority; their content can change after access. Because the audit does not fetch remote publishers and contains no source-content hash, **it is not a substitute for a full source reread at promotion time**.

## M3.2b local adjudication handoff (non-publishing)

The four-source review queue now has a strictly isolated, **human-only decision input**. None of the following automates primary-source verification, and no approval fields are filled out by the tool itself.

1. Read the complete original publisher article or government programme entry, not just the short `statementOriginal` anchor. Check dates, named subprojects, exact scope, quote, and whether the assertion is an observed fact rather than a future target. Document any contradictions independently.
2. Copy `research/project-execution/m3-2-adjudications.example.json` to `.project-execution-review/adjudications.json`. This directory is intentionally gitignored. The checked-in example is **all pending**, with no invented reviewer, approval date, source checks or milestone IDs.
3. For each case, set `verdict` to `approved`, `rejected`, or `needs_more_evidence` only after a genuine review. Use the real human reviewer name and date; give an evidence-specific rationale. For an approved case, explicitly complete five factual checks and propose a unique `mil-...` ID. A checkbox is a human assertion, **not proof of its truth**.
4. Run `npm run audit:project-execution-adjudications` locally. For a safe test of the tool without filling in decisions, run `npm run audit:project-execution-adjudications -- --file research/project-execution/m3-2-adjudications.example.json`.
5. The tool shows **non-publishing previews** only for technically valid, independently reviewed candidates. An approval for the taxonomy-blocked INL or Burntlog cases cannot override their schema barriers. Duplicate IDs, incomplete checklists, missing reviewer identity, invalid dates, or source-contract violations block the preview.
6. Reviews completed after `site.lastUpdated` are intentionally **blocked**, not backdated. Updating the corpus cutoff is a separate, explicit maintainer action at the actual publication phase; a preview does not authorize that change.
7. Even a clean preview is **not permission to publish**. An editor separately reviews and approves the final factual milestone and authorizes a distinct publication PR that adds `mil-...` seed records, updates the real corpus date, reruns validation, and checks site and financial-response invariants. Do not copy any local adjudication file into GitHub.

**Editorial outcomes as of October 8:** Alcoa Wagerup and Cyclic Extended Operations are proposals eligible for independent human review; INL prototype demonstration and Stibnite's Burntlog access-road construction remain taxonomy blocked. This is **not** a claim that any human has yet approved the candidates.
