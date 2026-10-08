/**
 * M2.2 EXIM-only read-only reliability evidence.
 *
 * Data are GitHub Actions run metadata plus exact state/report artifact names.
 * This does NOT read publication text, approve a review item, modify EXIM
 * identity state, or infer that a scheduled cron ran when it did not.
 */
export const EXIM_FIRST_BASELINE_RUN_ID = 37800436243;
export const EXIM_FIRST_BASELINE_DAY = "2026-10-08";
export const EXIM_RELIABILITY_WINDOWS = [7, 14, 30] as const;

export type EximActionArtifact = { name: string; expired: boolean };
export type EximActionRun = {
  id: number;
  runAttempt: number;
  event: string;
  createdAt: string;
  status: string;
  conclusion: string | null;
  artifacts: EximActionArtifact[];
};
export type EximReliabilityMilestone = {
  days: 7 | 14 | 30;
  eligibleDay: string;
  status: "pending" | "passed" | "incomplete";
  requiredScheduledDays: number;
  verifiedScheduledDays: number;
  absentOrDegradedDays: string[];
};
export type EximReliabilityAudit = {
  version: 1;
  mode: "exim_actions_reliability_evidence_only";
  checkedAt: string;
  baselineRunId: typeof EXIM_FIRST_BASELINE_RUN_ID;
  baselineDay: typeof EXIM_FIRST_BASELINE_DAY;
  triggeredRunId: number;
  triggeredEvent: string;
  triggeredConclusion: string | null;
  triggeredHasBothArtifacts: boolean;
  scheduledRunCount: number;
  successfulScheduledRunCount: number;
  scheduledRunFailures: { runId: number; day: string; conclusion: string | null }[];
  milestones: EximReliabilityMilestone[];
  needsAttention: boolean;
  limitations: string[];
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
function utcDay(date: string): string {
  const milliseconds = Date.parse(date);
  if (!Number.isFinite(milliseconds) || !/^\d{4}-\d{2}-\d{2}T/.test(date))
    throw Error("EXIM audit received invalid ISO timestamp: " + date);
  return new Date(milliseconds).toISOString().slice(0, 10);
}
function addDays(day: string, increment: number): string {
  if (!ISO_DAY.test(day) || Number.isNaN(Date.parse(day + "T00:00:00Z")))
    throw Error("EXIM audit invalid UTC calendar day");
  const dt = new Date(day + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + increment);
  return dt.toISOString().slice(0, 10);
}
export function hasHealthyEximArtifacts(run: EximActionRun): boolean {
  if (run.status !== "completed" || run.conclusion !== "success" ||
      !Number.isSafeInteger(run.id) || !Number.isSafeInteger(run.runAttempt) ||
      run.runAttempt < 1) return false;
  const found = new Set(run.artifacts.filter((a) => a.expired === false).map((a) => a.name));
  return found.has("smpt-exim-state-" + run.id + "-" + run.runAttempt) &&
    found.has("smpt-exim-report-" + run.id + "-" + run.runAttempt);
}

export function auditEximActions(
  runs: readonly EximActionRun[], checkedAt: string, triggeredRunId: number,
): EximReliabilityAudit {
  const checkedDay = utcDay(checkedAt);
  const ids = new Set<number>();
  for (const run of runs) {
    if (!Number.isSafeInteger(run.id) || run.id < 1 || ids.has(run.id))
      throw Error("EXIM audit found invalid or repeated workflow run identity");
    ids.add(run.id);
    utcDay(run.createdAt);
  }
  const anchor = runs.find((r) => r.id === EXIM_FIRST_BASELINE_RUN_ID);
  if (!anchor || anchor.status !== "completed" || anchor.conclusion !== "success" ||
      utcDay(anchor.createdAt) !== EXIM_FIRST_BASELINE_DAY ||
      anchor.event !== "workflow_dispatch")
    throw Error("EXIM initial verified first-run baseline absent or inconsistent; refuse invented maturity");
  const trigger = runs.find((r) => r.id === triggeredRunId);
  if (!trigger || trigger.status !== "completed")
    throw Error("EXIM audit trigger run missing or incomplete");
  if (checkedDay < EXIM_FIRST_BASELINE_DAY)
    throw Error("EXIM reliability checked before verified bootstrap");
  const scheduled = runs.filter((r) => r.event === "schedule" &&
    utcDay(r.createdAt) > EXIM_FIRST_BASELINE_DAY);
  const verified = new Set(
    scheduled.filter(hasHealthyEximArtifacts).map((r) => utcDay(r.createdAt)),
  );
  const failures = scheduled.filter((r) =>
    r.status === "completed" && (!hasHealthyEximArtifacts(r)))
    .map((r) => ({
      runId: r.id, day: utcDay(r.createdAt), conclusion: r.conclusion,
    }));
  const milestones = EXIM_RELIABILITY_WINDOWS.map((days): EximReliabilityMilestone => {
    const eligibleDay = addDays(EXIM_FIRST_BASELINE_DAY, days);
    let verifiedDays = 0;
    const absentOrDegradedDays: string[] = [];
    for (let d = 1; d <= days; d++) {
      const date = addDays(EXIM_FIRST_BASELINE_DAY, d);
      // Do not claim a future calendar day was missed before it arrived.
      if (date > checkedDay) continue;
      if (verified.has(date)) verifiedDays++;
      else absentOrDegradedDays.push(date);
    }
    // The final day may be legitimately waiting on the scheduled workflow;
    // an incomplete milestone is asserted only from the following UTC day.
    const status = verifiedDays === days ? "passed" :
      eligibleDay >= checkedDay ? "pending" : "incomplete";
    return { days, eligibleDay, status,
      requiredScheduledDays: days, verifiedScheduledDays: verifiedDays,
      absentOrDegradedDays };
  });
  const triggerArtifacts = hasHealthyEximArtifacts(trigger);
  const needsAttention = trigger.conclusion !== "success" || !triggerArtifacts ||
    milestones.some((m) => m.status === "incomplete");
  return {
    version: 1, mode: "exim_actions_reliability_evidence_only",
    checkedAt, baselineRunId: EXIM_FIRST_BASELINE_RUN_ID,
    baselineDay: EXIM_FIRST_BASELINE_DAY,
    triggeredRunId, triggeredEvent: trigger.event,
    triggeredConclusion: trigger.conclusion,
    triggeredHasBothArtifacts: triggerArtifacts,
    scheduledRunCount: scheduled.length,
    successfulScheduledRunCount: scheduled.filter(hasHealthyEximArtifacts).length,
    scheduledRunFailures: failures, milestones, needsAttention,
    limitations: [
      "Manual workflow dispatches never substitute for missing scheduled observation days.",
      "Run status plus archived artifact names do not independently revalidate report.json; the EXIM workflow's health gate performs that check.",
      "A successful listing scan does not prove historical source completeness or absence of false revision alerts.",
      "GitHub cron can be delayed or skipped, and 30-day artifacts are not permanent retention.",
      "No EXIM publication is a verified policy event or binding financial commitment without separate source-first human review.",
    ],
  };
}

export function eximReliabilityMarkdown(a: EximReliabilityAudit): string {
  return [
    "## SMPT M2.2 — EXIM operational reliability evidence",
    "",
    "As assessed: " + a.checkedAt + " (UTC). Baseline run #" + a.baselineRunId +
      " on " + a.baselineDay + ".",
    "Triggered EXIM workflow run #" + a.triggeredRunId + " (" + a.triggeredEvent +
      "): " + (a.triggeredConclusion ?? "unknown") + "; both expected artifacts: " +
      (a.triggeredHasBothArtifacts ? "present" : "MISSING"),
    "",
    "| Calendar milestone | Status | Verified scheduled UTC days | Missing / degraded days observed |",
    "| --- | --- | ---: | --- |",
    ...a.milestones.map((m) =>
      "| Day " + m.days + " (after " + m.eligibleDay + ") | " +
      m.status + " | " + m.verifiedScheduledDays + "/" +
      m.requiredScheduledDays + " | " +
      (m.absentOrDegradedDays.join(", ") || "none") + " |"),
    "",
    "Completed scheduled runs checked: " + a.scheduledRunCount +
      "; with both required state/report artifacts: " + a.successfulScheduledRunCount + ".",
    "Scheduled run failures/missing artifact pairs: " +
      a.scheduledRunFailures.length + ".",
    a.needsAttention ? "**ATTENTION:** trigger failure, artifact problem, or matured cadence gap. See JSON."
      : "No current trigger or matured cadence alert. Pending milestones are NOT reliability claims.",
    "",
    "### Limits",
    ...a.limitations.map((x) => "- " + x),
    "",
  ].join("\n") + "\n";
}
