import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeading, Section } from "@/components/ui/container";
import { formatDateLong } from "@/lib/format";
import { getAllMaterials, getSourceById } from "@/lib/data";
import {
  FINANCE_ROWS,
  PHYSICAL_COLUMNS,
  matrixKey,
  type EvidenceLink,
  type FinanceAxis,
  type PhysicalAxis,
} from "@/lib/industrial-response";
import { buildCapitalExecution, type PhysicalObservation } from "@/lib/capital-execution";
import { KIND_LABELS } from "@/components/projects/reviewed-project-milestones";
import { financialInstrumentLabels, financialStatusLabels, implementationStatusLabels } from "@/lib/labels";
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
                <a href={source.url} className="relative link-quiet" target="_blank" rel="noopener noreferrer">
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

function SourceLink({ sourceId }: { sourceId: string }) {
  const source = getSourceById(sourceId);
  if (!source) return null;
  return (
    <a href={source.url} className="relative link-quiet" target="_blank" rel="noopener noreferrer">
      source
      <span className="sr-only">: {source.title}</span>
    </a>
  );
}

/** One line per distinct (source, status, date) observation, however many financing rows cite it. */
function Observations({ entries }: { entries: PhysicalObservation[] }) {
  if (!entries.length) return <span className="text-faint">No supporting status entry recorded.</span>;
  return (
    <ul className="space-y-1.5">
      {entries.map((e) => (
        <li key={`${e.sourceId}-${e.status}-${e.date ?? "undated"}`} className="leading-5">
          <Link href={`/capital/${e.financialIds[0]}`} className="font-medium text-foreground hover:text-accent">
            {implementationStatusLabels[e.status as ImplementationStatus] ?? e.status}
          </Link>
          <span className="text-faint"> · {e.date ?? "date not stated"}</span>
          {getSourceById(e.sourceId) ? <>{" · "}<SourceLink sourceId={e.sourceId} /></> : null}
          {e.financialIds.length > 1 ? (
            <span className="text-faint"> · cited on {e.financialIds.length} financing rows</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function IndustrialResponsePage() {
  const exec = buildCapitalExecution(site.lastUpdated);
  const model = exec.response;
  const execById = new Map(exec.rows.map((r) => [r.id, r]));
  const conditionalOnBinding = exec.conditional.filter((c) => c.projectHasBindingInstrument).length;
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
        title="From commitments to construction"
        lead={
          <>
            Financial standing of government-backed projects against their reported physical
            progress. Funding, construction and commissioning are recorded as separate stages.
          </>
        }
      />
      <p className="mt-5 font-display text-xs leading-5 text-faint">
        Corpus revision: {formatDateLong(model.asOf)} · Financial standing evidenced by that date ·
        Physical status from the latest source-linked entry
      </p>

      <dl className="fact-grid mt-10">
        {[
          ["Registered projects", model.registryProjects],
          ["With direct government commitment", model.governmentProjects],
          ["With binding instrument", model.bindingProjects],
          ["Construction or later reported", model.reportedExecutionProjects],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt>{label}</dt>
            <dd className="tnum">{value}</dd>
          </div>
        ))}
      </dl>

      <Section title="Two independent forms of evidence" className="mt-12"
        description="Each project appears in exactly one cell. Binding means at least one recorded government commitment is contracted, partly disbursed or disbursed. Construction and later refer to implementation entries, regardless of who provided the funding.">
        <div className="overflow-x-auto border-y border-border-strong bg-plate">
          <table className="w-full min-w-[43rem] border-collapse text-sm">
            <caption className="sr-only">Government project commitment standing by implementation evidence</caption>
            <thead className="bg-elevated">
              <tr className="border-b">
                <th scope="col" className="w-[26%] p-4 text-left font-display text-xs text-muted">Financial standing</th>
                {PHYSICAL_COLUMNS.map((physical) => (
                  <th key={physical} scope="col" className="p-4 text-left font-display text-xs font-normal text-muted">
                    {PHYSICAL_LABEL[physical]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FINANCE_ROWS.map((finance) => (
                <tr key={finance} className="border-b last:border-0">
                  <th scope="row" className="bg-elevated p-4 text-left align-top font-display font-semibold">
                    {FINANCE_LABEL[finance]}
                  </th>
                  {PHYSICAL_COLUMNS.map((physical) => {
                    const cell = model.matrix.find((c) => c.key === matrixKey(finance, physical))!;
                    return (
                      <td key={cell.key} className="p-4 align-top">
                        <span className="tnum font-display text-3xl font-bold">{cell.projects.length}</span>
                        <p className="mt-2 text-xs leading-5 text-faint">
                          {cell.projects.length ? (
                            <a href={`#cell-${cell.key.replace("|", "-")}`} className="link-quiet">
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
            {model.exceptionalActivityProjects} funded-activity completion entries that require separate evidence
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

      <Section title="Material-level evidence" className="mt-14"
        description="Distinct project counts by material. Projects with several material tags appear in multiple rows; the table reports counts rather than financial totals.">
        <div className="overflow-x-auto border-y border-border-strong bg-plate">
          <table className="w-full min-w-[35rem] text-sm">
            <thead className="border-b bg-elevated text-left font-display text-xs text-faint">
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

      <Section title="Project evidence register" className="mt-14"
        description="Each project and status links to its supporting evidence. Financial entries are evaluated as of the corpus revision; physical entries are the latest recorded in this dataset revision.">
        <div className="space-y-9">
          {model.matrix.filter((cell) => cell.projects.length).map((cell) => (
            <div key={cell.key} id={`cell-${cell.key.replace("|", "-")}`} className="scroll-mt-24">
              <h3 className="mb-3 font-display text-lg font-semibold">
                {FINANCE_LABEL[cell.finance]} · {PHYSICAL_LABEL[cell.physical]}
                <span className="ml-2 font-display text-xs font-normal text-faint">({cell.projects.length})</span>
              </h3>
              <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
                {cell.projects.map((p) => {
                  const x = execById.get(p.id)!;
                  return (
                  <div key={p.id} className="border-t border-border-strong pt-4 min-w-0">
                    <Link href={`/projects/${p.id}`} className="font-display text-base font-semibold leading-snug hover:text-accent">
                      {p.name}
                    </Link>
                    <p className="mt-1 font-display text-xs leading-5 text-faint">
                      {p.materials.map((id) => names[id] ?? id).join(" · ")}
                    </p>
                    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="mb-2 font-display text-xs text-faint">
                          Financial — {p.financeDetail === "binding" ? "binding evidenced" : p.financeDetail === "not_yet_binding" ? "not yet binding" : "standing not stated"}
                        </p>
                        <Evidence entries={p.financialEvidence} kind="financial" />
                      </div>
                      <div>
                        <p className="mb-2 font-display text-xs text-faint">Physical — recorded status</p>
                        <Observations entries={x.observations} />
                        {p.exceptionalActivityOnly ? (
                          <p className="mt-2 text-faint">The completed activity is the funded scope; facility construction requires separate evidence.</p>
                        ) : null}
                        {x.milestones.length ? (
                          <p className="mt-2 text-faint">
                            Reviewed milestone:{" "}
                            <Link href={`/projects/${p.id}`} className="link-quiet">
                              {x.milestones.map((m) => KIND_LABELS[m.kind]).join("; ")}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Physical evidence quality" className="mt-14"
        description="How each project's physical status is evidenced. A reviewed milestone is a source statement checked by a named reviewer against the full original; a financing-row status is the latest implementation entry recorded on a commitment and has not been separately reviewed as a project milestone.">
        <dl className="fact-grid">
          {[
            ["Reviewed project milestone", exec.tierCounts.reviewed_milestone],
            ["Status on a financing row only", exec.tierCounts.financing_row_status],
            ["No usable physical status", exec.tierCounts.none],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt>{label}</dt>
              <dd className="tnum">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid gap-4 text-sm leading-6 text-muted md:grid-cols-2">
          <p>
            <strong className="font-semibold text-foreground">Reviewed milestones</strong>{" "}
            {exec.rows.filter((r) => r.milestones.length).map((r, i, all) => (
              <span key={r.id}>
                <Link href={`/projects/${r.id}`} className="link-quiet">{r.name}</Link>
                {" "}({r.milestones.map((m) => KIND_LABELS[m.kind].toLowerCase()).join("; ")})
                {i < all.length - 1 ? "; " : ". "}
              </span>
            ))}
            Milestones are added only after human review and do not change the matrix counts above.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Construction ahead of binding finance</strong>{" "}
            {exec.aheadOfBinding.length} projects report construction or later while no binding public
            instrument is established:{" "}
            {exec.aheadOfBinding.map((r, i, all) => (
              <span key={r.id}>
                <Link href={`/projects/${r.id}`} className="link-quiet">{r.name}</Link>
                {i < all.length - 1 ? "; " : "."}
              </span>
            ))}{" "}
            Their physical progress is not attributable to the recorded government commitments.
          </p>
        </div>
      </Section>

      <Section title="Conditional commitments by financing stage" className="mt-14"
        description={`Directly linked government commitments that are not binding as of the corpus revision: ${exec.conditional.length} rows across ${exec.conditionalProjects} projects. ${conditionalOnBinding} sit on projects that also hold a binding instrument. Amounts appear as each source states them and are not added together; a component row names the package it belongs to.`}>
        <div className="overflow-x-auto border-y border-border-strong bg-plate">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <caption className="sr-only">Non-binding government commitments grouped by recorded financing status</caption>
            <thead className="border-b bg-elevated text-left font-display text-xs text-faint">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">Project</th>
                <th scope="col" className="px-4 py-3 font-normal">Instrument · provider</th>
                <th scope="col" className="px-4 py-3 font-normal">Amount as stated</th>
                <th scope="col" className="px-4 py-3 font-normal">Status date</th>
                <th scope="col" className="w-[30%] px-4 py-3 font-normal">Source note</th>
              </tr>
            </thead>
            {exec.conditionalGroups.map((g) => (
              <tbody key={g.status} className="border-b last:border-0">
                <tr className="bg-elevated">
                  <th scope="rowgroup" colSpan={5} className="px-4 py-2 text-left font-display font-semibold">
                    {financialStatusLabels[g.status]}
                    <span className="ml-2 font-display text-xs font-normal text-faint">({g.commitments.length})</span>
                  </th>
                </tr>
                {g.commitments.map((c) => (
                  <tr key={c.financialId} className="border-t align-top">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${c.projectId}`} className="font-medium hover:text-accent">{c.projectName}</Link>
                      {c.projectHasBindingInstrument ? (
                        <p className="mt-1 text-xs text-faint">Also holds a binding instrument</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <Link href={`/capital/${c.financialId}`} className="text-foreground hover:text-accent">
                        {financialInstrumentLabels[c.instrument] ?? c.instrument}
                      </Link>
                      {c.provider ? <span className="block text-xs text-faint">{c.provider}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.amountAsStated ?? <span className="text-faint">Not stated</span>}
                      {c.partOf ? (
                        <span className="mt-1 block text-xs text-faint">
                          Part of <Link href={`/capital/${c.partOf}`} className="link-quiet">{c.partOf}</Link>
                        </span>
                      ) : null}
                    </td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-muted">
                      {c.date ?? <span className="text-faint">Not stated</span>}
                      {" · "}<SourceLink sourceId={c.sourceId} />
                    </td>
                    <td className="px-4 py-3 text-xs leading-5 text-muted">{c.note ?? <span className="text-faint">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Section>

      <Section title="Binding finance without recorded construction" className="mt-14"
        description={`${exec.executionGaps.length} projects hold a binding government instrument but no construction-or-later entry; ${exec.fundedGaps.length} of them record partial or full disbursement. A missing entry is a research gap, not evidence that work has stalled.`}>
        <div className="overflow-x-auto border-y border-border-strong bg-plate">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">Projects with binding government finance and no construction-or-later entry</caption>
            <thead className="border-b bg-elevated text-left font-display text-xs text-faint">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">Project</th>
                <th scope="col" className="px-4 py-3 font-normal">Financial standing</th>
                <th scope="col" className="px-4 py-3 font-normal">Latest recorded physical status</th>
              </tr>
            </thead>
            <tbody>
              {exec.executionGaps.map((r) => (
                <tr key={r.id} className="border-b align-top last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    <Link href={`/projects/${r.id}`} className="hover:text-accent">{r.name}</Link>
                  </th>
                  <td className="px-4 py-3 text-muted">{r.funded ? "Disbursement recorded" : "Contracted"}</td>
                  <td className="px-4 py-3 text-muted">
                    {r.physical === "no_record" ? (
                      <span className="text-faint">No usable status recorded</span>
                    ) : (
                      <Observations entries={r.observations} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Interpretation and boundaries" className="mt-14">
        <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
          <div className="border-t border-border-strong pt-4 text-sm leading-7 text-muted">
            <p className="font-display text-base font-semibold text-foreground">What is counted</p>
            <p className="mt-2">
              One registered project with at least one directly linked, as-of-evidenced, non-ended government commitment.
              A commitment can have an unstated amount. Financial packages and child allocations
              count each qualifying project once. {model.directLinkedProjects} of {model.registryProjects} projects have some direct financial
              linkage; the matrix&apos;s {model.governmentProjects} projects meet its narrower government-commitment test.
            </p>
          </div>
          <div className="border-t border-border-strong pt-4 text-sm leading-7 text-muted">
            <p className="font-display text-base font-semibold text-foreground">Excluded from the denominator</p>
            <p className="mt-2">
              The denominator excludes designation-only entries, private finance,
              non-binding indications, programme ceilings, unknown legal recipients,
              and shared financing associations lacking a project-level allocation. {model.associatedButNotAllocatedLinks} project associations are
              kept outside the direct-financing denominator; {model.projectlessGovernmentRows} government commitment
              rows lack a direct project allocation.
            </p>
          </div>
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted">
          The status of a financing agreement and the status of an industrial undertaking are <em>different observations</em>.
          Sources can report construction before a loan is signed, or describe an executed award without a construction
          update. Attribution of industrial outcomes to specific policies requires separate
          causal evidence. The project register captures the current dataset revision,
          while financial standing is evaluated at the recorded as-of date. For financial status,
          undated source statements enter the as-of view at their conservative
          evidence boundary. See the <Link href="/methodology#capital-counting" className="link-quiet">counting rules</Link> and{" "}
          <Link href="/portfolios" className="link-quiet">government portfolios</Link> for the
          complementary financial analysis.
        </p>
      </Section>
    </Container>
  );
}
