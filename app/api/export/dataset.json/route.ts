import { buildDataset } from "@/lib/export";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(buildDataset(), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="smpt-dataset.json"',
    },
  });
}
