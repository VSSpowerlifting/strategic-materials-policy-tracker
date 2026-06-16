import { Badge } from "@/components/ui/badge";
import {
  confidenceLabels,
  confidenceTone,
  enSourceLabels,
  framingCategoryLabels,
  framingCategoryShort,
  framingCategoryTone,
  jurisdictionLabels,
  jurisdictionShort,
  mechanismLabels,
  policyStatusLabels,
  policyStatusTone,
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

export function StatusBadge({ status }: { status: PolicyStatus }) {
  return <Badge tone={policyStatusTone[status]}>{policyStatusLabels[status]}</Badge>;
}

export function MechanismBadges({ mechanisms }: { mechanisms: Mechanism[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {mechanisms.map((m) => (
        <Badge key={m} tone="neutral">
          {mechanismLabels[m]}
        </Badge>
      ))}
    </span>
  );
}

export function SectorBadges({ sectors }: { sectors: Sector[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {sectors.map((s) => (
        <Badge key={s} tone="slate">
          {sectorLabels[s]}
        </Badge>
      ))}
    </span>
  );
}

export function FramingBadge({
  category,
  short = false,
}: {
  category: FramingCategory;
  short?: boolean;
}) {
  return (
    <Badge tone={framingCategoryTone[category]}>
      {short ? framingCategoryShort[category] : framingCategoryLabels[category]}
    </Badge>
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
    <span className="inline-flex flex-wrap gap-1">
      {categories.map((c) => (
        <FramingBadge key={c} category={c} short={short} />
      ))}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: SourceConfidence }) {
  return (
    <Badge tone={confidenceTone[confidence]}>{confidenceLabels[confidence]}</Badge>
  );
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
      <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded border bg-elevated px-1 font-mono text-[11px] font-semibold text-foreground">
        {jurisdictionShort[code]}
      </span>
      {withName ? <span className="text-sm">{jurisdictionLabels[code]}</span> : null}
    </span>
  );
}
