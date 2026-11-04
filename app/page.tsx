import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import {
  getAllMaterials,
  getDatasetSummary,
} from "@/lib/data";
import { getInvestigationEntries } from "@/lib/research-experience";
import { LatticeOverview } from "@/components/lattice/lattice";
import { ElementStrip, SupplyChainStrip } from "@/components/home/supply-chain-strip";
import { HeroPlate } from "@/components/home/hero-plate";
import { chainStageCounts } from "@/lib/homepage-chain";
import { buildLatticeModel } from "@/lib/lattice";
import { formatDateLong } from "@/lib/format";
import { getFinancingCase, getLegalControlCase, getTungstenCase } from "@/lib/homepage-cases";
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

type AmountView = { qualifier: string | null; currency: string; value: string };
const amountText = (a: AmountView) => [a.qualifier, a.currency, a.value].filter(Boolean).join(" ");

/** One step of a worked case: a short label in the margin, the record beside it. */
function Step({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="grid gap-1 border-t border-border py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

/**
 * The overview answers, in order: what SMPT is for, three worked research uses drawn live from the records, where
 * to start a task of your own (the five journeys the header also uses), the broader browse views, and the evidence
 * standards and limits that govern all of it. Every status shown is read as of the curated revision.
 */
export default function Home() {
  const counts = getDatasetSummary();
  const investigations = getInvestigationEntries();
  const model = buildLatticeModel(site.lastUpdated);
  const legal = getLegalControlCase();
  const financing = getFinancingCase();
  const tungsten = getTungstenCase();
  const chain = chainStageCounts(model);
  const materials = getAllMaterials();
  const revision = formatDateLong(site.lastUpdated);
  const asOf = (
    <>
      as of the <time dateTime={site.lastUpdated}>{revision}</time> revision
    </>
  );

  return (
    <div data-flush-footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(datasetJsonLd()) }}
      />

      <Container width="wide" className="py-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="font-display text-sm text-muted">Strategic Materials Policy Tracker</p>
            <h1 className="mt-3 max-w-4xl font-serif text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              Understand what governments are doing about critical minerals, and what the evidence actually shows.
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-8 text-muted">
              Start from an announcement and follow it to the legal clause, the financing record, the industrial
              project and the original document. Each step keeps its own status, so a pledge is never read as a
              payment and a paused rule is never read as one in force.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#cases" className="research-button">
                See three worked cases
              </Link>
              <Link href="#start" className="research-button-secondary">
                Start your own question
              </Link>
            </div>
            <p className="mt-4 font-display text-sm text-muted">
              New research: <Link href="/research/tungsten-supply-security" className="text-foreground underline underline-offset-4 hover:text-accent">Tungsten Supply Security — Research Dossier 001</Link>.
            </p>
            <p className="mt-6 font-display text-xs text-muted">
              Research by <Link href="/about" className="underline underline-offset-4">Benjamin Yang</Link>.
            </p>
          </div>
          <aside aria-labelledby="scope-heading" className="relative self-end border-t border-border-strong pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <HeroPlate />
            <h2 id="scope-heading" className="font-display text-sm font-semibold">Scope and freshness</h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
              Curated revision: <time dateTime={site.lastUpdated}>{revision}</time>. Coverage is selective and
              uneven; these figures describe SMPT, not all government activity.
            </p>
            {/* Scope metadata at body size, not headline figures: what the corpus holds, read with the caveat above. */}
            <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-1.5 font-display text-sm leading-6">
              {[
                [counts.events, "policy events"],
                [counts.financialCommitments, "financial records"],
                [counts.projects, "registered projects"],
                [counts.projectMilestones, "reviewed industrial observations"],
              ].map(([count, label]) => (
                <div key={label} className="flex flex-row-reverse justify-end gap-1.5">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-foreground tnum">{count}</dd>
                </div>
              ))}
            </dl>
            <Link href="/coverage" className="mt-4 inline-block font-display text-sm text-accent underline underline-offset-4">
              Inspect coverage and gaps
            </Link>
          </aside>
        </div>
        <ElementStrip materials={materials} />
      </Container>

      <section className="border-t border-border">
        <Container width="wide" className="py-10 sm:py-12">
          <SupplyChainStrip chain={chain.chain} outside={chain.outside} asOf={asOf} />
        </Container>
      </section>

      <section id="cases" aria-labelledby="cases-heading" className="scroll-mt-20 border-t border-border-strong">
        <Container width="wide" className="py-10 sm:py-14">
          <h2 id="cases-heading" className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
            Three questions the records can answer
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Each case below is drawn from the published records, with statuses {asOf}. Every line opens the record
            it comes from.
          </p>

          {legal ? (
            <article aria-labelledby="case-legal-heading" className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-14">
              <div>
                <p className="font-display text-sm text-accent">Legal controls</p>
                <h3 id="case-legal-heading" className="mt-2 font-serif text-2xl leading-tight sm:text-[1.75rem]">
                  What does an export restriction actually cover, and is it in force?
                </h3>
                <p className="mt-4 text-base leading-7 text-muted">
                  A headline names a measure. The legal effect sits in individual clauses, each with its own covered
                  items, materials and status. Here one clause is traced from the measure to the issuing document.
                </p>
              </div>
              <div>
                <ol className="border-b border-border">
                  <Step label="Measure">
                    <Link href={`/events/${legal.event.id}`} className="font-serif text-lg leading-snug hover:text-accent">
                      {legal.event.titleEn}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      <time dateTime={legal.event.date}>{formatDateLong(legal.event.date)}</time>
                    </p>
                  </Step>
                  <Step label="Operative clause">
                    <Link href={`/controls/${legal.control.id}`} className="font-display text-base font-semibold hover:text-accent">
                      {legal.control.clause ?? "Single clause"}: export licensing
                    </Link>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      <span className="text-foreground">{legal.status.label}</span>
                      {legal.status.from ? (
                        <> from <time dateTime={legal.status.from}>{formatDateLong(legal.status.from)}</time></>
                      ) : null}{" "}
                      {asOf}. Covered items belong to {legal.stages.join(", ").toLowerCase()}.
                    </p>
                    {legal.control.productScopeAsStated ? (
                      <p lang="zh" className="mt-2 border-l-2 border-border-strong pl-3 text-sm leading-6 text-muted">
                        {legal.control.productScopeAsStated}
                      </p>
                    ) : null}
                  </Step>
                  <Step label="Materials">
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {legal.materials.map((m) => (
                        <li key={m.id}>
                          <Link href={`/materials/${m.slug}`} className="font-display text-sm underline decoration-border-strong underline-offset-4 hover:text-accent">
                            {m.nameEn}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Step>
                  <Step label="Original source">
                    <Link href={`/sources/${legal.source.id}`} className="font-display text-sm font-semibold hover:text-accent">
                      {legal.source.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{legal.source.publisher}; original in Chinese</p>
                  </Step>
                </ol>
                <div className="mt-6 border-l-2 border-accent pl-4">
                  <p className="font-display text-sm font-semibold">Not every later rule is in force</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    A later measure,{" "}
                    <Link href={`/events/${legal.later.event.id}`} className="text-foreground underline decoration-border-strong underline-offset-4 hover:text-accent">
                      {legal.later.event.titleEn}
                    </Link>
                    , extended licensing to some items made outside China. Its clause{" "}
                    <Link href={`/controls/${legal.later.control.id}`} className="text-foreground underline decoration-border-strong underline-offset-4 hover:text-accent">
                      {legal.later.control.clause}
                    </Link>{" "}
                    is <span className="text-foreground">{legal.later.status.label.toLowerCase()}</span>
                    {legal.later.status.from ? (
                      <> from <time dateTime={legal.later.status.from}>{formatDateLong(legal.later.status.from)}</time></>
                    ) : null}
                    {legal.later.status.until ? (
                      <> until <time dateTime={legal.later.status.until}>{formatDateLong(legal.later.status.until)}</time></>
                    ) : null}{" "}
                    {asOf}, under{" "}
                    <Link href={`/events/${legal.later.suspension.id}`} className="text-foreground underline decoration-border-strong underline-offset-4 hover:text-accent">
                      a separate suspension announcement
                    </Link>
                    . {legal.later.status.definition}
                  </p>
                </div>
              </div>
            </article>
          ) : null}

          {financing.length ? (
            <article aria-labelledby="case-finance-heading" className="mt-16 grid gap-8 border-t border-border-strong pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-14">
              <div>
                <p className="font-display text-sm text-accent">Public finance</p>
                <h3 id="case-finance-heading" className="mt-2 font-serif text-2xl leading-tight sm:text-[1.75rem]">
                  Has the money been promised, committed or paid?
                </h3>
                <p className="mt-4 text-base leading-7 text-muted">
                  Financing headlines mix announcements, approvals and payments. SMPT records each instrument with
                  the amount in the source&apos;s own words and a status history. These three sit at different
                  points; their amounts are never added together.
                </p>
                <Link href="/capital" className="research-text-link">
                  Browse public capital records
                </Link>
              </div>
              <ol className="border-b border-border">
                {financing.map((row) => (
                  <li key={row.commitment.id} className="border-t border-border py-5">
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      {row.status.label} {asOf}
                    </p>
                    <p className="mt-2 font-serif text-lg leading-snug">
                      <Link href={`/capital/${row.commitment.id}`} className="hover:text-accent">
                        {row.provider}: {row.instrument.toLowerCase()}, {amountText(row.amount)}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      For{" "}
                      <Link href={`/projects/${row.project.id}`} className="text-foreground underline decoration-border-strong underline-offset-4 hover:text-accent">
                        {row.project.name}
                      </Link>
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      <span className="text-foreground">{row.status.label}:</span> {row.status.definition}{" "}
                      {row.payment}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Source wording: <q className="text-foreground">{row.amount.asStated}</q>
                    </p>
                  </li>
                ))}
              </ol>
            </article>
          ) : null}

          {tungsten.length ? (
            <article aria-labelledby="case-tungsten-heading" className="mt-16 grid gap-8 border-t border-border-strong pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-14">
              <div>
                <p className="font-display text-sm text-accent">Comparison</p>
                <h3 id="case-tungsten-heading" className="mt-2 font-serif text-2xl leading-tight sm:text-[1.75rem]">
                  How are different governments trying to secure the same supply chain?
                </h3>
                <p className="mt-4 text-base leading-7 text-muted">
                  For tungsten, governments reach for different tools at different stages: a project designation,
                  public investment, a grant and export licensing. They are not equivalent measures, and sharing a
                  material does not make one a response to another. Records are listed by supply-chain stage, not
                  ranked; SMPT records what was decided, not whether it worked.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5">
                  <Link href="/materials/tungsten" className="research-text-link">
                    Tungsten profile
                  </Link>
                  <Link href="/events?material=tungsten" className="research-text-link">
                    All tungsten events
                  </Link>
                </div>
              </div>
              <ol className="border-b border-border">
                {tungsten.map((entry) => (
                  <li key={entry.id} className="grid gap-1 border-t border-border py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
                    <div>
                      <p className="font-display text-sm font-semibold">{entry.jurisdiction}</p>
                      <p className="font-display text-xs text-muted">{entry.stages.join(", ")}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        {entry.lever} · {entry.status} {asOf}
                      </p>
                      <p className="mt-1.5 text-base leading-snug">
                        <Link href={entry.href} className="hover:text-accent">
                          {entry.title}
                        </Link>
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        <time dateTime={entry.date}>{formatDateLong(entry.date)}</time>
                        {entry.detail.project ? (
                          <>
                            {" · "}
                            <Link href={`/projects/${entry.detail.project.id}`} className="text-foreground underline decoration-border-strong underline-offset-4 hover:text-accent">
                              {entry.detail.project.name}
                            </Link>
                          </>
                        ) : null}
                        {entry.detail.amount ? <> · {amountText(entry.detail.amount)} as stated</> : null}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ) : null}
        </Container>
      </section>

      <section id="start" aria-labelledby="journeys-heading" className="scroll-mt-20 bg-paper text-paper-foreground">
        <Container width="wide" className="py-10 sm:py-14">
          <h2 id="journeys-heading" className="font-serif text-3xl font-medium leading-tight">
            Start your own question
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-paper-muted">
            Pick the kind of evidence you need. Each starting point opens a filterable view of the records.
          </p>
          <ol className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
            {journeys.map((j) => (
              <li key={j.href} className="min-w-0 border-t border-paper-border pt-4">
                <Link href={j.href} className="font-display text-base font-semibold text-paper-foreground underline decoration-paper-border underline-offset-4 hover:decoration-current">
                  {j.label}
                </Link>
                <p className="mt-2 text-[0.9375rem] leading-6 text-paper-muted">{j.question}</p>
                {j.views.length > 1 ? (
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-display text-xs text-paper-muted">
                    {j.views
                      .filter((v) => v.href !== j.href)
                      .map((v) => (
                        <li key={v.href}>
                          <Link href={v.href} className="underline decoration-paper-border underline-offset-4 hover:text-paper-foreground">
                            {v.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>

          {investigations.length ? (
            <div className="mt-12 border-t border-paper-border pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-serif text-2xl font-medium">Or open a worked project question</h3>
                <Link href="/projects" className="font-display text-sm text-paper-accent underline underline-offset-4">
                  Browse project investigations
                </Link>
              </div>
              <div className="mt-6 grid gap-8 md:grid-cols-3">
                {investigations.map((entry) => (
                  <article key={entry.id}>
                    <h4 className="font-serif text-xl leading-tight">
                      <Link href={entry.href} className="hover:underline">
                        {entry.question}
                      </Link>
                    </h4>
                    <p className="mt-3 text-base leading-7 text-paper-muted">{entry.description}</p>
                    <Link href={entry.href} className="mt-3 inline-block font-display text-sm font-medium text-paper-accent underline underline-offset-4">
                      {entry.name}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      <section id="browse" aria-label="Browse by material and stage" className="scroll-mt-20">
      <Container width="wide" className="py-10 sm:py-14">
        <LatticeOverview model={model} preferred={{ slug: "gallium", stage: "processing" }} intro={<>
          <h2 className="font-serif text-2xl font-medium leading-tight">Browse by material and stage</h2>
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
      </section>

      <section aria-labelledby="standards-heading" className="border-t border-border">
        <Container width="wide" className="grid gap-8 py-10 sm:py-14 md:grid-cols-3">
          <div>
            <h2 id="standards-heading" className="font-serif text-2xl">Evidence standards and limits</h2>
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
              What SMPT does not do
            </h3>
            <p className="mt-3 text-base leading-7 text-muted">
              No price forecasts, risk scores or effectiveness ratings, and no totals across unlike instruments.
              Coverage is selective; a missing record is not evidence that nothing happened.
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
