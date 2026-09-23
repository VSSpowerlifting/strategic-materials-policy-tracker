/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { childLinks, evidenceSourceIds } from "@/lib/capital-control";
import { getAllFinancialCommitments, getEventById, getFinancialCommitmentById, getSourcesByIds } from "@/lib/data";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllFinancialCommitments().map((c) => ({ id: c.id }));
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const commitment = getFinancialCommitmentById(id);
  if (!commitment) return json({ error: "not found", id }, 404);
  const event = getEventById(commitment.eventId)!;
  // The row plus everything needed to check it and place it in its family.
  return json({
    commitment,
    event: { id: event.id, date: event.date, jurisdiction: event.jurisdiction, titleEn: event.titleEn },
    parents: commitment.relationships.map((r) => ({ ...r, commitment: getFinancialCommitmentById(r.commitmentId) ?? null })),
    children: childLinks(id).map(({ commitment: c, relationship }) => ({ id: c.id, relationship })),
    sources: getSourcesByIds(evidenceSourceIds(commitment)),
  });
}
