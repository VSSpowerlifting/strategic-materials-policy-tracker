/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { projectStack } from "@/lib/capital-intelligence";
import { evidenceSourceIds } from "@/lib/capital-control";
import { getAllProjects, getSourcesByIds } from "@/lib/data";

export const dynamic = "force-static";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ id: p.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stack = projectStack(id);
  if (!stack) return json({ error: "not found", id }, 404);
  // The capital stack as layers of one value role each; only committed money carries totals.
  return json({
    project: stack.project,
    governments: stack.governments,
    providerOrgIds: stack.providerOrgIds,
    layers: stack.layers.map((l) => ({ layer: l.key, rowIds: l.rows.map((c) => c.id), totals: l.totals })),
    designationIds: stack.designations.map((d) => d.id),
    latestImplementation: stack.latestImplementation,
    sources: getSourcesByIds(evidenceSourceIds(stack.project)),
  });
}
