# Strategic Materials Policy Tracker

A source-linked policy database tracking how China, the United States, the EU and
allied states contest rare earths and strategic materials through policy — export
controls, licensing, critical-mineral designations, funding and stockpiling — with
a comparative analysis of how each government frames its stance, in the original
language and with explicit translation provenance.

The project tracks **policy instruments and official framing**, translated and
structured. It is not a global minerals market model: it does not forecast prices
or supply, and does not compete with USGS, IEA or Benchmark on mining economics.
Where dependence figures appear (e.g. China processes roughly 90% of rare earths),
they are cited context, not original estimates. That boundary is the credibility
shield, and it is stated plainly on the methodology page.

The distinctive capability is depth on the Chinese side: the maintainer reads the
Mandarin-language primaries directly, so Chinese measures are tracked more closely
than English secondary reporting usually allows. The multi-actor frame keeps that
depth honest by following the whole contest — the incumbent and everyone trying to
diversify away from it.

## Hard rules

These rules are what protect the data, and they are enforced in code by
`scripts/validate-data.ts`:

1. **No synthetic risk scores.** Every classification is a categorical,
   source-grounded label. There is no 0–100 number anywhere in the model.
2. **Every framing classification is anchored to a quoted passage** in the
   original language, with a translation. A framing label without a quoted anchor
   is invalid data.
3. **Translation provenance is explicit.** Official English is preferred;
   self / third-party translations are marked; only short passages are quoted, with
   the original linked.
4. **Bounded scope.** A fixed actor set, a rare-earth-centred material set, and
   events from April 2025 forward (with a few foundational instruments for context).
5. **No invented data.** Unknown fields are `null` or `"Not yet coded"`, never a
   guess.

## Tech

- Next.js (App Router) · TypeScript · Tailwind CSS v4
- Local seed JSON for the MVP — no live APIs, no database, no auth, no scrapers
- CSV / JSON export via static route handlers
- Deploys to Vercel

## Data model

Five entities, fully typed in [`lib/types.ts`](lib/types.ts):

- **PolicyEvent** — a policy measure, carrying a jurisdiction, mechanism(s),
  affected materials and sectors, status, document number and source IDs.
- **FramingClaim** — an official framing label anchored to a required quoted
  passage (`quoteOriginal` + `quoteEn` + provenance) and a resolving source.
- **Material** — a tracked material, its position in Chinese policy, downstream
  industries and diversification efforts.
- **Jurisdiction** — an actor profile: supply-chain role, key bodies and framing
  posture.
- **Source** — the source register, graded by a four-tier confidence hierarchy.

The categorical label sets are the single source of truth: the union types are
derived from `as const` arrays, and the validator imports the same arrays, so the
schema and the checks cannot drift apart.

## Project structure

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

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # run the seed-data integrity checks
npm run typecheck  # tsc --noEmit
npm run build      # production build + prerender
```

## Data & validation

All data lives in `data/seed/*.json`. The validator (`npm run validate`) checks
that every event resolves to at least one source; that every framing claim carries
a non-empty `quoteOriginal`, `quoteEn` and a resolving source; that no material,
jurisdiction or superseded-event reference dangles; that identifiers are unique;
that every label falls within the allowed sets; and that translation provenance is
set on every translated field. It exits non-zero on any error, so it can gate CI.

To add a record, edit the relevant seed file and re-run `npm run validate`. Unknown
fields should be `null` or `"Not yet coded"`.

## Status

v0.2.0 — expanded multi-actor seed. Adds eight events so all six actors are now
event-coded: the US DoD–MP Materials partnership, Australia's Critical Minerals
Strategic Reserve, Japan's JOGMEC/JARE investment in Lynas, Canada's Investment
Canada Act divestiture order, and China's 2023–2025 gallium/germanium, graphite,
US-directed ban (Announcement No. 46) and tungsten controls — with framing anchors
for all but the graphite and tungsten measures (left uncoded pending a quoted
primary, the same discipline used for the April and November measures).

v0.1.0 — initial public foundation. Schema, typed loaders, a passing validator, and
a verified seed: China's April / October / November 2025 rare-earth measures, the US
2025 Critical Minerals List, and the EU Critical Raw Materials Act, with framing
anchors across China, the US and the EU. Some Chinese document numbers and
original-language titles are not yet transcribed against the primary and are marked
accordingly.

## Disclaimer

Not legal or compliance advice. Categorical labels are interpretive judgements
anchored to the cited sources, not legal determinations. Do not rely on this for
export-control classification or licensing decisions; consult the primary
instruments and qualified counsel.

## A note on the name

The working name reflects the multi-actor, policy-instrument scope — "policy"
rather than "control", since the project also tracks funding, stockpiling and
diversification. Alternatives under consideration: *Critical Materials Policy
Tracker*, *Rare Earth Policy Atlas*.
