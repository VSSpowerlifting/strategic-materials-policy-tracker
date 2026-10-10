/**
 * M3.2 editorial intake audit. This script is deliberately confined to scripts/
 * and research/; no app/, components/, or lib/data.ts reader may import drafts.
 *
 * This is NOT a promotion mechanism. Its "passes" mean references and boundaries
 * are structurally consistent, not that original-source interpretation is approved.
 */
import {
  PROJECT_MILESTONE_KINDS, PROJECT_MILESTONE_SCOPES,
  type FinancialCommitment, type Project, type Source,
} from "../lib/types";
import { isMilestoneIsoDate, milestoneEvidenceBoundary } from "../lib/project-milestones";

export const M3_2_REVIEW_GATES = ["human_source_review", "taxonomy_blocked"] as const;

type PilotRow = {
  id: string; projectId: string; sourceId: string; kindProposal: string;
  scopeProposal: string; scopeAsStated: string | null;
  claimMode: "occurred" | "planned"; occurredOn: string | null; targetOn: string | null;
  statementOriginal: string; statementEn: string; statementEnSource: string;
  locator: string; relatedFinanceIds: string[];
  gate: (typeof M3_2_REVIEW_GATES)[number]; reviewVerdict: "unreviewed";
  taxonomyQuestion: string | null; editorialCaution: string;
};
type ReferenceSource = Pick<Source, "id" | "language" | "confidence" | "datePublished" | "dateAccessed">;
type ReferenceCommitment = Pick<FinancialCommitment, "id" | "projectId" | "implementationStatusHistory">;

export type PilotAuditResult = {
  status: "non_publication_editorial_queue";
  corpusCutoff: string;
  candidates: {
    id: string; projectId: string; sourceId: string;
    gate: (typeof M3_2_REVIEW_GATES)[number];
    sourceBoundary: { date: string; basis: "publication" | "access" } | null;
    deduplicatedLegacyFinanceObservations: number;
  }[];
  summary: { awaitingHumanSourceReview: number; blockedOnTaxonomy: number };
  errors: string[];
};

const textPresent = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
// [] explicitly means this is an independent project-native observation.
// Never manufacture a finance-row implementation status to admit a project event.
const sortedUnique = (arr: string[]) =>
  arr.every((x, i) => textPresent(x) && (i === 0 || arr[i - 1] < x));

/**
 * A source-first REVIEW-QUEUE validator. Output never contains a promoted
 * milestone or populated review identity; no seed mutations are possible.
 */
export function auditProjectExecutionPilot(
  raw: unknown,
  refs: {
    projects: readonly Pick<Project, "id">[];
    sources: readonly ReferenceSource[];
    commitments: readonly ReferenceCommitment[];
    corpusCutoff: string;
  },
): PilotAuditResult {
  const errors: string[] = [];
  const output: PilotAuditResult = {
    status: "non_publication_editorial_queue",
    corpusCutoff: refs.corpusCutoff,
    candidates: [],
    summary: { awaitingHumanSourceReview: 0, blockedOnTaxonomy: 0 },
    errors,
  };
  if (!isMilestoneIsoDate(refs.corpusCutoff)) {
    errors.push("corpusCutoff must be a real YYYY-MM-DD date");
    return output;
  }
  if (!Array.isArray(raw)) {
    errors.push("M3.2 editorial queue must be a JSON array");
    return output;
  }
  const projects = new Set(refs.projects.map((p) => p.id));
  const sources = new Map(refs.sources.map((s) => [s.id, s]));
  const financiers = new Map(refs.commitments.map((f) => [f.id, f]));
  const seen = new Set<string>();
  let prev = "";
  const usedSourceAssertions = new Set<string>();

  for (const [index, item] of raw.entries()) {
    const r = record(item) ? item : {};
    const id = textPresent(r.id) ? r.id : "(missing at index " + index + ")";
    const fail = (message: string) => errors.push(id + ": " + message);
    if (!/^review-m3-2-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
      fail("review id must use the review-m3-2- namespace");
    if (seen.has(id)) fail("duplicate review id");
    if (prev && prev >= id) fail("review ids must be sorted ascending");
    seen.add(id);
    prev = id;

    if (!textPresent(r.projectId) || !projects.has(r.projectId))
      fail("projectId does not resolve to published registry");
    const source = textPresent(r.sourceId) ? sources.get(r.sourceId) : undefined;
    if (!source) fail("sourceId does not resolve to published registry");
    else if (source.confidence !== "primary")
      fail("evidence source is not marked primary");

    const boundary = source ? milestoneEvidenceBoundary(source) : null;
    if (!boundary) fail("source has no valid publication/access evidence boundary");
    else if (boundary.date > refs.corpusCutoff)
      fail("source evidence boundary postdates curated corpus cutoff");
    if (source && source.datePublished !== null && source.datePublished !== undefined &&
      !isMilestoneIsoDate(source.datePublished))
      fail("invalid original source publication date");

    if (r.claimMode !== "occurred") fail("pilot currently accepts occurred claims only");
    if (r.targetOn !== null) fail("pilot occurred milestone must have targetOn: null");
    if (r.occurredOn !== null && !isMilestoneIsoDate(r.occurredOn))
      fail("occurredOn must be a real date or null");
    if (isMilestoneIsoDate(r.occurredOn) && r.occurredOn > refs.corpusCutoff)
      fail("proposed occurrence postdates curated corpus cutoff");
    if (isMilestoneIsoDate(r.occurredOn) && boundary && r.occurredOn > boundary.date)
      fail("occurred date postdates source evidence boundary");
    // Match the published ProjectMilestone contract exactly: a whole-project
    // assertion must carry null, while every narrower scope needs a named part.
    // This validates structure only; it never authorizes broad source claims.
    if (r.scopeProposal === "whole_project") {
      if (r.scopeAsStated !== null)
        fail("whole_project requires scopeAsStated: null");
    } else if (!textPresent(r.scopeAsStated) || r.scopeAsStated.length > 250) {
      fail("named facility, funded activity and taxonomy-held scopes require a bounded scopeAsStated");
    }
    if (!textPresent(r.kindProposal) || !textPresent(r.scopeProposal))
      fail("proposed kind and scope are required");
    if (!textPresent(r.statementOriginal) || !textPresent(r.statementEn) ||
      r.statementOriginal.length > 600 || r.statementEn.length > 600)
      fail("a bounded quoted passage in original and English is required");
    if (source?.language === "en" &&
        (r.statementEnSource !== "na" || r.statementOriginal !== r.statementEn))
      fail("English original must have identical English passage and na translation");
    if (!textPresent(r.locator)) fail("source locator required");
    if (!textPresent(r.editorialCaution) || r.editorialCaution.length > 700)
      fail("non-promotion interpretation caveat required (1-700 characters; must fit eventual milestone note)");

    // Drafts must never carry a claimed reviewer, approval, date, or published
    // milestone identity: those belong only to separate human-gated promotion.
    if (r.reviewVerdict !== "unreviewed" || "reviewedBy" in r ||
      "reviewedAt" in r || "milestoneId" in r)
      fail("review queue cannot contain promoted or purportedly approved assertions");

    const canonical = PROJECT_MILESTONE_KINDS.includes(r.kindProposal as typeof PROJECT_MILESTONE_KINDS[number]) &&
      PROJECT_MILESTONE_SCOPES.includes(r.scopeProposal as typeof PROJECT_MILESTONE_SCOPES[number]);
    if (r.gate === "human_source_review") {
      output.summary.awaitingHumanSourceReview++;
      if (!canonical) fail("human_source_review requires existing canonical kind and scope");
      if (r.taxonomyQuestion !== null) fail("human_source_review cannot include unresolved taxonomy question");
    } else if (r.gate === "taxonomy_blocked") {
      output.summary.blockedOnTaxonomy++;
      if (!textPresent(r.taxonomyQuestion)) fail("taxonomy_blocked requires a concrete taxonomy question");
      if (canonical) fail("taxonomy_blocked with canonical labels needs explicit editorial review instead");
    } else {
      fail("gate must be human_source_review or taxonomy_blocked");
    }
    if (r.kindProposal === "funded_activity_completed" && r.scopeProposal !== "funded_activity")
      fail("funded activity completion cannot be a whole-project/facility milestone");
    if (r.scopeProposal === "funded_activity" && r.kindProposal !== "funded_activity_completed")
      fail("funded activity scope must not assert facility construction or production");
    if (r.kindProposal === "construction_progress_reported") {
      if (r.claimMode !== "occurred")
        fail("construction_progress_reported requires occurred claim mode");
      if (r.scopeProposal !== "named_facility")
        fail("construction_progress_reported requires named_facility scope");
      if (r.occurredOn !== null)
        fail("construction_progress_reported requires occurredOn: null; report date is not a progress event day");
    }

    if (!Array.isArray(r.relatedFinanceIds) || !sortedUnique(r.relatedFinanceIds as string[])) {
      fail("relatedFinanceIds must be a sorted unique array (empty for project-native evidence)");
    } else {
      const linked = r.relatedFinanceIds as string[];
      // A project-native source may have no financial-row observation. However,
      // an empty array cannot be used to hide a real matching legacy observation
      // or to describe a "funded_activity" without any relevant funding record.
      if (linked.length === 0 && r.scopeProposal === "funded_activity")
        fail("funded_activity review requires an actual source-linked finance observation");
      if (linked.length === 0 && [...financiers.values()].some(f =>
        f.projectId === r.projectId &&
        f.implementationStatusHistory?.some(entry => entry.sourceId === r.sourceId)))
        fail("project-native review cannot omit existing matching finance/source observations");
      for (const fid of linked) {
        const f = financiers.get(fid);
        if (!f) {
          fail("finance reference " + fid + " does not resolve");
          continue;
        }
        if (f.projectId !== r.projectId)
          fail("finance reference " + fid + " belongs to a different project");
        if (!f.implementationStatusHistory?.some((entry) => entry.sourceId === r.sourceId))
          fail("finance reference " + fid + " has no matching legacy source observation");
      }
    }

    // Zero linked financial rows is permitted: source-first project execution is
    // independent of government financing. Never create a synthetic finance link.
    // All linked financial rows represent the same *proposed source assertion*.
    // Multiple financiers are never automatically counted as new milestones.
    const signature = JSON.stringify([
      r.projectId, r.sourceId, r.kindProposal, r.scopeProposal, r.occurredOn,
    ]);
    if (usedSourceAssertions.has(signature))
      fail("duplicate proposed source assertion across review candidates");
    usedSourceAssertions.add(signature);
    if (r.gate === "human_source_review" || r.gate === "taxonomy_blocked") {
      output.candidates.push({
        id, projectId: String(r.projectId ?? ""), sourceId: String(r.sourceId ?? ""),
        gate: r.gate, sourceBoundary: boundary,
        deduplicatedLegacyFinanceObservations: Array.isArray(r.relatedFinanceIds)
          ? r.relatedFinanceIds.length : 0,
      });
    }
  }
  return output;
}

export function formatPilotAudit(result: PilotAuditResult): string {
  return JSON.stringify(result, null, 2) + "\n";
}
