import test from "node:test";
import assert from "node:assert/strict";

import candidate from "../research/project-execution/release-candidates/wagerup-groundbreaking-2026-10-17.json";
import reviewQueue from "../research/project-execution/m3-2-source-review-queue.json";
import { buildM3ReviewerPackets } from "../scripts/project-execution-review-packets";
import { auditF5CasefileReadiness } from "../lib/f5-casefile-readiness";
import { validateProjectMilestones } from "../lib/project-milestones";
import type { ProjectMilestone } from "../lib/types";
import { site } from "../lib/site";
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllProjectDesignations, getAllProjectMilestones, getAllProjects, getAllSources,
} from "../lib/data";

const originalId = "review-m3-2-alcoa-wagerup";
const currentMilestones = () => getAllProjectMilestones();
const proposed = candidate.proposedProjectMilestones[0] as ProjectMilestone;
const projectId = "prj-au-alcoa-sojitz-gallium";
const sourceId = "src-alcoa-wagerup-groundbreaking-2026";

test("Wagerup release proposal is ONLY research data; publication gates and public corpus remain closed", () => {
  assert.equal(candidate.schemaVersion, "f5-milestone-release-candidate-1");
  assert.equal(candidate.stage, "draft_review_only_not_published");
  assert.equal(candidate.releaseAuthorized, false);
  assert.equal(candidate.publicSeedModificationAuthorized, false);
  assert.equal(candidate.publicRouteReleaseAuthorized, false);
  assert.equal(candidate.publishedCorpusCutoffAtPreparation, "2026-10-09");
  assert.equal(site.lastUpdated, "2026-10-09",
    "draft PR must NOT advance the public curated corpus revision");
  assert.deepEqual(currentMilestones(), [],
    "draft PR must NOT add the human-reviewed claim to public seed/exports/routes");
  assert.equal(candidate.proposedProjectMilestones.length, 1);
  assert.equal(candidate.sourceReviewId, originalId);
  assert.ok(candidate.manualReviewRequirements.length >= 5);
  assert.match(candidate.reviewReceiptProvenance, /LOCAL.*NOT an independently accessible/i);
});

test("Wagerup exact publication proposal is derived from the narrow canonical M3 claim, not financing descriptions", () => {
  const q = reviewQueue.find(row => row.id === originalId);
  assert.ok(q);
  assert.equal(q.gate, "human_source_review");
  assert.equal(q.reviewVerdict, "unreviewed", "do not make public research queue impersonate the private human ledger");
  assert.equal(proposed.id, "mil-au-alcoa-wagerup-groundbreaking-2026-08-24");
  assert.equal(proposed.projectId, projectId);
  assert.equal(proposed.kind, "groundbreaking_reported");
  assert.equal(proposed.claimMode, "occurred");
  assert.equal(proposed.scope, "named_facility");
  assert.equal(proposed.occurredOn, "2026-08-24");
  assert.equal(proposed.targetOn, null);
  assert.equal(proposed.sourceId, sourceId);
  assert.equal(proposed.statementOriginal, q.statementOriginal);
  assert.equal(proposed.statementEn, q.statementEn);
  assert.equal(proposed.statementEnSource, "na");
  assert.equal(proposed.scopeAsStated, q.scopeAsStated);
  assert.equal(proposed.locator, q.locator);
  assert.equal(proposed.note, q.editorialCaution);
  assert.equal(proposed.reviewedBy, "Benjamin Yang");
  assert.equal(proposed.reviewedAt, "2026-10-17");
  assert.deepEqual(
    Object.keys(proposed).sort(),
    ["id", "projectId", "kind", "claimMode", "scope", "scopeAsStated",
      "occurredOn", "targetOn", "sourceId", "locator", "statementOriginal",
      "statementEn", "statementEnSource", "reviewedBy", "reviewedAt", "note"].sort(),
    "no finance amounts, total commitments or non-source milestone fields belong in public proposal",
  );
  const source = getAllSources().find(s => s.id === sourceId);
  assert.ok(source);
  assert.equal(source.publisher, "Alcoa Corporation");
  assert.equal(source.datePublished, "2026-08-24");
  assert.equal(source.dateAccessed, "2026-10-02");
});

test("proposed cutoff is tied to the precise human-reviewed M3 input, not a private ledger import", () => {
  assert.equal(candidate.proposedCorpusCutoff, "2026-10-17");
  const docs = buildM3ReviewerPackets(reviewQueue, {
    projects: getAllProjects(), sources: getAllSources(),
    commitments: getAllFinancialCommitments(),
    corpusCutoff: candidate.proposedCorpusCutoff,
    publicMilestoneCount: currentMilestones().length,
  }, originalId);
  assert.equal(docs.worksheets.length, 1);
  const packet = docs.worksheets[0];
  assert.equal(packet.originalSource.id, sourceId);
  assert.equal(packet.proposedObservation.kind, "groundbreaking_reported");
  assert.equal(packet.humanAttestationPresent, false,
    "current worksheet does not prove the local human record was signed");
  assert.equal(candidate.reviewInputMetadataSha256, packet.reviewInputDigestSha256,
    "if editorial inputs shift, require renewed human inspection; do not transplant old digest");
  assert.match(candidate.reviewInputMetadataSha256, /^[0-9a-f]{64}$/);
  assert.equal(candidate.releaseAuthorized, false,
    "a metadata SHA is never a publication authorization");
});

test("candidate validates ONLY against proposed corpus cutoff, never retroactively against current public cutoff", () => {
  const refs = {projects: getAllProjects(), sources: getAllSources()};
  assert.deepEqual(validateProjectMilestones([proposed], {
    ...refs, corpusDate: candidate.proposedCorpusCutoff,
  }), []);
  assert.match(validateProjectMilestones([proposed], {
    ...refs, corpusDate: site.lastUpdated,
  }).join(" | "), /reviewedAt is after corpus cutoff/,
  "publication without an authorized corpus revision must fail closed");
});

test("hypothetical Wagerup staging enables ONLY independent casefile QA and cannot mutate public state", () => {
  const sourceCorpus = {
    events:getAllEvents(), finances:getAllFinancialCommitments(),
    controls:getAllControlMeasures(), designations:getAllProjectDesignations(),
    projects:getAllProjects(), milestones:currentMilestones(), sources:getAllSources(),
  };
  const before = JSON.stringify(sourceCorpus);
  const actual = auditF5CasefileReadiness(sourceCorpus, site.lastUpdated);
  assert.equal(actual.pilots.filter(p => p.eligibleForManualQa).length, 0);
  const staged = auditF5CasefileReadiness({
    ...sourceCorpus, milestones:[proposed],
  }, candidate.proposedCorpusCutoff);
  const wagerup = staged.pilots.find(p => p.projectId === projectId);
  assert.ok(wagerup);
  assert.equal(wagerup.registeredOccurredMilestones, 1);
  assert.equal(wagerup.occurredWithSourcePinpoint, 1);
  assert.equal(wagerup.eligibleForManualQa, true);
  assert.equal(staged.pilots.filter(p => p.eligibleForManualQa).length, 1);
  assert.equal(staged.allPilotsEligibleForManualQa, false);
  assert.equal(staged.publicReleaseAuthorized, false);
  assert.equal(staged.autonomousMilestoneApprovalAuthorized, false);
  assert.equal(staged.inferredCausalityAuthorized, false);
  assert.equal(JSON.stringify(sourceCorpus), before);
  assert.deepEqual(currentMilestones(), []);
});
