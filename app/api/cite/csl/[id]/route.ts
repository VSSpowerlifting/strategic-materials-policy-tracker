import { getAllEvents, getEventById } from "@/lib/data";
import { buildCslForEvent } from "@/lib/citation";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllEvents().map((e) => ({ id: e.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return new Response("not found", { status: 404 });
  return new Response(JSON.stringify(buildCslForEvent(event), null, 2), {
    headers: {
      "content-type": "application/vnd.citationstyles.csl+json; charset=utf-8",
      "content-disposition": `attachment; filename="${id}.json"`,
    },
  });
}
