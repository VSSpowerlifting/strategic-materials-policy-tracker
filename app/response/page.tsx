import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { formatDateLong } from "@/lib/format";
import { getAllMaterials, getSourceById } from "@/lib/data";
import {
  buildIndustrialResponse,
  FINANCE_ROWS,
  PHYSICAL_COLUMNS,
  matrixKey,
  type EvidenceLink,
  type FinanceAxis,
  type PhysicalAxis,
} from "@/lib/industrial-response";
import { financialStatusLabels, implementationStatusLabels } from "@/lib/labels";
import { site } from "@/lib/site";
import type { FinancialStatus, ImplementationStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Industrial response — funding and physical evidence",
  description:
    "Source-linked government financing and physical progress for strategic-material projects, assessed separately.",
};

const FINANCE_LABEL: Record<FinanceAxis, string> = {
  binding: "Binding public instrument recorded",
  binding_not_evidenced: "Binding public instrument not established",
};
const PHYSICAL_LABEL: Record<PhysicalAxis, string> = {
  construction_or_later: "Construction or later reported",
  other_reported: "Other implementation status reported",
  no_record: "No usable physical milestone recorded",
};

function Evidence({ entries, kind }: { entries: EvidenceLink[]; kind: "financial" | "physical" }) {
  if (!entries.length) return <span className="text-faint">No supporting status entry recorded.</span>;
  return (
    <ul className="space-y-1.5">
      {entries.map((e, i) => {
        const source = getSourceById(e.sourceId);
        const label = kind === "financial"
          ? financialStatusLabels[e.status as FinancialStatus]
          : implementationStatusLabels[e.status as ImplementationStatus];
        return (
          <li key={`${e.financialId}-${e.sourceId}-${i}`} className="leading-5">
            <Link href={`/capital/${e.financialId}`} className="font-medium text-foreground hover:text-accent">
              {label ?? e.status}
            </Link>
            {e.date ? <span className="text-faint"> · {e.date}</span> : <span className="text-faint"> · date not stated</span>}
            {source ? (
              <>
                {" · "}
                <a href={source.url} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                  source
                  <span className="sr-only">: {source.title}</span>
                </a>
              </>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function IndustrialResponsePage() {
  const model = buildIndustrialResponse(site.lastUpdated);
  const names = Object.fromEntries(getAllMaterials().map((m) => [m.id, m.nameEn]));
  const perMaterial = getAllMaterials()
    .map((m) => {
      const items = model.rows.filter((r) => r.materials.includes(m.id));
      return {
        id: m.id,
        name: m.nameEn,
        projects: items.length,
        binding: items.filter((r) => r.finance === "binding").length,
        physical: items.filter((r) => r.physical === "construction_or_later").length,
        strict: items.filter((r) => r.strictConstruction).length,
      };
    })
    .filter((m) => m.projects > 0);

  return (
    <Container className="py-12">
      <PageHeading
        index="05"
        eyebrow="Evidence of industrial response"
        title="From commitments to construction"
        lead={
          <>
            This view compares the financial standing of government-backed projects with
            their reported physical progress. Funding, construction and commissioning
            are recorded as separate stages, with sources linked to each observation.
          </>
        }
      />
      <p className="mt-5 font-mono text-[11px] leading-5 text-faint">
        Corpus revision: {formatDateLong(model.asOf)} · Financial standing evidenced by that date ·
        Physical status from the latest source-linked record
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
        {[
          ["Registered projects", model.registryProjects],
          ["With direct government commitment", model.governmentProjects],
          ["With binding instrument", model.bindingProjects],
          ["Construction or later reported", model.reportedExecutionProjects],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-card px-4 py-5">
            <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">{label}</dt>
            <dd className="tnum mt-2 font-display text-3xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <Section index="01" title="Two independent forms of evidence" className="mt-12"
        description="Each project appears in exactly one cell. Binding means at least one recorded government commitment is contracted, partly disbursed or disbursed. Construction and later refer to implementation entries, regardless of who provided the funding.">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[43rem] border-collapse text-sm">
            <caption className="sr-only">Government project commitment standing by implementation evidence</caption>
            <thead className="bg-card">
              <tr className="border-b">
                <th scope="col" className="w-[26%] p-4 text-left font-mono text-xs text-muted">Financial standing</th>
                {PHYSICAL_COLUMNS.map((physical) => (
                  <th key={physical} scope="col" className="p-4 text-left font-mono text-xs font-normal text-muted">
                    {PHYSICAL_LABEL[physical]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FINANCE_ROWS.map((finance) => (
                <tr key={finance} className="border-b last:border-0">
                  <th scope="row" className="bg-elevated/40 p-4 text-left align-top font-display font-semibold">
                    {FINANCE_LABEL[finance]}
                  </th>
                  {PHYSICAL_COLUMNS.map((physical) => {
                    const cell = model.matrix.find((c) => c.key === matrixKey(finance, physical))!;
                    return (
                      <td key={cell.key} className="p-4 align-top">
                        <span className="tnum font-display text-3xl font-bold">{cell.projects.length}</span>
                        <p className="mt-2 text-xs leading-5 text-faint">
                          {cell.projects.length ? (
                            <a href={`#cell-${cell.key.replace("|", "-")}`} className="text-accent hover:underline">
                              View projects ↓
                            </a>
                          ) : "None recorded"}
                        </p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-4 text-sm leading-6 text-muted md:grid-cols-2">
          <p>
            <strong className="font-semibold text-foreground">Reported physical activity</strong>{" "}
            {model.reportedExecutionProjects} projects have an implementation entry at construction or later;
            {model.strictExecutionProjects} meet a stricter construction-evidence standard, excluding{" "}
            {model.exceptionalActivityProjects} funded-activity completion records that require separate evidence
            of facility construction.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Physical evidence gaps</strong>{" "}
            {model.noPhysicalRecordProjects} projects with recorded government commitments lack a usable
            physical milestone in the current corpus. Operational standing for
            those projects remains undetermined.
          </p>
        </div>
      </Section>

      <Section index="02" title="Material-level evidence" className="mt-14"
        description="Distinct project counts by material. Projects with several material tags appear in multiple rows; the table reports counts rather than financial totals.">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[35rem] text-sm">
            <thead className="border-b bg-card text-left font-mono text-[11px] uppercase tracking-wide text-faint">
              <tr>
                <th className="px-4 py-3 font-normal">Material</th>
                <th className="px-4 py-3 text-right font-normal">Government-backed projects</th>
                <th className="px-4 py-3 text-right font-normal">Binding recorded</th>
                <th className="px-4 py-3 text-right font-normal">Construction or later</th>
                <th className="px-4 py-3 text-right font-normal">Strict</th>
              </tr>
            </thead>
            <tbody>
              {perMaterial.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium">{m.name}</th>
                  <td className="tnum px-4 py-3 text-right">{m.projects}</td>
                  <td className="tnum px-4 py-3 text-right">{m.binding}</td>
                  <td className="tnum px-4 py-3 text-right">{m.physical}</td>
                  <td className="tnum px-4 py-3 text-right">{m.strict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section index="03" title="Project evidence register" className="mt-14"
        description="Each project and status links to its supporting records. Financial entries are evaluated as of the corpus revision; physical entries are the latest recorded in this dataset revision.">
        <div className="space-y-9">
          {model.matrix.filter((cell) => cell.projects.length).map((cell) => (
            <div key={cell.key} id={`cell-${cell.key.replace("|", "-")}`} className="scroll-mt-24">
              <h3 className="mb-3 font-display text-lg font-semibold">
                {FINANCE_LABEL[cell.finance]} · {PHYSICAL_LABEL[cell.physical]}
                <span className="ml-2 font-mono text-xs font-normal text-faint">({cell.projects.length})</span>
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {cell.projects.map((p) => (
                  <Card key={p.id} className="min-w-0 p-5">
                    <Link href={`/projects/${p.id}`} className="font-display text-base font-semibold leading-snug hover:text-accent">
                      {p.name}
                    </Link>
                    <p className="mt-1 font-mono text-[11px] leading-5 text-faint">
                      {p.materials.map((id) => names[id] ?? id).join(" · ")}
                    </p>
                    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-faint">
                          Financial — {p.financeDetail === "binding" ? "binding evidenced" : p.financeDetail === "not_yet_binding" ? "not yet binding" : "standing not stated"}
                        </p>
                        <Evidence entries={p.financialEvidence} kind="financial" />
                      </div>
                      <div>
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-faint">Physical — recorded status</p>
                        <Evidence entries={p.physicalEvidence} kind="physical" />
                        {p.exceptionalActivityOnly ? (
                          <p className="mt-2 text-faint">The completed activity is the funded scope; facility construction requires separate evidence.</p>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section index="04" title="Interpretation and boundaries" className="mt-14"
        description="A deliberately conservative reading of what the records can demonstrate.">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 text-sm leading-7 text-muted">
            <p className="font-display text-base font-semibold text-foreground">What is counted</p>
            <p className="mt-2">
              One registered project with at least one directly linked, as-of-evidenced, non-ended government commitment.
              A commitment can have an unstated amount. Financial packages and child allocations
              count each qualifying project once. {model.directLinkedProjects} of {model.registryProjects} projects have some direct financial
              linkage; the matrix&apos;s {model.governmentProjects} projects meet its narrower government-commitment test.
            </p>
          </Card>
          <Card className="p-5 text-sm leading-7 text-muted">
            <p className="font-display text-base font-semibold text-foreground">Excluded from the denominator</p>
            <p className="mt-2">
              The denominator excludes designation-only records, private finance,
              non-binding indications, programme ceilings, unknown legal recipients,
              and shared financing associations lacking a project-level allocation. {model.associatedButNotAllocatedLinks} project associations are
              kept outside the direct-financing denominator; {model.projectlessGovernmentRows} government commitment
              rows lack a direct project allocation.
            </p>
          </Card>
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted">
          The status of a financing agreement and the status of an industrial undertaking are <em>different observations</em>.
          Sources can report construction before a loan is signed, or describe an executed award without a construction
          update. Attribution of industrial outcomes to specific policies requires separate
          causal evidence. The project register captures the current dataset revision,
          while financial standing is evaluated at the recorded as-of date. For financial status,
          undated source statements enter the as-of view at their conservative
          evidence boundary. See the <Link href="/methodology#capital-counting" className="text-accent hover:underline">counting rules</Link> and{" "}
          <Link href="/portfolios" className="text-accent hover:underline">government portfolios</Link> for the
          complementary financial analysis.
        </p>
      </Section>
    </Container>
  );
}
