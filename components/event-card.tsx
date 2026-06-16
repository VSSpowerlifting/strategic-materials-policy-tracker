import Link from "next/link";
import { JurisdictionTag, MechanismBadges, StatusBadge } from "@/components/labels";
import { formatDate } from "@/lib/format";
import type { PolicyEvent } from "@/lib/types";

/** Dense, full-width row used in the events index and on profile pages. */
export function EventListItem({ event }: { event: PolicyEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-elevated"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
        <div className="flex items-center gap-2 sm:w-44 sm:shrink-0">
          <time className="tnum font-mono text-xs text-faint">
            {formatDate(event.date)}
          </time>
          <JurisdictionTag code={event.jurisdiction} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-pretty font-medium leading-snug text-foreground group-hover:text-accent">
              {event.titleEn}
            </h3>
            <StatusBadge status={event.policyStatus} />
          </div>
          <div className="mt-2">
            <MechanismBadges mechanisms={event.mechanism} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Compact one-line reference used for "related events". */
export function EventLine({ event }: { event: PolicyEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex items-baseline gap-3 py-2"
    >
      <time className="tnum w-24 shrink-0 font-mono text-xs text-faint">
        {formatDate(event.date)}
      </time>
      <JurisdictionTag code={event.jurisdiction} />
      <span className="text-pretty text-sm text-muted group-hover:text-accent">
        {event.titleEn}
      </span>
    </Link>
  );
}
