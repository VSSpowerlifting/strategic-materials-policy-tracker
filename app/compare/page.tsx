import type { Metadata } from "next";
import Link from "next/link";

import { Container, PageHeading, Section } from "@/components/ui/container";
import { CompareMatrix } from "@/components/compare-matrix";
import { getControlMatrix } from "@/lib/data";

export const metadata: Metadata = {
  title: "Comparative matrix",
  description:
    "A cross-tab of the tracked materials against the tracked actors, counting the coded policy events in which each government has acted on each material. Derived entirely from coded records — no completeness claim.",
};

export default function ComparePage() {
  const { jurisdictions, rows, columnTotals } = getControlMatrix();

  return (
    <Container width="wide" className="py-12">
      <PageHeading
        index="—"
        eyebrow="Cross-cutting view"
        title="Comparative control matrix"
        lead="Each cell counts the coded policy events in which a government has acted on a material. It reads down the columns as a profile of each actor's posture, and across the rows as the contest over a single material. The count reflects events coded in this database, not a claim of completeness."
      />

      <Section className="mt-10">
        <CompareMatrix jurisdictions={jurisdictions} rows={rows} columnTotals={columnTotals} />

        <p className="mt-4 max-w-3xl text-sm leading-6 text-faint">
          A cell counts distinct coded events, so one measure covering several materials is counted
          once per material. Totals therefore exceed the raw event count. Select a cell for its
          mechanisms, its most recent measure and the events behind the count. An empty cell means
          no coded event —{" "}
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
