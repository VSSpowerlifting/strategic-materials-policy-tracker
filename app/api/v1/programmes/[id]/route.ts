/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { programmeLedger } from "@/lib/capital-intelligence";
import { evidenceSourceIds } from "@/lib/capital-control";
import { getAllProgrammes, getSourcesByIds } from "@/lib/data";

export const dynamic = "force-static";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export function generateStaticParams() {
  return getAllProgrammes().map((g) => ({ id: g.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ledger = programmeLedger(id);
  if (!ledger) return json({ error: "not found", id }, 404);
  // Ceilings are listed beside recorded awards and never divided into them.
  return json({
    programme: ledger.programme,
    parentProgrammeId: ledger.parent?.id ?? null,
    childProgrammeIds: ledger.children.map((g) => g.id),
    envelopesListedNotSummed: ledger.envelopes.map((c) => ({ id: c.id, valueRole: c.valueRole, amount: c.amount })),
    recordedAwardTotals: ledger.recordedAwards?.totals ?? null,
    recordedAwardIds: ledger.recordedAwards?.rows.map((c) => c.id) ?? [],
    otherLayers: ledger.otherLayers.map((l) => ({ layer: l.key, rowIds: l.rows.map((c) => c.id), totals: l.totals })),
    designationIds: ledger.designations.map((d) => d.id),
    sources: getSourcesByIds(evidenceSourceIds(ledger.programme)),
  });
}
