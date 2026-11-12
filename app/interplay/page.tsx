import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { InterplayChronology, MaterialInterplayMatrix } from "@/components/capital/charts";
import { InterplayChronologyList } from "@/components/capital/chronology-list";
import { JurisdictionTag } from "@/components/labels";
import { InlineAmount, ProviderTag } from "@/components/capital/rows";
import { ControlStatusBadge } from "@/components/capital/primitives";
import { StageResponseMap } from "@/components/intelligence/response-map";
import {
  commitmentActor,
  controlIssuer,
  controlStatusOn,
  currentControlEntry,
  isEnded,
  materialLedgerRows,
} from "@/lib/capital-control";
import { getAllControlMeasures, getAllMaterials } from "@/lib/data";
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
  const money = materialLedgerRows(materialId);
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
            <time className="tnum w-24 shrink-0 font-display text-xs text-faint">{it.date ? formatDate(it.date) : "—"}</time>
            <JurisdictionTag code={controlIssuer(it.m)} />
            <Link href={`/controls/${it.m.id}`} className="min-w-0 flex-1 basis-48 md:basis-0 hover:text-accent">
              <span aria-hidden className="mr-1.5 inline-block h-2 w-2 bg-mark-control" />
              {controlMeasureTypeLabels[it.m.measureType]}
              {it.m.clause ? <span className="text-muted"> · {it.m.clause}</span> : null}
            </Link>
            <ControlStatusBadge status={controlStatusOn(it.m, asOf) ?? currentControlEntry(it.m).status} />
          </li>
        ) : (
          <li key={it.c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <time className="tnum w-24 shrink-0 font-display text-xs text-faint">{it.date ? formatDate(it.date) : "—"}</time>
            <ProviderTag code={commitmentActor(it.c)} />
            <Link href={`/capital/${it.c.id}`} className="min-w-0 flex-1 basis-48 md:basis-0 hover:text-accent">
              <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-mark-commitment" />
              {financialInstrumentLabels[it.c.instrument]}
              {it.c.valueRole !== "commitment" ? (
                <span className="text-faint"> · {valueRoleLabels[it.c.valueRole].toLowerCase()}</span>
              ) : null}
              <span className="text-muted"> · {it.c.recipient ?? it.c.provider}</span>
              {isEnded(it.c) ? <span className="text-faint"> · ended</span> : null}
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
        title="Capital × Control"
        lead="Government financing and control measures by date, material and supply-chain stage. A causal relationship requires explicit supporting evidence."
      />
      <div className="mt-12 space-y-14">
        <Section title="Chronology by actor" description="Every dated status change of a financial row (circle) and a control clause (square).">
          <InterplayChronology asOf={asOf} />
          <div className="mt-8">
            <InterplayChronologyList />
          </div>
        </Section>

        <Section title="Material by actor" description={`Financial rows provided that have not ended (a package counts once; a withdrawn or lapsed row is left out, and a funding option is a row of its own, not an exercise) and control clauses issued, per material, with clauses in force on ${formatDate(asOf)}. Counts are of recorded instruments.`}>
          <MaterialInterplayMatrix asOf={asOf} />
        </Section>

        <Section
          title="Material by supply-chain stage"
          description={`Where government capital is aimed and where control clauses' covered items sit, stage by stage, with statuses on ${formatDate(asOf)}. Counts are of recorded instruments. A clause's stage is where its items belong, not a claim that it restricts that stage.`}
          note={{ label: "Clauses not placed", body: "Separation technology sits at separation. Clauses that define no items of their own (end-use, customs, divestiture, suspension) are not placed." }}
        >
          <StageResponseMap asOf={asOf} />
        </Section>

        <Section title="Material ledgers" description="For each material, its controls and its top-level financial rows in date order. A row that withdrew or lapsed is marked ended."
          note={{ label: "How packages are folded", body: "A part is folded into its package only when that package is listed here in the same state. An ended row never hides a part that still stands." }}>
          <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
            {materials.map((m) => (
              <div key={m.id} className="border-t border-border-strong pt-4">
                <h3 className="mb-3 font-display text-lg font-semibold">
                  <Link href={`/materials/${m.slug}`} className="hover:text-accent">{m.nameEn}</Link>
                </h3>
                <MaterialLedger materialId={m.id} asOf={asOf} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </Container>
  );
}
