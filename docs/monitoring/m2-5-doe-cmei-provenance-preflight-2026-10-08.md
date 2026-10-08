# M2.5 — DOE Critical Minerals and Energy Innovation source-admission preflight

**Status:** manual, read-only DOE publisher-structure acceptance candidate. **Not an activated shadow collector.** No source identities, cache/state, editorial items, policy events, financing records, or website output are written.

## Why DOE after EXIM

SMPT M2.0's genuinely executed [live GitHub probe #37728686586](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37728686586) returned:
- **DOE CMEI:** HTTP 200, 12 article-path candidates on its filtered official listing. Unlike a verified parser, the initial cross-page anchor extractor could include unrelated global newsroom links and did not attribute dates.
- **Defense Industrial Base Policy:** inaccessible to that runner (`network_error`), so not eligible for an unattended collector at present.
- **EXIM:** subsequently proved complete body/listing boundaries and was admitted into a separately versioned shadow workflow, followed by persisted baseline, restored replay, an independent reliability audit and skipped-cron watchdog.

DOE's official [filtered Latest News listing](https://www.energy.gov/collection/view?page=0&paragraph=822121) presents dated entries and Next/Last pagination. It includes both critical-mineral announcements and an unrelated building construction programme. In particular, the [September 30 $29.5 million national-laboratory release](https://www.energy.gov/cmei/articles/does-office-critical-minerals-and-energy-innovation-announces-295-million-national) describes **projects selected for award negotiations**, not $29.5 million already contracted/disbursed. The [September 14 $16 million PROSPECT prize](https://www.energy.gov/cmei/articles/energy-department-launches-16-million-prize-grow-mining-and-critical-minerals) is a prize pool/open competition, not a concluded project loan or capital obligation. The negative control [builders' construction support programme](https://www.energy.gov/cmei/articles/doe-launches-new-program-help-builders-cut-construction-costs-and-save-americans) should not be auto-classified as a strategic-materials measure.

## This exact read-only probe

`SMPT DOE CMEI source provenance preflight` (workflow `.github/workflows/doe-cmei-provenance-preflight.yml`) has **workflow_dispatch only**. On a manual run from `main` it makes exactly five separate bounded official HTTPS requests:

1. `https://www.energy.gov/collection/view?page=0&paragraph=822121`
2. `https://www.energy.gov/collection/view?page=1&paragraph=822121`
3. September 30 mining selections release (potentially eligible source, not verified finance)
4. September 14 workforce prize release (potentially relevant programme, no loan assumption)
5. September 11 home builders programme (negative-control scope)

Site and redirect host must remain official `energy.gov`/ `www.energy.gov` over HTTPS. Requests timeout in 18 seconds, require `text/html`, enforce a 2MB raw HTML bound, and do not traverse/poll extra URLs. The output is a **public HTML forensic receipt**, not a source archive: bounded official-path headline candidates, unpaired visible date hints, candidate office attribution, H1 title hints, bounded meta-date tag previews, HTML SHA256 digests, pagination overlap count, and explicit caveats about attribution. A page HTML hash includes layout and navigation; it is *not* a full-body publication revision fingerprint.

Source parsing/forensics logic lives in `scripts/doe-cmei-forensics.ts`; offline tested sample workflow is `scripts/probe-doe-cmei.ts`. The runner saves `.monitor-doe-preflight/report.json` and `summary.md`, then uploads only `smpt-doe-cmei-preflight-RUN-ATTEMPT` with 30-day retention. Inadequate/blocked/malformed sample is flagged `degraded_do_not_activate` with a nonzero exit, after uploading available evidence. A complete five-request response is still `observed_forensic_only`, always `eligibleForMonitoringActivation: false`. A green Actions status **never** authorizes automatically adding DOE to the collector.

No Actions write permissions, no source-cache restore or save, no SQL, no `data/seed` modifications, no M1 `PILOT_SOURCE_IDS` changes, no M2 EXIM identity interaction, no code path from results into private editorial decisions.

## Operator workflow after review and merge

1. Confirm exact-head production dependency audit, data validation, TypeScript, lint, tests and build all pass. Verify zero changes to stateful collectors, financial/event data and private editorial history.
2. Open [SMPT DOE CMEI source provenance preflight](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-cmei-provenance-preflight.yml) and use **Run workflow → main**. No bootstrap input exists.
3. Inspect the report artifact and the original raw DOE HTML *before* approving a parser. Look for article card/list boundaries, date and issuing-office proximity, pagination, unique canonical URLs, article content versus global next/previous links, and a stable footer/body cutoff.
4. Validate exactly how article dates and updates are represented; test non-policy homebuilders story as a negative control. Identify cases of broad DOE newsroom rows mixed with DOE CMEI listings. A filtered listing's attribution is insufficient proof that all entries originated in CMEI.
5. Only after source-shape acceptance, consider a **separately versioned, initially unscheduled DOE shadow collector** with independent baseline and proof of a restored replay. Do not mutate NRCan/Federal Register or EXIM state to add DOE; do not automatically create finance commitments from release amounts.

This phase must not be described as production DOE monitoring. It is a deliberately narrow publisher-evidence gate designed to avoid the prior EXIM navigation/undated-card failures.
