/**
 * Whole-corpus citation export. See lib/citation.ts for why the record and the
 * primary document are cited separately.
 */
import { buildBibtexAll } from "@/lib/citation";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildBibtexAll(), {
    headers: {
      "content-type": "application/x-bibtex; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt.bib"',
    },
  });
}
