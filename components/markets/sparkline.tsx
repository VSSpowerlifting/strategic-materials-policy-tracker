import type { Observation, SourceBreak } from "@/lib/markets";
import { formatNumber, formatPeriod } from "@/lib/markets";
import { lineSegments } from "./chart-math";

/**
 * A small line of published observations, straight between consecutive periods. A missing period or a stated
 * source change breaks the line; nothing is interpolated. Pass the periods the line should span so a gap at
 * either end shows as space instead of being trimmed.
 */
export function Sparkline({
  points,
  periods,
  breaks = [],
  color,
  dash,
  unit,
  width = 128,
  height = 36,
}: {
  points: readonly Observation[];
  periods: readonly string[];
  breaks?: readonly SourceBreak[];
  color: string;
  dash?: string;
  unit: string;
  width?: number;
  height?: number;
}) {
  if (points.length === 0 || periods.length < 2) return null;
  const pad = 4;
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const index = new Map(periods.map((p, i) => [p, i]));
  const x = (p: string) => pad + ((index.get(p) ?? 0) / (periods.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo || 1)) * (height - pad * 2);
  const { segments, singles } = lineSegments(points, periods, breaks, x, y);

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend from ${formatNumber(first.value)} in ${formatPeriod(first.period)} to ${formatNumber(last.value)} in ${formatPeriod(last.period)}, ${unit}.`}
      className="block shrink-0"
    >
      {segments.map((s) => (
        <path key={s.d} d={s.d} fill="none" stroke={color} strokeWidth={1.25} strokeDasharray={s.estimated ? "2 3" : dash} strokeLinejoin="miter" strokeMiterlimit={2} />
      ))}
      {singles.map((s) => (
        <circle key={s.period} cx={s.cx} cy={s.cy} r={1.75} fill={s.estimated ? "var(--plate)" : color} stroke={color} strokeWidth={1} />
      ))}
      {index.has(last.period) ? (
        <circle cx={x(last.period)} cy={y(last.value)} r={2.5} fill={last.estimated ? "var(--plate)" : color} stroke={last.estimated ? color : "var(--plate)"} strokeWidth={1.25} />
      ) : null}
    </svg>
  );
}
