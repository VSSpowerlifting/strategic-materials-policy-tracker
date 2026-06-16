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
    desc: "The complete dataset in one structured file — events, framing anchors, materials, jurisdictions and sources, plus counts and the data notice.",
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
        eyebrow="Take it with you"
        title="Data export"
        lead="The whole dataset is downloadable, with the same source links and translation provenance you see on the site. CSV files are UTF-8 (with a byte-order mark, so the Chinese-language fields open cleanly in Excel)."
      />

      <p className="mt-6 text-sm text-faint">
        Current snapshot: {s.events} events · {s.framingClaims} framing anchors ·{" "}
        {s.materials} materials · {s.jurisdictions} jurisdictions · {s.sources}{" "}
        sources.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {downloads.map((d) => (
          <div
            key={d.file}
            className="flex flex-col rounded-lg border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-sm">{d.file}</h2>
              <span className="rounded border px-1.5 py-0.5 font-mono text-[11px] text-faint">
                {d.fmt}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted">{d.desc}</p>
            <a
              href={d.href}
              download
              className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-elevated"
            >
              Download ↓
            </a>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-prose space-y-3 text-sm leading-6 text-muted">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">
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
