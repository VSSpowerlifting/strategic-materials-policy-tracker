import Link from "next/link";
import { getMarketSeriesById, getObservations } from "@/lib/market-data";
import { addMonths, chooseIndexBase, formatPeriod, indexSeries, periodsBetween } from "@/lib/markets";
import { slotStyle } from "@/components/markets/types";

/**
 * A small, static summary of the published /markets data, not a live quote feed.
 * Runs on the server and reuses the market monitor's exact index calculation.
 * The same CSS-only reveal effect as the full monitor respects reduced motion.
 */
const FEATURED = [
  { id: "wb-copper", name: "Copper", slot: 0 },
  { id: "wb-nickel", name: "Nickel", slot: 1 },
  { id: "imf-cobalt", name: "Cobalt", slot: 2 },
] as const;

const CHART = {
  width: 500,
  height: 236,
  left: 37,
  right: 485,
  top: 14,
  bottom: 207,
} as const;

function axisStep(span: number): number {
  if (span > 140) return 50;
  if (span > 65) return 25;
  return span > 30 ? 10 : 5;
}

export function HomeMarketPreview() {
  const candidates = FEATURED.map((item) => ({
    ...item,
    observations: getObservations(item.id),
    breaks: getMarketSeriesById(item.id)?.sourceBreaks ?? [],
  }));
  const ends = candidates.map((item) => item.observations.at(-1)?.period).filter((p): p is string => Boolean(p));
  const end = ends.length === candidates.length ? ends.sort()[0] : null;

  if (!end) {
    return (
      <div>
        <h2 className="font-display text-lg font-semibold">Mineral price trends</h2>
        <p className="mt-2 text-sm text-muted">The market chart is temporarily unavailable.</p>
        <Link href="/markets" className="research-button-secondary mt-5">Explore the Market Monitor</Link>
      </div>
    );
  }

  const start = addMonths(end, -36);
  const comparison = chooseIndexBase(
    candidates.map((item) => ({ id: item.id, obs: item.observations, breaks: item.breaks })),
    start,
    end,
  );
  const base = comparison.basePeriod;
  const lines = base
    ? candidates
        .filter((item) => comparison.included.includes(item.id))
        .map((item) => ({
          ...item,
          color: slotStyle(item.slot).color,
          values: indexSeries(item.observations, base, start, end),
        }))
    : [];

  if (!base || !lines.length) {
    return (
      <div>
        <h2 className="font-display text-lg font-semibold">Mineral price trends</h2>
        <p className="mt-2 text-sm text-muted">A comparable period is unavailable for this selection.</p>
        <Link href="/markets" className="research-button-secondary mt-5">Explore the Market Monitor</Link>
      </div>
    );
  }

  const values = lines.flatMap((line) => line.values.map((point) => point.value));
  const rawMin = Math.min(100, ...values);
  const rawMax = Math.max(100, ...values);
  const step = axisStep(rawMax - rawMin);
  const min = Math.floor(rawMin / step) * step;
  const max = Math.max(min + step, Math.ceil(rawMax / step) * step);
  const totalMonths = Math.max(1, periodsBetween(base, end));
  const x = (period: string) =>
    CHART.left + (periodsBetween(base, period) / totalMonths) * (CHART.right - CHART.left);
  const y = (v: number) =>
    CHART.bottom - ((v - min) / (max - min)) * (CHART.bottom - CHART.top);
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  const middle = addMonths(base, Math.floor(totalMonths / 2));
  const xLabels = [base, middle, end];

  return (
    <figure aria-labelledby="home-market-heading" className="m-0 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="home-market-heading" className="font-display text-lg font-semibold text-foreground">
          Mineral price trends
        </h2>
        <span className="font-display text-xs text-faint">36-month view</span>
      </div>
      <p className="mt-1 font-display text-xs text-muted">
        Monthly benchmarks · indexed to 100 at {formatPeriod(base)}
      </p>

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card/60 px-2 pt-3 pb-1 sm:px-3">
        <svg
          role="img"
          aria-labelledby="home-market-svg-title home-market-svg-description"
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="block h-auto w-full"
        >
          <title id="home-market-svg-title">Copper, nickel and cobalt indexed monthly prices</title>
          <desc id="home-market-svg-description">
            World Bank copper and nickel, and IMF cobalt monthly averages, each rebased to 100 at {formatPeriod(base)},
            through {formatPeriod(end)}. The chart is a historical comparison, not live prices.
          </desc>
          <defs>
            {lines.map((line, index) => (
              <clipPath key={line.id} id={`home-market-reveal-${line.id}`} clipPathUnits="userSpaceOnUse">
                <rect
                  x={0}
                  y={0}
                  width={CHART.width}
                  height={CHART.height}
                  className="market-line-reveal"
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              </clipPath>
            ))}
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={CHART.left}
                x2={CHART.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={tick === 100 ? "var(--border-strong)" : "var(--border)"}
                strokeWidth={tick === 100 ? 1.2 : 0.8}
                strokeDasharray={tick === 100 ? "3 4" : undefined}
              />
              <text
                x={CHART.left - 10}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="central"
                fill="var(--faint)"
                fontSize={11}
                fontVariant="tabular-nums"
              >
                {tick}
              </text>
            </g>
          ))}

          {xLabels.map((period, i) => (
            <text
              key={period}
              x={x(period)}
              y={CHART.height - 10}
              textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
              fill="var(--faint)"
              fontSize={11}
            >
              {formatPeriod(period)}
            </text>
          ))}

          {lines.map((line) => {
            const path = line.values
              .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.period).toFixed(1)},${y(p.value).toFixed(1)}`)
              .join(" ");
            const last = line.values.at(-1);
            return (
              <g key={line.id} clipPath={`url(#home-market-reveal-${line.id})`}>
                <path
                  d={path}
                  stroke={line.color}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {last ? (
                  <circle cx={x(last.period)} cy={y(last.value)} r={3.2} fill={line.color} stroke="var(--surface)" strokeWidth={1.2} />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <ul aria-label="Plotted metals" className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-2 font-display text-xs text-foreground">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ backgroundColor: line.color }} />
            {line.name}
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 font-display text-xs leading-5 text-muted">
        World Bank Pink Sheet and IMF PCPS · monthly averages through {formatPeriod(end)}
      </figcaption>

      <Link
        href="/markets"
        className="research-button-secondary mt-5 flex w-full items-center justify-between gap-3 transition-colors"
      >
        Explore the Market Monitor
        <span aria-hidden="true" className="text-accent">↗</span>
      </Link>
    </figure>
  );
}
