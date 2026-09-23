import { controlMeasuresCsv } from "@/lib/export";

export const dynamic = "force-static";

export function GET() {
  return new Response("﻿" + controlMeasuresCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt-control-measures.csv"',
    },
  });
}
