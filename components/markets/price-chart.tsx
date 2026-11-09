"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Observation } from "@/lib/markets";
import { formatNumber, formatPeriod } from "@/lib/markets";

export interface ChartLine {
  id: string;
  label: string;
  color: string;
  dash: string | undefined;
  /** Already windowed (and indexed, in the indexed view). Missing months are simply absent. */
  points: Observation[];
}

interface PriceChartProps {
  lines: ChartLine[];
  /** Every month in the window, oldest first. The x-axis spans exactly these. */
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

const MARGIN = { top: 16, right: 88, bottom: 32, left: 56 };
const X_STEPS = [1, 2, 3, 6, 12, 24, 36, 60];

/** Index of a "YYYY-MM" month on a continuous scale. */
function monthIndex(p: string): number {
  return Number(p.slice(0, 4)) * 12 + Number(p.slice(5, 7)) - 1;
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
  const right = width < 480 ? 76 : MARGIN.right;
  const plotW = Math.max(40, width - MARGIN.left - right);
  const plotH = height - MARGIN.top - MARGIN.bottom;

  const geo = useMemo(() => {
    const first = periods[0];
    const span = Math.max(1, periods.length - 1);
    const x = (p: string) => MARGIN.left + ((monthIndex(p) - monthIndex(first)) / span) * plotW;
    const values = lines.flatMap((l) => l.points.map((o) => o.value));
    if (mode === "indexed" && basePeriod) values.push(100);
    const lo = values.length ? Math.min(...values) : 0;
    const hi = values.length ? Math.max(...values) : 1;
    const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.05 || 1;
    const ticks = niceTicks(lo - pad, hi + pad, plotH < 240 ? 4 : 5);
    const y0 = ticks[0] ?? lo;
    const y1 = ticks[ticks.length - 1] ?? hi;
    const y = (v: number) => MARGIN.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;

    // x ticks: the smallest calendar-aligned step that keeps labels ~80px apart.
    const maxLabels = Math.max(2, Math.floor(plotW / 80));
    const step = X_STEPS.find((s) => periods.length / s <= maxLabels) ?? 60;
    const xTicks = periods.filter((p) => monthIndex(p) % step === 0);
    const yearOnly = step >= 12;

    // Months where at least one plotted line has no value: drawn as a shaded band.
    const missing = periods.filter((p) => lines.some((l) => !l.points.some((o) => o.period === p)));

    const paths = lines.map((l) => {
      const byPeriod = new Map(l.points.map((o) => [o.period, o.value]));
      const segments: string[] = [];
      const singles: Array<{ cx: number; cy: number }> = [];
      let current: Array<[number, number]> = [];
      const flush = () => {
        if (current.length === 1) singles.push({ cx: current[0][0], cy: current[0][1] });
        else if (current.length > 1) segments.push("M" + current.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join("L"));
        current = [];
      };
      for (const p of periods) {
        const v = byPeriod.get(p);
        if (v === undefined) flush();
        else current.push([x(p), y(v)]);
      }
      flush();
      const last = l.points[l.points.length - 1];
      return { id: l.id, d: segments.join(" "), singles, last, byPeriod };
    });

    const endYs = spreadLabels(
      paths.map((p) => (p.last ? y(p.last.value) : MARGIN.top)),
      15,
      MARGIN.top + 4,
      MARGIN.top + plotH,
    );

    return { x, y, ticks, xTicks, yearOnly, missing, paths, endYs, span };
  }, [lines, periods, mode, basePeriod, plotW, plotH]);

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

  const fmtTick = (v: number) => (mode === "indexed" ? formatNumber(v, Number.isInteger(v) ? 0 : 1) : formatNumber(v, 0));
  const colW = periods.length > 1 ? plotW / (periods.length - 1) : plotW;

  return (
    <div
      ref={wrapRef}
      role="group"
      tabIndex={0}
      aria-label={`${label}. Left and right arrows move between months, up and down change the emphasised series, Escape clears.`}
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

        {/* Lines */}
        {lines.map((l, i) => {
          const p = geo.paths[i];
          const dim = focusId !== null && focusId !== l.id;
          const strong = focusId === l.id;
          return (
            <g key={l.id} opacity={dim ? 0.3 : 1}>
              <path
                d={p.d}
                fill="none"
                stroke={l.color}
                strokeWidth={strong ? 2.75 : 2}
                strokeDasharray={l.dash}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {p.singles.map((s) => (
                <circle key={`${s.cx}-${s.cy}`} cx={s.cx} cy={s.cy} r={4} fill={l.color} stroke="var(--surface)" strokeWidth={2} />
              ))}
              {/* Wide invisible hit path so a line can be clicked to emphasise it */}
              <path
                d={p.d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: "pointer" }}
                onClick={() => onFocus(focusId === l.id ? null : l.id)}
              />
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
                {l.label}
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
              const v = geo.paths[i].byPeriod.get(cursor);
              if (v === undefined) return null;
              return (
                <circle
                  key={`dot-${l.id}`}
                  cx={geo.x(cursor)}
                  cy={geo.y(v)}
                  r={4.5}
                  fill={l.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  opacity={focusId !== null && focusId !== l.id ? 0.4 : 1}
                />
              );
            })}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
