"use client";

import { useMemo, useRef } from "react";
import type { Observation, SourceBreak } from "@/lib/markets";
import { formatPeriod } from "@/lib/markets";
import { lineSegments, panWindow } from "./chart-math";

type Part = "start" | "end" | "body";

/**
 * The whole published history of one series, with the visible window drawn over it. Drag the window to pan,
 * drag either edge to change the range, or click the track to centre the window there. The miniature line is
 * the series' published values, straight between observations and broken at gaps and source changes.
 */
export function RangeNavigator({
  periods,
  from,
  to,
  obs,
  breaks,
  seriesLabel,
  onChange,
}: {
  /** Every period the window can cover, oldest first. */
  periods: readonly string[];
  /** The visible window, as inclusive indices into `periods`. */
  from: number;
  to: number;
  obs: readonly Observation[];
  breaks: readonly SourceBreak[];
  seriesLabel: string;
  onChange: (from: number, to: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ part: Part; x: number; from: number; to: number } | null>(null);
  const n = periods.length;
  const last = Math.max(1, n - 1);

  const path = useMemo(() => {
    const first = periods[0];
    const end = periods[n - 1];
    const shown = obs.filter((o) => o.period >= first && o.period <= end);
    if (shown.length === 0) return "";
    const index = new Map(periods.map((p, i) => [p, i]));
    const lo = Math.min(...shown.map((o) => o.value));
    const hi = Math.max(...shown.map((o) => o.value));
    const x = (p: string) => ((index.get(p) ?? 0) / last) * 1000;
    const y = (v: number) => 36 - ((v - lo) / (hi - lo || 1)) * 32;
    return lineSegments(shown, periods, breaks, x, y)
      .segments.map((s) => s.d)
      .join(" ");
  }, [periods, obs, breaks, n, last]);

  if (n < 3) return null;
  const pct = (i: number) => `${(i / last) * 100}%`;

  function stepsFor(clientX: number, startX: number): number {
    const w = trackRef.current?.getBoundingClientRect().width ?? 1;
    return Math.round(((clientX - startX) / w) * last);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const part = (e.target as HTMLElement).closest<HTMLElement>("[data-part]")?.dataset.part as Part | undefined;
    if (!part) {
      // A click on the track centres the window on that period.
      const rect = e.currentTarget.getBoundingClientRect();
      const at = Math.round(((e.clientX - rect.left) / rect.width) * last);
      const next = panWindow({ from, to }, at - Math.round((from + to) / 2), n);
      onChange(next.from, next.to);
      return;
    }
    drag.current = { part, x: e.clientX, from, to };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const steps = stepsFor(e.clientX, d.x);
    if (d.part === "body") {
      const next = panWindow({ from: d.from, to: d.to }, steps, n);
      if (next.from !== from || next.to !== to) onChange(next.from, next.to);
    } else if (d.part === "start") {
      const f = Math.min(Math.max(0, d.from + steps), d.to - 1);
      if (f !== from) onChange(f, d.to);
    } else {
      const t = Math.max(Math.min(n - 1, d.to + steps), d.from + 1);
      if (t !== to) onChange(d.from, t);
    }
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
  }

  function onHandleKey(part: "start" | "end", e: React.KeyboardEvent<HTMLDivElement>) {
    const big = e.shiftKey ? 12 : 1;
    const delta = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -big : e.key === "ArrowRight" || e.key === "ArrowUp" ? big : null;
    let f = from;
    let t = to;
    if (delta !== null) {
      if (part === "start") f = Math.min(Math.max(0, from + delta), to - 1);
      else t = Math.max(Math.min(n - 1, to + delta), from + 1);
    } else if (e.key === "Home") {
      if (part === "start") f = 0;
      else t = from + 1;
    } else if (e.key === "End") {
      if (part === "start") f = to - 1;
      else t = n - 1;
    } else return;
    e.preventDefault();
    if (f !== from || t !== to) onChange(f, t);
  }

  const handle = (part: "start" | "end", i: number) => (
    <div
      data-part={part}
      role="slider"
      tabIndex={0}
      aria-label={part === "start" ? "Start of visible range" : "End of visible range"}
      aria-orientation="horizontal"
      aria-valuemin={part === "start" ? 0 : from + 1}
      aria-valuemax={part === "start" ? to - 1 : n - 1}
      aria-valuenow={i}
      aria-valuetext={formatPeriod(periods[i], true)}
      onKeyDown={(e) => onHandleKey(part, e)}
      className="absolute inset-y-0 z-10 flex w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
      style={{ left: pct(i) }}
    >
      <span aria-hidden="true" className="h-5 w-1.5 border border-foreground bg-plate" />
    </div>
  );

  return (
    <div role="group" aria-label={`Visible range within the published history of ${seriesLabel}`} className="border-t border-border px-3 pb-2 pt-2">
      <div
        ref={trackRef}
        className="relative h-10 select-none"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <svg viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <line x1="0" x2="1000" y1="39.5" y2="39.5" stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          <path d={path} fill="none" stroke="var(--muted)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 bg-background opacity-60" style={{ width: pct(from) }} />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 bg-background opacity-60" style={{ width: pct(last - to) }} />
        <div
          data-part="body"
          aria-hidden="true"
          className="absolute inset-y-0 cursor-grab border-x border-foreground active:cursor-grabbing"
          style={{ left: pct(from), width: pct(to - from) }}
        />
        {handle("start", from)}
        {handle("end", to)}
      </div>
      <div className="tnum mt-1 flex justify-between text-[0.6875rem] leading-4 text-faint">
        <span>{formatPeriod(periods[0])}</span>
        <span>{seriesLabel}, published history</span>
        <span>{formatPeriod(periods[n - 1])}</span>
      </div>
    </div>
  );
}
