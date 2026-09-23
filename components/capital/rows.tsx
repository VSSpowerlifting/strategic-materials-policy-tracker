/**
 * List rows for financial commitments and control clauses. Pure
 * presentation over the serializable summaries in lib/capital-control, with
 * no data imports, so both the server pages and the client explorers use them.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { JurisdictionTag } from "@/components/labels";
import { formatDecimalCompact } from "@/lib/decimal";
import { formatDate } from "@/lib/format";
import {
  CONTROL_STATUS_HUES,
  capitalSourceLabels,
  controlDirectionLabels,
  controlMeasureTypeLabels,
  controlStatusLabels,
  financialInstrumentLabels,
  financialStatusLabels,
  supplyChainStageLabels,
  valueRoleLabels,
} from "@/lib/labels";
import type { CommitmentSummary, ControlSummary } from "@/lib/capital-control";
import type { JurisdictionCode, MonetaryAmount } from "@/lib/types";

/**
 * A funding option's status in words that cannot be mistaken for committed
 * money: the agreement's status, then whether any exercise is recorded.
 */
export function optionStatusLabel(status: CommitmentSummary["status"], exerciseRecorded: boolean): string {
  const agreement = status === "contracted" ? "Option executed" : `Option ${financialStatusLabels[status].toLowerCase()}`;
  return `${agreement} · ${exerciseRecorded ? "exercise recorded" : "no exercise recorded"}`;
}

const QUALIFIER_WORD = { exact: "", up_to: "up to", approximately: "about", at_least: "at least" } as const;

export function InlineAmount({ amount }: { amount: MonetaryAmount | null }) {
  if (!amount) return <span className="font-mono text-xs text-faint">No amount stated</span>;
  return (
    <span className="tnum inline-flex items-baseline gap-1 whitespace-nowrap">
      {amount.qualifier !== "exact" ? (
        <span className="font-mono text-[11px] text-faint">{QUALIFIER_WORD[amount.qualifier]}</span>
      ) : null}
      <span className="font-mono text-[11px] text-muted">{amount.currency}</span>
      <span className="font-display font-semibold">{formatDecimalCompact(amount.value)}</span>
    </span>
  );
}

/**
 * The providing government's tag, or a plain marker for capital no tracked
 * government provides (private financing, a company's own funds, a project
 * pipeline). Such rows are never credited to the event's government.
 */
export function ProviderTag({ code, withName = false }: { code: JurisdictionCode | null; withName?: boolean }) {
  if (code) return <JurisdictionTag code={code} withName={withName} />;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex h-5 items-center justify-center rounded border border-border-strong px-1 font-mono text-[11px] text-muted">
        —
      </span>
      <span className={withName ? "font-display text-sm text-muted" : "font-mono text-[11px] text-faint"}>
        {withName ? "Not government capital" : "non-gov."}
      </span>
    </span>
  );
}

const SUPPORT_ROLE = new Set(["commitment"]);

export function CommitmentRow({
  c,
  indent = 0,
  relationLabel,
}: {
  c: CommitmentSummary;
  /** Nesting depth in a family view. */
  indent?: number;
  /** e.g. "part of" / "drawn from", shown for nested rows. */
  relationLabel?: string;
}) {
  const offRole = !SUPPORT_ROLE.has(c.valueRole);
  return (
    <Link
      href={`/capital/${c.id}`}
      className="group flex border-b transition-colors last:border-b-0 hover:bg-elevated"
    >
      <span
        aria-hidden
        className={`w-1 shrink-0 self-stretch ${offRole ? "bg-border-strong" : "bg-[#CBA86A]"}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 sm:flex-row sm:gap-4" style={{ paddingLeft: `${16 + indent * 20}px` }}>
        <div className="flex items-center gap-2 sm:w-36 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1.5">
          <ProviderTag code={c.actor} />
          <span className="tnum font-mono text-[11px] text-faint">
            {c.statusDate ? formatDate(c.statusDate) : "Date not stated"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {relationLabel ? (
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">↳ {relationLabel}</p>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <h3 className="min-w-0 text-pretty font-display font-semibold leading-snug group-hover:text-accent">
              {c.recipient ?? c.provider ?? c.eventTitle}
            </h3>
            <InlineAmount amount={c.amount} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-muted">
            {c.project ?? c.eventTitle}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
            <Badge accent={!offRole}>{valueRoleLabels[c.valueRole]}</Badge>
            <Badge>{financialInstrumentLabels[c.instrument]}</Badge>
            <Badge>{capitalSourceLabels[c.capitalSource]}</Badge>
            {c.optionExerciseRecorded === null ? (
              <Badge accent={["contracted", "partially_disbursed", "disbursed"].includes(c.status)}>
                {financialStatusLabels[c.status]}
              </Badge>
            ) : (
              <Badge>{optionStatusLabel(c.status, c.optionExerciseRecorded)}</Badge>
            )}
            {c.stages.length ? (
              <span className="font-mono text-[11px] text-faint">
                {c.stages.map((s) => supplyChainStageLabels[s]).join(" · ")}
              </span>
            ) : null}
            {c.hasAmbiguity ? <span className="font-mono text-[11px] text-[#CBA86A]">ambiguity noted</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ControlRow({ m }: { m: ControlSummary }) {
  return (
    <Link
      href={`/controls/${m.id}`}
      className="group flex border-b transition-colors last:border-b-0 hover:bg-elevated"
    >
      <span aria-hidden className="w-1 shrink-0 self-stretch" style={{ background: CONTROL_STATUS_HUES[m.status] }} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-2 sm:w-36 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1.5">
          <JurisdictionTag code={m.issuer} />
          <span className="tnum font-mono text-[11px] text-faint">
            {m.firstDate ? formatDate(m.firstDate) : "Date not stated"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <h3 className="min-w-0 text-pretty font-display font-semibold leading-snug group-hover:text-accent">
              {controlMeasureTypeLabels[m.measureType]}
              {m.clause ? <span className="font-normal text-muted"> · {m.clause}</span> : null}
            </h3>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px]">
              <span aria-hidden className="h-3 w-[5px] rounded-[1px]" style={{ background: CONTROL_STATUS_HUES[m.status] }} />
              <span className={m.status === "in_force" ? "text-accent" : "text-muted"}>{controlStatusLabels[m.status]}</span>
              {m.until ? <span className="text-faint">to {formatDate(m.until)}</span> : null}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-muted">
            {m.documentNumber ?? m.eventTitle}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
            <Badge>{controlDirectionLabels[m.direction]}</Badge>
            {m.targetJurisdictions.length ? (
              <span className="font-mono text-[11px] text-muted">→ {m.targetJurisdictions.join(", ")}</span>
            ) : null}
            {m.targetEntities.length ? (
              <span className="font-mono text-[11px] text-muted">
                {m.targetEntities.length} named {m.targetEntities.length === 1 ? "entity" : "entities"}
              </span>
            ) : null}
            {m.productCodeCount ? (
              <span className="font-mono text-[11px] text-faint">{m.productCodeCount} product codes</span>
            ) : null}
            {m.hasAmbiguity ? <span className="font-mono text-[11px] text-[#CBA86A]">ambiguity noted</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
