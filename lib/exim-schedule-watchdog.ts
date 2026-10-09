/**
 * M2.4 EXIM missing-cron watchdog, independent of EXIM's workflow_run audit.
 * This evaluates actual Actions runs after a daily grace window. It never
 * observes EXIM pages, restores/rewrites scanner state or classifies policy.
 */
import {
  EXIM_FIRST_BASELINE_DAY, EXIM_FIRST_BASELINE_RUN_ID,
  hasHealthyEximArtifacts, type EximActionRun,
} from "./exim-reliability";

const WATCH_HOUR_UTC = 22;
const WATCH_MINUTE_UTC = 37;
const DAYS_TO_CHECK = 7;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export type EximScheduleDay = {
  utcDay: string;
  status: "healthy" | "missing" | "failed" | "in_progress";
  observedScheduledRunIds: number[];
  acceptedRunIds: number[];
};
export type EximScheduleWatchdog = {
  version: 1;
  mode: "exim_independent_scheduled_coverage_only";
  checkedAt: string;
  firstEligibleDay: "2026-10-09";
  graceHourUtc: 22;
  graceMinuteUtc: 37;
  lastDueDay: string | null;
  expectedDays: number;
  healthyDays: number;
  days: EximScheduleDay[];
  failedScheduledRunIds: number[];
  needsAttention: boolean;
  status: "awaiting_first_due_day" | "healthy" | "attention";
  limitations: string[];
};

function dateValue(value: string): Date {
  if (!ISO_UTC.test(value)) throw Error("EXIM watchdog requires a precise UTC timestamp");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw Error("EXIM watchdog invalid UTC timestamp");
  return parsed;
}
function addUtcDays(date: string, offset: number): string {
  const parsed = dateValue(date + "T00:00:00Z");
  parsed.setUTCDate(parsed.getUTCDate() + offset);
  return parsed.toISOString().slice(0, 10);
}
const dayOf = (timestamp: string) => dateValue(timestamp).toISOString().slice(0, 10);

export function checkEximSchedule(
  runs: readonly EximActionRun[], checkedAt: string,
): EximScheduleWatchdog {
  const now = dateValue(checkedAt);
  const nowDay = now.toISOString().slice(0, 10);
  if (nowDay < EXIM_FIRST_BASELINE_DAY)
    throw Error("EXIM watchdog clock precedes verified baseline");
  const baseline = runs.find((r) => r.id === EXIM_FIRST_BASELINE_RUN_ID);
  if (!baseline || baseline.event !== "workflow_dispatch" ||
      baseline.status !== "completed" || baseline.conclusion !== "success" ||
      dayOf(baseline.createdAt) !== EXIM_FIRST_BASELINE_DAY)
    throw Error("EXIM watchdog cannot verify known first baseline identity");
  const seen = new Set<number>();
  for (const run of runs) {
    if (!Number.isSafeInteger(run.id) || run.id <= 0 ||
        !Number.isSafeInteger(run.runAttempt) || run.runAttempt < 1 ||
        seen.has(run.id))
      throw Error("EXIM watchdog malformed or duplicate Actions run");
    seen.add(run.id);
    if (dayOf(run.createdAt) > nowDay)
      throw Error("EXIM watchdog has workflow runs from the future");
  }

  // A daily source cron is due at 14:07 UTC. Allow >8 hours for GitHub
  // scheduling/runner delays; before 22:37 UTC, today's day is not due.
  const lastDueDay = (now.getUTCHours() > WATCH_HOUR_UTC ||
    (now.getUTCHours() === WATCH_HOUR_UTC &&
      now.getUTCMinutes() >= WATCH_MINUTE_UTC))
    ? nowDay : addUtcDays(nowDay, -1);
  const firstDay = addUtcDays(EXIM_FIRST_BASELINE_DAY, 1);
  const days: EximScheduleDay[] = [];
  if (lastDueDay >= firstDay) {
    const startingDay = addUtcDays(lastDueDay, -(DAYS_TO_CHECK - 1));
    for (let day = startingDay < firstDay ? firstDay : startingDay;
      day <= lastDueDay; day = addUtcDays(day, 1)) {
      const matching = runs.filter((r) => r.event === "schedule" &&
        dayOf(r.createdAt) === day);
      const accepted = matching.filter(hasHealthyEximArtifacts);
      const failed = matching.some((r) =>
        r.status === "completed" && !hasHealthyEximArtifacts(r));
      const inProgress = matching.some((r) => r.status !== "completed");
      const status: EximScheduleDay["status"] = accepted.length ? "healthy" :
        failed ? "failed" : inProgress ? "in_progress" : "missing";
      days.push({
        utcDay: day, status,
        observedScheduledRunIds: matching.map((r) => r.id).sort((a, b) => a - b),
        acceptedRunIds: accepted.map((r) => r.id).sort((a, b) => a - b),
      });
    }
  }
  const failedScheduledRunIds = runs.filter((r) => r.event === "schedule" &&
    r.status === "completed" && !hasHealthyEximArtifacts(r) &&
    days.some((d) => d.utcDay === dayOf(r.createdAt)))
    .map((r) => r.id).sort((a, b) => a - b);
  const needsAttention = days.some((d) => d.status !== "healthy") ||
    failedScheduledRunIds.length > 0;
  const status: EximScheduleWatchdog["status"] = needsAttention ? "attention" :
    days.length ? "healthy" : "awaiting_first_due_day";
  return {
    version: 1, mode: "exim_independent_scheduled_coverage_only",
    checkedAt, firstEligibleDay: "2026-10-09",
    graceHourUtc: 22, graceMinuteUtc: 37,
    lastDueDay: days.length ? lastDueDay : null,
    expectedDays: days.length,
    healthyDays: days.filter((d) => d.status === "healthy").length,
    days, failedScheduledRunIds, needsAttention, status,
    limitations: [
      "This is an independent daily GitHub Actions cron and can also be delayed or skipped; it is not an external uptime service.",
      "The EXIM scan is scheduled at 14:07 UTC; this watchdog checks after 22:37 UTC and may flag very late arrivals.",
      "A green EXIM workflow with exact state/report artifacts depends on the collector's own source-health and coverage-gap gate.",
      "The watchdog checks only the most recent seven due UTC days; it is not permanent 7/14/30-day evidence or a historical source archive.",
      "A manual EXIM workflow_dispatch cannot substitute for a missing scheduled observation.",
      "No release or financing announcement is a verified policy action without separate source-first human review.",
    ],
  };
}
export function eximScheduleMarkdown(report: EximScheduleWatchdog): string {
  return [
    "## SMPT M2.4 — independent EXIM schedule watchdog",
    "",
    "Checked at " + report.checkedAt + " UTC; scan cron 14:07 UTC; grace until 22:37 UTC.",
    "**Status:** " + report.status +
      ". Recent due scheduled days " + report.healthyDays + "/" + report.expectedDays +
      ". Never count manual runs as scheduled.",
    "",
    "| Due UTC date | Status | Actual scheduled runs | Accepted artifact-backed runs |",
    "| --- | --- | --- | --- |",
    ...report.days.map((d) => "| " + d.utcDay + " | " + d.status +
      " | " + (d.observedScheduledRunIds.join(", ") || "none") +
      " | " + (d.acceptedRunIds.join(", ") || "none") + " |"),
    "",
    "Failures even if another scheduled attempt succeeded: " +
      (report.failedScheduledRunIds.join(", ") || "none"),
    report.needsAttention
      ? "**ATTENTION:** One or more due schedule days are absent, incomplete, degraded, or have a failed scheduled run."
      : report.status === "awaiting_first_due_day"
        ? "First scheduled observation is not yet due: this run makes NO reliability claim."
        : "No missing/degraded due days within the latest seven-day window.",
    "",
    "### Limits",
    ...report.limitations.map((s) => "- " + s),
    "",
  ].join("\n") + "\n";
}
