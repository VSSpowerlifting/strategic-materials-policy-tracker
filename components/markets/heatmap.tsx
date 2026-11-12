"use client";

import { useEffect, useRef, useState } from "react";
import type { HeatCell } from "@/lib/markets";
import { formatNumber, formatPct, formatPeriod } from "@/lib/markets";

export interface HeatRow {
  id: string;
  label: string;
  color: string;
  dash: string | undefined;
  unit: string;
  digits: number;
  cells: HeatCell[];
}

/** A round scale maximum near the 95th percentile of absolute moves. */
export function heatScaleMax(rows: readonly HeatRow[]): number {
  const abs = rows
    .flatMap((r) => r.cells.map((c) => (c.change ? Math.abs(c.change.pct) : null)))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  if (abs.length === 0) return 5;
  const p95 = abs[Math.min(abs.length - 1, Math.floor(abs.length * 0.95))];
  const steps = [2, 3, 5, 8, 10, 15, 20, 30, 50];
  return steps.find((s) => s >= p95) ?? Math.ceil(p95 / 10) * 10;
}

/** Tint steps on each side of zero. Four keeps graphite text above 6.5:1 on the strongest tint. */
const HEAT_STEPS = 4;
const STEP_PCT = 12;

/** Which tint step a change falls in: 0 for no change, up to ±HEAT_STEPS at or beyond the scale maximum. */
export function heatLevel(pct: number, max: number): number {
  if (pct === 0 || !Number.isFinite(pct)) return 0;
  return Math.sign(pct) * Math.min(HEAT_STEPS, Math.max(1, Math.ceil((Math.abs(pct) / max) * HEAT_STEPS)));
}

/** Diverging fill in flat steps: malachite for rises, hematite for falls, the plate at zero. */
function levelFill(level: number): string {
  if (level === 0) return "var(--plate)";
  return `color-mix(in oklab, ${level > 0 ? "var(--accent)" : "var(--negative)"} ${Math.abs(level) * STEP_PCT}%, var(--plate))`;
}

export function Heatmap({
  rows,
  periods,
  frequency,
  onInspect,
}: {
  rows: HeatRow[];
  periods: string[];
  frequency: "monthly" | "annual";
  /** Called when a cell is hovered or focused, and with nulls when inspection ends. */
  onInspect: (id: string | null, period: string | null) => void;
}) {
  const [active, setActive] = useState<{ r: number; c: number }>({ r: 0, c: Math.max(0, periods.length - 1) });
  const [inspected, setInspected] = useState<{ r: number; c: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPeriod = periods[periods.length - 1];
  // Open on the latest periods; older months stay a scroll away.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [lastPeriod, periods.length]);
  const max = heatScaleMax(rows);
  const step = frequency === "annual" ? "year-on-year" : "month-on-month";
  const prevWord = frequency === "annual" ? "year" : "month";

  if (rows.length === 0 || periods.length === 0) {
    return <p className="text-sm text-muted">No {step} changes can be calculated for this window.</p>;
  }

  const r0 = Math.min(active.r, rows.length - 1);
  const c0 = Math.min(active.c, periods.length - 1);

  function inspect(r: number, c: number) {
    setInspected({ r, c });
    onInspect(rows[r].id, periods[c]);
  }

  function moveTo(r: number, c: number) {
    setActive({ r, c });
    const el = tableRef.current?.querySelector<HTMLButtonElement>(`button[data-cell="${r}-${c}"]`);
    el?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTableElement>) {
    const map: Record<string, [number, number]> = {
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };
    if (e.key === "Home") moveTo(r0, 0);
    else if (e.key === "End") moveTo(r0, periods.length - 1);
    else if (map[e.key]) {
      const [dr, dc] = map[e.key];
      moveTo(Math.min(rows.length - 1, Math.max(0, r0 + dr)), Math.min(periods.length - 1, Math.max(0, c0 + dc)));
    } else return;
    e.preventDefault();
  }

  const shown = inspected ?? null;
  const shownCell = shown ? rows[shown.r]?.cells[shown.c] : null;

  return (
    <div className="min-w-0">
      <div ref={scrollRef} className="overflow-x-auto border border-border-strong bg-plate">
        <table
          ref={tableRef}
          className="w-full border-separate border-spacing-px text-xs"
          onKeyDown={onKeyDown}
          onMouseLeave={() => {
            setInspected(null);
            onInspect(null, null);
          }}
          onBlur={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
            setInspected(null);
            onInspect(null, null);
          }}
        >
          <caption className="sr-only">
            {step === "year-on-year" ? "Year-on-year" : "Month-on-month"} change in each selected series, {formatPeriod(periods[0], true)} to{" "}
            {formatPeriod(periods[periods.length - 1], true)}. Arrow keys move between cells.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-plate px-3 py-1.5 text-left font-medium text-faint">
                Series
              </th>
              {periods.map((p, i) => (
                <th
                  key={p}
                  scope="col"
                  className="tnum min-w-12 px-1 py-1 text-center font-normal whitespace-nowrap text-faint"
                >
                  {frequency === "annual" || p.endsWith("-01") || i === 0 ? formatPeriod(p) : formatPeriod(p).slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.id}>
                <th scope="row" className="sticky left-0 z-10 bg-plate px-3 py-1 text-left font-medium whitespace-nowrap text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <svg width="16" height="8" aria-hidden="true">
                      <line x1="0" x2="16" y1="4" y2="4" stroke={row.color} strokeWidth="2" strokeDasharray={row.dash} />
                    </svg>
                    {row.label}
                  </span>
                </th>
                {row.cells.map((cell, c) => {
                  const ch = cell.change;
                  const style = ch ? { background: levelFill(heatLevel(ch.pct, max)), color: "var(--fg)" } : { background: "transparent", color: "var(--faint)" };
                  const label = ch
                    ? `${row.label}, ${formatPeriod(cell.period, true)}: ${formatPct(ch.pct)} from ${formatNumber(ch.fromValue, row.digits)} in ${formatPeriod(ch.fromPeriod, true)} to ${formatNumber(ch.toValue, row.digits)}, ${row.unit}${ch.estimated ? "; uses an estimated value" : ""}.`
                    : `${row.label}, ${formatPeriod(cell.period, true)}: no change can be calculated; an observation is missing or the source changes.`;
                  const isOn = shown?.r === r && shown?.c === c;
                  return (
                    <td key={cell.period} className="p-0">
                      <button
                        type="button"
                        data-cell={`${r}-${c}`}
                        tabIndex={r === r0 && c === c0 ? 0 : -1}
                        aria-label={label}
                        onMouseEnter={() => inspect(r, c)}
                        onFocus={() => {
                          setActive({ r, c });
                          inspect(r, c);
                        }}
                        onClick={() => inspect(r, c)}
                        className={`tnum block h-9 w-full min-w-12 px-1 text-center focus-visible:outline-offset-[-2px] ${
                          isOn ? "ring-1 ring-inset ring-foreground" : ""
                        } ${ch ? "" : "border border-dashed border-border-strong"}`}
                        style={style}
                      >
                        {ch ? `${formatPct(ch.pct)}${ch.estimated ? "e" : ""}` : "n/a"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted">
        <p aria-live="polite" className="tnum min-h-5">
          {shown && shownCell
            ? shownCell.change
              ? `${rows[shown.r].label}, ${formatPeriod(shownCell.period, true)}: ${formatPct(shownCell.change.pct)} (${formatNumber(shownCell.change.fromValue, rows[shown.r].digits)} → ${formatNumber(shownCell.change.toValue, rows[shown.r].digits)} ${rows[shown.r].unit})${shownCell.change.estimated ? ", using an estimate" : ""}`
              : `${rows[shown.r].label}, ${formatPeriod(shownCell.period, true)}: no change can be calculated.`
            : "Hover or focus a cell to see the values behind it."}
        </p>
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="tnum">−{max}%</span>
          <span className="flex border border-border-strong">
            {Array.from({ length: HEAT_STEPS * 2 + 1 }, (_, i) => i - HEAT_STEPS).map((level) => (
              <span key={level} className="block h-3 w-4" style={{ background: levelFill(level) }} />
            ))}
          </span>
          <span className="tnum">+{max}%</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-faint">
        Each cell compares a {prevWord} with the one before and prints the signed change. Tint runs in four steps to ±{max}%, a round
        value near the 95th percentile of the moves shown{frequency === "annual" ? "; “e” marks a change that uses an estimate" : ""}.
      </p>
    </div>
  );
}
