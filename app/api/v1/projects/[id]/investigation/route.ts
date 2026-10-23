/** Additive static investigation resource; existing project API is unchanged. */
import { getAllProjects } from "@/lib/data";
import { getPublicProjectInvestigation } from "@/lib/research-experience";
export const dynamic = "force-static";
export function generateStaticParams() {
  return getAllProjects().map(p => ({ id: p.id }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const packet = getPublicProjectInvestigation(id)?.packet;
  if (!packet) return Response.json({ error: "not found", id }, { status: 404 });
  return new Response(JSON.stringify(packet, null, 2) + "\n", {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="smpt-${packet.projectId}-investigation.json"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
