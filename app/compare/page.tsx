import type { Metadata } from "next";
import Link from "next/link";

import { Container, Section } from "@/components/ui/container";
import { CompareMatrix } from "@/components/compare-matrix";
import { LatticeCompare } from "@/components/lattice/lattice";
import { getControlMatrix } from "@/lib/data";
import { buildLatticeModel } from "@/lib/lattice";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compare: materials by stage",
  description:
    "Where the record places government commitments, control clauses and designations, material by material and stage by stage. Each kind is counted apart and never added to another; control clauses that record no stage cannot appear on the lattice. Below it, the earlier cross-tab of coded policy events by material and government.",
};

const PREFERRED = { slug: "tungsten", stage: "processing" } as const;

export default function ComparePage() {
  const model = buildLatticeModel(site.lastUpdated);
  const { jurisdictions, rows, columnTotals } = getControlMatrix();

  return (
    <>
      <div className="bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <p className="font-display text-xs text-muted">Compare · Materials by stage</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">Materials by supply-chain stage</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted">
            Where the record places government commitments, control clauses and designations, material by material and stage by stage. Each kind is counted apart and never added to
            another.
          </p>
        </div>
      </div>

      <LatticeCompare model={model} preferred={PREFERRED} />

      <Container width="wide" className="py-14">
        <Section
          title="Coded policy events by material and government"
          description="The earlier cross-tab. Each cell counts the coded policy events in which a government has acted on a material. It reads down the columns as a profile of each actor's posture, and across the rows as the contest over a single material. The count reflects events coded in this database, not a claim of completeness."
        >
          <CompareMatrix jurisdictions={jurisdictions} rows={rows} columnTotals={columnTotals} />

          <p className="mt-4 max-w-3xl text-sm leading-6 text-faint">
            A cell counts distinct coded events, so one measure covering several materials is counted once per material. Totals therefore exceed the raw event count. Select a cell for its
            mechanisms, its most recent measure and the events behind the count. An empty cell means no coded event — <span className="text-muted">not</span> that no real-world measure exists.
            See the{" "}
            <Link href="/methodology" className="text-accent hover:text-accent-strong">
              methodology
            </Link>{" "}
            for how events, mechanisms and material scope are coded.
          </p>
        </Section>
      </Container>
    </>
  );
}
