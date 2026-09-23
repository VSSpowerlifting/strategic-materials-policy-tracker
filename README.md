# Strategic Materials Policy Tracker

**A source-linked policy-intelligence database tracking how governments contest rare earths and adjacent strategic materials** — through export controls, critical-mineral designations, stockpiling, funding, supply-chain law, and the official language each government uses to justify its stance.

**Live site → https://strategic-materials-policy-tracker.vercel.app**

This is an economic-security **policy** product, not a commodity-price tracker, a mining-economics model, or a generic dashboard. Every record resolves to at least one source in the register — primary official text wherever it is available, with anything less marked as such; every framing label is anchored to a quoted passage in the original language; nothing is scored on an invented 0–100 scale.

<!-- TODO (maintainer): add a /framing page screenshot here once a current, deploy-matching capture is available.
     An existing capture lives under .claude/skills/strategic-materials-live-design/screens/pages/framing.png,
     but that directory is gitignored and its design edition may not match the deployed site — verify before embedding.
     Suggested: commit a fresh /framing screenshot to docs/ or public/ and reference it as:
     ![Comparative framing matrix](docs/framing.png) -->

---

## Start here

A short guided tour of the live site:

- **[Home](https://strategic-materials-policy-tracker.vercel.app)** — the project framing and entry points.
- **[Framing](https://strategic-materials-policy-tracker.vercel.app/framing)** — the comparative framing matrix, the analytical centerpiece (see below).
- **[Events](https://strategic-materials-policy-tracker.vercel.app/events)** — the policy-measure index, filterable by actor, mechanism, material and status.
- **[Materials](https://strategic-materials-policy-tracker.vercel.app/materials)** — each tracked material, its position in Chinese policy, and diversification efforts.
- **[Coverage](https://strategic-materials-policy-tracker.vercel.app/coverage)** — the coded footprint: source composition, framing-anchor coverage, per-actor counts and the research boundaries, derived from the data rather than hand-written.
- **[Methodology](https://strategic-materials-policy-tracker.vercel.app/methodology)** — scope, source hierarchy, translation policy, and every label definition.
- **[Data](https://strategic-materials-policy-tracker.vercel.app/data)** — download the full dataset as JSON or CSV, with the same provenance shown on the site.

---

## What it is — and what it is not

It tracks **policy instruments and official framing**: the export controls, licensing regimes, critical-mineral designations, supply-chain-security laws, funding, stockpiling and offtake measures governments use around rare earths and adjacent strategic materials — translated, structured, and citable.

It does **not** model the global minerals market. It does not track or forecast market prices, estimate reserves or tonnages, publish supply-risk numbers, or make projections its sources do not state. Where market-share figures appear (for example, that China processes roughly 90% of rare earths), they are cited context drawn from bodies such as the IEA and USGS — not original estimates. The one kind of figure it does record is a term of a policy instrument that a government states or a binding filing sets out — a price floor in an agreement, a tax-offset rate, a capacity covenant — and only when it is precisely sourced. That boundary is the credibility shield, and it is stated plainly on the [methodology page](https://strategic-materials-policy-tracker.vercel.app/methodology).

The distinctive capability is depth on the Chinese side: the maintainer reads the Mandarin-language primaries directly, so Chinese measures are tracked more closely than English secondary reporting usually allows. The multi-actor frame keeps that depth honest by following the whole contest — the incumbent producer-processor and the states working to diversify away from it.

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

Coverage is deepest on the Chinese measures, read from Mandarin primaries. See the [methodology version history](https://strategic-materials-policy-tracker.vercel.app/methodology#versions) for the per-release changelog.

## Data model

Five entities, fully typed in [`lib/types.ts`](lib/types.ts):

- **PolicyEvent** — a policy measure, carrying a jurisdiction, mechanism(s), affected materials and sectors, status, document number and source IDs.
- **FramingClaim** — an official framing label anchored to a required quoted passage (`quoteOriginal` + `quoteEn` + provenance) and a resolving source.
- **Material** — a tracked material, its position in Chinese policy, downstream industries and diversification efforts.
- **Jurisdiction** — an actor profile: supply-chain role, key bodies and framing posture.
- **Source** — the source register, graded by a four-tier confidence hierarchy.

The categorical label sets are the single source of truth: the union types are derived from `as const` arrays, and the validator imports the same arrays, so the schema and the checks cannot drift apart.

### Capital & Control (v0.5, in development)

Two child entities let one event hold the separate instruments inside it. Both are typed in `lib/types.ts` and loaded by `lib/data.ts`, but their seed files are empty: no records are published yet, and neither entity appears in the API, the exports or any page.

- **FinancialCommitment** (`fin-*`, `data/seed/financial-commitments.json`) — one financial instrument: value role, capital source, amount, provider, recipient, project, facility, location, supply-chain stages, materials, terms and outcomes, with separate source-linked status histories for the money (announced to disbursed) and the project (feasibility to operational). Typed links say what a commitment is part of or drawn from, in the same event or another; one commitment can be both.
- **ControlMeasure** (`ctl-*`, `data/seed/control-measures.json`) — one operative clause of an export, import, investment or domestic control: type, direction, targets (including the end users and end uses it names, in its own words), materials, product scope and codes, legal basis, the measures it modifies, and a source-linked status history.

`fin-` and `ctl-` are reserved id prefixes; `fc-` stays with framing claims and `cand-` with private candidates. Amounts are decimal strings in the source's own currency, never converted or totalled across currencies or instruments; every field names the source that supports it; and private capital or total project cost is never counted as public support. The full rules are on the [methodology page](https://strategic-materials-policy-tracker.vercel.app/methodology#capital-control). Validator enforcement is the next phase.

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
  api/v1/            Read-only public API (events, materials, actors, sources, framing, coverage, watchlist)
  api/cite/          BibTeX / RIS / CSL-JSON citation endpoints
  sitemap.ts  robots.ts   Discoverability
components/          UI primitives and domain components
lib/                 types, data loaders, labels, formatting, export, site config,
                     search index, citation builders, coverage metrics, structured data
data/seed/           events / framing / materials / jurisdictions / sources / watchlist JSON
                     financial-commitments / control-measures JSON (v0.5; empty until backfilled)
data/candidates/     private, git-ignored candidate-review workspace (see its own README)
scripts/             validate-data.ts, candidate-files.ts
```

## Data & validation

All data lives in `data/seed/*.json`. The validator (`npm run validate`) checks that every event resolves to at least one source; that every framing claim carries a non-empty `quoteOriginal`, `quoteEn` and a resolving source; that no material, jurisdiction or superseded-event reference dangles; that identifiers are unique; that every label falls within the allowed sets; and that translation provenance is set on every translated field. It exits non-zero on any error, so it can gate CI.

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

**Current release: `v0.4-coverage`.** A multi-actor dataset across the tracked actors, with the comparative framing matrix, source register and a dedicated coverage & evidence dashboard in place, a passing data validator, and full JSON/CSV export. The site also has full-corpus search (with actor/mechanism filters and shareable URLs), a personal saved-events view, a read-only public API (`/api/v1/*`), citation endpoints (BibTeX/RIS/CSL-JSON), and a sitemap/robots.txt for discoverability. New candidate measures go through a private, git-ignored review workflow (`data/candidates/`) with its own schema validation before any human-approved promotion into the public seed. Coverage is deepest on the Chinese measures, read directly from Mandarin primaries. The full per-release changelog lives in the [methodology version history](https://strategic-materials-policy-tracker.vercel.app/methodology#versions).

Live counts are on the [coverage dashboard](https://strategic-materials-policy-tracker.vercel.app/coverage) rather than repeated here — a hand-written count in this README is a claim that goes stale the next time a record lands.

## Roadmap & known gaps

- Transcribe the original-language titles / document numbers currently marked `null` or `"Not yet coded"` against the primaries, and add framing anchors where they are still pending.
- Expand the material set beyond the rare-earth-centred eleven. Several coded instruments (the Australian production tax incentive, the UK and Canadian lists) name minerals — lithium, cobalt, nickel, PGMs — that have no `Material` record, so those measures currently show a narrower material scope on site than their text carries.
- South Korea and Brazil: both are in the intended actor set but neither is in the taxonomy yet, because no in-scope primary has been verified for them. The jurisdiction codes go in when the first event does, not before.
- Deepen non-Chinese actor coverage as primary sources are verified.
- **v0.5 Capital & Control:** validator rules for financial commitments and control measures (next), then a source-verified backfill of both, then their API and export fields. The data model is already in place; see [Capital & Control](#capital--control-v05-in-development) above.

## Usage & citation

The data is provided as-is for research and journalism. Categorical labels are interpretive judgements anchored to the cited sources, not legal determinations. Quotations are reproduced from the linked originals under fair use for commentary — please cite the original publisher as well as this database.

## Disclaimer

Not legal or compliance advice. Categorical labels are interpretive judgements anchored to the cited sources, not legal determinations. Do not rely on this for export-control classification or licensing decisions; consult the primary instruments and qualified counsel.

## Author / maintainer

Built and maintained by Benjamin Yang. The project's depth on Chinese measures comes from direct reading of Mandarin-language primary sources, paired with a multi-actor frame that tracks U.S., EU, Japanese, Australian, Canadian and Chinese policy instruments side by side. For questions about a classification, start from the source linked on each record, then see the [source register](https://strategic-materials-policy-tracker.vercel.app/sources).
