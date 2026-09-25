/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { evidenceSourceIds } from "@/lib/capital-control";
import { getAllProjectDesignations, getEventById, getProjectDesignationById, getSourcesByIds } from "@/lib/data";

export const dynamic = "force-static";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export function generateStaticParams() {
  return getAllProjectDesignations().map((d) => ({ id: d.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const designation = getProjectDesignationById(id);
  if (!designation) return json({ error: "not found", id }, 404);
  const event = getEventById(designation.eventId)!;
  return json({
    designation,
    event: { id: event.id, date: event.date, jurisdiction: event.jurisdiction, titleEn: event.titleEn },
    sources: getSourcesByIds(evidenceSourceIds(designation)),
  });
}
