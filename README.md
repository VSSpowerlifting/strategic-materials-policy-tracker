# Strategic Materials Policy Tracker

**A source-linked policy-intelligence database tracking how governments contest rare earths and adjacent strategic materials** — through export controls, critical-mineral designations, stockpiling, funding, supply-chain law, and the official language each government uses to justify its stance.

**Live site → https://strategic-materials-policy-tracker.vercel.app**

This is an economic-security **policy** product, not a commodity-price tracker, a mining-economics model, or a generic dashboard. Every record resolves to a primary source; every framing label is anchored to a quoted passage in the original language; nothing is scored on an invented 0–100 scale.

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
- **[Methodology](https://strategic-materials-policy-tracker.vercel.app/methodology)** — scope, source hierarchy, translation policy, and every label definition.
- **[Data](https://strategic-materials-policy-tracker.vercel.app/data)** — download the full dataset as JSON or CSV, with the same provenance shown on the site.

---

## What it is — and what it is not

It tracks **policy instruments and official framing**: the export controls, licensing regimes, critical-mineral designations, supply-chain-security laws, funding, stockpiling and offtake measures governments use around rare earths and adjacent strategic materials — translated, structured, and citable.

It does **not** model the global minerals market. It does not forecast prices, estimate reserves or tonnages, or rank countries by a supply-risk number. Where market-share figures appear (for example, that China processes roughly 90% of rare earths), they are cited context drawn from bodies such as the IEA and USGS — not original estimates. That boundary is the credibility shield, and it is stated plainly on the [methodology page](https://strategic-materials-policy-tracker.vercel.app/methodology).

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

- **Actors:** China, the United States, the EU, Australia, Japan and Canada.
- **Materials:** a rare-earth-centred set of strategic materials and their downstream sectors.
- **Time:** events from April 2025 forward, with a few foundational instruments included for context.

Coverage is deepest on the Chinese measures, read from Mandarin primaries. See the [methodology version history](https://strategic-materials-policy-tracker.vercel.app/methodology#versions) for the per-release changelog.

## Data model

Five entities, fully typed in [`lib/types.ts`](lib/types.ts):

- **PolicyEvent** — a policy measure, carrying a jurisdiction, mechanism(s), affected materials and sectors, status, document number and source IDs.
- **FramingClaim** — an official framing label anchored to a required quoted passage (`quoteOriginal` + `quoteEn` + provenance) and a resolving source.
- **Material** — a tracked material, its position in Chinese policy, downstream industries and diversification efforts.
- **Jurisdiction** — an actor profile: supply-chain role, key bodies and framing posture.
- **Source** — the source register, graded by a four-tier confidence hierarchy.

The categorical label sets are the single source of truth: the union types are derived from `as const` arrays, and the validator imports the same arrays, so the schema and the checks cannot drift apart.

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
  timeline/  sources/  methodology/  data/  about/
  api/export/        force-static CSV / JSON download handlers
components/          UI primitives and domain components
lib/                 types, data loaders, labels, formatting, export, site config
data/seed/           events / framing / materials / jurisdictions / sources JSON
scripts/             validate-data.ts
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
npm run build      # production build + prerender
```

## Status

**Current release: `v0.3-framing`.** A multi-actor seed dataset across the six tracked actors, with the comparative framing matrix and source register in place, a passing data validator, and full JSON/CSV export. Coverage is deepest on the Chinese measures, read directly from Mandarin primaries. The full per-release changelog lives in the [methodology version history](https://strategic-materials-policy-tracker.vercel.app/methodology#versions).

## Roadmap & known gaps

- Transcribe the original-language titles / document numbers currently marked `null` or `"Not yet coded"` against the primaries, and add framing anchors where they are still pending.
- Dedicated event records for the 2023–2025 gallium, germanium, graphite, antimony and tungsten controls where they are currently only referenced in material notes.
- Deepen non-Chinese actor coverage as primary sources are verified.

## Usage & citation

The data is provided as-is for research and journalism. Categorical labels are interpretive judgements anchored to the cited sources, not legal determinations. Quotations are reproduced from the linked originals under fair use for commentary — please cite the original publisher as well as this database.

## Disclaimer

Not legal or compliance advice. Categorical labels are interpretive judgements anchored to the cited sources, not legal determinations. Do not rely on this for export-control classification or licensing decisions; consult the primary instruments and qualified counsel.

## Author / maintainer

Built and maintained by Benjamin Yang. The project's depth on Chinese measures comes from direct reading of Mandarin-language primary sources, paired with a multi-actor frame that tracks U.S., EU, Japanese, Australian, Canadian and Chinese policy instruments side by side. For questions about a classification, start from the source linked on each record, then see the [source register](https://strategic-materials-policy-tracker.vercel.app/sources).
