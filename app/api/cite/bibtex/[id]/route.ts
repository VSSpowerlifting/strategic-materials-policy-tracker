import { getAllEvents, getEventById } from "@/lib/data";
import { buildBibtexForEvent } from "@/lib/citation";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllEvents().map((e) => ({ id: e.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return new Response("not found", { status: 404 });
  return new Response(buildBibtexForEvent(event), {
    headers: {
      "content-type": "application/x-bibtex; charset=utf-8",
      "content-disposition": `attachment; filename="${id}.bib"`,
    },
  });
}
