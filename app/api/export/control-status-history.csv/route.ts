import { controlStatusHistoryCsv } from "@/lib/export";

export const dynamic = "force-static";

export function GET() {
  return new Response("﻿" + controlStatusHistoryCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt-control-status-history.csv"',
    },
  });
}
