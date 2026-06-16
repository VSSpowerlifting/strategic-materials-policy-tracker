import { Badge } from "@/components/ui/badge";
import { ExtLink } from "@/components/ui/ext-link";
import { ConfidenceBadge } from "@/components/labels";
import { sourceTypeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { Source } from "@/lib/types";

export function SourceCard({ source }: { source: Source }) {
  return (
    <div id={source.id} className="scroll-mt-24 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display font-semibold leading-snug tracking-tight">
          {source.title}
        </h3>
        <ConfidenceBadge confidence={source.confidence} />
      </div>
      <p className="mt-1 text-sm text-muted">{source.publisher}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-faint">
        <Badge tone="neutral">{sourceTypeLabels[source.sourceType]}</Badge>
        <span className="font-mono uppercase tracking-wide">{source.language}</span>
        {source.datePublished ? (
          <span>Published {formatDate(source.datePublished)}</span>
        ) : null}
        <span>Accessed {formatDate(source.dateAccessed)}</span>
      </div>
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

export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="grid gap-3">
      {sources.map((s) => (
        <SourceCard key={s.id} source={s} />
      ))}
    </div>
  );
}
