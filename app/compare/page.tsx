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
        eyebrow="Compare"
        title="Different tools. The same material."
        lead="Compare what governments have documented: the instruments they use, the legal and financial states their sources support, and the rationale they give. Record counts measure this corpus's coverage, not effectiveness."
      />
      {control && controlEvent && support && supportEvent ? (
        <section
          className="mt-9 rounded border border-border-strong bg-card p-5 sm:p-7"
          aria-labelledby="guided-comparison"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2
                id="guided-comparison"
                className="font-serif text-3xl leading-tight"
              >
                Gallium: licensing exports and supporting recovery
              </h2>
              <p className="mt-4 text-base leading-7 text-muted">
                Two documented approaches to gallium supply chains. These
                records differ in date, scope and legal character. Their
                juxtaposition does not establish that one caused the other.
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
                <p className="mt-2 font-display text-sm text-accent">
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
                <p className="mt-2 font-display text-sm text-accent">
                  Financial state:{" "}
                  {financialStatusLabels[currentFinancialStatus(support)]}
                </p>
                <p className="mt-3 text-base leading-7">
                  {support.amount?.amountAsStated ?? "Amount not stated"}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  This project-level instrument sits in the US–Australia
                  framework record. An announced financial state does not
                  establish execution or payment. Offtake rights and US support
                  remain separate instruments.
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
            are not summed. Official rationale is separately quoted on the{" "}
            <Link href="/framing" className="text-accent underline">
              framing comparison
            </Link>
            .
          </p>
        </section>
      ) : null}
      <Section
        className="mt-12"
        title="Compare policy coverage by material and government"
        description="Choose a populated cell to see the mechanisms, latest event and filtered policy records behind it. Compare within a material, then inspect the sources before drawing a substantive conclusion."
      >
        <p className="mb-5 max-w-3xl text-sm leading-7 text-muted">
          The cells count distinct coded policy events, not financial values,
          legal strength or industrial outcomes. A multi-material event appears
          in multiple rows; totals overlap. An empty cell means no coded event,
          not no real-world activity.
        </p>
        <CompareMatrix
          jurisdictions={jurisdictions}
          rows={rows}
          columnTotals={columnTotals}
        />
        <p className="mt-4 text-sm leading-7 text-muted">
          For complementary evidence:{" "}
          <Link href="/framing" className="text-accent underline">
            compare quoted government rationale
          </Link>
          {" · "}
          <Link href="/interplay" className="text-accent underline">
            align capital and controls
          </Link>
          {" · "}
          <Link href="/portfolios" className="text-accent underline">
            inspect government portfolios
          </Link>
          . These views answer different questions and retain their own coverage
          and counting rules.
        </p>
      </Section>
      <Section
        className="mt-14"
        title="Advanced view: materials by supply-chain stage"
        description="The lattice retains separate encodings for government commitments, control clauses and designations. Records can occupy multiple stages. This is a structural view, not an impact or capital total."
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
    </Container>
  );
}
