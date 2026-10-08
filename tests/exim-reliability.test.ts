import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  auditEximActions, eximReliabilityMarkdown, hasHealthyEximArtifacts,
  EXIM_FIRST_BASELINE_RUN_ID, EXIM_FIRST_BASELINE_DAY,
  type EximActionRun,
} from "@/lib/exim-reliability";

const day = (add: number): string => {
  const d = new Date(EXIM_FIRST_BASELINE_DAY + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
};
const run = (id: number, date: string, event = "schedule",
  outcome: string | null = "success", both = true): EximActionRun => ({
  id, runAttempt: 1, event, createdAt: date + "T14:07:00Z",
  status: "completed", conclusion: outcome,
  artifacts: outcome === "success" ? [
    { name: "smpt-exim-state-" + id + "-1", expired: false },
    ...(both ? [{ name: "smpt-exim-report-" + id + "-1", expired: false }] : []),
  ] : [],
});
const baseline = (): EximActionRun => run(EXIM_FIRST_BASELINE_RUN_ID,
  EXIM_FIRST_BASELINE_DAY, "workflow_dispatch");
const scheduled = (days: number) =>
  Array.from({ length: days }, (_, n) => run(7000 + n + 1, day(n + 1)));

test("Day-0 manual bootstrap and replay cannot be mistaken for mature reliability evidence", () => {
  const manual = run(7100, day(0), "workflow_dispatch");
  const evidence = auditEximActions([baseline(), manual],
    "2026-10-08T15:42:00Z", manual.id);
  assert.equal(evidence.baselineRunId, EXIM_FIRST_BASELINE_RUN_ID);
  assert.equal(evidence.triggeredHasBothArtifacts, true);
  assert.equal(evidence.scheduledRunCount, 0);
  assert.deepEqual(evidence.milestones.map((m) => m.status),
    ["pending", "pending", "pending"]);
  assert.equal(evidence.needsAttention, false);
  assert.match(eximReliabilityMarkdown(evidence), /Pending milestones are NOT reliability claims/i);
});

test("7, 14 and 30 milestones require actual spaced healthy scheduled days", () => {
  const d7 = [...scheduled(7)];
  const e7 = auditEximActions([baseline(), ...d7], day(7) + "T15:00:00Z",
    d7.at(-1)!.id);
  assert.deepEqual(e7.milestones.map((m) => m.status), ["passed", "pending", "pending"]);
  assert.deepEqual(e7.milestones.map((m) => m.verifiedScheduledDays), [7, 7, 7]);
  const d14 = scheduled(14);
  const e14 = auditEximActions([baseline(), ...d14], day(14) + "T15:00:00Z",
    d14.at(-1)!.id);
  assert.deepEqual(e14.milestones.map((m) => m.status), ["passed", "passed", "pending"]);
  const d30 = scheduled(30);
  const e30 = auditEximActions([baseline(), ...d30], day(30) + "T15:00:00Z",
    d30.at(-1)!.id);
  assert.deepEqual(e30.milestones.map((m) => m.status), ["passed", "passed", "passed"]);
  assert.equal(e30.needsAttention, false);
});

test("manual success never fills a missed scheduled day; omitted day becomes incomplete", () => {
  const d7 = scheduled(7).filter((r) => r.createdAt.slice(0, 10) !== day(3));
  const manualReplacement = run(8100, day(3), "workflow_dispatch");
  const runs = [baseline(), ...d7, manualReplacement];
  const before = auditEximActions(runs, day(7) + "T20:00:00Z",
    d7.at(-1)!.id);
  assert.equal(before.milestones[0].status, "pending");
  assert.deepEqual(before.milestones[0].absentOrDegradedDays, [day(3)]);
  const after = auditEximActions(runs, day(8) + "T00:01:00Z",
    d7.at(-1)!.id);
  assert.equal(after.milestones[0].status, "incomplete");
  assert.equal(after.needsAttention, true);
  assert.equal(after.milestones[0].verifiedScheduledDays, 6);
  assert.equal(after.successfulScheduledRunCount, 6);
});

test("failed, artifact-less, and expired scheduled observations cannot count as green", () => {
  const failures = [
    run(8201, day(1), "schedule", "failure", false),
    run(8202, day(2), "schedule", "success", false),
    { ...run(8203, day(3)), artifacts: [
      { name: "smpt-exim-state-8203-1", expired: true },
      { name: "smpt-exim-report-8203-1", expired: false },
    ] },
  ];
  assert.equal(failures.every((r) => !hasHealthyEximArtifacts(r)), true);
  const evidence = auditEximActions([baseline(), ...failures],
    day(10) + "T16:00:00Z", failures.at(-1)!.id);
  assert.equal(evidence.milestones[0].status, "incomplete");
  assert.equal(evidence.scheduledRunFailures.length, 3);
  assert.equal(evidence.triggeredHasBothArtifacts, false);
  assert.equal(evidence.needsAttention, true);
});

test("successful same-day retry qualifies once, while failed attempts remain visible", () => {
  const days = scheduled(7);
  days.push(run(8300, day(4), "schedule", "failure"));
  const audit = auditEximActions([baseline(), ...days],
    day(7) + "T17:00:00Z", days[6].id);
  assert.equal(audit.milestones[0].status, "passed");
  assert.equal(audit.milestones[0].verifiedScheduledDays, 7);
  assert.deepEqual(audit.scheduledRunFailures.map((x) => x.runId), [8300]);
});

test("audit fails closed when source bootstrap or triggering run provenance is absent", () => {
  assert.throws(() => auditEximActions(
    scheduled(7), day(8) + "T00:00:00Z", 7007), /initial verified first-run baseline/);
  assert.throws(() => auditEximActions(
    [baseline(), ...scheduled(7)], day(8) + "T00:00:00Z", 999999), /trigger run missing/);
  assert.throws(() => auditEximActions(
    [baseline(), baseline()], day(8) + "T00:00:00Z", EXIM_FIRST_BASELINE_RUN_ID),
    /repeated workflow run identity/);
  assert.throws(() => auditEximActions(
    [baseline()], "not a date", EXIM_FIRST_BASELINE_RUN_ID), /invalid ISO timestamp/);
  assert.throws(() => auditEximActions(
    [{ ...baseline(), conclusion: "failure" }], day(1) + "T12:00:00Z",
    EXIM_FIRST_BASELINE_RUN_ID), /initial verified first-run baseline/);
});

test("independent EXIM reliability workflow cannot mutate monitor state or publish data", () => {
  const yml = readFileSync(".github/workflows/exim-reliability-evidence.yml", "utf8");
  assert.match(yml, /workflow_run:/);
  assert.match(yml, /workflows: \["SMPT EXIM shadow monitoring"\]/);
  assert.match(yml, /head_branch == 'main'/);
  assert.match(yml, /actions: read/);
  assert.match(yml, /contents: read/);
  assert.match(yml, /audit:exim/);
  assert.match(yml, /retention-days: 30/);
  assert.doesNotMatch(yml, /contents: write|pull-requests: write|git push|data\/seed|monitor:exim/);
  const output = execFileSync("npx", ["tsx", "scripts/audit-exim-reliability.ts", "--check-runtime"],
    { encoding: "utf8", timeout: 15_000 });
  assert.match(output, /no API reads or writes/);
});
