/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { evidenceSourceIds } from "@/lib/capital-control";
import { getAllControlMeasures, getControlMeasureById, getEventById, getSourcesByIds } from "@/lib/data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllControlMeasures().map((m) => ({ id: m.id }));
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const measure = getControlMeasureById(id);
  if (!measure) return json({ error: "not found", id }, 404);
  const event = getEventById(measure.eventId)!;
  return json({
    measure,
    event: { id: event.id, date: event.date, jurisdiction: event.jurisdiction, titleEn: event.titleEn, documentNumber: event.documentNumber ?? null },
    modifiedBy: getAllControlMeasures().filter((m) => m.modifiesMeasureIds.includes(id)).map((m) => m.id),
    sources: getSourcesByIds(evidenceSourceIds(measure)),
  });
}
