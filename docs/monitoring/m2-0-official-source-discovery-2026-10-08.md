# M2.0 — Evidence gate before official-source monitoring expansion

**Status:** Read-only discovery proposal, October 8, 2026. No sources activated, no published records touched.

## Reader decision

Which official publication source can be safely added to SMPT's shadow monitor **without silently resetting the existing NRCan/Federal Register baselines** or mistaking a web listing for authoritative policy evidence?

Three high-priority official listing candidates have been publicly located and require a **GitHub-runner reachability/HTML-shape probe** before activation.

| Proposed source | Official listing URL | What this would cover | Crucial caution |
| --- | --- | --- | --- |
| U.S. EXIM news | https://www.exim.gov/news | Export credit, industrial finance and critical-mineral deal announcements | Listing titles do not distinguish an authorized transaction from an intent/framework; verify instrument terms and financing status |
| DOE Office of Critical Minerals and Energy Innovation (CMEI) | https://www.energy.gov/collection/view?page=0&paragraph=822121 | Critical-minerals funding selections, grant programmes, innovation and supply-chain measures | The office listing includes unrelated energy/manufacturing items; candidate relevance requires editorial review |
| Defense Industrial Base Policy | https://www.businessdefense.gov/news/index.html | DPA Title III and IBAS government industrial-base financing announcements | Automated reachability is uncertain, and some links may point to other government sites; do not claim an accessible machine-readable feed |

### Evidence observed before code

- The official EXIM news index contains dated headlines such as September 23's **U.S.–Argentina financing framework** (https://www.exim.gov/news/exim-signs-7-billion-argentina-build-future-framework-prioritize-energy-security-and-critical). A framework is **not** a $7 billion obligation to a critical-mineral project; no candidate financial record is authorized here.
- DOE CMEI's official news index lists September 30's national-laboratory mining project selections (https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national). That document describes projects **selected for award negotiations**; selection is not disbursement or finalized obligation.
- The defense industrial-base news page lists an August 31 gallium release and other DPA/IBAS investments (https://www.businessdefense.gov/news/index.html). External read attempts may time out; probe results must be inspected before declaring it monitorable.

These observations establish **editorial relevance**, not whether the sites consistently deliver parseable HTML to a GitHub runner, preserve stable dates or paginate completely.

## Manual-only source discovery

After merging M2.0, open [SMPT M2 official-source discovery](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/m2-source-discovery.yml) in GitHub Actions and run **Run workflow → main**. This is deliberately **not scheduled**.

The job executes `npm run monitor:probe-m2` and archives a `smpt-m2-discovery-RUN-ATTEMPT` artifact with `report.json` and `summary.md` (30-day retention), containing only public official listing links and HTTP health. It keeps a 15-second request timeout and 2 MB listing cap; follows redirects but validates the final host against an explicit official-source allowlist. The parser accepts only publication-shaped paths at the right official host, with duplicate URLs collapsed. It does **not** assign publication dates, fingerprint records, classify policy, infer finances, or create a persistent monitoring identity.

An HTTP 200 and several article-shaped links are necessary **but not sufficient** for promotion beyond M2.0. Manual evidence review must establish exact stable document identity, original publication date, page-to-page rollover, update semantics, issuer attribution, and link coverage. Sites blocked by robots, 403, 429 or nonparseable HTML remain in discovery only.

## Non-negotiable integration gates for M2.1

1. Choose **one** of the three government sources based on real workflow evidence. Do not claim a live feed from HTML discovery alone.
2. Capture and review a representative sample of original article pages including date/issuer/URL and a control case that is *not* a minerals policy measure.
3. Define a dedicated source parser, publication ID, finite-page coverage and health/failure behavior. Tests must cover new/revised/deduplication, blocked/changed HTML, publication date, and an old anchor leaving the window.
4. **Preserve M1 state continuity.** Existing `PILOT_SOURCE_IDS` contains two sources and `SMPT_MONITOR_REQUIRE_PRIOR_STATE=1`. Simply adding a third ID will make every unattended daily job reject the old two-source state. M2.1 must either run a separately versioned shadow baseline with its own cache/artifacts and fail-closed continuity or perform an explicitly authorized, audited state migration before joining an expanded pilot.
5. Preserve human-only policy verification and draft candidate approval. No updates to `data/seed`, financial totals, published lifecycle dates, `site.monitoringStartedAt` or public UI based on an unreviewed title.
6. Prove Day-0 and Day-1 replay on the chosen source before counting seven-day reliability.

## How to verify the proposal

The normal CI runs `npm run validate`, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. The new probe is checked offline with `npm run monitor:probe-m2 -- --check-runtime` and synthetic HTML/mock HTTP tests; the GitHub runner **live** reachability test is deliberately held until this PR is merged and manually dispatched. A green CI build alone cannot prove outside hosts are reachable.
