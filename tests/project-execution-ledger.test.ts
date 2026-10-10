import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { getAllFinancialCommitments, getAllProjectMilestones, getFinancialCommitmentById } from "@/lib/data";
import {
  isMilestoneIsoDate, milestoneEvidenceBoundary, validateProjectMilestones,
} from "@/lib/project-milestones";
import { auditLegacyProjectExecution, formatLegacyExecutionAudit } from "@/lib/project-execution-audit";
import type { FinancialCommitment, ProjectMilestone, Source } from "@/lib/types";

const source: Pick<Source, "id" | "language" | "confidence" | "datePublished" | "dateAccessed"> = {
  id: "src-fixture-primary", language: "en", confidence: "primary",
  datePublished: "2026-09-15", dateAccessed: "2026-09-20",
};
const refs = {
  projects: [{ id: "prj-fixture-one" }, { id: "prj-fixture-two" }],
  sources: [source],
  corpusDate: "2026-10-08",
};
const fixture = (): ProjectMilestone => ({
  id: "mil-fixture-one", projectId: "prj-fixture-one", kind: "construction_started",
  claimMode: "occurred", scope: "named_facility", scopeAsStated: "Demo plant",
  occurredOn: "2026-09-01", targetOn: null, sourceId: source.id, locator: "p. 3",
  statementOriginal: "Construction of the demonstration plant began.",
  statementEn: "Construction of the demonstration plant began.",
  statementEnSource: "na", reviewedBy: "Human verifier", reviewedAt: "2026-10-07",
});

test("public milestone seed remains empty; no inferred verified project milestones", () => {
  assert.deepEqual(getAllProjectMilestones(), []);
});

test("valid explicitly scoped, human-reviewed primary milestone; event and evidence dates stay separate", () => {
  const m = fixture();
  assert.deepEqual(validateProjectMilestones([m], refs), []);
  assert.deepEqual(milestoneEvidenceBoundary(source), { date: "2026-09-15", basis: "publication" });
  assert.equal(m.occurredOn, "2026-09-01");
  assert.deepEqual(milestoneEvidenceBoundary({ ...source, datePublished: null }),
    { date: "2026-09-20", basis: "access" });
  assert.deepEqual(validateProjectMilestones([{ ...m, occurredOn: null }], refs), [],
    "a review can establish occurrence without establishing its exact date");
  assert.deepEqual(validateProjectMilestones([], refs), []);
});

test("calendar dates are actually validated, including leap-day and rollover", () => {
  assert.equal(isMilestoneIsoDate("2024-02-29"), true);
  for (const bad of ["2025-02-29", "2026-02-30", "2026-13-01", "2026-00-01", "2026-01-1", "1800-01-01"])
    assert.equal(isMilestoneIsoDate(bad), false, bad);
});

test("source, scope, review, status, and dates fail closed on fixed counterexamples", () => {
  const checks: { name: string; change: Partial<ProjectMilestone>; message: RegExp }[] = [
    { name: "unresolved project", change: { projectId: "prj-ghost" }, message: /projectId does not resolve/ },
    { name: "unresolved source", change: { sourceId: "src-ghost" }, message: /sourceId does not resolve/ },
    { name: "incorrect id prefix", change: { id: "fin-bad" }, message: /canonical mil-/ },
    { name: "unquoted evidence", change: { statementOriginal: "" }, message: /short genuine anchor/ },
    { name: "no translation", change: { statementEn: "" }, message: /short anchor\/translation/ },
    { name: "unreviewed assertion", change: { reviewedBy: "" }, message: /reviewedBy is required/ },
    { name: "bad review date", change: { reviewedAt: "2026-02-30" }, message: /reviewedAt must be a real ISO/ },
    { name: "missing facility identity", change: { scopeAsStated: null }, message: /scopeAsStated/ },
    { name: "false whole-scope extension", change: { scope: "whole_project" }, message: /whole_project requires/ },
    { name: "future occurred assertion", change: { occurredOn: "2027-04-01" }, message: /planned targets/ },
    { name: "inconsistent actual target", change: { targetOn: "2027-04-01" }, message: /targetOn: null/ },
    { name: "impossible occurred date", change: { occurredOn: "2026-02-30" }, message: /occurredOn must be a real ISO/ },
    { name: "review before evidence", change: { reviewedAt: "2026-09-01" }, message: /before source publication\/access evidence boundary/ },
    { name: "funded work wrongly asserted project-wide", change: { kind: "funded_activity_completed", scope: "whole_project", scopeAsStated: null }, message: /funded_activity_completed requires funded_activity scope/ },
    { name: "funded work masquerades as facility operations", change: { scope: "funded_activity" }, message: /funded_activity scope cannot assert facility/ },
    { name: "event later than its cited source", change: { occurredOn: "2026-09-16" }, message: /occurredOn is later than the cited source/ },
  ];
  for (const check of checks) {
    const issues = validateProjectMilestones([{ ...fixture(), ...check.change }], refs);
    assert.ok(issues.some((i) => check.message.test(i)),
      check.name + ": " + JSON.stringify(issues));
  }
  assert.match(validateProjectMilestones({}, refs).join(" "), /seed must be an array/);
  assert.match(validateProjectMilestones([fixture(), fixture()], refs).join(" "), /duplicate id/);
  assert.match(validateProjectMilestones([fixture(), { ...fixture(), id: "mil-fixture-a" }], refs).join(" "),
    /strictly ascending/);
});

test("undated publisher uses source-access observation boundary without pre-access reviews", () => {
  const accessOnly = { ...refs, sources: [{ ...source, datePublished: null }] };
  const early = { ...fixture(), reviewedAt: "2026-09-19" };
  assert.match(validateProjectMilestones([early], accessOnly).join(" "), /review occurred before source publication\/access evidence boundary/);
  assert.deepEqual(validateProjectMilestones([{ ...fixture(), reviewedAt: "2026-09-20" }], accessOnly), []);
});

test("reject source dates after corpus cutoff and malformed publication claims", () => {
  const afterCutoff = { ...refs, sources: [{ ...source, datePublished: null, dateAccessed: "2026-10-09" }] };
  assert.match(validateProjectMilestones([fixture()], afterCutoff).join(" "), /source evidence boundary is after corpus cutoff/);
  const malformed = { ...refs, sources: [{ ...source, datePublished: "2026-02-30" }] };
  assert.match(validateProjectMilestones([fixture()], malformed).join(" "), /source publication date is invalid/);
  const preEvent = { ...refs, sources: [{ ...source, datePublished: "2026-08-31" }] };
  assert.match(validateProjectMilestones([fixture()], preEvent).join(" "), /occurredOn is later than the cited source/);
});

test("funded activity completion never masquerades as whole-project or facility execution", () => {
  const acceptable = {
    ...fixture(), kind: "funded_activity_completed" as const,
    scope: "funded_activity" as const, scopeAsStated: "Grant-funded extended operations",
  };
  assert.deepEqual(validateProjectMilestones([acceptable], refs), []);
  assert.match(validateProjectMilestones([{ ...acceptable, scope: "whole_project", scopeAsStated: null }], refs).join(" "),
    /funded_activity_completed requires funded_activity scope/);
});

test("planned future targets never acquire occurrence merely because a target date passed", () => {
  const m = { ...fixture(), claimMode: "planned" as const, occurredOn: null, targetOn: "2026-01-01" };
  assert.deepEqual(validateProjectMilestones([m], refs), []);
  assert.match(validateProjectMilestones([{ ...m, occurredOn: "2026-01-01" }], refs).join(" "), /cannot have occurredOn/);
  assert.match(validateProjectMilestones([{ ...m, targetOn: "2026-02-30" }], refs).join(" "), /targetOn must be/);
  assert.match(validateProjectMilestones([{ ...m, kind: "project_cancelled" }], refs).join(" "), /planned cessation/);
});

test("English quote provenance, secondary sources, duplicate identities and bounded notes are enforced", () => {
  const m = fixture();
  assert.match(validateProjectMilestones([{ ...m, statementEnSource: "self" }], refs).join(" "), /English primary passage/);
  assert.match(validateProjectMilestones([m], {
    ...refs, sources: [{ ...source, confidence: "secondary" as const }],
  }).join(" "), /primary-source record/);
  assert.match(validateProjectMilestones([{ ...m, note: "x".repeat(701) }], refs).join(" "), /note is too long/);
  const sameAssertion = { ...m, id: "mil-fixture-two" };
  assert.match(validateProjectMilestones([m, sameAssertion], refs).join(" "), /duplicate assertion identity/);
});

const base = getAllFinancialCommitments()[0];
const fake = (
  id: string, projectId: string | null, status: "construction" | "completed" | "cancelled",
  sourceId = source.id, associatedProjectIds: string[] = [],
): FinancialCommitment => ({
  ...structuredClone(base), id, projectId, associatedProjectIds,
  implementationStatusHistory: [{ status, date: null, sourceId, note: null }],
});
const auditProjects = [{ id: "prj-fixture-one" }, { id: "prj-fixture-two" }];

test("legacy audit preserves two financier observations but flags their shared source", () => {
  const report = auditLegacyProjectExecution([
    fake("fin-fixture-two", "prj-fixture-one", "construction"),
    fake("fin-fixture-one", "prj-fixture-one", "construction"),
  ], auditProjects, [source]);
  assert.equal(report.observations.length, 2);
  assert.equal(report.repeatedEvidenceGroups.length, 1);
  assert.deepEqual(report.repeatedEvidenceGroups[0].financialIds,
    ["fin-fixture-one", "fin-fixture-two"]);
  assert.ok(report.observations.every((o) => o.scope === "not_adjudicated" &&
    o.disposition === "needs_source_review" && o.statedStatusDate === null));
  assert.equal(report.mixedStatusProjects.length, 0);
});

test("divergent statuses remain source-specific and are flagged, not automatically resolved", () => {
  const rows = [
    fake("fin-b", "prj-fixture-one", "cancelled"),
    fake("fin-a", "prj-fixture-one", "construction"),
  ];
  const result = auditLegacyProjectExecution(rows, auditProjects, [source]);
  assert.deepEqual(result.mixedStatusProjects,
    [{ projectId: "prj-fixture-one", statuses: ["cancelled", "construction"] }]);
  assert.equal(result.observations.length, 2);
  assert.equal(formatLegacyExecutionAudit(result),
    formatLegacyExecutionAudit(auditLegacyProjectExecution([...rows].reverse(), auditProjects, [source])));
});

test("unallocated multi-project finance, orphan projects and missing sources never become execution assertions", () => {
  const rows = [
    fake("fin-shared", null, "construction", source.id,
      ["prj-fixture-two", "prj-fixture-one"]),
    fake("fin-orphan", "prj-missing", "construction"),
    fake("fin-nosource", "prj-fixture-one", "construction", "src-ghost"),
  ];
  const r = auditLegacyProjectExecution(rows, auditProjects, [source]);
  assert.equal(r.observations.length, 0);
  assert.deepEqual(r.gaps.map((g) => g.reason),
    ["unresolved_source", "unresolved_project", "unallocated_project_association"]);
  assert.deepEqual(r.gaps.at(-1)?.associatedProjectIds,
    ["prj-fixture-one", "prj-fixture-two"]);
});

test("Kingston funded-activity completion is never silently promoted to facility completion", () => {
  const row = getFinancialCommitmentById("fin-ca-cmrdd-2024-cyclic-materials")!;
  const actualSources = row.implementationStatusHistory.map((s) => ({
    id: s.sourceId, datePublished: null,
  }));
  const report = auditLegacyProjectExecution([row],
    [{ id: "prj-ca-cyclic-kingston-demonstration-plant" }], actualSources);
  assert.ok(report.observations.some((o) => o.status === "completed" &&
    o.scope === "known_funded_activity_exception"));
  assert.equal(report.label, "unreviewed_legacy_financing_row_evidence");
});

test("read-only audit command produces deterministic parseable JSON for current seed", () => {
  const output = execFileSync(process.execPath,
    ["--import", "tsx", "scripts/audit-project-execution.ts", "--json"],
    { cwd: process.cwd(), encoding: "utf8" });
  const parsed = JSON.parse(output);
  assert.equal(parsed.label, "unreviewed_legacy_financing_row_evidence");
  assert.ok(parsed.countedFinanceRows > 0);
  assert.equal(parsed.observations.length + parsed.gaps.length > 0, true);
});

test("construction progress reporting is an undated status observation, not a dated start or operations", () => {
  const progress: ProjectMilestone = {
    ...fixture(), id: "mil-fixture-progress",
    kind: "construction_progress_reported",
    claimMode: "occurred", scope: "named_facility",
    scopeAsStated: "Named processing facility expansion",
    occurredOn: null, targetOn: null,
    statementOriginal: "Facility expansion was substantially completed during the quarter.",
    statementEn: "Facility expansion was substantially completed during the quarter.",
    note: "Issuer reports partial asset service and construction progress, not final completion or rated throughput.",
  };
  assert.deepEqual(validateProjectMilestones([progress], refs), []);
  const invalid: [string, Partial<ProjectMilestone>, RegExp][] = [
    ["invented event day", {occurredOn:"2026-09-01"}, /requires occurredOn: null/],
    ["whole-project overreach", {scope:"whole_project",scopeAsStated:null}, /requires named_facility scope/],
    ["planned event", {claimMode:"planned",targetOn:"2027-01-01"}, /requires an occurred observation/],
    ["missing editorial caution", {note:null}, /requires a scoped status caveat/],
  ];
  for (const [label, changes, expected] of invalid) {
    const errors = validateProjectMilestones([{...progress,...changes}], refs);
    assert.ok(errors.some(e=>expected.test(e)), label+": "+errors.join("; "));
  }
  assert.deepEqual(getAllProjectMilestones(), [], "synthetic contract validation cannot publish real milestones");
});
