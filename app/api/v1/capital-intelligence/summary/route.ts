/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 *
 * New in v0.6: this endpoint has no earlier release, so no released shape changed here. Its counting rules are
 * in `countingRules`. The released endpoint that changed shape is /api/v1/capital-control/summary; see its header.
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
