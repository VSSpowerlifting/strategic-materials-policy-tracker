import type { Metadata } from "next";
import { Container, PageHeading } from "@/components/ui/container";
import { getDatasetSummary } from "@/lib/data";

export const metadata: Metadata = {
  title: "Data export",
  description:
    "Download the full dataset as JSON or CSV — events, framing anchors, materials, jurisdictions and sources, with the same provenance shown on the site.",
};

const downloads = [
  {
    file: "smpt-dataset.json",
    href: "/api/export/dataset.json",
    fmt: "JSON",
    desc: "The complete dataset in one structured file — events, framing anchors, materials, jurisdictions, sources, financial commitments, control measures, organizations, projects, programmes, project designations and source-reviewed project milestones, plus the capital-and-control and capital-intelligence summaries, counts and the data notice.",
  },
  {
    file: "smpt-financial-commitments.csv",
    href: "/api/export/financial-commitments.csv",
    fmt: "CSV",
    desc: "One row per financial instrument: value role, capital source, amount in the source's currency with its qualifier and wording, provider, recipient, stages, materials, parent links and current status. Amounts retain their source currency and instrument classification.",
  },
  {
    file: "smpt-control-measures.csv",
    href: "/api/export/control-measures.csv",
    fmt: "CSV",
    desc: "One row per control clause: measure type, direction, targets, materials, product scope in the source's words, product codes, legal basis and current status with any stated end date.",
  },
  {
    file: "smpt-organizations.csv",
    href: "/api/export/organizations.csv",
    fmt: "CSV",
    desc: "One row per provider, recipient, sponsor or holder: kind, country, the government it belongs to, the bodies it is part of or was established by, and how many financial rows it provides and receives.",
  },
  {
    file: "smpt-projects.csv",
    href: "/api/export/projects.csv",
    fmt: "CSV",
    desc: "One row per physical project: sponsors, stated location, stages, materials, and the financial rows and designations that point to it. Financial amounts remain in the linked instruments.",
  },
  {
    file: "smpt-programmes.csv",
    href: "/api/export/programmes.csv",
    fmt: "CSV",
    desc: "One row per named programme or scheme: its government, kind, administering bodies, parent programme, legal authority, and the rows and designations recorded under it.",
  },
  {
    file: "smpt-project-milestones.json",
    href: "/api/v1/project-milestones",
    fmt: "JSON",
    desc: "The public human-reviewed industrial milestone register, retaining named-facility scope, original publisher statement, pinpoint, event or target date, and real reviewer attribution. Facility operations and disbursements require their own supporting records.",
  },
  {
    file: "smpt-project-designations.csv",
    href: "/api/export/project-designations.csv",
    fmt: "CSV",
    desc: "One row per project recognized under a designation scheme, such as an EU strategic project: the scheme, project, holders, location, stages, materials and current status. Designation status is recorded separately from financing.",
  },
  {
    file: "smpt-financial-status-history.csv",
    href: "/api/export/financial-status-history.csv",
    fmt: "CSV",
    desc: "One row per financial or implementation status entry, in order, with its date, source and whether it is current.",
  },
  {
    file: "smpt-control-status-history.csv",
    href: "/api/export/control-status-history.csv",
    fmt: "CSV",
    desc: "One row per control status entry, in order, with its date, stated end, source and whether it is current.",
  },
  {
    file: "smpt-events.csv",
    href: "/api/export/events.csv",
    fmt: "CSV",
    desc: "One row per policy event, with mechanisms, affected materials and sectors, status, document number and source IDs.",
  },
  {
    file: "smpt-framing.csv",
    href: "/api/export/framing.csv",
    fmt: "CSV",
    desc: "One row per framing claim, with the original-language quote, its translation, the translation provenance and the source ID.",
  },
  {
    file: "smpt-materials.csv",
    href: "/api/export/materials.csv",
    fmt: "CSV",
    desc: "One row per material, with the China-position note, downstream industries and linked events.",
  },
  {
    file: "smpt-jurisdictions.csv",
    href: "/api/export/jurisdictions.csv",
    fmt: "CSV",
    desc: "One row per actor, with roles, supply-chain position, key bodies and framing posture.",
  },
  {
    file: "smpt-sources.csv",
    href: "/api/export/sources.csv",
    fmt: "CSV",
    desc: "The full source register, with publisher, URL, language, dates, type and confidence.",
  },
];

export default function DataPage() {
  const s = getDatasetSummary();

  return (
    <Container className="py-12">
      <PageHeading title="Data export" />

      <p className="tnum mt-6 max-w-4xl font-display text-sm leading-6 text-muted">
        Corpus: {s.events} events · {s.framingClaims} framing anchors ·{" "}
        {s.materials} materials · {s.jurisdictions} jurisdictions · {s.sources}{" "}
        sources · {s.financialCommitments} financial commitments · {s.controlMeasures} control clauses ·{" "}
        {s.organizations} organizations · {s.projects} projects · {s.programmes} programmes ·{" "}
        {s.projectDesignations} project designations · {s.projectMilestones} reviewed industrial milestones.
      </p>

      <ul className="mt-8 border-y border-border-strong">
        {downloads.map((d) => (
          <li
            key={d.file}
            data-site-motion="card"
            className="grid gap-x-6 gap-y-2 border-b border-border py-4 last:border-b-0 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] sm:items-baseline"
          >
            <h2 className="break-all font-mono text-sm text-foreground">{d.file}</h2>
            <p className="text-sm leading-6 text-muted">{d.desc}</p>
            <a
              href={d.href}
              download
              aria-label={`Download ${d.file}`}
              className="inline-flex min-h-11 w-fit items-center border border-border-strong bg-plate px-3 font-display text-sm font-medium transition-colors hover:border-foreground hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:justify-self-end"
            >
              Download {d.fmt}
            </a>
          </li>
        ))}
      </ul>

      <section className="mt-12 max-w-prose text-sm leading-7" aria-labelledby="investigation-downloads">
        <h2 id="investigation-downloads" className="font-display text-base font-semibold text-foreground">Project downloads</h2>
        <p className="mt-3 text-muted">Each project investigation offers a structured JSON download at <code className="break-all">/api/v1/projects/[id]/investigation</code>. <a href="/api/v1/projects/prj-au-alcoa-sojitz-gallium/investigation" download className="link-quiet">Download the Wagerup example</a>.</p>
        <p className="mt-3 text-muted">Packets contain project, financing, status and source references. Unallocated amounts remain separate; unknown dates remain null.</p>
      </section>

      <div className="mt-12 max-w-prose space-y-3 text-sm leading-7 text-muted">
        <h2 className="font-display text-base font-semibold text-foreground">
          JSON API
        </h2>
        <p>
          Read-only endpoints under <code className="font-mono text-sm text-foreground">/api/v1</code>:
          {" "}<code className="font-mono text-sm">events</code>, <code className="font-mono text-sm">framing</code>,{" "}
          <code className="font-mono text-sm">materials</code>, <code className="font-mono text-sm">actors</code>,{" "}
          <code className="font-mono text-sm">sources</code>, <code className="font-mono text-sm">financial-commitments</code>,{" "}
          <code className="font-mono text-sm">control-measures</code>, <code className="font-mono text-sm">organizations</code>,{" "}
          <code className="font-mono text-sm">projects</code>, <code className="font-mono text-sm">programmes</code> and{" "}
          <code className="font-mono text-sm">project-designations</code> (each with a <code className="font-mono text-sm">/[id]</code>{" "}
          record that bundles its sources), plus <code className="font-mono text-sm">capital-control/summary</code>, the
          double-count-safe totals and status counts behind the Capital and Controls pages, and{" "}
          <code className="font-mono text-sm">capital-intelligence/summary</code>: portfolios, capital stacks, programme
          ledgers, co-investment, flows and the stage response map. Totals are per currency and per value role, with
          statuses evaluated on the data&apos;s as-of date; API outputs retain separate currencies and value roles.
        </p>
      </div>

      <div className="mt-12 max-w-prose space-y-3 text-sm leading-7 text-muted">
        <h2 className="font-display text-base font-semibold text-foreground">
          Terms of use
        </h2>
        <p>
          The data is provided as-is for research and journalism. Categorical
          labels are research classifications grounded in the cited sources.
          Formal legal determinations require qualified legal assessment. Quotations are reproduced from the linked
          originals under fair-use for commentary; please cite the original
          publisher as well as this database. Use the underlying official publications and qualified counsel for legal
          or compliance decisions.
        </p>
      </div>
    </Container>
  );
}
