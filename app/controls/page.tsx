import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ControlsExplorer } from "@/components/capital/controls-explorer";
import { ControlStatusChart } from "@/components/capital/charts";
import { ControlStatusBadge } from "@/components/capital/primitives";
import { JurisdictionTag } from "@/components/labels";
import {
  controlClocks,
  controlIssuer,
  controlStatusOn,
  countBy,
  summarizeControl,
} from "@/lib/capital-control";
import { getAllControlMeasures, getAllMaterials, getEventById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { controlMeasureTypeLabels, jurisdictionLabels } from "@/lib/labels";
import { site } from "@/lib/site";
import { CONTROL_MEASURE_TYPES, JURISDICTIONS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Controls",
  description:
    "Clause-level export, re-export, import, investment, customs and domestic-production controls on rare earths and strategic materials: who issued them, what and whom they target, the product codes they list, and their legal status over time.",
};

export default function ControlsPage() {
  const asOf = site.lastUpdated;
  const all = getAllControlMeasures();
  const summaries = all.map(summarizeControl);
  const materialNames = Object.fromEntries(getAllMaterials().map((m) => [m.id, m.nameEn]));
  const statusNow = countBy(all, (m) => controlStatusOn(m, asOf));
  const clocks = controlClocks(asOf);
  // Group clocks that share one legal instrument and end date into one line.
  const clockGroups = [...new Map(clocks.map((c) => [`${c.entry.sourceId}|${c.entry.until}|${c.entry.status}`, clocks.filter((d) => d.entry.sourceId === c.entry.sourceId && d.entry.until === c.entry.until && d.entry.status === c.entry.status)])).values()];
  const issuers = JURISDICTIONS.filter((j) => all.some((m) => controlIssuer(m) === j));
  const types = CONTROL_MEASURE_TYPES.filter((t) => all.some((m) => m.measureType === t));
  const cell = (j: string, t: string) => all.filter((m) => controlIssuer(m) === j && m.measureType === t).length;

  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Restrictions as policy"
        title="Controls"
        lead="Export licensing, prohibitions, extraterritorial rules, end-use restrictions, suspensions, investigations, divestiture orders and domestic production controls — one row per operative clause, so a limb that is suspended is never hidden inside a measure that is otherwise in force."
      />

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
        {[
          ["Control clauses", all.length],
          ["In force", statusNow.get("in_force") ?? 0],
          ["Suspended", statusNow.get("suspended") ?? 0],
          ["With a stated end date", clocks.length],
        ].map(([k, v]) => (
          <div key={k} className="bg-card px-4 py-4">
            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{k}</dt>
            <dd className="tnum mt-1 font-display text-3xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 font-mono text-[11px] text-faint">Statuses as of {formatDate(asOf)}, the date the data was last checked.</p>

      <div className="mt-14 space-y-14">
        <Section
          index="01"
          title="Clocks running"
          description="Clauses whose current status has a stated end date. Days are counted from the data's as-of date, not from today."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {clockGroups.map((group) => {
              const { entry, daysLeft } = group[0];
              const event = getEventById(group[0].measure.eventId)!;
              return (
                <Card key={`${entry.sourceId}-${entry.until}`} className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <ControlStatusBadge status={entry.status} />
                    <span className="tnum font-mono text-xs text-muted">until {formatDate(entry.until!)}</span>
                  </div>
                  <p className="tnum mt-3 font-display text-4xl font-bold">
                    {daysLeft}
                    <span className="ml-2 font-mono text-sm font-normal text-muted">days {daysLeft >= 0 ? "left" : "past"}</span>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    <JurisdictionTag code={event.jurisdiction} />{" "}
                    <Link href={`/events/${event.id}`} className="hover:text-accent">{event.documentNumber ?? event.titleEn}</Link>
                  </p>
                  <ul className="mt-3 space-y-1 border-t pt-3">
                    {group.map(({ measure }) => (
                      <li key={measure.id}>
                        <Link href={`/controls/${measure.id}`} className="text-sm hover:text-accent">
                          {controlMeasureTypeLabels[measure.measureType]}
                          {measure.clause ? <span className="text-muted"> · {measure.clause}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-5 text-faint">
                    What follows the end date is not recorded until an official source states it.
                  </p>
                </Card>
              );
            })}
          </div>
        </Section>

        <Section
          index="02"
          title="Legal status over time"
          description="Each bar is one clause, coloured by status; a dashed tail runs to a stated end date. Select a bar for the clause."
        >
          <ControlStatusChart measures={all} asOf={asOf} />
        </Section>

        <Section index="03" title="Who uses which tool" description="Control clauses by issuer and measure type.">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <caption className="sr-only">Control clauses by issuing actor and measure type</caption>
              <thead>
                <tr className="border-b bg-card font-mono text-[11px] text-faint">
                  <th scope="col" className="px-3 py-2 text-left font-normal uppercase tracking-[0.12em]">Measure type</th>
                  {issuers.map((j) => (
                    <th key={j} scope="col" className="px-2 py-2 text-center font-normal">{jurisdictionLabels[j]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t} className="border-b last:border-b-0">
                    <th scope="row" className="px-3 py-2 text-left font-display font-normal text-muted">{controlMeasureTypeLabels[t]}</th>
                    {issuers.map((j) => {
                      const n = cell(j, t);
                      return (
                        <td key={j} className="p-1 text-center">
                          {n ? (
                            <Link
                              href={`/controls?issuer=${j}&type=${t}`}
                              className="tnum flex h-8 items-center justify-center rounded font-mono text-xs hover:ring-1 hover:ring-accent"
                              style={{ background: `color-mix(in oklab, #C77B7B ${Math.min(60, 14 + n * 8)}%, transparent)` }}
                            >
                              {n}
                            </Link>
                          ) : (
                            <span className="flex h-8 items-center justify-center font-mono text-xs text-border-strong">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section index="04" title="All control clauses" description="Filter by issuer, status, type, direction, targeting or material.">
          <ControlsExplorer rows={summaries} materialNames={materialNames} />
          <p className="mt-4 text-sm text-muted">
            Download:{" "}
            <a href="/api/export/control-measures.csv" className="text-accent hover:text-accent-strong">CSV</a>
            {" · "}
            <a href="/api/export/control-status-history.csv" className="text-accent hover:text-accent-strong">status history CSV</a>
            {" · "}
            <Link href="/api/v1/control-measures" prefetch={false} className="text-accent hover:text-accent-strong">JSON API</Link>
          </p>
        </Section>
      </div>
    </Container>
  );
}
