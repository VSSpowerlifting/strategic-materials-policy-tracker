/**
 * Public rendering for genuinely human-reviewed project-native observations.
 *
 * A reviewed source claim is NOT an on-site verification, a finance payout,
 * an autonomous physical milestone promotion, or a public /pathways release.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExtLink } from "@/components/ui/ext-link";
import { getSourceById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { ProjectMilestone } from "@/lib/types";

const KIND_LABELS: Record<ProjectMilestone["kind"], string> = {
  feasibility_completed: "Feasibility completed (reported)",
  groundbreaking_reported: "Groundbreaking (reported)",
  construction_started: "Construction start (reported)",
  construction_progress_reported: "Construction progress (reported)",
  commissioning_started: "Commissioning start (reported)",
  operations_started: "Operations start (reported)",
  production_reported: "Production (reported)",
  operations_suspended: "Operations suspension (reported)",
  project_cancelled: "Project cancellation (reported)",
  funded_activity_completed: "Funded activity completed (reported)",
};

const SCOPE_LABELS: Record<ProjectMilestone["scope"], string> = {
  whole_project: "Entire project",
  named_facility: "Named facility",
  funded_activity: "Bounded funded activity",
  bounded_project_workstream: "Bounded project workstream",
};

/** No missing-event date is ever filled with a publisher or reviewer clock. */
export function ReviewedProjectMilestones({
  milestones,
}: {
  milestones: readonly ProjectMilestone[];
}) {
  return (
    <div className="space-y-4">
      <p className="max-w-prose text-sm leading-7 text-muted">
        These are claims checked against their original publisher documents and
        attributed to a human reviewer. Source review does not establish
        independent on-site verification, government-caused progress, a cash
        disbursement, or commercial output unless separately evidenced.
      </p>
      <ol className="space-y-4">
        {milestones.map(milestone => {
          const source = getSourceById(milestone.sourceId);
          if (!source) throw new Error("Published project milestone has an unregistered original source");
          return (
            <li key={milestone.id} className="min-w-0">
              <article aria-labelledby={"milestone-"+milestone.id}
                className="rounded-lg border border-border-strong bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Badge>{milestone.claimMode === "occurred" ? "Issuer-reported event" : "Proposed / planned"}</Badge>
                  <span className="font-mono text-xs text-faint">{SCOPE_LABELS[milestone.scope]}</span>
                </div>
                <h3 id={"milestone-"+milestone.id}
                  className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
                  {KIND_LABELS[milestone.kind]}
                </h3>
                {milestone.scopeAsStated ? (
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Scope as stated: {milestone.scopeAsStated}
                  </p>
                ) : null}
                <dl className="mt-4 grid gap-x-6 gap-y-3 border-y border-border py-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
                      {milestone.claimMode === "occurred" ? "Reported event date" : "Source-stated target date"}
                    </dt>
                    <dd className="mt-1 font-display text-foreground">
                      {milestone.claimMode === "occurred" && milestone.occurredOn ? (
                        <time dateTime={milestone.occurredOn}>{formatDate(milestone.occurredOn)}</time>
                      ) : milestone.claimMode === "planned" && milestone.targetOn ? (
                        <time dateTime={milestone.targetOn}>{formatDate(milestone.targetOn)}</time>
                      ) : "Exact date not established"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">Original source published</dt>
                    <dd className="mt-1 font-display text-foreground">
                      {source.datePublished ? <time dateTime={source.datePublished}>{formatDate(source.datePublished)}</time> : "Date not stated"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">Original publisher statement</dt>
                    <dd className="mt-2 border-l-2 border-border-strong pl-3 font-display leading-7 text-foreground/90">
                      <blockquote>{milestone.statementOriginal}</blockquote>
                      {milestone.statementEnSource !== "na" ? (
                        <p className="mt-2 text-sm text-muted">
                          English rendering ({milestone.statementEnSource === "official" ? "official translation" : "non-official translation"}):
                          {" "}{milestone.statementEn}
                        </p>
                      ) : null}
                    </dd>
                  </div>
                </dl>
                {milestone.note ? (
                  <p className="mt-4 max-w-prose text-sm leading-7 text-muted">
                    <span className="font-semibold text-foreground">Interpretive limit. </span>
                    {milestone.note}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <ExtLink href={source.url}>Original document — {source.publisher}</ExtLink>
                  <Link href={"/sources/"+source.id}
                    className="font-display text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    Source dossier
                  </Link>
                </div>
                <p className="mt-3 text-xs leading-6 text-muted">
                  Source pinpoint: {milestone.locator ?? "Not stated"}
                  <span className="mx-2 text-border-strong" aria-hidden="true">·</span>
                  Reviewed by {milestone.reviewedBy} on{" "}
                  <time dateTime={milestone.reviewedAt}>{formatDate(milestone.reviewedAt)}</time>
                </p>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
