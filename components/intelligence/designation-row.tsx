/** One project designation as a list row: the scheme, the project, the holders and the current status. */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getEventById, getProgrammeById, getProjectById } from "@/lib/data";
import { designationStatusLabels, supplyChainStageLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { ProjectDesignation } from "@/lib/types";

export function DesignationRow({ d, showProject = false }: { d: ProjectDesignation; showProject?: boolean }) {
  const cur = d.statusHistory[d.statusHistory.length - 1];
  const programme = getProgrammeById(d.programmeId);
  const project = getProjectById(d.projectId);
  const event = getEventById(d.eventId);
  return (
    <div className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:gap-4">
      <div className="sm:w-32 sm:shrink-0">
        <Badge accent={cur?.status === "recognized"}>{cur ? designationStatusLabels[cur.status] : "—"}</Badge>
        <p className="tnum mt-1 font-mono text-[11px] text-faint">{cur?.date ? formatDate(cur.date) : "Date not stated"}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold leading-snug">
          {showProject && project ? (
            <Link href={`/projects/${project.id}`} className="hover:text-accent">{d.projectNameAsStated}</Link>
          ) : (
            d.projectNameAsStated
          )}
        </p>
        <p className="text-sm text-muted">
          {programme ? <Link href={`/programmes/${programme.id}`} className="hover:text-accent">{programme.name}</Link> : d.programmeId}
          {event ? <> · <Link href={`/events/${event.id}`} className="hover:text-accent">{event.documentNumber ?? event.titleEn}</Link></> : null}
        </p>
        <p className="mt-1 font-mono text-[11px] text-faint">
          {d.locations.map((l) => l.countryCode).filter(Boolean).join(", ")}
          {d.stages.length ? ` · ${d.stages.map((s) => supplyChainStageLabels[s]).join(" · ")}` : ""}
        </p>
      </div>
    </div>
  );
}
