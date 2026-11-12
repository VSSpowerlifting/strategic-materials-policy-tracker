import test from "node:test";
import assert from "node:assert/strict";
import {
  MIN_WINDOW_STEPS,
  buildYScale,
  clampWindow,
  interiorGaps,
  keepNonOverlapping,
  lineSegments,
  logTicks,
  matchPreset,
  niceTicks,
  panWindow,
  parsePeriodWindow,
  pickActive,
  resolvePeriodWindow,
  seriesExtremes,
  spreadLabels,
  timeTicks,
  zoomWindow,
} from "@/components/markets/chart-math";
import { heatLevel } from "@/components/markets/heatmap";
import { getMarketSeries, getObservations } from "@/lib/market-data";
import { periodRange, type Observation, type SourceBreak } from "@/lib/markets";

const x = (p: string) => Number(p.slice(0, 4)) * 12 + Number(p.slice(5, 7));
const y = (v: number) => v;
const months = periodRange("2024-01", "2024-06");

/** Every "x,y" vertex of a set of path strings, in drawing order. */
function vertices(paths: readonly string[]): string[] {
  return paths.flatMap((d) => d.replace(/^M/, "").split("L"));
}

test("a line is one straight step between consecutive published observations, and nothing else", () => {
  const obs: Observation[] = months.map((period, i) => ({ period, value: 10 + i * i }));
  const { segments, singles } = lineSegments(obs, months, [], x, y);
  assert.equal(segments.length, 1);
  assert.equal(singles.length, 0);
  // Only M and L commands: no curve, arc or smoothing command can appear.
  assert.match(segments[0].d, /^M[-\d.,L]+$/);
  // One vertex per observation, each at exactly the published value.
  assert.deepEqual(
    vertices([segments[0].d]),
    obs.map((o) => `${x(o.period).toFixed(1)},${o.value.toFixed(1)}`),
  );
});

test("a missing observation is a gap: the line stops and is never bridged", () => {
  const obs: Observation[] = [
    { period: "2024-01", value: 10 },
    { period: "2024-02", value: 12 },
    { period: "2024-04", value: 20 },
    { period: "2024-05", value: 21 },
  ];
  const { segments, singles } = lineSegments(obs, months, [], x, y);
  assert.equal(segments.length, 2);
  assert.equal(singles.length, 0);
  assert.deepEqual(vertices([segments[0].d]).length, 2);
  assert.deepEqual(vertices([segments[1].d]).length, 2);
  // No vertex is placed at the missing month.
  assert.ok(!vertices(segments.map((s) => s.d)).some((v) => v.startsWith(`${x("2024-03").toFixed(1)},`)));
  assert.deepEqual(interiorGaps(obs, months), ["2024-03"]);
});

test("time before a series starts or after it ends is not a gap in it", () => {
  const obs: Observation[] = [
    { period: "2024-03", value: 5 },
    { period: "2024-04", value: 6 },
  ];
  assert.deepEqual(interiorGaps(obs, months), []);
  assert.deepEqual(interiorGaps([{ period: "2024-03", value: 5 }], months), []);
});

test("an observation with no published neighbour is drawn as a point, not joined", () => {
  const obs: Observation[] = [
    { period: "2024-01", value: 10 },
    { period: "2024-03", value: 14 },
    { period: "2024-04", value: 15 },
  ];
  const { segments, singles } = lineSegments(obs, months, [], x, y);
  assert.equal(segments.length, 1);
  assert.deepEqual(
    singles.map((s) => s.period),
    ["2024-01"],
  );
  assert.equal(singles[0].cy, 10);
});

test("a stated source break ends the line at the break period", () => {
  const obs: Observation[] = months.map((period, i) => ({ period, value: 100 + i }));
  const breaks: SourceBreak[] = [{ period: "2024-04", statedAs: "new underlying quotation" }];
  const { segments } = lineSegments(obs, months, breaks, x, y);
  assert.equal(segments.length, 2);
  assert.equal(vertices([segments[0].d]).at(-1), `${x("2024-03").toFixed(1)},102.0`);
  assert.equal(vertices([segments[1].d])[0], `${x("2024-04").toFixed(1)},103.0`);
});

test("a step that touches an estimate is kept apart so it can be drawn dotted", () => {
  const years = periodRange("2021", "2025");
  const obs: Observation[] = [
    { period: "2021", value: 1 },
    { period: "2022", value: 2 },
    { period: "2023", value: 3 },
    { period: "2024", value: 4 },
    { period: "2025", value: 5, estimated: true },
  ];
  const yx = (p: string) => Number(p);
  const { segments } = lineSegments(obs, years, [], yx, y);
  assert.deepEqual(
    segments.map((s) => s.estimated),
    [false, true],
  );
  assert.equal(vertices([segments[0].d]).length, 4);
  assert.deepEqual(vertices([segments[1].d]), ["2024.0,4.0", "2025.0,5.0"]);
});

test("stored series draw one vertex per published observation, with breaks only where stated", () => {
  for (const s of getMarketSeries()) {
    const obs = getObservations(s.id);
    const periods = periodRange(obs[0].period, obs.at(-1)!.period);
    const index = new Map(periods.map((p, i) => [p, i]));
    const { segments, singles } = lineSegments(obs, periods, s.sourceBreaks ?? [], (p) => index.get(p) ?? -1, y);
    const drawn = new Set([...vertices(segments.map((seg) => seg.d)).map((v) => Number(v.split(",")[0])), ...singles.map((p) => p.cx)]);
    assert.equal(drawn.size, obs.length, `${s.id}: every observation is drawn once`);
    const stated = (s.sourceBreaks ?? []).filter((b) => index.has(b.period) && b.period !== periods[0]).length;
    const gaps = interiorGaps(obs, periods).length;
    if (stated === 0 && gaps === 0) {
      const runs = segments.reduce((n, seg, i) => (i > 0 && vertices([segments[i - 1].d]).at(-1) === vertices([seg.d])[0] ? n : n + 1), 0);
      assert.equal(runs, 1, `${s.id}: an unbroken series is one continuous line`);
    }
  }
});

test("round ticks cover the range and stay evenly spaced", () => {
  assert.deepEqual(niceTicks(0, 100, 5), [0, 25, 50, 75, 100]);
  const ticks = niceTicks(87, 213, 5);
  assert.ok(ticks[0] <= 87 && ticks.at(-1)! >= 213);
  const steps = ticks.slice(1).map((t, i) => Number((t - ticks[i]).toFixed(6)));
  assert.ok(steps.every((s) => s === steps[0]));
  assert.deepEqual(niceTicks(Number.NaN, 1), []);
  assert.ok(niceTicks(5, 5).length >= 2);
});

test("the linear value axis fits the plotted values and positions them exactly", () => {
  const values = [158, 198, 170, 167, 180];
  const scale = buildYScale(values, "linear", 5);
  assert.equal(scale.kind, "linear");
  assert.ok(scale.min < 158 && scale.min > 150, "the domain hugs the lowest value");
  assert.ok(scale.max > 198 && scale.max < 205, "the domain hugs the highest value");
  assert.ok(scale.ticks.every((t) => t >= scale.min && t <= scale.max));
  // Linear: equal value differences are equal distances.
  assert.ok(Math.abs(scale.at(178) - scale.at(158) - (scale.at(198) - scale.at(178))) < 1e-12);
  assert.ok(scale.at(158) > 0 && scale.at(198) < 1);
});

test("a linear axis over non-negative values never dips below zero", () => {
  const scale = buildYScale([0.2, 50, 100], "linear");
  assert.ok(scale.min >= 0);
});

test("the logarithmic axis places values by ratio and leaves them unaltered", () => {
  const scale = buildYScale([100, 1000, 10000], "log");
  assert.equal(scale.kind, "log");
  // Log: equal ratios are equal distances.
  assert.ok(Math.abs(scale.at(1000) - scale.at(100) - (scale.at(10000) - scale.at(1000))) < 1e-12);
  assert.ok(scale.ticks.length >= 3);
  assert.ok(scale.ticks.every((t) => t >= scale.min && t <= scale.max));
  assert.ok(scale.ticks.includes(1000));
});

test("a logarithmic axis is refused when a value is zero or negative", () => {
  assert.equal(buildYScale([0, 10, 100], "log").kind, "linear");
  assert.equal(buildYScale([-5, 10, 100], "log").kind, "linear");
});

test("log ticks use round 1-2-5 values and fall back to linear values over a narrow range", () => {
  assert.deepEqual(logTicks(1, 1000, 4), [1, 10, 100, 1000]);
  const narrow = logTicks(95, 130, 5);
  assert.ok(narrow.length >= 3);
  assert.ok(narrow.every((t) => t >= 95 && t <= 130));
  assert.deepEqual(logTicks(0, 10), []);
  assert.deepEqual(logTicks(10, 10), []);
});

test("highs and lows are published observations in view", () => {
  const obs: Observation[] = [
    { period: "2021", value: 158 },
    { period: "2022", value: 198 },
    { period: "2023", value: 170 },
    { period: "2024", value: 167 },
    { period: "2025", value: 180, estimated: true },
  ];
  assert.deepEqual(seriesExtremes(obs), [
    { kind: "high", period: "2022", value: 198, estimated: false },
    { kind: "low", period: "2021", value: 158, estimated: false },
  ]);
  const estimatedHigh = seriesExtremes([...obs.slice(0, 4), { period: "2025", value: 300, estimated: true }]);
  assert.equal(estimatedHigh[0].estimated, true);
  assert.deepEqual(seriesExtremes(obs.slice(0, 2)), [], "two points have no meaningful high and low");
  assert.deepEqual(
    seriesExtremes([
      { period: "2021", value: 4 },
      { period: "2022", value: 4 },
      { period: "2023", value: 4 },
    ]),
    [],
    "a flat series has none",
  );
});

test("overlapping annotations are dropped, not moved onto another value", () => {
  const boxes = [
    { x: 0, y: 0, w: 50, h: 14 },
    { x: 40, y: 5, w: 50, h: 14 },
    { x: 200, y: 0, w: 50, h: 14 },
  ];
  assert.deepEqual(keepNonOverlapping(boxes), [true, false, true]);
});

test("axis value tags are spread apart but stay inside the plot and in order", () => {
  const out = spreadLabels([100, 102, 104, 300], 16, 20, 320);
  assert.ok(out[1] - out[0] >= 16 && out[2] - out[1] >= 16);
  assert.ok(out.every((v) => v >= 20 && v <= 320));
  assert.deepEqual([...out].sort((a, b) => a - b), out);
  assert.deepEqual(spreadLabels([], 16, 0, 100), []);
});

test("annual data gets a tick for every year; monthly ticks are calendar-aligned", () => {
  const annual = timeTicks(periodRange("2021", "2025"), "annual", 8);
  assert.deepEqual(annual.ticks, ["2021", "2022", "2023", "2024", "2025"]);
  assert.equal(annual.yearOnly, true);

  const fiveYears = timeTicks(periodRange("2021-10", "2026-10"), "monthly", 10);
  assert.ok(fiveYears.ticks.length <= 11);
  assert.ok(fiveYears.ticks.every((p) => p.endsWith("-01") || p.endsWith("-07")));

  const long = timeTicks(periodRange("2005-01", "2026-10"), "monthly", 10);
  assert.equal(long.yearOnly, true);
  assert.ok(long.ticks.every((p) => p.endsWith("-01")));
});

test("the visible window stays inside the published periods", () => {
  assert.deepEqual(clampWindow({ from: -5, to: 20 }, 10), { from: 0, to: 9 });
  assert.deepEqual(clampWindow({ from: 8, to: 14 }, 10), { from: 3, to: 9 });
  assert.deepEqual(clampWindow({ from: 4, to: 4 }, 10), { from: 4, to: 4 + MIN_WINDOW_STEPS });
});

test("zooming keeps the anchor in place, always moves, and stops at the limits", () => {
  const n = 262;
  const start = { from: 201, to: 261 };
  const zoomedIn = zoomWindow(start, 0.6, 261, n);
  assert.equal(zoomedIn.to, 261, "anchored on the latest period");
  assert.equal(zoomedIn.to - zoomedIn.from, 36);
  const zoomedOut = zoomWindow(start, 1.6, 261, n);
  assert.equal(zoomedOut.to, 261);
  assert.equal(zoomedOut.to - zoomedOut.from, 96);
  // A press mid-range always changes the window, even when rounding would not.
  const nudged = zoomWindow({ from: 10, to: 12 }, 0.9, 11, n);
  assert.equal(nudged.to - nudged.from, 1);
  assert.ok(nudged.from <= 11 && nudged.to >= 11, "the anchor stays in view");
  assert.deepEqual(zoomWindow({ from: 10, to: 11 }, 1.1, 11, n), { from: 9, to: 11 });
  // Limits: never narrower than two observations, never wider than the published range.
  assert.deepEqual(zoomWindow({ from: 10, to: 11 }, 0.5, 10, n), { from: 10, to: 11 });
  assert.deepEqual(zoomWindow({ from: 0, to: n - 1 }, 2, 100, n), { from: 0, to: n - 1 });
});

test("panning keeps the window's length and stops at either end", () => {
  assert.deepEqual(panWindow({ from: 100, to: 160 }, -12, 262), { from: 88, to: 148 });
  assert.deepEqual(panWindow({ from: 5, to: 65 }, -12, 262), { from: 0, to: 60 });
  assert.deepEqual(panWindow({ from: 201, to: 261 }, 12, 262), { from: 201, to: 261 });
});

test("a custom range is read only from two well-formed periods of the tab's frequency, in order", () => {
  assert.deepEqual(parsePeriodWindow("2015-03", "2020-06", "monthly"), { from: "2015-03", to: "2020-06" });
  assert.deepEqual(parsePeriodWindow("2021", "2024", "annual"), { from: "2021", to: "2024" });
  assert.equal(parsePeriodWindow("2020-06", "2015-03", "monthly"), null);
  assert.equal(parsePeriodWindow("2020-06", "2020-06", "monthly"), null);
  assert.equal(parsePeriodWindow("2021", "2024", "monthly"), null);
  assert.equal(parsePeriodWindow("2015-13", "2020-06", "monthly"), null);
  assert.equal(parsePeriodWindow(null, "2020-06", "monthly"), null);
  assert.equal(parsePeriodWindow("<script>", "2020-06", "monthly"), null);
});

test("a custom range is clipped to the published range, never extended past it", () => {
  assert.deepEqual(resolvePeriodWindow({ from: "1990-01", to: "2030-01" }, "2005-01", "2026-10"), { from: "2005-01", to: "2026-10" });
  assert.deepEqual(resolvePeriodWindow({ from: "2015-03", to: "2020-06" }, "2005-01", "2026-10"), { from: "2015-03", to: "2020-06" });
  assert.equal(resolvePeriodWindow({ from: "1990-01", to: "2000-01" }, "2005-01", "2026-10"), null);
  assert.equal(resolvePeriodWindow(null, "2005-01", "2026-10"), null);
  assert.equal(resolvePeriodWindow({ from: "2015-03", to: "2020-06" }, "", ""), null);
});

test("a window that coincides with a preset reads as that preset", () => {
  assert.equal(matchPreset("monthly", { from: "2021-10", to: "2026-10" }, "2005-01", "2026-10"), "5y");
  assert.equal(matchPreset("monthly", { from: "2005-01", to: "2026-10" }, "2005-01", "2026-10"), "max");
  assert.equal(matchPreset("monthly", { from: "2021-09", to: "2026-10" }, "2005-01", "2026-10"), null);
  assert.equal(matchPreset("monthly", { from: "2021-10", to: "2026-09" }, "2005-01", "2026-10"), null);
});

test("the crosshair reads only a series with a published value at that period", () => {
  const candidates = [
    { id: "a", y: 100 },
    { id: "b", y: 220 },
  ];
  assert.equal(pickActive([], 50, "a"), null);
  assert.equal(pickActive(candidates, 210, null), "b");
  assert.equal(pickActive(candidates, 210, "a"), "a", "the emphasised series wins when it has a value");
  assert.equal(pickActive(candidates, 210, "c"), "b", "an emphasised series without a value there is skipped");
  assert.equal(pickActive(candidates, null, null), "a");
});

test("heatmap tint steps are signed, bounded and zero only for no change", () => {
  assert.equal(heatLevel(0, 20), 0);
  assert.equal(heatLevel(Number.NaN, 20), 0);
  assert.equal(heatLevel(0.1, 20), 1);
  assert.equal(heatLevel(-0.1, 20), -1);
  assert.equal(heatLevel(10, 20), 2);
  assert.equal(heatLevel(20, 20), 4);
  assert.equal(heatLevel(250, 20), 4);
  assert.equal(heatLevel(-250, 20), -4);
});
