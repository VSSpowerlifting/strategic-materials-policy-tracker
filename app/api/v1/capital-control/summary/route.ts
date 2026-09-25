/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 *
 * This is the one released endpoint whose shape changed in v0.6, a recorded correction to the rule above
 * (see PROJECT_STATE.md, "v0.6 API changes"). v0.5 added grants, loans and equity together, against its own
 * counting rule, so the currency-level sums moved into one entry per instrument:
 *
 *   removed  capital.publicCommitmentTotals[].byQualifier, .binding, .notYetBinding
 *   now at   capital.publicCommitmentTotals[].instruments[].byQualifier, .binding, .notYetBinding
 *
 * Each instruments[] entry is { instrument, countedIds, summed, ... }. An "unspecified" or "mixed" instrument
 * has summed: false, a reason, and null sums: its rows are listed with their own figures, never added.
 * Added beside them: capital.publicCommitmentsStatusNotStated, capital.publicCommitmentsEnded,
 * capital.indicationsListedNotSummed and capital.fundingOptionsListedNotSummed[].exercisesEnded.
 * The same summary is embedded in /api/export/dataset.json as capitalControlSummary, with the same change.
 * /api/v1/capital-intelligence/summary is a different endpoint, new in v0.6; it breaks no released shape.
 */
import { buildCapitalControlSummary } from "@/lib/capital-control-summary";

export const dynamic = "force-static";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export function GET() {
  return json(buildCapitalControlSummary());
}
