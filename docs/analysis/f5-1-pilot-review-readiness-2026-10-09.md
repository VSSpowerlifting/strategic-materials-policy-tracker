# F5-1 — Source-review pilot readiness and handoff (2026-10-09)

**Scope:** [F5 roadmap #108](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/108) / [F5-1 #110](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/issues/110). The F5-0 typed contract and F5-2 per-project projection are merged and active on main. F5-1's next purpose is to publish genuinely **human-attested, scoped original-source** milestones, not to turn existing financing-row physical status reports into authoritative operations claims automatically.

## Architectural discovery: reuse the existing M3.2 workflow

SMPT **already has** the full source-review and human-decision pipeline:
- `research/project-execution/m3-2-source-review-queue.json` (four existing source leads)
- `research/project-execution/m3-2-adjudications.example.json` (signed decision template, default all pending)
- `scripts/adjudicate-project-execution.ts` (pure, fail-closed human-review preview)
- `npm run audit:project-execution-adjudications` (reads only a gitignored local review file)
- `data/seed/project-milestones.json` (**still empty**, no approved native milestones)

Rebuilding this workflow in F5 would create competing review/verdict systems. Instead F5-1 adds a **nonpublishing source-research crosswalk** at `research/f5/pilot-source-review.json` and a read-only readiness CLI `npm run audit:f5-pilots [-- --json]`. The CLI audits source registration, first-party citation identity, M3 review reuse, source/occurrence dates, project scope categories and human/corpus-cutoff blockers. It cannot approve, sign, promote, or publish anything, even if all structural checks succeed.

## First-party source investigations

### Alcoa–Sojitz gallium recovery, Wagerup (reuses existing M3.2 review)

The original [Alcoa issuer August 24, 2026 announcement](https://news.alcoa.com/press-releases/press-release-details/2026/Australia-Japan-the-United-States-and-Alcoa-Break-Ground-on-Gallium-Project-in-Western-Australia/default.aspx) explicitly states, in the opening paragraph, that the ceremony marked the start of constructing its Wagerup gallium plant. SMPT already registers `src-alcoa-wagerup-groundbreaking-2026` and has an **M3.2 human review lead `review-m3-2-alcoa-wagerup`** with a proposed `construction_started`, named facility, occurred August 24. Three associated financing rows cite the same source. F5 must **not** create three native milestones or a new duplicate research proposal.

### Neo's Narva commercial-magnet production (new source-review candidate)

[Neo issuer release, September 14, 2026](https://www.neomaterials.com/neo-advances-commercial-production-magnet-facility/) directly reports the European manufacturing facility **in commercial production and shipping** sintered magnets under an initial automotive program. SMPT already registers `src-neo-commercial-production-2026`. Propose `production_reported`, `scope: named_facility` with an explicitly bounded initial commercial program; **`occurredOn: null`** because September 14 is **when Neo reported an existing production state**, not proof of the exact day manufacturing first began. The original speaker's date is a separate evidence-publication boundary. Phase 1B expansion and a 20,000-tonne longer-term goal remain **planned capacity**, not observed output. Grants from the JTF and production are not demonstrated causally linked.

### Perpetua Stibnite early works (new distinct issuer source, registration pending)

[Perpetua issuer's October 21, 2025 release](https://perpetuaresources.com/perpetua-resources-breaks-ground-on-the-stibnite-gold-project/) explicitly says its team started **early-works construction that day**. This is a distinct earlier project-wide *early works* stage, not Burntlog Route's 2026 stage, and not evidence that the mine or processing plant was operating. The proposed scope `whole_project` attaches the claim to Stibnite Gold Project while the statement and caveat strictly limit the actual assertion to **early works**. Proposed occurrence **2025-10-21** from the issuer's specific “today,” not a 2026 retrospective reporting date.

The original October 2025 release is **not yet a registered SMPT Source**. A dedicated official source identity (`src-perpetua-stibnite-early-works-2025`) is held as a **research intention only**, not used in public seeds. Its source record and source-access date need verification as part of separate human-approved publication. The October 2025 source is distinct from the existing `src-perpetua-stibnite-construction-2026` June 1 issuer report.

### Burntlog Route (existing M3.2 taxonomy hold, NOT silently cleared)

Perpetua's [June 1, 2026 release](https://www.investors.perpetuaresources.com/investors/news/perpetua-resources-advances-construction-of-the-stibnite-gold-project) identifies **May 30, 2026** critical-path infrastructure work including the **Burntlog Route**. The existing M3 review `review-m3-2-stibnite-burntlog` correctly labels its scope **`named_infrastructure`**, not present in the production `PROJECT_MILESTONE_SCOPES` taxonomy. The current published kind/scope taxonomy has `whole_project`, `named_facility` and `funded_activity` but no `named_infrastructure`.

**Do not solve this by calling a road an operating facility** or creating a one-off new type without an explicit maintainer decision. The case stays `taxonomy_blocked`, potentially requiring a reusable infrastructure-scope extension *after* more examples and approval. Earlier October 2025 early works do not erase May 2026 construction work.

## Crucial independent publication clocks

- Site's `site.lastUpdated` is still **2026-10-07**, a curated corpus revision date. The source research occurred **2026-10-09**. A genuine human review dated October 9 would **postdate the corpus cutoff** and be rejected by the existing M3 source milestone validator; never forge October 7 as reviewedAt to circumvent this.
- Eligible first-party source publication (Alcoa Aug 24; Neo Sep 14; Perpetua June 1; Perpetua Oct 21 2025) does **not** certify a completed human review or a definitive exact start date.
- A registered source's `dateAccessed` records the registered access date, not a proven first-ever web availability date. A missing September 2025/2026 record is an absence from SMPT, not absence of industrial activity.

## Hand-off for actual publication

1. Maintainer reviews F5-1 original source text and the M3.2 adjudication process.
2. Reuse **existing M3 Alcoa** (do not duplicate) and preserve **Burntlog taxonomy blocked**; add a scoped original-source M3 reviewer path for Neo and October 2025 Stibnite only if approved.
3. Register the Perpetua Oct 21, 2025 release with a truly verified URL/date/issuer/access receipt and complete source review; no new standalone money instrument.
4. Human reviewer independently checks actual occurrence, scope, source language/quote and dates, provides their *real* identity and current review day in the gitignored local `.project-execution-review/adjudications.json` (or approved expanded M3 path).
5. **Separately authorize an updated curated corpus cutoff** at or after the *real* review day; review all downstream site metadata/date dependencies before making this change.
6. Run `npm run audit:project-execution-adjudications`, inspect preview and validation, then propose a **separate reviewed-data PR** to publish narrowly scoped native `mil-*` claims with original primary sources and required reviewer receipt. Do not auto-publish from this research artifact.
7. Only afterward build F5-3 public interactive casefiles with mobile/desktop browser verification and accessibility checks.

## Acceptance for this research infrastructure PR

- `npm run audit:f5-pilots` is deterministic and read-only, reports **4 pilot source cases (2 existing M3 reused, 2 new)**, **1 unregistered issuer source**, **1 taxonomy gate**, and **4 human review requirements**; publicationAuthorized is literally `false` in every output.
- Fail-closed tests cover source identity and dates, existing M3 links, duplicate attempts, signed approval impersonation, planned-vs-occurred, source/corpus boundaries, and the absence of public milestone changes.
- Audit cannot and does not change the public project/evidence graph, financial totals, status histories, source registry, site dates, candidate isolation, exports, or schedules. Full dependency audit, validate/typecheck/lint/tests/build on exact head; human review and squash merge separately.

**This artifact is source research, not certified publication.** The purpose is to remove engineering ambiguity so a human reviewer can make real source decisions instead of manually reconstructing four histories or unknowingly double-counting one event.

## October 9 follow-on: Neo/Narva moved into the canonical unsigned M3.2 reviewer queue

After this initial research packet was prepared, the Narva commercial-production lead was **routed to the preexisting M3.2 adjudication queue**, rather than leaving an approval-eligible duplicate in F5. Canonical queue ID: `review-m3-2-neo-narva-magnets`. The F5 entry now uses `track: existing_m3_review`, points at that queue ID, and has `proposal: null`; it remains `pending_human_review`.

- Original issuer [September 14, 2026 Neo release](https://www.neomaterials.com/neo-advances-commercial-production-magnet-facility/), first body paragraph: Neo reports the Narva permanent magnet facility **is in commercial production and shipping** rare earth sintered magnets under initial programs. Registered `src-neo-commercial-production-2026` has an issuer publication date of 2026-09-14 and an existing source-access record dated 2026-10-02.
- `production_reported`, `named_facility`, `claimMode: occurred`, `occurredOn: null`, `targetOn: null` are **unreviewed scope proposals**, not an approval. Neo does **not** give an independently established day commercial production first started; the release date is only the latest evidence boundary for its reported state.
- The single associated JTF finance row is a **source pointer** that carries the same original issuer implementation observation, not an assertion that the EU JTF grant caused production or that the funding was paid for a given output quantity. No historical grant amount versioning, financial totals or legal status is affected.
- The existing M3 reviewer example now includes a fifth `pending` record with null reviewer identity and all attestations false. F5 reports **3 reused M3 cases, 1 remaining new lead** (2025 Perpetua early works), 1 missing registered source, 1 Burntlog taxonomy hold. It still authorizes **no publication**.

**Remaining hard gates:** independent human review and attestation of the Neo issuer passage; approval of an honest curated corpus-date update (currently October 7); Perpetua October 2025 source registration and independently resolved early-works scope; Burntlog infrastructure taxonomy decision. The public `data/seed/project-milestones.json` remains empty. No reader-facing F5 casefile is unlocked by this PR.
