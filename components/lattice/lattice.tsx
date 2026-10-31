"use client";

/**
 * The lattice views. Overview and Compare share URL-backed selection, government
 * and record-kind filters and the selected records panel. Compare adds a material
 * split by government. Both read a serialized `LatticeModel` and count records of one
 * kind at a time: a cell never shows a sum across kinds, a row or column is never totalled, and money appears
 * only as a row's own amount in its own currency. The selected node lives in the URL hash so a view can be
 * shared without making the route dynamic.
 */
import Link from "next/link";
import { useCallback, useId, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { LatticeCommitment, LatticeControl, LatticeDesignation, LatticeModel } from "@/lib/lattice";
import {
  cellView,
  countWord,
  governmentRows,
  isMarked,
  type CellView,
  type LatticeFilter,
} from "@/lib/lattice-view";
import { normalizeResearchQuery, researchQueryHref, researchQueryResult, QUERY_KINDS, type ResearchQuery } from "@/lib/research-query";
import type { SupplyChainStage } from "@/lib/types";
import { AreaKey, CellMarks, KindSwatch, type MarkKind } from "./marks";
import { NotOnLatticeStats, ControlGapNotice, NotPlacedSentence } from "./not-on-lattice";

type Selection = { materialId: string; stage: SupplyChainStage };
type Preferred = { slug: string; stage: SupplyChainStage };

// --- Selection in the URL hash -------------------------------------------------------------------

const subscribeLocation = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => { window.removeEventListener("hashchange", cb); window.removeEventListener("popstate", cb); };
};
const readLocation = () => window.location.href;
const serverLocation = () => "/";

function useResearchQuery(model: LatticeModel, preferred: Preferred) {
  const location = useSyncExternalStore(subscribeLocation, readLocation, serverLocation);
  const query = normalizeResearchQuery(model, location, preferred);
  const update = useCallback((next: ResearchQuery) => {
    const href = researchQueryHref(model, next, window.location.pathname, window.location.href);
    window.history.pushState(window.history.state, "", href);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, [model]);
  const select = (selection: Selection) => update({ ...query, selection, issues: [] });
  return { query, update, select };
}

function QueryControls({ model, query, update }: { model: LatticeModel; query: ResearchQuery; update: (q: ResearchQuery) => void }) {
  const id = useId();
  const change = (field: "government" | "kind", value: string) => {
    const url = new URL(researchQueryHref(model, query, "/"), "https://smpt.invalid");
    url.searchParams.set(field, value);
    update(normalizeResearchQuery(model, url.href));
  };
  return <div className="flex flex-wrap items-center gap-3 font-display text-xs">
    <label htmlFor={id + "government"} className="flex items-center gap-2 text-muted">Government
      <select aria-label="Government" id={id + "government"} value={query.filter.actor} disabled={!!query.issues.length} onChange={e => change("government", e.target.value)} className="min-h-10 rounded border border-border-strong bg-card px-2 text-sm text-foreground">
        <option value="all">All governments</option>{model.actors.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
      </select>
    </label>
    <label htmlFor={id + "kind"} className="flex items-center gap-2 text-muted">Records
      <select aria-label="Records" id={id + "kind"} value={query.kind} disabled={!!query.issues.length} onChange={e => change("kind", e.target.value)} className="min-h-10 rounded border border-border-strong bg-card px-2 text-sm text-foreground">
        {QUERY_KINDS.map(k => <option key={k} value={k}>{({ all: "All kinds", commitments: "Commitments", controls: "Control clauses", designations: "Designations", "commitments,controls": "Commitments + controls", "commitments,designations": "Commitments + designations", "controls,designations": "Controls + designations", none: "None" })[k]}</option>)}
      </select>
    </label>
    <span className="text-muted">Provider / issuer / designating government</span>
  </div>;
}

function QueryIssues({ query }: { query: ResearchQuery }) {
  return query.issues.length ? <p role="status" className="my-4 rounded border border-accent p-4 font-display text-sm">{query.issues.join(" ")} No records selected. <a href={typeof window === "undefined" ? "/" : window.location.pathname} className="underline">Reset analytical selection</a>.</p> : null;
}

// --- Small shared pieces -------------------------------------------------------------------------

const stageLabel = (model: LatticeModel, stage: SupplyChainStage) => model.stages.find((s) => s.id === stage)?.label ?? stage;

function cellSummary(counts: CellView["counts"]): string {
  const parts: string[] = [];
  if (counts.commitments) parts.push(countWord(counts.commitments, "commitment", "commitments"));
  if (counts.controls) parts.push(countWord(counts.controls, "control clause", "control clauses"));
  if (counts.designations) parts.push(countWord(counts.designations, "designation", "designations"));
  return parts.join(", ");
}

/** "3 ● 1 ● 2 ◇": each kind's own count beside its own swatch, never added. */
function CountLine({ counts, inline = false }: { counts: CellView["counts"]; inline?: boolean }) {
  const items: { kind: MarkKind; n: number }[] = [
    { kind: "commitments", n: counts.commitments },
    { kind: "controls", n: counts.controls },
    { kind: "designations", n: counts.designations },
  ];
  return (
    <span aria-hidden className={cn("flex items-center gap-2 font-mono text-[11px] text-muted", inline ? "justify-start" : "mt-0.5 justify-center")}>
      {items
        .filter((i) => i.n > 0)
        .map((i) => (
          <span key={i.kind} className="inline-flex items-center gap-1">
            <KindSwatch kind={i.kind} className="h-2 w-2" />
            <span className="tnum">{i.n}</span>
          </span>
        ))}
    </span>
  );
}

// --- The desktop lattice -------------------------------------------------------------------------

function LatticeTable({
  model,
  filter,
  selection,
  onSelect,
  showCounts,
}: {
  model: LatticeModel;
  filter: LatticeFilter;
  selection: Selection | null;
  onSelect: (s: Selection) => void;
  showCounts: boolean;
}) {
  return (
    <div className="hidden overflow-x-auto md:block" role="region" aria-label="Materials by stage; scroll horizontally for all stages" tabIndex={0}>
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Materials by supply-chain stage. Each marked cell counts the government commitments, control clauses and designations recorded at that material and stage,
          each kind on its own. Select a marked cell to read its records.
        </caption>
        <thead>
          <tr>
            <td className="w-32 lg:w-40" />
            {model.stages.map((s) => (
              <th
                key={s.id}
                scope="col"
                className={cn(
                  "px-1 pb-3 align-bottom text-center font-display text-xs font-normal leading-tight text-muted",
                  selection?.stage === s.id && "font-semibold text-accent",
                )}
              >
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.materials.map((m) => {
            const rowSelected = selection?.materialId === m.id;
            return (
              <tr key={m.id} className={cn(rowSelected && "bg-foreground/[0.05]")}>
                <th scope="row" className="py-1 pl-2 pr-4 text-right font-normal">
                  <Link href={`/materials/${m.slug}`} className={cn("block font-display text-sm hover:underline", rowSelected ? "font-semibold text-accent" : "text-foreground")}>
                    {m.nameEn}
                  </Link>
                  {m.nameZh ? (
                    <span lang="zh" className="block font-serif text-[11px] leading-none text-faint">
                      {m.nameZh}
                    </span>
                  ) : null}
                </th>
                {model.stages.map((s) => {
                  const v = cellView(model, m.id, s.id, filter);
                  const columnSelected = selection?.stage === s.id;
                  const picked = rowSelected && columnSelected;
                  return (
                    <td key={s.id} className={cn("p-0.5 text-center", columnSelected && !rowSelected && "bg-foreground/[0.05]")}>
                      {v && isMarked(v) ? (
                        <button
                          type="button"
                          aria-pressed={picked}
                          aria-label={`${m.nameEn}, ${s.label}: ${cellSummary(v.counts)}`}
                          onClick={() => onSelect({ materialId: m.id, stage: s.id })}
                          className={cn(
                            "block w-full rounded-md px-0.5 py-1 outline-offset-1 transition-colors hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                            picked && "bg-foreground/10 ring-1 ring-foreground/70",
                          )}
                        >
                          <CellMarks counts={v.counts} />
                          {showCounts ? <CountLine counts={v.counts} /> : null}
                        </button>
                      ) : (
                        <span aria-hidden className={cn("block text-center font-mono text-xs text-faint/50", showCounts ? "py-5" : "py-3.5")}>
                          ·
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Mobile uses readable controls and the same selected-cell records, not miniature desktop columns.
function MobileLattice({ model, filter, selection, onSelect }: { model: LatticeModel; filter: LatticeFilter; selection: Selection | null; onSelect: (s: Selection) => void }) {
  const id = useId();
  return <div className="md:hidden">
    <label htmlFor={id} className="font-display text-sm text-muted">Material</label>
    <select id={id} value={selection?.materialId ?? ""} onChange={e => onSelect({ materialId: e.target.value, stage: selection?.stage ?? model.stages[0].id })} className="mt-2 min-h-11 w-full rounded border border-border-strong bg-card px-3 font-display text-base">
      <option value="" disabled>Select a material</option>{model.materials.map(m => <option key={m.id} value={m.id}>{m.nameEn}</option>)}
    </select>
    <p className="mt-4 font-display text-sm text-muted">Supply-chain stage · select to inspect</p>
    <div className="mt-2 grid grid-cols-2 gap-2">
      {model.stages.map(stage => {
        const view = selection ? cellView(model, selection.materialId, stage.id, filter) : null;
        return <button key={stage.id} type="button" disabled={!selection} aria-pressed={selection?.stage === stage.id} onClick={() => selection && onSelect({ ...selection, stage: stage.id })} className={cn("min-h-14 rounded border border-border-strong px-3 py-2 text-left font-display text-sm", selection?.stage === stage.id && "border-accent ring-1 ring-accent")}>
          <span className="block">{stage.label}{selection?.stage === stage.id ? <span aria-hidden className="ml-2">✓</span> : null}</span><span className="mt-1 block text-xs text-muted">{view ? cellSummary(view.counts) || "No counted records" : "No counted records"}</span>
        </button>;
      })}
    </div>
  </div>;
}

function unstagedRecords(model: LatticeModel, un: LatticeModel["unstaged"][string], filter: LatticeFilter) {
  const ids = [...(filter.kinds.commitments ? un.commitments : []), ...(filter.kinds.controls ? un.controls : []), ...(filter.kinds.designations ? un.designations : [])];
  return ids.map((id) => model.records[id]).filter((r) => r && (filter.actor === "all" || r.actor === filter.actor));
}

// --- Legend --------------------------------------------------------------------------------------

export function LatticeLegend({ model, className }: { model: LatticeModel; className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-display text-sm font-semibold text-foreground">What each mark counts</h2>
      <ul className="mt-3 space-y-3 font-display text-[13px] leading-5 text-muted">
        <li className="flex gap-3">
          <KindSwatch kind="commitments" className="mt-1" />
          <span>Government commitments that have not ended: capital rows in the commitment role with a named providing government. A package counts once; its parts are not counted again.</span>
        </li>
        <li className="flex gap-3">
          <KindSwatch kind="controls" className="mt-1" />
          <span>Control clauses of any status on {formatDate(model.asOf)}, placed at the stage their covered items belong to.</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden className="mt-1 inline-flex shrink-0 -space-x-1">
            <KindSwatch kind="commitments" />
            <KindSwatch kind="controls" />
          </span>
          <span>Both at one stage. They sit side by side; the record does not link a clause to a financing.</span>
        </li>
        <li className="flex gap-3">
          <KindSwatch kind="designations" className="mt-1" />
          <span>One or more project designations: standing, not money. Select a node for the number.</span>
        </li>
      </ul>
      <div className="mt-4 flex items-center gap-4 text-[13px] text-muted">
        <AreaKey />
        <span className="leading-5">Dot area is the number of records, never money or effectiveness.</span>
      </div>
    </div>
  );
}

// --- Overview ------------------------------------------------------------------------------------

function SelectionPreview({ model, query }: { model: LatticeModel; query: ResearchQuery }) {
  const { view } = researchQueryResult(model, query);
  const material = model.materials.find(m => m.id === query.selection?.materialId);
  if (!query.selection || !material) return null;
  const first = view?.commitments[0] ?? view?.controls[0] ?? view?.designations[0];
  const project = first?.projects?.[0];
  return <div aria-live="polite" className="mt-5 border-t border-border-strong pt-4 font-display text-sm leading-6">
    <h3 className="font-semibold">{material.nameEn} × {stageLabel(model, query.selection.stage)}</h3>
    <p className="mt-1 text-muted">{view ? cellSummary(view.counts) || "No counted records" : "No record at this cell under these filters"}.</p>
    {first ? <Link href={first.href} className="mt-2 block text-accent underline underline-offset-4">Read a {first.kind === "control" ? "control clause" : first.kind === "designation" ? "designation" : "financial instrument"}</Link> : null}
    {project ? <Link href={project.href} className="mt-2 block text-accent underline underline-offset-4">Investigate {project.name}</Link> : null}
    <Link href={researchQueryHref(model, query, "/compare")} className="mt-2 block text-muted underline underline-offset-4">Compare this selection</Link>
  </div>;
}

export function LatticeOverview({ model, preferred, intro }: { model: LatticeModel; preferred: Preferred; intro: ReactNode }) {
  const { query, update, select } = useResearchQuery(model, preferred);
  return <>
    <div className="grid gap-7 lg:grid-cols-[18rem_1fr] lg:gap-10">
      <div>{intro}<div className="hidden lg:block"><SelectionPreview model={model} query={query} /><LatticeKey model={model} /></div>
      </div>
      <section className="min-w-0" aria-label="Materials by supply-chain stage">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold">Materials by supply-chain stage</h2>
          <span className="font-display text-xs text-muted">Select a marked cell to inspect its records</span>
        </div>
        <QueryControls model={model} query={query} update={update} />
        <QueryIssues query={query} />
        <div className="mt-5"><LatticeTable model={model} filter={query.filter} selection={query.selection} onSelect={select} showCounts={false} /><MobileLattice model={model} filter={query.filter} selection={query.selection} onSelect={select} /></div>
        <div className="lg:hidden"><LatticeKey model={model} /></div>
      </section>
    </div>
    <p className="mt-5 max-w-4xl font-display text-xs leading-5 text-muted">A record can occupy several stages; rows and columns are never totalled. Empty cells describe the coded corpus, not an absence of government activity. <NotPlacedSentence gaps={model.gaps} /></p>
    <div className="mt-7" id="selected-evidence"><RecordsPanel model={model} filter={query.filter} selection={query.selection} query={query} compact /></div>
  </>;
}

/** Keep the symbol key visible; full counting qualifications remain one disclosure away. */
function LatticeKey({ model }: { model: LatticeModel }) {
  return <div className="mt-5">
    <LatticeLegendCompact />
    <details className="mt-3 font-display text-xs text-muted">
      <summary className="cursor-pointer py-2 text-foreground">Counting rules and qualifications</summary>
      <LatticeLegend model={model} className="mt-2" />
    </details>
  </div>;
}

/** Compact mark meanings shared by the desktop rail and mobile lattice. */
function LatticeLegendCompact() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 font-display text-xs leading-5 text-muted">
      <li className="flex gap-2"><KindSwatch kind="commitments" className="mt-0.5" /> Government commitments not ended, a package once</li>
      <li className="flex gap-2"><KindSwatch kind="controls" className="mt-0.5" /> Control clauses, any status</li>
      <li className="flex gap-2"><KindSwatch kind="designations" className="mt-0.5" /> Designations: standing, not money</li>
      <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 font-mono text-[10px] text-faint">○ ◯</span> Area: number of records, never money</li>
    </ul>
  );
}

// --- Compare -------------------------------------------------------------------------------------

function ProjectLinks({ projects }: { projects: LatticeCommitment["projects"] }) {
  return projects?.length ? <ul className="mt-2 space-y-1 font-display text-xs leading-5 text-paper-muted">{projects.map(p => <li key={p.id}><Link href={p.href} className="text-paper-accent underline underline-offset-2">Investigate {p.name}</Link><span className="block">{p.relationship === "direct_finance" ? "Explicit financial project link" : p.relationship === "designation" ? "Designated project; standing, not money" : "Shared package association; amount not allocated to this project"}</span></li>)}</ul> : null;
}

export function CommitmentItem({ r }: { r: LatticeCommitment }) {
  return (
    <li className="py-3 first:pt-0">
      <div className="flex gap-3">
        <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded border border-paper-border px-1 font-mono text-[10px] text-paper-faint">{r.actorShort}</span>
        <div className="min-w-0 flex-1">
          <Link href={r.href} className="font-display text-sm font-semibold leading-snug text-paper-foreground hover:underline">
            {r.title}
          </Link>
          <p className="tnum mt-1 text-sm text-paper-foreground">
            {r.amount ? (
              <>
                {r.amount.basisLabel ? <span className="text-paper-faint">{r.amount.basisLabel} </span> : null}
                {r.amount.qualifier ? <span className="text-paper-faint">{r.amount.qualifier} </span> : null}
                <span className="text-paper-faint">{r.amount.currency} </span>
                <strong className="font-semibold">{r.amount.value}</strong>
              </>
            ) : (
              <em className="text-paper-faint">No amount stated</em>
            )}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-paper-muted">
            {r.instrument}. {r.status}.
          </p>
          <ProjectLinks projects={r.projects} />
        </div>
      </div>
    </li>
  );
}

function ControlItem({ r, stage, asOf }: { r: LatticeControl; stage: string; asOf: string }) {
  return (
    <li className="py-3 first:pt-0">
      <div className="flex gap-3">
        <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded border border-paper-border px-1 font-mono text-[10px] text-paper-faint">{r.actorShort}</span>
        <div className="min-w-0 flex-1">
          <Link href={r.href} className="font-display text-sm font-semibold leading-snug text-paper-foreground hover:underline">
            {r.title}
          </Link>
          {r.documentNumber ? <p className="mt-0.5 font-mono text-[11px] text-paper-faint">{r.documentNumber}</p> : null}
          <p className="mt-1 text-xs leading-5 text-paper-muted">
            Status on {formatDate(asOf)}: {r.status}.{r.items ? ` Covered items (${r.items}) belong at ${stage.toLowerCase()}.` : ""}
          </p>
        </div>
      </div>
    </li>
  );
}

function DesignationItem({ r }: { r: LatticeDesignation }) {
  return (
    <li className="py-3 first:pt-0">
      <div className="flex gap-3">
        <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded border border-paper-border px-1 font-mono text-[10px] text-paper-faint">{r.actorShort}</span>
        <div className="min-w-0 flex-1">
          <Link href={r.href} className="font-display text-sm font-semibold leading-snug text-paper-foreground hover:underline">
            {r.title}
          </Link>
          <p className="mt-1 text-xs leading-5 text-paper-muted">
            {r.programme}. {r.status}.
          </p>
          <ProjectLinks projects={r.projects} />
          {r.asStated ? <p className="mt-1 text-xs leading-5 text-paper-faint">Name as stated: {r.asStated}</p> : null}
        </div>
      </div>
    </li>
  );
}

function PanelHeading({ kind, children, note }: { kind: MarkKind; children: ReactNode; note?: string }) {
  return (
    <h4 className="mb-2 mt-5 flex items-baseline gap-2 font-display text-sm font-semibold text-paper-foreground">
      <KindSwatch kind={kind} className="self-center" onPaper />
      {children}
      {note ? <span className="text-xs font-normal text-paper-faint">{note}</span> : null}
    </h4>
  );
}

function RecordsPanel({ model, filter, selection, query, compact = false }: { model: LatticeModel; filter: LatticeFilter; selection: Selection | null; query: ResearchQuery; compact?: boolean }) {
  const material = selection && model.materials.find((m) => m.id === selection.materialId);
  if (!selection || !material) return null;
  const v = researchQueryResult(model, query).view;
  const label = stageLabel(model, selection.stage);
  const un = model.unstaged[material.id];
  const unVisible = un ? unstagedRecords(model, un, filter) : [];
  return (
    <aside aria-live="polite" aria-label="Selected node" className={cn("rounded-lg bg-paper p-5 font-display text-paper-foreground", compact && "selected-evidence")}>
      <p className="font-display text-xs text-paper-faint">Selected node</p>
      <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight">
        {material.nameEn} × {label}
      </h3>
      {v ? (
        <>
          <p className="mt-1.5 text-sm leading-5 text-paper-muted">{cellSummary(v.counts) || "No counted records"}. Listed by kind, never added together.</p>
          {v.counts.commitments ? (
            <>
              <PanelHeading kind="commitments" note="in their own currencies">
                Government commitments
              </PanelHeading>
              <ul className="divide-y divide-paper-border">{v.commitments.map((r) => <CommitmentItem key={r.id} r={r} />)}</ul>
            </>
          ) : null}
          {v.options.length ? (
            <>
              <PanelHeading kind="commitments" note="listed apart">Funding options, not commitments</PanelHeading>
              <p className="mb-2 text-xs leading-5 text-paper-muted">A funding option is a right to call on money, not an exercise of it, so it is not counted above.</p>
              <ul className="divide-y divide-paper-border">{v.options.map((r) => <CommitmentItem key={r.id} r={r} />)}</ul>
            </>
          ) : null}
          {v.ended.length ? (
            <>
              <PanelHeading kind="commitments" note="listed apart">Withdrawn or lapsed</PanelHeading>
              <p className="mb-2 text-xs leading-5 text-paper-muted">An ended row is not capital and is not counted above.</p>
              <ul className="divide-y divide-paper-border">{v.ended.map((r) => <CommitmentItem key={r.id} r={r} />)}</ul>
            </>
          ) : null}
          {v.counts.controls ? (
            <>
              <PanelHeading kind="controls">Control clauses</PanelHeading>
              <ul className="divide-y divide-paper-border">{v.controls.map((r) => <ControlItem key={r.id} r={r} stage={label} asOf={model.asOf} />)}</ul>
            </>
          ) : null}
          {v.counts.designations ? (
            <>
              <PanelHeading kind="designations">Designations</PanelHeading>
              <ul className="divide-y divide-paper-border">{v.designations.map((r) => <DesignationItem key={r.id} r={r} />)}</ul>
            </>
          ) : null}
          <div className="mt-5 rounded-lg border border-paper-border bg-paper-border/40 p-3.5">
            <p className="font-display text-sm font-semibold">Shared codes, not a finding</p>
            <p className="mt-1 text-[13px] leading-5 text-paper-muted">
              These records share a material and a stage. The record does not say that any clause prompted a commitment or a designation, or the reverse.
            </p>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-paper-muted">No record of the kinds and government now selected sits at this node. Change the filters above to see the others.</p>
      )}
      {unVisible.length ? (
        <div className="mt-5 border-t border-paper-border pt-4">
          <p className="font-display text-sm font-semibold">{material.nameEn}: records with no stage</p>
          <p className="mt-1 text-[13px] leading-5 text-paper-muted">These name this material but record no stage, so they are not on the lattice.</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {unVisible.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded border border-paper-border px-1 font-mono text-[10px] text-paper-faint">{r.actorShort}</span>
                <Link href={r.href} className="leading-snug hover:underline">
                  {r.title}
                  <span className="text-paper-faint"> · {r.kind === "control" ? "control clause" : r.kind === "designation" ? "designation" : "commitment"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-5 grid gap-2">
        <Link href={researchQueryHref(model, query, "/compare")} className="flex items-center justify-center rounded-md bg-paper-foreground px-4 py-2.5 font-display text-sm font-semibold text-paper hover:bg-paper-foreground/90">
          Compare this selection
        </Link>
        <Link href={`/materials/${material.slug}#stage-${selection.stage}`} className="flex items-center justify-center rounded-md border border-paper-border px-4 py-2.5 font-display text-sm font-semibold hover:bg-paper-border/40">
          Open the {material.nameEn.toLowerCase()} dossier
        </Link>
      </div>
    </aside>
  );
}

function GovernmentSplit({ model, filter, materialId }: { model: LatticeModel; filter: LatticeFilter; materialId: string }) {
  const rows = governmentRows(model, materialId, filter);
  const stages = model.stages.filter((s) => rows.some((r) => r.cells[s.id]));
  if (!rows.length)
    return <p className="rounded-xl bg-background p-6 text-sm text-muted">No record of the kinds and government now selected is coded to this material at a stage.</p>;
  return (
    <>
      <ul className="divide-y divide-border/70 rounded-xl bg-background px-4 py-1 md:hidden">
        {rows.map((r) => (
          <li key={r.actor} className="py-4">
            <p className="font-display text-sm font-semibold text-foreground">{r.name}</p>
            <p className="font-display text-xs text-faint">{r.roles.join(", ")}</p>
            <ul className="mt-2 space-y-1">
              {stages.map((s) => {
                const c = r.cells[s.id];
                if (!c) return null;
                return (
                  <li key={s.id} className="flex items-baseline gap-3 text-sm">
                    <span className="w-28 shrink-0 font-display text-muted">{s.label}</span>
                    <span className="flex flex-wrap items-center gap-x-3 font-mono text-xs text-foreground">
                      <span className="sr-only">{cellSummary(c)}</span>
                      <CountLine counts={c} inline />
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    <div className="hidden overflow-x-auto rounded-xl bg-background p-4 sm:p-6 md:block">
      <table className="w-full min-w-[34rem] border-collapse">
        <caption className="sr-only">Records for this material by government and supply-chain stage, each kind counted on its own</caption>
        <thead>
          <tr>
            <td />
            {stages.map((s) => (
              <th key={s.id} scope="col" className="px-1 pb-3 align-bottom text-center font-display text-xs font-normal leading-tight text-muted">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.actor}>
              <th scope="row" className="py-1 pr-4 text-right font-normal">
                <span className="block font-display text-sm text-foreground">{r.name}</span>
                <span className="block font-display text-[11px] leading-tight text-faint">{r.roles.join(", ")}</span>
              </th>
              {stages.map((s) => {
                const c = r.cells[s.id];
                return (
                  <td key={s.id} className="p-0.5 text-center">
                    {c ? (
                      <span role="img" aria-label={`${r.name}, ${s.label}: ${cellSummary(c)}`} className="block py-1">
                        <CellMarks counts={c} />
                        <CountLine counts={c} />
                      </span>
                    ) : (
                      <span aria-hidden className="block py-5 font-mono text-xs text-faint/50">·</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

/**
 * Compare: the lattice with filters and a records panel (dark section), then one material split by government
 * (paper section). Both sections share the selected material.
 */
export function LatticeCompare({ model, preferred }: { model: LatticeModel; preferred: Preferred }) {
  const { query, update, select } = useResearchQuery(model, preferred);
  const { selection, filter } = query;
  const material = selection && model.materials.find(m => m.id === selection.materialId);
  const nothingShown = query.kind === "none";
  return (
    <>
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <ControlGapNotice gaps={model.gaps} />

          <div className="mt-6"><QueryControls model={model} query={query} update={update} /><QueryIssues query={query} /></div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
            <div className="min-w-0">
              {nothingShown ? (
                <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted">Every kind is turned off. Choose at least one above to see records placed on the lattice.</p>
              ) : (
                <>
                  <LatticeTable model={model} filter={filter} selection={selection} onSelect={select} showCounts />
                  <MobileLattice model={model} filter={filter} selection={selection} onSelect={select} />
                </>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs leading-5 text-muted">
                <span className="inline-flex items-center gap-2"><KindSwatch kind="commitments" /> Government commitments not ended, a package once</span>
                <span className="inline-flex items-center gap-2"><KindSwatch kind="controls" /> Clauses of any status, where covered items belong</span>
                <span className="inline-flex items-center gap-2"><KindSwatch kind="designations" /> Designations: standing, not money</span>
                <span className="text-faint">Numbers are record counts. A record at several stages appears at each; no row or column is totalled.</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <RecordsPanel model={model} filter={filter} selection={selection} query={query} />
              </div>
            </div>
          </div>

          <NotOnLatticeStats gaps={model.gaps} className="mt-10 border-t border-border pt-6" />
        </div>
      </section>

      <div className="border-b border-border bg-background px-4 py-10 sm:px-6 lg:hidden">
        <div className="mx-auto max-w-2xl">
          <RecordsPanel model={model} filter={filter} selection={selection} query={query} />
        </div>
      </div>

      {material ? (
        <section className="bg-paper text-paper-foreground">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="border-t border-paper-foreground/70 pt-8">
              <h2 className="font-serif text-3xl font-semibold leading-tight">{material.nameEn} by government and stage</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-paper-muted">
                The same counts for one material, split by the government each record names: the providing government of a commitment, the issuer of a clause, the designating government of a
                designation.
              </p>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_17rem]">
              <GovernmentSplit model={model} filter={filter} materialId={material.id} />
              <div className="space-y-5 text-sm leading-6 lg:border-l lg:border-paper-border lg:pl-6">
                <div>
                  <h3 className="font-display text-sm font-semibold">Reading this view</h3>
                  <p className="mt-1 text-paper-muted">
                    A government appears in the role its records give it, and can hold more than one. Counts are records, not money, and not a measure of how much a government has done.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">Choosing the material</h3>
                  <p className="mt-1 text-paper-muted">Select any marked node on the lattice above; this section follows the material you select.</p>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">Filtering</h3>
                  <p className="mt-1 text-paper-muted">&ldquo;Government&rdquo; applies the same rule to the whole lattice above: providers for commitments, issuers for clauses, designating governments for designations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
