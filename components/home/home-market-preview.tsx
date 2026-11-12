import Link from "next/link";
import { getMarketSeriesById, getObservations } from "@/lib/market-data";
import { addMonths, chooseIndexBase, formatNumber, formatPeriod, indexSeries, periodRange, valueDigits } from "@/lib/markets";
import { lineSegments, niceTicks } from "@/components/markets/chart-math";
import { slotStyle } from "@/components/markets/types";

/**
 * A static summary of the published /markets data, not a live quote feed. It runs on the server and reuses the
 * Market Monitor's index calculation, line geometry and line styles. The plot stretches to its frame, so the
 * axis labels are HTML placed by percentage and every stroke keeps its drawn width. The line reveal is the
 * shared CSS-only effect, which stays off under reduced motion.
 */
const FEATURED = [
  { id: "wb-copper", name: "Copper", slot: 0 },
  { id: "wb-nickel", name: "Nickel", slot: 1 },
  { id: "imf-cobalt", name: "Cobalt", slot: 2 },
] as const;

/** Plot coordinates. The SVG is stretched to its box, so these are proportions, not pixels. */
const W = 1000;
const H = 400;

function Unavailable({ message }: { message: string }) {
  return (
    <div>
      <h2 id="home-market-heading" className="font-display text-base font-semibold text-foreground">
        Mineral price trends
      </h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <Link href="/markets" className="research-button-secondary mt-5">
        Explore the Market Monitor
      </Link>
    </div>
  );
}

export function HomeMarketPreview() {
  const candidates = FEATURED.map((item) => {
    const meta = getMarketSeriesById(item.id);
    return { ...item, meta, observations: getObservations(item.id), breaks: meta?.sourceBreaks ?? [] };
  });
  const ends = candidates.map((item) => item.observations.at(-1)?.period).filter((p): p is string => Boolean(p));
  const end = ends.length === candidates.length ? ends.sort()[0] : null;
  if (!end) return <Unavailable message="The market chart is temporarily unavailable." />;

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
  if (!base || !lines.length) return <Unavailable message="A comparable period is unavailable for this selection." />;

  const periods = periodRange(base, end);
  const values = lines.flatMap((line) => line.values.map((point) => point.value));
  const ticks = niceTicks(Math.min(100, ...values), Math.max(100, ...values), 5);
  const min = ticks[0];
  const max = ticks[ticks.length - 1];
  const last = Math.max(1, periods.length - 1);
  const index = new Map(periods.map((p, i) => [p, i]));
  const x = (period: string) => ((index.get(period) ?? 0) / last) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const pctY = (v: number) => `${(y(v) / H) * 100}%`;
  const xLabels = [base, periods[Math.floor(last / 2)], end];

  return (
    <figure
      aria-labelledby="home-market-heading"
      className="m-0 grid min-w-0 gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:grid-rows-[auto_1fr]"
    >
      <div>
        <h2 id="home-market-heading" className="font-display text-base font-semibold text-foreground">
          Mineral price trends
        </h2>
        <p className="mt-2 font-display text-sm leading-6 text-muted">
          Monthly averages, indexed to 100 at {formatPeriod(base, true)}. 36-month view.
        </p>
      </div>

      <div className="min-w-0 border border-border-strong bg-plate lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="relative mt-5 mr-12 ml-3 h-56 sm:h-72 lg:h-[23rem]">
          <svg
            role="img"
            aria-labelledby="home-market-svg-title home-market-svg-description"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <title id="home-market-svg-title">Copper, nickel and cobalt indexed monthly prices</title>
            <desc id="home-market-svg-description">
              World Bank copper and nickel, and IMF cobalt monthly averages, each rebased to 100 at {formatPeriod(base)},
              through {formatPeriod(end)}. The chart is a historical comparison, not live prices.
            </desc>
            <defs>
              {lines.map((line, i) => (
                <clipPath key={line.id} id={`home-market-reveal-${line.id}`} clipPathUnits="userSpaceOnUse">
                  <rect
                    x={-10}
                    y={-10}
                    width={W + 20}
                    height={H + 20}
                    className="market-line-reveal"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                </clipPath>
              ))}
            </defs>

            {ticks.map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={W}
                y1={y(tick)}
                y2={y(tick)}
                stroke={tick === 100 || tick === min ? "var(--border-strong)" : "var(--border)"}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {lines.map((line) => (
              <g key={line.id} clipPath={`url(#home-market-reveal-${line.id})`}>
                {lineSegments(line.values, periods, line.breaks, x, y).segments.map((segment, n) => (
                  <path
                    key={n}
                    d={segment.d}
                    stroke={line.color}
                    strokeWidth={1.5}
                    strokeLinejoin="miter"
                    strokeLinecap="butt"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            ))}
          </svg>
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden="true"
              className="tnum absolute left-full -translate-y-1/2 pl-2 font-display text-[0.6875rem] leading-none text-faint"
              style={{ top: pctY(tick) }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="tnum mr-12 ml-3 flex justify-between pt-1.5 pb-2.5 font-display text-[0.6875rem] leading-4 text-faint">
          {xLabels.map((period) => (
            <span key={period}>{formatPeriod(period)}</span>
          ))}
        </div>
      </div>

      <div className="min-w-0 self-end">
        <table className="w-full border-t border-border-strong text-left font-display text-sm">
          <caption className="sr-only">
            Index value and published monthly average of each plotted metal in {formatPeriod(end, true)}
          </caption>
          <thead className="text-xs text-faint">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3 font-normal">
                {formatPeriod(end)}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">
                Index
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                Published
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const indexed = line.values.at(-1);
              const published = line.observations.find((o) => o.period === end);
              return (
                <tr key={line.id} className="border-b border-border">
                  <th scope="row" className="py-2.5 pr-3 font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <svg width="16" height="8" aria-hidden="true" className="shrink-0">
                        <line x1="0" x2="16" y1="4" y2="4" stroke={line.color} strokeWidth="2" />
                      </svg>
                      {line.name}
                    </span>
                  </th>
                  <td className="tnum py-2.5 pr-3 text-right text-foreground">
                    {indexed && indexed.period === end ? formatNumber(indexed.value, 1) : "n/a"}
                  </td>
                  <td className="tnum py-2.5 text-right whitespace-nowrap text-muted">
                    {published ? `${formatNumber(published.value, valueDigits(line.observations))} ${line.meta?.unitShort ?? ""}` : "n/a"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <figcaption className="mt-3 font-display text-xs leading-5 text-faint">
          World Bank Pink Sheet and IMF PCPS, monthly averages through {formatPeriod(end, true)}.
        </figcaption>
        <Link href="/markets" className="research-button-secondary mt-5">
          Explore the Market Monitor
        </Link>
      </div>
    </figure>
  );
}
