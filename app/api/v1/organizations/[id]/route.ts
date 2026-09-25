/**
 * Versioned read-only JSON API. Prerendered: the corpus is a static seed, so
 * every endpoint is a build artifact rather than a live query. `/api/v1` is a
 * stable contract — add fields, never repurpose them.
 */
import { childOrganizations, organizationRoles } from "@/lib/capital-intelligence";
import { evidenceSourceIds } from "@/lib/capital-control";
import { getAllOrganizations, getOrganizationById, getSourcesByIds } from "@/lib/data";

export const dynamic = "force-static";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=3600" },
  });

export function generateStaticParams() {
  return getAllOrganizations().map((o) => ({ id: o.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organization = getOrganizationById(id);
  if (!organization) return json({ error: "not found", id }, 404);
  const roles = organizationRoles(id);
  // Ids only: money is read from the rows under the counting rules, never totalled here.
  return json({
    organization,
    rolledUpOrganizationIds: roles.rolledUpIds,
    providedRowIds: roles.provided.map((c) => c.id),
    receivedRowIds: roles.received.map((c) => c.id),
    sponsoredProjectIds: roles.sponsoredProjects.map((p) => p.id),
    administeredProgrammeIds: roles.administeredProgrammes.map((g) => g.id),
    heldDesignationIds: roles.heldDesignations.map((d) => d.id),
    children: childOrganizations(id).map(({ organization: o, relationship }) => ({ id: o.id, relationship })),
    sources: getSourcesByIds(evidenceSourceIds(organization)),
  });
}
