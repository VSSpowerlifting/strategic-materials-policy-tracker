"use client";

/**
 * The drawn part of the capital-flow exhibit: one lane per recorded row, a detail panel, and the
 * list of every row (each row's full facts sit behind a disclosure). Presentation only: it receives the serializable model from
 * lib/capital-flow and imports no data. Without JavaScript the lanes are plain links to the rows of
 * the list, which carries everything the panel shows.
 */
import Link from "next/link";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  CapitalFlow,
  CapitalFlowLegendEntry,
  CapitalFlowModel,
  CapitalFlowParty,
  CapitalFlowRun,
  CapitalFlowSource,
  DrawnFlowClass,
} from "@/lib/capital-flow";

// --- Marks ----------------------------------------------------------------------------------

/** Ink per class. Colour only repeats what the line style and end mark already say. */
const MARK_TONE: Record<DrawnFlowClass, string> = {
  cash: "text-accent",
  part_disbursed: "text-accent",
  committed: "text-foreground",
  contingent: "text-ochre",
  commercial: "text-ink-soft",
  not_public: "text-muted",
  ended: "text-negative",
  status_not_stated: "text-faint",
};

/** One weight for every class: line weight never encodes an amount. An ended row is a hairline. */
const LINE: Record<DrawnFlowClass, { width: number; dash?: string; cap?: "round" }> = {
  cash: { width: 1.5 },
  part_disbursed: { width: 1.5, dash: "14 4" },
  committed: { width: 1.5, dash: "6 5" },
  contingent: { width: 2, dash: "0.1 6", cap: "round" },
  commercial: { width: 1 },
  not_public: { width: 1.5, dash: "10 4 2 4" },
  ended: { width: 1 },
  status_not_stated: { width: 1.5, dash: "2 9" },
};

function EndMark({ flowClass }: { flowClass: DrawnFlowClass }) {
  const stroke = { stroke: "currentColor", strokeWidth: 1.5, fill: "none" } as const;
  let shape: React.ReactNode = null;
  if (flowClass === "cash" || flowClass === "part_disbursed") {
    shape = <path d="M1 2 L13 7 L1 12 Z" fill="currentColor" />;
  } else if (flowClass === "committed") {
    shape = <path d="M0 7 L12 7 M4 2.5 L12 7 L4 11.5" {...stroke} strokeDasharray="none" />;
  } else if (flowClass === "contingent") {
    shape = <circle cx="8" cy="7" r="4.25" {...stroke} />;
  } else if (flowClass === "commercial") {
    shape = <path d="M0 4.5 L4 4.5 M0 9.5 L4 9.5 M4 3 h8 v8 h-8 Z" stroke="currentColor" strokeWidth={1} fill="currentColor" />;
  } else if (flowClass === "not_public") {
    shape = <path d="M0 7 L4 7 M4 3 h8 v8 h-8 Z" {...stroke} />;
  } else if (flowClass === "ended") {
    shape = <path d="M0 7 L3 7 M4 3 L12 11 M12 3 L4 11" stroke="currentColor" strokeWidth={1.25} fill="none" />;
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" aria-hidden="true" focusable="false">
      {shape}
    </svg>
  );
}

function StartMark({ flowClass, equity }: { flowClass: DrawnFlowClass; equity: boolean }) {
  if (equity) {
    // A stake held where money is paid; an outline where it is not yet paid.
    const held = flowClass === "cash" || flowClass === "part_disbursed";
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" aria-hidden="true" focusable="false">
        <path d="M1 7 L7 2.5 L13 7 L7 11.5 Z" stroke="currentColor" strokeWidth={1.5} fill={held ? "currentColor" : "none"} />
      </svg>
    );
  }
  if (flowClass === "commercial") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" aria-hidden="true" focusable="false">
        <path d="M2 3 h8 v8 h-8 Z M10 4.5 L14 4.5 M10 9.5 L14 9.5" stroke="currentColor" strokeWidth={1} fill="currentColor" />
      </svg>
    );
  }
  return null;
}

/**
 * The mark for one row: a line whose style and end mark name the class. Decorative; the class is
 * always written beside it.
 */
export function FlowMark({
  flowClass,
  equity = false,
  className,
  lane,
}: {
  flowClass: DrawnFlowClass;
  equity?: boolean;
  className?: string;
  /** Lane index, used only to stagger the one-time draw. */
  lane?: number;
}) {
  const line = LINE[flowClass];
  const common = {
    stroke: "currentColor",
    strokeWidth: line.width,
    strokeDasharray: line.dash,
    strokeLinecap: line.cap,
  } as const;
  return (
    <span className={cn("flex items-center", MARK_TONE[flowClass], className)} aria-hidden="true">
      <StartMark flowClass={flowClass} equity={equity} />
      <svg
        height="14"
        className="capflow-line h-3.5 min-w-0 flex-1"
        style={lane === undefined ? undefined : ({ "--lane": lane } as React.CSSProperties)}
        aria-hidden="true"
        focusable="false"
      >
        {flowClass === "commercial" ? (
          <>
            <line x1="0" y1="4.5" x2="100%" y2="4.5" {...common} />
            <line x1="0" y1="9.5" x2="100%" y2="9.5" {...common} />
          </>
        ) : (
          <line x1="0" y1="7" x2="100%" y2="7" {...common} />
        )}
      </svg>
      <EndMark flowClass={flowClass} />
    </span>
  );
}

/** Legend sample for one entry. */
export function LegendMark({ entry }: { entry: CapitalFlowLegendEntry }) {
  if (entry.key === "equity") {
    return (
      <span className="flex w-14 shrink-0 items-center text-foreground" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          <path d="M1 7 L7 2.5 L13 7 L7 11.5 Z" stroke="currentColor" strokeWidth={1.5} fill="currentColor" />
        </svg>
        <span className="w-1.5" />
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          <path d="M1 7 L7 2.5 L13 7 L7 11.5 Z" stroke="currentColor" strokeWidth={1.5} fill="none" />
        </svg>
      </span>
    );
  }
  return <FlowMark flowClass={entry.key} className="w-14 shrink-0" />;
}

// --- Shared row pieces ----------------------------------------------------------------------

function SourceLink({ source }: { source: CapitalFlowSource }) {
  return (
    <a href={source.url} rel="noreferrer" className="link-quiet">
      {source.title}
    </a>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="grid gap-x-4 gap-y-0.5 border-b border-border py-2 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <span className="font-display text-xs leading-5 text-faint">{label}</span>
      <span className="min-w-0 font-display text-sm leading-5 text-foreground">{children}</span>
    </li>
  );
}

function PartyLinks({ flow, side }: { flow: CapitalFlow; side: "providers" | "recipients" }) {
  const parties = flow[side];
  if (parties.length === 0) {
    if (side === "providers" && flow.ownFunds) return <>The recipient&rsquo;s own funds</>;
    return <>{(side === "providers" ? flow.providerText : flow.recipientText) ?? "Not recorded"}</>;
  }
  return (
    <>
      {parties.map((p, i) => (
        <span key={p.id}>
          {i > 0 ? (i === parties.length - 1 ? " and " : ", ") : null}
          <Link href={p.href} className="link-quiet">
            {p.name}
          </Link>
        </span>
      ))}
    </>
  );
}

/** Everything the record says about one row, as a list. Used by the panel and by the list of all rows. */
function FlowFacts({ flow, asOfLabel }: { flow: CapitalFlow; asOfLabel: string }) {
  const allocated = flow.uses.filter((u) => u.allocated);
  const associated = flow.uses.filter((u) => !u.allocated);
  return (
    <ul className="border-t border-border-strong">
      <Fact label="Kind">
        {flow.classLabel}
        {flow.equityInterest ? ", with an equity interest" : ""}.{" "}
        {flow.flowClass === "ended" ? "Shown for completeness." : flow.remark}
      </Fact>
      <Fact label="Instrument">
        {flow.instrumentLabel}. Recorded as: {flow.valueRoleLabel.toLowerCase()}. Capital source: {flow.capitalSourceLabel.toLowerCase()}.
      </Fact>
      <Fact label="Amount as stated">
        {flow.amountLabel ? (
          <>
            <span className="tnum">{flow.amountLabel}</span>
            {flow.amountAsStated ? <span className="text-muted"> (source wording: &ldquo;{flow.amountAsStated}&rdquo;)</span> : null}
            {flow.amountBasis ? <span className="block text-muted">{flow.amountBasis}</span> : null}
          </>
        ) : (
          <>
            No amount stated
            {flow.definingTerm ? <span className="tnum">. Defining term: {flow.definingTerm}</span> : null}
          </>
        )}
      </Fact>
      <Fact label={`Status on ${asOfLabel}`}>
        <span className={flow.flowClass === "ended" ? "text-negative" : undefined}>{flow.status.text}</span>
        {flow.status.evidencedBy ? <span className="text-muted">; recorded by {flow.status.evidencedBy}</span> : null}
        {flow.status.note ? <span className="mt-1 block text-muted">{flow.status.note}</span> : null}
        {flow.status.source ? (
          <span className="mt-1 block text-muted">
            Status stated by {flow.status.source.publisher}: <SourceLink source={flow.status.source} />
          </span>
        ) : null}
      </Fact>
      <Fact label="From">
        <PartyLinks flow={flow} side="providers" />
      </Fact>
      <Fact label="To">
        <PartyLinks flow={flow} side="recipients" />
      </Fact>
      {allocated.length ? (
        <Fact label="Project">
          {allocated.map((u) => (
            <Link key={u.id} href={u.href} className="link-quiet">
              {u.name}
            </Link>
          ))}
        </Fact>
      ) : null}
      {associated.length ? (
        <Fact label="Associated projects">
          <span className="text-muted">The amount is not allocated among them. </span>
          {associated.map((u, i) => (
            <span key={u.id}>
              {i > 0 ? "; " : null}
              <Link href={u.href} className="link-quiet">
                {u.name}
              </Link>
            </span>
          ))}
        </Fact>
      ) : null}
      {flow.annotations.map((a) => (
        <Fact key={a.targetId} label={a.label}>
          <Link href={a.targetHref} className="link-quiet">
            {a.targetText}
          </Link>
          <span className="text-muted">. Not additional money.</span>
        </Fact>
      ))}
      <Fact label="Financing">
        <Link href={flow.href} className="link-quiet">
          View details
        </Link>
      </Fact>
      <Fact label={flow.sources.length === 1 ? "Source" : "Sources"}>
        {flow.sources.map((s, i) => (
          <span key={s.id}>
            {i > 0 ? "; " : null}
            <SourceLink source={s} />
          </span>
        ))}
      </Fact>
    </ul>
  );
}

function FlowHeadline({ flow, className }: { flow: CapitalFlow; className?: string }) {
  return (
    <span
      className={cn(
        "tnum font-display text-sm font-semibold leading-5 text-foreground",
        flow.flowClass === "ended" && "font-medium text-muted line-through decoration-negative",
        className,
      )}
    >
      {flow.headline}
    </span>
  );
}

function FlowStatusLine({ flow, className }: { flow: CapitalFlow; className?: string }) {
  return (
    <span className={cn("font-display text-xs leading-5", flow.flowClass === "ended" ? "text-negative" : "text-muted", className)}>
      {flow.status.text}. {flow.remark}
    </span>
  );
}

// --- Diagram --------------------------------------------------------------------------------

type Selection = { type: "flow" | "party"; id: string };

function PartyBox({
  run,
  column,
  parties,
  selection,
  pinned,
  dimmed,
  onHover,
  onPin,
}: {
  run: CapitalFlowRun;
  column: number;
  parties: ReadonlyMap<string, CapitalFlowParty>;
  selection: Selection | null;
  pinned: Selection | null;
  dimmed: (partyId: string) => boolean;
  onHover: (s: Selection | null) => void;
  onPin: (s: Selection) => void;
}) {
  return (
    <div
      className="my-1.5 flex flex-col justify-center gap-2 border border-border-strong bg-plate px-3 py-2.5"
      style={{ gridColumn: column, gridRow: `${run.start + 2} / span ${run.span}` }}
    >
      {run.partyIds.map((id) => {
        const party = parties.get(id);
        if (!party) return null;
        const isSelected = selection?.type === "party" && selection.id === id;
        const isPinned = pinned?.type === "party" && pinned.id === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isPinned}
            onMouseEnter={() => onHover({ type: "party", id })}
            onFocus={() => onHover({ type: "party", id })}
            onBlur={() => onHover(null)}
            onClick={() => onPin({ type: "party", id })}
            className={cn(
              "block w-full cursor-pointer text-left transition-opacity duration-150 motion-reduce:transition-none",
              dimmed(id) && "opacity-35",
            )}
          >
            <span
              className={cn(
                "block font-display text-sm font-semibold leading-5 text-foreground underline decoration-transparent underline-offset-4",
                (isSelected || isPinned) && "text-accent decoration-accent",
              )}
            >
              {party.name}
            </span>
            {party.kindLabel ? <span className="block font-display text-xs leading-5 text-faint">{party.kindLabel}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function PartyPanel({ party, flows }: { party: CapitalFlowParty; flows: readonly CapitalFlow[] }) {
  return (
    <div>
      <p className="font-display text-base font-semibold leading-6 text-foreground">{party.name}</p>
      {party.kindLabel ? <p className="font-display text-xs leading-5 text-faint">{party.kindLabel}</p> : null}
      <ul className="mt-3 border-t border-border-strong">
        {flows.map((f) => (
          <li key={f.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-border py-2 last:border-b-0">
            <span className="font-display text-sm leading-5 text-foreground">
              {f.ownFunds ? "Own funds" : f.providerText} to {f.recipientText}
            </span>
            <FlowHeadline flow={f} />
            <FlowStatusLine flow={f} />
            <Link href={f.href} className="link-quiet font-display text-xs">
              View details
            </Link>
          </li>
        ))}
        <li className="py-2">
          <Link href={party.href} className="link-quiet font-display text-sm">
            Organization details
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function CapitalFlowInteractive({
  model,
  headingLevel,
  density = "full",
}: {
  model: CapitalFlowModel;
  headingLevel: 2 | 3;
  /** "summary" drops the list of rows where the diagram is drawn; the list stays wherever the diagram is not. */
  density?: "full" | "summary";
}) {
  const uid = useId();
  const [hover, setHover] = useState<Selection | null>(null);
  const [pinned, setPinned] = useState<Selection | null>(null);
  const selection = hover ?? pinned;
  const Sub = headingLevel === 2 ? "h3" : "h4";

  const parties = new Map(model.parties.map((p) => [p.id, p]));
  const flowsById = new Map(model.flows.map((f) => [f.id, f]));
  const rowId = (flowId: string) => `${uid}-${flowId}`;

  // What the current selection touches: its flows, and the parties at either end of them.
  const litFlows = new Set<string>();
  const litParties = new Set<string>();
  if (selection?.type === "flow") litFlows.add(selection.id);
  if (selection?.type === "party") {
    litParties.add(selection.id);
    for (const id of parties.get(selection.id)?.flowIds ?? []) litFlows.add(id);
  }
  for (const id of litFlows) {
    const f = flowsById.get(id);
    if (!f) continue;
    for (const p of [...f.providers, ...f.recipients]) litParties.add(p.id);
  }
  const flowDimmed = (id: string) => selection !== null && !litFlows.has(id);
  const partyDimmed = (id: string) => selection !== null && !litParties.has(id);
  const togglePin = (s: Selection) => setPinned((current) => (current && current.type === s.type && current.id === s.id ? null : s));

  const hasUses = model.flows.some((f) => f.uses.length > 0);
  // The project column needs a wide figure; below that the projects sit under their lane.
  const columns = hasUses
    ? "grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,11rem)] @5xl:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)_minmax(0,11.5rem)_minmax(0,12rem)]"
    : "grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,11rem)] @4xl:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,13rem)]";

  const shownFlow = selection?.type === "flow" ? flowsById.get(selection.id) : undefined;
  const shownParty = selection?.type === "party" ? parties.get(selection.id) : undefined;

  return (
    <>
      <div className="hidden @3xl:block">
        <div
          role="group"
          aria-label="Diagram: one line per recorded row, from provider to recipient"
          className={cn("capflow-diagram grid gap-x-4", columns)}
          onMouseLeave={() => setHover(null)}
        >
          <p className="label border-b border-border-strong pb-2" style={{ gridColumn: 1, gridRow: 1 }}>
            Provider
          </p>
          <p className="label border-b border-border-strong pb-2" style={{ gridColumn: 2, gridRow: 1 }}>
            Relationship
          </p>
          <p className="label border-b border-border-strong pb-2" style={{ gridColumn: 3, gridRow: 1 }}>
            Recipient
          </p>
          {hasUses ? (
            <p className="label hidden border-b border-border-strong pb-2 @5xl:block" style={{ gridColumn: 4, gridRow: 1 }}>
              Project named in the source
            </p>
          ) : null}

          {model.flows.map((flow, i) => {
            const providerRun = model.providerRuns.find((r) => r.start === i);
            const recipientRun = model.recipientRuns.find((r) => r.start === i);
            const isPinned = pinned?.type === "flow" && pinned.id === flow.id;
            const isLit = selection?.type === "flow" && selection.id === flow.id;
            const select: Selection = { type: "flow", id: flow.id };
            return (
              <div key={flow.id} className="contents">
                {providerRun ? (
                  <PartyBox
                    run={providerRun}
                    column={1}
                    parties={parties}
                    selection={selection}
                    pinned={pinned}
                    dimmed={partyDimmed}
                    onHover={setHover}
                    onPin={togglePin}
                  />
                ) : null}
                {flow.ownFunds ? (
                  <p
                    className={cn(
                      "self-center font-display text-xs leading-5 text-faint transition-opacity duration-150 motion-reduce:transition-none",
                      flowDimmed(flow.id) && "opacity-35",
                    )}
                    style={{ gridColumn: 1, gridRow: i + 2 }}
                  >
                    No outside provider: the recipient&rsquo;s own funds
                  </p>
                ) : null}
                <div
                  className={cn(
                    "self-center transition-opacity duration-150 motion-reduce:transition-none",
                    flowDimmed(flow.id) && "opacity-35",
                  )}
                  style={{ gridColumn: 2, gridRow: i + 2 }}
                >
                <a
                  href={density === "summary" ? flow.href : `#${rowId(flow.id)}`}
                  aria-current={isPinned ? "true" : undefined}
                  onMouseEnter={() => setHover(select)}
                  onFocus={() => setHover(select)}
                  onBlur={() => setHover(null)}
                  onClick={(e) => {
                    e.preventDefault();
                    togglePin(select);
                  }}
                  className="block pt-3 pb-3"
                >
                  <span className="sr-only">
                    {flow.ownFunds ? "The recipient's own funds" : flow.providerText} to {flow.recipientText}:{" "}
                  </span>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <FlowHeadline flow={flow} className={isLit || isPinned ? "underline decoration-accent underline-offset-4" : undefined} />
                    <span className="font-display text-xs leading-5 text-faint">
                      {flow.classLabel}
                      {flow.equityInterest ? ", equity interest" : ""}
                    </span>
                  </span>
                  <FlowMark flowClass={flow.flowClass} equity={flow.equityInterest} lane={i} className="my-1" />
                  <span className="sr-only">. </span>
                  <FlowStatusLine flow={flow} className="block" />
                </a>
                {flow.uses.length ? (
                  <p className="-mt-2 pb-3 font-display text-xs leading-5 text-faint @5xl:hidden">
                    {flow.uses.some((u) => !u.allocated) ? "Associated projects, amount not allocated among them: " : "Project: "}
                    {flow.uses.map((u, n) => (
                      <span key={u.id}>
                        {n > 0 ? "; " : null}
                        <Link href={u.href} className="link-quiet text-muted">
                          {u.name}
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : null}
                </div>
                {recipientRun ? (
                  <PartyBox
                    run={recipientRun}
                    column={3}
                    parties={parties}
                    selection={selection}
                    pinned={pinned}
                    dimmed={partyDimmed}
                    onHover={setHover}
                    onPin={togglePin}
                  />
                ) : null}
                {hasUses && flow.uses.length ? (
                  <div
                    className={cn(
                      "hidden self-center border-l border-border py-2 pl-3 font-display text-xs leading-5 transition-opacity duration-150 motion-reduce:transition-none @5xl:block",
                      flowDimmed(flow.id) && "opacity-35",
                    )}
                    style={{ gridColumn: 4, gridRow: i + 2 }}
                  >
                    {flow.uses.some((u) => !u.allocated) ? (
                      <p className="text-faint">Associated, amount not allocated among them</p>
                    ) : null}
                    <ul>
                      {flow.uses.map((u) => (
                        <li key={u.id}>
                          <Link href={u.href} className="link-quiet text-foreground">
                            {u.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 min-h-40 border-t border-border-strong pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Sub className="label">Selected</Sub>
            {pinned ? (
              <button
                type="button"
                onClick={() => setPinned(null)}
                className="link-quiet cursor-pointer font-display text-xs text-muted"
              >
                Clear selection
              </button>
            ) : null}
          </div>
          {shownFlow ? (
            <div className="mt-2 grid gap-x-8 gap-y-3 @5xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
              <div>
                <p className="font-display text-base font-semibold leading-6 text-foreground">
                  {shownFlow.ownFunds ? "The recipient's own funds" : shownFlow.providerText} to {shownFlow.recipientText}
                </p>
                <FlowMark flowClass={shownFlow.flowClass} equity={shownFlow.equityInterest} className="my-2 max-w-48" />
                <FlowHeadline flow={shownFlow} className="block" />
                <FlowStatusLine flow={shownFlow} className="block" />
              </div>
              <FlowFacts flow={shownFlow} asOfLabel={model.asOfLabel} />
            </div>
          ) : shownParty ? (
            <div className="mt-2">
              <PartyPanel party={shownParty} flows={model.flows.filter((f) => shownParty.flowIds.includes(f.id))} />
            </div>
          ) : (
            <p className="mt-2 max-w-2xl font-display text-sm leading-6 text-muted">
              Select a line or an organization to read its details here.
              {density === "full" ? " Every flow is also listed under All flows." : null}
            </p>
          )}
        </div>
      </div>

      <section className={cn("mt-8 @3xl:mt-10", density === "summary" && "@3xl:hidden")} aria-labelledby={`${uid}-all`}>
        <Sub id={`${uid}-all`} className="label border-b border-border-strong pb-2">
          All flows
        </Sub>
        <ol>
          {model.flows.map((flow) => {
            const isPinned = pinned?.type === "flow" && pinned.id === flow.id;
            return (
              <li
                key={flow.id}
                id={rowId(flow.id)}
                className={cn(
                  "scroll-mt-28 border-b border-border py-5 target:bg-elevated @4xl:grid @4xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] @4xl:gap-x-8",
                  isPinned && "bg-elevated",
                )}
              >
                <div className="mb-3 @4xl:mb-0">
                  <p className="font-display text-xs leading-5 text-faint">
                    {flow.classLabel}
                    {flow.equityInterest ? ", equity interest" : ""}
                  </p>
                  <FlowMark flowClass={flow.flowClass} equity={flow.equityInterest} className="my-1.5 max-w-40" />
                  <p className="font-display text-base font-semibold leading-6 text-foreground">
                    {flow.ownFunds ? "The recipient's own funds" : flow.providerText} to {flow.recipientText}
                  </p>
                  <FlowHeadline flow={flow} className="mt-1 block" />
                  <FlowStatusLine flow={flow} className="block" />
                </div>
                <details className="min-w-0">
                  <summary className="cursor-pointer font-display text-sm text-muted underline decoration-border-strong underline-offset-4 hover:text-accent">
                    View details
                  </summary>
                  <div className="mt-3">
                    <FlowFacts flow={flow} asOfLabel={model.asOfLabel} />
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
