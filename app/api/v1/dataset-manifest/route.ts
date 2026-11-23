/**
 * Dataset manifest: corpus identity, release and legal-status dates, coverage
 * limits, collection counts, entry points and join metadata. Prerendered and
 * independent of the full export and the financial summaries. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { buildDatasetManifest } from "@/lib/dataset-manifest";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(buildDatasetManifest(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
