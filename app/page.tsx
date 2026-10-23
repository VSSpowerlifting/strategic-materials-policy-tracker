import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import {
  getAllMaterials,
  getDatasetSummary,
} from "@/lib/data";
import { getInvestigationEntries } from "@/lib/research-experience";
import { LatticeOverview } from "@/components/lattice/lattice";
import { buildLatticeModel } from "@/lib/lattice";
import { formatDateLong } from "@/lib/format";
import { site } from "@/lib/site";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "From government policy to industrial reality",
  description:
    "Investigate how governments use legal controls, public finance and industrial intervention to reshape strategic-material supply chains, and what the evidence establishes.",
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.name,
    description:
      "Government policy, financial support and industrial implementation, traced to their sources.",
  },
};

export default function Home() {
  const counts = getDatasetSummary();
  const investigations = getInvestigationEntries();
  const model = buildLatticeModel(site.lastUpdated);
  return (
    <div data-flush-footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }}
      />
      <Container width="wide" className="py-7 sm:py-9">
        <LatticeOverview model={model} preferred={{ slug: "gallium", stage: "processing" }} intro={<>
          <p className="font-display text-sm text-muted">Strategic materials, government action</p>
          <h1 className="mt-3 font-serif text-[2rem] font-semibold sm:text-[2.5rem] leading-[1.1] tracking-tight">From policy to industrial evidence.</h1>
          <p className="mt-4 font-serif text-base leading-7 text-muted">Trace legal controls, public finance and reported project activity to the evidence behind each claim.</p>
          <p className="mt-4 font-display text-xs text-muted">Research by <Link href="/about" className="underline underline-offset-4">Benjamin Yang</Link>.</p>
        </>} />
        <div className="mt-8 border-t border-border-strong pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-semibold">
              Start with a material
            </h2>
            <Link
              href="/actors"
              className="font-display text-sm text-muted underline underline-offset-4"
            >
              Or browse by government
            </Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {getAllMaterials().map((m) => (
              <li key={m.id}>
                <Link
                  href={`/events?material=${m.id}`}
                  className="material-entry"
                >
                  {m.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <section className="bg-paper text-paper-foreground">
        <Container width="wide" className="py-10 sm:py-14">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-3xl font-medium">
              Questions worth following
            </h2>
            <Link
              href="/projects"
              className="font-display text-sm text-paper-accent underline underline-offset-4"
            >
              Browse project investigations
            </Link>
          </div>
          <div className="mt-7 grid gap-8 md:grid-cols-3">
            {investigations.map((entry) => (
              <article
                key={entry.id}
                className="border-t border-paper-border pt-5"
              >
                <h3 className="font-serif text-2xl leading-tight">
                  <Link href={entry.href} className="hover:underline">
                    {entry.question}
                  </Link>
                </h3>
                <p className="mt-3 text-base leading-7 text-paper-muted">
                  {entry.description}
                </p>
                <Link
                  href={entry.href}
                  className="mt-4 inline-block font-display text-sm font-medium text-paper-accent underline underline-offset-4"
                >
                  {entry.name}
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-12 grid gap-8 border-t border-paper-border pt-8 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="font-serif text-2xl">A bounded, citable corpus</h2>
              <p className="mt-3 max-w-prose text-sm leading-7 text-paper-muted">
                Curated revision:{" "}
                <time dateTime={site.lastUpdated}>
                  {formatDateLong(site.lastUpdated)}
                </time>
                . Individual records have their own source and review dates.
                Coverage is selective and uneven; these figures describe SMPT,
                not all government activity.
              </p>
              <Link
                href="/coverage"
                className="mt-3 inline-block font-display text-sm text-paper-accent underline underline-offset-4"
              >
                Inspect coverage and gaps
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[
                [counts.events, "policy events"],
                [counts.financialCommitments, "financial instruments"],
                [counts.projects, "registered projects"],
                [counts.projectMilestones, "reviewed industrial observations"],
              ].map(([count, label]) => (
                <div key={label} className="border-l border-paper-border pl-4">
                  <dd className="font-display text-3xl font-medium tnum">
                    {count}
                  </dd>
                  <dt className="mt-2 font-display text-xs leading-5 text-paper-muted">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>
      <Container
        width="wide"
        className="grid gap-8 py-10 sm:py-14 md:grid-cols-3"
      >
        <div>
          <h2 className="font-serif text-2xl">Read the evidence in layers</h2>
          <p className="mt-3 text-base leading-7 text-muted">
            A government&apos;s rationale, a legal obligation and a reported
            construction milestone answer different questions.
          </p>
        </div>
        <div>
          <h3 className="font-display text-base font-semibold">
            Check the claim at its source
          </h3>
          <p className="mt-3 text-base leading-7 text-muted">
            Records link to original documents. Official framing retains quoted
            anchors and translation provenance; issuer claims retain their
            attribution.
          </p>
          <Link href="/methodology" className="research-text-link">
            Read the methodology
          </Link>
        </div>
        <div>
          <h3 className="font-display text-base font-semibold">
            Build on the research
          </h3>
          <p className="mt-3 text-base leading-7 text-muted">
            Inspect field-level references, cite a policy record, or reuse
            structured CSV and JSON data with the same qualifications.
          </p>
          <Link href="/data" className="research-text-link">
            Downloads, citations and API
          </Link>
        </div>
      </Container>
    </div>
  );
}
