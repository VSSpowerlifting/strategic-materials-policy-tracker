import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  confidenceLabels,
  enSourceLabels,
  FRAMING_HUES,
  framingCategoryLabels,
  framingCategoryShort,
  jurisdictionLabels,
  jurisdictionShort,
  mechanismLabels,
  policyStatusLabels,
  sectorLabels,
} from "@/lib/labels";
import type {
  EnSource,
  FramingCategory,
  JurisdictionCode,
  Mechanism,
  PolicyStatus,
  Sector,
  SourceConfidence,
} from "@/lib/types";

/** One tone per policy status: in effect, paused or pending, ended, or unstated. Shared with the event row's edge. */
export const POLICY_STATUS_TONE: Record<PolicyStatus, BadgeTone> = {
  active: "accent",
  in_force: "accent",
  suspended: "ochre",
  proposed: "ochre",
  superseded: "negative",
  ended: "negative",
  unclear: "neutral",
};

export function StatusBadge({ status }: { status: PolicyStatus }) {
  return <Badge tone={POLICY_STATUS_TONE[status]}>{policyStatusLabels[status]}</Badge>;
}

export function MechanismBadges({ mechanisms }: { mechanisms: Mechanism[] }) {
  return (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
      {mechanisms.map((m) => (
        <Badge key={m}>{mechanismLabels[m]}</Badge>
      ))}
    </span>
  );
}

export function SectorBadges({ sectors }: { sectors: Sector[] }) {
  return (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
      {sectors.map((s) => (
        <Badge key={s}>{sectorLabels[s]}</Badge>
      ))}
    </span>
  );
}

/**
 * The framing-category dimension — the one place categorical colour is kept, as a
 * small squared marker beside a quiet label. It reads as a legend, not a chip.
 */
export function FramingBadge({
  category,
  short = false,
  linked = false,
}: {
  category: FramingCategory;
  short?: boolean;
  /** Link to the category's section on /framing. Never use inside another link. */
  linked?: boolean;
}) {
  const body = (
    <>
      <span
        aria-hidden
        className="h-3 w-[5px] shrink-0"
        style={{ background: FRAMING_HUES[category] }}
      />
      {short ? framingCategoryShort[category] : framingCategoryLabels[category]}
    </>
  );
  const className =
    "inline-flex items-center gap-1.5 font-display text-xs leading-none text-muted";
  if (linked) {
    return (
      <Link
        href={`/framing#${category}`}
        title={`${framingCategoryLabels[category]} — see the framing catalogue`}
        // Vertical padding lifts the hit area to 24px; the equal negative margin keeps layout unchanged.
        className={`${className} -my-1.5 py-1.5 hover:text-accent`}
      >
        {body}
      </Link>
    );
  }
  return <span className={className}>{body}</span>;
}

export function FramingBadges({
  categories,
  short = true,
  linked = false,
}: {
  categories: FramingCategory[];
  short?: boolean;
  linked?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1.5">
      {categories.map((c) => (
        <FramingBadge key={c} category={c} short={short} linked={linked} />
      ))}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: SourceConfidence }) {
  return <Badge>{confidenceLabels[confidence]}</Badge>;
}

export function EnSourceTag({ source }: { source: EnSource }) {
  if (source === "na") return null;
  return (
    <span className="text-xs text-faint">
      Translation: {enSourceLabels[source].toLowerCase()}
    </span>
  );
}

/** Small CN/US/EU chip with optional full name. Not a link (compose with Link). */
export function JurisdictionTag({
  code,
  withName = false,
}: {
  code: JurisdictionCode;
  withName?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center border border-border-strong bg-plate px-1 font-display text-xs font-semibold text-foreground">
        {jurisdictionShort[code]}
      </span>
      {withName ? <span className="font-display text-sm">{jurisdictionLabels[code]}</span> : null}
    </span>
  );
}
