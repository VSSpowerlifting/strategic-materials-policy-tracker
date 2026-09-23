import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { InterplayChronology, MaterialInterplayMatrix } from "@/components/capital/charts";
import { JurisdictionTag } from "@/components/labels";
import { InlineAmount, ProviderTag } from "@/components/capital/rows";
import { ControlStatusBadge } from "@/components/capital/primitives";
import {
  commitmentActor,
  controlIssuer,
  controlStatusOn,
  currentControlEntry,
} from "@/lib/capital-control";
import { getAllControlMeasures, getAllFinancialCommitments, getAllMaterials } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { controlMeasureTypeLabels, financialInstrumentLabels, valueRoleLabels } from "@/lib/labels";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Capital × Control",
  description:
    "How money and restrictions meet on the same strategic materials: a dated chronology of financial and control status changes by actor, and a material-by-actor matrix of commitments and control clauses.",
};

/**
 * Per material, the controls and the money side by side, in date order. It
 * states only what the records hold — dates, instruments, statuses — and
 * draws no causal link between them: a source would have to state one.
 */
function MaterialLedger({ materialId, asOf }: { materialId: string; asOf: string }) {
  const controls = getAllControlMeasures().filter((m) => m.materialIds.includes(materialId));
  const money = getAllFinancialCommitments().filter((c) => c.materialIds.includes(materialId) && !c.relationships.some((r) => r.relationship === "part_of"));
  const firstDate = (h: { date: string | null }[]) => h.find((e) => e.date)?.date ?? null;
  const items = [
    ...controls.map((m) => ({ kind: "control" as const, date: firstDate(m.statusHistory), m })),
    ...money.map((c) => ({ kind: "capital" as const, date: firstDate(c.financialStatusHistory), c })),
  ].sort((a, b) => ((a.date ?? "9999") < (b.date ?? "9999") ? -1 : 1));
  return (
    <ol className="space-y-2">
      {items.map((it) =>
        it.kind === "control" ? (
          <li key={it.m.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <time className="tnum w-24 shrink-0 font-mono text-xs text-faint">{it.date ? formatDate(it.date) : "—"}</time>
            <JurisdictionTag code={controlIssuer(it.m)} />
            <Link href={`/controls/${it.m.id}`} className="min-w-0 flex-1 hover:text-accent">
              <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-[1px] bg-[#C77B7B]" />
              {controlMeasureTypeLabels[it.m.measureType]}
              {it.m.clause ? <span className="text-muted"> · {it.m.clause}</span> : null}
            </Link>
            <ControlStatusBadge status={controlStatusOn(it.m, asOf) ?? currentControlEntry(it.m).status} />
          </li>
        ) : (
          <li key={it.c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <time className="tnum w-24 shrink-0 font-mono text-xs text-faint">{it.date ? formatDate(it.date) : "—"}</time>
            <ProviderTag code={commitmentActor(it.c)} />
            <Link href={`/capital/${it.c.id}`} className="min-w-0 flex-1 hover:text-accent">
              <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#CBA86A]" />
              {financialInstrumentLabels[it.c.instrument]}
              {it.c.valueRole !== "commitment" ? (
                <span className="text-faint"> · {valueRoleLabels[it.c.valueRole].toLowerCase()}</span>
              ) : null}
              <span className="text-muted"> · {it.c.recipient ?? it.c.provider}</span>
            </Link>
            <InlineAmount amount={it.c.amount} />
          </li>
        ),
      )}
    </ol>
  );
}

export default function InterplayPage() {
  const asOf = site.lastUpdated;
  const featured = ["rare-earth-elements", "gallium", "antimony", "graphite", "tungsten", "ndfeb-magnets"];
  const materials = getAllMaterials().filter((m) => featured.includes(m.id));
  return (
    <Container className="py-12">
      <PageHeading
        index="01"
        eyebrow="Money meets restriction"
        title="Capital × Control"
        lead="Controls and capital are recorded separately because they answer different questions. This page puts them on one clock and one grid, so you can see which governments restrict and which pay, on which materials, and in what order. It shows sequence, never causation: no link between a control and a financing is drawn unless a source states it."
      />
      <div className="mt-12 space-y-14">
        <Section index="01" title="Chronology by actor" description="Every dated status change of a financial row (circle) and a control clause (square). Select a mark for its record.">
          <InterplayChronology asOf={asOf} />
        </Section>

        <Section index="02" title="Material by actor" description={`Financial rows provided (a package counts once) and control clauses issued, per material, with clauses in force on ${formatDate(asOf)}. Record counts, never money.`}>
          <MaterialInterplayMatrix asOf={asOf} />
        </Section>

        <Section index="03" title="Material ledgers" description="For each material, its controls and its top-level financial rows in date order. Parts of packages are folded into their package.">
          <div className="grid gap-4 lg:grid-cols-2">
            {materials.map((m) => (
              <Card key={m.id} className="p-5">
                <h3 className="mb-3 font-display text-lg font-semibold">
                  <Link href={`/materials/${m.slug}`} className="hover:text-accent">{m.nameEn}</Link>
                </h3>
                <MaterialLedger materialId={m.id} asOf={asOf} />
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </Container>
  );
}
