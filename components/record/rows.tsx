/**
 * Hairline list rows for the records a detail page links to: financial rows, control clauses and project
 * designations. They carry the same fields as the shared boxed rows (`components/capital/rows`), laid out for
 * a record sheet. Presentation over the serializable summaries; no figure is derived here.
 */
import Link from "next/link";
import { ControlStatusBadge } from "@/components/capital/primitives";
import { InlineAmount, ProviderTag, optionStatusLabel } from "@/components/capital/rows";
import { CurrencyTotals } from "@/components/intelligence/totals";
import { JurisdictionTag } from "@/components/labels";
import {
  BINDING_FINANCIAL_STATUSES,
  ENDED_FINANCIAL_STATUSES,
  summarizeCommitment,
  summarizeControl,
  type CommitmentSummary,
  type ControlSummary,
} from "@/lib/capital-control";
import type { Layer } from "@/lib/capital-intelligence";
import { getEventById, getProgrammeById, getProjectById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  capitalSourceLabels,
  controlDirectionLabels,
  controlMeasureTypeLabels,
  controlStatusLabels,
  designationStatusLabels,
  financialInstrumentLabels,
  financialRelationshipTypeLabels,
  financialStatusLabels,
  layerGlosses,
  layerLabels,
  supplyChainStageLabels,
  valueRoleLabels,
} from "@/lib/labels";
import { site } from "@/lib/site";
import type { ControlMeasure, FinancialCommitment, FinancialStatus, ProjectDesignation } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Colour for a financial status: malachite once an agreement binds, hematite once the row has ended. */
export function financialStatusTone(status: FinancialStatus): "accent" | "negative" | "neutral" {
  if (BINDING_FINANCIAL_STATUSES.includes(status)) return "accent";
  if (ENDED_FINANCIAL_STATUSES.includes(status)) return "negative";
  return "neutral";
}

const TONE_CLASS = { accent: "text-accent", negative: "text-negative", neutral: "text-foreground" } as const;

/** A row's secondary fields: spaced items with a spoken label each, never a dot-joined string. */
function Meta({ items }: { items: { label: string; value: React.ReactNode; className?: string }[] }) {
  return (
    <dl className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-display text-[0.8125rem] leading-5 text-muted">
      {items.map((i) => (
        <div key={i.label} className={i.className}>
          <dt className="sr-only">{i.label}</dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CommitmentLine({
  c,
  indent = 0,
  relationLabel,
}: {
  c: CommitmentSummary;
  /** Nesting depth under a package or envelope listed above. */
  indent?: number;
  /** The typed relationship to the row it sits under, in the record's own words. */
  relationLabel?: string;
}) {
  const statusLabel =
    c.optionExerciseRecorded === null ? financialStatusLabels[c.status] : optionStatusLabel(c.status, c.optionExerciseRecorded);
  const tone = c.optionExerciseRecorded === null ? financialStatusTone(c.status) : "neutral";
  return (
    <li className="border-b border-border py-4" style={indent ? { paddingLeft: `${indent * 1.25}rem` } : undefined}>
      {relationLabel ? <p className="mb-1 font-display text-[0.8125rem] leading-5 text-faint">{relationLabel}</p> : null}
      <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h3 className="text-pretty font-display text-base font-medium leading-snug">
            <Link href={`/capital/${c.id}`} className="link-quiet">
              {c.recipient ?? c.provider ?? c.eventTitle}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{c.project ?? c.eventTitle}</p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 sm:flex-col sm:items-end">
          <InlineAmount amount={c.amount} />
          <span className={cn("font-display text-[0.8125rem] font-medium leading-5", TONE_CLASS[tone])}>{statusLabel}</span>
          <span className="tnum font-display text-[0.8125rem] leading-5 text-faint">
            {c.statusDate ? formatDate(c.statusDate) : "Date not stated"}
          </span>
        </div>
      </div>
      <Meta
        items={[
          { label: "Providing government", value: <ProviderTag code={c.actor} /> },
          { label: "Value role", value: valueRoleLabels[c.valueRole], className: c.valueRole === "commitment" ? "text-foreground" : undefined },
          { label: "Instrument", value: financialInstrumentLabels[c.instrument] },
          { label: "Capital source", value: capitalSourceLabels[c.capitalSource] },
          ...(c.stages.length ? [{ label: "Supply-chain stages", value: c.stages.map((s) => supplyChainStageLabels[s]).join(", ") }] : []),
          ...(c.hasAmbiguity ? [{ label: "Coding note", value: "Ambiguity noted", className: "text-ochre" }] : []),
        ]}
      />
    </li>
  );
}

export function ControlLine({
  m,
  children,
}: {
  m: ControlSummary;
  /** A line that belongs to this clause in the page's context (what another event's source records about it). */
  children?: React.ReactNode;
}) {
  return (
    <li className="border-b border-border py-4">
      <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h3 className="text-pretty font-display text-base font-medium leading-snug">
            <Link href={`/controls/${m.id}`} className="link-quiet">
              {controlMeasureTypeLabels[m.measureType]}
            </Link>
            {m.clause ? <span className="font-normal text-muted">, {m.clause}</span> : null}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{m.documentNumber ?? m.eventTitle}</p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 sm:flex-col sm:items-end">
          <span className="inline-flex flex-wrap items-baseline gap-x-2 text-[0.8125rem]">
            <ControlStatusBadge status={m.status} />
            {m.until ? <span className="font-display text-faint">to {formatDate(m.until)}</span> : null}
          </span>
          <span className="tnum font-display text-[0.8125rem] leading-5 text-faint">
            {m.firstDate ? formatDate(m.firstDate) : "Date not stated"}
          </span>
        </div>
      </div>
      {m.scheduled ? (
        <p className="mt-1.5 font-display text-[0.8125rem] leading-5 text-muted">
          Scheduled, not yet in effect: {controlStatusLabels[m.scheduled.status].toLowerCase()} from {formatDate(m.scheduled.from)}
          {m.scheduled.until ? ` to ${formatDate(m.scheduled.until)}` : ""}
        </p>
      ) : m.endPassed ? (
        <p className="mt-1.5 font-display text-[0.8125rem] leading-5 text-muted">
          Stated end has passed; standing after it depends on a further instrument, none recorded.
        </p>
      ) : null}
      <Meta
        items={[
          { label: "Issuing government", value: <JurisdictionTag code={m.issuer} /> },
          { label: "Direction", value: controlDirectionLabels[m.direction] },
          ...(m.targetJurisdictions.length ? [{ label: "Target jurisdictions", value: `Targets ${m.targetJurisdictions.join(", ")}` }] : []),
          ...(m.targetEntities.length
            ? [{ label: "Named entities", value: `${m.targetEntities.length} named ${m.targetEntities.length === 1 ? "entity" : "entities"}` }]
            : []),
          ...(m.productCodeCount ? [{ label: "Product codes", value: `${m.productCodeCount} product codes` }] : []),
          ...(m.hasAmbiguity ? [{ label: "Coding note", value: "Ambiguity noted", className: "text-ochre" }] : []),
        ]}
      />
      {children}
    </li>
  );
}

/**
 * The financial rows and control clauses coded under one event. A financial row is listed under the package or
 * envelope it belongs to when that row is also in the list, with the typed relationship named, so a reader sees
 * which figures sit inside which before reading any of them together.
 */
export function InstrumentLines({ commitments, controls }: { commitments: FinancialCommitment[]; controls: ControlMeasure[] }) {
  const ids = new Set(commitments.map((c) => c.id));
  const parentIn = (c: FinancialCommitment) => c.relationships.find((r) => ids.has(r.commitmentId));
  const ordered: { c: FinancialCommitment; depth: number; rel?: string }[] = [];
  const place = (c: FinancialCommitment, depth: number) => {
    const p = parentIn(c);
    ordered.push({
      c,
      depth,
      rel: depth && p ? `${financialRelationshipTypeLabels[p.relationship].toLowerCase()} the row above` : undefined,
    });
    commitments.filter((k) => parentIn(k)?.commitmentId === c.id).forEach((k) => place(k, depth + 1));
  };
  commitments.filter((c) => !parentIn(c)).forEach((c) => place(c, 0));

  return (
    <div className="space-y-10">
      {commitments.length ? (
        <div>
          <h3 className="label mb-3">Financial instruments ({commitments.length})</h3>
          <ul className="border-t border-border">
            {ordered.map(({ c, depth, rel }) => (
              <CommitmentLine key={c.id} c={summarizeCommitment(c)} indent={depth} relationLabel={rel} />
            ))}
          </ul>
        </div>
      ) : null}
      {controls.length ? (
        <div>
          <h3 className="label mb-3">Control clauses ({controls.length})</h3>
          <ul className="border-t border-border">
            {controls.map((m) => (
              <ControlLine key={m.id} m={summarizeControl(m, site.legalStatusAsOf)} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** One project designation: the scheme, the project as the source names it, and the current status with its date. */
export function DesignationLine({ d, showProject = false }: { d: ProjectDesignation; showProject?: boolean }) {
  const cur = d.statusHistory[d.statusHistory.length - 1];
  const programme = getProgrammeById(d.programmeId);
  const project = getProjectById(d.projectId);
  const event = getEventById(d.eventId);
  const countries = d.locations.map((l) => l.countryCode).filter(Boolean).join(", ");
  return (
    <li className="border-b border-border py-4">
      <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h3 className="text-pretty font-display text-base font-medium leading-snug">
            {showProject && project ? (
              <Link href={`/projects/${project.id}`} className="link-quiet">
                {d.projectNameAsStated}
              </Link>
            ) : (
              d.projectNameAsStated
            )}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            {programme ? (
              <Link href={`/programmes/${programme.id}`} className="link-quiet">
                {programme.name}
              </Link>
            ) : (
              d.programmeId
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 sm:flex-col sm:items-end">
          <span
            className={cn(
              "font-display text-[0.8125rem] font-medium leading-5",
              cur?.status === "recognized" ? "text-ochre" : cur?.status === "withdrawn" ? "text-negative" : "text-faint",
            )}
          >
            {cur ? designationStatusLabels[cur.status] : "Status not stated"}
          </span>
          <span className="tnum font-display text-[0.8125rem] leading-5 text-faint">{cur?.date ? formatDate(cur.date) : "Date not stated"}</span>
        </div>
      </div>
      <Meta
        items={[
          ...(event
            ? [
                {
                  label: "Recorded in",
                  value: (
                    <Link href={`/events/${event.id}`} className="link-quiet">
                      {event.documentNumber ?? event.titleEn}
                    </Link>
                  ),
                },
              ]
            : []),
          ...(countries ? [{ label: "Country", value: countries }] : []),
          ...(d.stages.length ? [{ label: "Supply-chain stages", value: d.stages.map((s) => supplyChainStageLabels[s]).join(", ") }] : []),
        ]}
      />
    </li>
  );
}

/**
 * A capital stack as value-role layers. Totals appear only on the layers the counting rules allow to be summed
 * and come straight from the layer (`totalCommitments`); every other layer lists its rows and says so.
 */
export function LayerList({ layers }: { layers: Layer[] }) {
  return (
    <div className="space-y-12">
      {layers.map((layer) => (
        <div key={layer.key}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="font-display text-[1.0625rem] font-semibold leading-snug">{layerLabels[layer.key]}</h3>
            <p className="font-display text-[0.8125rem] leading-5 text-faint">
              {layer.rows.length} row{layer.rows.length === 1 ? "" : "s"}, {layer.totals ? "summed per currency" : "listed, not summed"}
            </p>
          </div>
          <p className="mt-2 max-w-[38rem] text-pretty text-[0.9375rem] leading-7 text-muted">{layerGlosses[layer.key]}</p>
          {layer.totals ? (
            <div className="mt-4">
              <CurrencyTotals totals={layer.totals} />
            </div>
          ) : null}
          <ul className="mt-4 border-t border-border">
            {layer.rows.map((c) => (
              <CommitmentLine key={c.id} c={summarizeCommitment(c)} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
