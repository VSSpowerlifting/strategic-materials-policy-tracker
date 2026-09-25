"use client";

/**
 * The lattice views. `LatticeOverview` is the front-page hero (the whole lattice, one selected node, no
 * controls); `LatticeCompare` adds the kind toggles, the government filter, a records panel for the selected
 * node and a one-material split by government. Both read a serialized `LatticeModel` and count records of one
 * kind at a time: a cell never shows a sum across kinds, a row or column is never totalled, and money appears
 * only as a row's own amount in its own currency. The selected node lives in the URL hash so a view can be
 * shared without making the route dynamic.
 */
import Link from "next/link";
import { useCallback, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { controlStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { LatticeCommitment, LatticeControl, LatticeDesignation, LatticeModel } from "@/lib/lattice";
import {
  ALL_KINDS,
  NO_FILTER,
  cellView,
  countWord,
  defaultSelection,
  governmentRows,
  isMarked,
  parseSelection,
  type CellView,
  type KindVisibility,
  type LatticeFilter,
} from "@/lib/lattice-view";
import type { ControlStatus, JurisdictionCode, SupplyChainStage } from "@/lib/types";
import { AreaKey, CellMarks, KindSwatch, stageShortLabels, type MarkKind } from "./marks";
import { NotOnLatticeStats, ControlGapNotice } from "./not-on-lattice";

type Selection = { materialId: string; stage: SupplyChainStage };
type Preferred = { slug: string; stage: SupplyChainStage };

// --- Selection in the URL hash -------------------------------------------------------------------

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => window.location.hash;
const serverHash = () => "";

function useSelection(model: LatticeModel, preferred: Preferred): [Selection | null, (s: Selection) => void] {
  const hash = useSyncExternalStore(subscribeHash, readHash, serverHash);
  const selection = parseSelection(model, hash) ?? defaultSelection(model, preferred);
  const select = useCallback(
    (s: Selection) => {
      const slug = model.materials.find((m) => m.id === s.materialId)?.slug ?? s.materialId;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${slug}:${s.stage}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    [model],
  );
  return [selection, select];
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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={cn("h-3 w-3 shrink-0 text-faint transition-transform motion-reduce:transition-none", open && "rotate-180")}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    <div className="hidden md:block">
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

// --- The phone lattice ---------------------------------------------------------------------------

function MobileLattice({
  model,
  filter,
  openId,
  onToggle,
}: {
  model: LatticeModel;
  filter: LatticeFilter;
  openId: string | null;
  onToggle: (materialId: string) => void;
}) {
  const cols = { gridTemplateColumns: `repeat(${model.stages.length}, minmax(0, 1fr))` };
  return (
    <div className="md:hidden">
      <div className="flex items-end gap-2 pl-[6.5rem] pr-6" aria-hidden>
        <div className="grid h-[4.75rem] flex-1 items-end" style={cols}>
          {model.stages.map((s) => (
            <span key={s.id} className="relative block h-full">
              <span className="absolute bottom-0 left-1/2 origin-bottom-left -rotate-[55deg] whitespace-nowrap font-display text-[11px] text-muted">{stageShortLabels[s.id]}</span>
            </span>
          ))}
        </div>
      </div>
      <ul className="mt-2 divide-y divide-border/70 border-y border-border/70">
        {model.materials.map((m) => {
          const open = openId === m.id;
          const panelId = `lattice-${m.id}`;
          return (
            <li key={m.id} className={cn(open && "bg-foreground/[0.05]")}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => onToggle(m.id)}
                className="grid w-full grid-cols-[6.25rem_1fr_1.25rem] items-center gap-x-2 py-1.5 pl-1 pr-1 text-left outline-offset-[-2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span className={cn("font-display text-sm leading-tight", open ? "font-semibold text-accent" : "text-foreground")}>{m.nameEn}</span>
                <span className="grid" style={cols}>
                  {model.stages.map((s) => {
                    const v = cellView(model, m.id, s.id, filter);
                    return v && isMarked(v) ? <CellMarks key={s.id} counts={v.counts} compact /> : <span key={s.id} aria-hidden className="block text-center font-mono text-[10px] text-faint/40">·</span>;
                  })}
                </span>
                <Chevron open={open} />
              </button>
              {open ? <MobileMaterialDetail id={panelId} model={model} filter={filter} materialId={m.id} /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusCounts({ controls }: { controls: LatticeControl[] }) {
  const by = new Map<ControlStatus, number>();
  for (const c of controls) if (c.statusKey) by.set(c.statusKey, (by.get(c.statusKey) ?? 0) + 1);
  return <>{[...by].map(([s, n]) => `${n} ${controlStatusLabels[s].toLowerCase()}`).join(", ")}</>;
}

function MobileMaterialDetail({ id, model, filter, materialId }: { id: string; model: LatticeModel; filter: LatticeFilter; materialId: string }) {
  const material = model.materials.find((m) => m.id === materialId)!;
  const un = model.unstaged[materialId];
  const unVisible = un ? unstagedRecords(model, un, filter) : [];
  return (
    <div id={id} className="border-t border-border/60 px-1 pb-4 pt-1 text-sm">
      <dl className="divide-y divide-border/60">
        {model.stages.map((s) => {
          const v = cellView(model, materialId, s.id, filter);
          if (!v || !isMarked(v)) return null;
          return (
            <div key={s.id} className="grid grid-cols-[6.25rem_1fr] gap-x-3 py-2.5">
              <dt className="font-display font-semibold text-foreground">{s.label}</dt>
              <dd className="space-y-1.5 text-muted">
                {v.counts.commitments ? (
                  <p className="flex items-baseline gap-2">
                    <KindSwatch kind="commitments" />
                    <span>
                      <span className="text-foreground">{countWord(v.counts.commitments, "commitment", "commitments")}</span> <span className="font-mono text-[11px] text-faint">{v.actors.commitments.join(" ")}</span>
                    </span>
                  </p>
                ) : null}
                {v.counts.controls ? (
                  <p className="flex items-baseline gap-2">
                    <KindSwatch kind="controls" />
                    <span>
                      <span className="text-foreground">{countWord(v.counts.controls, "clause", "clauses")}</span>{" "}
                      <span className="font-mono text-[11px] text-faint">{v.actors.controls.join(" ")}, <StatusCounts controls={v.controls} /></span>
                    </span>
                  </p>
                ) : null}
                {v.counts.designations ? (
                  <p className="flex items-baseline gap-2">
                    <KindSwatch kind="designations" />
                    <span>
                      <span className="text-foreground">{countWord(v.counts.designations, "designation", "designations")}</span> <span className="font-mono text-[11px] text-faint">{v.actors.designations.join(" ")}</span>
                    </span>
                  </p>
                ) : null}
              </dd>
            </div>
          );
        })}
        {unVisible.length ? (
          <div className="grid grid-cols-[6.25rem_1fr] gap-x-3 py-2.5">
            <dt className="font-display font-semibold text-foreground">No stage</dt>
            <dd className="text-faint">
              {unVisible.length} record{unVisible.length === 1 ? "" : "s"} ({unVisible.map((r) => r.actorShort).join(", ")}) record no stage: not on the lattice.
            </dd>
          </div>
        ) : null}
      </dl>
      <Link
        href={`/materials/${material.slug}`}
        className="mt-3 flex items-center justify-center rounded-md bg-paper px-4 py-2.5 font-display text-sm font-semibold text-paper-foreground hover:bg-paper/90"
      >
        Open the {material.nameEn.toLowerCase()} material page →
      </Link>
    </div>
  );
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
      <ul className="mt-3 space-y-3 text-[13px] leading-5 text-muted">
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
        <span className="leading-5">Dot area is the number of records, never money.</span>
      </div>
    </div>
  );
}

// --- Overview ------------------------------------------------------------------------------------

function NodeSummary({ model, selection }: { model: LatticeModel; selection: Selection | null }) {
  const material = selection && model.materials.find((m) => m.id === selection.materialId);
  const v = selection ? cellView(model, selection.materialId, selection.stage) : null;
  if (!selection || !material || !v) return null;
  const label = stageLabel(model, selection.stage);
  const col = "border-t border-border p-4 md:border-l md:border-t-0 md:p-5";
  return (
    <div className="mt-5 grid rounded-lg border border-border-strong bg-card md:grid-cols-[1.15fr_1fr_1fr_1fr]" aria-live="polite">
      <div className="p-4 md:p-5">
        <h3 className="font-serif text-lg font-semibold leading-snug text-foreground">
          {material.nameEn} at {label.toLowerCase()}
        </h3>
        <p className="mt-1 text-sm leading-5 text-muted">Selected node. The three counts are never added together.</p>
        <Link
          href={`/compare#${material.slug}:${selection.stage}`}
          className="mt-3 inline-block font-display text-sm font-semibold text-accent hover:text-accent-strong"
        >
          Compare this node →
        </Link>
      </div>
      <div className={col}>
        <p className="flex items-center gap-2 font-display text-xs text-muted">
          <KindSwatch kind="commitments" /> Government commitments
        </p>
        <p className="tnum mt-2 font-display text-3xl font-semibold leading-none text-foreground">{v.counts.commitments}</p>
        <p className="mt-1.5 text-xs leading-5 text-faint">{v.counts.commitments ? `from ${v.actors.commitments.join(", ")}; a package once` : "none recorded here"}</p>
      </div>
      <div className={col}>
        <p className="flex items-center gap-2 font-display text-xs text-muted">
          <KindSwatch kind="controls" /> Control clauses
        </p>
        <p className="tnum mt-2 font-display text-3xl font-semibold leading-none text-foreground">{v.counts.controls}</p>
        <p className="mt-1.5 text-xs leading-5 text-faint">
          {v.counts.controls ? (
            <>
              issued by {v.actors.controls.join(", ")}: <StatusCounts controls={v.controls} />
            </>
          ) : (
            "none recorded here"
          )}
        </p>
      </div>
      <div className={col}>
        <p className="flex items-center gap-2 font-display text-xs text-muted">
          <KindSwatch kind="designations" /> Designations
        </p>
        <p className="tnum mt-2 font-display text-3xl font-semibold leading-none text-foreground">{v.counts.designations}</p>
        <p className="mt-1.5 text-xs leading-5 text-faint">{v.counts.designations ? `by ${v.actors.designations.join(", ")}; standing, not money` : "none recorded here"}</p>
      </div>
    </div>
  );
}

export function LatticeOverview({ model, preferred, intro }: { model: LatticeModel; preferred: Preferred; intro: ReactNode }) {
  const [selection, select] = useSelection(model, preferred);
  const [mobileOpen, setMobileOpen] = useState<string | null | undefined>(undefined);
  const openId = mobileOpen === undefined ? (selection?.materialId ?? null) : mobileOpen;
  const toggleMobile = (id: string) => {
    setMobileOpen(openId === id ? null : id);
    if (openId !== id) {
      const first = model.stages.find((s) => isMarked(cellView(model, id, s.id)));
      if (first) select({ materialId: id, stage: first.id });
    }
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[19rem_1fr] lg:gap-12">
      <div>{intro}</div>
      <div className="min-w-0">
        <div className="rounded-lg border border-border bg-card/40 p-3 md:border-0 md:bg-transparent md:p-0">
          <div className="mb-3 flex items-baseline justify-between md:hidden">
            <h2 className="font-display text-base font-semibold text-foreground">Materials by stage</h2>
            <span className="font-display text-xs text-faint">Tap a material</span>
          </div>
          <div className="mb-4 md:hidden">
            <LatticeLegendCompact />
          </div>
          <LatticeTable model={model} filter={NO_FILTER} selection={selection} onSelect={select} showCounts={false} />
          <MobileLattice model={model} filter={NO_FILTER} openId={openId} onToggle={toggleMobile} />
        </div>
        <div className="hidden md:block">
          <NodeSummary model={model} selection={selection} />
        </div>
      </div>
    </div>
  );
}

/** The four mark meanings in two short lines, for the phone lattice. */
function LatticeLegendCompact() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs leading-4 text-muted">
      <li className="flex gap-2"><KindSwatch kind="commitments" className="mt-0.5" /> Government commitments not ended, a package once</li>
      <li className="flex gap-2"><KindSwatch kind="controls" className="mt-0.5" /> Control clauses, any status</li>
      <li className="flex gap-2"><KindSwatch kind="designations" className="mt-0.5" /> Designations: standing, not money</li>
      <li className="flex items-start gap-2"><span aria-hidden className="mt-0.5 font-mono text-[10px] text-faint">○ ◯</span> Area: number of records, never money</li>
    </ul>
  );
}

// --- Compare -------------------------------------------------------------------------------------

const KIND_TOGGLES: { key: keyof KindVisibility; label: string; kind: MarkKind }[] = [
  { key: "commitments", label: "Commitments", kind: "commitments" },
  { key: "controls", label: "Control clauses", kind: "controls" },
  { key: "designations", label: "Designations", kind: "designations" },
];

function KindToggle({ label, kind, checked, onChange }: { label: string; kind: MarkKind; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="inline-flex items-center gap-2 rounded-full border border-border-strong px-3 py-1.5 font-display text-xs text-muted transition-colors peer-checked:border-accent/60 peer-checked:bg-elevated peer-checked:text-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
        <svg viewBox="0 0 12 12" aria-hidden className={cn("h-3 w-3 rounded-[3px] border border-border-strong", checked ? "border-transparent bg-foreground text-background" : "text-transparent")}>
          <path d="m2.5 6.2 2.3 2.3 4.7-4.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <KindSwatch kind={kind} />
        {label}
      </span>
    </label>
  );
}

function CommitmentItem({ r }: { r: LatticeCommitment }) {
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

function RecordsPanel({ model, filter, selection }: { model: LatticeModel; filter: LatticeFilter; selection: Selection | null }) {
  const material = selection && model.materials.find((m) => m.id === selection.materialId);
  if (!selection || !material) return null;
  const v = cellView(model, selection.materialId, selection.stage, filter);
  const label = stageLabel(model, selection.stage);
  const un = model.unstaged[material.id];
  const unVisible = un ? unstagedRecords(model, un, filter) : [];
  const marked = isMarked(v);
  return (
    <aside aria-live="polite" aria-label="Selected node" className="rounded-xl bg-paper p-5 text-paper-foreground shadow-lg shadow-black/30">
      <p className="font-display text-xs text-paper-faint">Selected node</p>
      <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight">
        {material.nameEn} × {label}
      </h3>
      {marked && v ? (
        <>
          <p className="mt-1.5 text-sm leading-5 text-paper-muted">{cellSummary(v.counts)}. Listed by kind, never added together.</p>
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
        <Link href="/capital" className="flex items-center justify-center rounded-md bg-paper-foreground px-4 py-2.5 font-display text-sm font-semibold text-paper hover:bg-paper-foreground/90">
          Explore all capital rows
        </Link>
        <Link href={`/materials/${material.slug}`} className="flex items-center justify-center rounded-md border border-paper-border px-4 py-2.5 font-display text-sm font-semibold hover:bg-paper-border/40">
          Open the {material.nameEn.toLowerCase()} material page
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
  const [selection, select] = useSelection(model, preferred);
  const [kinds, setKinds] = useState<KindVisibility>(ALL_KINDS);
  const [actor, setActor] = useState<JurisdictionCode | "all">("all");
  const [mobileOpen, setMobileOpen] = useState<string | null | undefined>(undefined);
  const filter: LatticeFilter = { kinds, actor };
  const govId = useId();
  const openId = mobileOpen === undefined ? (selection?.materialId ?? null) : mobileOpen;
  const toggleMobile = (id: string) => {
    setMobileOpen(openId === id ? null : id);
    if (openId !== id) {
      const first = model.stages.find((s) => isMarked(cellView(model, id, s.id, filter)));
      if (first) select({ materialId: id, stage: first.id });
    }
  };
  const material = selection && model.materials.find((m) => m.id === selection.materialId);
  const nothingShown = !kinds.commitments && !kinds.controls && !kinds.designations;
  return (
    <>
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <ControlGapNotice gaps={model.gaps} />

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 lg:justify-end">
            <span className="font-display text-xs text-faint">Show</span>
            {KIND_TOGGLES.map((t) => (
              <KindToggle key={t.key} label={t.label} kind={t.kind} checked={kinds[t.key]} onChange={(v) => setKinds((k) => ({ ...k, [t.key]: v }))} />
            ))}
            <span className="hidden h-5 w-px bg-border-strong lg:block" aria-hidden />
            <label htmlFor={govId} className="inline-flex items-center gap-2 font-display text-xs text-muted">
              Government
              <select
                id={govId}
                value={actor}
                onChange={(e) => setActor(e.target.value as JurisdictionCode | "all")}
                className="rounded-md border border-border-strong bg-card px-2.5 py-1.5 font-display text-xs font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="all">All</option>
                {model.actors.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="inline-flex items-center rounded-md border border-border-strong px-2.5 py-1.5 font-display text-xs text-muted">
              Status on <time dateTime={model.asOf} className="tnum ml-1 font-semibold text-foreground">{formatDate(model.asOf)}</time>
            </span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
            <div className="min-w-0">
              {nothingShown ? (
                <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted">Every kind is turned off. Choose at least one above to see records placed on the lattice.</p>
              ) : (
                <>
                  <LatticeTable model={model} filter={filter} selection={selection} onSelect={select} showCounts />
                  <MobileLattice model={model} filter={filter} openId={openId} onToggle={toggleMobile} />
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
                <RecordsPanel model={model} filter={filter} selection={selection} />
              </div>
            </div>
          </div>

          <NotOnLatticeStats gaps={model.gaps} className="mt-10 border-t border-border pt-6" />
        </div>
      </section>

      <div className="border-b border-border bg-background px-4 py-10 sm:px-6 lg:hidden">
        <div className="mx-auto max-w-2xl">
          <RecordsPanel model={model} filter={filter} selection={selection} />
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
