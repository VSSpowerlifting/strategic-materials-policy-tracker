/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 *
 * Recorded exceptions (corrections, see PROJECT_STATE.md, v0.6 counting decisions): portfolio counts, co-investment, project governments, flows and the response map (ended rows and options are listed under their own fields, not counted as capital); and portfolio `counts.byStage` and `counts.byMaterial`, now counted per cell (Australia's `byStage.stockpiling` 0 to 1).
 */
import { buildCapitalIntelligenceSummary } from "@/lib/capital-intelligence-summary";

export const dynamic = "force-static";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export function GET() {
  return json(buildCapitalIntelligenceSummary());
}
