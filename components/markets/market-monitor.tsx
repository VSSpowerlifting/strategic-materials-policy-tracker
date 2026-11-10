"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  HORIZONS,
  PRICE_TYPE_LABELS,
  RANGES,
  changeSummary,
  chooseIndexBase,
  formatNumber,
  formatObservationPeriod,
  formatPct,
  formatPeriod,
  indexSeries,
  isRangeId,
  periodChangeGrid,
  periodRange,
  rangeWindow,
  rankMovers,
  supportedRanges,
  unitsCompatible,
  windowObservations,
  type Frequency,
} from "@/lib/markets";
import { PriceChart, type ChartLine } from "./price-chart";
import { Sparkline } from "./sparkline";
import { Heatmap, type HeatRow } from "./heatmap";
import { MARKET_SYMBOLS, slotStyle, type MonitorSeries } from "./types";

type View = "indexed" | "absolute";

/** Opening selection per tab. Shared links override it. */
export const DEFAULT_SELECTION: Record<Frequency, readonly string[]> = {
  monthly: ["wb-copper", "wb-nickel", "imf-cobalt", "imf-reo-carbonate"],
  annual: ["usgs-ndpr-oxide", "usgs-dysprosium-oxide", "usgs-lithium-carbonate", "usgs-germanium-metal", "usgs-tungsten-concentrate"],
};
const DEFAULT_RANGE: Record<Frequency, string> = { monthly: "5y", annual: "max" };
const HEAT_PERIODS: Record<Frequency, number> = { monthly: 24, annual: 10 };
const MOVER_LAG: Record<Frequency, number> = { monthly: 12, annual: 1 };

const pill =
  "min-h-11 rounded-md border px-3 font-display text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-accent motion-safe:transition-colors sm:min-h-9";
const pillOn = "border-accent bg-elevated text-foreground";
const pillOff = "border-border-strong bg-card text-muted hover:text-foreground";
const pillDisabled = "border-border bg-card text-faint cursor-not-allowed";
const h2 = "font-display text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]";

function Swatch({ color, dash }: { color: string; dash: string | undefined }) {
  return (
    <svg width="20" height="8" aria-hidden="true" className="shrink-0">
      <line x1="0" x2="20" y1="4" y2="4" stroke={color} strokeWidth="2.5" strokeDasharray={dash} />
    </svg>
  );
}

/**
 * Fill colour slots from a list of ids, keeping order and dropping unknown or
 * duplicate ids. An empty entry ("") holds its slot open, so a shared link
 * written by `slotsParam` restores every series in the colour it had.
 */
export function slotsFrom(ids: readonly string[], known: ReadonlySet<string>): Array<string | null> {
  const out: Array<string | null> = [];
  // Every known series is selectable. Bound malformed or enormous URL inputs
  // by the available source series rather than by an arbitrary visual limit.
  for (const id of ids) {
    if (out.length >= known.size) break;
    if (id === "") out.push(null);
    else if (known.has(id) && !out.includes(id)) out.push(id);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}

/** URL form of the slots: ids in slot order, "" for a free slot, trailing free slots dropped. */
export function slotsParam(slots: ReadonlyArray<string | null>): string {
  const ids = slots.map((x) => x ?? "");
  while (ids.length && ids[ids.length - 1] === "") ids.pop();
  return ids.join(",");
}

/** Add an id to the lowest free slot, or remove it, without moving any other series. */
export function toggleSlot(slots: ReadonlyArray<string | null>, id: string): Array<string | null> {
  const at = slots.indexOf(id);
  const next = [...slots];
  if (at !== -1) next[at] = null;
  else {
    const free = next.indexOf(null);
    if (free !== -1) next[free] = id;
    else next.push(id);
  }
  // Never change surviving series' color slots. Trim only the trailing gaps.
  while (next.at(-1) === null) next.pop();
  return next;
}

export function MarketExplorer({
  series,
  releaseNotices,
}: {
  series: MonitorSeries[];
  /** Sources that state a next release date, for the "may be superseded" notice. */
  releaseNotices: Array<{ shortName: string; date: string; cutoff: string }>;
}) {
  const byId = useMemo(() => new Map(series.map((s) => [s.id, s])), [series]);
  const idsByFreq = useMemo(
    () => ({
      monthly: new Set(series.filter((s) => s.frequency === "monthly").map((s) => s.id)),
      annual: new Set(series.filter((s) => s.frequency === "annual").map((s) => s.id)),
    }),
    [series],
  );

  const [tab, setTab] = useState<Frequency>("monthly");
  const [slots, setSlots] = useState<Record<Frequency, Array<string | null>>>(() => ({
    monthly: slotsFrom(DEFAULT_SELECTION.monthly, idsByFreq.monthly),
    annual: slotsFrom(DEFAULT_SELECTION.annual, idsByFreq.annual),
  }));
  const [range, setRange] = useState<string>(DEFAULT_RANGE.monthly);
  const [view, setView] = useState<View>("indexed");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [heatInspect, setHeatInspect] = useState<{ id: string | null; period: string | null }>({ id: null, period: null });
  const [passed, setPassed] = useState<Array<{ shortName: string; date: string; cutoff: string }>>([]);
  // Set after the URL has been read; the URL is written only on later renders, once the restored state is in place.
  const [urlReady, setUrlReady] = useState(false);

  const tabSeries = useMemo(() => series.filter((s) => s.frequency === tab), [series, tab]);
  const tabSlots = slots[tab];
  const selected = useMemo(
    () => tabSlots.flatMap((id, slot) => (id && byId.has(id) ? [{ s: byId.get(id)!, slot }] : [])),
    [tabSlots, byId],
  );
  const selectedSeries = useMemo(() => selected.map((x) => x.s), [selected]);
  const slotOf = (id: string) => tabSlots.indexOf(id);

  // Window: from the earliest selected series to the latest selected observation.
  const end = selectedSeries.map((s) => s.lastPeriod).sort().at(-1) ?? tabSeries.map((s) => s.lastPeriod).sort().at(-1) ?? "";
  const earliest = selectedSeries.map((s) => s.firstPeriod).sort()[0] ?? end;
  const ranges = useMemo(() => (end ? supportedRanges(tab, earliest, end) : []), [tab, earliest, end]);
  const effectiveRange = ranges.includes(range) ? range : (ranges.at(-1) ?? "max");
  const win = end ? rangeWindow(tab, effectiveRange, end, earliest) : { start: "", end: "", truncated: false };
  const periods = useMemo(() => (win.start ? periodRange(win.start, win.end) : []), [win.start, win.end]);

  const absoluteAllowed = selectedSeries.length > 0 && unitsCompatible(selectedSeries);
  const effectiveView: View = view === "absolute" && absoluteAllowed ? "absolute" : "indexed";

  const indexInputs = useMemo(() => selectedSeries.map((s) => ({ id: s.id, obs: s.obs, breaks: s.sourceBreaks })), [selectedSeries]);
  const base = useMemo(
    () => (win.start ? chooseIndexBase(indexInputs, win.start, win.end) : null),
    [indexInputs, win.start, win.end],
  );

  // Read the URL once after mount, so the prerendered HTML is always the default view.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const f = q.get("freq") === "annual" ? "annual" : "monthly";
    const s = q.get("series");
    const r = q.get("range");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    setTab(f);
    if (s !== null) {
      const ids = s.split(",");
      setSlots((cur) => ({ ...cur, [f]: slotsFrom(ids, idsByFreq[f]) }));
    }
    if (isRangeId(r, f)) setRange(r);
    else setRange(DEFAULT_RANGE[f]);
    if (q.get("view") === "absolute") setView("absolute");
    const today = new Date().toISOString().slice(0, 10);
    setPassed(releaseNotices.filter((n) => today > n.date));
    setUrlReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [idsByFreq, releaseNotices]);

  // Mirror the view into the URL so it can be shared; defaults are left out.
  useEffect(() => {
    if (!urlReady) return;
    const q = new URLSearchParams(window.location.search);
    const set = (k: string, v: string | null) => (v ? q.set(k, v) : q.delete(k));
    const param = slotsParam(tabSlots);
    set("freq", tab === "monthly" ? null : tab);
    if (param === DEFAULT_SELECTION[tab].join(",")) q.delete("series");
    else q.set("series", param);
    set("range", effectiveRange === DEFAULT_RANGE[tab] ? null : effectiveRange);
    set("view", view === "indexed" ? null : view);
    const qs = q.toString().replace(/%2C/g, ",");
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [urlReady, tab, tabSlots, effectiveRange, view]);

  const lines: ChartLine[] = useMemo(() => {
    if (!win.start) return [];
    const shown =
      effectiveView === "indexed" ? selected.filter((x) => base?.included.includes(x.s.id)) : selected;
    return shown.map(({ s, slot }) => {
      const st = slotStyle(slot);
      const points =
        effectiveView === "indexed" && base?.basePeriod
          ? indexSeries(s.obs, base.basePeriod, win.start, win.end)
          : windowObservations(s.obs, win.start, win.end);
      const breaks = s.sourceBreaks.filter((b) => b.period > win.start && b.period <= win.end);
      return {
        id: s.id,
        label: s.label,
        color: st.color,
        dash: st.dash,
        points,
        breaks,
        unit: effectiveView === "indexed" ? "index" : s.unitShort,
        digits: s.digits,
      };
    });
  }, [effectiveView, base, selected, win.start, win.end]);

  const emphasis = heatInspect.id ?? hoverId ?? focusId;

  // In the indexed view nothing is drawn before the base period, so the chart starts there.
  const chartPeriods = useMemo(() => {
    const b = effectiveView === "indexed" ? base?.basePeriod : null;
    return b && b > win.start ? periods.filter((p) => p >= b) : periods;
  }, [effectiveView, base, win.start, periods]);
  const chartStart = chartPeriods[0] ?? win.start;

  // Movers: change over a fixed horizon to the latest period every selected series shares.
  const commonEnd = selectedSeries.map((s) => s.lastPeriod).sort()[0] ?? end;
  const moverLag = MOVER_LAG[tab];
  const movers = useMemo(() => rankMovers(indexInputs, moverLag, commonEnd), [indexInputs, moverLag, commonEnd]);
  const moverMax = Math.max(1e-9, ...movers.ranked.map((m) => Math.abs(m.change.pct)));

  const heatPeriods = useMemo(() => periods.slice(1).slice(-HEAT_PERIODS[tab]), [periods, tab]);
  const heatRows: HeatRow[] = useMemo(
    () =>
      selected.map(({ s, slot }) => {
        const st = slotStyle(slot);
        return {
          id: s.id,
          label: s.label,
          color: st.color,
          dash: st.dash,
          unit: s.unitShort,
          digits: s.digits,
          cells: periodChangeGrid(s.obs, heatPeriods, s.sourceBreaks),
        };
      }),
    [selected, heatPeriods],
  );

  const tablePeriods = useMemo(() => [...periods].reverse(), [periods]);

  const groups = useMemo(() => {
    const m = new Map<string, { name: string; href: string | null; items: MonitorSeries[] }>();
    for (const s of tabSeries) {
      const g = m.get(s.materialId) ?? { name: s.materialName, href: s.materialHref, items: [] };
      g.items.push(s);
      m.set(s.materialId, g);
    }
    return [...m.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [tabSeries]);

  const unitWord = tab === "annual" ? "year" : "month";

  function toggleMaterial(items: MonitorSeries[]) {
    const groupIds = new Set(items.map((item) => item.id));
    const already = tabSlots.some((id) => id !== null && groupIds.has(id));
    if (already) {
      setSlots((cur) => ({
        ...cur,
        [tab]: cur[tab].map((id) => id && groupIds.has(id) ? null : id),
      }));
    } else {
      toggle(items[0].id);
    }
  }

  function toggle(id: string) {
    setSlots((cur) => ({ ...cur, [tab]: toggleSlot(cur[tab], id) }));
    if (focusId === id) setFocusId(null);
  }
  function switchTab(f: Frequency) {
    if (f === tab) return;
    setTab(f);
    setRange(DEFAULT_RANGE[f]);
    setFocusId(null);
    setCursor(null);
  }

  const chartTitle = !win.start
    ? "Select a series to plot"
    : effectiveView === "indexed"
      ? base?.basePeriod
        ? `Indexed change, ${formatPeriod(chartStart)}–${formatPeriod(win.end)} (${formatPeriod(base.basePeriod)} = 100)`
        : `Indexed change, ${formatPeriod(win.start)}–${formatPeriod(win.end)}`
      : `${tab === "annual" ? "Annual average" : "Monthly average"}, ${formatPeriod(win.start)}–${formatPeriod(win.end)} (${selectedSeries[0]?.unitShort})`;

  const rangeLabel = RANGES[tab].find((r) => r.id === effectiveRange)?.label ?? effectiveRange;
  const excluded = effectiveView === "indexed" ? (base?.excluded ?? []) : [];

  return (
    <div className="space-y-14">
      {passed.length > 0 ? (
        <p role="status" className="rounded-md border border-border-strong bg-elevated px-4 py-3 text-sm text-foreground">
          {passed
            .map(
              (n) =>
                `${n.shortName}’s next scheduled release date (${n.date}) has passed, so a newer release may exist; this page still shows its frozen data through ${formatPeriod(n.cutoff, true)}.`,
            )
            .join(" ")}
        </p>
      ) : null}

      {/* ── Chart ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="mm-chart-title" className="scroll-mt-24">
        <div className="border-b border-border-strong pb-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="mm-chart-title" className={h2}>Price trends</h2>
          <div role="group" aria-label="Frequency" className="flex gap-2">
            {(["monthly", "annual"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={tab === f}
                onClick={() => switchTab(f)}
                className={cn(pill, tab === f ? pillOn : pillOff)}
              >
                {f === "monthly" ? "Monthly" : "Annual"}{" "}
                <span className="text-faint">{idsByFreq[f].size}</span>
              </button>
            ))}
          </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground">{chartTitle}</p>
            <a href="#mm-pick-title" className="font-display text-sm text-accent underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-accent">
              Choose benchmarks
            </a>
          </div>
          <p className="mt-1.5 max-w-3xl text-[0.9375rem] leading-7 text-muted">
            {selected.length === 0
              ? "Choose one or more benchmarks below."
              : effectiveView === "indexed"
                ? base?.basePeriod
                  ? `Each series is divided by its own ${formatPeriod(base.basePeriod, true)} value and multiplied by 100, so the lines compare percentage paths, not price levels.`
                  : base?.explanation
                : `Published values on one axis; every selected series is in ${selectedSeries[0]?.unit}.`}
            {win.truncated ? ` The selected series begin in ${formatPeriod(earliest, true)}, so this window is shorter than ${rangeLabel}.` : ""}
            {tab === "annual" && selected.length > 0 ? " Hollow points and dotted steps mark USGS estimates." : ""}
          </p>
        </div>

        {selected.length > 0 ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              {tab === "monthly" ? (
                <div role="group" aria-label="Time range" className="flex flex-wrap gap-2">
                  {RANGES.monthly
                    .filter((r) => ranges.includes(r.id))
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={effectiveRange === r.id}
                        onClick={() => setRange(r.id)}
                        className={cn(pill, effectiveRange === r.id ? pillOn : pillOff)}
                      >
                        {r.label}
                      </button>
                    ))}
                </div>
              ) : null}
              <div role="group" aria-label="Scale" className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={effectiveView === "indexed"}
                  onClick={() => setView("indexed")}
                  className={cn(pill, effectiveView === "indexed" ? pillOn : pillOff)}
                >
                  Indexed
                </button>
                <button
                  type="button"
                  aria-pressed={effectiveView === "absolute"}
                  aria-disabled={!absoluteAllowed || undefined}
                  aria-describedby={absoluteAllowed ? undefined : "mm-abs-note"}
                  onClick={() => (absoluteAllowed ? setView("absolute") : undefined)}
                  className={cn(pill, effectiveView === "absolute" ? pillOn : absoluteAllowed ? pillOff : pillDisabled)}
                >
                  Published values
                </button>
              </div>
              {!absoluteAllowed ? (
                <p id="mm-abs-note" className="text-xs text-faint">
                  Published values need one shared unit and currency; the selection mixes units.
                </p>
              ) : null}
            </div>

            <div className="mt-4 rounded-lg border border-border bg-card p-2 sm:p-4">
              {lines.length > 0 ? (
                <PriceChart
                  lines={lines}
                  periods={chartPeriods}
                  mode={effectiveView}
                  basePeriod={effectiveView === "indexed" ? (base?.basePeriod ?? null) : null}
                  cursor={cursor}
                  onCursor={setCursor}
                  focusId={emphasis}
                  onFocus={setFocusId}
                  label={chartTitle}
                />
              ) : (
                <p className="p-6 text-sm text-muted">{base?.explanation ?? "Nothing to plot for this selection."}</p>
              )}
            </div>
            <ul aria-label="Legend" className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
              {selected.map(({ s, slot }) => {
                const st = slotStyle(slot);
                const plotted = lines.some((l) => l.id === s.id);
                return (
                  <li key={s.id} className="flex items-center">
                    <button
                      type="button"
                      aria-pressed={focusId === s.id}
                      onClick={() => setFocusId((cur) => (cur === s.id ? null : s.id))}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2 rounded-l-md border px-2.5 py-1 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-9",
                        focusId === s.id ? pillOn : pillOff,
                      )}
                    >
                      <Swatch color={st.color} dash={st.dash} />
                      <span className={plotted ? "" : "text-faint line-through"}>{s.label}</span>
                      <span className="shrink-0 text-xs whitespace-nowrap text-faint">{s.sourceShortName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(s.id)}
                      aria-label={`Remove ${s.label}`}
                      className="inline-flex min-h-11 items-center rounded-r-md border border-l-0 border-border-strong bg-card px-2.5 text-sm text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent sm:min-h-9"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>

            {excluded.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {excluded.map((e) => (
                  <li key={e.id}>
                    <span className="text-foreground">{byId.get(e.id)?.label}</span> is not plotted in the indexed view: {e.reason}
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="mt-2 text-xs text-faint">
              Hover or tap the chart to read every selected series at one {unitWord}. Shaded columns mark {unitWord}s where at
              least one plotted series has no value; nothing is interpolated.
            </p>
          </>
        ) : (
          <p className="mt-6 rounded-lg border border-border bg-card p-8 text-sm text-muted">Select one or more benchmarks in the picker below to plot their history.</p>
        )}
      </section>

      {/* ── Frequency and series picker ───────────────────────────────── */}
      <section aria-labelledby="mm-pick-title" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-strong pb-3">
          <h2 id="mm-pick-title" className={h2}>
            Choose benchmarks
          </h2>

        </div>
        <p className="mt-3 max-w-3xl text-[0.9375rem] leading-7 text-muted">
          {tab === "monthly"
            ? "Monthly averages from the World Bank Pink Sheet and the IMF Primary Commodity Price System."
            : "Annual averages and unit values for 2021–2025 from USGS Mineral Commodity Summaries 2026; 2025 values are USGS estimates."}{" "}
          Select any available benchmarks. Each keeps its line style while selected; use the legend to highlight a series when the chart is crowded.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <p aria-live="polite" className="tnum text-muted">
            {selected.length} of {tabSeries.length} selected
          </p>
          {selected.length < tabSeries.length ? (
            <button
              type="button"
              onClick={() => setSlots((cur) => ({ ...cur, [tab]: slotsFrom(tabSeries.map((s) => s.id), idsByFreq[tab]) }))}
              className="font-display text-sm text-accent underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent"
            >
              Select all
            </button>
          ) : null}
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => setSlots((cur) => ({ ...cur, [tab]: [] }))}
              className="font-display text-sm text-accent underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent"
            >
              Clear selection
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setSlots((cur) => ({ ...cur, [tab]: slotsFrom(DEFAULT_SELECTION[tab], idsByFreq[tab]) }))}
            className="font-display text-sm text-accent underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent"
          >
            Reset
          </button>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-xs text-faint">
            Select a material to plot its first listed benchmark, or remove its selected benchmarks. Use the detailed choices below to compare alternate price specifications.
          </p>
          <div role="group" aria-label="Element-style material selector" className="grid grid-cols-3 gap-2 min-[410px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-9">
            {groups.map(([materialId, g]) => {
              const chosen = g.items.filter((item) => slotOf(item.id) !== -1);
              const active = chosen.length > 0;
              const st = active ? slotStyle(slotOf(chosen[0].id)) : null;
              return (
                <button
                  key={materialId}
                  type="button"
                  aria-pressed={active}
                  title={`${g.name}: ${g.items.length} ${tab} benchmark${g.items.length === 1 ? "" : "s"}`}
                  onClick={() => toggleMaterial(g.items)}
                  className={cn(
                    "flex min-h-20 min-w-0 flex-col items-start justify-between gap-1 rounded-md border px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent motion-safe:transition-colors",
                    active ? "border-accent bg-elevated text-foreground" : pillOff,
                  )}
                >
                  <span className="font-display text-xl font-semibold leading-none" style={st ? { color: st.color } : undefined}>
                    {MARKET_SYMBOLS[materialId] ?? "•"}
                  </span>
                  <span className="w-full truncate text-xs" title={g.name}>{g.name}</span>
                  <span className="text-[10px] text-faint">{active ? `${chosen.length} selected` : `${g.items.length} benchmark${g.items.length === 1 ? "" : "s"}`}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Benchmark specifications</h3>
          <span className="text-xs text-faint">Different grades and price bases remain separate</span>
        </div>
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(([materialId, g]) => (
            <div key={materialId} className="bg-card px-4 py-3">
              <h3 className="font-display text-xs text-faint">
                {g.href ? (
                  <Link href={g.href} className="hover:text-accent">
                    {g.name}
                  </Link>
                ) : (
                  g.name
                )}
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {g.items.map((s) => {
                  const slot = slotOf(s.id);
                  const on = slot !== -1;
                  const st = on ? slotStyle(slot) : null;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(s.id)}
                        title={`${s.benchmark} · ${s.sourceShortName} · ${PRICE_TYPE_LABELS[s.priceType]}`}
                        className={cn(
                          "inline-flex min-h-11 items-center gap-2 rounded-md border px-2.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent motion-safe:transition-colors sm:min-h-9",
                          on ? pillOn : pillOff,
                        )}
                      >
                        {st ? (
                          <Swatch color={st.color} dash={st.dash} />
                        ) : (
                          <span aria-hidden="true" className="h-2 w-5 shrink-0 rounded-sm border border-dashed border-border-strong" />
                        )}
                        <span>
                          {s.label}
                          <span className="ml-1.5 text-xs text-faint">{s.unitShort}</span>
                          {s.priceType === "trade_unit_value" ? (
                            <span className="ml-1.5 text-xs text-faint">· unit value</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cards ────────────────────────────────────────────────────── */}
      {selected.length > 0 ? (
        <section aria-labelledby="mm-cards-title" className="scroll-mt-24">
          <div className="border-b border-border-strong pb-3">
            <h2 id="mm-cards-title" className={h2}>
              Latest values
            </h2>
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selected.map(({ s, slot }) => {
              const st = slotStyle(slot);
              const sum = changeSummary(s.obs, tab, s.sourceBreaks);
              const spark = win.start ? windowObservations(s.obs, win.start, win.end) : [];
              return (
                <li
                  key={s.id}
                  className={cn(
                    "rounded-lg border bg-card p-4 motion-safe:transition-colors",
                    emphasis === s.id ? "border-accent" : "border-border",
                  )}
                  onMouseEnter={() => setHoverId(s.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
                        <Swatch color={st.color} dash={st.dash} />
                        {s.label}
                      </h3>
                      <p className="mt-1 text-xs text-faint">
                        {s.sourceShortName} · {PRICE_TYPE_LABELS[s.priceType]}
                      </p>
                    </div>
                    <Sparkline points={spark} periods={periods} color={st.color} dash={st.dash} unit={s.unit} width={112} height={36} />
                  </div>
                  {sum.latest ? (
                    <p className="mt-3">
                      <span className="tnum font-display text-2xl font-bold tracking-tight text-foreground">
                        {formatNumber(sum.latest.value, s.digits)}
                      </span>{" "}
                      <span className="text-sm text-muted">{s.unitShort}</span>
                      <span className="tnum block text-xs text-faint">{formatObservationPeriod(sum.latest, true)}</span>
                    </p>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                    {sum.changes.map(({ horizon, change, reason }) => (
                      <div key={horizon.id}>
                        <dt className="text-faint">{horizon.label}</dt>
                        <dd className="tnum mt-0.5 text-sm text-foreground" title={reason ?? undefined}>
                          {change ? `${formatPct(change.pct)}${change.estimated ? "e" : ""}` : "n/a"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-muted">{s.benchmark}</p>
                  {s.materialHref ? (
                    <Link href={s.materialHref} className="mt-2 inline-block font-display text-xs text-accent hover:underline">
                      {s.materialName} policy record →
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-faint">
            Changes compare the latest value with the value exactly{" "}
            {HORIZONS[tab].map((h) => `${h.lag} ${unitWord}${h.lag === 1 ? "" : "s"}`).join(" or ")} earlier. “n/a” means one of
            the two values is missing or the source changes between them; “e” marks a change that uses an estimate.
          </p>
        </section>
      ) : null}

      {/* ── Heatmap and movers ───────────────────────────────────────── */}
      {selected.length > 0 ? (
        <section aria-labelledby="mm-heat-title" className="scroll-mt-24">
          <div className="border-b border-border-strong pb-3">
            <h2 id="mm-heat-title" className={h2}>
              {tab === "annual" ? "Year-on-year change" : "Month-on-month change"}
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Heatmap
              key={`${heatPeriods[0] ?? ""}-${heatPeriods.at(-1) ?? ""}`}
              rows={heatRows}
              periods={heatPeriods}
              frequency={tab}
              onInspect={(id, period) => {
                setHeatInspect({ id, period });
                setCursor(period);
              }}
            />
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Largest moves, {moverLag} {unitWord}
                {moverLag === 1 ? "" : "s"} to {formatPeriod(commonEnd)}
              </h3>
              <p className="mt-1 text-xs text-faint">
                Ranked by size of change to the latest {unitWord} all selected series share.
              </p>
              <ol className="mt-3 space-y-2">
                {movers.ranked.map((m) => {
                  const s = byId.get(m.id)!;
                  const st = slotStyle(slotOf(m.id));
                  const w = (Math.abs(m.change.pct) / moverMax) * 100;
                  return (
                    <li key={m.id} className="text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2 truncate text-foreground">
                          <Swatch color={st.color} dash={st.dash} />
                          {s.label}
                        </span>
                        <span className="tnum shrink-0 text-foreground">
                          {formatPct(m.change.pct)}
                          {m.change.estimated ? "e" : ""}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-sm bg-elevated" aria-hidden="true">
                        <div
                          className="h-1.5 rounded-sm"
                          style={{ width: `${w}%`, background: m.change.pct >= 0 ? "var(--accent)" : "var(--muted)" }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
              {movers.unranked.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-muted">
                  {movers.unranked.map((u) => (
                    <li key={u.id}>
                      {byId.get(u.id)?.label}: not ranked. {u.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Data table ───────────────────────────────────────────────── */}
      {selected.length > 0 && periods.length > 0 ? (
        <section aria-labelledby="mm-table-title" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-strong pb-3">
            <h2 id="mm-table-title" className={h2}>
              Data
            </h2>
            <a href="/api/export/markets.csv" className="font-display text-sm text-accent hover:underline" download>
              Download all series (CSV)
            </a>
          </div>
          <details className="mt-4 rounded-lg border border-border bg-card">
            <summary className="cursor-pointer px-4 py-3 font-display text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Published values for the selected series, {formatPeriod(win.start)}–{formatPeriod(win.end)}
            </summary>
            <div className="max-h-[32rem] overflow-auto border-t border-border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Published values for the selected series. “e” marks an estimate; a dash marks a period with no value.
                </caption>
                <thead className="sticky top-0 bg-card font-display text-xs text-faint">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Period
                    </th>
                    {selectedSeries.map((s) => (
                      <th key={s.id} scope="col" className="px-4 py-2 text-right font-medium whitespace-nowrap">
                        {s.label}
                        <span className="block font-normal">{s.unitShort}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tablePeriods.map((p) => (
                    <tr key={p} className="border-t border-border">
                      <th scope="row" className="tnum px-4 py-1.5 font-normal whitespace-nowrap text-muted">
                        {formatPeriod(p)}
                      </th>
                      {selectedSeries.map((s) => {
                        const o = s.obs.find((x) => x.period === p);
                        return (
                          <td key={s.id} className="tnum px-4 py-1.5 text-right whitespace-nowrap text-foreground">
                            {o ? `${formatNumber(o.value, s.digits)}${o.estimated ? "e" : ""}` : <span className="text-faint">—</span>}
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
      ) : null}
    </div>
  );
}
