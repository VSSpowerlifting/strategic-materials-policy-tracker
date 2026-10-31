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
import { journeys, site } from "@/lib/site";
import { datasetJsonLd, jsonLdScript } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "How governments reshape strategic-material supply chains",
  description:
    "Comparative economic-security research on industrial policy, trade controls, public finance and reported activity in strategic-material supply chains, with source-linked evidence.",
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.name,
    description:
      "Compare government policy, legal controls, financing and reported industrial activity through source-linked evidence.",
  },
};

/**
 * The overview answers, in order: what SMPT researches, what a reader can investigate (the five journeys the
 * header also uses), a worked example to open right away, then the material-by-stage lattice for readers who
 * prefer to browse. Scope and freshness sit beside the opening so no figure appears without its qualification.
 */
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
      <Container width="wide" className="py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="font-display text-sm text-muted">Strategic materials, government action</p>
            <h1 className="mt-3 max-w-3xl font-serif text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl">
              How governments reshape strategic-material supply chains.
            </h1>
            <p className="mt-5 max-w-2xl font-serif text-lg leading-8 text-muted">
              SMPT records what governments decide about rare earths and adjacent materials — export controls,
              industrial policy, public finance and stockpiling — as structured, source-linked records. Compare
              them across governments and supply-chain stages, and follow each claim to the document that makes it.
            </p>
            <p className="mt-5 font-display text-xs text-muted">
              Research by <Link href="/about" className="underline underline-offset-4">Benjamin Yang</Link>.
            </p>
          </div>
          <aside aria-labelledby="scope-heading" className="self-end border-t border-border-strong pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 id="scope-heading" className="font-display text-sm font-semibold">Scope and freshness</h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
              Curated revision:{" "}
              <time dateTime={site.lastUpdated}>{formatDateLong(site.lastUpdated)}</time>. Individual records
              have their own source and review dates. Coverage is selective and uneven; these figures describe
              SMPT, not all government activity.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
              {[
                [counts.events, "policy events"],
                [counts.financialCommitments, "financial instruments"],
                [counts.projects, "registered projects"],
                [counts.projectMilestones, "reviewed industrial observations"],
              ].map(([count, label]) => (
                <div key={label} className="flex flex-col-reverse border-l border-border pl-3">
                  <dt className="mt-1 font-display text-xs leading-5 text-muted">{label}</dt>
                  <dd className="font-display text-2xl font-medium tnum">{count}</dd>
                </div>
              ))}
            </dl>
            <Link href="/coverage" className="mt-4 inline-block font-display text-sm text-accent underline underline-offset-4">
              Inspect coverage and gaps
            </Link>
          </aside>
        </div>

        <section aria-labelledby="journeys-heading" className="mt-14 border-t border-border-strong pt-6">
          <h2 id="journeys-heading" className="font-display text-base font-semibold">What you can investigate</h2>
          <ol className="mt-5 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
            {journeys.map((j) => (
              <li key={j.href} className="min-w-0 border-t border-border pt-4">
                <Link href={j.href} className="font-display text-base font-semibold text-foreground hover:text-accent">
                  {j.label}
                </Link>
                <p className="mt-2 text-[0.9375rem] leading-6 text-muted">{j.question}</p>
                {j.views.length > 1 ? (
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-display text-xs text-muted">
                    {j.views
                      .filter((v) => v.href !== j.href)
                      .map((v) => (
                        <li key={v.href}>
                          <Link href={v.href} className="underline decoration-border-strong underline-offset-4 hover:text-foreground">
                            {v.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </Container>

      {investigations.length ? (
        <section aria-labelledby="examples-heading" className="bg-paper text-paper-foreground">
          <Container width="wide" className="py-10 sm:py-14">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="examples-heading" className="font-serif text-3xl font-medium">
                Try a worked question
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
          </Container>
        </section>
      ) : null}

      <Container width="wide" className="py-10 sm:py-14">
        <LatticeOverview model={model} preferred={{ slug: "gallium", stage: "processing" }} intro={<>
          <h2 className="font-serif text-2xl font-medium leading-tight">Or browse by material and stage</h2>
          <p className="mt-3 text-[0.9375rem] leading-7 text-muted">
            Marks show which kinds of record the corpus holds for a material at each supply-chain stage. Select a
            marked cell to read the records behind it.
          </p>
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

      <section aria-labelledby="difference-heading" className="border-t border-border">
        <Container width="wide" className="grid gap-8 py-10 sm:py-14 md:grid-cols-3">
          <div>
            <h2 id="difference-heading" className="font-serif text-2xl">Records, not articles</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Each measure, financial instrument and control clause is its own record with a status history and
              a source for every field, so it can be filtered, compared and cited on its own terms.
            </p>
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">
              Evidence kept in layers
            </h3>
            <p className="mt-3 text-base leading-7 text-muted">
              A government&apos;s rationale, a legal obligation, a financing approval and a reported construction
              milestone answer different questions. Official framing keeps its quoted anchor and translation
              provenance; issuer claims keep their attribution.
            </p>
            <Link href="/methodology" className="research-text-link">
              Read the methodology
            </Link>
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">
              Built to reuse
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
      </section>
    </div>
  );
}
