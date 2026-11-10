import type { Observation } from "@/lib/markets";
import { formatNumber, formatPeriod } from "@/lib/markets";

/**
 * A small line of real observations. Gaps break the line; nothing is
 * interpolated. Pass the months the line should span so a gap at either end
 * is visible as space rather than silently trimmed.
 */
export function Sparkline({
  points,
  periods,
  color,
  dash,
  unit,
  width = 128,
  height = 36,
}: {
  points: readonly Observation[];
  periods: readonly string[];
  color: string;
  dash?: string;
  unit: string;
  width?: number;
  height?: number;
}) {
  if (points.length === 0 || periods.length < 2) return null;
  const pad = 5;
  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i: number) => pad + (i / (periods.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo || 1)) * (height - pad * 2);
  const byPeriod = new Map(points.map((p) => [p.period, p.value]));

  const segments: string[] = [];
  let current: string[] = [];
  periods.forEach((p, i) => {
    const v = byPeriod.get(p);
    if (v === undefined) {
      if (current.length > 1) segments.push("M" + current.join("L"));
      current = [];
    } else {
      current.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    }
  });
  if (current.length > 1) segments.push("M" + current.join("L"));

  const first = points[0];
  const last = points[points.length - 1];
  const lastIdx = periods.indexOf(last.period);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend from ${formatNumber(first.value)} in ${formatPeriod(first.period)} to ${formatNumber(last.value)} in ${formatPeriod(last.period)}, ${unit}.`}
      className="block shrink-0"
    >
      <path d={segments.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round" />
      {lastIdx !== -1 ? (
        <circle cx={x(lastIdx)} cy={y(last.value)} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />
      ) : null}
    </svg>
  );
}
