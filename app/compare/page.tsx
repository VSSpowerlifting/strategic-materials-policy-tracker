import type { Metadata } from "next";
import Link from "next/link";

import { Container, PageHeading, Section } from "@/components/ui/container";
import { ActorMonogram } from "@/components/actor-monogram";
import { getControlMatrix } from "@/lib/data";
import { jurisdictionLabels, jurisdictionShort, mechanismLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Comparative matrix",
  description:
    "A cross-tab of the tracked materials against the six actors, counting the coded policy events in which each government has acted on each material. Derived entirely from coded records — no completeness claim.",
};

export default function ComparePage() {
  const { jurisdictions, rows, columnTotals } = getControlMatrix();
  const grandTotal = jurisdictions.reduce((s, j) => s + columnTotals[j], 0);

  return (
    <Container width="wide" className="py-12">
      <PageHeading
        index="—"
        eyebrow="Cross-cutting view"
        title="Comparative control matrix"
        lead="Each cell counts the coded policy events in which a government has acted on a material. It reads down the columns as a profile of each actor's posture, and across the rows as the contest over a single material. The count reflects events coded in this database, not a claim of completeness."
      />

      <Section className="mt-10">
        <div className="overflow-x-auto rounded-lg border border-border-strong plate">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Tracked materials (rows) by jurisdiction (columns). Each cell is the number of coded
              policy events in which that jurisdiction acted on that material.
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="sticky left-0 z-10 bg-plate px-4 py-3 text-left align-bottom">
                  <span className="rail">Material</span>
                </th>
                {jurisdictions.map((j) => (
                  <th key={j} scope="col" className="px-3 py-3 text-center align-bottom">
                    <Link
                      href={`/actors/${jurisdictionShort[j].toLowerCase()}`}
                      className="inline-flex flex-col items-center gap-1.5 hover:opacity-80"
                      title={jurisdictionLabels[j]}
                    >
                      <ActorMonogram code={jurisdictionShort[j]} size="sm" />
                    </Link>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right align-bottom">
                  <span className="rail">Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.material.id} className="border-b border-border/60 last:border-b-0">
                  <th scope="row" className="sticky left-0 z-10 bg-plate px-4 py-2.5 text-left font-normal">
                    <Link href={`/materials/${r.material.slug}`} className="text-foreground hover:text-accent">
                      {r.material.nameEn}
                    </Link>
                    {r.material.grouping ? (
                      <span className="ml-2 text-xs text-faint">{r.material.grouping}</span>
                    ) : null}
                  </th>
                  {jurisdictions.map((j) => {
                    const cell = r.byJurisdiction[j];
                    if (cell.count === 0)
                      return (
                        <td key={j} className="px-3 py-2.5 text-center text-faint" aria-label="no coded events">
                          <span aria-hidden>·</span>
                        </td>
                      );
                    const mechs = cell.mechanisms.map((m) => mechanismLabels[m]).join(", ");
                    const title = `${jurisdictionLabels[j]} · ${cell.count} event${cell.count > 1 ? "s" : ""} · ${mechs}${cell.latestDate ? ` · latest ${formatDate(cell.latestDate)}` : ""}`;
                    return (
                      <td key={j} className="px-3 py-2.5 text-center">
                        <span
                          title={title}
                          className="tnum inline-flex h-7 min-w-7 items-center justify-center rounded border border-accent/30 bg-accent/10 px-1.5 font-display text-sm font-semibold text-foreground"
                        >
                          {cell.count}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right">
                    <span className="tnum font-display font-semibold text-foreground">{r.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-strong">
                <th scope="row" className="sticky left-0 z-10 bg-plate px-4 py-3 text-left">
                  <span className="rail">Events per actor</span>
                </th>
                {jurisdictions.map((j) => (
                  <td key={j} className="px-3 py-3 text-center">
                    <span className="tnum font-display font-semibold text-accent">{columnTotals[j]}</span>
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <span className="tnum font-display font-semibold text-accent">{grandTotal}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-faint">
          A cell counts distinct coded events, so one measure covering several materials is counted
          once per material. Totals therefore exceed the raw event count. Hover a cell for the
          mechanisms and the most recent date. An empty cell means no coded event —{" "}
          <span className="text-muted">not</span> that no real-world measure exists. See the{" "}
          <Link href="/methodology" className="text-accent hover:text-accent-strong">
            methodology
          </Link>{" "}
          for how events, mechanisms and material scope are coded.
        </p>
      </Section>
    </Container>
  );
}
