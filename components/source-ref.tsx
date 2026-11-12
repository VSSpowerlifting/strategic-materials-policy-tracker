import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExtLink } from "@/components/ui/ext-link";
import { ConfidenceBadge } from "@/components/labels";
import { sourceTypeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { Source } from "@/lib/types";

export function SourceCard({
  source, showDossierLink = true, compact = false,
}: { source: Source; showDossierLink?: boolean; compact?: boolean }) {
  if (compact) {
    // Register row: identity, provenance and both links on two or three lines. Notes and the raw URL live on the dossier.
    return (
      <div id={source.id} className="min-w-0 scroll-mt-24 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <h3 className="min-w-0 flex-1 font-display text-base font-semibold leading-snug [overflow-wrap:anywhere]">
            <Link
              href={`/sources/${source.id}`}
              className="hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {source.title}
            </Link>
          </h3>
          <ExtLink href={source.url} className="shrink-0 font-display text-sm">
            Original<span className="sr-only"> document: {source.title}</span>
          </ExtLink>
        </div>
        {/* Inline text, not flex: each item keeps its trailing separator, so a wrapped line never starts with a dot. */}
        <p className="mt-1 font-display text-xs leading-5 text-muted">
          {[
            <span key="p" className="text-foreground">{source.publisher}</span>,
            sourceTypeLabels[source.sourceType],
            <span key="l" className="uppercase">{source.language}</span>,
            source.datePublished ? `Published ${formatDate(source.datePublished)}` : "Publication date unknown",
            `Accessed ${formatDate(source.dateAccessed)}`,
          ].map((item, i, all) => (
            <span key={i}>
              <span className={i === 0 ? undefined : "whitespace-nowrap"}>
                {item}
                {i < all.length - 1 ? <span aria-hidden className="text-faint"> ·</span> : null}
              </span>{" "}
            </span>
          ))}
        </p>
      </div>
    );
  }
  return (
    <div id={source.id} className="min-w-0 scroll-mt-24 border border-border bg-plate p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 font-display text-lg font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]">
          {source.title}
        </h3>
        <ConfidenceBadge confidence={source.confidence} />
      </div>
      <p className="mt-2 font-display text-sm text-muted">{source.publisher}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs leading-5 text-muted">
        <Badge>{sourceTypeLabels[source.sourceType]}</Badge>
        <span className="font-display uppercase">{source.language}</span>
        {source.datePublished ? (
          <span>Published {formatDate(source.datePublished)}</span>
        ) : null}
        <span>Accessed {formatDate(source.dateAccessed)}</span>
      </div>
      {source.notes ? (
        <p className="mt-3 max-w-prose text-[0.9375rem] leading-7 text-muted [overflow-wrap:anywhere]">{source.notes}</p>
      ) : null}
      <div className="mt-4 border-t border-border pt-3">
        <ExtLink href={source.url} className="inline-flex min-h-10 items-center font-display text-sm font-medium">
          Open original document
        </ExtLink>
        <p className="mt-1 max-w-full break-all font-mono text-xs leading-5 text-faint">{source.url}</p>
      </div>
      {showDossierLink ? (
        <Link href={`/sources/${source.id}`} className="mt-2 inline-flex min-h-10 items-center font-display text-sm font-medium text-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          View citing records
        </Link>
      ) : null}
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
