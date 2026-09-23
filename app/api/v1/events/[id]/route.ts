/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { getAllEvents, getEventById, getFramingByEvent, getSourcesByIds } from "@/lib/data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllEvents().map((e) => ({ id: e.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event)
    return new Response(JSON.stringify({ error: "not found", id }, null, 2), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  // The record plus everything needed to check it, so a consumer never has to
  // join three endpoints to see the evidence behind one claim.
  const body = { event, framing: getFramingByEvent(id), sources: getSourcesByIds(event.sourceIds) };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
