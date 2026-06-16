@AGENTS.md

# Strategic Materials Policy Tracker — working notes

A source-linked database of how China, the US, the EU and allied states contest
rare earths and strategic materials through **policy instruments and official
framing**. Not a market model — no prices, tonnages, reserves or supply-risk
numbers. Read `README.md` and `/methodology` for the full framing.

## The hard rules (do not break these when editing data)

1. **No synthetic risk scores.** Categorical, source-grounded labels only.
2. **No framing label without a quoted anchor.** Every `FramingClaim` needs a
   non-empty `quoteOriginal` (original language), `quoteEn`, a `quoteEnSource`
   provenance, and a `sourceId` that resolves to the document the quote came from.
3. **Translation provenance is explicit.** `official` (issuing govt's English),
   `self` (non-official / third-party), or `na` (already English). Quote short
   passages only; keep the original; link it.
4. **Bounded scope.** Actors: China, US, EU, Australia, Japan, Canada. Materials:
   the rare-earth-centred set already in `data/seed/materials.json`. Events from
   April 2025 forward (plus a few foundational instruments). Don't let it sprawl.
5. **Never invent data.** Unknown → `null` or `"Not yet coded"`. Verify document
   numbers, dates and titles against the primary before coding them.

## Architecture

- `lib/types.ts` — entities + the categorical label sets as `as const` arrays.
  **These arrays are the single source of truth**: union types derive from them and
  `scripts/validate-data.ts` imports them. Add a new label here first.
- `lib/data.ts` — read-only loaders over the seed JSON. Pages call these; they
  never mutate.
- `lib/labels.ts` — display strings + muted badge "tones" per label.
- `lib/export.ts` — deterministic JSON/CSV builders (no wall-clock reads, so the
  export route handlers can be `force-static`).
- `lib/site.ts` — name, nav, version, last-updated, scope.
- `data/seed/*.json` — events, framing, materials, jurisdictions, sources.
- `components/` — UI primitives (`ui/`) and domain components. `FramingQuote` is
  the signature element; `EventsExplorer` / `TimelineView` are the client filters.

## Conventions

- This is **Next.js 16** — `params`/`searchParams` are `Promise`s; `await` them.
  Read the bundled guides in `node_modules/next/dist/docs/` before using an
  unfamiliar API (see `AGENTS.md`).
- Tailwind **v4**: theme tokens live in `app/globals.css` (`@theme inline` +
  `:root`). Dark-first, no toggle. Use `bg-card`, `text-muted`, `border-border`,
  `text-accent`, etc.
- Dynamic routes need `generateStaticParams`. Actor URLs use the lowercase 2-letter
  `code` (`/actors/cn`); events use `id`; materials use `slug`.
- Dates: use `formatDate` from `lib/format.ts` (deterministic, no locale drift).

## Commands

```bash
npm run dev        # dev server
npm run validate   # MUST pass after any data edit
npm run typecheck
npm run build
```

After any change to `data/seed/*`, run `npm run validate` — it gates referential
integrity, allowed-value membership, quote anchors and translation provenance.

## What still needs building (v1 roadmap)

- Event records for Australia (Lynas / Iluka), Japan (JOGMEC) and Canada so all six
  actors are event-coded, not just profiled.
- Transcribe the original-language titles / document numbers currently marked
  `"Not yet coded"` against the primaries, and add framing anchors for the April and
  November Chinese measures.
- Dedicated event records for the 2023–2025 gallium, germanium, graphite, antimony
  and tungsten controls (currently only referenced in material notes).
