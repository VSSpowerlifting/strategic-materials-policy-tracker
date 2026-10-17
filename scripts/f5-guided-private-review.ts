/**
 * Source review intake for NEW private per-candidate ledgers only.
 * No authenticating original publisher documents, editorial decision, release,
 * seed modification, network access, or automatic human approval.
 */
import { isMilestoneIsoDate } from "../lib/project-milestones";
import type { FinancialCommitment, Project, ProjectMilestone, Source } from "../lib/types";
import {
  adjudicateProjectExecutionReview,
  type PendingProjectExecutionRow,
  type SourceReviewDecision,
} from "./adjudicate-project-execution";
import { buildM3ReviewerPackets } from "./project-execution-review-packets";

export type GuidedReviewRefs = {
  projects: readonly Project[];
  sources: readonly Source[];
  commitments: readonly FinancialCommitment[];
  currentPublicMilestones: readonly ProjectMilestone[];
  currentPublicCutoff: string;
};
export type HumanReviewInput = {
  verdict: Exclude<SourceReviewDecision["verdict"], "pending">;
  reviewedBy: string;
  reviewedAt: string;
  rationale: string;
  checks: SourceReviewDecision["checks"];
  proposedMilestoneId: string | null;
  manuallyCopiedDigest: string;
};

const reviewIdPattern = /^review-m3-2-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A dedicated file for this review; never rewrite the old Wagerup decision. */
export function privateReviewPathFor(id: string): string {
  if (!reviewIdPattern.test(id)) throw new Error("Invalid canonical review ID");
  return `.project-execution-review/${id}.adjudications.json`;
}

export function parseGuidedReviewArgs(argv: readonly string[]): {id:string; proposedCutoff:string} {
  let id: string | undefined;
  let proposedCutoff: string | undefined;
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(token==="--id" && !id && argv[i+1] && !argv[i+1].startsWith("--")){
      id=argv[++i];continue;
    }
    if(token==="--proposed-cutoff" && !proposedCutoff && argv[i+1] && !argv[i+1].startsWith("--")){
      proposedCutoff=argv[++i];continue;
    }
    throw new Error("Usage: npm run review:f5-guided -- --id review-m3-2-... --proposed-cutoff YYYY-MM-DD");
  }
  if (!id || !reviewIdPattern.test(id) || !isMilestoneIsoDate(proposedCutoff))
    throw new Error("Supply a valid source-review ID and explicit real proposed cutoff (YYYY-MM-DD)");
  return {id,proposedCutoff};
}

export function prepareGuidedReview(
  queue: readonly PendingProjectExecutionRow[],
  refs: GuidedReviewRefs,
  id: string,
  proposedCutoff: string,
) {
  privateReviewPathFor(id);
  if(!isMilestoneIsoDate(proposedCutoff) || proposedCutoff<refs.currentPublicCutoff)
    throw new Error("Proposed cutoff must be a real date on or after the CURRENT public corpus revision");
  const row=queue.find(r=>r.id===id);
  if(!row)throw new Error("Unknown source-review ID; check the canonical M3 queue");
  if(row.gate!=="human_source_review")
    throw new Error("TAXONOMY BLOCKED. This observation cannot be approved by a checklist; resolve its taxonomy first");
  if(refs.currentPublicMilestones.some(m=>m.projectId===row.projectId && m.sourceId===row.sourceId && m.kind===row.kindProposal))
    throw new Error("Already published from this primary source. Preserve the previous historical human review; do not duplicate it");
  const report=buildM3ReviewerPackets(queue,{
    projects:refs.projects,sources:refs.sources,commitments:refs.commitments,
    corpusCutoff:proposedCutoff,publicMilestoneCount:refs.currentPublicMilestones.length,
  },id);
  if(report.worksheets.length!==1)throw new Error("Expected exactly one signed-input worksheet for this review");
  return {row,worksheet:report.worksheets[0]};
}

/**
 * Pure construction and validation. Human-entered fields are *required*, not
 * auto-filled from the source registry or the packet. All other queue rows
 * remain pending in the session file. This never writes a file or approves a
 * public project observation.
 */
export function buildGuidedPrivateDecisions(
  queue: readonly PendingProjectExecutionRow[],
  exampleDecisions: readonly SourceReviewDecision[],
  refs: GuidedReviewRefs,
  id: string,
  proposedCutoff: string,
  actualLocalToday: string,
  entered: HumanReviewInput,
): SourceReviewDecision[] {
  const {worksheet}=prepareGuidedReview(queue,refs,id,proposedCutoff);
  if(!isMilestoneIsoDate(actualLocalToday))throw new Error("Invalid local calendar day");
  if(!["approved","rejected","needs_more_evidence"].includes(entered.verdict))
    throw new Error("Reviewer must explicitly choose approved, rejected or needs_more_evidence");
  if(!entered.reviewedBy.trim() || entered.reviewedBy.length>120)
    throw new Error("Reviewer must type their actual full name (maximum 120 characters)");
  if(!isMilestoneIsoDate(entered.reviewedAt) || entered.reviewedAt>actualLocalToday)
    throw new Error("Real review date must not be in the future");
  if(entered.reviewedAt>proposedCutoff)
    throw new Error("Review date exceeds proposed cutoff; choose a later proposed cutoff and review the new worksheet. Do not backdate");
  if(!entered.rationale.trim() || entered.rationale.length>1200)
    throw new Error("Reviewer must write a nonempty, bounded rationale in their own words");
  const keys=["fullSourceRead","quotedPassageMatches","scopeIsExplicit","eventAndEvidenceDatesSeparated","noFinancingOrOperationsInference"] as const;
  if(keys.some(k=>typeof entered.checks[k]!=="boolean"))
    throw new Error("Reviewer must answer all five original-source checks explicitly");
  if(entered.manuallyCopiedDigest!==worksheet.reviewInputDigestSha256)
    throw new Error("Manually entered input fingerprint differs from current M3 packet. Stop and re-review; do not paste an old digest");
  if(entered.verdict==="approved"){
    if(keys.some(k=>entered.checks[k]!==true))
      throw new Error("Approval requires all five original-source checks to be personally affirmed");
    if(!entered.proposedMilestoneId || !/^mil-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entered.proposedMilestoneId))
      throw new Error("Approval requires an explicit valid mil-... proposal ID (not automatic publication)");
  }else if(entered.proposedMilestoneId!==null){
    throw new Error("Only a human-approved candidate can nominate a milestone ID");
  }
  if(exampleDecisions.length!==queue.length ||
    exampleDecisions.some((d,i)=>d.id!==queue[i].id || d.verdict!=="pending" ||
      d.reviewedAt!==null || d.reviewedBy!==null || d.reviewInputDigestSha256!==null))
    throw new Error("Private session must begin with the canonical all-pending template; existing historical decisions must not be overwritten");
  const decisions=structuredClone(exampleDecisions);
  const target=decisions.find(d=>d.id===id);
  if(!target)throw new Error("Cannot locate selected template row");
  Object.assign(target,{
    verdict:entered.verdict,
    reviewedBy:entered.reviewedBy.trim(),
    reviewedAt:entered.reviewedAt,
    rationale:entered.rationale.trim(),
    checks:{...entered.checks},
    proposedMilestoneId:entered.proposedMilestoneId,
    reviewInputDigestSha256:entered.manuallyCopiedDigest,
  });
  const review=adjudicateProjectExecutionReview(queue,decisions,{
    projects:refs.projects,sources:refs.sources,commitments:refs.commitments,
    corpusCutoff:proposedCutoff,publicMilestoneIds:refs.currentPublicMilestones.map(m=>m.id),
  });
  if(review.errors.length || review.blocked.length)
    throw new Error("Canonical adjudication gate blocked this private decision: " + [
      ...review.errors,...review.blocked.map(x=>x.id+": "+x.reason),
    ].join(" | "));
  if(entered.verdict==="approved" && review.proposals.length!==1)
    throw new Error("Human-approved decision failed to produce exactly one NONPUBLISHING reviewer proposal");
  if(entered.verdict!=="approved" && review.proposals.length!==0)
    throw new Error("Non-approved decision must not produce any proposed public milestones");
  return decisions;
}
