/**
 * F5-1: read-only source-review readiness for pilot execution milestones.
 *
 * This augments the existing M3.2 human adjudication queue, never replaces it.
 * A structurally valid source-review lead is NOT an approved milestone.
 */
import { isMilestoneIsoDate } from "../lib/project-milestones";
import { PROJECT_MILESTONE_KINDS, PROJECT_MILESTONE_SCOPES } from "../lib/types";
import type { FinancialCommitment, Project, ProjectMilestone, Source } from "../lib/types";
import type { PendingProjectExecutionRow } from "./adjudicate-project-execution";

type Pilot = {
  id: string;
  projectId: string;
  track: "existing_m3_review" | "new_review_candidate";
  existingReviewId: string | null;
  sourceId: string;
  sourceUrl: string;
  publishedOn: string;
  sourcePublisher: string;
  proposal: null | Omit<ProjectMilestone, "id" | "projectId" | "sourceId" | "reviewedBy" | "reviewedAt"> & {
    editorialCaution: string;
  };
  reviewStatus: "pending_human_review" | "taxonomy_blocked" |
    "pending_source_registration_and_human_review";
  editorialDecision: string;
};
type Packet = {
  schemaVersion: "f5-1-source-review-pilots-v1";
  purpose: string;
  state: "all_unreviewed_no_publication";
  sourceReviewDate: string;
  cases: Pilot[];
};
type Refs = {
  projects: readonly Pick<Project, "id">[];
  sources: readonly Source[];
  finances: readonly FinancialCommitment[];
  existingM3Queue: readonly PendingProjectExecutionRow[];
  publicMilestoneIds: readonly string[];
  corpusCutoff: string;
};
export type F5PilotReadinessReport = {
  schemaVersion: "f5-1-readiness-v1";
  publicationAuthorized: false;
  publicMilestoneCount: number;
  corpusCutoff: string;
  sourceReviewDate: string;
  totals: {
    cases: number; existingM3: number; newProposals: number;
    missingRegisteredSources: number; taxonomyBlocked: number;
    humanReviewRequired: number;
  };
  cases: {
    id: string;
    projectId: string;
    sourceId: string;
    track: Pilot["track"];
    existingReviewId: string | null;
    sourceRegistered: boolean;
    sourceEvidenceBoundary: { date: string; basis: "publication" | "access" } | null;
    proposedKind: string | null;
    proposedScope: string | null;
    proposedOccurredOn: string | null;
    releaseBlockers: string[];
    publicationEligible: false;
  }[];
  errors: string[];
  limitations: string[];
};
const byId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const nonblank = (s: unknown): s is string => typeof s === "string" && s.trim().length > 0;

export function auditF5PilotReadiness(input: Packet, refs: Refs): F5PilotReadinessReport {
  const errors: string[] = [];
  const issues = (id: string, message: string) => errors.push(id + ": " + message);
  if (input.schemaVersion !== "f5-1-source-review-pilots-v1" ||
    input.state !== "all_unreviewed_no_publication")
    issues("packet", "only unsigned source-review leads are accepted");
  if (!isMilestoneIsoDate(input.sourceReviewDate) || !isMilestoneIsoDate(refs.corpusCutoff))
    issues("packet", "review date and curated corpus cutoff must be real dates");
  const projects = new Set(refs.projects.map(x => x.id));
  const sources = new Map(refs.sources.map(x => [x.id, x]));
  const m3 = new Map(refs.existingM3Queue.map(x => [x.id, x]));
  const finance = new Map(refs.finances.map(x => [x.id, x]));
  const publishedIds = new Set(refs.publicMilestoneIds);
  const ids = new Set<string>();
  const signatures = new Set<string>();
  let previous = "";
  const cases = [];
  for (const c of input.cases) {
    if (!nonblank(c.id) || ids.has(c.id) || (previous && c.id <= previous))
      issues(c.id, "pilot review IDs must be unique and strictly sorted");
    previous = c.id;
    ids.add(c.id);
    if (!projects.has(c.projectId)) issues(c.id, "unresolved project");
    if (!nonblank(c.sourceUrl) || !c.sourceUrl.startsWith("https://"))
      issues(c.id, "source must provide an HTTPS original URL");
    if (!isMilestoneIsoDate(c.publishedOn) || !nonblank(c.sourcePublisher))
      issues(c.id, "issuer publication date/publisher invalid");
    if (!nonblank(c.editorialDecision))
      issues(c.id, "human review question must be explicit");
    const source = sources.get(c.sourceId);
    const blockers: string[] = [];
    let boundary: {date:string;basis:"publication"|"access"}|null=null;
    if (source) {
      if (source.url !== c.sourceUrl || source.publisher !== c.sourcePublisher)
        issues(c.id, "source registry URL/publisher identity mismatch");
      if (source.confidence !== "primary") issues(c.id, "source is not primary");
      if (source.datePublished !== c.publishedOn)
        issues(c.id, "source publication date disagrees with registered source");
      boundary = source.datePublished
        ? { date: source.datePublished, basis: "publication" }
        : { date: source.dateAccessed, basis: "access" };
    } else {
      blockers.push("register_full_original_primary_source");
    }
    if (c.track === "existing_m3_review") {
      if (!c.existingReviewId || c.proposal !== null)
        issues(c.id, "existing M3 review must reference one original queue row without a duplicate proposal");
      const row = c.existingReviewId ? m3.get(c.existingReviewId) : null;
      if (!row || row.projectId !== c.projectId || row.sourceId !== c.sourceId)
        issues(c.id, "missing or mismatched existing M3 review row");
      if (row?.gate === "taxonomy_blocked" && c.reviewStatus !== "taxonomy_blocked")
        issues(c.id, "must preserve existing taxonomy hold");
      if (row?.gate !== "taxonomy_blocked" && c.reviewStatus !== "pending_human_review")
        issues(c.id, "existing ordinary M3 review must remain unsigned");
      for (const rowId of row?.relatedFinanceIds ?? []) {
        if (!finance.has(rowId)) issues(c.id, "unresolved M3 financing reference: " + rowId);
      }
      if (row?.gate === "taxonomy_blocked") blockers.push("existing_M3_taxonomy_gate");
      else blockers.push("existing_M3_human_adjudication");
    } else if (c.track === "new_review_candidate") {
      if (c.existingReviewId !== null || !c.proposal)
        issues(c.id, "new proposal needs unadjudicated scoped statement, not M3 duplication");
      if (c.reviewStatus !== (source
        ? "pending_human_review" : "pending_source_registration_and_human_review"))
        issues(c.id, "new proposal review state must reflect source registration");
      if (c.proposal) {
        const p = c.proposal;
        if (!PROJECT_MILESTONE_KINDS.includes(p.kind) ||
          !PROJECT_MILESTONE_SCOPES.includes(p.scope))
          issues(c.id, "proposal uses unsupported milestone taxonomy");
        if (p.claimMode !== "occurred" || p.targetOn !== null ||
          p.occurredOn !== null && !isMilestoneIsoDate(p.occurredOn))
          issues(c.id, "claim must retain occurred vs planned and exact-date boundaries");
        if (p.occurredOn && p.occurredOn > c.publishedOn)
          issues(c.id, "event date cannot follow cited publication");
        if (p.scope === "whole_project" && p.scopeAsStated !== null ||
            p.scope !== "whole_project" && !nonblank(p.scopeAsStated))
          issues(c.id, "scope statement does not match taxonomy");
        if (!nonblank(p.statementOriginal) || p.statementOriginal !== p.statementEn ||
            p.statementEnSource !== "na" || !nonblank(p.locator) ||
            !nonblank(p.editorialCaution))
          issues(c.id, "source quotation/English provenance, pinpoint and caveat required");
        if (source && source.language !== "en")
          issues(c.id, "proposed English passage conflicts with source language");
        const signature=JSON.stringify([c.projectId,c.sourceId,p.kind,p.scope,p.scopeAsStated,p.occurredOn]);
        if(signatures.has(signature))issues(c.id,"duplicate review proposal of same sourced physical event");
        signatures.add(signature);
        if(refs.existingM3Queue.some(x=>x.projectId===c.projectId && x.sourceId===c.sourceId))
          issues(c.id, "duplicate of existing M3 source-review claim");
      }
      blockers.push("independent_human_source_adjudication");
    } else {
      issues(c.id, "unknown review route");
    }
    if (input.sourceReviewDate > refs.corpusCutoff)
      blockers.push("curated_corpus_cutoff_requires_separate_approval");
    if (publishedIds.size > 0 && [...publishedIds].some(id => id===c.id))
      issues(c.id, "pilot review ID collides with public milestone");
    cases.push({
      id:c.id, projectId:c.projectId, sourceId:c.sourceId,
      track:c.track, existingReviewId:c.existingReviewId,
      sourceRegistered:Boolean(source), sourceEvidenceBoundary:boundary,
      proposedKind:c.proposal?.kind??null,
      proposedScope:c.proposal?.scope??null,
      proposedOccurredOn:c.proposal?.occurredOn??null,
      releaseBlockers:blockers,publicationEligible:false as const,
    });
  }
  const result: F5PilotReadinessReport={
    schemaVersion:"f5-1-readiness-v1",publicationAuthorized:false,
    publicMilestoneCount:refs.publicMilestoneIds.length,
    corpusCutoff:refs.corpusCutoff,sourceReviewDate:input.sourceReviewDate,
    totals:{
      cases:cases.length,
      existingM3:cases.filter(x=>x.track==="existing_m3_review").length,
      newProposals:cases.filter(x=>x.track==="new_review_candidate").length,
      missingRegisteredSources:cases.filter(x=>!x.sourceRegistered).length,
      taxonomyBlocked:cases.filter(x=>x.releaseBlockers.includes("existing_M3_taxonomy_gate")).length,
      humanReviewRequired:cases.length,
    },
    cases, errors,
    limitations:[
      "Every item remains a research lead. This audit cannot record or substitute for a human review attestation.",
      "The existing M3.2 review gate remains authoritative for Alcoa, Narva and Burntlog; no duplicate project-source approvals are created.",
      "A registered source is not proof of a completed editorial review or exact occurrence day.",
      "The site's curated corpus cutoff cannot be advanced or reviewer signatures backdated to satisfy an automated script.",
      "Nothing is written to data/seed/project-milestones.json, the public site, exports, or financing status histories.",
    ],
  };
  return result;
}
