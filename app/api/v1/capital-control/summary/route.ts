/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 *
 * Recorded exceptions (corrections, see PROJECT_STATE.md, v0.6 counting decisions): `publicCommitmentTotals` (per instrument; a status-not-stated row and an ended row are listed apart, never summed).
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
