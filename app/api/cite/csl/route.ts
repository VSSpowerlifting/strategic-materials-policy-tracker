/**
 * Whole-corpus citation export. See lib/citation.ts for why the record and the
 * primary document are cited separately.
 */
import { buildCslAll } from "@/lib/citation";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(buildCslAll(), null, 2), {
    headers: {
      "content-type": "application/vnd.citationstyles.csl+json; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt-csl.json"',
    },
  });
}
