"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Frequency, Observation, SourceBreak } from "@/lib/markets";
import { formatNumber, formatPeriod } from "@/lib/markets";
import {
  buildYScale,
  interiorGaps,
  keepNonOverlapping,
  lineSegments,
  niceTicks,
  pickActive,
  seriesExtremes,
  spreadLabels,
  timeTicks,
  type ScaleKind,
} from "./chart-math";

export { lineSegments, niceTicks };

export interface ChartLine {
  id: string;
  label: string;
  color: string;
  dash: string | undefined;
  /** What is drawn: the published values, or their index in the indexed view. Missing periods are absent. */
  points: Observation[];
  /** The published values over the same window, shown in the readout whatever the view. */
  published: Observation[];
  /** Stated changes of underlying source inside the window. The line is not joined across one. */
  breaks: SourceBreak[];
  /** Unit of the published values, e.g. "US$/t". */
  unit: string;
  /** Publisher short name, e.g. "World Bank Pink Sheet". */
  source: string;
  /** Exchange benchmark, price assessment or trade unit value. */
  kind: string;
  digits: number;
}

interface PriceChartProps {
  lines: ChartLine[];
  /** Every period in view, oldest first. The time axis spans exactly these. */
  periods: string[];
  frequency: Frequency;
  mode: "indexed" | "absolute";
  /** The value axis in use (the caller has already fallen back to linear where log is impossible). */
  scale: ScaleKind;
  /** Base period of the indexed view; draws the 100 reference line. */
  basePeriod: string | null;
  /** A period and series pointed at from elsewhere on the page (the heatmap). */
  inspect: { period: string | null; id: string | null };
  focusId: string | null;
  onFocus: (id: string | null) => void;
  /** Accessible name for the plot. The data itself is in the table view. */
  label: string;
  onSelectRange: (from: string, to: string) => void;
  /** Zoom by a factor (below 1 zooms in) around a period, or around the default anchor when null. */
  onZoom: (factor: number, anchor: string | null) => void;
  onPan: (steps: number) => void;
  onReset: () => void;
}

const M = { top: 20, bottom: 30, left: 12 };
const CHAR_W = 6.5;
const MAX_ROWS = 8;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function Swatch({ color, dash }: { color: string; dash: string | undefined }) {
  return (
    <svg width="16" height="8" aria-hidden="true" className="shrink-0 self-center">
      <line x1="0" x2="16" y1="4" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dash} />
    </svg>
  );
}

export function PriceChart({
  lines,
  periods,
  frequency,
  mode,
  scale,
  basePeriod,
  inspect,
  focusId,
  onFocus,
  label,
  onSelectRange,
  onZoom,
  onPan,
  onReset,
}: PriceChartProps) {
  const unitWord = frequency === "annual" ? "years" : "months";
  const revealId = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<{ period: string; py: number | null; keyboard: boolean } | null>(null);
  const [band, setBand] = useState<{ x0: number; x1: number } | null>(null);
  const drag = useRef<{ x: number; shift: boolean; moved: boolean; panned: number } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = width < 560;
  const height = compact ? clamp(Math.round(width * 0.78), 280, 360) : clamp(Math.round(width * 0.46), 380, 560);
  const plotH = height - M.top - M.bottom;

  const valueText = (v: number, digits: number) => formatNumber(v, mode === "indexed" ? 1 : digits);

  const ys = useMemo(() => {
    const values = lines.flatMap((l) => l.points.map((o) => o.value));
    if (mode === "indexed" && basePeriod) values.push(100);
    return buildYScale(values, scale, plotH < 300 ? 4 : plotH < 420 ? 5 : 6);
  }, [lines, mode, basePeriod, scale, plotH]);

  // Enough decimals that no two ticks print alike, at most 3.
  const tickDigits = Math.min(3, Math.max(0, ...ys.ticks.map((t) => String(t).split(".")[1]?.length ?? 0)));
  const fmtTick = (v: number) => formatNumber(v, tickDigits);
  const longestTag = Math.max(
    3,
    ...ys.ticks.map((t) => fmtTick(t).length),
    ...lines.map((l) => {
      const last = l.points[l.points.length - 1];
      return last ? valueText(last.value, l.digits).length + (last.estimated ? 1 : 0) : 0;
    }),
  );
  const axisW = Math.ceil(longestTag * CHAR_W) + 18;
  const plotW = Math.max(60, width - M.left - axisW);
  const plotRight = M.left + plotW;
  const plotBottom = M.top + plotH;

  const geo = useMemo(() => {
    const n = periods.length;
    const index = new Map(periods.map((p, i) => [p, i]));
    // Annual points sit half a step in from each edge, so a year reads as a point and not as an edge of the plot.
    const inset = frequency === "annual" ? Math.min(80, plotW / Math.max(2, n * 2)) : 8;
    const innerW = Math.max(1, plotW - inset * 2);
    const stepPx = n > 1 ? innerW / (n - 1) : innerW;
    const xi = (i: number) => M.left + inset + (n > 1 ? i * stepPx : innerW / 2);
    const x = (p: string) => xi(index.get(p) ?? 0);
    const y = (v: number) => M.top + (1 - ys.at(v)) * plotH;
    const at = (px: number) => clamp(Math.round((px - M.left - inset) / stepPx), 0, Math.max(0, n - 1));

    const { ticks: xTicks, yearOnly } = timeTicks(periods, frequency, Math.floor(plotW / (compact ? 64 : 84)));

    const paths = lines.map((l) => {
      const { segments, singles } = lineSegments(l.points, periods, l.breaks, x, y);
      return {
        id: l.id,
        segments,
        singles,
        last: l.points[l.points.length - 1],
        byPeriod: new Map(l.points.map((o) => [o.period, o])),
        published: new Map(l.published.map((o) => [o.period, o])),
        breakAt: new Map(l.breaks.map((b) => [b.period, b])),
      };
    });

    // A period inside a series' own span with no published value: the line breaks, and the column is shaded.
    const gaps = [...new Set(lines.flatMap((l) => interiorGaps(l.points, periods)))];

    return { index, x, y, at, stepPx, xTicks, yearOnly, paths, gaps };
  }, [lines, periods, frequency, plotW, plotH, ys, compact]);

  const cursorPeriod = hover && geo.index.has(hover.period) ? hover.period : inspect.period && geo.index.has(inspect.period) ? inspect.period : null;
  const pointerY = hover && cursorPeriod === hover.period ? hover.py : null;
  const cursorIndex = cursorPeriod ? (geo.index.get(cursorPeriod) ?? -1) : -1;

  // The latest wheel handler inputs, read from a native listener (React's wheel listener is passive).
  const live = useRef({ periods, at: geo.at, width, onZoom, onPan });
  useEffect(() => {
    live.current = { periods, at: geo.at, width, onZoom, onPan };
  });
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let zoomAcc = 0;
    let panAcc = 0;
    const onWheel = (e: WheelEvent) => {
      const cur = live.current;
      if (cur.periods.length === 0) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAcc += e.deltaY;
        if (Math.abs(zoomAcc) < 40) return;
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) * (cur.width / rect.width);
        cur.onZoom(zoomAcc > 0 ? 1.25 : 0.8, cur.periods[cur.at(px)] ?? null);
        zoomAcc = 0;
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        panAcc += e.deltaX;
        if (Math.abs(panAcc) < 30) return;
        cur.onPan(panAcc > 0 ? 1 : -1);
        panAcc = 0;
      }
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  function pointerPos(e: React.PointerEvent<SVGSVGElement>): { px: number; py: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    const k = width / rect.width;
    return { px: (e.clientX - rect.left) * k, py: (e.clientY - rect.top) * k };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (periods.length === 0) return;
    const { px, py } = pointerPos(e);
    setHover({ period: periods[geo.at(px)], py, keyboard: false });
    if (e.pointerType === "mouse" && e.button === 0) drag.current = { x: px, shift: e.shiftKey, moved: false, panned: 0 };
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (periods.length === 0) return;
    const { px, py } = pointerPos(e);
    const d = drag.current;
    if (d && !d.moved && Math.abs(px - d.x) > 6) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d?.moved && d.shift) {
      // Shift-drag pans: the history follows the pointer, one period per step of width.
      const target = Math.round((d.x - px) / geo.stepPx);
      if (target !== d.panned) {
        onPan(target - d.panned);
        d.panned = target;
      }
      return;
    }
    if (d?.moved) setBand({ x0: d.x, x1: clamp(px, M.left, plotRight) });
    setHover({ period: periods[geo.at(px)], py, keyboard: false });
  }

  function endDrag(e: React.PointerEvent<SVGSVGElement>, commit: boolean) {
    const d = drag.current;
    drag.current = null;
    setBand(null);
    if (!d?.moved) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    if (!commit || d.shift) return;
    const { px } = pointerPos(e);
    const a = geo.at(Math.min(d.x, px));
    const b = geo.at(Math.max(d.x, px));
    if (b > a) onSelectRange(periods[a], periods[b]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (periods.length === 0) return;
    const lastIndex = periods.length - 1;
    const at = cursorIndex === -1 ? lastIndex : cursorIndex;
    const move = (i: number) => setHover({ period: periods[clamp(i, 0, lastIndex)], py: null, keyboard: true });
    let handled = true;
    switch (e.key) {
      case "ArrowLeft":
        if (e.shiftKey) onPan(-1);
        else move(cursorIndex === -1 ? at : at - 1);
        break;
      case "ArrowRight":
        if (e.shiftKey) onPan(1);
        else move(cursorIndex === -1 ? at : at + 1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(lastIndex);
        break;
      case "+":
      case "=":
        onZoom(0.8, cursorPeriod);
        break;
      case "-":
      case "_":
        onZoom(1.25, cursorPeriod);
        break;
      case "ArrowUp":
      case "ArrowDown": {
        const ids = lines.map((l) => l.id);
        if (ids.length === 0) break;
        const cur = focusId ? ids.indexOf(focusId) : -1;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        onFocus(ids[cur === -1 ? (delta === 1 ? 0 : ids.length - 1) : (cur + delta + ids.length) % ids.length]);
        break;
      }
      case "Escape":
        setHover(null);
        onFocus(null);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  }

  // ── Marks ─────────────────────────────────────────────────────────────────
  const everyPoint = frequency === "annual" || geo.stepPx >= 9;
  const markerR = frequency === "annual" ? 3.25 : geo.stepPx >= 16 ? 2 : 1.6;

  // Highs and lows of the emphasised series, or of every series while the plot is not crowded.
  const annotated = focusId ? lines.filter((l) => l.id === focusId) : lines.length <= (compact ? 2 : 4) ? lines : [];
  const withDate = !compact && annotated.length <= 2;
  // Where the "Source change" labels sit, so an annotation is placed clear of them.
  const breakLabels = lines.flatMap((l) =>
    l.breaks
      .filter((brk) => geo.index.has(brk.period))
      .map((brk) => {
        const bx = geo.x(brk.period);
        return { x: bx > plotRight - 90 ? bx - 80 : bx + 2, y: M.top, w: 78, h: 14 };
      }),
  );
  const onBreakLabel = (x: number, y: number, w: number) =>
    breakLabels.some((k) => x < k.x + k.w && k.x < x + w && y < k.y + k.h && k.y < y + 14);
  const extremes = annotated.flatMap((l) =>
    seriesExtremes(l.points).map((ex) => {
      const cx = geo.x(ex.period);
      const cy = geo.y(ex.value);
      const text = `${ex.kind === "high" ? "High" : "Low"} ${valueText(ex.value, l.digits)}${ex.estimated ? "e" : ""}${withDate ? `, ${formatPeriod(ex.period)}` : ""}`;
      const w = text.length * 6 + 6;
      let ty = ex.kind === "high" ? cy - 9 : cy + 17;
      if (ty - 11 < 2) ty = cy + 17;
      if (ty + 4 > plotBottom) ty = cy - 9;
      let tx = clamp(cx, M.left + w / 2 + 2, plotRight - w / 2 - 2);
      if (onBreakLabel(tx - w / 2, ty - 11, w)) {
        // Step to the side of the marker line that carries no "Source change" label.
        const left = cx - w / 2 - 8;
        const right = cx + w / 2 + 8;
        tx = !onBreakLabel(left - w / 2, ty - 11, w) && left - w / 2 >= M.left ? left : right;
      }
      return { key: `${l.id}-${ex.kind}`, lineId: l.id, cx, cy, tx, ty, text, color: l.color, estimated: ex.estimated, box: { x: tx - w / 2, y: ty - 11, w, h: 14 } };
    }),
  );
  const keepExtreme = keepNonOverlapping(extremes.map((m) => m.box), 3);

  // Last value of each series, tagged on the value axis.
  const tagged = lines.map((l, i) => ({ l, p: geo.paths[i] })).filter(({ l, p }) => p.last && (lines.length <= 8 || l.id === focusId));
  const tagYs = spreadLabels(
    tagged.map(({ p }) => geo.y(p.last!.value)),
    17,
    M.top + 8,
    plotBottom - 8,
  );

  // ── Crosshair and readout ─────────────────────────────────────────────────
  const candidates = cursorPeriod
    ? lines.flatMap((l, i) => {
        const o = geo.paths[i].byPeriod.get(cursorPeriod);
        return o ? [{ id: l.id, y: geo.y(o.value) }] : [];
      })
    : [];
  const activeId = pickActive(candidates, pointerY, focusId ?? inspect.id);
  const activeAt = lines.findIndex((l) => l.id === activeId);
  const activePoint = activeAt !== -1 && cursorPeriod ? geo.paths[activeAt].byPeriod.get(cursorPeriod) : undefined;

  const readPeriod = cursorPeriod ?? (compact ? (periods[periods.length - 1] ?? null) : null);
  const ordered = lines.length > MAX_ROWS && focusId ? [...lines].sort((a, b) => Number(b.id === focusId) - Number(a.id === focusId)) : lines;
  const rows = ordered.slice(0, MAX_ROWS);
  const hiddenRows = lines.length - rows.length;
  const pathOf = (id: string) => geo.paths[lines.findIndex((l) => l.id === id)];

  const readout = readPeriod ? (
    <>
      <p className="tnum flex items-baseline justify-between gap-3 font-display font-medium text-foreground">
        <span>{formatPeriod(readPeriod, true)}</span>
        {!cursorPeriod ? <span className="font-normal text-faint">Latest in view</span> : null}
      </p>
      <ul className="mt-1 divide-y divide-border">
        {rows.map((l) => {
          const p = pathOf(l.id);
          const pub = p.published.get(readPeriod);
          const pt = p.byPeriod.get(readPeriod);
          const brk = p.breakAt.get(readPeriod);
          return (
            <li key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 py-1.5">
              <span className="pt-1">
                <Swatch color={l.color} dash={l.dash} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-foreground">{l.label}</span>
                <span className="block text-faint">
                  {l.source}, {l.kind.toLowerCase()}
                </span>
              </span>
              <span className="tnum text-right">
                {pub ? (
                  <span className="block whitespace-nowrap">
                    <span className="text-foreground">
                      {formatNumber(pub.value, l.digits)}
                      {pub.estimated ? "e" : ""}
                    </span>{" "}
                    <span className="text-faint">{l.unit}</span>
                  </span>
                ) : (
                  <span className="block text-faint">No value published</span>
                )}
                {mode === "indexed" && pt ? <span className="block text-faint">Index {formatNumber(pt.value, 1)}</span> : null}
                {brk ? <span className="block text-faint">Source change</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
      {hiddenRows > 0 ? <p className="mt-1 text-faint">{hiddenRows} more series are in the data table.</p> : null}
      {rows.some((l) => pathOf(l.id).published.get(readPeriod)?.estimated) ? <p className="mt-1 text-faint">e = estimate stated by the source</p> : null}
    </>
  ) : null;

  const spoken =
    hover?.keyboard && cursorPeriod
      ? `${formatPeriod(cursorPeriod, true)}. ${lines
          .map((l) => {
            const pub = pathOf(l.id).published.get(cursorPeriod);
            return pub ? `${l.label}: ${formatNumber(pub.value, l.digits)} ${l.unit}${pub.estimated ? ", estimated" : ""}` : `${l.label}: no value published`;
          })
          .join("; ")}.`
      : "";

  const cx = cursorPeriod ? geo.x(cursorPeriod) : 0;
  const dateTag = cursorPeriod ? formatPeriod(cursorPeriod) : "";
  const dateTagW = dateTag.length * CHAR_W + 14;
  const bandPeriods = band ? ([periods[geo.at(Math.min(band.x0, band.x1))], periods[geo.at(Math.max(band.x0, band.x1))]] as const) : null;

  return (
    <div
      ref={wrapRef}
      role="group"
      tabIndex={0}
      aria-label={`${label}. Left and right arrows move between ${unitWord}; Shift with an arrow pans; plus and minus zoom; up and down change the emphasised series; Escape clears.`}
      onKeyDown={onKeyDown}
      className="relative w-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        className="block h-auto max-w-full select-none"
        style={{ touchAction: "pan-y", cursor: "crosshair" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !drag.current) setHover(null);
        }}
        onDoubleClick={onReset}
      >
        {/* Per-line clipping makes each published path unfold from left to right. CSS animates only the
            reveal rectangle, so gaps, estimates and dashes are never redrawn or distorted. */}
        <defs>
          {lines.map((l, i) => (
            <clipPath id={`${revealId}-${l.id}-sweep`} key={l.id} clipPathUnits="userSpaceOnUse">
              <rect x={0} y={0} width={width} height={height} className="market-line-reveal" style={{ animationDelay: `${Math.min(i * 90, 360)}ms` }} />
            </clipPath>
          ))}
        </defs>

        {/* Periods with no published value inside a series' own span */}
        {geo.gaps.map((p) => (
          <rect key={`gap-${p}`} x={geo.x(p) - geo.stepPx / 2} y={M.top} width={geo.stepPx} height={plotH} fill="var(--elevated)" />
        ))}

        {/* Value grid and axis labels */}
        {ys.ticks.map((t) => (
          <g key={`y-${t}`}>
            <line x1={M.left} x2={plotRight} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--border)" strokeWidth={1} />
            {/* A tick label gives way to a last-value tag sitting on it; the grid line stays. */}
            {tagYs.every((ty) => Math.abs(ty - geo.y(t)) > 14) ? (
              <text x={plotRight + 8} y={geo.y(t)} dy="0.32em" className="tnum" fontSize={11} fill="var(--faint)">
                {fmtTick(t)}
              </text>
            ) : null}
          </g>
        ))}

        {/* Index base */}
        {mode === "indexed" && basePeriod ? (
          <g>
            <line x1={M.left} x2={plotRight} y1={geo.y(100)} y2={geo.y(100)} stroke="var(--border-strong)" strokeWidth={1} />
            {/* The base is always labelled, unless a round tick already sits on or beside it. */}
            {ys.ticks.every((t) => Math.abs(geo.y(t) - geo.y(100)) > 14) && tagYs.every((ty) => Math.abs(ty - geo.y(100)) > 14) ? (
              <text x={plotRight + 8} y={geo.y(100)} dy="0.32em" className="tnum" fontSize={11} fill="var(--faint)">
                100
              </text>
            ) : null}
          </g>
        ) : null}

        {/* Time axis */}
        <line x1={M.left} x2={plotRight} y1={plotBottom} y2={plotBottom} stroke="var(--border-strong)" />
        <line x1={plotRight} x2={plotRight} y1={M.top} y2={plotBottom} stroke="var(--border)" />
        {geo.xTicks.map((p) => (
          <g key={`x-${p}`}>
            <line x1={geo.x(p)} x2={geo.x(p)} y1={plotBottom} y2={plotBottom + 4} stroke="var(--border-strong)" />
            <text x={geo.x(p)} y={plotBottom + 18} textAnchor="middle" className="tnum" fontSize={11} fill="var(--faint)">
              {geo.yearOnly ? p.slice(0, 4) : formatPeriod(p)}
            </text>
          </g>
        ))}

        {/* Stated changes of underlying source */}
        {lines.flatMap((l) =>
          l.breaks
            .filter((b) => geo.index.has(b.period))
            .map((b) => {
              const bx = geo.x(b.period);
              const flip = bx > plotRight - 90;
              return (
                <g key={`brk-${l.id}-${b.period}`} pointerEvents="none">
                  <line x1={bx} x2={bx} y1={M.top} y2={plotBottom} stroke={l.color} strokeDasharray="1 4" strokeWidth={1.5} />
                  <text x={bx + (flip ? -5 : 5)} y={M.top + 10} textAnchor={flip ? "end" : "start"} fontSize={10.5} fill="var(--muted)" stroke="var(--plate)" strokeWidth={3} paintOrder="stroke">
                    Source change
                  </text>
                </g>
              );
            }),
        )}

        {/* Lines: one straight step between consecutive published observations */}
        {lines.map((l, i) => {
          const p = geo.paths[i];
          const dim = focusId !== null && focusId !== l.id;
          const strong = focusId === l.id;
          const dots = everyPoint
            ? l.points.map((o) => ({ cx: geo.x(o.period), cy: geo.y(o.value), estimated: Boolean(o.estimated), period: o.period }))
            : p.singles;
          return (
            <g key={l.id} opacity={dim ? 0.28 : 1} clipPath={`url(#${revealId}-${l.id}-sweep)`}>
              {p.segments.map((seg) => (
                <path
                  key={seg.d}
                  d={seg.d}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={strong ? 2 : 1.5}
                  strokeDasharray={seg.estimated ? "2 3" : l.dash}
                  strokeLinejoin="miter"
                  strokeMiterlimit={2}
                  strokeLinecap="butt"
                />
              ))}
              {dots.map((s) => (
                <circle
                  key={`pt-${s.period}`}
                  cx={s.cx}
                  cy={s.cy}
                  r={everyPoint ? markerR : 2.25}
                  fill={s.estimated ? "var(--plate)" : l.color}
                  stroke={s.estimated ? l.color : frequency === "annual" ? "var(--plate)" : "none"}
                  strokeWidth={s.estimated ? 1.25 : 1.5}
                />
              ))}
              {/* Wide invisible hit paths so a line can be clicked to emphasise it */}
              {p.segments.map((seg) => (
                <path
                  key={`hit-${seg.d}`}
                  d={seg.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (!suppressClick.current) onFocus(focusId === l.id ? null : l.id);
                  }}
                />
              ))}
            </g>
          );
        })}

        {/* Highest and lowest observation in view */}
        {extremes.map((m, i) =>
          keepExtreme[i] ? (
            <g key={`ext-${m.key}`} pointerEvents="none" clipPath={`url(#${revealId}-${m.lineId}-sweep)`}>
              <circle cx={m.cx} cy={m.cy} r={3.5} fill={m.estimated ? "var(--plate)" : m.color} stroke={m.estimated ? m.color : "var(--plate)"} strokeWidth={1.5} />
              <text x={m.tx} y={m.ty} textAnchor="middle" className="tnum" fontSize={11} fill="var(--muted)" stroke="var(--plate)" strokeWidth={3.5} paintOrder="stroke">
                {m.text}
              </text>
            </g>
          ) : null,
        )}

        {/* Last value of each series on the value axis */}
        {tagged.map(({ l, p }, i) => {
          const dim = focusId !== null && focusId !== l.id;
          return (
            <g key={`tag-${l.id}`} opacity={dim ? 0.45 : 1} pointerEvents="none" clipPath={`url(#${revealId}-${l.id}-sweep)`}>
              <rect x={plotRight + 1.5} y={tagYs[i] - 8} width={axisW - 3} height={16} fill="var(--plate)" stroke={l.color} strokeWidth={1.25} strokeDasharray={l.dash ? "4 2" : undefined} />
              <text x={plotRight + 8} y={tagYs[i]} dy="0.32em" className="tnum" fontSize={11} fontWeight={focusId === l.id ? 600 : 500} fill="var(--fg)">
                {valueText(p.last!.value, l.digits)}
                {p.last!.estimated ? "e" : ""}
              </text>
            </g>
          );
        })}

        {/* Range being selected */}
        {band && bandPeriods ? (
          <g pointerEvents="none">
            <rect x={Math.min(band.x0, band.x1)} y={M.top} width={Math.abs(band.x1 - band.x0)} height={plotH} fill="var(--accent)" opacity={0.1} />
            <line x1={band.x0} x2={band.x0} y1={M.top} y2={plotBottom} stroke="var(--accent)" />
            <line x1={band.x1} x2={band.x1} y1={M.top} y2={plotBottom} stroke="var(--accent)" />
            <text x={clamp((band.x0 + band.x1) / 2, M.left + 70, plotRight - 70)} y={M.top - 6} textAnchor="middle" className="tnum" fontSize={11} fill="var(--fg)">
              {formatPeriod(bandPeriods[0])} to {formatPeriod(bandPeriods[1])}
            </text>
          </g>
        ) : null}

        {/* Crosshair, snapped to a published observation, with its date and value on the axes */}
        {cursorPeriod && !band ? (
          <g pointerEvents="none">
            <line x1={cx} x2={cx} y1={M.top} y2={plotBottom} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
            {activePoint ? (
              <line x1={M.left} x2={plotRight} y1={geo.y(activePoint.value)} y2={geo.y(activePoint.value)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
            ) : null}
            {lines.map((l, i) => {
              const o = geo.paths[i].byPeriod.get(cursorPeriod);
              if (!o) return null;
              return (
                <circle
                  key={`dot-${l.id}`}
                  cx={cx}
                  cy={geo.y(o.value)}
                  r={l.id === activeId ? 4 : 3.25}
                  fill={o.estimated ? "var(--plate)" : l.color}
                  stroke={o.estimated ? l.color : "var(--plate)"}
                  strokeWidth={1.5}
                  opacity={focusId !== null && focusId !== l.id ? 0.4 : 1}
                />
              );
            })}
            <g transform={`translate(${clamp(cx - dateTagW / 2, M.left, plotRight - dateTagW)},${plotBottom + 5})`}>
              <rect width={dateTagW} height={18} fill="var(--fg)" />
              <text x={dateTagW / 2} y={9} dy="0.34em" textAnchor="middle" className="tnum" fontSize={11} fill="var(--plate)">
                {dateTag}
              </text>
            </g>
            {activePoint && activeAt !== -1 ? (
              <g transform={`translate(${plotRight + 1},${clamp(geo.y(activePoint.value) - 9, M.top - 9, plotBottom - 9)})`}>
                <rect width={axisW - 2} height={18} fill="var(--fg)" />
                <text x={7} y={9} dy="0.34em" className="tnum" fontSize={11} fill="var(--plate)">
                  {valueText(activePoint.value, lines[activeAt].digits)}
                  {activePoint.estimated ? "e" : ""}
                </text>
              </g>
            ) : null}
          </g>
        ) : null}
      </svg>

      {/* Readout: floats beside the crosshair on a wide chart, sits under the plot on a narrow one. */}
      {compact ? (
        <div aria-hidden="true" className="border-t border-border px-3 py-2 text-xs leading-5">
          {readout}
        </div>
      ) : cursorPeriod && !band ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-2 z-10 w-80 border border-border-strong bg-plate px-3 py-2 text-xs leading-5"
          style={cx > M.left + plotW / 2 ? { right: width - cx + 14 } : { left: cx + 14 }}
        >
          {readout}
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
    </div>
  );
}
