import { Badge } from "@/components/ui/badge";
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

// Verdigris emphasis is reserved for measures currently in effect.
const STATUS_EMPHASIS = new Set<PolicyStatus>(["active", "in_force"]);

export function StatusBadge({ status }: { status: PolicyStatus }) {
  return (
    <Badge accent={STATUS_EMPHASIS.has(status)}>{policyStatusLabels[status]}</Badge>
  );
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
 * The framing-category dimension — the one place colour is kept, as a small
 * squared marker (Strata palette) beside a quiet mono label. Non-pill, so it
 * reads as a legend, not a CMW-style chip.
 */
export function FramingBadge({
  category,
  short = false,
}: {
  category: FramingCategory;
  short?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] leading-none text-muted">
      <span
        aria-hidden
        className="h-3 w-[5px] shrink-0 rounded-[1px]"
        style={{ background: FRAMING_HUES[category] }}
      />
      {short ? framingCategoryShort[category] : framingCategoryLabels[category]}
    </span>
  );
}

export function FramingBadges({
  categories,
  short = true,
}: {
  categories: FramingCategory[];
  short?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1.5">
      {categories.map((c) => (
        <FramingBadge key={c} category={c} short={short} />
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
    <span className="text-[11px] text-faint">
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
      <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded border border-accent/50 bg-elevated px-1 font-mono text-[11px] font-semibold text-foreground">
        {jurisdictionShort[code]}
      </span>
      {withName ? <span className="font-display text-sm">{jurisdictionLabels[code]}</span> : null}
    </span>
  );
}
