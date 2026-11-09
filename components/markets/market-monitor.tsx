"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  RANGES,
  addMonths,
  changeOver,
  chooseIndexBase,
  formatNumber,
  formatPct,
  formatPeriod,
  indexSeries,
  isRangeId,
  isStale,
  latestObservation,
  monthlyChangeGrid,
  monthsBetween,
  periodRange,
  rangeWindow,
  rankMovers,
  supportedRanges,
  unitsCompatible,
  valueAt,
  windowObservations,
  type RangeId,
} from "@/lib/markets";
import { PriceChart, type ChartLine } from "./price-chart";
import { Sparkline } from "./sparkline";
import { Heatmap, type HeatRow } from "./heatmap";
import { seriesStyle, type MonitorSeries } from "./types";

export interface MonitorGap {
  materialId: string;
  materialName: string;
  materialHref: string | null;
  worldBankCoverage: string;
  gradeDistinctions: string;
  requirementForInclusion: string;
}

type View = "indexed" | "absolute";

const DEFAULT_RANGE: RangeId = "12m";
const DEFAULT_VIEW: View = "indexed";
const HEAT_MONTHS = 24;

const pill =
  "min-h-11 rounded-md border px-3 font-display text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-accent motion-safe:transition-colors sm:min-h-9";
const pillOn = "border-accent bg-elevated text-foreground";
const pillOff = "border-border-strong bg-card text-muted hover:text-foreground";

function Swatch({ color, dash }: { color: string; dash: string | undefined }) {
  return (
    <svg width="20" height="8" aria-hidden="true" className="shrink-0">
      <line x1="0" x2="20" y1="4" y2="4" stroke={color} strokeWidth="2.5" strokeDasharray={dash} />
    </svg>
  );
}

export function MarketMonitor({
  series,
  gaps,
  cutoff,
  nextReleaseDate,
}: {
  series: MonitorSeries[];
  gaps: MonitorGap[];
  /** Last month of the frozen dataset ("YYYY-MM"). */
  cutoff: string;
  /** The publisher's stated next release date ("YYYY-MM-DD"). */
  nextReleaseDate: string;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [range, setRange] = useState<RangeId>(DEFAULT_RANGE);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [cursor, setCursor] = useState<string | null>(null);
  const [releasePassed, setReleasePassed] = useState(false);
  const urlRead = useRef(false);

  const ids = useMemo(() => new Set(series.map((s) => s.id)), [series]);
  const byId = useMemo(() => new Map(series.map((s) => [s.id, s])), [series]);
  const earliest = useMemo(() => series.map((s) => s.firstPeriod).sort()[0] ?? cutoff, [series, cutoff]);
  const ranges = useMemo(() => supportedRanges(earliest, cutoff), [earliest, cutoff]);
  const absoluteAllowed = unitsCompatible(series);

  // Read the URL once after mount, so the prerendered HTML is always the default view.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get("series");
    const r = q.get("range");
    const v = q.get("view");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    if (s && ids.has(s)) setFocusId(s);
    if (isRangeId(r) && ranges.includes(r)) setRange(r);
    if (v === "absolute" && absoluteAllowed) setView("absolute");
    setReleasePassed(new Date().toISOString().slice(0, 10) > nextReleaseDate);
    /* eslint-enable react-hooks/set-state-in-effect */
    urlRead.current = true;
  }, [ids, ranges, absoluteAllowed, nextReleaseDate]);

  // Mirror the view into the URL so it can be shared; defaults are left out.
  useEffect(() => {
    if (!urlRead.current) return;
    const q = new URLSearchParams(window.location.search);
    const set = (k: string, v: string | null) => (v ? q.set(k, v) : q.delete(k));
    set("series", focusId);
    set("range", range === DEFAULT_RANGE ? null : range);
    set("view", view === DEFAULT_VIEW ? null : view);
    const qs = q.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [focusId, range, view]);

  const effectiveView: View = view === "absolute" && absoluteAllowed ? "absolute" : "indexed";
  const win = rangeWindow(range, cutoff, earliest);
  const periods = useMemo(() => periodRange(win.start, win.end), [win.start, win.end]);
  const base = useMemo(() => chooseIndexBase(series, win.start, win.end), [series, win.start, win.end]);

  const lines: ChartLine[] = useMemo(() => {
    const shown = effectiveView === "indexed" ? base.included : series.map((s) => s.id);
    return shown.map((id) => {
      const s = byId.get(id)!;
      const st = seriesStyle(id);
      const points =
        effectiveView === "indexed" && base.basePeriod
          ? indexSeries(s.obs, base.basePeriod, win.start, win.end)
          : windowObservations(s.obs, win.start, win.end);
      return { id, label: s.label, color: st.color, dash: st.dash, points };
    });
  }, [effectiveView, base, series, byId, win.start, win.end]);

  const emphasis = hoverId ?? focusId;
  const readoutPeriod = cursor && periods.includes(cursor) ? cursor : win.end;
  const unit = series[0]?.unit ?? "";
  const rangeLabel = RANGES.find((r) => r.id === range)?.label ?? range;

  const chartTitle =
    effectiveView === "indexed"
      ? base.basePeriod
        ? `Indexed change, ${formatPeriod(win.start)}–${formatPeriod(win.end)} (${formatPeriod(base.basePeriod)} = 100)`
        : `Indexed change, ${formatPeriod(win.start)}–${formatPeriod(win.end)}`
      : `Monthly benchmark average, ${formatPeriod(win.start)}–${formatPeriod(win.end)} (${unit})`;

  const moverMonths = monthsBetween(win.start, win.end);
  const movers = useMemo(() => rankMovers(series, moverMonths, win.end), [series, moverMonths, win.end]);
  const moverMax = Math.max(1e-9, ...movers.ranked.map((m) => Math.abs(m.change.pct)));

  const heatPeriods = useMemo(() => periods.slice(1).slice(-HEAT_MONTHS), [periods]);
  const heatRows: HeatRow[] = useMemo(
    () =>
      series.map((s) => {
        const st = seriesStyle(s.id);
        return { id: s.id, label: s.label, color: st.color, dash: st.dash, unit: s.unit, cells: monthlyChangeGrid(s.obs, heatPeriods) };
      }),
    [series, heatPeriods],
  );

  const tablePeriods = useMemo(() => [...periods].reverse(), [periods]);

  function toggleFocus(id: string) {
    setFocusId((cur) => (cur === id ? null : id));
  }

  if (series.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-sm text-muted">
        No verified price series is available. The monitor shows nothing rather than an estimate.
      </div>
    );
  }

  return (
    <div className="space-y-14">
      {releasePassed ? (
        <p role="status" className="rounded-md border border-border-strong bg-elevated px-4 py-3 text-sm text-foreground">
          The World Bank’s next scheduled release date ({nextReleaseDate}) has passed. A newer release may exist; this page
          still shows the frozen dataset through {formatPeriod(cutoff, true)}.
        </p>
      ) : null}

      {/* ── Chart ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="mm-chart-title" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-strong pb-3">
          <div>
            <h2 id="mm-chart-title" className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
              {chartTitle}
            </h2>
            <p className="mt-1.5 max-w-3xl text-[0.9375rem] leading-7 text-muted">
              {effectiveView === "indexed"
                ? base.basePeriod
                  ? `Each series is divided by its own ${formatPeriod(base.basePeriod, true)} value and multiplied by 100, so the lines compare percentage paths, not price levels.`
                  : base.explanation
                : "Nominal US dollars per metric tonne on one axis. All three series share the same currency and unit."}
              {win.truncated ? ` The data begin in ${formatPeriod(earliest, true)}, so this window is shorter than ${rangeLabel}.` : ""}
            </p>
            {effectiveView === "indexed" && base.excluded.length ? (
              <ul className="mt-2 text-sm text-muted">
                {base.excluded.map((e) => (
                  <li key={e.id}>
                    {byId.get(e.id)?.label ?? e.id} not shown: {e.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div role="group" aria-label="Time range" className="flex flex-wrap gap-1.5">
            {RANGES.filter((r) => ranges.includes(r.id)).map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
                className={cn(pill, range === r.id ? pillOn : pillOff)}
              >
                {r.label}
              </button>
            ))}
          </div>
          {absoluteAllowed ? (
            <div role="group" aria-label="Scale" className="flex flex-wrap gap-1.5">
              {(
                [
                  ["indexed", "Indexed"],
                  ["absolute", "US$/t"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={effectiveView === v}
                  onClick={() => setView(v)}
                  className={cn(pill, effectiveView === v ? pillOn : pillOff)}
                >
                  {l}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div role="group" aria-label="Series legend. Select a series to emphasise it." className="mt-4 flex flex-wrap gap-1.5">
          {series.map((s) => {
            const st = seriesStyle(s.id);
            const on = focusId === s.id;
            const plotted = lines.some((l) => l.id === s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleFocus(s.id)}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
                className={cn(pill, "inline-flex items-center gap-2", on ? pillOn : pillOff)}
              >
                <Swatch color={st.color} dash={st.dash} />
                {s.label}
                {plotted ? null : <span className="text-faint">(not plotted)</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-md border border-border bg-card p-2 sm:p-3">
          {lines.length && (effectiveView === "absolute" || base.basePeriod) ? (
            <PriceChart
              lines={lines}
              periods={periods}
              mode={effectiveView}
              basePeriod={effectiveView === "indexed" ? base.basePeriod : null}
              cursor={cursor}
              onCursor={setCursor}
              focusId={emphasis}
              onFocus={setFocusId}
              label={chartTitle}
            />
          ) : (
            <p className="p-6 text-sm text-muted">{base.explanation ?? "No observations fall inside this window."}</p>
          )}
        </div>

        <div aria-live="polite" className="mt-3 rounded-md border border-border bg-card px-4 py-3">
          <p className="font-display text-xs text-faint">
            {cursor && periods.includes(cursor) ? "At cursor" : "Last month in window"} · {formatPeriod(readoutPeriod, true)}
          </p>
          <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            {series.map((s) => {
              const st = seriesStyle(s.id);
              const abs = valueAt(s.obs, readoutPeriod);
              const idx =
                effectiveView === "indexed" && base.basePeriod && base.included.includes(s.id)
                  ? (() => {
                      const b = valueAt(s.obs, base.basePeriod!);
                      return abs !== null && b ? (abs / b) * 100 : null;
                    })()
                  : null;
              return (
                <div key={s.id} className="flex items-baseline gap-2">
                  <dt className="inline-flex items-center gap-2 text-muted">
                    <Swatch color={st.color} dash={st.dash} />
                    {s.label}
                  </dt>
                  <dd className="tnum text-foreground">
                    {abs === null ? (
                      <span className="text-faint">no observation</span>
                    ) : (
                      <>
                        {formatNumber(abs)}
                        {idx !== null ? <span className="text-muted"> · {idx.toFixed(1)}</span> : null}
                      </>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-2 text-xs text-faint">
            US$ per metric tonne{effectiveView === "indexed" && base.basePeriod ? `, then index (${formatPeriod(base.basePeriod)} = 100)` : ""}.
            Hover the chart, or focus it and use the arrow keys.
          </p>
        </div>
      </section>

      {/* ── Benchmark cards ───────────────────────────────────────────── */}
      <section aria-labelledby="mm-cards-title" className="scroll-mt-24">
        <div className="mb-5 border-b border-border-strong pb-3">
          <h2 id="mm-cards-title" className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
            Benchmarks
          </h2>
          <p className="mt-1.5 max-w-3xl text-[0.9375rem] leading-7 text-muted">
            Last available observation for each series. Changes compare monthly averages; select a card to emphasise its line.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {series.map((s) => {
            const st = seriesStyle(s.id);
            const latest = latestObservation(s.obs);
            const m1 = changeOver(s.obs, 1);
            const m3 = changeOver(s.obs, 3);
            const stale = latest ? isStale(latest.period, cutoff) : true;
            const sparkPeriods = latest ? periodRange(addMonths(latest.period, -12), latest.period) : [];
            const sparkPoints = latest ? windowObservations(s.obs, sparkPeriods[0], latest.period) : [];
            const on = focusId === s.id;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex flex-col rounded-md border bg-card motion-safe:transition-colors",
                  on ? "border-accent" : "border-border",
                )}
              >
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleFocus(s.id)}
                  onMouseEnter={() => setHoverId(s.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="flex flex-1 flex-col gap-3 rounded-t-md p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-display text-base font-semibold text-foreground">
                      <Swatch color={st.color} dash={st.dash} />
                      {s.materialName}
                    </span>
                    <span className="font-display text-xs text-faint">{on ? "Emphasised" : "Emphasise"}</span>
                  </span>
                  <span className="text-sm text-muted">{s.benchmark}</span>
                  {latest ? (
                    <>
                      <span className="flex items-end justify-between gap-3">
                        <span>
                          <span className="tnum block font-display text-2xl font-semibold text-foreground">
                            {formatNumber(latest.value)}
                          </span>
                          <span className="block text-xs text-muted">{s.unit}</span>
                        </span>
                        <Sparkline points={sparkPoints} periods={sparkPeriods} color={st.color} dash={st.dash} unit={s.unit} />
                      </span>
                      <span className="grid grid-cols-2 gap-2 text-sm">
                        <span>
                          <span className="block font-display text-xs text-faint">1M</span>
                          <span className="tnum text-foreground">{formatPct(m1?.pct)}</span>
                        </span>
                        <span>
                          <span className="block font-display text-xs text-faint">3M</span>
                          <span className="tnum text-foreground">{formatPct(m3?.pct)}</span>
                        </span>
                      </span>
                      <span className="text-xs text-muted">
                        {stale ? "Stale · " : ""}Last available observation: {formatPeriod(latest.period, true)} (monthly
                        average)
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted">No observation available.</span>
                  )}
                </button>
                <span className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted">
                  <span>World Bank Pink Sheet · {s.priceBasis}</span>
                  {s.materialHref ? (
                    <Link href={s.materialHref} className="text-accent underline-offset-4 hover:underline">
                      {s.materialName} profile
                    </Link>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>

        {gaps.length ? (
          <div className="mt-6">
            <h3 className="font-display text-base font-semibold text-foreground">Tracked materials without a publishable series</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
              No open series was identified for these materials, so no price is shown. Each would need a named product and grade
              published under terms that allow redistribution.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {gaps.map((g) => (
                <li key={g.materialId} className="rounded-md border border-dashed border-border-strong px-3 py-2.5">
                  <details>
                    <summary className="cursor-pointer list-none outline-none focus-visible:ring-2 focus-visible:ring-accent">
                      <span className="block font-display text-sm font-semibold text-foreground">{g.materialName}</span>
                      <span className="block text-xs text-muted">No open series identified</span>
                    </summary>
                    <div className="mt-2 space-y-1.5 text-xs leading-5 text-muted">
                      <p>{g.worldBankCoverage}</p>
                      <p>{g.gradeDistinctions}</p>
                      <p>
                        <span className="text-faint">Needed: </span>
                        {g.requirementForInclusion}
                      </p>
                      {g.materialHref ? (
                        <Link href={g.materialHref} className="text-accent underline-offset-4 hover:underline">
                          {g.materialName} profile
                        </Link>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ── Lower analytics ───────────────────────────────────────────── */}
      <div className="grid gap-12 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="mm-heat-title" className="min-w-0 scroll-mt-24">
          <div className="mb-5 border-b border-border-strong pb-3">
            <h2 id="mm-heat-title" className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
              Month-on-month change
            </h2>
            <p className="mt-1.5 text-[0.9375rem] leading-7 text-muted">
              {heatPeriods.length
                ? `${formatPeriod(heatPeriods[0], true)} to ${formatPeriod(heatPeriods[heatPeriods.length - 1], true)}${
                    periods.length - 1 > HEAT_MONTHS ? `, the last ${HEAT_MONTHS} months of the window` : ""
                  }. Each cell compares a month’s average with the month before.`
                : "This window is too short for a month-on-month change."}
            </p>
          </div>
          <Heatmap
            key={`${heatPeriods[0] ?? ""}-${heatPeriods.length}`}
            rows={heatRows}
            periods={heatPeriods}
            onInspect={(id, period) => {
              setHoverId(id);
              setCursor(period);
            }}
          />
        </section>

        <section aria-labelledby="mm-movers-title" className="scroll-mt-24">
          <div className="mb-5 border-b border-border-strong pb-3">
            <h2 id="mm-movers-title" className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
              Largest moves
            </h2>
            <p className="mt-1.5 text-[0.9375rem] leading-7 text-muted">
              {formatPeriod(win.start)} to {formatPeriod(win.end)} ({moverMonths} months), ranked by size of change.
            </p>
          </div>
          <ol className="space-y-3">
            {movers.ranked.map((m, i) => {
              const s = byId.get(m.id)!;
              const st = seriesStyle(m.id);
              const w = (Math.abs(m.change.pct) / moverMax) * 100;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={focusId === m.id}
                    onClick={() => toggleFocus(m.id)}
                    onMouseEnter={() => setHoverId(m.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className="w-full rounded-md p-2 text-left outline-none hover:bg-elevated focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-foreground">
                        <span className="tnum text-faint">{i + 1}.</span> {s.label}
                      </span>
                      <span className="tnum font-display font-semibold text-foreground">{formatPct(m.change.pct)}</span>
                    </span>
                    <span aria-hidden="true" className="mt-1.5 block h-1.5 w-full rounded-sm bg-elevated">
                      <span className="block h-full rounded-sm" style={{ width: `${w}%`, background: st.color }} />
                    </span>
                    <span className="tnum mt-1 block text-xs text-muted">
                      {formatNumber(m.change.fromValue)} → {formatNumber(m.change.toValue)} {s.unit}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {movers.unranked.length ? (
            <ul className="mt-3 text-xs text-muted">
              {movers.unranked.map((u) => (
                <li key={u.id}>
                  {byId.get(u.id)?.label ?? u.id} not ranked: {u.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      {/* ── Data table & export ───────────────────────────────────────── */}
      <section aria-labelledby="mm-table-title" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border-strong pb-3">
          <h2 id="mm-table-title" className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
            Data
          </h2>
          <a
            href="/api/export/markets.csv"
            download
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-card px-3 font-display text-sm text-foreground hover:border-accent sm:min-h-9"
          >
            Download CSV (all months, CC BY 4.0)
          </a>
        </div>
        <details className="rounded-md border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 font-display text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Table of monthly benchmark averages, {formatPeriod(win.start)}–{formatPeriod(win.end)} ({periods.length} months)
          </summary>
          <div className="max-h-[28rem] overflow-auto border-t border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Monthly benchmark averages in {unit}, {formatPeriod(win.start, true)} to {formatPeriod(win.end, true)}, newest
                first. A dash marks a month with no observation.
              </caption>
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-2 text-left font-display text-xs font-medium text-faint">
                    Month
                  </th>
                  {series.map((s) => (
                    <th key={s.id} scope="col" className="px-4 py-2 text-right font-display text-xs font-medium text-faint">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tablePeriods.map((p) => (
                  <tr key={p} className="border-b border-border last:border-0">
                    <th scope="row" className="tnum px-4 py-1.5 text-left font-normal text-muted">
                      {formatPeriod(p)}
                    </th>
                    {series.map((s) => {
                      const v = valueAt(s.obs, p);
                      return (
                        <td key={s.id} className="tnum px-4 py-1.5 text-right text-foreground">
                          {v === null ? <span className="text-faint">—</span> : formatNumber(v, 2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}
