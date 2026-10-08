# M2.6 — DOE source-structure samples for collector design

**Status: candidate only, pending exact-head CI and a new manually dispatched live DOE source-preflight artifact.** This is an extension of M2.5/M2.5a, not a shadow collector, monitored source, or finance/policy publication workflow.

## Source evidence already established

[DOE manual preflight run 37818819424](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/runs/37818819424) completed successfully on merge `15ec165`, returning two HTTP 200 CMEI-filtered index pages with **10 distinct in-main article links on each page**, **zero** in-main page overlap, and **three** page-chrome news links excluded per page. Three directly sampled articles each returned HTTP 200 with an H1. The data explicitly says `eligibleForMonitoringActivation: false`.

The rendered DOE page displays one date for a press release (e.g. September 30, 2026) but other dates are present in global navigation and “View Previous/Next” content. Embedded `article:published_time` can also differ from the visible publisher date. **No reliable date/body/issuer selector is yet proven.**

## What this PR adds

Without fetching any additional URLs, the five existing bounded DOE fetches now attach:
- Up to **four 1,300-character maximum original HTML excerpts per listing page**, centered on existing canonical in-main article-link candidates. These preserve classes/wrappers and nearby potential date fields for **human DOM examination only**.
- Up to **four 1,300-character maximum HTML excerpts per sampled article**, centered on observed human-formatted date tokens (including navigation). The existing bounded CMS meta-date snippets stay distinct. No snippet is promoted to a trusted publisher date.
- Summary counts in the workflow report, but the **actual HTML snippets appear only in the already-private-to-workflow-operators report artifact** `report.json`. Existing `summary.md` remains compact; artifact retention remains 30 days.

No new state/version, publication identity, scanner run, GitHub write permission, external sender, candidate inbox, commitment amount, export, project relationship or API/public UI change is made. Source response size, timeout, official-host allowlist, exact five-request budget and non-activation decision are unchanged.

## Acceptance protocol

1. Exact-head CI (production npm security audit, schema/seed validation, TypeScript, lint, full tests, build). Synthetic tests must enforce specimen-count/length bounds, prove CMS `published_time` need not equal the visible press-release date, and preserve `publicationDate` as **absent**.
2. Human squash merge without bypassing required checks (Vercel may be rate-limited).
3. One manual [DOE source provenance preflight](https://github.com/VSSpowerlifting/strategic-materials-policy-tracker/actions/workflows/doe-cmei-provenance-preflight.yml) from `main`. Its receipt should still show 10 + 10 distinct in-main links and three off-main links per page. Any divergence is new live source evidence, not grounds for waiving guards.
4. Inspect the new **listingDomSamples** and **dateDomSamples** fields in the live `report.json`. Record the exact stable DOE HTML card wrapper, title link, date node, issuing-office node, article main-body region and footer/header/body exclusions. **If card/title/date coupling cannot be established, stop: do not implement the collector.**
5. Only a later explicit M2.7 acceptance could add a **standalone initially manual-only DOE shadow collector**, independently persisted/stored without changing existing NRCan/Interior/EXIM identity state. Full-text original publication evidence, stable content-only revision fingerprint, finite pagination/rollover and negative-control publication are required. An announcement of selected grants or an open competition is not a binding or disbursed commitment.

## Source-use caution

These sampled 1,300-character spans are raw markup for engineering diagnostics and may contain text snippets or layout content. They are not a redistribution archive and should not be presented as published SMPT news; use the source's permitted content excerpts and original links for any downstream public output. Raw whole-page HTML is intentionally **not** archived.
