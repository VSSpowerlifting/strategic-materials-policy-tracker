# Strategic Materials Policy Tracker

**A source-linked comparative research platform for economic security and strategic materials** — examining how governments use industrial policy, trade and legal controls, investment, public finance and industrial intervention, and what the available evidence establishes about implementation. Measures, financial instruments and reported physical activity remain distinct, with field-level references back to original sources.

**Live site → https://strategic-materials-policy-tracker.vercel.app**

This is an economic-security **policy** product, not a price forecaster, a mining-economics model, or a generic dashboard. Every record resolves to at least one source in the register — primary official text wherever it is available, with anything less marked as such; every framing label is anchored to a quoted passage in the original language; nothing is scored on an invented 0–100 scale.

<!-- TODO (maintainer): add a /framing page screenshot here once a current, deploy-matching capture is available.
     An existing capture lives under .claude/skills/strategic-materials-live-design/screens/pages/framing.png,
     but that directory is gitignored and its design edition may not match the deployed site — verify before embedding.
     Suggested: commit a fresh /framing screenshot to docs/ or public/ and reference it as:
     ![Comparative framing matrix](docs/framing.png) -->

---

## Editorial positioning

These commitments govern public descriptions of the project; they do not imply equal source coverage or authorize altering historical records:

1. **Geographically neutral.** Compare policy instruments and evidence across China, the United States, the EU, Japan, Australia, Canada and other tracked jurisdictions without organizing the project around a single country. Preserve differences in the actual research footprint.
2. **Economically substantive.** Examine industrial policy, economic security, trade and legal controls, investment, public finance and reported implementation, distinguishing instrument types and status changes.
3. **Evidence-driven.** Connect policy announcements and rationales to financing records and source-reviewed industrial observations where documented. Attribute claims to their issuers, disclose gaps and never infer a causal relationship from co-occurrence.

---

## Applied Strategy research outputs

SMPT's source-linked tracker is the **evidence infrastructure**, not a forecast engine or an investment-advice service. Its separate **Applied Strategy** research products use that evidence to evaluate corporate and institutional decisions with explicit assumptions, options, financial/operational scenarios and—when appropriate—editable Excel models and decision-ready presentations. Analytical projections and model outputs are never silently promoted into the factual tracker.

The permanent [Four-Layer Analytical Framework & Applied Strategy Standard](docs/research/SMPT_APPLIED_STRATEGY_STANDARD.md) connects **government policy → capital allocation → industrial execution → commercial implications** and defines the evidence, PowerPoint, Excel-model and publication-review expectations. Broader source coverage is useful insofar as it enables better research and better decisions, not as a record-count goal.

---

## Start here

A short guided tour of the live site:

- **[Home](https://strategic-materials-policy-tracker.vercel.app)** — the project framing and entry points.
- **[Framing](https://strategic-materials-policy-tracker.vercel.app/framing)** — the comparative framing matrix, the analytical centerpiece (see below).
- **[Events](https://strategic-materials-policy-tracker.vercel.app/events)** — the policy-measure index, filterable by actor, mechanism, material and status.
- **[Capital](https://strategic-materials-policy-tracker.vercel.app/capital)** — every financial instrument (equity, loans, grants, tax offsets, price floors, offtake, stockpile money, envelopes), in its original currency, with public commitments totalled per currency and no package counted twice.
- **[Controls](https://strategic-materials-policy-tracker.vercel.app/controls)** — export, re-export, import, investment, customs and domestic-production controls, one row per clause, with a legal-status timeline and the clocks on time-limited suspensions.
- **[Capital × Control](https://strategic-materials-policy-tracker.vercel.app/interplay)** — money and restrictions on one clock, one material-by-actor grid and one material-by-stage response map of capital, designations and control clauses.
- **[Portfolios](https://strategic-materials-policy-tracker.vercel.app/portfolios)** — each government's capital side by side: committed public money per currency and per instrument, binding apart from not yet binding, with record counts by value role, stage, material and geography; where the money flows; projects with more than one backer; and recognition without money.
- **[Projects](https://strategic-materials-policy-tracker.vercel.app/projects)**, **[Organizations](https://strategic-materials-policy-tracker.vercel.app/organizations)** and **[Programmes](https://strategic-materials-policy-tracker.vercel.app/programmes)** — capital stacks, provider and recipient profiles, and programme ledgers that list ceilings beside the awards recorded under them.
- **[Materials](https://strategic-materials-policy-tracker.vercel.app/materials)** — source-linked policy, financing and industrial evidence by material, with stated coverage limitations.
- **[Coverage](https://strategic-materials-policy-tracker.vercel.app/coverage)** — the coded footprint: source composition, framing-anchor coverage, per-actor counts and the research boundaries, derived from the data rather than hand-written.
- **[Methodology](https://strategic-materials-policy-tracker.vercel.app/methodology)** — scope, source hierarchy, translation policy, and every label definition.
- **[Data](https://strategic-materials-policy-tracker.vercel.app/data)** — download the full dataset as JSON or CSV, with the same provenance shown on the site.

---

## What it is — and what it is not

It tracks **policy instruments, financial commitments, official framing and reported industrial activity**: the export controls, licensing regimes, critical-mineral designations, investment rules, supply-chain-security laws, funding, stockpiling and offtake measures governments use around rare earths and adjacent strategic materials — structured, attributed and citable.

It does **not** model the global minerals market. The policy record holds no market prices, and the project does not forecast prices, estimate reserves or tonnages, publish supply-risk numbers, or make projections its sources do not state. Where market-share figures appear (for example, that China processes roughly 90% of rare earths), they are cited context drawn from bodies such as the IEA and USGS — not original estimates. The one kind of figure it does record is a term of a policy instrument that a government states or a binding filing sets out — a price floor in an agreement, a tax-offset rate, a capacity covenant — and only when it is precisely sourced. That boundary is the credibility shield, and it is stated plainly on the [methodology page](https://strategic-materials-policy-tracker.vercel.app/methodology).

The distinctive capability is connecting government measures and their stated rationales to financial instruments, projects and source-reviewed industrial observations. Announcements, binding commitments, payments and reported physical developments are different kinds of evidence; a shared date, material or project does not establish causation. Coverage is selective and uneven across jurisdictions, not a comprehensive measure of government activity.

## Market data layer

[`/markets`](https://strategic-materials-policy-tracker.vercel.app/markets) is a separately maintained research-data layer. It republishes price series exactly as three public releases state them:

| Release | Coverage | Terms |
| --- | --- | --- |
| World Bank Pink Sheet | Monthly averages for aluminium, copper and nickel | CC BY 4.0, with attribution |
| IMF Primary Commodity Prices | Monthly averages for cobalt, palladium and rare-earth carbonate | IMF copyright and usage terms for statistical data: attribution and a statement of changes |
| USGS Mineral Commodity Summaries 2026 data release | Annual prices and import unit values, 2021–2025, for rare-earth oxides, lithium, gallium, germanium, tungsten, graphite and others | CC0 1.0, with provenance kept |

Several series are averages or republications of commercial price data: the World Bank lists Bloomberg, Platts Metals Week and Thomson Reuters Datastream among its sources, the IMF's rare-earth carbonate series is based on a Shanghai Metal Market assessment, and the USGS cites price-reporting agencies for many of its annual prices. SMPT carries only the figures these publishers release, under the publishers' terms. It has no licence to the underlying vendor data, and each series records the source its publisher names. Commercial reuse of IMF data needs the IMF's permission, and the IMF notes that some of its statistical products carry separate third-party terms; SMPT has found none for the series it carries. The CSV export repeats each source's attribution, terms, statement of changes and reuse note on every row.

The layer stays apart from the policy, financing and project records:

- Its files live in `data/markets/<release>/`, never in `data/seed/`.
- Each release is rebuilt only by its own ingest script from a pinned source file whose SHA-256 is checked.
- No series is linked to an event, a financial commitment, a capital total or site search, and a shared date does not show that a measure moved a price.
- Exchange benchmarks, price assessments and trade unit values are labelled as different kinds of figure, and a unit value is never called a price.
- Values are stored as published, in their own currency and unit, and are never converted or combined.

## The comparative framing matrix

The signature page is **[Framing](https://strategic-materials-policy-tracker.vercel.app/framing)** — a comparison of *how each government justifies its stance* on the same contested materials, side by side. Rather than asserting that a control is "retaliation" or "de-risking," the matrix shows the actor's own words: each cell is backed by a quoted passage in the original language, its translation, the translation provenance, and a source that resolves to the document the quote came from. It turns rhetoric into evidence you can check, and it makes the contrast between actors legible at a glance.

## Methodology principles

These are the project's standing commitments, enforced in code by `scripts/validate-data.ts`:

1. **No synthetic risk score.** Every classification is a categorical, source-grounded label — there is no 0–100 number anywhere in the model.
2. **Source-linked records.** Every event resolves to at least one source in the register.
3. **Original-language quote anchors.** Every framing label is anchored to a non-empty quoted passage in the original language with its translation; a framing label without an anchor is invalid data.
4. **Explicit translation provenance.** Official English is preferred; self / third-party translations are marked; only short passages are quoted, with the original linked.
5. **Primary-source verification.** Document numbers, dates and titles are verified against the primary before coding; unverified fields stay `null` or `"Not yet coded"`, never guessed.
6. **Categorical labels instead of invented composite scores.** The allowed label sets are fixed and defined on the methodology page.

## Coverage

- **Actors:** China, the United States, the EU, Australia, Japan, Canada, the United Kingdom and India.
- **Materials:** a rare-earth-centred set of strategic materials and their downstream sectors.
- **Time:** 2018–2026. Coverage is deepest from 2023 onward; the earlier records are the foundational instruments — designation lists, export-control statutes and enabling acts — that the later measures are issued under.

Research depth varies by actor and material; consult the [coverage report](https://strategic-materials-policy-tracker.vercel.app/coverage) rather than inferring equivalent observation across jurisdictions. See the [methodology version history](https://strategic-materials-policy-tracker.vercel.app/methodology#versions) for the per-release changelog.

## Data model

Five entities, fully typed in [`lib/types.ts`](lib/types.ts):

- **PolicyEvent** — a policy measure, carrying a jurisdiction, mechanism(s), affected materials and sectors, status, document number and source IDs.
- **FramingClaim** — an official framing label anchored to a required quoted passage (`quoteOriginal` + `quoteEn` + provenance) and a resolving source.
- **Material** — a tracked material, with policy context, downstream industries and diversification notes; source records provide jurisdiction-specific evidence.
- **Jurisdiction** — an actor profile: supply-chain role, key bodies and framing posture.
- **Source** — the source register, graded by a four-tier confidence hierarchy.

The categorical label sets are the single source of truth: the union types are derived from `as const` arrays, and the validator imports the same arrays, so the schema and the checks cannot drift apart.

### Capital & Control (v0.5)

Two child entities let one event hold the separate instruments inside it. Both are typed in `lib/types.ts`, loaded by `lib/data.ts`, validated at runtime and published on `/capital`, `/controls` and `/interplay`, in the event, material and actor pages, in search, in the `/api/v1` endpoints and in the exports. Every derived figure comes from one module, `lib/capital-control.ts`, under the [counting rules](https://strategic-materials-policy-tracker.vercel.app/methodology#capital-counting): totals only per currency and only for rows whose value role is "commitment"; a part never added to the package it belongs to (and a total withheld if two counted rows share a descendant); envelopes, appropriations and lending authorities listed, never summed; private capital, recipient funds, expected co-investment and project cost kept apart from public support; “up to”, “about” and “at least” figures added only to their own kind and kept apart from exact figures (an “up to” sum adds stated upper bounds; envelopes and unexercised options are listed, never summed); control statuses evaluated on the data's as-of date; exact decimal arithmetic.

- **FinancialCommitment** (`fin-*`, `data/seed/financial-commitments.json`) — one financial instrument: value role, capital source, amount, provider, recipient, project, facility, location, supply-chain stages, materials, terms and outcomes, with separate source-linked status histories for the money (announced to disbursed) and the project (feasibility to operational). Typed links say what a commitment is part of or drawn from, in the same event or another; one commitment can be both.
- **ControlMeasure** (`ctl-*`, `data/seed/control-measures.json`) — one operative clause of an export, import, investment or domestic control: type, direction, targets (including the end users and end uses it names, in its own words), materials, product scope and codes, legal basis, the measures it modifies, and a source-linked status history.

### Capital intelligence (v0.6)

Registries of the parties and undertakings the instruments connect, each record evidenced field by field: **Organization** (`org-*`, `data/seed/organizations.json`) — providers, recipients, sponsors and holders, with kind, country, the government they belong to and their parent bodies; **Project** (`prj-*`, `data/seed/projects.json`) — one physical undertaking with its sponsors, location, stages and materials; **Programme** (`prg-*`, `data/seed/programmes.json`) — a named scheme that awards, lends, credits, reserves or designates; and a third child row of an event, **ProjectDesignation** (`dsg-*`, `data/seed/project-designations.json`) — a project recognized under a designation scheme such as the EU Critical Raw Materials Act. Registry records hold no money: capital stacks, portfolios, co-investment and flows are derived in `lib/capital-intelligence.ts` through the same counting rules. Control clauses also record the kind of item and the supply-chain stage they cover.

`fin-` and `ctl-` are reserved id prefixes, as are `org-`, `prj-`, `prg-` and `dsg-`; `fc-` stays with framing claims and `cand-` with private candidates. Amounts are decimal strings in the source's own currency, never converted or totalled across currencies or instruments; every field names the source that supports it; and private capital or total project cost is never counted as public support. The full rules are on the [methodology page](https://strategic-materials-policy-tracker.vercel.app/methodology#capital-control).

`npm run validate` checks all six seed files at runtime (`scripts/validate-capital-control.ts`). Ids carry their prefix and are unique and sorted; every reference resolves, and a row's materials come from its event's; figures are canonical decimal strings; currency and country codes have the ISO format (the format only, not registry membership); dates are real, and a history's dated entries run oldest first; relationships and modifications never loop back; and every populated field group names its source in `evidence`, as does each term, outcome, relationship and status entry.

## Tech stack

- Next.js (App Router) · TypeScript · Tailwind CSS v4
- Local seed JSON for the dataset — no live APIs, no database, no auth, no scrapers
- CSV / JSON export via `force-static` route handlers
- Deploys to Vercel

### Project structure

```
app/                 Routes (App Router)
  events/            Event index + [id] detail
  materials/         Material index + [slug]
  actors/            Jurisdiction index + [code]
  framing/           Comparative framing (the signature page)
  coverage/          Coverage & evidence dashboard (derived, no hard-coded counts)
  compare/           Comparative control matrix (material x actor)
  search/            Corpus-wide search with actor/mechanism filters, shareable URLs
  saved/             Personal saved-events view (localStorage, no account)
  watchlist/         Project-curated registry of sources under standing review
  timeline/  sources/  methodology/  data/  about/
  api/export/        force-static CSV / JSON download handlers
  capital/  controls/  interplay/   Capital & Control pages + [id] detail pages
  portfolios/  projects/  organizations/  programmes/   Capital intelligence pages (v0.6)
  api/v1/            Read-only public API (events, materials, actors, sources, framing, coverage, watchlist,
                     financial-commitments, control-measures, capital-control/summary, organizations,
                     projects, programmes, project-designations, capital-intelligence/summary)
  api/cite/          BibTeX / RIS / CSL-JSON citation endpoints
  sitemap.ts  robots.ts   Discoverability
components/          UI primitives and domain components
lib/                 types, data loaders, labels, formatting, export, site config,
                     search index, citation builders, coverage metrics, structured data,
                     capital-control analytics (capital-control.ts, capital-control-summary.ts, decimal.ts),
                     capital-intelligence analytics (capital-intelligence.ts, capital-intelligence-summary.ts)
data/seed/           events / framing / materials / jurisdictions / sources / watchlist JSON
                     financial-commitments / control-measures JSON (v0.5)
                     organizations / projects / programmes / project-designations JSON (v0.6)
data/markets/        pinned market-data releases (World Bank, IMF, USGS) and coverage gaps, kept apart from data/seed/
data/candidates/     private, git-ignored candidate-review workspace (see its own README)
scripts/             validate-data.ts, validate-capital-control.ts, candidate-files.ts,
                     ingest-markets*.ts (one deterministic ingest per market release)
```

## Data & validation

Policy, financing and project data live in `data/seed/*.json`; the market-data layer lives in `data/markets/`, and `npm run validate` checks both. The validator (`npm run validate`) checks that every event resolves to at least one source; that every framing claim carries a non-empty `quoteOriginal`, `quoteEn` and a resolving source; that no material, jurisdiction or superseded-event reference dangles; that identifiers are unique; that every label falls within the allowed sets; and that translation provenance is set on every translated field. It exits non-zero on any error, so it can gate CI.

To add a record, edit the relevant seed file and re-run `npm run validate`. Unknown fields should be `null` or `"Not yet coded"`.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # run the seed-data integrity checks
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # node --test, unit + integration tests
npm run build      # production build + prerender
```

## Status

**Current release: `v0.6-capital-intelligence`.** Registries of organizations, projects and programmes, project designations, capital stacks, portfolios, programme ledgers, co-investment, flows and the material-by-stage response map, over new primary-source coverage: China's 9 October 2025 announcements (Nos. 56, 57, 58, 62), the EU's CRMA Strategic Projects (the March and June 2025 lists and, from Commission Decision C(2026) 8051 of 9 October 2026, the 26 of its 46 recognised projects that name a tracked material) and RESourceEU, Japan's certified supply-assurance plans and JOGMEC grants, Canada's G7 Production Alliance round and PDAC 2026 awards, Commerce's CHIPS agreements with USA Rare Earth, and the DoD–MP package's later history from MP's filings. Currency totals are now split by instrument, as the methodology always said they would be.

**Previous release: `v0.5-capital-control`.** Capital & Control: source-verified financial commitments and clause-level control measures, with the Capital, Controls and Capital × Control pages, their APIs and CSV exports. Before it: a multi-actor dataset across the tracked actors, with the comparative framing matrix, source register and a dedicated coverage & evidence dashboard in place, a passing data validator, and full JSON/CSV export. The site also has full-corpus search (with actor/mechanism filters and shareable URLs), a personal saved-events view, a read-only public API (`/api/v1/*`), citation endpoints (BibTeX/RIS/CSL-JSON), and a sitemap/robots.txt for discoverability. New candidate measures go through a private, git-ignored review workflow (`data/candidates/`) with its own schema validation before any human-approved promotion into the public seed. Coverage is deepest on the Chinese measures, read directly from Mandarin primaries. The full per-release changelog lives in the [methodology version history](https://strategic-materials-policy-tracker.vercel.app/methodology#versions).

Live counts are on the [coverage dashboard](https://strategic-materials-policy-tracker.vercel.app/coverage) rather than repeated here — a hand-written count in this README is a claim that goes stale the next time a record lands.

## Roadmap & known gaps

- Transcribe the original-language titles / document numbers currently marked `null` or `"Not yet coded"` against the primaries, and add framing anchors where they are still pending.
- Expand the material set beyond the rare-earth-centred eleven. Several coded instruments (the Australian production tax incentive, the UK and Canadian lists) name minerals — lithium, cobalt, nickel, PGMs — that have no `Material` record, so those measures currently show a narrower material scope on site than their text carries.
- South Korea and Brazil: both are in the intended actor set but neither is in the taxonomy yet, because no in-scope primary has been verified for them. The jurisdiction codes go in when the first event does, not before.
- Deepen coverage of currently under-researched jurisdictions as primary sources are verified.
- **Capital intelligence, next:** the proposed restriction on exports of permanent-magnet scrap once an instrument exists; Canadian Strategic Response Fund (formerly SIF) project awards, which no primary lists individually yet; US EXIM, DOE and DPA Title III awards; China's treatment of the October 2025 package after the continued suspension ends on 10 January 2027 (Announcement No. 58 of 2026 extended the first period, which ended 10 November 2026); disbursement histories as primaries publish them. See [Capital intelligence](#capital-intelligence-v06) above.

## Usage & citation

The data is provided as-is for research and journalism. Categorical labels are interpretive judgements anchored to the cited sources, not legal determinations. Quotations are reproduced from the linked originals under fair use for commentary — please cite the original publisher as well as this database.

## Disclaimer

Not legal or compliance advice. Categorical labels are interpretive judgements anchored to the cited sources, not legal determinations. Do not rely on this for export-control classification or licensing decisions; consult the primary instruments and qualified counsel.

## Author / maintainer

Built and maintained by Benjamin Yang, SMPT combines international affairs research, economic-security analysis and close examination of primary-source evidence. Its approach is comparative rather than country-centered. For questions about a classification, start from the source linked on each record, then see the [source register](https://strategic-materials-policy-tracker.vercel.app/sources).
