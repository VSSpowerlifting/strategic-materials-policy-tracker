/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { getAllJurisdictions } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(getAllJurisdictions(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
