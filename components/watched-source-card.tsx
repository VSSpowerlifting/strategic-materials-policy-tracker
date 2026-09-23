import { Badge } from "@/components/ui/badge";
import { ExtLink } from "@/components/ui/ext-link";
import { cadenceLabels, watchStatusLabels, mechanismLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { getMaterialsByIds } from "@/lib/data";
import type { WatchedSource } from "@/lib/types";

/**
 * One official source under standing review. Deliberately shaped like
 * `SourceCard` but never mistakable for it: a source card cites a document
 * behind a published record, this one describes a page the project has
 * undertaken to check. Nothing here asserts anything about the page's contents.
 */
export function WatchedSourceCard({ source }: { source: WatchedSource }) {
  const materials = getMaterialsByIds(source.materialIds);

  return (
    <div id={source.id} className="scroll-mt-24 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display font-semibold leading-snug tracking-tight">
          {source.title}
        </h3>
        <Badge accent={source.status === "active"}>{watchStatusLabels[source.status]}</Badge>
      </div>

      <p className="mt-1 text-sm text-muted">
        {source.issuingBody}
        {source.issuingBodyOriginal ? (
          <span className="ml-1.5 text-faint" lang="zh">
            {source.issuingBodyOriginal}
          </span>
        ) : null}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-faint">
        <Badge>Checked {cadenceLabels[source.cadence].toLowerCase()}</Badge>
        <span className="font-mono uppercase tracking-wide">{source.language}</span>
        {/* Freshness is stated only when the project can evidence it. A null
            date is reported as an absence of a published review cycle, never
            softened into "recently" or dressed up as up-to-date. */}
        {source.lastCheckedAt ? (
          <span>Last checked {formatDate(source.lastCheckedAt)}</span>
        ) : (
          <span>No published review cycle yet</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {source.mechanisms.map((m) => (
          <span key={m}>{mechanismLabels[m]}</span>
        ))}
      </div>

      <p className="mt-2 text-sm leading-6 text-faint">
        <span className="text-muted">Watched for:</span>{" "}
        {materials.map((m) => m.nameEn).join(", ")}
      </p>

      {source.notes ? (
        <p className="mt-2 text-sm leading-6 text-muted">{source.notes}</p>
      ) : null}

      <div className="mt-3">
        <ExtLink href={source.url} className="break-all text-sm">
          {source.url}
        </ExtLink>
      </div>
    </div>
  );
}
