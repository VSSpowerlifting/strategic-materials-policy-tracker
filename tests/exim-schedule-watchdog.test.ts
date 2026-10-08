import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  checkEximSchedule, eximScheduleMarkdown,
} from "@/lib/exim-schedule-watchdog";
import {
  EXIM_FIRST_BASELINE_RUN_ID, type EximActionRun,
} from "@/lib/exim-reliability";

const first: EximActionRun = {
  id: EXIM_FIRST_BASELINE_RUN_ID, runAttempt: 1, event: "workflow_dispatch",
  createdAt: "2026-10-08T15:23:55Z", status: "completed", conclusion: "success",
  artifacts: [
    { name: "smpt-exim-state-" + EXIM_FIRST_BASELINE_RUN_ID + "-1", expired: false },
    { name: "smpt-exim-report-" + EXIM_FIRST_BASELINE_RUN_ID + "-1", expired: false },
  ],
};
const day = (n: number) => {
  const d = new Date("2026-10-08T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
function scheduled(index: number, outcome: "success" | "failure" = "success",
  artifact: "complete" | "missing" | "expired" = "complete"): EximActionRun {
  const id = 991000 + index;
  return {
    id, runAttempt: 1, event: "schedule",
    createdAt: day(index) + "T14:13:00Z",
    status: "completed", conclusion: outcome,
    artifacts: outcome === "success" ? [
      { name: "smpt-exim-state-" + id + "-1", expired: artifact === "expired" },
      ...(artifact === "missing" ? [] :
        [{ name: "smpt-exim-report-" + id + "-1", expired: false }]),
    ] : [],
  };
}

test("Day 0 and pre-grace Day 1 are pending, not artificial scheduled successes", () => {
  const today = checkEximSchedule([first],
    "2026-10-08T22:39:00Z");
  assert.equal(today.status, "awaiting_first_due_day");
  assert.equal(today.needsAttention, false);
  assert.equal(today.expectedDays, 0);
  assert.match(eximScheduleMarkdown(today), /NO reliability claim/);

  const before = checkEximSchedule([first],
    "2026-10-09T22:36:59Z");
  assert.equal(before.status, "awaiting_first_due_day");
  assert.deepEqual(before.days, []);
  const due = checkEximSchedule([first],
    "2026-10-09T22:37:00Z");
  assert.equal(due.status, "attention");
  assert.equal(due.days[0].status, "missing");
  assert.equal(due.days[0].utcDay, "2026-10-09");
});

test("one actual scheduled green + unique matching state/report artifact pair satisfies first day", () => {
  const result = checkEximSchedule([first, scheduled(1)], day(1) + "T22:38:00Z");
  assert.equal(result.expectedDays, 1);
  assert.equal(result.healthyDays, 1);
  assert.equal(result.days[0].status, "healthy");
  assert.equal(result.needsAttention, false);
  assert.equal(result.status, "healthy");
  assert.deepEqual(result.days[0].acceptedRunIds, [991001]);
});

test("a manual replacement never fills a missing scheduled day", () => {
  const manual = { ...scheduled(1), id: 552200, event: "workflow_dispatch",
    artifacts: [
      { name: "smpt-exim-state-552200-1", expired: false },
      { name: "smpt-exim-report-552200-1", expired: false },
    ],
  };
  const result = checkEximSchedule([first, manual],
    day(1) + "T22:38:00Z");
  assert.equal(result.days[0].status, "missing");
  assert.equal(result.healthyDays, 0);
  assert.equal(result.needsAttention, true);
});

test("failure, no report artifact, expired state, or queued scan are not healthy", () => {
  const events = [scheduled(1, "failure"), scheduled(2, "success", "missing"),
    scheduled(3, "success", "expired"),
    { ...scheduled(4), status: "in_progress", conclusion: null, artifacts: [] }];
  const result = checkEximSchedule([first, ...events], day(4) + "T22:39:00Z");
  assert.deepEqual(result.days.map((x) => x.status),
    ["failed", "failed", "failed", "in_progress"]);
  assert.deepEqual(result.failedScheduledRunIds, [991001, 991002, 991003]);
  assert.equal(result.needsAttention, true);
  assert.equal(result.healthyDays, 0);
});

test("seven verified consecutive scheduled days form healthy rolling coverage; missed day shows separately", () => {
  const week = Array.from({ length: 7 }, (_, i) => scheduled(i + 1));
  const all = checkEximSchedule([first, ...week], day(7) + "T22:50:00Z");
  assert.equal(all.expectedDays, 7);
  assert.equal(all.healthyDays, 7);
  assert.equal(all.needsAttention, false);
  const withGap = checkEximSchedule([first, ...week.filter((x) =>
    x.id !== 991004)], day(7) + "T23:01:00Z");
  assert.equal(withGap.expectedDays, 7);
  assert.equal(withGap.healthyDays, 6);
  assert.deepEqual(withGap.days.filter((x) => x.status === "missing")
    .map((x) => x.utcDay), [day(4)]);
  const rolling = Array.from({ length: 10 }, (_, i) => scheduled(i + 1));
  const newer = checkEximSchedule([first, ...rolling], day(10) + "T22:39:00Z");
  assert.equal(newer.expectedDays, 7);
  assert.deepEqual(newer.days.map((x) => x.utcDay),
    Array.from({ length: 7 }, (_, i) => day(i + 4)));
  assert.equal(newer.healthyDays, 7);
});

test("even if same-day scheduled retry succeeds, earlier scheduled failure remains disclosed", () => {
  const bad = scheduled(1, "failure");
  const recovered = { ...scheduled(1), id: 778800, artifacts: [
    { name: "smpt-exim-state-778800-1", expired: false },
    { name: "smpt-exim-report-778800-1", expired: false },
  ] };
  const result = checkEximSchedule([first, bad, recovered],
    day(1) + "T23:50:00Z");
  assert.equal(result.days[0].status, "healthy");
  assert.equal(result.healthyDays, 1);
  assert.deepEqual(result.failedScheduledRunIds, [991001]);
  assert.equal(result.needsAttention, true);
});

test("watchdog refuses corrupt provenance, malformed clock, duplicate run, or future observation", () => {
  assert.throws(() => checkEximSchedule([], day(1) + "T23:00:00Z"),
    /known first baseline/);
  assert.throws(() => checkEximSchedule([first, first], day(1) + "T23:00:00Z"),
    /duplicate Actions run/);
  assert.throws(() => checkEximSchedule([first], "2026-10-09T17:00:00+00:00"),
    /precise UTC/);
  assert.throws(() => checkEximSchedule([first], "2026-10-07T23:00:00Z"),
    /precedes verified baseline/);
  assert.throws(() => checkEximSchedule(
    [first, scheduled(3)], day(1) + "T23:00:00Z"),
  /from the future/);
});

test("independent cron is read-only, separate, and its CLI boots offline", () => {
  const yml = readFileSync(".github/workflows/exim-schedule-watchdog.yml", "utf8");
  const script = readFileSync("scripts/check-exim-schedule.ts", "utf8");
  assert.match(yml, /cron: "37 22 \* \* \*"/);
  assert.match(yml, /workflow_dispatch:/);
  assert.match(yml, /actions: read/);
  assert.match(yml, /contents: read/);
  assert.match(yml, /persist-credentials: false/);
  assert.match(yml, /audit:exim-schedule/);
  assert.doesNotMatch(yml, /contents: write|pull-requests: write|git push|monitor:exim/);
  assert.doesNotMatch(script, /monitor:exim|data\/seed|writeFileSync\([^,]*state/);
  const output = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "audit:exim-schedule", "--", "--check-runtime"],
    { encoding: "utf8", timeout: 30_000 });
  assert.match(output, /offline, no API calls or files written/);
});
