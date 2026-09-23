/**
 * Whole-corpus citation export. See lib/citation.ts for why the record and the
 * primary document are cited separately.
 */
import { buildRisAll } from "@/lib/citation";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildRisAll(), {
    headers: {
      "content-type": "application/x-research-info-systems; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt.ris"',
    },
  });
}
