# F5-1 primary-source cross-check — three pilot execution assertions

**Research handoff — October 9, 2026. No human source-review signoff, verified physical-site inspection, milestone approval, or public publication.**

This note compares the existing canonical **pending** M3.2 review candidates against the publishers' original web releases. It is a source-quotation and logical-boundary cross-check, **not** independent confirmation that construction or production physically occurred. Publisher assertions must remain labelled as such. The checked-in `research/project-execution/m3-2-adjudications.example.json` retains `pending` decisions with null reviewer fields and false checks. An actual maintainer/reviewer must read each complete source, make an editorial judgment, and create separate local review decisions before any milestone-seed publication PR.

## Alcoa–Sojitz Wagerup gallium — candidate `review-m3-2-alcoa-wagerup`

- **Original publisher:** Alcoa Corporation, **August 24, 2026**, [original release](https://news.alcoa.com/press-releases/press-release-details/2026/Australia-Japan-the-United-States-and-Alcoa-Break-Ground-on-Gallium-Project-in-Western-Australia/default.aspx), first paragraph immediately following the publication date.
- **What the issuer explicitly says:** a groundbreaking ceremony for the gallium facility was held that day, and the ceremony **marked the start of construction**. It locates the new gallium plant beside Alcoa's Wagerup alumina refinery.
- **Queue interpretation:** `construction_started`, `named_facility`, occurred `2026-08-24`, specifically the gallium production plant, **not** the full Wagerup alumina refinery. Original publication date equals the issuer's reported groundbreaking/construction-start date.
- **What it does not prove:** production or commissioning; actual gallium output; completion, equity payment/drawdown, or government funds causing the construction. Three financial rows carrying the same observation must **not** generate three physical milestones.
- **Reviewer question:** Is an issuer's phrase “ceremony marked the start of construction” sufficiently precise to code `construction_started`, or should the milestone explicitly retain that ceremony-qualified evidentiary status in its note? Do not silently upgrade to substantial construction or operating status.

## Neo/NPM Narva magnets — candidate `review-m3-2-neo-narva-magnets`

- **Original publisher:** Neo Performance Materials, **September 14, 2026**, [original release](https://www.neomaterials.com/neo-advances-commercial-production-magnet-facility/), opening TORONTO paragraph and “Highlights”.
- **What the issuer explicitly says:** its European permanent-magnet facility was in commercial production and shipping initial sintered magnets to a Tier 1 traction-motor customer **as of the announcement**. The initial awarded customer program is distinguished from later programs.
- **Queue interpretation:** `production_reported`, `named_facility`, `occurredOn: null`. The September 14 publisher date establishes the **observation horizon**, not the first production day.
- **What it does not prove:** the date commercial manufacturing initially began, annual realized output, 2,000 tonnes actually produced, Phase 1B/5,000-tonne expansion achieved, or the long-run 20,000-tonne target achieved. The published nameplate capacity is not observed production. The JTF grant/recipient relationship does not itself prove causation or payment.
- **Reviewer question:** Does `production_reported` communicate a presently reported status rather than implying the first start event? Preserve the initial-program limitation and unknown physical start day.

## Stibnite Gold Project early works — candidate `review-m3-2-stibnite-early-works`

- **Original publisher:** Perpetua Resources, **October 21, 2025**, [original release](https://perpetuaresources.com/perpetua-resources-breaks-ground-on-the-stibnite-gold-project/), lead news paragraph and CEO Jon Cherry's attributed quotation immediately beneath it. An [issuer PDF](https://perpetuaresources.com/wp-content/uploads/Perpetua-Resources-Breaks-Ground-on-the-Stibnite-Gold-Project_Oct-21-2025-vFINAL-v2.pdf) also exists for stable editorial comparison.
- **What the issuer explicitly says:** **early works construction** for Stibnite began **October 21, 2025**; the CEO says the company started early works “today.” The October 17 posting of **$139 million in construction financial assurance secured using company cash** satisfied a distinct condition preceding commencement.
- **Queue interpretation:** `construction_started`, occurred `2025-10-21`, project `prj-us-stibnite`. The proposed `whole_project` scope is a **taxonomy review question**, not a judgment that whole-mine construction, commissioning or production began. The claimed activity is limited to **early works**.
- **What it does not prove:** commencement of every mine or processing-facility workstream; mine completion or first production; financial assurance as government spending; an **EXIM binding loan**, guaranteed disbursement, or financing causation. Perpetua itself states the preliminary EXIM project letter and indicative terms were conditional and **not a financing commitment**. The later May 30, 2026 Burntlog Route work is a **separate, taxonomy-blocked** infrastructure scope.
- **Reviewer question — IMPORTANT:** Is the existing schema's `whole_project` label potentially misleading for **early works** at one project, despite an explicit caution in the note? If it overstates breadth, do not approve that classification; require a defensible specific scope/taxonomy or retain the candidate as unapproved. This is a source-and-taxonomy judgment, not a syntactic validator decision.

## Common source and publication controls

1. A **publisher's first-party description** is primary evidence of **what the publisher reports**; it is not independent site-level verification of achieved industrial progress. No project-specific causal claims follow from contemporaneous governmental financing announcements.
2. Separately preserve `occurredOn` (physical event, if established), `datePublished` (issuer report), `dateAccessed` (actual registry access receipt) and `reviewedAt` (real reviewer decision). An unknown event day is `null`, never the publisher date by default.
3. A real human reviewer must read the original, validate the exact queue passage, translation basis, project and subfacility identity, documented scope, and the financial-status caveats. They must choose **approved, rejected, needs more evidence**, or leave **pending** in the existing private M3 adjudication mechanism; a positive decision still only produces a **non-publishing proposal**.
4. The proposed `site.lastUpdated: "2026-10-09"` in #121 represents a deliberate **curated source-registry revision**, not a claim that every record was rechecked, and not permission to backdate a source review. Any review undertaken later than this cutoff requires a separately authorized later corpus revision before promotion.
5. Public `data/seed/project-milestones.json` remains **[]**. No candidate, reviewer identity, original document quotation or machine-audit result is silently promoted into a source-reviewed physical milestone.

**Disposition:** the three issuer releases support **narrowly scoped reported observations** suitable for human adjudication, not unconditional milestone-seed publication. In particular, the Stibnite `whole_project` early-works breadth is a material human taxonomy question. **Keep review verdicts pending.**
