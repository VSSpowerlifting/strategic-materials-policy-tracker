import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageContents, PageHeading, Section } from "@/components/ui/container";
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
import { getAllControlMeasures, getAllMaterials, getEventById, getSourceById } from "@/lib/data";
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
  // Legal statuses are read on the legal-status date, not the research-snapshot date: an entry dated later is scheduled, never effective.
  const asOf = site.legalStatusAsOf;
  const all = getAllControlMeasures();
  const summaries = all.map((m) => summarizeControl(m, asOf));
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
        title="Controls"
        lead="Export, import, investment and production restrictions recorded by operative clause and legal status."
      />

      <p className="tnum mt-6 font-display text-sm text-muted">
        <span className="font-semibold text-foreground">{all.length}</span> control clauses ·{" "}
        <span className="font-semibold text-foreground">{statusNow.get("in_force") ?? 0}</span> in force ·{" "}
        <span className="font-semibold text-foreground">{statusNow.get("suspended") ?? 0}</span> suspended ·{" "}
        <span className="font-semibold text-foreground">{clocks.length}</span> with a stated end date
      </p>
      <p className="mt-1 max-w-3xl font-display text-xs leading-5 text-faint">Statuses as of {formatDate(asOf)}, the date through which published legal instruments are incorporated. An entry dated later is shown as scheduled, not as effective.</p>

      <PageContents
        className="mt-8"
        items={[
          { href: "#end-dates", label: "Stated end dates" },
          { href: "#clauses", label: "All control clauses" },
          { href: "#status", label: "Legal status over time" },
          { href: "#tools", label: "Clauses by issuer and type" },
        ]}
      />

      <div className="mt-12 space-y-14">
        <Section
          id="end-dates"
          title="Controls with stated end dates"
          description={`Clauses whose status in effect on ${formatDate(asOf)} has a stated end date. No renewal is assumed after a stated end.`}
          note={{ label: "How days are counted", body: "Days are counted from that date to the stated end, which is the last day covered. A continuation dated later is shown as scheduled." }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {clockGroups.map((group) => {
              const { entry, daysLeft, scheduled, endPassed } = group[0];
              const event = getEventById(group[0].measure.eventId)!;
              return (
                <Card key={`${entry.sourceId}|${entry.until}|${entry.status}`} className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <ControlStatusBadge status={entry.status} />
                    <span className="tnum font-display text-xs text-muted">until {formatDate(entry.until!)}</span>
                  </div>
                  <p className="tnum mt-3 font-editorial text-4xl">
                    {Math.abs(daysLeft)}
                    <span className="ml-2 font-display text-sm font-normal text-muted">
                      {daysLeft < 0 ? `day${Math.abs(daysLeft) === 1 ? "" : "s"} since the stated end` : `day${daysLeft === 1 ? "" : "s"} left`}
                    </span>
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
                  {scheduled ? (
                    <p className="mt-3 border-t pt-3 text-xs leading-5 text-muted">
                      <span className="font-display text-faint">Scheduled, not yet effective</span>
                      <br />
                      <ControlStatusBadge status={scheduled.status} /> from {formatDate(scheduled.date!)}
                      {scheduled.until ? ` to ${formatDate(scheduled.until)}` : ""}
                      {getSourceById(scheduled.sourceId) ? <> · <Link href={`/sources/${scheduled.sourceId}`} className="hover:text-accent">{getSourceById(scheduled.sourceId)!.title}</Link></> : null}
                    </p>
                  ) : null}
                  {endPassed ? (
                    <p className="mt-3 text-xs leading-5 text-faint">
                      The stated end has passed and no later operative instrument is recorded. SMPT does not infer renewal, resumption or expiry; the current legal position needs the issuing authority&rsquo;s own source.
                    </p>
                  ) : !scheduled ? (
                    <p className="mt-3 text-xs leading-5 text-faint">
                      Standing after the stated end depends on a further instrument; none is recorded.
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </Section>

        <Section id="clauses" title="All control clauses">
          <ControlsExplorer rows={summaries} materialNames={materialNames} />
          <p className="mt-4 font-display text-sm text-muted">
            Download:{" "}
            <a href="/api/export/control-measures.csv" className="link-quiet">CSV</a>
            {" · "}
            <a href="/api/export/control-status-history.csv" className="link-quiet">status history CSV</a>
            {" · "}
            <Link href="/api/v1/control-measures" prefetch={false} className="link-quiet">JSON API</Link>
          </p>
        </Section>

        <Section
          id="status"
          title="Legal status over time"
          description="One bar per clause, coloured by status; a dashed tail runs to a stated end date."
        >
          <ControlStatusChart measures={all} asOf={asOf} />
        </Section>

        <Section id="tools" title="Clauses by issuer and measure type">
          <div className="overflow-x-auto border-y border-border-strong bg-plate">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <caption className="sr-only">Control clauses by issuing actor and measure type</caption>
              <thead>
                <tr className="border-b bg-elevated font-display text-xs text-faint">
                  <th scope="col" className="px-3 py-2 text-left font-normal">Measure type</th>
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
                              className="tnum flex h-8 items-center justify-center font-display text-xs text-foreground hover:outline hover:outline-1 hover:outline-accent"
                              style={{ background: `color-mix(in oklab, var(--mark-control) ${Math.min(44, 10 + n * 6)}%, transparent)` }}
                            >
                              {n}
                            </Link>
                          ) : (
                            <span className="flex h-8 items-center justify-center font-display text-xs text-border-strong">·</span>
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

      </div>
    </Container>
  );
}
