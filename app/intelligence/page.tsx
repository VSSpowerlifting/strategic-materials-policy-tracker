import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageContents, PageHeading, Section } from "@/components/ui/container";
import { InquiryLink } from "@/components/inquiry-link";
import { buildControlsSnapshotBundle } from "@/lib/controls-snapshot";
import { controlIssuer } from "@/lib/capital-control";
import { getAllControlMeasures, getAllJurisdictions, getDatasetSummary } from "@/lib/data";
import { formatDateLong } from "@/lib/format";
import { jurisdictionLabels } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Intelligence",
  description:
    "Structured, source-linked records of strategic-materials policy, public financing and industrial projects, with the terms for public and licensed use.",
  alternates: { canonical: "/intelligence" },
};

export default function IntelligencePage() {
  const summary = getDatasetSummary();
  const clauses = getAllControlMeasures();
  const { manifest } = buildControlsSnapshotBundle();
  // Every Controls figure is read from the snapshot manifest, so the page states what the download contains.
  const rows = (name: string) => manifest.datasets[name].rows;
  const asOf = formatDateLong(manifest.asOf);
  // Clauses by issuing jurisdiction, largest first, and the in-scope jurisdictions with none recorded.
  const byIssuer = new Map<string, number>();
  for (const c of clauses) byIssuer.set(controlIssuer(c), (byIssuer.get(controlIssuer(c)) ?? 0) + 1);
  const issuers = [...byIssuer.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const label = (code: string) => jurisdictionLabels[code as keyof typeof jurisdictionLabels] ?? code;
  const noClauses = getAllJurisdictions().map((j) => j.id).filter((id) => !byIssuer.has(id));

  /** Each row: the framework layer, the record kept for it, and how that record can be used today. */
  const records = [
    {
      layer: "Policy",
      href: "/controls",
      name: "Controls",
      note: `${clauses.length} control clauses (export, import, investment and production restrictions), each with a dated, source-linked status history.`,
      access: "Public under CC BY 4.0. A separate commercial licence is available.",
    },
    {
      layer: "Policy",
      href: "/events",
      name: "Policy actions",
      note: `${summary.events} laws, regulations, funding decisions and official statements.`,
      access: "Public under CC BY 4.0.",
    },
    {
      layer: "Capital",
      href: "/capital",
      name: "Financing",
      note: `${summary.financialCommitments} financial commitments, with their programmes and organizations.`,
      access: "Public under CC BY 4.0.",
    },
    {
      layer: "Industrial execution",
      href: "/projects",
      name: "Industrial projects",
      note: `${summary.projects} projects, with reported milestones and linked financing.`,
      access: "Public under CC BY 4.0.",
    },
  ] as const;

  const facts = [
    ["Control clauses", String(rows("control-clauses.json"))],
    ["Policy events", String(rows("policy-events.json"))],
    ["Status entries", String(rows("control-status-history.json"))],
    ["Cited sources", String(rows("sources.json"))],
    ["Legal status as of", asOf],
  ] as const;

  return (
    <Container className="py-12 sm:py-20">
      <PageHeading
        title="Intelligence"
        lead="Structured records of policy, capital and industrial execution, each entry linked to the primary source it comes from: an official document, a filing or a company disclosure. The records are public. Controls is the first dataset available under a commercial licence."
      />
      <PageContents
        className="mt-8"
        items={[
          { href: "#records", label: "Records" },
          { href: "#controls", label: "Controls" },
          { href: "#licensing", label: "Public and licensed use" },
        ]}
      />

      <Section id="records" title="Records" className="mt-12" description="Coverage is selective and uneven across jurisdictions and materials. The coverage report gives counts by jurisdiction and mechanism and the coded date window.">
        <div role="table" aria-label="Records and how each can be used" className="border-t border-border-strong font-display text-sm">
          <div role="row" className="hidden gap-6 border-b border-border-strong py-3 text-xs text-faint sm:grid sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,16rem)]">
            <span role="columnheader">Layer</span>
            <span role="columnheader">Record</span>
            <span role="columnheader">Access</span>
          </div>
          {records.map((r) => (
            <div key={r.href} role="row" className="grid gap-x-6 gap-y-1.5 border-b border-border py-4 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,16rem)]">
              <span role="cell" className="text-xs text-muted sm:text-sm">{r.layer}</span>
              <span role="rowheader">
                <Link href={r.href} className="font-editorial text-xl leading-7 text-foreground hover:text-accent">
                  {r.name}
                </Link>
                <span className="tnum mt-1 block max-w-md leading-6 text-muted">{r.note}</span>
              </span>
              <span role="cell" className="leading-6 text-foreground">{r.access}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-display text-sm text-muted">
          <Link href="/explore" className="link-quiet">Explore all records</Link>
          <Link href="/coverage" className="link-quiet">Coverage</Link>
          <Link href="/methodology" className="link-quiet">Methodology</Link>
          <Link href="/data" className="link-quiet">Data &amp; API</Link>
        </p>
      </Section>

      <Section
        id="controls"
        title="Controls"
        className="mt-16"
        description={`Export, import, investment and production restrictions coded one clause per row: issuer, direction, legal mechanism, covered materials and items, named destinations and end uses, and a source-linked status history. Legal status is recorded through ${asOf}. An instrument issued after that date is not reflected until the next snapshot, which carries its own version identifier and checksums.`}
      >
        <dl className="fact-grid">
          {facts.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd className="tnum">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="tnum mt-4 font-display text-sm leading-6 text-foreground">
          Clauses by issuer: {issuers.map(([code, n]) => `${label(code)} ${n}`).join(", ")}.
          {noClauses.length > 0 ? ` None is recorded for ${noClauses.map(label).join(", ")}.` : null}{" "}
          <Link href="/coverage" className="link-quiet text-muted">Coverage</Link>
        </p>
        <p className="mt-4 font-display text-sm leading-6 text-muted">
          The public snapshot is a ZIP of JSON datasets (clauses, policy events, status history and cited
          sources), a manifest with a SHA-256 checksum for each, a README with the data dictionary, and a worked
          Python import example.
        </p>
        <p className="mt-2 font-display text-xs leading-5 text-muted">
          Dataset version <span className="break-all font-mono text-faint">{manifest.datasetVersion}</span>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <a href="/api/export/controls-snapshot.zip" className="research-button">Download the public snapshot</a>
          <Link href="/controls" className="research-button-secondary">Open Controls</Link>
        </div>
      </Section>

      <Section id="licensing" title="Public and licensed use" className="mt-16">
        <div className="max-w-[40rem] space-y-5 text-[1.0625rem] leading-8">
          <p>
            The policy, financing and project records, including the Controls snapshot, are published under{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" className="link-quiet text-foreground">CC BY 4.0</a>:
            free to read, download, reuse and redistribute with attribution, including commercially.
          </p>
          <p>
            A commercial licence is a separate written agreement for an organisation that needs agreed terms for
            its use of the records. It leaves the public terms as they are. The scope and delivery are set in that
            agreement, case by case. Controls is the only dataset offered this way today.
          </p>
          <p className="text-muted">
            Price series on the <Link href="/markets" className="link-quiet text-foreground">Market Monitor</Link>{" "}
            are republished from the World Bank, the IMF and USGS under each publisher&rsquo;s terms. They are a
            separate layer and are not part of any Stratellar licence. Quoted source text and photographs keep
            their own rights.
          </p>
        </div>
        <p className="mt-8 max-w-[40rem] font-display text-sm leading-6 text-muted">
          To ask about a licence, say which dataset and how it would be used. The founder replies by email.
        </p>
        <InquiryLink kind="licence" label="Request licence terms" primary className="mt-4" />
      </Section>
    </Container>
  );
}
