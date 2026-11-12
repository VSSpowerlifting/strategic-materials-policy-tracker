import type { Frequency, Observation, SourceBreak } from "@/lib/markets";
import { RANGES, addPeriods, isValidPeriod } from "@/lib/markets";

/**
 * Pure geometry and window arithmetic for the market chart. Nothing here invents a value: every function
 * either positions a published observation or moves the visible window over the published periods.
 */

export interface Segment {
  d: string;
  estimated: boolean;
}

export interface SinglePoint {
  cx: number;
  cy: number;
  estimated: boolean;
  period: string;
}

/**
 * Split a line into drawable pieces. Consecutive observations are joined by one straight step; a missing
 * period or a stated source break ends the piece. A step touching an estimated value is drawn separately
 * so it can be dotted. Observations joined to nothing come back as `singles`, to be drawn as points.
 */
export function lineSegments(
  points: readonly Observation[],
  periods: readonly string[],
  breaks: readonly SourceBreak[],
  x: (p: string) => number,
  y: (v: number) => number,
): { segments: Segment[]; singles: SinglePoint[] } {
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

/**
 * Periods inside a series' own span (first to last observation in view) that hold no value. Time before a
 * series starts or after it ends is not a gap in it; the line is simply absent there.
 */
export function interiorGaps(points: readonly Observation[], periods: readonly string[]): string[] {
  if (points.length < 2) return [];
  const have = new Set(points.map((o) => o.period));
  const first = points[0].period;
  const last = points[points.length - 1].period;
  return periods.filter((p) => p > first && p < last && !have.has(p));
}

/** Round, evenly spaced ticks covering [min, max]. */
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

const LOG_MANTISSAS: readonly (readonly number[])[] = [[1], [1, 3], [1, 2, 5], [1, 1.5, 2, 3, 4, 5, 7]];

/**
 * Ticks for a logarithmic axis over [min, max] (both > 0). Uses 1-2-5 style values where the range spans
 * enough of a decade; over a narrow range it falls back to round linear values, which are still placed at
 * their logarithmic positions.
 */
export function logTicks(min: number, max: number, target = 5): number[] {
  if (!(min > 0) || !(max > min)) return [];
  const lo = Math.floor(Math.log10(min));
  const hi = Math.ceil(Math.log10(max));
  let best: number[] = [];
  for (const set of LOG_MANTISSAS) {
    const ticks: number[] = [];
    for (let k = lo; k <= hi; k++) {
      for (const m of set) {
        const v = Number((m * 10 ** k).toPrecision(12));
        if (v >= min && v <= max) ticks.push(v);
      }
    }
    if (ticks.length > target + 2) break;
    best = ticks;
    if (ticks.length >= target) break;
  }
  if (best.length >= 3) return best;
  return niceTicks(min, max, target).filter((v) => v >= min && v <= max);
}

export type ScaleKind = "linear" | "log";

export interface YScale {
  /** The scale actually used. A log scale is refused (falls back to linear) if any value is not positive. */
  kind: ScaleKind;
  min: number;
  max: number;
  ticks: number[];
  /** Position of a value from 0 (bottom of the plot) to 1 (top). */
  at: (v: number) => number;
}

/** The value axis for a set of plotted values. Positions are exact; only the domain is padded. */
export function buildYScale(values: readonly number[], kind: ScaleKind, target = 5): YScale {
  const finite = values.filter((v) => Number.isFinite(v));
  const lo = finite.length ? Math.min(...finite) : 0;
  const hi = finite.length ? Math.max(...finite) : 1;
  if (kind === "log" && lo > 0) {
    const f = hi > lo ? (hi / lo) ** 0.06 : 1.05;
    const min = lo / f;
    const max = hi * f;
    const span = Math.log(max) - Math.log(min);
    return { kind: "log", min, max, ticks: logTicks(min, max, target), at: (v) => (Math.log(v) - Math.log(min)) / span };
  }
  const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.05 || 1;
  const floor = lo >= 0 ? Math.max(0, lo - pad) : lo - pad;
  // The domain fits the plotted values; round ticks fall inside it and need not sit on its edges.
  const min = floor;
  const max = hi + pad;
  const ticks = niceTicks(min, max, target).filter((v) => v >= min && v <= max);
  return { kind: "linear", min, max, ticks, at: (v) => (v - min) / (max - min || 1) };
}

export interface Extreme {
  kind: "high" | "low";
  period: string;
  value: number;
  estimated: boolean;
}

/**
 * The highest and lowest observation among the points in view (the first of each if tied). Returns nothing
 * for fewer than three points or a flat series, where a high and a low say nothing.
 */
export function seriesExtremes(points: readonly Observation[]): Extreme[] {
  if (points.length < 3) return [];
  let high = points[0];
  let low = points[0];
  for (const o of points) {
    if (o.value > high.value) high = o;
    if (o.value < low.value) low = o;
  }
  if (high.value === low.value) return [];
  return [
    { kind: "high", period: high.period, value: high.value, estimated: Boolean(high.estimated) },
    { kind: "low", period: low.period, value: low.value, estimated: Boolean(low.estimated) },
  ];
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Greedy label placement: keep each box, in order, unless it overlaps one already kept. */
export function keepNonOverlapping(boxes: readonly Box[], pad = 2): boolean[] {
  const kept: Box[] = [];
  return boxes.map((b) => {
    const hit = kept.some((k) => b.x < k.x + k.w + pad && k.x < b.x + b.w + pad && b.y < k.y + k.h + pad && k.y < b.y + b.h + pad);
    if (!hit) kept.push(b);
    return !hit;
  });
}

/** Spread label y-positions so no two are closer than `gap`, keeping order. */
export function spreadLabels(ys: readonly number[], gap: number, lo: number, hi: number): number[] {
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

/** Month number on a continuous scale, for calendar-aligned monthly ticks. */
function monthIndex(p: string): number {
  return Number(p.slice(0, 4)) * 12 + Number(p.slice(5, 7)) - 1;
}

const X_STEPS = [1, 2, 3, 6, 12, 24, 36, 60, 120];

/**
 * Time-axis ticks. Annual data gets one tick per year (thinned only when they cannot fit); monthly data
 * gets the smallest calendar-aligned step that fits `maxLabels`.
 */
export function timeTicks(periods: readonly string[], frequency: Frequency, maxLabels: number): { ticks: string[]; yearOnly: boolean } {
  const max = Math.max(2, maxLabels);
  if (frequency === "annual") {
    const step = Math.max(1, Math.ceil(periods.length / max));
    return { ticks: periods.filter((_, i) => i % step === 0), yearOnly: true };
  }
  const step = X_STEPS.find((s) => periods.length / s <= max) ?? 120;
  return { ticks: periods.filter((p) => monthIndex(p) % step === 0), yearOnly: step >= 12 };
}

// ── Visible window ──────────────────────────────────────────────────────────
/** A window over a list of n periods, as inclusive indices. */
export interface IndexWindow {
  from: number;
  to: number;
}

/** Fewest steps a window may span: a line needs two observations. */
export const MIN_WINDOW_STEPS = 1;

export function clampWindow(w: IndexWindow, n: number, minSteps = MIN_WINDOW_STEPS): IndexWindow {
  const last = Math.max(0, n - 1);
  const steps = Math.min(last, Math.max(minSteps, Math.round(w.to - w.from)));
  const from = Math.min(Math.max(0, Math.round(w.from)), last - steps);
  return { from, to: from + steps };
}

/**
 * Zoom by `factor` (below 1 zooms in) keeping the period at `anchor` at the same relative position. A call
 * that can move always moves by at least one step, so a button press is never a no-op mid-range.
 */
export function zoomWindow(w: IndexWindow, factor: number, anchor: number, n: number, minSteps = MIN_WINDOW_STEPS): IndexWindow {
  const last = Math.max(0, n - 1);
  const steps = w.to - w.from;
  let next = Math.round(steps * factor);
  if (factor < 1 && next >= steps) next = steps - 1;
  if (factor > 1 && next <= steps) next = steps + 1;
  next = Math.min(last, Math.max(minSteps, next));
  const a = Math.min(w.to, Math.max(w.from, anchor));
  const frac = steps > 0 ? (a - w.from) / steps : 0.5;
  return clampWindow({ from: Math.round(a - frac * next), to: Math.round(a - frac * next) + next }, n, minSteps);
}

/** Shift the window by `delta` periods, stopping at either end of the published range. */
export function panWindow(w: IndexWindow, delta: number, n: number): IndexWindow {
  const d = Math.min(Math.max(Math.round(delta), -w.from), Math.max(0, n - 1 - w.to));
  return { from: w.from + d, to: w.to + d };
}

export interface PeriodWindow {
  from: string;
  to: string;
}

/** A custom window from URL or input text: two well-formed periods of the tab's frequency, in order. */
export function parsePeriodWindow(from: unknown, to: unknown, frequency: Frequency): PeriodWindow | null {
  if (!isValidPeriod(from, frequency) || !isValidPeriod(to, frequency)) return null;
  return from < to ? { from, to } : null;
}

/** Clip a custom window to the published range [earliest, end]; null if nothing drawable is left. */
export function resolvePeriodWindow(w: PeriodWindow | null, earliest: string, end: string): PeriodWindow | null {
  if (!w || !earliest || !end) return null;
  const from = w.from < earliest ? earliest : w.from;
  const to = w.to > end ? end : w.to;
  return from < to ? { from, to } : null;
}

/** The preset a window coincides with (so a zoom that lands on "5Y" reads as 5Y), or null. */
export function matchPreset(frequency: Frequency, w: PeriodWindow, earliest: string, end: string): string | null {
  if (w.to !== end) return null;
  for (const r of RANGES[frequency]) {
    if (r.periods === null) continue;
    if (addPeriods(end, -r.periods) === w.from && w.from >= earliest) return r.id;
  }
  return w.from === earliest && RANGES[frequency].some((r) => r.periods === null) ? RANGES[frequency].find((r) => r.periods === null)!.id : null;
}

/**
 * The series a crosshair reads on the value axis: the emphasised one when it has an observation at the
 * period, otherwise the plotted observation nearest the pointer, otherwise the first. `candidates` holds
 * only series with a published value at the period, so the crosshair never rests on an empty position.
 */
export function pickActive(
  candidates: readonly { id: string; y: number }[],
  pointerY: number | null,
  preferred: string | null,
): string | null {
  if (candidates.length === 0) return null;
  if (preferred && candidates.some((c) => c.id === preferred)) return preferred;
  if (pointerY === null) return candidates[0].id;
  let best = candidates[0];
  for (const c of candidates) if (Math.abs(c.y - pointerY) < Math.abs(best.y - pointerY)) best = c;
  return best.id;
}
