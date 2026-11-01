/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { projectStack } from "@/lib/capital-intelligence";
import { evidenceSourceIds } from "@/lib/capital-control";
import { getAllProjects, getProjectMilestonesByProject, getSourcesByIds } from "@/lib/data";

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
  // The capital stack remains its own lane; reviewing a primary-source statement
  // never establishes cash disbursement, operating output, or causal effect.
  const reviewedProjectMilestones = getProjectMilestonesByProject(id);
  const reviewedMilestoneSources = getSourcesByIds(
    [...new Set(reviewedProjectMilestones.map(m => m.sourceId))],
  );
  if (reviewedMilestoneSources.length !== new Set(reviewedProjectMilestones.map(m=>m.sourceId)).size)
    throw new Error("Public reviewed milestone has a missing registered source");
  return json({
    project: stack.project,
    governments: stack.governments,
    providerOrgIds: stack.providerOrgIds,
    layers: stack.layers.map((l) => ({ layer: l.key, rowIds: l.rows.map((c) => c.id), totals: l.totals })),
    associatedRowIds: stack.associatedRows.map((c) => c.id),
    designationIds: stack.designations.map((d) => d.id),
    latestImplementation: stack.latestImplementation,
    // Additive v1 fields: reviewed project-native evidence is distinct from
    // financing-row implementation histories and the project's base citations.
    reviewedProjectMilestones,
    reviewedMilestoneSources,
    reviewedMilestoneEvidenceBasis: "human-reviewed original publisher claim; not independent on-site or financial verification",
    sources: getSourcesByIds(evidenceSourceIds(stack.project)),
  });
}
