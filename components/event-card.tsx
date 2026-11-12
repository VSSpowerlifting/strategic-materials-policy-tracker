import Link from "next/link";
import {
  FramingBadges,
  JurisdictionTag,
  MechanismBadges,
  StatusBadge,
} from "@/components/labels";
import { POLICY_STATUS_TONE } from "@/components/labels";
import type { BadgeTone } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { FramingCategory, PolicyEvent } from "@/lib/types";

const STRIP: Record<BadgeTone, string> = {
  accent: "bg-accent",
  ochre: "bg-ochre",
  negative: "bg-negative",
  neutral: "bg-border-strong",
};

/**
 * Dense, full-width row used in the events index and on profile pages.
 * `framingCategories` is opt-in: undefined renders no framing row at all
 * (profile pages that don't load framing), while an empty array states
 * "not yet coded" — the official framing exists, we just haven't anchored
 * it to a verified quote yet.
 */
export function EventListItem({
  event,
  framingCategories,
}: {
  event: PolicyEvent;
  framingCategories?: FramingCategory[];
}) {
  return (
    <Link
      data-site-motion="card"
      href={`/events/${event.id}`}
      className="group flex border-b transition-colors last:border-b-0 hover:bg-elevated"
    >
      {/* Status edge: the same tone as the status label on the right. */}
      <span
        aria-hidden
        className={`w-[3px] shrink-0 self-stretch ${STRIP[POLICY_STATUS_TONE[event.policyStatus]]}`}
      />
      <div className="flex flex-1 flex-col gap-2 px-4 py-4 sm:flex-row sm:items-stretch sm:gap-0">
        {/* Metadata gutter — fixed dossier register: when & who */}
        <div className="flex items-center gap-2 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1.5 sm:border-r sm:border-border sm:pr-4">
          <time className="tnum font-display text-xs text-faint">{formatDate(event.date)}</time>
          <JurisdictionTag code={event.jurisdiction} />
        </div>
        {/* Record body — what & current standing */}
        <div className="min-w-0 flex-1 sm:pl-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-pretty font-display font-semibold leading-snug text-foreground group-hover:text-accent">
              {event.titleEn}
            </h3>
            <StatusBadge status={event.policyStatus} />
          </div>
          <div className="mt-1.5">
            <MechanismBadges mechanisms={event.mechanism} />
          </div>
          {framingCategories ? (
            <div className="mt-2">
              {framingCategories.length > 0 ? (
                <FramingBadges categories={framingCategories} />
              ) : (
                <span className="font-display text-xs leading-none text-faint">
                  Official framing not yet coded
                </span>
              )}
            </div>
          ) : null}
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
      <time className="tnum w-24 shrink-0 font-display text-xs text-faint">
        {formatDate(event.date)}
      </time>
      <JurisdictionTag code={event.jurisdiction} />
      <span className="text-pretty font-display text-sm text-muted group-hover:text-accent">
        {event.titleEn}
      </span>
    </Link>
  );
}
