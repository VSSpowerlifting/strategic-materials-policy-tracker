import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import queue from "../research/project-execution/m3-2-source-review-queue.json";
import template from "../research/project-execution/m3-2-adjudications.example.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";
import { adjudicateProjectExecutionReview } from "../scripts/adjudicate-project-execution";

const draft = () => structuredClone(template);
const refs = () => ({
  projects: getAllProjects(),
  sources: getAllSources(),
  commitments: getAllFinancialCommitments(),
  corpusCutoff: site.lastUpdated as string,
  publicMilestoneIds: getAllProjectMilestones().map((x) => x.id),
});
const audit = (r: unknown, references = refs()) =>
  adjudicateProjectExecutionReview(queue, r, references);
const setApproved = (d: ReturnType<typeof draft>[number], reviewedAt = "2026-10-06") => {
  d.verdict = "approved";
  d.reviewedBy = "Synthetic reviewer in regression test" as never;
  d.reviewedAt = reviewedAt as never;
  d.rationale = "Synthetic test only: assume full original source independently checked." as never;
  d.proposedMilestoneId = ("mil-test-" + d.id.slice("review-m3-2-".length)) as never;
  for (const key of Object.keys(d.checks) as (keyof typeof d.checks)[])
    d.checks[key] = true;
};

test("review example is genuinely pending and cannot generate a milestone", () => {
  const r = audit(draft());
  assert.equal(r.status, "human_adjudication_preview_only");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.blocked, []);
  assert.equal(r.counts.pending, 7);
  assert.deepEqual(r.proposals, []);
  assert.equal(getAllProjectMilestones().length, 0, "review never mutates public seed");
});

test("approved Alcoa produces only a non-publishing, independently validated preview", () => {
  const d = draft();
  setApproved(d[0]);
  const r = audit(d);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.blocked, []);
  assert.equal(r.proposals.length, 1);
  assert.equal(r.proposals[0].projectId, "prj-au-alcoa-sojitz-gallium");
  assert.equal(r.proposals[0].kind, "construction_started");
  assert.equal(r.proposals[0].occurredOn, "2026-08-24");
  assert.equal(r.proposals[0].sourceId, "src-alcoa-wagerup-groundbreaking-2026");
  assert.equal(getAllProjectMilestones().length, 0);
});

test("real post-cutoff human review is blocked instead of quietly backdated", () => {
  const d = draft();
  setApproved(d[1], "2026-10-10");
  const blocked = audit(d);
  assert.deepEqual(blocked.errors, []);
  assert.equal(blocked.proposals.length, 0);
  assert.match(blocked.blocked[0].reason, /requires a separately authorized site.lastUpdated revision/);
  const newCorpus = refs();
  newCorpus.corpusCutoff = "2026-10-11"; // hypothetical future authorized corpus cutoff in this fixture only
  const eligible = audit(d, newCorpus);
  assert.deepEqual(eligible.errors, []);
  assert.deepEqual(eligible.blocked, []);
  assert.equal(eligible.proposals[0].scope, "funded_activity");
  assert.equal(eligible.proposals[0].occurredOn, null, "March-only reported completion is never given an invented day");
});

test("taxonomy-blocked INL and Stibnite cannot be approved by signing every checkbox", () => {
  const d = draft();
  setApproved(d[2]);
  setApproved(d[4]);
  const r = audit(d);
  assert.deepEqual(r.proposals, []);
  assert.equal(r.blocked.length, 2);
  assert.match(r.blocked[0].reason, /Unresolved taxonomy/);
});

test("missing reviewer, signature checklist, ID and rationale never generate proposal", () => {
  const d = draft();
  setApproved(d[0]);
  d[0].reviewedBy = null;
  d[0].checks.scopeIsExplicit = false;
  d[0].rationale = null;
  d[0].proposedMilestoneId = "not-a-milestone" as never;
  const r = audit(d);
  assert.equal(r.proposals.length, 0);
  assert.match(r.errors.join(" | "), /recording a verdict requires named reviewer/);
  assert.match(r.errors.join(" | "), /non-pending verdict requires an explicit explanation/);
  assert.match(r.blocked[0].reason, /five original-source checks/);
});

test("repeated and existing milestone IDs cannot pass", () => {
  const d = draft();
  setApproved(d[0]);
  setApproved(d[1]);
  d[1].proposedMilestoneId = d[0].proposedMilestoneId;
  assert.match(audit(d).errors.join(" | "), /already exists or is used twice/);
  const references = refs();
  references.publicMilestoneIds = [d[0].proposedMilestoneId!];
  assert.match(audit(d, references).errors.join(" | "), /already exists or is used twice/);
});

test("missing, duplicated and out-of-order decisions fail closed", () => {
  const d = draft();
  const shortened = d.slice(1);
  assert.match(audit(shortened).errors.join(" | "), /required for every/);
  const dupe = draft();
  dupe[1].id = dupe[0].id;
  assert.match(audit(dupe).errors.join(" | "), /duplicate adjudication decision/);
  const reversed = draft().reverse();
  assert.match(audit(reversed).errors.join(" | "), /exactly follow review-queue order/);
});

test("pending cannot impersonate signed review; rejection never nominates public milestone", () => {
  const d = draft();
  d[0].reviewedBy = "Fake" as never;
  assert.match(audit(d).errors.join(" | "), /pending cannot impersonate/);
  const rejected = draft();
  rejected[1].verdict = "rejected";
  rejected[1].reviewedBy = "Test reviewer" as never;
  rejected[1].reviewedAt = "2026-10-06" as never;
  rejected[1].rationale = "The quote did not support the draft claim" as never;
  rejected[1].proposedMilestoneId = "mil-rejected" as never;
  assert.match(audit(rejected).errors.join(" | "), /only approved review may nominate/);
});

test("safe CLI accepts the checked-in PENDING example without changing published data", () => {
  const cmd = [process.execPath, "--import", "tsx",
    "scripts/audit-project-execution-adjudications.ts",
    "--file", "research/project-execution/m3-2-adjudications.example.json"];
  const output = execFileSync(cmd[0], cmd.slice(1), {encoding: "utf8"});
  const parsed = JSON.parse(output);
  assert.equal(parsed.counts.pending, 7);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.proposals, []);
});

test("M3 review preview accepts a structurally valid whole-project null scope but never publishes it", () => {
  const rows = structuredClone(queue);
  // Synthetic structure-only test. This does not adjudicate that the actual
  // Alcoa issuer evidence warrants a whole-project claim.
  rows[0].scopeProposal = "whole_project";
  rows[0].scopeAsStated = null as never;
  const decisions = draft();
  setApproved(decisions[0]);
  const report = adjudicateProjectExecutionReview(rows, decisions, refs());
  assert.deepEqual(report.errors, [], JSON.stringify(report.errors));
  assert.deepEqual(report.blocked, []);
  assert.equal(report.status, "human_adjudication_preview_only");
  assert.equal(report.proposals.length, 1);
  assert.equal(report.proposals[0].scope, "whole_project");
  assert.equal(report.proposals[0].scopeAsStated, null);
  assert.equal(getAllProjectMilestones().length, 0);
});

test("M3 cannot preview a purported whole-project milestone with a named component", () => {
  const rows = structuredClone(queue);
  rows[0].scopeProposal = "whole_project";
  const decisions = draft();
  setApproved(decisions[0]);
  const report = adjudicateProjectExecutionReview(rows, decisions, refs());
  assert.ok(report.errors.some(e => e.includes("whole_project requires scopeAsStated: null")));
  assert.deepEqual(report.proposals, []);
});

test("Narva human adjudication remains pending; a test-only approval cannot become published data", () => {
  const rows = draft();
  const idx = rows.findIndex(d => d.id === "review-m3-2-neo-narva-magnets");
  assert.ok(idx >= 0);
  assert.equal(rows[idx].verdict, "pending");
  assert.equal(rows[idx].reviewedBy, null);
  assert.equal(rows[idx].reviewedAt, null);
  setApproved(rows[idx]); // Synthetic, never a real reviewer attestation.
  const result = audit(rows);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.blocked, []);
  assert.equal(result.proposals.length, 1);
  assert.equal(result.proposals[0].kind, "production_reported");
  assert.equal(result.proposals[0].occurredOn, null);
  assert.equal(result.proposals[0].sourceId, "src-neo-commercial-production-2026");
  assert.equal(result.proposals[0].reviewedBy, "Synthetic reviewer in regression test");
  assert.equal(result.status, "human_adjudication_preview_only");
  assert.equal(getAllProjectMilestones().length, 0);
});

test("Stibnite early works can enter a synthetic nonpublishing review preview without any financing row", () => {
  const rows=draft();
  const index=rows.findIndex(x=>x.id==="review-m3-2-stibnite-early-works");
  assert.ok(index>=0);
  assert.equal(rows[index].verdict,"pending");
  assert.equal(rows[index].reviewedBy,null);
  assert.equal(rows[index].reviewedAt,null);
  assert.deepEqual(audit(rows).proposals,[]);
  setApproved(rows[index],"2026-10-09"); // Synthetic test only; not an actual human attestation.
  const result=audit(rows);
  assert.deepEqual(result.errors,[]);
  assert.deepEqual(result.blocked,[]);
  assert.equal(result.status,"human_adjudication_preview_only");
  assert.equal(result.proposals.length,1);
  const proposed=result.proposals[0];
  assert.equal(proposed.projectId,"prj-us-stibnite");
  assert.equal(proposed.sourceId,"src-perpetua-stibnite-early-works-2025");
  assert.equal(proposed.kind,"construction_started");
  assert.equal(proposed.scope,"whole_project");
  assert.equal(proposed.scopeAsStated,null);
  assert.equal(proposed.occurredOn,"2025-10-21");
  assert.ok(proposed.note?.includes("early works"));
  assert.equal(getAllProjectMilestones().length,0);
});

test("Thompson Falls taxonomy-blocked source cannot be signed through into a physical seed", () => {
  const rows = draft();
  const idx = rows.findIndex(d => d.id === "review-m3-2-thompson-falls-q2-expansion");
  assert.ok(idx >= 0);
  const d = rows[idx];
  assert.equal(d.verdict, "pending");
  assert.equal(d.reviewedBy, null);
  assert.deepEqual(audit(rows).proposals, []);
  setApproved(d); // Synthetic test input only, not actual adjudication.
  const result = audit(rows);
  assert.deepEqual(result.errors, []);
  assert.equal(result.counts.approved, 1);
  assert.equal(result.proposals.length, 0);
  assert.ok(result.blocked.some(b => b.id === d.id && b.reason.includes("Unresolved taxonomy")));
  assert.equal(getAllProjectMilestones().length, 0);
});
