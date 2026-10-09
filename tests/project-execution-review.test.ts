import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import queueJson from "../research/project-execution/m3-2-source-review-queue.json";
import { site } from "../lib/site";
import {
  getAllFinancialCommitments, getAllProjects, getAllSources,
  getAllProjectMilestones, getDatasetSummary,
} from "../lib/data";
import { auditProjectExecutionPilot, formatPilotAudit } from "../scripts/review-project-execution-pilot";

type Draft = (typeof queueJson)[number];
const q = () => structuredClone(queueJson);
const refs = () => ({
  projects: getAllProjects(),
  sources: getAllSources(),
  commitments: getAllFinancialCommitments(),
  corpusCutoff: site.lastUpdated,
});
const audit = (draft: unknown = q(), r = refs()) => auditProjectExecutionPilot(draft, r);

test("M3.2 six source-linked candidates are a non-promoting review queue", () => {
  const result = audit();
  assert.deepEqual(result.errors, [], JSON.stringify(result.errors));
  assert.equal(result.status, "non_publication_editorial_queue");
  assert.equal(result.summary.awaitingHumanSourceReview, 4);
  assert.equal(result.summary.blockedOnTaxonomy, 2);
  assert.deepEqual(result.candidates.map((x) => x.id),
    ["review-m3-2-alcoa-wagerup", "review-m3-2-cyclic-extended-operations",
     "review-m3-2-inl-demonstration", "review-m3-2-neo-narva-magnets",
     "review-m3-2-stibnite-burntlog", "review-m3-2-stibnite-early-works"]);
  assert.equal(getAllProjectMilestones().length, 0, "no candidate is a public milestone");
  assert.equal(getDatasetSummary().projects, getAllProjects().length);
});

test("Alcoa three financial rows remain one proposed physical construction claim", () => {
  const row = q()[0];
  assert.equal(row.gate, "human_source_review");
  assert.equal(row.kindProposal, "construction_started");
  assert.equal(row.scopeProposal, "named_facility");
  assert.equal(row.occurredOn, "2026-08-24");
  assert.equal(row.relatedFinanceIds.length, 3);
  const result = audit();
  assert.equal(result.candidates[0].deduplicatedLegacyFinanceObservations, 3);
  assert.deepEqual(result.candidates[0].sourceBoundary,
    { date: "2026-08-24", basis: "publication" });
});

test("Cyclic preserves missing exact date and source-access boundary", () => {
  const row = q()[1];
  assert.equal(row.occurredOn, null);
  assert.equal(row.kindProposal, "funded_activity_completed");
  assert.equal(row.scopeProposal, "funded_activity");
  assert.match(row.statementOriginal, /March 2026/);
  const result = audit();
  assert.deepEqual(result.candidates[1].sourceBoundary, { date: "2026-10-07", basis: "access" });
});

test("scope decisions block INL demo and Stibnite road without widening canonical taxonomy", () => {
  const rows = q();
  assert.equal(rows[2].gate, "taxonomy_blocked");
  assert.equal(rows[2].kindProposal, "demonstration_started");
  assert.equal(rows[2].occurredOn, null, "Army's July 29 ribbon-cutting is not a proved demo-start date");
  assert.equal(rows[4].gate, "taxonomy_blocked");
  assert.equal(rows[4].scopeProposal, "named_infrastructure");
  assert.equal(rows[4].occurredOn, "2026-05-30");
  assert.deepEqual(audit().errors, []);
});

test("review queue rejects an approved review identity or invented milestone ID", () => {
  const rows = q();
  (rows[0] as Draft & {reviewedBy?: string}).reviewedBy = "AI";
  (rows[1] as Draft & {milestoneId?: string}).milestoneId = "mil-false";
  rows[2].reviewVerdict = "verified" as Draft["reviewVerdict"];
  const errs = audit(rows).errors.join(" | ");
  assert.match(errs, /purportedly approved assertions/);
});

test("dated occurrence cannot follow source publication or the corpus cutoff", () => {
  const rows = q();
  rows[0].occurredOn = "2026-08-25";
  assert.match(audit(rows).errors.join(" | "), /occurred date postdates source evidence boundary/);
  rows[0].occurredOn = "2026-10-10";
  assert.match(audit(rows).errors.join(" | "), /proposed occurrence postdates curated corpus cutoff/);
  rows[0].occurredOn = "2026-02-30";
  assert.match(audit(rows).errors.join(" | "), /real date or null/);
});

test("missing/incorrect financier references or promotion-level scope fail", () => {
  const rows = q();
  rows[0].relatedFinanceIds = ["fin-us-exim-perpetua-stibnite-2026"];
  rows[1].scopeProposal = "whole_project";
  rows[2].gate = "human_source_review";
  const errs = audit(rows).errors.join(" | ");
  assert.match(errs, /belongs to a different project/);
  assert.match(errs, /has no matching legacy source observation/);
  assert.match(errs, /funded activity completion cannot be a whole-project/);
  assert.match(errs, /requires existing canonical kind and scope/);
});

test("unknown source, duplicate review ID, reordered IDs and non-primary source fail closed", () => {
  const rows = q();
  rows[0].sourceId = "src-missing";
  rows[1].id = rows[0].id;
  rows[2].id = "review-m3-2-a-out-of-order";
  const errs = audit(rows).errors.join(" | ");
  assert.match(errs, /sourceId does not resolve/);
  assert.match(errs, /duplicate review id/);
  assert.match(errs, /sorted ascending/);
  const r = refs();
  r.sources = r.sources.map((s) => s.id === q()[0].sourceId
    ? { ...s, confidence: "secondary" as const } : s);
  assert.match(audit(q(), r).errors.join(" | "), /source is not marked primary/);
});

test("pilot audit CLI is deterministic, parseable and does not publish", () => {
  const cmd = [process.execPath, "--import", "tsx", "scripts/audit-project-execution-pilot.ts", "--json"];
  const first = execFileSync(cmd[0], cmd.slice(1), { encoding: "utf8" });
  const second = execFileSync(cmd[0], cmd.slice(1), { encoding: "utf8" });
  assert.equal(first, second);
  const parsed = JSON.parse(first);
  assert.equal(parsed.status, "non_publication_editorial_queue");
  assert.deepEqual(parsed.errors, []);
  assert.equal(first, formatPilotAudit(audit()));
});

test("M3.2 whole_project null scope is structurally valid without inventing a project component", () => {
  const rows = q();
  // Synthetic structural fixture; the Alcoa issuer statement has NOT been
  // editorially adjudicated as a whole-project claim.
  rows[0].scopeProposal = "whole_project";
  rows[0].scopeAsStated = null as never;
  const result = audit(rows);
  assert.deepEqual(result.errors, [], JSON.stringify(result.errors));
  assert.equal(result.status, "non_publication_editorial_queue");
  assert.equal(getAllProjectMilestones().length, 0);
});

test("M3.2 incompatible scope/name pairs still fail closed in both directions", () => {
  const whole = q();
  whole[0].scopeProposal = "whole_project";
  assert.match(audit(whole).errors.join(" | "), /whole_project requires scopeAsStated: null/);

  const narrow = q();
  narrow[0].scopeAsStated = null as never;
  assert.match(audit(narrow).errors.join(" | "),
    /named facility, funded activity and taxonomy-held scopes require a bounded scopeAsStated/);

  const held = q();
  held[4].scopeAsStated = null as never;
  assert.match(audit(held).errors.join(" | "),
    /taxonomy-held scopes require a bounded scopeAsStated/);
});

test("Narva is one unsigned source review, not an operational-start day or a second financial fact", () => {
  const rows = q();
  const narva = rows.find(x => x.id === "review-m3-2-neo-narva-magnets")!;
  assert.equal(narva.sourceId, "src-neo-commercial-production-2026");
  assert.equal(narva.kindProposal, "production_reported");
  assert.equal(narva.scopeProposal, "named_facility");
  assert.equal(narva.claimMode, "occurred");
  assert.equal(narva.occurredOn, null);
  assert.equal(narva.targetOn, null);
  assert.deepEqual(narva.relatedFinanceIds, ["fin-eu-jtf-2025-neo-magnet-project"]);
  assert.equal(narva.gate, "human_source_review");
  assert.equal(narva.reviewVerdict, "unreviewed");
  assert.ok(narva.editorialCaution.includes("does not state the first production-start day"));
  assert.ok(!("reviewedBy" in narva));
  assert.ok(!("reviewedAt" in narva));
  assert.deepEqual(audit().errors, []);
  assert.equal(getAllProjectMilestones().length, 0);
});

test("Stibnite first early works may be queued without inventing a matching financing observation", () => {
  const rows=q();
  const first=rows.find(x=>x.id==="review-m3-2-stibnite-early-works")!;
  const later=rows.find(x=>x.id==="review-m3-2-stibnite-burntlog")!;
  assert.deepEqual(first.relatedFinanceIds,[]);
  assert.equal(first.sourceId,"src-perpetua-stibnite-early-works-2025");
  assert.equal(first.gate,"human_source_review");
  assert.equal(first.kindProposal,"construction_started");
  assert.equal(first.scopeProposal,"whole_project");
  assert.equal(first.scopeAsStated,null);
  assert.equal(first.occurredOn,"2025-10-21");
  assert.equal(first.reviewVerdict,"unreviewed");
  assert.equal(later.gate,"taxonomy_blocked");
  assert.equal(later.scopeProposal,"named_infrastructure");
  assert.equal(later.occurredOn,"2026-05-30");
  assert.notEqual(first.sourceId,later.sourceId);
  const report=audit();
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.candidates.find(x=>x.id===first.id)?.sourceBoundary,
    {date:"2025-10-21",basis:"publication"});
  assert.equal(report.candidates.find(x=>x.id===first.id)?.deduplicatedLegacyFinanceObservations,0);
  assert.equal(getAllProjectMilestones().length,0);
});

test("M3 project-native empty finance references still require registered primary source and valid source date", () => {
  const base=q();
  const row=base.find(x=>x.id==="review-m3-2-stibnite-early-works")!;
  assert.deepEqual(row.relatedFinanceIds,[]);
  row.sourceId="src-this-original-does-not-exist";
  assert.match(audit(base).errors.join(" | "),/sourceId does not resolve/);
  const refsModified=refs();
  refsModified.sources=refsModified.sources.map(x=>x.id==="src-perpetua-stibnite-early-works-2025"
    ? {...x,confidence:"secondary" as const} : x);
  assert.match(audit(q(),refsModified).errors.join(" | "),/source is not marked primary/);
  const future=q();
  future.find(x=>x.id==="review-m3-2-stibnite-early-works")!.occurredOn="2025-10-22";
  assert.match(audit(future).errors.join(" | "),/occurred date postdates source evidence boundary/);
});

test("Finance-linked M3 source checks remain strict despite allowing independent project observations", () => {
  const rows=q();
  rows[0].relatedFinanceIds=["fin-eu-jtf-2025-neo-magnet-project"];
  assert.match(audit(rows).errors.join(" | "),/belongs to a different project/);
  const malformed=q();
  malformed[0].relatedFinanceIds=["zzz","zzz"];
  assert.match(audit(malformed).errors.join(" | "),/sorted unique array/);
  const nonarray=q();
  nonarray[0].relatedFinanceIds=null as never;
  assert.match(audit(nonarray).errors.join(" | "),/sorted unique array/);
});
