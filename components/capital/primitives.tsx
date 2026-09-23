import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExtLink } from "@/components/ui/ext-link";
import {
  CONTROL_STATUS_HUES,
  capitalSourceLabels,
  controlStatusLabels,
  currencyBasisLabels,
  evidenceLevelLabels,
  financialInstrumentLabels,
  financialStatusLabels,
  implementationStatusLabels,
  valueQualifierLabels,
  valueRoleLabels,
} from "@/lib/labels";
import { formatDecimalCompact, groupDecimal } from "@/lib/decimal";
import { getSourceById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type {
  CapitalSource,
  ControlStatus,
  ControlStatusEntry,
  EvidenceReference,
  FinancialInstrument,
  FinancialStatus,
  ImplementationStatus,
  MonetaryAmount,
  StatusEntry,
  ValueQualifier,
  ValueRole,
} from "@/lib/types";

// Verdigris emphasis only where money has legally changed hands or a clause
// binds today; every other stage is a quiet label.
const FINANCIAL_EMPHASIS = new Set<FinancialStatus>(["contracted", "partially_disbursed", "disbursed"]);

export function FinancialStatusBadge({ status }: { status: FinancialStatus }) {
  return <Badge accent={FINANCIAL_EMPHASIS.has(status)}>{financialStatusLabels[status]}</Badge>;
}

export function ImplementationStatusBadge({ status }: { status: ImplementationStatus }) {
  return <Badge>{implementationStatusLabels[status]}</Badge>;
}

/** Control status: a squared hue marker (the chart's legend) plus the label. */
export function ControlStatusBadge({ status }: { status: ControlStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] leading-none text-muted">
      <span aria-hidden className="h-3 w-[5px] shrink-0 rounded-[1px]" style={{ background: CONTROL_STATUS_HUES[status] }} />
      <span className={status === "in_force" ? "text-accent" : undefined}>{controlStatusLabels[status]}</span>
    </span>
  );
}

export function InstrumentBadge({ instrument }: { instrument: FinancialInstrument }) {
  return <Badge>{financialInstrumentLabels[instrument]}</Badge>;
}

export function ValueRoleBadge({ role }: { role: ValueRole }) {
  return <Badge accent={role === "commitment"}>{valueRoleLabels[role]}</Badge>;
}

export function CapitalSourceBadge({ source }: { source: CapitalSource }) {
  return <Badge>{capitalSourceLabels[source]}</Badge>;
}

const QUALIFIER_PREFIX: Record<ValueQualifier, string> = {
  exact: "",
  up_to: "up to ",
  approximately: "about ",
  at_least: "at least ",
};

/** A normalised figure in the source's currency, with its qualifier spelled out. */
export function AmountFigure({
  amount,
  size = "md",
}: {
  amount: MonetaryAmount;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-sm";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      {amount.qualifier !== "exact" ? (
        <span className="font-mono text-xs text-faint">{QUALIFIER_PREFIX[amount.qualifier].trim()}</span>
      ) : null}
      <span className={`tnum font-display font-semibold tracking-tight ${sizeClass}`}>
        <span className="mr-1 font-mono text-[0.7em] font-normal text-muted">{amount.currency}</span>
        {formatDecimalCompact(amount.value)}
      </span>
    </span>
  );
}

/** Amount with its provenance: the source's own wording, exact figure and currency basis. */
export function AmountDetail({ amount }: { amount: MonetaryAmount }) {
  return (
    <div>
      <AmountFigure amount={amount} size="lg" />
      <p className="mt-2 text-sm leading-6 text-muted">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">As stated </span>
        “{amount.amountAsStated}”
      </p>
      <p className="mt-1 font-mono text-[11px] text-faint">
        {amount.currency} {groupDecimal(amount.value)} · {valueQualifierLabels[amount.qualifier]} · Currency{" "}
        {currencyBasisLabels[amount.currencyBasis].toLowerCase()}
      </p>
    </div>
  );
}

/** A short source reference: the source title linked to its URL, with a jump to the row's evidence. */
export function SourceMention({ sourceId }: { sourceId: string }) {
  const s = getSourceById(sourceId);
  if (!s) return <span className="font-mono text-xs text-faint">{sourceId}</span>;
  return (
    <ExtLink href={s.url} className="text-xs">
      {s.publisher}
    </ExtLink>
  );
}

/**
 * A status history, oldest first, as a vertical trail. The last entry is the
 * current status and is marked as such. Undated entries say so rather than
 * borrowing a date.
 */
export function StatusTrail<S extends string>({
  entries,
  render,
}: {
  entries: (StatusEntry<S> & { until?: string | null })[];
  render: (status: S) => React.ReactNode;
}) {
  return (
    <ol className="space-y-0">
      {entries.map((e, i) => {
        const current = i === entries.length - 1;
        return (
          <li key={i} className="relative border-l border-border pb-5 pl-6 last:border-l-transparent last:pb-0">
            <span
              aria-hidden
              className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-[2px] border-2 border-background ${current ? "bg-accent" : "bg-border-strong"}`}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <time className="tnum font-mono text-xs text-faint">{e.date ? formatDate(e.date) : "Date not stated"}</time>
              {render(e.status)}
              {e.until ? (
                <span className="font-mono text-[11px] text-muted">until {formatDate(e.until)}</span>
              ) : null}
              {current ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">current</span> : null}
            </div>
            {e.note ? <p lang={/[\u3400-\u9fff]/.test(e.note) ? "zh" : undefined} className="mt-1 max-w-prose text-sm leading-6 text-muted">{e.note}</p> : null}
            <p className="mt-1">
              <SourceMention sourceId={e.sourceId} />
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function FinancialStatusTrail({ entries }: { entries: StatusEntry<FinancialStatus>[] }) {
  return <StatusTrail entries={entries} render={(s) => <FinancialStatusBadge status={s} />} />;
}

export function ImplementationStatusTrail({ entries }: { entries: StatusEntry<ImplementationStatus>[] }) {
  return <StatusTrail entries={entries} render={(s) => <ImplementationStatusBadge status={s} />} />;
}

export function ControlStatusTrail({ entries }: { entries: ControlStatusEntry[] }) {
  return <StatusTrail entries={entries} render={(s) => <ControlStatusBadge status={s} />} />;
}

/**
 * Field-level provenance: which source supports which fields, how directly,
 * and where in the source. This is the table a reader checks a record against.
 */
export function EvidenceTable<F extends string>({
  evidence,
  fieldLabels,
}: {
  evidence: EvidenceReference<F>[];
  fieldLabels: Record<F, string>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-card font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
            <th scope="col" className="px-3 py-2 font-normal">Source</th>
            <th scope="col" className="px-3 py-2 font-normal">Supports</th>
            <th scope="col" className="px-3 py-2 font-normal">Level</th>
            <th scope="col" className="px-3 py-2 font-normal">Where</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((e, i) => {
            const s = getSourceById(e.sourceId);
            return (
              <tr key={i} className="border-b align-top last:border-b-0">
                <td className="px-3 py-3">
                  {s ? (
                    <>
                      <ExtLink href={s.url} className="font-display text-sm">
                        {s.title}
                      </ExtLink>
                      <p className="mt-0.5 text-xs text-faint">
                        {s.publisher} ·{" "}
                        <Link href={`/sources#${s.id}`} className="hover:text-accent">
                          {s.confidence === "primary" ? "primary" : s.confidence.replace("_", " ")}
                        </Link>
                      </p>
                    </>
                  ) : (
                    <span className="font-mono text-xs">{e.sourceId}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {e.supports.map((f) => (
                      <span key={f} className="font-mono text-[11px] text-muted">
                        {fieldLabels[f]}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <Badge accent={e.evidence === "explicit"}>{evidenceLevelLabels[e.evidence]}</Badge>
                  {e.note ? <p className="mt-2 max-w-xs text-xs leading-5 text-muted">{e.note}</p> : null}
                </td>
                <td className="px-3 py-3 text-xs text-muted">{e.locator ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** A labelled fact row for the record sheets. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{label}</dt>
      <dd className="min-w-0 text-sm leading-6">{children}</dd>
    </div>
  );
}

export function NotStated({ children = "Not stated" }: { children?: React.ReactNode }) {
  return <span className="font-mono text-xs text-faint">{children}</span>;
}
