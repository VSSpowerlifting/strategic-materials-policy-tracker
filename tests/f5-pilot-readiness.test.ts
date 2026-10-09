import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

import packet from "@/research/f5/pilot-source-review.json";
import m3Queue from "@/research/project-execution/m3-2-source-review-queue.json";
import { auditF5PilotReadiness } from "@/scripts/f5-pilot-readiness";
import {
  getAllFinancialCommitments, getAllProjectMilestones, getAllProjects, getAllSources,
} from "@/lib/data";
import { site } from "@/lib/site";
import type { PendingProjectExecutionRow } from "@/scripts/adjudicate-project-execution";

type ReviewPacket = Parameters<typeof auditF5PilotReadiness>[0];
const input = (): ReviewPacket => structuredClone(packet) as unknown as ReviewPacket;
const refs = () => ({
  projects: getAllProjects(),
  sources: getAllSources(),
  finances: getAllFinancialCommitments(),
  existingM3Queue: m3Queue as unknown as PendingProjectExecutionRow[],
  publicMilestoneIds: getAllProjectMilestones().map(x => x.id),
  corpusCutoff: site.lastUpdated as string,
});
const audit = (pkt = input(), external = refs()) => auditF5PilotReadiness(pkt, external);

test("F5-1: original M3 adjudication remains canonical; four F5 pilots are all unapproved", () => {
  const report=audit();
  assert.deepEqual(report.errors, []);
  assert.equal(report.schemaVersion,"f5-1-readiness-v1");
  assert.equal(report.publicationAuthorized,false);
  assert.equal(report.publicMilestoneCount,0);
  assert.deepEqual(report.totals,{
    cases:4,existingM3:3,newProposals:1,
    missingRegisteredSources:1,taxonomyBlocked:1,humanReviewRequired:4,
  });
  assert.deepEqual(report.cases.map(x=>x.id),[
    "f5-1-alcoa-wagerup-groundbreaking",
    "f5-1-narva-commercial-magnets",
    "f5-1-stibnite-burntlog-2026",
    "f5-1-stibnite-earlyworks-2025",
  ]);
  assert.ok(report.cases.every(x=>!x.publicationEligible && x.releaseBlockers.length>=1));
  assert.ok(report.cases.every(x=>x.releaseBlockers.includes("curated_corpus_cutoff_requires_separate_approval")));
  assert.equal(getAllProjectMilestones().length,0);
});

test("F5-1: Alcoa and Burntlog link existing M3 rows instead of inventing duplicate milestone proposals", () => {
  const r=audit();
  const alcoa=r.cases[0],burntlog=r.cases[2];
  assert.equal(alcoa.existingReviewId,"review-m3-2-alcoa-wagerup");
  assert.equal(alcoa.track,"existing_m3_review");
  assert.equal(alcoa.proposedKind,null);
  assert.ok(alcoa.releaseBlockers.includes("existing_M3_human_adjudication"));
  assert.deepEqual(alcoa.sourceEvidenceBoundary,{date:"2026-08-24",basis:"publication"});
  assert.equal(burntlog.existingReviewId,"review-m3-2-stibnite-burntlog");
  assert.equal(burntlog.proposedKind,null);
  assert.ok(burntlog.releaseBlockers.includes("existing_M3_taxonomy_gate"));
  assert.deepEqual(burntlog.sourceEvidenceBoundary,{date:"2026-06-01",basis:"publication"});
});

test("F5-1: Narva source dates support reported production, NOT a fabricated production-start day", () => {
  const r=audit(),neo=r.cases[1],lead=input().cases[1];
  assert.equal(neo.sourceRegistered,true);
  assert.equal(neo.track,"existing_m3_review");
  assert.equal(neo.existingReviewId,"review-m3-2-neo-narva-magnets");
  assert.equal(neo.proposedKind,null);
  assert.equal(neo.proposedScope,null);
  assert.equal(neo.proposedOccurredOn,null);
  assert.deepEqual(neo.sourceEvidenceBoundary,{date:"2026-09-14",basis:"publication"});
  assert.equal(lead.proposal,null,"F5 cannot duplicate a canonical M3 review");
  const m3=m3Queue.find(x=>x.id===neo.existingReviewId)!;
  assert.equal(m3.kindProposal,"production_reported");
  assert.equal(m3.scopeProposal,"named_facility");
  assert.equal(m3.claimMode,"occurred");
  assert.equal(m3.occurredOn,null);
  assert.equal(m3.targetOn,null);
  assert.ok(m3.editorialCaution.includes("does not state the first production-start day"));
  assert.ok(neo.releaseBlockers.includes("existing_M3_human_adjudication"));
  assert.equal(neo.publicationEligible,false);
});

test("F5-1: Stibnite 2025 early works is distinct from May 2026 Burntlog site access and requires source registration", () => {
  const r=audit();
  const old=r.cases[2],first=r.cases[3];
  assert.equal(first.projectId,old.projectId);
  assert.notEqual(first.sourceId,old.sourceId);
  assert.equal(first.sourceRegistered,false);
  assert.equal(first.proposedKind,"construction_started");
  assert.equal(first.proposedScope,"whole_project");
  assert.equal(first.proposedOccurredOn,"2025-10-21");
  assert.deepEqual(first.releaseBlockers,[
    "register_full_original_primary_source",
    "independent_human_source_adjudication",
    "curated_corpus_cutoff_requires_separate_approval",
  ]);
  assert.ok(input().cases[3].proposal?.editorialCaution.includes("early works construction"));
  assert.equal(getAllProjectMilestones().length,0);
});

test("F5-1: invalid review identities, source URLs, false approvals and duplicate leads fail closed", () => {
  const duplicate=input();
  duplicate.cases[1].id=duplicate.cases[0].id;
  assert.match(audit(duplicate).errors.join(" "),/unique and strictly sorted/);
  const promoted=input();
  promoted.state="published" as ReviewPacket["state"];
  promoted.cases[0].reviewStatus="approved" as ReviewPacket["cases"][number]["reviewStatus"];
  assert.match(audit(promoted).errors.join(" "),/unsigned source-review leads/);
  assert.match(audit(promoted).errors.join(" "),/existing ordinary M3 review must remain unsigned/);
  const wrongURL=input();
  wrongURL.cases[1].sourceUrl="https://www.example.com/other";
  assert.match(audit(wrongURL).errors.join(" "),/URL\/publisher identity mismatch/);
  const wrongM3=input();
  wrongM3.cases[0].existingReviewId="review-m3-2-stibnite-burntlog";
  assert.match(audit(wrongM3).errors.join(" "),/missing or mismatched existing M3 review/);
  const forgedDate=input();
  forgedDate.cases[3].proposal!.occurredOn="2025-10-20";
  assert.equal(audit(forgedDate).errors.length,0,
    "an earlier-than-publication date can be *structurally* valid; a human still must check the actual issuer claim");
  assert.equal(audit(forgedDate).publicationAuthorized,false,
    "date plausibility is not source verification or human attestation");
  forgedDate.cases[3].proposal!.occurredOn="2025-10-23";
  assert.match(audit(forgedDate).errors.join(" "),/event date cannot follow cited publication/);
});

test("F5-1: duplicate M3 source review, malformed dates and unsupported category never slip through", () => {
  const dup=input();
  dup.cases[1].projectId=dup.cases[0].projectId;
  dup.cases[1].sourceId=dup.cases[0].sourceId;
  dup.cases[1].sourceUrl=dup.cases[0].sourceUrl;
  dup.cases[1].publishedOn=dup.cases[0].publishedOn;
  dup.cases[1].sourcePublisher=dup.cases[0].sourcePublisher;
  assert.match(audit(dup).errors.join(" "),/missing or mismatched existing M3 review row|source registry URL\/publisher/);
  const wrongKind=input();
  wrongKind.cases[3].proposal!.kind="commissioning_started_not_known" as never;
  assert.match(audit(wrongKind).errors.join(" "),/unsupported milestone taxonomy/);
  const wrongDate=input();
  wrongDate.cases[1].publishedOn="2026-02-30";
  assert.match(audit(wrongDate).errors.join(" "),/publication date\/publisher invalid/);
});

test("F5-1: all review diagnostics are deterministic and no private drafts enter public data", () => {
  const initial=input(), snapshot=JSON.stringify(initial);
  assert.deepEqual(audit(initial),audit(input()));
  assert.equal(JSON.stringify(initial),snapshot);
  const argv=["--import","tsx","scripts/audit-f5-pilots.ts"];
  const summary=execFileSync(process.execPath,argv,{encoding:"utf8"});
  assert.ok(summary.includes("Milestone publication: NOT AUTHORIZED"));
  assert.ok(summary.includes("Existing M3.2 cases (reused, never duplicated): 3"));
  const json=execFileSync(process.execPath,[...argv,"--json"],{encoding:"utf8"});
  assert.deepEqual(JSON.parse(json),audit());
  const bad=spawnSync(process.execPath,[...argv,"--publish"],{encoding:"utf8"});
  assert.equal(bad.status,2);
  assert.ok(bad.stderr.includes("Usage:"));
});
