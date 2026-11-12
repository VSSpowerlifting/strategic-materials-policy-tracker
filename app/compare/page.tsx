import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { CompareMatrix } from "@/components/compare-matrix";
import { LatticeCompare } from "@/components/lattice/lattice";
import { SourceMention } from "@/components/capital/primitives";
import {
  getControlMatrix,
  getControlMeasureById,
  getEventById,
  getFinancialCommitmentById,
} from "@/lib/data";
import { buildLatticeModel } from "@/lib/lattice";
import { controlStatusOn, currentFinancialStatus } from "@/lib/capital-control";
import { controlStatusLabels, financialStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compare government approaches",
  description:
    "Compare documented policy approaches by material and government, inspect the records behind each count, and distinguish legal controls from financial support and official rationale.",
};

export default function ComparePage() {
  const { jurisdictions, rows, columnTotals } = getControlMatrix();
  const control = getControlMeasureById("ctl-cn-gage-2023-export-licensing");
  const support = getFinancialCommitmentById(
    "fin-au-alcoa-sojitz-gallium-2025-equity",
  );
  const controlEvent = control && getEventById(control.eventId);
  const supportEvent = support && getEventById(support.eventId);
  const legalStatus = control && controlStatusOn(control, site.lastUpdated);
  return (
    <Container width="wide" className="py-12">
      <PageHeading
        title="Compare"
        lead="Compare government measures, financing and projects by material and supply-chain stage."
      />
      <Section
        className="mt-14"
        title="Materials by supply-chain stage"
        description="Counts for financial commitments, control clauses and project designations, shown separately."
      >
        <LatticeCompare
          model={buildLatticeModel(site.lastUpdated)}
          preferred={{ slug: "gallium", stage: "processing" }}
        />
        <Link
          href="/methodology#capital-counting"
          className="research-text-link"
        >
          Read the financial and coverage rules
        </Link>
      </Section>
      {control && controlEvent && support && supportEvent ? (
        <section
          className="mt-12 border-y border-border-strong py-7"
          aria-labelledby="guided-comparison"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2
                id="guided-comparison"
                className="font-display text-2xl font-semibold leading-tight tracking-tight"
              >
                Gallium: licensing exports and supporting recovery
              </h2>
              <p className="mt-4 text-base leading-7 text-muted">
                China’s gallium export licensing and Australia’s project support differ in timing, scope and legal status. Any causal relationship between them would require separate evidence.
              </p>
              <Link
                href="/events?material=gallium"
                className="research-text-link"
              >
                Inspect all coded gallium policy events
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <article>
                <h3 className="font-display text-lg font-semibold">
                  China: export licensing
                </h3>
                <p className="mt-2 font-display text-sm text-foreground">
                  Clause status:{" "}
                  {legalStatus
                    ? controlStatusLabels[legalStatus]
                    : "Not established at this date"}
                </p>
                <Link
                  href={`/events/${controlEvent.id}`}
                  className="mt-3 block text-base leading-7 hover:underline"
                >
                  {controlEvent.titleEn}
                </Link>
                <p className="mt-3 text-sm leading-6 text-muted">
                  A legal clause is distinct from the broader event&apos;s
                  status. Read covered items, exemptions and the status history
                  in the clause record.
                </p>
                <Link
                  href={`/controls/${control.id}`}
                  className="research-text-link"
                >
                  Read the operative clause
                </Link>
                <div className="mt-3">
                  <SourceMention
                    sourceId={control.statusHistory.at(-1)!.sourceId}
                  />
                </div>
              </article>
              <article>
                <h3 className="font-display text-lg font-semibold">
                  Australia: equity support
                </h3>
                <p className="mt-2 font-display text-sm text-foreground">
                  Financial state:{" "}
                  {financialStatusLabels[currentFinancialStatus(support)]}
                </p>
                <p className="mt-3 text-base leading-7">
                  {support.amount?.amountAsStated ?? "Amount not stated"}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  This project-level instrument sits in the US–Australia
                  framework record. Its published status is announced; execution
                  and payment require later evidence. Offtake rights and US
                  support are recorded separately.
                </p>
                <Link
                  href={`/capital/${support.id}`}
                  className="research-text-link"
                >
                  Read the financial instrument
                </Link>
                <div className="mt-3">
                  <SourceMention
                    sourceId={support.financialStatusHistory.at(-1)!.sourceId}
                  />
                </div>
                <Link
                  href={`/projects/${support.projectId}`}
                  className="research-text-link"
                >
                  Follow the Wagerup project evidence
                </Link>
              </article>
            </div>
          </div>
          <p className="mt-6 border-t pt-4 text-sm leading-7 text-muted">
            Status basis: corpus revised {formatDate(site.lastUpdated)}. Amounts
            keep their source-stated currencies and qualifiers; these examples
            appear separately. Official rationale is quoted on the{" "}
            <Link href="/framing" className="link-quiet">
              framing comparison
            </Link>
            .
          </p>
        </section>
      ) : null}
      <Section
        className="mt-12"
        title="Policy coverage by material and government"
      >
        <p className="mb-5 max-w-3xl text-sm leading-7 text-muted">
          The cells count distinct coded policy events. Financial value, legal
          strength and industrial outcomes require separate evidence. A
          multi-material event appears in each relevant row, so row totals
          overlap. An empty cell indicates a gap in this coded corpus.
        </p>
        <CompareMatrix
          jurisdictions={jurisdictions}
          rows={rows}
          columnTotals={columnTotals}
        />
        <p className="mt-4 text-sm leading-7 text-muted">
          Related:{" "}
          <Link href="/framing" className="link-quiet">
            quoted government rationale
          </Link>
          {" · "}
          <Link href="/interplay" className="link-quiet">
            capital and controls
          </Link>
          {" · "}
          <Link href="/portfolios" className="link-quiet">
            government portfolios
          </Link>
          . Each view keeps its own coverage and counting rules.
        </p>
      </Section>

    </Container>
  );
}
