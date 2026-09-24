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
    desc: "The complete dataset in one structured file — events, framing anchors, materials, jurisdictions, sources, financial commitments, control measures, organizations, projects, programmes and project designations, plus the capital-and-control and capital-intelligence summaries, counts and the data notice.",
  },
  {
    file: "smpt-financial-commitments.csv",
    href: "/api/export/financial-commitments.csv",
    fmt: "CSV",
    desc: "One row per financial instrument: value role, capital source, amount in the source's currency with its qualifier and wording, provider, recipient, stages, materials, parent links and current status. Never converted or summed.",
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
    desc: "One row per physical project: sponsors, stated location, stages, materials, and the financial rows and designations that point to it. No money is stored on a project.",
  },
  {
    file: "smpt-programmes.csv",
    href: "/api/export/programmes.csv",
    fmt: "CSV",
    desc: "One row per named programme or scheme: its government, kind, administering bodies, parent programme, legal authority, and the rows and designations recorded under it.",
  },
  {
    file: "smpt-project-designations.csv",
    href: "/api/export/project-designations.csv",
    fmt: "CSV",
    desc: "One row per project recognized under a designation scheme, such as an EU strategic project: the scheme, project, holders, location, stages, materials and current status. Standing, not money.",
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
      <PageHeading
        index="01"
        eyebrow="Take it with you"
        title="Data export"
        lead="The whole dataset is downloadable, with the same source links and translation provenance you see on the site. CSV files are UTF-8 (with a byte-order mark, so the original-language fields open cleanly in Excel)."
      />

      <p className="mt-6 font-mono text-sm text-faint">
        Current snapshot: {s.events} events · {s.framingClaims} framing anchors ·{" "}
        {s.materials} materials · {s.jurisdictions} jurisdictions · {s.sources}{" "}
        sources · {s.financialCommitments} financial commitments · {s.controlMeasures} control clauses ·{" "}
        {s.organizations} organizations · {s.projects} projects · {s.programmes} programmes ·{" "}
        {s.projectDesignations} project designations.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {downloads.map((d) => (
          <div
            key={d.file}
            className="flex flex-col rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-sm text-foreground">{d.file}</h2>
              <span className="border-l-2 border-border-strong pl-1.5 font-mono text-[11px] text-faint">
                {d.fmt}
              </span>
            </div>
            <p className="mt-2 flex-1 leading-7 text-muted">{d.desc}</p>
            <a
              href={d.href}
              download
              className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-display text-sm font-medium transition-colors hover:border-accent/40 hover:bg-elevated"
            >
              Download ↓
            </a>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-prose space-y-3 leading-7 text-muted">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-faint">
          JSON API
        </h2>
        <p>
          Read-only, prerendered endpoints under <code className="font-mono text-sm text-foreground">/api/v1</code>:
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
          statuses evaluated on the data&apos;s as-of date; no endpoint returns a ratio, share or cross-currency figure.
        </p>
      </div>

      <div className="mt-12 max-w-prose space-y-3 leading-7 text-muted">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-faint">
          Terms of use
        </h2>
        <p>
          The data is provided as-is for research and journalism. Categorical
          labels are interpretive judgements anchored to the cited sources, not
          legal determinations. Quotations are reproduced from the linked
          originals under fair-use for commentary; please cite the original
          publisher as well as this database. This is not legal or compliance
          advice.
        </p>
      </div>
    </Container>
  );
}
