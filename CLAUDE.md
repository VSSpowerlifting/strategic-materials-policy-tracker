@AGENTS.md

# Ruflo + Headroom integration — project governance

This repo has **Ruflo** (agent orchestration) and **Headroom** (context compression)
installed as **project-local** MCP servers (see `.mcp.json`). Project-specific custom
agents live in `.claude/agents/`. The data rules already in `AGENTS.md` and the working
notes below still apply in full; this section governs how the AI tooling may be used.

## Project purpose

The Strategic Materials Policy Tracker is a source-linked English database tracking
government policy instruments affecting rare earths and adjacent strategic materials.
It is **not** a commodity-price model, an investment-recommendation service, a general
news aggregator, or a home for unsupported geopolitical speculation.

## Headroom compression boundary (critical)

Headroom/Ruflo may compress or summarize terminal output, build/lint logs, repetitive
JSON, repository maps, and search results. Compressed summaries are **never authoritative**
for: legal or regulatory language, Chinese-language source text, quotations or translations,
URLs, dates, issuing authorities, implementation status, material scope, final
classifications, or final analytical claims. For any of those, retrieve and read the
**complete original source** before concluding.

## Source rules

- Prefer official legal, regulatory, ministerial, parliamentary, agency, or government
  sources. Secondary reporting may identify a candidate measure but must not replace an
  available official source.
- Never invent URLs, quotations, dates, issuing authorities, material coverage, legal
  effects, or implementation status.
- Distinguish proposals, consultations, announcements, adopted measures, enacted laws,
  and implemented measures. Every factual field must be traceable to its source.
- Retrieve the complete original source before verifying authoritative fields. Ambiguous
  records and classifications require human review.

## Methodology rules

- Preserve the existing taxonomy (the `as const` label arrays in `lib/types.ts`) unless
  the maintainer explicitly approves a change. Do not create a category to fit one record.
- Do not infer legal effect beyond the official text; keep political framing separate from
  operative legal language.
- Preserve distinctions among jurisdiction, issuing authority, instrument, material scope,
  announcement date, and implementation date.
- Headroom-compressed context must not replace direct review of authoritative source material.

## Repository safety

- Never deploy, publish, push, merge, or commit without explicit maintainer approval.
- Never modify factual records during an audit-only task; never delete records without approval.
- Do integration work only on the `ruflo-headroom-integration` branch.
- Run `npm run validate`, `npm run lint`, `npm run typecheck`, and `npm run build` after changes.
- AI-generated research and classifications remain **drafts** until human approval.
- Draft/candidate records live in `data/candidates/` (private, git-ignored) and are
  isolated from all public output. Add/review/reject/**promote** them via the workflow in
  `data/candidates/README.md`; `npm run validate` enforces the rules and the leak checks.
  Never publish a candidate by editing `data/seed/*` without the human-gated promotion step.

# Strategic Materials Policy Tracker — working notes

A source-linked database of how China, the US, the EU and allied states contest
rare earths and strategic materials through **policy instruments and official
framing**. Not a market model — no market prices, reserve or tonnage estimates,
supply-risk numbers or projections. The one exception is a term of a policy
instrument that a government states or a binding filing sets out (a price floor
in an agreement, a tax-offset rate, a capacity covenant), recorded only when
precisely sourced. Read `README.md` and `/methodology` for the full framing.

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
6. **Capital & Control (v0.5).** `FinancialCommitment` (`fin-*`) and
   `ControlMeasure` (`ctl-*`) are child rows of an event; `fc-` stays with framing
   claims and `cand-` with candidates. Amounts are decimal strings in the source's
   original currency, with `amountAsStated` — never JS numbers, never converted.
   Never add unlike instruments or value roles together, never count a
   commitment together with one it is `part_of` or `drawn_from` (typed
   `relationships`; one commitment can hold both), and never present private
   capital or total project cost as public support. Statuses are source-linked
   histories (the last entry is current), every field's source goes in
   `evidence`, and one control row covers one clause. `unit` stays free text as
   the source gives it until repeated real values show a stable set. A binding
   securities filing or a recipient's official disclosure may support contract,
   financing, capacity or implementation facts it states directly — never
   government rationale or framing, an unstated government status, speculative
   valuations, market-price estimates or unsupported projections — and stays
   attributed to its speaker in `evidence` and `statedBy`. No synthetic
   economic-security score. `npm run validate` checks both seed files at
   runtime (`scripts/validate-capital-control.ts`, which also holds the shared
   field-to-evidence map): keep records sorted by id; write figures as canonical
   decimal strings ("1250000", not "1,250,000" or 1250000); use uppercase ISO-format
   currency and country codes; give real dates, with each history's dated entries
   oldest first; name only materials the event lists; keep `stageAllocation`,
   `materialAttribution` and `targetScopes` consistent with what is recorded;
   and cite in `evidence` the source of every populated field group, including
   each term's, outcome's, relationship's and status entry's own source.

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
- `data/seed/*.json` — events, framing, materials, jurisdictions, sources,
  watchlist, and (v0.5, empty until backfilled) financial-commitments and
  control-measures.
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

## Token-efficient navigation (Graphify)

- Start each session by reading `PROJECT_STATE.md` if it exists.
- For architecture, file locations, data flow, validation flow, routes, or
  components questions ("where should I edit?"), read `graphify-out/GRAPH_REPORT.md`
  before broad search.
- Order of operations: Graphify report first, targeted `rg` second, direct file
  reads third.
- Do not re-audit the whole repo unless explicitly asked.
- Do not open large files unless Graphify or targeted search identifies them as
  relevant.
- Summarize large outputs instead of pasting them back.
- Use Ruflo only when role separation genuinely helps (research, source
  verification, policy classification, methodology review, editorial skepticism,
  publishing QA, longitudinal comparison, claim-to-source traceability). Not for
  simple coding edits, one-file fixes, nav changes, README edits, formatting, or
  routine build errors.
- Use Headroom only for long logs, repetitive JSON, large search/validation
  output, or Ruflo multi-agent context. Headroom summaries are never authoritative
  for source text, dates, URLs, legal language, or classifications (see above).
- After major architecture or file-structure changes, run `graphify update .` to
  refresh the graph (no API cost with `--code-only`).
- After meaningful work, update `PROJECT_STATE.md`.
- Prefer small, focused changes over large rewrites.
- Do not push, merge, publish, deploy, or sync without explicit permission.
