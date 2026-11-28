import { controlBriefCases } from "@/lib/control-brief-cases";
import { buildControlBrief, renderControlBrief } from "@/lib/control-briefs";

export async function GET(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const item = controlBriefCases.find((candidate) => candidate.slug === caseId);
  if (!item) return new Response("Brief not found.", { status: 404 });

  const query = new URL(request.url).searchParams;
  const readDate = (name: "from" | "to") => {
    const values = query.getAll(name);
    return values.length > 1 ? values : values[0];
  };
  const brief = buildControlBrief(item, { from: readDate("from"), to: readDate("to") });
  if (!brief.valid) return new Response("Invalid comparison dates.", { status: 400 });

  const filename = `stratellar-${item.slug}-${brief.dates.from}-to-${brief.dates.to}.txt`;
  return new Response(renderControlBrief(brief), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
