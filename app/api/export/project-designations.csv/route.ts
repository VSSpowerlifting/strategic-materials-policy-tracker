import { projectDesignationsCsv } from "@/lib/export";

export const dynamic = "force-static";

export function GET() {
  return new Response("﻿" + projectDesignationsCsv(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt-project-designations.csv"',
    },
  });
}
