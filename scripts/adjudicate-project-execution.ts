/**
 * M3.2b — source-review adjudication gate.
 *
 * Intentional separation:
 * - reviewed decisions live in a gitignored LOCAL file;
 * - this pure function never commits, publishes, mutates seeds or authorizes
 *   source facts from the presence of a name/checkbox alone;
 * - approval yields only a NON-PUBLISHING candidate for maintainer inspection.
 */
import type { Project, ProjectMilestone, Source } from "../lib/types";
import {
  isMilestoneIsoDate, validateProjectMilestones,
} from "../lib/project-milestones";
import {
  auditProjectExecutionPilot,
} from "./review-project-execution-pilot";
import type { FinancialCommitment } from "../lib/types";
import { buildM3ReviewerPackets } from "./project-execution-review-packets";

export type SourceReviewDecision = {
  id: string;
  verdict: "pending" | "approved" | "rejected" | "needs_more_evidence";
  reviewedBy: string | null;
  reviewedAt: string | null;
  checks: {
    fullSourceRead: boolean;
    quotedPassageMatches: boolean;
    scopeIsExplicit: boolean;
    eventAndEvidenceDatesSeparated: boolean;
    noFinancingOrOperationsInference: boolean;
  };
  rationale: string | null;
  proposedMilestoneId: string | null;
  /** Manually copied from the exact source-review worksheet; not a source-body checksum. */
  reviewInputDigestSha256: string | null;
};

export type PendingProjectExecutionRow = {
  id: string; projectId: string; sourceId: string; kindProposal: string;
  scopeProposal: string; scopeAsStated: string | null; claimMode: "occurred" | "planned";
  occurredOn: string | null; targetOn: string | null;
  statementOriginal: string; statementEn: string; statementEnSource: string;
  locator: string; relatedFinanceIds: string[];
  gate: "human_source_review" | "taxonomy_blocked";
  reviewVerdict: "unreviewed"; taxonomyQuestion: string | null;
  editorialCaution: string;
};
type MilestoneRefs = {
  projects: readonly Project[];
  sources: readonly Source[];
  commitments: readonly FinancialCommitment[];
  corpusCutoff: string;
  publicMilestoneIds: readonly string[];
};

export type AdjudicationReport = {
  status: "human_adjudication_preview_only";
  counts: { pending: number; approved: number; rejected: number; needs_more_evidence: number };
  /** No item in this list may enter data/seed except by independent maintainer approval. */
  proposals: ProjectMilestone[];
  blocked: { id: string; reason: string }[];
  errors: string[];
};

const isRec = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const meaningful = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
const checklist = [
  "fullSourceRead",
  "quotedPassageMatches",
  "scopeIsExplicit",
  "eventAndEvidenceDatesSeparated",
  "noFinancingOrOperationsInference",
] as const;

/**
 * A preview is only a structurally eligible proposal, *never* a final
 * editorial publication decision. Real approval remains outside this function.
 */
export function adjudicateProjectExecutionReview(
  rows: unknown,
  decisions: unknown,
  refs: MilestoneRefs,
): AdjudicationReport {
  const report: AdjudicationReport = {
    status: "human_adjudication_preview_only",
    counts: { pending: 0, approved: 0, rejected: 0, needs_more_evidence: 0 },
    proposals: [], blocked: [], errors: [],
  };
  const bad = (id: string, message: string) => report.errors.push(id + ": " + message);
  const base = auditProjectExecutionPilot(rows, {
    projects: refs.projects, sources: refs.sources,
    commitments: refs.commitments, corpusCutoff: refs.corpusCutoff,
  });
  for (const error of base.errors) report.errors.push("source queue: " + error);
  if (!Array.isArray(rows) || !Array.isArray(decisions)) {
    report.errors.push("review input and adjudication decisions must both be arrays");
    return report;
  }
  if (base.errors.length > 0) return report;
  // The human records which exact registered claim/source/finance context was
  // reviewed. Merely storing a checklist/name cannot carry approval to a
  // different quote, URL, facility, finance status, or curator cutoff.
  let inputDigests: Map<string, string>;
  try {
    const packetReport = buildM3ReviewerPackets(rows, {
      projects: refs.projects, sources: refs.sources,
      commitments: refs.commitments, corpusCutoff: refs.corpusCutoff,
      publicMilestoneCount: refs.publicMilestoneIds.length,
    });
    inputDigests = new Map(packetReport.worksheets.map(w => [w.id, w.reviewInputDigestSha256]));
  } catch (error) {
    report.errors.push("cannot pin human review to current source metadata: " +
      (error instanceof Error ? error.message : String(error)));
    return report;
  }
  const q = rows as PendingProjectExecutionRow[];
  if (q.length !== decisions.length)
    report.errors.push("a decision (including pending) is required for every source-review candidate");
  const knownIds = new Set(q.map((r) => r.id));
  const decisionIds = new Set<string>();
  const newIds = new Set<string>();
  const liveIds = new Set(refs.publicMilestoneIds);

  for (const [index, x] of decisions.entries()) {
    const d = isRec(x) ? x : {};
    const id = meaningful(d.id) ? d.id : "(missing decision " + index + ")";
    if (!knownIds.has(id)) bad(id, "unknown source-review candidate");
    if (decisionIds.has(id)) bad(id, "duplicate adjudication decision");
    if (q[index]?.id !== id) bad(id, "adjudications must exactly follow review-queue order");
    decisionIds.add(id);
    const row = q.find((r) => r.id === id);
    if (!row) continue;
    if (!["pending","approved","rejected","needs_more_evidence"].includes(String(d.verdict))) {
      bad(id, "unknown review verdict");
      continue;
    }
    const verdict = d.verdict as SourceReviewDecision["verdict"];
    report.counts[verdict]++;
    const checks = isRec(d.checks) ? d.checks : {};
    if (checklist.some((k) => typeof checks[k] !== "boolean"))
      bad(id, "all five source-review checklist booleans must be explicit");
    if (d.rationale !== null && (!meaningful(d.rationale) || d.rationale.length > 1200))
      bad(id, "rationale must be null or nonempty bounded prose");
    if (d.reviewedBy !== null && (!meaningful(d.reviewedBy) || d.reviewedBy.length > 120))
      bad(id, "reviewedBy must be null or a real named reviewer");
    if (d.reviewedAt !== null && !isMilestoneIsoDate(d.reviewedAt))
      bad(id, "reviewedAt must be null or a real YYYY-MM-DD date");

    if (verdict === "pending") {
      if (d.reviewedAt !== null || d.reviewedBy !== null ||
        d.proposedMilestoneId !== null || d.rationale !== null ||
        d.reviewInputDigestSha256 !== null ||
        checklist.some((k) => checks[k] !== false))
        bad(id, "pending cannot impersonate a completed review");
      continue;
    }
    if (!meaningful(d.reviewedBy) || !isMilestoneIsoDate(d.reviewedAt))
      bad(id, "recording a verdict requires named reviewer and actual reviewedAt date");
    if (!meaningful(d.rationale))
      bad(id, "non-pending verdict requires an explicit explanation");
    if (typeof d.reviewInputDigestSha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(d.reviewInputDigestSha256)) {
      bad(id, "completed review requires a current 64-hex worksheet reviewInputDigestSha256");
      continue;
    }
    if (d.reviewInputDigestSha256 !== inputDigests.get(id)) {
      bad(id, "review input fingerprint differs from current queue/source/project/finance context; re-review the original evidence and re-attest");
      continue;
    }

    if (verdict !== "approved") {
      if (d.proposedMilestoneId !== null)
        bad(id, "only approved review may nominate a milestone ID");
      continue;
    }
    if (row.gate !== "human_source_review") {
      report.blocked.push({ id, reason: "Unresolved taxonomy blocks approval; do not override with checklist." });
      continue;
    }
    if (checklist.some((k) => checks[k] !== true)) {
      report.blocked.push({ id, reason: "All five original-source checks must be attested by a human reviewer." });
      continue;
    }
    if (!meaningful(d.proposedMilestoneId) || !/^mil-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.proposedMilestoneId)) {
      bad(id, "approved review requires a valid proposed mil- ID");
      continue;
    }
    if (liveIds.has(d.proposedMilestoneId) || newIds.has(d.proposedMilestoneId)) {
      bad(id, "proposed milestone ID already exists or is used twice");
      continue;
    }
    newIds.add(d.proposedMilestoneId);
    if (!isMilestoneIsoDate(d.reviewedAt)) continue;
    // A review on Oct 8 must NOT be forged as Oct 7 to pass a stale curated
    // cutoff. Stop and request an explicitly authorized corpus refresh.
    if (d.reviewedAt > refs.corpusCutoff) {
      report.blocked.push({
        id,
        reason: "Reviewer date postdates curated corpus cutoff; requires a separately authorized site.lastUpdated revision.",
      });
      continue;
    }
    const proposal: ProjectMilestone = {
      id: d.proposedMilestoneId, projectId: row.projectId,
      kind: row.kindProposal as ProjectMilestone["kind"],
      claimMode: row.claimMode, scope: row.scopeProposal as ProjectMilestone["scope"],
      scopeAsStated: row.scopeAsStated, occurredOn: row.occurredOn,
      targetOn: row.targetOn, sourceId: row.sourceId, locator: row.locator,
      statementOriginal: row.statementOriginal, statementEn: row.statementEn,
      statementEnSource: row.statementEnSource as ProjectMilestone["statementEnSource"],
      reviewedBy: d.reviewedBy as string, reviewedAt: d.reviewedAt, note: row.editorialCaution,
    };
    const issues = validateProjectMilestones([proposal], {
      projects: refs.projects, sources: refs.sources, corpusDate: refs.corpusCutoff,
    });
    if (issues.length > 0) {
      for (const issue of issues) bad(id, "published milestone contract would fail: " + issue);
      continue;
    }
    report.proposals.push(proposal);
  }
  for (const row of q)
    if (!decisionIds.has(row.id)) bad(row.id, "missing adjudication decision");

  // No output can be treated as publishable when any decision is structurally
  // invalid. Distinguish this from independent factual source-review approval.
  if (report.errors.length > 0) report.proposals = [];
  return report;
}
