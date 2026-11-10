import { marketsCsv } from "@/lib/markets-csv";

export const dynamic = "force-static";

export function GET() {
  return new Response("﻿" + marketsCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt-markets.csv"',
    },
  });
}
