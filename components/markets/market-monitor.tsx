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
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MIN_WINDOW_STEPS, matchPreset, panWindow, parsePeriodWindow, resolvePeriodWindow, zoomWindow, type PeriodWindow, type ScaleKind } from "./chart-math";
import { Heatmap, type HeatRow } from "./heatmap";
import { PriceChart, type ChartLine } from "./price-chart";
import { RangeNavigator } from "./range-navigator";
import { Sparkline } from "./sparkline";
import { MARKET_SYMBOLS, slotStyle, type MonitorSeries } from "./types";

type View = "indexed" | "absolute";

/** Opening selection per tab. Shared links override it. */
export const DEFAULT_SELECTION: Record<Frequency, readonly string[]> = {
  monthly: ["wb-copper", "wb-nickel", "imf-cobalt", "imf-reo-carbonate"],
  annual: ["usgs-ndpr-oxide", "usgs-dysprosium-oxide", "usgs-lithium-carbonate", "usgs-germanium-metal", "usgs-tungsten-concentrate"],
};
const DEFAULT_RANGE: Record<Frequency, string> = {
  monthly: "5y",
  annual: "max",
};
const HEAT_PERIODS: Record<Frequency, number> = { monthly: 24, annual: 10 };
const MOVER_LAG: Record<Frequency, number> = { monthly: 12, annual: 1 };

const h2 = "font-display text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-[1.375rem]";
/** Segmented control: one hairline frame, square, the pressed option on the elevated tone with an ink underline. */
const segGroup = "flex w-full divide-x divide-border-strong border border-border-strong sm:w-auto";
const segBtn =
  "relative min-h-11 flex-1 whitespace-nowrap px-3 font-display text-sm tabular-nums focus-visible:z-10 motion-safe:transition-colors sm:min-h-8 sm:flex-none sm:text-[0.8125rem]";
const segOn = "bg-elevated text-foreground shadow-[inset_0_-2px_0_var(--fg)]";
const segOff = "text-muted hover:bg-elevated hover:text-foreground";
const segDisabled = "cursor-not-allowed text-faint opacity-60";
const field = "min-h-11 border border-border-strong bg-plate px-2 font-display text-base tabular-nums text-foreground sm:min-h-[2.125rem] sm:text-[0.8125rem]";
const textButton = "link-quiet font-display text-sm text-foreground";

function Control({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full sm:w-auto", className)}>
      <p className="mb-1 font-display text-xs leading-4 text-faint">{label}</p>
      {children}
    </div>
  );
}

function Swatch({ color, dash }: { color: string; dash: string | undefined }) {
  return (
    <svg width="20" height="8" aria-hidden="true" className="shrink-0">
      <line x1="0" x2="20" y1="4" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dash} />
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
  /** A window set by zooming, panning, dragging or the date fields. It overrides the preset while set. */
  const [custom, setCustom] = useState<PeriodWindow | null>(null);
  /** Date-field text that is not yet a usable window. */
  const [draft, setDraft] = useState<{ from?: string; to?: string }>({});
  const [view, setView] = useState<View>("indexed");
  const [scale, setScale] = useState<ScaleKind>("linear");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [heatInspect, setHeatInspect] = useState<{
    id: string | null;
    period: string | null;
  }>({ id: null, period: null });
  const [passed, setPassed] = useState<Array<{ shortName: string; date: string; cutoff: string }>>([]);
  // Set after the URL has been read; the URL is written only on later renders, once the restored state is in place.
  const [urlReady, setUrlReady] = useState(false);

  const tabSeries = useMemo(() => series.filter((s) => s.frequency === tab), [series, tab]);
  const tabSlots = slots[tab];
  const selected = useMemo(() => tabSlots.flatMap((id, slot) => (id && byId.has(id) ? [{ s: byId.get(id)!, slot }] : [])), [tabSlots, byId]);
  const selectedSeries = useMemo(() => selected.map((x) => x.s), [selected]);
  const slotOf = (id: string) => tabSlots.indexOf(id);

  // Published extent: from the earliest selected series to the latest selected observation.
  const end =
    selectedSeries
      .map((s) => s.lastPeriod)
      .sort()
      .at(-1) ??
    tabSeries
      .map((s) => s.lastPeriod)
      .sort()
      .at(-1) ??
    "";
  const earliest = selectedSeries.map((s) => s.firstPeriod).sort()[0] ?? end;
  const ranges = useMemo(() => (end ? supportedRanges(tab, earliest, end) : []), [tab, earliest, end]);
  const effectiveRange = ranges.includes(range) ? range : (ranges.at(-1) ?? "max");
  const customWin = useMemo(() => (end ? resolvePeriodWindow(custom, earliest, end) : null), [custom, earliest, end]);
  const presetWin = end ? rangeWindow(tab, effectiveRange, end, earliest) : { start: "", end: "", truncated: false };
  const win = customWin ? { start: customWin.from, end: customWin.to, truncated: false } : presetWin;
  const periods = useMemo(() => (win.start ? periodRange(win.start, win.end) : []), [win.start, win.end]);

  const absoluteAllowed = selectedSeries.length > 0 && unitsCompatible(selectedSeries);
  const effectiveView: View = view === "absolute" && absoluteAllowed ? "absolute" : "indexed";

  const indexInputs = useMemo(
    () =>
      selectedSeries.map((s) => ({
        id: s.id,
        obs: s.obs,
        breaks: s.sourceBreaks,
      })),
    [selectedSeries],
  );
  const base = useMemo(() => (win.start ? chooseIndexBase(indexInputs, win.start, win.end) : null), [indexInputs, win.start, win.end]);

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
    setCustom(parsePeriodWindow(q.get("from"), q.get("to"), f));
    if (q.get("view") === "absolute") setView("absolute");
    if (q.get("scale") === "log") setScale("log");
    const today = new Date().toISOString().slice(0, 10);
    setPassed(releaseNotices.filter((n) => today > n.date));
    setUrlReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [idsByFreq, releaseNotices]);

  // Mirror the view into the URL so it can be shared; defaults are left out.
  // With nothing selected there is no extent to resolve against, so the stored range is kept as set.
  const nothingSelected = selectedSeries.length === 0;
  const customFrom = (nothingSelected ? custom : customWin)?.from ?? null;
  const customTo = (nothingSelected ? custom : customWin)?.to ?? null;
  const urlRange = nothingSelected ? range : effectiveRange;
  useEffect(() => {
    if (!urlReady) return;
    const q = new URLSearchParams(window.location.search);
    const set = (k: string, v: string | null) => (v ? q.set(k, v) : q.delete(k));
    const param = slotsParam(tabSlots);
    set("freq", tab === "monthly" ? null : tab);
    if (param === DEFAULT_SELECTION[tab].join(",")) q.delete("series");
    else q.set("series", param);
    set("range", customFrom || urlRange === DEFAULT_RANGE[tab] ? null : urlRange);
    set("from", customFrom);
    set("to", customTo);
    set("view", view === "indexed" ? null : view);
    set("scale", scale === "log" ? "log" : null);
    const qs = q.toString().replace(/%2C/g, ",");
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [urlReady, tab, tabSlots, urlRange, customFrom, customTo, view, scale]);

  const lines: ChartLine[] = useMemo(() => {
    if (!win.start) return [];
    const shown = effectiveView === "indexed" ? selected.filter((x) => base?.included.includes(x.s.id)) : selected;
    return shown.map(({ s, slot }) => {
      const st = slotStyle(slot);
      const published = windowObservations(s.obs, win.start, win.end);
      const points = effectiveView === "indexed" && base?.basePeriod ? indexSeries(s.obs, base.basePeriod, win.start, win.end) : published;
      const breaks = s.sourceBreaks.filter((b) => b.period > win.start && b.period <= win.end);
      return {
        id: s.id,
        label: s.label,
        color: st.color,
        dash: st.dash,
        points,
        published,
        breaks,
        unit: s.unitShort,
        source: s.sourceShortName,
        kind: PRICE_TYPE_LABELS[s.priceType],
        digits: s.digits,
      };
    });
  }, [effectiveView, base, selected, win.start, win.end]);

  // A logarithmic axis has no place for zero or a negative value, so it is offered only when every plotted value is positive.
  const logPossible = useMemo(() => lines.length > 0 && lines.every((l) => l.points.every((o) => o.value > 0)), [lines]);
  const effectiveScale: ScaleKind = scale === "log" && logPossible ? "log" : "linear";

  const emphasis = heatInspect.id ?? hoverId ?? focusId;

  // In the indexed view nothing is drawn before the base period, so the chart starts there.
  const chartPeriods = useMemo(() => {
    const b = effectiveView === "indexed" ? base?.basePeriod : null;
    return b && b > win.start ? periods.filter((p) => p >= b) : periods;
  }, [effectiveView, base, win.start, periods]);
  const chartStart = chartPeriods[0] ?? win.start;

  // The periods the visible window can move over. An indexed view cannot start before every selected series has begun.
  const leftLimit =
    effectiveView === "indexed"
      ? (selectedSeries
          .map((s) => s.firstPeriod)
          .sort()
          .at(-1) ?? earliest)
      : earliest;
  const navPeriods = useMemo(() => (end && leftLimit && leftLimit <= end ? periodRange(leftLimit, end) : []), [leftLimit, end]);
  const vFrom = Math.max(0, navPeriods.indexOf(chartStart));
  const vToAt = navPeriods.indexOf(win.end);
  const vTo = vToAt === -1 ? Math.max(0, navPeriods.length - 1) : vToAt;
  const canZoomIn = vTo - vFrom > MIN_WINDOW_STEPS;
  const canZoomOut = navPeriods.length > 1 && !(vFrom === 0 && vTo === navPeriods.length - 1);
  const canPanBack = vFrom > 0;
  const canPanForward = vTo < navPeriods.length - 1;

  function applyWindow(from: string, to: string) {
    if (!end) return;
    const w = resolvePeriodWindow({ from, to }, earliest, end);
    if (!w) return;
    const preset = w.to === end && w.from <= leftLimit ? "max" : matchPreset(tab, w, earliest, end);
    if (preset && ranges.includes(preset)) {
      setRange(preset);
      setCustom(null);
    } else setCustom(w);
    setDraft({});
  }
  function zoom(factor: number, anchor: string | null) {
    const n = navPeriods.length;
    if (n < 2) return;
    const at = anchor ? navPeriods.indexOf(anchor) : -1;
    // Without a pointer, keep the latest period in place; at the start of the history, keep the start.
    const a = at !== -1 ? at : vTo === n - 1 ? vTo : vFrom === 0 ? vFrom : (vFrom + vTo) / 2;
    const next = zoomWindow({ from: vFrom, to: vTo }, factor, a, n, MIN_WINDOW_STEPS);
    if (next.from !== vFrom || next.to !== vTo) applyWindow(navPeriods[next.from], navPeriods[next.to]);
  }
  function pan(steps: number) {
    const next = panWindow({ from: vFrom, to: vTo }, steps, navPeriods.length);
    if (next.from !== vFrom) applyWindow(navPeriods[next.from], navPeriods[next.to]);
  }
  function resetView() {
    setRange(DEFAULT_RANGE[tab]);
    setCustom(null);
    setDraft({});
  }
  function editBound(which: "from" | "to", value: string) {
    const next = { ...draft, [which]: value };
    const w = parsePeriodWindow(next.from ?? chartStart, next.to ?? win.end, tab);
    if (w && w.from >= earliest && w.to <= end) applyWindow(w.from, w.to);
    else setDraft(next);
  }
  const draftPending = draft.from !== undefined || draft.to !== undefined;

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
      const g = m.get(s.materialId) ?? {
        name: s.materialName,
        href: s.materialHref,
        items: [],
      };
      g.items.push(s);
      m.set(s.materialId, g);
    }
    return [...m.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [tabSeries]);

  // Availability is computed across both frequencies so each element tile
  // states which type of published history exists, even on the opposite tab.
  const materialFrequencies = useMemo(() => {
    const frequencies = new Map<string, Set<Frequency>>();
    for (const entry of series) {
      const current = frequencies.get(entry.materialId) ?? new Set<Frequency>();
      current.add(entry.frequency);
      frequencies.set(entry.materialId, current);
    }
    return frequencies;
  }, [series]);

  const unitWord = tab === "annual" ? "year" : "month";

  function toggleMaterial(items: MonitorSeries[]) {
    const groupIds = new Set(items.map((item) => item.id));
    const already = tabSlots.some((id) => id !== null && groupIds.has(id));
    if (already) {
      setSlots((cur) => ({
        ...cur,
        [tab]: cur[tab].map((id) => (id && groupIds.has(id) ? null : id)),
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
    setCustom(null);
    setDraft({});
    setFocusId(null);
  }

  // ── What the chart header says ──────────────────────────────────────────────
  const indexed = effectiveView === "indexed";
  const transformLabel = indexed
    ? base?.basePeriod
      ? `Indexed, ${formatPeriod(base.basePeriod, true)} = 100`
      : "Indexed"
    : `Published values, ${selectedSeries[0]?.unit ?? ""}`;
  const frequencyLabel = tab === "annual" ? "Annual values" : "Monthly averages";
  const windowLabel = win.start ? `${formatPeriod(chartStart)} to ${formatPeriod(win.end)}` : "";
  const chartTitle = !win.start
    ? "Select a series to plot"
    : `${transformLabel}${effectiveScale === "log" ? ", logarithmic axis" : ""}. ${frequencyLabel}, ${windowLabel}`;

  const rangeLabel = RANGES[tab].find((r) => r.id === effectiveRange)?.label ?? effectiveRange;
  const excluded = indexed ? (base?.excluded ?? []) : [];
  const sourceNames = [...new Set(selectedSeries.map((s) => s.sourceShortName))];
  const latestIsEstimate = selectedSeries.some((s) => s.lastPeriod === end && s.obs[s.obs.length - 1]?.estimated);
  const navLine = lines.find((l) => l.id === focusId) ?? lines[0];
  const navSeries = navLine ? byId.get(navLine.id) : undefined;

  const notes: string[] = [];
  if (selected.length > 0) {
    if (indexed && base?.basePeriod) {
      notes.push(
        `Each series is divided by its own ${formatPeriod(base.basePeriod, true)} value and multiplied by 100, so the lines compare percentage paths, not price levels. The readout gives each published value in its own unit.`,
      );
      if (chartStart > win.start) notes.push(`The index starts in ${formatPeriod(chartStart, true)}, the first ${unitWord} in which every selected series has a value.`);
    } else if (indexed && base?.explanation) notes.push(base.explanation);
    else if (!indexed) notes.push(`Every selected series is in ${selectedSeries[0]?.unit}.`);
    if (effectiveScale === "log") notes.push("Logarithmic axis: equal vertical distances are equal percentage changes. No value is altered.");
    if (scale === "log" && !logPossible && lines.length > 0) notes.push("A logarithmic axis needs positive values, so this view is linear.");
    if (win.truncated) notes.push(`The selected series begin in ${formatPeriod(earliest, true)}, so this window is shorter than ${rangeLabel}.`);
    if (tab === "annual") notes.push("Each point is one annual value. Hollow points and dotted steps mark USGS estimates.");
  }

  /* Rendered once per breakpoint: beside the other controls on wide screens, under the chart on a phone. */
  const bounds = (
    <>
      <Control label={tab === "annual" ? "From year" : "From"} className="w-[calc(50%-0.5rem)]">
        {tab === "annual" ? (
          <select aria-label="First year shown" value={draft.from ?? chartStart} onChange={(e) => editBound("from", e.target.value)} className={cn(field, "w-full")}>
            {navPeriods.slice(0, -1).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="month"
            aria-label="First month shown"
            aria-describedby={draftPending ? "mm-range-note" : undefined}
            value={draft.from ?? chartStart}
            min={earliest}
            max={end}
            pattern="\d{4}-\d{2}"
            placeholder="YYYY-MM"
            onChange={(e) => editBound("from", e.target.value)}
            className={cn(field, "w-full sm:w-[9.5rem]")}
          />
        )}
      </Control>
      <Control label={tab === "annual" ? "To year" : "To"} className="w-[calc(50%-0.5rem)]">
        {tab === "annual" ? (
          <select aria-label="Last year shown" value={draft.to ?? win.end} onChange={(e) => editBound("to", e.target.value)} className={cn(field, "w-full")}>
            {navPeriods.slice(1).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="month"
            aria-label="Last month shown"
            aria-describedby={draftPending ? "mm-range-note" : undefined}
            value={draft.to ?? win.end}
            min={earliest}
            max={end}
            pattern="\d{4}-\d{2}"
            placeholder="YYYY-MM"
            onChange={(e) => editBound("to", e.target.value)}
            className={cn(field, "w-full sm:w-[9.5rem]")}
          />
        )}
      </Control>
    </>
  );
  const rangeTools = (
    <>
      <div role="group" aria-label="Zoom and pan" className={cn(segGroup, "w-auto")}>
        <button
          type="button"
          aria-label="Zoom out"
          aria-disabled={!canZoomOut || undefined}
          onClick={() => (canZoomOut ? zoom(1.6, null) : undefined)}
          className={cn(segBtn, canZoomOut ? segOff : segDisabled)}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          aria-disabled={!canZoomIn || undefined}
          onClick={() => (canZoomIn ? zoom(0.625, null) : undefined)}
          className={cn(segBtn, canZoomIn ? segOff : segDisabled)}
        >
          +
        </button>
        <button
          type="button"
          aria-label={`Pan to earlier ${unitWord}s`}
          aria-disabled={!canPanBack || undefined}
          onClick={() => (canPanBack ? pan(-Math.max(1, Math.round((vTo - vFrom) / 4))) : undefined)}
          className={cn(segBtn, canPanBack ? segOff : segDisabled)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label={`Pan to later ${unitWord}s`}
          aria-disabled={!canPanForward || undefined}
          onClick={() => (canPanForward ? pan(Math.max(1, Math.round((vTo - vFrom) / 4))) : undefined)}
          className={cn(segBtn, canPanForward ? segOff : segDisabled)}
        >
          →
        </button>
      </div>
      <button type="button" onClick={resetView} className={cn(textButton, "min-h-11 shrink-0 sm:min-h-8")}>
        Reset view
      </button>
    </>
  );

  return (
    <div className="space-y-16">
      {passed.length > 0 ? (
        <p role="status" className="border border-border-strong bg-elevated px-4 py-3 text-sm text-foreground">
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
        <h2 id="mm-chart-title" className="sr-only">
          Price trends
        </h2>

        <div className="border border-border-strong bg-plate">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-b border-border px-3 py-3">
            <Control label="Frequency">
              <div role="group" aria-label="Frequency" className={segGroup}>
                {(["monthly", "annual"] as const).map((f) => (
                  <button key={f} type="button" aria-pressed={tab === f} onClick={() => switchTab(f)} className={cn(segBtn, tab === f ? segOn : segOff)}>
                    {f === "monthly" ? "Monthly" : "Annual"} <span className="text-faint">{idsByFreq[f].size}</span>
                  </button>
                ))}
              </div>
            </Control>
            {selected.length > 0 ? (
              <>
                {tab === "monthly" ? (
                  <Control label="Range">
                    <div role="group" aria-label="Time range" className={segGroup}>
                      {RANGES.monthly
                        .filter((r) => ranges.includes(r.id))
                        .map((r) => {
                          const on = !customWin && effectiveRange === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => {
                                setRange(r.id);
                                setCustom(null);
                                setDraft({});
                              }}
                              className={cn(segBtn, "px-2 sm:px-2.5", on ? segOn : segOff)}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                    </div>
                  </Control>
                ) : null}
                <Control label="Values" className="w-[calc(58%-0.5rem)]">
                  <div role="group" aria-label="Values" className={segGroup}>
                    <button type="button" aria-pressed={indexed} onClick={() => setView("indexed")} className={cn(segBtn, "px-2 sm:px-3", indexed ? segOn : segOff)}>
                      Indexed
                    </button>
                    <button
                      type="button"
                      aria-pressed={!indexed}
                      aria-disabled={!absoluteAllowed || undefined}
                      aria-describedby={absoluteAllowed ? undefined : "mm-abs-note"}
                      onClick={() => (absoluteAllowed ? setView("absolute") : undefined)}
                      className={cn(segBtn, "px-2 sm:px-3", !indexed ? segOn : absoluteAllowed ? segOff : segDisabled)}
                    >
                      Published
                      <span className="sr-only sm:not-sr-only"> values</span>
                    </button>
                  </div>
                </Control>
                <Control label="Axis" className="w-[calc(42%-0.5rem)]">
                  <div role="group" aria-label="Value axis" className={segGroup}>
                    <button
                      type="button"
                      aria-pressed={effectiveScale === "linear"}
                      onClick={() => setScale("linear")}
                      className={cn(segBtn, "px-2 sm:px-3", effectiveScale === "linear" ? segOn : segOff)}
                    >
                      Linear
                    </button>
                    <button
                      type="button"
                      aria-pressed={effectiveScale === "log"}
                      aria-disabled={!logPossible || undefined}
                      onClick={() => (logPossible ? setScale("log") : undefined)}
                      className={cn(segBtn, "px-2 sm:px-3", effectiveScale === "log" ? segOn : logPossible ? segOff : segDisabled)}
                    >
                      Log
                    </button>
                  </div>
                </Control>
              </>
            ) : null}
            {selected.length > 0 && lines.length > 0 ? (
              <>
                <div className="hidden sm:contents">{bounds}</div>
                {draftPending ? (
                  <p id="mm-range-note" role="status" className="w-full text-xs text-muted">
                    Enter a start before the end, between {formatPeriod(earliest, true)} and {formatPeriod(end, true)}.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          {selected.length > 0 ? (
            <>
              <div className="px-3 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                  <p className="flex flex-wrap gap-x-5 gap-y-0.5 font-display text-sm text-muted">
                    <span className="font-medium text-foreground">{transformLabel}</span>
                    {effectiveScale === "log" ? <span className="font-medium text-foreground">Logarithmic axis</span> : null}
                    <span>{frequencyLabel}</span>
                    <span className="tnum">{windowLabel}</span>
                  </p>
                  {lines.length > 0 ? <div className="hidden items-center gap-x-4 sm:flex">{rangeTools}</div> : null}
                </div>
                {!absoluteAllowed ? (
                  <p id="mm-abs-note" className="mt-1 text-[0.8125rem] leading-5 text-faint">
                    Published values need one shared unit and currency; the selection mixes units.
                  </p>
                ) : null}
                <ul aria-label="Legend" className="-mx-1.5 mt-2 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                  {selected.map(({ s, slot }) => {
                    const st = slotStyle(slot);
                    const plotted = lines.some((l) => l.id === s.id);
                    return (
                      <li key={s.id} className="flex items-center">
                        <button
                          type="button"
                          aria-pressed={focusId === s.id}
                          title={focusId === s.id ? "Show every series at full strength" : "Emphasise this series"}
                          onClick={() => setFocusId((cur) => (cur === s.id ? null : s.id))}
                          className={cn(
                            "inline-flex min-h-11 items-center gap-2 px-1.5 text-left font-display text-sm sm:min-h-8",
                            focusId === s.id ? "bg-elevated text-foreground" : "text-foreground hover:bg-elevated",
                          )}
                        >
                          <Swatch color={st.color} dash={st.dash} />
                          <span className={plotted ? "" : "text-faint line-through"}>{s.label}</span>
                          <span className="hidden shrink-0 text-xs whitespace-nowrap text-faint sm:inline">{s.sourceShortName}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(s.id)}
                          aria-label={`Remove ${s.label}`}
                          className="inline-flex min-h-11 min-w-8 items-center justify-center px-1.5 text-sm text-faint hover:bg-elevated hover:text-foreground sm:min-h-8 sm:min-w-6"
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                  <li className="ml-auto px-1.5">
                    <a href="#mm-pick-title" className={textButton}>
                      Choose benchmarks
                    </a>
                  </li>
                </ul>
              </div>

              {lines.length > 0 ? (
                <>
                  <ScrollReveal kind="chart" className="mt-1">
                    <PriceChart
                      lines={lines}
                      periods={chartPeriods}
                      frequency={tab}
                      mode={effectiveView}
                      scale={effectiveScale}
                      basePeriod={indexed ? (base?.basePeriod ?? null) : null}
                      inspect={heatInspect}
                      focusId={emphasis}
                      onFocus={setFocusId}
                      label={chartTitle}
                      onSelectRange={applyWindow}
                      onZoom={zoom}
                      onPan={pan}
                      onReset={resetView}
                    />
                  </ScrollReveal>
                  {navSeries && navPeriods.length > 12 ? (
                    <RangeNavigator
                      periods={navPeriods}
                      from={vFrom}
                      to={vTo}
                      obs={navSeries.obs}
                      breaks={navSeries.sourceBreaks}
                      seriesLabel={navSeries.label}
                      onChange={(f, t) => applyWindow(navPeriods[f], navPeriods[t])}
                    />
                  ) : null}
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-border px-3 py-3 sm:hidden">
                    {bounds}
                    <div className="flex w-full items-center justify-between gap-x-4">{rangeTools}</div>
                  </div>
                </>
              ) : (
                <p className="p-6 text-sm text-muted">{base?.explanation ?? "Nothing to plot for this selection."}</p>
              )}

              <div className="plate-caption border-t border-border px-3 pb-2.5">
                <span>
                  {sourceNames.length === 1 ? "Source" : "Sources"}: {sourceNames.join("; ")}. Latest observation {formatPeriod(end, true)}
                  {latestIsEstimate ? " (estimate)" : ""}.
                </span>
                <a href="/api/export/markets.csv" download className="link-quiet">
                  Download CSV
                </a>
              </div>
            </>
          ) : (
            <p className="p-8 text-sm text-muted">Select one or more benchmarks below to plot their history.</p>
          )}
        </div>

        {notes.length > 0 ? (
          <ul className="mt-3 max-w-4xl space-y-0.5 text-[0.8125rem] leading-5 text-muted">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
        {excluded.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {excluded.map((e) => (
              <li key={e.id}>
                <span className="text-foreground">{byId.get(e.id)?.label}</span> is not plotted in the indexed view: {e.reason}
              </li>
            ))}
          </ul>
        ) : null}
        {lines.length > 0 ? (
          <p className="mt-2 text-xs leading-5 text-faint">
            <span className="hidden sm:inline">
              Drag across the chart to zoom to a range. {navPeriods.length > 12 ? "Shift-drag, or drag the strip below the chart, to pan." : "Shift-drag to pan."}{" "}
              Double-click resets the view.{" "}
            </span>
            <span className="sm:hidden">Tap or drag across the chart to read a {unitWord}. </span>A line stops where a series has no published value; nothing is
            interpolated.
          </p>
        ) : null}
      </section>

      {/* ── Frequency and series picker ───────────────────────────────── */}
      <section aria-labelledby="mm-pick-title" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border-strong pb-3">
          <h2 id="mm-pick-title" className={h2}>
            Choose benchmarks
          </h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <p aria-live="polite" className="tnum font-display text-muted">
              {`${selected.length} of ${tabSeries.length} selected`}
            </p>
            {selected.length < tabSeries.length ? (
              <button
                type="button"
                onClick={() =>
                  setSlots((cur) => ({
                    ...cur,
                    [tab]: tabSeries.reduce((acc, s) => (acc.includes(s.id) ? acc : toggleSlot(acc, s.id)), cur[tab]),
                  }))
                }
                className={textButton}
              >
                Select all
              </button>
            ) : null}
            {selected.length > 0 ? (
              <button type="button" onClick={() => setSlots((cur) => ({ ...cur, [tab]: [] }))} className={textButton}>
                Clear selection
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                setSlots((cur) => ({
                  ...cur,
                  [tab]: slotsFrom(DEFAULT_SELECTION[tab], idsByFreq[tab]),
                }))
              }
              className={textButton}
            >
              Reset
            </button>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-[0.9375rem] leading-7 text-muted">
          {tab === "monthly"
            ? "Monthly averages from the World Bank Pink Sheet and the IMF Primary Commodity Price System."
            : "Annual averages and unit values for 2021–2025 from USGS Mineral Commodity Summaries 2026; 2025 values are USGS estimates."}{" "}
          A series keeps its line style while it is selected.
        </p>

        <div className="mt-5">
          <p className="mb-3 text-xs leading-5 text-faint">
            A tile plots the material’s first listed benchmark, or removes its selected benchmarks. M = monthly data; A = annual data.
          </p>
          <div
            role="group"
            aria-label="Element-style material selector"
            className="market-tiles grid grid-cols-3 gap-px min-[410px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-9"
          >
            {groups.map(([materialId, g]) => {
              const chosen = g.items.filter((item) => slotOf(item.id) !== -1);
              const active = chosen.length > 0;
              const st = active ? slotStyle(slotOf(chosen[0].id)) : null;
              const available = materialFrequencies.get(materialId) ?? new Set<Frequency>();
              const availabilityText = [available.has("monthly") ? "Monthly" : null, available.has("annual") ? "Annual" : null].filter(Boolean).join(" · ");
              return (
                <button
                  key={materialId}
                  type="button"
                  aria-pressed={active}
                  title={`${g.name} · ${availabilityText} · ${g.items.length} ${tab} benchmark${g.items.length === 1 ? "" : "s"}`}
                  onClick={() => toggleMaterial(g.items)}
                  className={cn(
                    "group relative flex min-h-[5.5rem] min-w-0 flex-col items-start justify-between gap-1 px-3 py-2 text-left outline outline-1 focus-visible:z-10 motion-safe:transition-colors",
                    active ? "z-[1] bg-elevated text-foreground outline-foreground" : "bg-plate text-muted outline-border-strong hover:bg-elevated hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="market-tile-tip pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-20 w-max max-w-52 border border-border-strong bg-plate px-2.5 py-1.5 text-xs text-foreground opacity-0 motion-safe:transition-opacity motion-safe:duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    {g.name} · {availabilityText}
                  </span>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-display text-xl font-semibold leading-none text-foreground">{MARKET_SYMBOLS[materialId] ?? "•"}</span>
                    {st ? <Swatch color={st.color} dash={st.dash} /> : null}
                  </span>
                  <span className="w-full truncate font-display text-xs" title={g.name}>
                    {g.name}
                  </span>
                  <span className="flex w-full items-baseline justify-between gap-2 text-[0.6875rem] leading-4">
                    <span className="truncate text-faint">{active ? `${chosen.length} selected` : `${g.items.length} benchmark${g.items.length === 1 ? "" : "s"}`}</span>
                    <span className="shrink-0 font-medium text-muted" aria-label={availabilityText}>
                      {available.has("monthly") ? "M" : ""}
                      {available.has("monthly") && available.has("annual") ? " · " : ""}
                      {available.has("annual") ? "A" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-display text-base font-semibold text-foreground">Benchmark specifications</h3>
          <span className="text-xs text-faint">Grades and price bases are listed separately and never combined.</span>
        </div>
        <div className="mt-3 grid border-l border-t border-border bg-plate sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(([materialId, g]) => (
            <div key={materialId} className="border-b border-r border-border px-4 py-3">
              <h4 className="font-display text-xs text-faint">
                {g.href ? (
                  <Link href={g.href} className="hover:text-accent">
                    {g.name}
                  </Link>
                ) : (
                  g.name
                )}
              </h4>
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
                          "inline-flex min-h-11 items-center gap-2 border px-2.5 text-left font-display text-sm motion-safe:transition-colors sm:min-h-8",
                          on ? "border-foreground bg-elevated text-foreground" : "border-border-strong text-muted hover:border-foreground hover:text-foreground",
                        )}
                      >
                        {st ? (
                          <Swatch color={st.color} dash={st.dash} />
                        ) : (
                          <span aria-hidden="true" className="h-2 w-5 shrink-0 border border-dashed border-border-strong" />
                        )}
                        <span>
                          {s.label}
                          <span className="ml-1.5 text-xs text-faint">{s.unitShort}</span>
                          {s.priceType === "trade_unit_value" ? <span className="ml-1.5 text-xs text-faint">unit value</span> : null}
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

      {/* ── Latest values and changes ────────────────────────────────── */}
      {selected.length > 0 ? (
        <section aria-labelledby="mm-cards-title" className="scroll-mt-24">
          <div className="border-b border-border-strong pb-3">
            <h2 id="mm-cards-title" className={h2}>
              Latest values
            </h2>
          </div>
          <div className="mt-4 overflow-x-auto border border-border-strong bg-plate">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">
                Latest published value of each selected series and its change over fixed horizons. “e” marks an estimate; “n/a” marks a change that cannot be calculated.
              </caption>
              <thead className="bg-elevated font-display text-xs text-faint">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Series
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Latest
                  </th>
                  {HORIZONS[tab].map((h) => (
                    <th key={h.id} scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">
                      {h.label}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">
                    {windowLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {selected.map(({ s, slot }) => {
                  const st = slotStyle(slot);
                  const sum = changeSummary(s.obs, tab, s.sourceBreaks);
                  const spark = win.start ? windowObservations(s.obs, win.start, win.end) : [];
                  return (
                    <tr
                      key={s.id}
                      className={cn("border-t border-border align-top motion-safe:transition-colors", emphasis === s.id && "bg-elevated")}
                      onMouseEnter={() => setHoverId(s.id)}
                      onMouseLeave={() => setHoverId(null)}
                    >
                      <th scope="row" className="px-3 py-3 font-normal">
                        <span className="flex items-center gap-2 font-display font-medium text-foreground">
                          <Swatch color={st.color} dash={st.dash} />
                          {s.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-faint">
                          {s.sourceShortName}, {PRICE_TYPE_LABELS[s.priceType].toLowerCase()}
                        </span>
                        <span className="mt-1 block max-w-md text-xs leading-5 text-muted">{s.benchmark}</span>
                      </th>
                      <td className="tnum px-3 py-3 text-right whitespace-nowrap">
                        {sum.latest ? (
                          <>
                            <span className="font-display text-base font-semibold text-foreground">{formatNumber(sum.latest.value, s.digits)}</span>{" "}
                            <span className="text-xs text-muted">{s.unitShort}</span>
                            <span className="block text-xs text-faint">{formatObservationPeriod(sum.latest, true)}</span>
                          </>
                        ) : (
                          <span className="text-faint">n/a</span>
                        )}
                      </td>
                      {sum.changes.map(({ horizon, change, reason }) => (
                        <td key={horizon.id} className="tnum px-3 py-3 text-right whitespace-nowrap text-foreground" title={reason ?? undefined}>
                          {change ? `${formatPct(change.pct)}${change.estimated ? "e" : ""}` : <span className="text-faint">n/a</span>}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <span className="flex justify-end">
                          <Sparkline points={spark} periods={periods} breaks={s.sourceBreaks} color={st.color} dash={st.dash} unit={s.unit} width={120} height={34} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-4xl text-xs leading-5 text-faint">
            Changes compare the latest value with the value exactly {HORIZONS[tab].map((h) => `${h.lag} ${unitWord}${h.lag === 1 ? "" : "s"}`).join(" or ")} earlier.
            “n/a” means one of the two values is missing or the source changes between them; “e” marks a change that uses an estimate.
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
          <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Heatmap
              key={`${heatPeriods[0] ?? ""}-${heatPeriods.at(-1) ?? ""}`}
              rows={heatRows}
              periods={heatPeriods}
              frequency={tab}
              onInspect={(id, period) => setHeatInspect({ id, period })}
            />
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Largest moves, {moverLag} {unitWord}
                {moverLag === 1 ? "" : "s"} to {formatPeriod(commonEnd)}
              </h3>
              <p className="mt-1 text-xs leading-5 text-faint">Ranked by size of change to the latest {unitWord} all selected series share.</p>
              <ol className="mt-3 border-t border-border">
                {movers.ranked.map((m) => {
                  const s = byId.get(m.id)!;
                  const st = slotStyle(slotOf(m.id));
                  const w = (Math.abs(m.change.pct) / moverMax) * 100;
                  return (
                    <li key={m.id} className="border-b border-border py-2 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2 truncate font-display text-foreground">
                          <Swatch color={st.color} dash={st.dash} />
                          {s.label}
                        </span>
                        <span className="tnum shrink-0 text-foreground">
                          {formatPct(m.change.pct)}
                          {m.change.estimated ? "e" : ""}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 bg-elevated" aria-hidden="true">
                        <div
                          className="h-1"
                          style={{
                            width: `${w}%`,
                            background: m.change.pct >= 0 ? "var(--accent)" : "var(--negative)",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
              {movers.unranked.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs leading-5 text-muted">
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
            <a href="/api/export/markets.csv" className={textButton} download>
              Download all series (CSV)
            </a>
          </div>
          <details className="group mt-4 border border-border-strong bg-plate">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 px-4 py-2 font-display text-sm text-foreground hover:bg-elevated [&::-webkit-details-marker]:hidden">
              <span>
                Published values for the selected series, {formatPeriod(win.start)} to {formatPeriod(win.end)}
              </span>
              <span aria-hidden="true" className="ml-auto text-base leading-none text-faint group-open:hidden">
                +
              </span>
              <span aria-hidden="true" className="ml-auto hidden text-base leading-none text-faint group-open:inline">
                −
              </span>
            </summary>
            <div className="max-h-[32rem] overflow-auto border-t border-border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Published values for the selected series. “e” marks an estimate; a dash marks a period with no value.</caption>
                <thead className="sticky top-0 bg-elevated font-display text-xs text-faint">
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
