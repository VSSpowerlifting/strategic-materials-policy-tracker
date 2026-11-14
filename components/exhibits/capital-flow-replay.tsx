"use client";

/**
 * Controls and key for the capital-flow status replay. The reader picks a date at which the record's evidence
 * changes a line, or replays the sequence; every status surface of the exhibit reads that date through
 * `capital-flow-replay-state`. Stepping is discrete: a line that changes is redrawn, nothing is tweened between
 * classes, and the change is written out in the model's own wording.
 */
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CapitalFlowLegendEntry } from "@/lib/capital-flow";
import {
  NOT_YET_RECORDED_DESCRIPTION,
  NOT_YET_RECORDED_LABEL,
  type CapitalFlowStep,
} from "@/lib/capital-flow-timeline";
import { FlowMark, LegendMark } from "./capital-flow-interactive";
import { useReplay } from "./capital-flow-replay-state";

/** Classes drawn at the step shown, and whether any row is not yet recorded there. */
function drawnAt(step: CapitalFlowStep | null): { classes: Set<string>; pending: boolean } {
  const classes = new Set<string>();
  let pending = false;
  for (const s of Object.values(step?.flows ?? {})) {
    if (s.notYetRecorded) {
      pending = true;
      continue;
    }
    classes.add(s.flowClass);
    if (s.equityInterest) classes.add("equity");
  }
  return { classes, pending };
}

function KeyEntry({ entry, absent }: { entry: CapitalFlowLegendEntry | "pending"; absent: boolean }) {
  const label = entry === "pending" ? NOT_YET_RECORDED_LABEL : entry.label;
  const description = entry === "pending" ? NOT_YET_RECORDED_DESCRIPTION : entry.description;
  return (
    <li className={cn("flex items-start gap-3 motion-safe:transition-opacity motion-safe:duration-200", absent && "opacity-40")}>
      <span className="mt-1">
        {entry === "pending" ? (
          <FlowMark flowClass="status_not_stated" pending className="w-14 shrink-0" />
        ) : (
          <LegendMark entry={entry} />
        )}
      </span>
      <span className="min-w-0 font-display text-xs leading-5 text-muted">
        <span className="block text-[0.8125rem] font-medium text-foreground">{label}</span>
        {description}
        {absent ? <span className="sr-only"> Not drawn at the date shown.</span> : null}
      </span>
    </li>
  );
}

/**
 * The key: the latest model's classes, always the same entries, so it never changes size. Once the reader steps
 * back, classes not drawn at the date shown are set back. Classes that appear only at earlier dates are keyed
 * under the dates (`ReplayControls`).
 */
export function ReplayLegend({ latest }: { latest: readonly CapitalFlowLegendEntry[] }) {
  const ctx = useReplay();
  const stepped = Boolean(ctx && ctx.interacted && ctx.steps.length > 1);
  const { classes } = drawnAt(ctx ? ctx.steps[ctx.index] : null);
  return (
    <ul className="grid gap-x-8 gap-y-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {latest.map((entry) => (
        <KeyEntry key={entry.key} entry={entry} absent={stepped && !classes.has(entry.key)} />
      ))}
    </ul>
  );
}

/** "9 Jul 2025" set on two lines: day and month, then year. */
function DateLines({ label }: { label: string }) {
  const cut = label.lastIndexOf(" ");
  return (
    <>
      <span className="block whitespace-nowrap">{cut > 0 ? label.slice(0, cut) : label}</span>
      {cut > 0 ? <span className="block"> {label.slice(cut + 1)}</span> : null}
    </>
  );
}

/** Changes written out under the dates; the rest are marked on the drawing. */
const MAX_NOTES = 4;

/** What changed at a step, row by row, in the model's own wording. */
export function changeNotes(step: CapitalFlowStep, headlines: Readonly<Record<string, string>>): string[] {
  return [
    ...step.changedFlowIds.map((id) => `${headlines[id] ?? id}: ${step.flows[id].status.text}`),
    ...step.changedListedIds.map((id) => `${headlines[id] ?? id} (listed, not drawn): ${step.listed[id].status.text}`),
  ];
}

/**
 * Dated steps and a replay control. Renders nothing for an exhibit whose record shows no change. Each date is a
 * button in the tab order; the arrow keys, Home and End also move between dates.
 */
export function ReplayControls({
  titleId,
  headingLevel,
  latestLegend,
}: {
  titleId: string;
  headingLevel: 2 | 3;
  /** The key above the diagram; classes outside it are keyed here once the reader steps. */
  latestLegend: readonly CapitalFlowLegendEntry[];
}) {
  const ctx = useReplay();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const bar = useRef<HTMLElement>(null);

  // Publishes the bar's height to the block it sticks within, so a control in the drawing that takes keyboard
  // focus scrolls clear of the bar while it is stuck (the scroll margin itself is set in globals.css).
  useEffect(() => {
    const el = bar.current;
    const host = el?.parentElement;
    if (!el || !host || !("ResizeObserver" in window)) return;
    const publish = () => host.style.setProperty("--capflow-bar-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!ctx || ctx.steps.length < 2) return null;
  const earlier = ctx.timeline.legend.filter((e) => !latestLegend.some((l) => l.key === e.key));
  const now = drawnAt(ctx.steps[ctx.index]);
  const { steps, index, interacted, playing, select, togglePlay, headlines } = ctx;
  const Heading = headingLevel === 2 ? "h3" : "h4";
  const step = steps[index];
  const last = steps.length - 1;
  const notes = changeNotes(step, headlines);
  const labelId = `${titleId}-replay`;

  const reading = step.latest ? `Status as of ${step.asOfLabel}.` : `Status as recorded by ${step.asOfLabel}.`;
  const detail = index === 0 ? "The earliest date with a recorded status." : notes.length ? `Changed: ${notes.join("; ")}.` : "";
  const announcement = interacted ? `${reading} ${detail}` : "";

  const move = (to: number) => {
    const target = Math.max(0, Math.min(last, to));
    select(target);
    buttons.current[target]?.focus();
  };

  // At most a few changes are written out; every changed line is also marked on the drawing itself.
  const shown = notes.slice(0, MAX_NOTES);
  const more = notes.length - shown.length;

  return (
    <>
      {/* The bar holds the dates; on a wide figure it stays in view while the reader scrolls through the lines. */}
      <section ref={bar} aria-labelledby={labelId} className="capflow-replay mt-8 border-t border-border pt-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Heading id={labelId} className="label">
            Status by date
          </Heading>
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex min-h-9 cursor-pointer items-center gap-2 border border-border-strong bg-plate px-3 font-display text-[0.8125rem] text-foreground hover:border-foreground motion-safe:transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false" className="shrink-0">
              {playing ? <path d="M2 1.5 h2 v7 h-2 Z M6 1.5 h2 v7 h-2 Z" fill="currentColor" /> : <path d="M2 1 L9 5 L2 9 Z" fill="currentColor" />}
            </svg>
            {playing ? "Pause" : interacted && index < last ? "Continue" : "Replay changes"}
          </button>
        </div>

        <ol
          className="capflow-steps relative mt-4 grid list-none p-0"
          style={
            {
              gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
              "--steps": steps.length,
              "--progress": index / last,
            } as React.CSSProperties
          }
        >
          {steps.map((s, i) => (
            <li key={s.date} className="relative min-w-0">
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                aria-pressed={i === index}
                onClick={() => select(i)}
                onKeyDown={(e) => {
                  const keys: Record<string, number> = {
                    ArrowRight: i + 1,
                    ArrowDown: i + 1,
                    ArrowLeft: i - 1,
                    ArrowUp: i - 1,
                    Home: 0,
                    End: last,
                  };
                  if (e.key in keys) {
                    e.preventDefault();
                    move(keys[e.key]);
                  }
                }}
                className="group flex w-full cursor-pointer flex-col items-center gap-2 px-1 pb-1 text-center"
              >
                <span className="capflow-step-dot" data-state={i < index ? "past" : i === index ? "current" : "future"} aria-hidden="true" />
                <span
                  className={cn(
                    "tnum font-display text-xs leading-4 underline decoration-transparent underline-offset-4 group-hover:decoration-border-strong",
                    i === index ? "font-medium text-foreground" : "text-muted group-hover:text-foreground",
                  )}
                >
                  <span className="sr-only">{s.latest ? "Latest status, recorded by " : "Status recorded by "}</span>
                  <DateLines label={s.dateLabel} />
                  {s.latest ? (
                    <span className="block text-faint" aria-hidden="true">
                      Latest
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </section>

      {interacted ? (
        <div className="grid gap-x-10 gap-y-4 pt-1 @4xl:grid-cols-2">
          <div className="min-w-0 font-display text-xs leading-5" aria-hidden="true">
            {index === 0 ? (
              <p className="text-muted">The earliest date with a recorded status.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {shown.map((n) => (
                  <li key={n} className="text-foreground">
                    <span className="text-faint">Recorded by {step.dateLabel}: </span>
                    {n}
                  </li>
                ))}
                {more > 0 ? (
                  <li className="text-muted">
                    {more} more {more === 1 ? "line" : "lines"} changed, each marked on the drawing.
                  </li>
                ) : null}
              </ul>
            )}
          </div>
          {earlier.length || ctx.timeline.hasNotYetRecorded ? (
            <div className="min-w-0">
              <p className="label">Also drawn at earlier dates</p>
              <ul className="mt-2 grid gap-y-3">
                {earlier.map((entry) => (
                  <KeyEntry key={entry.key} entry={entry} absent={!now.classes.has(entry.key)} />
                ))}
                {ctx.timeline.hasNotYetRecorded ? <KeyEntry entry="pending" absent={!now.pending} /> : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
