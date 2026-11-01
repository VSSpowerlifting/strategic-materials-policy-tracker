/**
 * Public-only, immutable original-source industrial milestone register.
 * Does not include unsigned M3 review queues, private reviewer receipts,
 * legacy finance-row physical status or the unreleased /pathways casefiles.
 */
import { getAllProjectMilestones } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(getAllProjectMilestones(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
