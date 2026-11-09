"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Frequency, Observation, SourceBreak } from "@/lib/markets";
import { formatNumber, formatPeriod, periodFrequency, periodsBetween } from "@/lib/markets";

export interface ChartLine {
  id: string;
  label: string;
  color: string;
  dash: string | undefined;
  /** Already windowed (and indexed, in the indexed view). Missing periods are simply absent. */
  points: Observation[];
  /** Stated changes of underlying source inside the window. The line is not joined across one. */
  breaks: SourceBreak[];
  /** Unit shown in the tooltip, e.g. "US$/t" or "index". */
  unit: string;
  digits: number;
}

interface Segment {
  d: string;
  estimated: boolean;
}

interface PriceChartProps {
  lines: ChartLine[];
  /** Every period in the window, oldest first. The x-axis spans exactly these. */
  periods: string[];
  mode: "indexed" | "absolute";
  /** Base month of the indexed view; draws the 100 reference line. */
  basePeriod: string | null;
  cursor: string | null;
  onCursor: (period: string | null) => void;
  focusId: string | null;
  onFocus: (id: string | null) => void;
  /** Accessible name for the plot. The data itself is in the table view. */
  label: string;
}

const MARGIN = { top: 16, bottom: 32, left: 56 };
const X_STEPS = [1, 2, 3, 6, 12, 24, 36, 60];

/** Month number on a continuous scale, for calendar-aligned monthly ticks. */
function monthIndex(p: string): number {
  return Number(p.slice(0, 4)) * 12 + Number(p.slice(5, 7)) - 1;
}

/**
 * Split a line into drawable pieces. Consecutive observations are joined;
 * a missing period or a stated source break ends the piece. A step touching an
 * estimated value is drawn separately so it can be dotted.
 */
export function lineSegments(
  points: readonly Observation[],
  periods: readonly string[],
  breaks: readonly SourceBreak[],
  x: (p: string) => number,
  y: (v: number) => number,
): { segments: Segment[]; singles: Array<{ cx: number; cy: number; estimated: boolean; period: string }> } {
  const byPeriod = new Map(points.map((o) => [o.period, o]));
  const breakAt = new Set(breaks.map((b) => b.period));
  const segments: Segment[] = [];
  const joined = new Set<string>();
  for (let i = 1; i < periods.length; i++) {
    const a = byPeriod.get(periods[i - 1]);
    const b = byPeriod.get(periods[i]);
    if (!a || !b || breakAt.has(periods[i])) continue;
    const estimated = Boolean(a.estimated || b.estimated);
    const step = `${x(a.period).toFixed(1)},${y(a.value).toFixed(1)}L${x(b.period).toFixed(1)},${y(b.value).toFixed(1)}`;
    const prev = segments[segments.length - 1];
    if (prev && prev.estimated === estimated && joined.has(a.period)) prev.d += `L${x(b.period).toFixed(1)},${y(b.value).toFixed(1)}`;
    else segments.push({ d: `M${step}`, estimated });
    joined.add(a.period);
    joined.add(b.period);
  }
  const singles = points
    .filter((o) => !joined.has(o.period))
    .map((o) => ({ cx: x(o.period), cy: y(o.value), estimated: Boolean(o.estimated), period: o.period }));
  return { segments, singles };
}

/** Round, evenly spaced y-ticks covering [min, max]. */
export function niceTicks(min: number, max: number, target = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / Math.max(1, target - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v <= max + step * 1e-9; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  if (ticks[ticks.length - 1] < max) ticks.push(Number((ticks[ticks.length - 1] + step).toFixed(10)));
  return ticks;
}

/** Spread label y-positions so no two are closer than `gap`, keeping order. */
function spreadLabels(ys: number[], gap: number, lo: number, hi: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) {
    if (order[k].y - order[k - 1].y < gap) order[k].y = order[k - 1].y + gap;
  }
  const overflow = order.length ? order[order.length - 1].y - hi : 0;
  if (overflow > 0) for (const o of order) o.y -= overflow;
  for (const o of order) o.y = Math.max(lo, o.y);
  const out = new Array<number>(ys.length);
  for (const o of order) out[o.i] = o.y;
  return out;
}

export function PriceChart({
  lines,
  periods,
  mode,
  basePeriod,
  cursor,
  onCursor,
  focusId,
  onFocus,
  label,
}: PriceChartProps) {
  const frequency: Frequency = periodFrequency(periods[0]) ?? "monthly";
  const unitWord = frequency === "annual" ? "years" : "months";
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = Math.round(Math.min(400, Math.max(260, width * 0.46)));
  // Room for the longest direct label (≈6.6px per character at 12px), capped at 30% of the width.
  const CHAR_W = 6.6;
  const longest = lines.reduce((n, l) => Math.max(n, l.label.length), 0);
  const right = Math.min(Math.max(Math.round(longest * CHAR_W) + 20, 56), Math.round(width * 0.3));
  const maxChars = Math.max(4, Math.floor((right - 18) / CHAR_W));
  const fit = (label: string) => (label.length > maxChars ? `${label.slice(0, maxChars - 1).trimEnd()}…` : label);
  const plotW = Math.max(40, width - MARGIN.left - right);
  const plotH = height - MARGIN.top - MARGIN.bottom;

  const geo = useMemo(() => {
    const first = periods[0];
    const span = Math.max(1, periods.length - 1);
    const x = (p: string) => MARGIN.left + (periods.length > 1 ? periodsBetween(first, p) / span : 0.5) * plotW;
    const values = lines.flatMap((l) => l.points.map((o) => o.value));
    if (mode === "indexed" && basePeriod) values.push(100);
    const lo = values.length ? Math.min(...values) : 0;
    const hi = values.length ? Math.max(...values) : 1;
    const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.05 || 1;
    const ticks = niceTicks(lo - pad, hi + pad, plotH < 240 ? 4 : 5);
    const y0 = ticks[0] ?? lo;
    const y1 = ticks[ticks.length - 1] ?? hi;
    const y = (v: number) => MARGIN.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;

    // x ticks: every year for annual data; otherwise the smallest calendar-aligned
    // step that keeps labels ~80px apart.
    const maxLabels = Math.max(2, Math.floor(plotW / 80));
    let xTicks: string[];
    let yearOnly = true;
    if (frequency === "annual") {
      const step = Math.max(1, Math.ceil(periods.length / maxLabels));
      xTicks = periods.filter((_, i) => i % step === 0);
    } else {
      const step = X_STEPS.find((s) => periods.length / s <= maxLabels) ?? 60;
      xTicks = periods.filter((p) => monthIndex(p) % step === 0);
      yearOnly = step >= 12;
    }

    // Months where at least one plotted line has no value: drawn as a shaded band.
    const missing = periods.filter((p) => lines.some((l) => !l.points.some((o) => o.period === p)));

    const paths = lines.map((l) => {
      const byPeriod = new Map(l.points.map((o) => [o.period, o]));
      const { segments, singles } = lineSegments(l.points, periods, l.breaks, x, y);
      const last = l.points[l.points.length - 1];
      return { id: l.id, segments, singles, last, byPeriod };
    });

    const endYs = spreadLabels(
      paths.map((p) => (p.last ? y(p.last.value) : MARGIN.top)),
      15,
      MARGIN.top + 4,
      MARGIN.top + plotH,
    );

    return { x, y, ticks, xTicks, yearOnly, missing, paths, endYs, span };
  }, [lines, periods, mode, basePeriod, plotW, plotH, frequency]);

  const cursorIndex = cursor ? periods.indexOf(cursor) : -1;

  function periodFromClientX(clientX: number, target: SVGSVGElement): string | null {
    const rect = target.getBoundingClientRect();
    const scale = width / rect.width;
    const px = (clientX - rect.left) * scale - MARGIN.left;
    if (periods.length === 0) return null;
    const i = Math.round((px / plotW) * geo.span);
    return periods[Math.min(periods.length - 1, Math.max(0, i))];
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (periods.length === 0) return;
    const at = cursorIndex === -1 ? periods.length - 1 : cursorIndex;
    let handled = true;
    switch (e.key) {
      case "ArrowLeft":
        onCursor(periods[Math.max(0, at - (cursorIndex === -1 ? 0 : 1))]);
        break;
      case "ArrowRight":
        onCursor(periods[Math.min(periods.length - 1, at + (cursorIndex === -1 ? 0 : 1))]);
        break;
      case "Home":
        onCursor(periods[0]);
        break;
      case "End":
        onCursor(periods[periods.length - 1]);
        break;
      case "ArrowUp":
      case "ArrowDown": {
        const ids = lines.map((l) => l.id);
        if (ids.length === 0) break;
        const cur = focusId ? ids.indexOf(focusId) : -1;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = cur === -1 ? (delta === 1 ? 0 : ids.length - 1) : (cur + delta + ids.length) % ids.length;
        onFocus(ids[next]);
        break;
      }
      case "Escape":
        onCursor(null);
        onFocus(null);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  }

  // Enough decimals that no two ticks print alike (a 2.5 or 0.5 step needs them), at most 2.
  const tickDigits = Math.min(2, Math.max(0, ...geo.ticks.map((t) => String(t).split(".")[1]?.length ?? 0)));
  const fmtTick = (v: number) => formatNumber(v, tickDigits);
  const colW = periods.length > 1 ? plotW / (periods.length - 1) : plotW;

  return (
    <div
      ref={wrapRef}
      role="group"
      tabIndex={0}
      aria-label={`${label}. Left and right arrows move between ${unitWord}, up and down change the emphasised series, Escape clears.`}
      onKeyDown={onKeyDown}
      className="relative w-full rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        className="block h-auto max-w-full select-none"
        style={{ touchAction: "pan-y" }}
        onPointerMove={(e) => onCursor(periodFromClientX(e.clientX, e.currentTarget))}
        onPointerDown={(e) => onCursor(periodFromClientX(e.clientX, e.currentTarget))}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") onCursor(null);
        }}
      >
        {/* Months with a missing value in at least one series */}
        {geo.missing.map((p) => (
          <rect
            key={`gap-${p}`}
            x={geo.x(p) - colW / 2}
            y={MARGIN.top}
            width={colW}
            height={plotH}
            fill="var(--elevated)"
            opacity={0.8}
          />
        ))}

        {/* Grid and y-axis labels */}
        {geo.ticks.map((t) => (
          <g key={`y-${t}`}>
            <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" className="tnum" fontSize={11} fill="var(--faint)">
              {fmtTick(t)}
            </text>
          </g>
        ))}

        {/* x-axis */}
        <line x1={MARGIN.left} x2={MARGIN.left + plotW} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH} stroke="var(--border-strong)" />
        {geo.xTicks.map((p) => (
          <g key={`x-${p}`}>
            <line x1={geo.x(p)} x2={geo.x(p)} y1={MARGIN.top + plotH} y2={MARGIN.top + plotH + 4} stroke="var(--border-strong)" />
            <text x={geo.x(p)} y={MARGIN.top + plotH + 18} textAnchor="middle" className="tnum" fontSize={11} fill="var(--faint)">
              {geo.yearOnly ? p.slice(0, 4) : formatPeriod(p)}
            </text>
          </g>
        ))}

        {/* Index reference */}
        {mode === "indexed" && basePeriod ? (
          <line
            x1={MARGIN.left}
            x2={MARGIN.left + plotW}
            y1={geo.y(100)}
            y2={geo.y(100)}
            stroke="var(--muted)"
            strokeDasharray="2 3"
            strokeWidth={1}
          />
        ) : null}

        {/* Stated changes of underlying source */}
        {lines.flatMap((l) =>
          l.breaks
            .filter((b) => periods.includes(b.period))
            .map((b) => (
              <g key={`brk-${l.id}-${b.period}`} pointerEvents="none">
                <line
                  x1={geo.x(b.period)}
                  x2={geo.x(b.period)}
                  y1={MARGIN.top}
                  y2={MARGIN.top + plotH}
                  stroke={l.color}
                  strokeDasharray="1 4"
                  strokeWidth={1.5}
                />
                <text x={geo.x(b.period) + 4} y={MARGIN.top + 10} fontSize={10} fill="var(--faint)">
                  source change
                </text>
              </g>
            )),
        )}

        {/* Lines */}
        {lines.map((l, i) => {
          const p = geo.paths[i];
          const dim = focusId !== null && focusId !== l.id;
          const strong = focusId === l.id;
          const markers = frequency === "annual" || periods.length <= 13;
          return (
            <g key={l.id} opacity={dim ? 0.3 : 1}>
              {p.segments.map((seg) => (
                <path
                  key={seg.d}
                  d={seg.d}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={strong ? 2.75 : 2}
                  strokeDasharray={seg.estimated ? "2 4" : l.dash}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
              {(markers ? l.points.map((o) => ({ cx: geo.x(o.period), cy: geo.y(o.value), estimated: Boolean(o.estimated), period: o.period })) : p.singles).map(
                (s) => (
                  <circle
                    key={`pt-${s.period}`}
                    cx={s.cx}
                    cy={s.cy}
                    r={4}
                    fill={s.estimated ? "var(--surface)" : l.color}
                    stroke={s.estimated ? l.color : "var(--surface)"}
                    strokeWidth={2}
                  />
                ),
              )}
              {/* Wide invisible hit paths so a line can be clicked to emphasise it */}
              {p.segments.map((seg) => (
                <path
                  key={`hit-${seg.d}`}
                  d={seg.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ cursor: "pointer" }}
                  onClick={() => onFocus(focusId === l.id ? null : l.id)}
                />
              ))}
            </g>
          );
        })}

        {/* Direct labels at line ends */}
        {lines.map((l, i) => {
          const p = geo.paths[i];
          if (!p.last) return null;
          const lx = geo.x(p.last.period);
          const ly = geo.y(p.last.value);
          const ty = geo.endYs[i];
          const dim = focusId !== null && focusId !== l.id;
          return (
            <g key={`lab-${l.id}`} opacity={dim ? 0.45 : 1}>
              <line x1={lx + 3} x2={lx + 10} y1={ly} y2={ty} stroke={l.color} strokeWidth={1} />
              <text
                x={lx + 13}
                y={ty}
                dy="0.32em"
                fontSize={12}
                fontWeight={focusId === l.id ? 700 : 500}
                fill="var(--fg)"
              >
                {fit(l.label)}
                {fit(l.label) !== l.label ? <title>{l.label}</title> : null}
              </text>
            </g>
          );
        })}

        {/* Crosshair */}
        {cursor && cursorIndex !== -1 ? (
          <g pointerEvents="none">
            <line
              x1={geo.x(cursor)}
              x2={geo.x(cursor)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotH}
              stroke="var(--border-strong)"
              strokeWidth={1}
            />
            {lines.map((l, i) => {
              const o = geo.paths[i].byPeriod.get(cursor);
              if (o === undefined) return null;
              const v = o.value;
              return (
                <circle
                  key={`dot-${l.id}`}
                  cx={geo.x(cursor)}
                  cy={geo.y(v)}
                  r={4.5}
                  fill={o.estimated ? "var(--surface)" : l.color}
                  stroke={o.estimated ? l.color : "var(--surface)"}
                  strokeWidth={2}
                  opacity={focusId !== null && focusId !== l.id ? 0.4 : 1}
                />
              );
            })}
          </g>
        ) : null}
      </svg>

      {cursor && cursorIndex !== -1 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-2 z-10 w-56 rounded-md border border-border-strong bg-elevated px-3 py-2 text-xs"
          style={
            geo.x(cursor) > width / 2
              ? { right: Math.max(8, width - geo.x(cursor) + 12) }
              : { left: Math.min(width - 232, geo.x(cursor) + 12) }
          }
        >
          <p className="tnum font-display font-semibold text-foreground">{formatPeriod(cursor, true)}</p>
          <ul className="mt-1 space-y-1">
            {lines.map((l, i) => {
              const o = geo.paths[i].byPeriod.get(cursor);
              return (
                <li key={l.id} className="flex items-center gap-2">
                  <svg width="14" height="8" aria-hidden="true" className="shrink-0">
                    <line x1="0" x2="14" y1="4" y2="4" stroke={l.color} strokeWidth="2.5" strokeDasharray={l.dash} />
                  </svg>
                  <span className="min-w-0 flex-1 truncate text-muted">{l.label}</span>
                  <span className="tnum text-foreground">
                    {o ? `${formatNumber(o.value, mode === "indexed" ? 1 : l.digits)}${o.estimated ? "e" : ""}` : "n/a"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-faint">
            {mode === "indexed" ? "Index, base period = 100" : lines[0]?.unit}
            {geo.paths.some((p) => p.byPeriod.get(cursor)?.estimated) ? " · e = estimated" : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
