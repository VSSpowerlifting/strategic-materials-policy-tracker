import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FINANCIAL_STATUS_TONE, IMPLEMENTATION_STATUS_TONE, controlStatusTextClass } from "./status-tone";
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

export function FinancialStatusBadge({ status }: { status: FinancialStatus }) {
  return <Badge tone={FINANCIAL_STATUS_TONE[status]}>{financialStatusLabels[status]}</Badge>;
}

export function ImplementationStatusBadge({ status }: { status: ImplementationStatus }) {
  return <Badge tone={IMPLEMENTATION_STATUS_TONE[status] ?? "neutral"}>{implementationStatusLabels[status]}</Badge>;
}

/** Control status: a squared hue marker (the chart's legend) plus the label. */
export function ControlStatusBadge({ status }: { status: ControlStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-xs leading-none">
      <span aria-hidden className="h-3 w-[5px] shrink-0" style={{ background: CONTROL_STATUS_HUES[status] }} />
      <span className={controlStatusTextClass(status)}>{controlStatusLabels[status]}</span>
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
        <span className="font-display text-xs text-faint">{QUALIFIER_PREFIX[amount.qualifier].trim()}</span>
      ) : null}
      <span className={`tnum font-display font-semibold tracking-tight ${sizeClass}`}>
        <span className="mr-1 font-display text-[0.7em] font-normal text-muted">{amount.currency}</span>
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
        <span className="font-display text-xs text-faint">As stated </span>
        “{amount.amountAsStated}”
      </p>
      <p className="mt-1 font-display text-xs text-faint">
        {amount.currency} {groupDecimal(amount.value)} · {valueQualifierLabels[amount.qualifier]} · Currency{" "}
        {currencyBasisLabels[amount.currencyBasis].toLowerCase()}
      </p>
      {amount.basisNote ? (
        <p className="mt-2 text-sm leading-6 text-muted">
          <span className="font-display text-xs text-faint">Amount basis </span>
          {amount.basisNote}
        </p>
      ) : null}
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
 * A status history, oldest first, as a vertical trail. Without `asOf` the last entry is marked
 * current. With `asOf` (an ISO date) the entry in effect on that date is marked current and an entry
 * dated after it is marked "scheduled", never current. Undated entries say so rather than borrowing
 * a date, and count as already recorded.
 */
export function StatusTrail<S extends string>({
  entries,
  render,
  asOf,
}: {
  entries: (StatusEntry<S> & { until?: string | null })[];
  render: (status: S) => React.ReactNode;
  asOf?: string;
}) {
  const isScheduled = (e: { date: string | null }) => asOf !== undefined && e.date !== null && e.date > asOf;
  let currentIndex = entries.length - 1;
  if (asOf !== undefined) {
    currentIndex = -1;
    entries.forEach((e, i) => {
      if (!isScheduled(e)) currentIndex = i;
    });
  }
  return (
    <ol className="space-y-0">
      {entries.map((e, i) => {
        const current = i === currentIndex;
        const scheduled = isScheduled(e);
        return (
          <li key={i} className="relative border-l border-border pb-5 pl-6 last:border-l-transparent last:pb-0">
            <span
              aria-hidden
              className={`absolute -left-[5px] top-1 h-2.5 w-2.5 border-2 border-background ${current ? "bg-accent" : scheduled ? "bg-background border-border-strong" : "bg-border-strong"}`}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <time className="tnum font-display text-xs text-faint">{e.date ? formatDate(e.date) : "Date not stated"}</time>
              {render(e.status)}
              {e.until ? (
                <span className="font-display text-xs text-muted">until {formatDate(e.until)}</span>
              ) : null}
              {current ? <span className="font-display text-xs font-medium text-accent">Current</span> : null}
              {scheduled ? <span className="font-display text-xs text-muted">Scheduled, not yet in effect</span> : null}
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

export function ControlStatusTrail({ entries, asOf }: { entries: ControlStatusEntry[]; asOf?: string }) {
  return <StatusTrail entries={entries} render={(s) => <ControlStatusBadge status={s} />} asOf={asOf} />;
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
    <div>
      {/* Narrow view: one complete citation per card, with no sideways table scrolling. */}
      <ol className="space-y-3 sm:hidden" aria-label="Evidence references">
        {evidence.map((e, i) => {
          const s = getSourceById(e.sourceId);
          return (
            <li key={i} data-testid="evidence-mobile-card"
              className="min-w-0 border border-border bg-plate p-4">
              <p className="font-display text-base font-semibold leading-6 [overflow-wrap:anywhere]">
                {s ? <ExtLink href={s.url}>{s.title}</ExtLink> : e.sourceId}
              </p>
              {s ? <p className="mt-1 text-sm leading-6 text-muted">{s.publisher}</p> : null}
              <dl className="mt-4 space-y-3 text-sm leading-6">
                <div>
                  <dt className="font-display text-xs font-semibold text-muted">Fields supported</dt>
                  <dd className="mt-1 text-foreground">{e.supports.map(f=>fieldLabels[f]).join(" · ")}</dd>
                </div>
                <div>
                  <dt className="font-display text-xs font-semibold text-muted">Evidence level</dt>
                  <dd className="mt-1"><Badge accent={e.evidence==="explicit"}>{evidenceLevelLabels[e.evidence]}</Badge></dd>
                </div>
                <div>
                  <dt className="font-display text-xs font-semibold text-muted">Location in document</dt>
                  <dd className="mt-1 [overflow-wrap:anywhere]">{e.locator ?? "Not stated"}</dd>
                </div>
                {e.note ? <div>
                  <dt className="font-display text-xs font-semibold text-muted">Qualification</dt>
                  <dd className="mt-1 text-muted [overflow-wrap:anywhere]">{e.note}</dd>
                </div> : null}
              </dl>
              {s ? <Link href={"/sources/"+s.id}
                className="mt-3 inline-flex min-h-11 items-center font-display text-sm font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                View source dossier
              </Link> : null}
            </li>
          );
        })}
      </ol>
      {/* Wide view: retain an accessible native table and horizontal scrolling when needed. */}
      <div className="hidden overflow-x-auto border-y border-border-strong sm:block">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">Original sources, the fields each supports, evidence level and precise document location</caption>
          <thead>
            <tr className="border-b border-border-strong bg-elevated font-display text-xs font-medium text-faint">
              <th scope="col" className="px-4 py-3">Source</th>
              <th scope="col" className="px-4 py-3">Fields supported</th>
              <th scope="col" className="px-4 py-3">Evidence level</th>
              <th scope="col" className="px-4 py-3">Location</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((e, i) => {
              const s = getSourceById(e.sourceId);
              return (
                <tr key={i} className="border-b border-border align-top last:border-b-0">
                  <td className="px-4 py-4">
                    {s ? (
                      <>
                        <ExtLink href={s.url} className="font-display text-sm font-medium leading-6">
                          {s.title}
                        </ExtLink>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {s.publisher} ·{" "}
                          <Link href={"/sources/"+s.id} className="text-accent hover:underline">
                            Source dossier
                          </Link>
                        </p>
                      </>
                    ) : (
                      <span className="font-mono text-xs">{e.sourceId}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <ul className="space-y-1 text-sm leading-6 text-muted">
                      {e.supports.map(f=><li key={f}>{fieldLabels[f]}</li>)}
                    </ul>
                  </td>
                  <td className="px-4 py-4">
                    <Badge accent={e.evidence === "explicit"}>{evidenceLevelLabels[e.evidence]}</Badge>
                    {e.note ? <p className="mt-2 max-w-xs text-sm leading-6 text-muted [overflow-wrap:anywhere]">{e.note}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-sm leading-6 text-muted [overflow-wrap:anywhere]">{e.locator ?? "Not stated"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A labelled fact row for the record sheets. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 border-b border-border py-4 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-5">
      <dt className="font-display text-xs font-semibold leading-5 text-muted">{label}</dt>
      <dd className="min-w-0 text-[0.9375rem] leading-7 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

export function NotStated({ children = "Not stated" }: { children?: React.ReactNode }) {
  return <span className="font-display text-xs text-faint">{children}</span>;
}

/**
 * The three steps a funding option can reach, each from the corpus alone:
 * the agreement granting it is executed; an exercise is recorded as its own
 * commitment drawn from it; money under that commitment is paid. A missing
 * step reads "none recorded in the corpus", never "not exercised".
 */
export function OptionLadder({
  executed,
  exercises,
  disbursements,
  endedExercises = [],
}: {
  executed: { date: string | null; sourceId: string } | null;
  exercises: { id: string; label: string }[];
  disbursements: { id: string; label: string }[];
  /** Draws recorded and then withdrawn or lapsed: listed, never read as an exercise or as money moved. */
  endedExercises?: { id: string; label: string }[];
}) {
  const steps: { label: string; done: boolean; body: React.ReactNode; extra?: React.ReactNode }[] = [
    {
      label: "Agreement executed",
      done: executed !== null,
      body: executed ? (
        <>
          {executed.date ? formatDate(executed.date) : "Date not stated"} · <SourceMention sourceId={executed.sourceId} />
        </>
      ) : (
        "No executed agreement recorded in the corpus"
      ),
    },
    {
      label: "Option exercised",
      done: exercises.length > 0,
      body: exercises.length ? (
        exercises.map((e, i) => (
          <span key={e.id}>
            {i ? ", " : ""}
            <Link href={`/capital/${e.id}`} className="text-accent hover:text-accent-strong">{e.label}</Link>
          </span>
        ))
      ) : (
        "None recorded in the corpus"
      ),
      extra: endedExercises.length ? (
        <span className="mt-1 block text-faint">
          Ended, not an exercise:{" "}
          {endedExercises.map((e, i) => (
            <span key={e.id}>
              {i ? ", " : ""}
              <Link href={`/capital/${e.id}`} className="text-accent hover:text-accent-strong">{e.label}</Link>
            </span>
          ))}
        </span>
      ) : null,
    },
    {
      label: "Money disbursed",
      done: disbursements.length > 0,
      body: disbursements.length ? (
        disbursements.map((e, i) => (
          <span key={e.id}>
            {i ? ", " : ""}
            <Link href={`/capital/${e.id}`} className="text-accent hover:text-accent-strong">{e.label}</Link>
          </span>
        ))
      ) : (
        "None recorded in the corpus"
      ),
    },
  ];
  return (
    <ol className="grid gap-px overflow-hidden border bg-border sm:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.label} className="bg-plate px-4 py-3">
          <p className="flex items-center gap-2 font-display text-xs">
            <span
              aria-hidden
              className={`inline-flex h-4 w-4 items-center justify-center border text-xs ${s.done ? "border-accent text-accent" : "border-border-strong text-faint"}`}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <span className={s.done ? "text-foreground" : "text-faint"}>{s.label}</span>
            <span className="sr-only">{s.done ? " — recorded" : " — not recorded"}</span>
          </p>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            {s.body}
            {s.extra}
          </p>
        </li>
      ))}
    </ol>
  );
}
