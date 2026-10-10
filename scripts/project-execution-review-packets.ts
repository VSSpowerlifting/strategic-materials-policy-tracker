/**
 * M3/F5 reviewer packet — source-first and read-only.
 *
 * The digest pins the REVIEW INPUT METADATA, not the external source body.
 * Packets are worksheets; they never attest review, create a public claim or
 * read a local private adjudication file.
 */
import { createHash } from "node:crypto";
import type { FinancialCommitment, Project, Source } from "../lib/types";
import { auditProjectExecutionPilot } from "./review-project-execution-pilot";
import type { PendingProjectExecutionRow } from "./adjudicate-project-execution";

type Refs = {
  projects: readonly Project[];
  sources: readonly Source[];
  commitments: readonly FinancialCommitment[];
  corpusCutoff: string;
  publicMilestoneCount: number;
};

export type ReviewerWorksheet = {
  id: string;
  status: "unsigned_source_review" | "taxonomy_blocked";
  humanAttestationPresent: false;
  project: { id: string; name: string };
  originalSource: {
    id: string; title: string; publisher: string; url: string;
    language: string;
    publishedOn: string | null;
    accessedOn: string;
    evidenceBoundary: {date: string; basis: "publication" | "access"};
  };
  proposedObservation: {
    kind: string; scope: string; scopeAsStated: string | null;
    claimMode: "occurred" | "planned";
    occurredOn: string | null; targetOn: string | null;
    originalStatement: string; englishStatement: string;
    translationBasis: string; locator: string;
  };
  financingObservationReferences: string[];
  taxonomyQuestion: string | null;
  editorialCaution: string;
  reviewerChecks: readonly string[];
  reviewInputDigestSha256: string;
  digestMeaning: "registry_metadata_fingerprint_not_archived_document_hash";
};

export type M3ReviewerPacketReport = {
  schemaVersion: "m3-reviewer-packet-1";
  purpose: "private_human_original_source_adjudication";
  curatedCorpusCutoff: string;
  publicationAuthorized: false;
  automaticSourceApprovalAuthorized: false;
  publicMilestoneCount: number;
  requestedId: string | null;
  totalQueueCandidates: number;
  awaitingSourceReview: number;
  blockedOnTaxonomy: number;
  worksheets: ReviewerWorksheet[];
  limitations: string[];
};

const stableCompare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
const questions = [
  "Read the FULL original publisher document, including the specified section; independently confirm the proposed exact passage and its speaker.",
  "Verify project identity and precisely which named facility, project component, or funded activity the statement actually concerns.",
  "Separate physical event day, reporting period, original publication day, source-access receipt, and actual reviewer decision date.",
  "Check occurred versus planned status, chronology and translation provenance; preserve unknown physical dates as null.",
  "Check that grants, commitments, disbursements, corporate project costs, and financing-linked physical comments are not conflated; do not infer causality.",
] as const;

function validWebSource(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname.length > 0 && !parsed.username && !parsed.password;
  } catch { return false; }
}

/**
 * Validate the ENTIRE candidate queue before any filtering. A single corrupt
 * candidate or missing primary source must not produce plausible worksheets.
 * The returned report contains no reviewer names, votes, private files or
 * seed-writing operations.
 */
export function buildM3ReviewerPackets(
  queue: unknown,
  refs: Refs,
  requestedId: string | null = null,
): M3ReviewerPacketReport {
  const audited = auditProjectExecutionPilot(queue, {
    projects: refs.projects, sources: refs.sources,
    commitments: refs.commitments, corpusCutoff: refs.corpusCutoff,
  });
  if (audited.errors.length)
    throw new Error("M3 review queue invalid: " + audited.errors.join(" | "));
  if (!Number.isSafeInteger(refs.publicMilestoneCount) || refs.publicMilestoneCount < 0)
    throw new Error("Invalid current public milestone count");
  if (requestedId !== null && !/^review-m3-2-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedId))
    throw new Error("Invalid review ID");

  const sourceMap = new Map(refs.sources.map(s => [s.id, s]));
  const projectMap = new Map(refs.projects.map(p => [p.id, p]));
  const financeMap = new Map(refs.commitments.map(f => [f.id, f]));
  const evidenceBoundaries = new Map(audited.candidates.map(c => [c.id, c.sourceBoundary]));
  const fullQueue = [...(queue as PendingProjectExecutionRow[])].sort((a,b) => stableCompare(a.id, b.id));
  if (requestedId !== null && !fullQueue.some(r => r.id === requestedId))
    throw new Error("Unknown M3 review ID: " + requestedId);

  const worksheets: ReviewerWorksheet[] = fullQueue
    .filter(row => requestedId === null || row.id === requestedId)
    .map(row => {
      const source = sourceMap.get(row.sourceId)!;
      const project = projectMap.get(row.projectId)!;
      const boundary = evidenceBoundaries.get(row.id);
      if (!boundary) throw new Error("Missing verified source boundary for " + row.id);
      if (!validWebSource(source.url))
        throw new Error("Unusable primary source URL for " + row.id);
      const financeReferences = row.relatedFinanceIds.map(id => {
        const f = financeMap.get(id);
        if (!f) throw new Error("Unresolved finance row in " + row.id);
        return {
          id: f.id,
          projectId: f.projectId,
          matchingSourceObservations: f.implementationStatusHistory
            .filter(h => h.sourceId === row.sourceId),
        };
      });
      return {
        id: row.id,
        status: row.gate === "taxonomy_blocked" ? "taxonomy_blocked" : "unsigned_source_review",
        humanAttestationPresent: false,
        project: {id: project.id, name: project.name},
        originalSource: {
          id: source.id, title: source.title, publisher: source.publisher,
          url: source.url, language: source.language,
          publishedOn: source.datePublished ?? null,
          accessedOn: source.dateAccessed,
          evidenceBoundary: boundary,
        },
        proposedObservation: {
          kind: row.kindProposal, scope: row.scopeProposal,
          scopeAsStated: row.scopeAsStated, claimMode: row.claimMode,
          occurredOn: row.occurredOn, targetOn: row.targetOn,
          originalStatement: row.statementOriginal,
          englishStatement: row.statementEn,
          translationBasis: row.statementEnSource, locator: row.locator,
        },
        financingObservationReferences: [...row.relatedFinanceIds],
        taxonomyQuestion: row.taxonomyQuestion,
        editorialCaution: row.editorialCaution,
        reviewerChecks: [...questions],
        reviewInputDigestSha256: digest({
          corpusCutoff: refs.corpusCutoff, row,
          source: {
            id: source.id, title: source.title, publisher: source.publisher,
            url: source.url, language: source.language,
            confidence: source.confidence, datePublished: source.datePublished ?? null,
            dateAccessed: source.dateAccessed,
          },
          project: {id: project.id, name: project.name},
          financeReferences,
        }),
        digestMeaning: "registry_metadata_fingerprint_not_archived_document_hash",
      };
    });
  return {
    schemaVersion: "m3-reviewer-packet-1",
    purpose: "private_human_original_source_adjudication",
    curatedCorpusCutoff: refs.corpusCutoff,
    publicationAuthorized: false,
    automaticSourceApprovalAuthorized: false,
    publicMilestoneCount: refs.publicMilestoneCount,
    requestedId,
    totalQueueCandidates: fullQueue.length,
    awaitingSourceReview: audited.summary.awaitingHumanSourceReview,
    blockedOnTaxonomy: audited.summary.blockedOnTaxonomy,
    worksheets,
    limitations: [
      "Draft passages are queue proposals, not verified original-source quotations or independent physical-site confirmation.",
      "Review the full original source manually. Its registered metadata hash does not prove the website/PDF body was fetched or remained unchanged.",
      "The source publication date is an evidence boundary, not a substitute for an unknown physical occurrence date.",
      "A finance observation cross-reference is not a verified disbursement or a causal pathway.",
      "Human review must be recorded separately in the gitignored local M3 adjudication file and revalidated against the current queue.",
      "Even a human-approved local proposal is not published without a separate maintainer-approved seed/corpus PR.",
    ],
  };
}

const md = (s: string) => s.replace(/\s+/g, " ").replace(/[\\`*_{}\[\]<>|]/g, "\\$&");
const showDate = (s: string | null) => s ?? "UNKNOWN — do not substitute filing date";

/** Suitable for copying to an editorial desk. No interactive controls/approval. */
export function renderM3ReviewerPacketsMarkdown(report: M3ReviewerPacketReport): string {
  const lines: string[] = [
    "# M3/F5 original-source human-review worksheet",
    "",
    "**INTERNAL / UNSIGNED / NO PUBLICATION AUTHORIZATION**",
    "",
    "Curated corpus cutoff: " + md(report.curatedCorpusCutoff),
    "Registered M3 candidates: " + report.totalQueueCandidates +
      " | Awaiting human review: " + report.awaitingSourceReview +
      " | Taxonomy blocked: " + report.blockedOnTaxonomy,
    "Publicly registered native milestones: " + report.publicMilestoneCount,
    "",
  ];
  for (const w of report.worksheets) {
    const c = w.proposedObservation, s = w.originalSource;
    lines.push(
      "## " + md(w.project.name) + " — " + md(w.id), "",
      "**Review gate:** " + md(w.status === "taxonomy_blocked" ?
        "BLOCKED — resolve taxonomy before reviewing for publication" :
        "PENDING — full original-source human adjudication required"), "",
      "**Original publisher:** " + md(s.publisher),
      "**Primary source:** " + md(s.title),
      "**Source URL:** " + s.url,
      "**Source ID:** `" + s.id + "`",
      "**Published:** " + md(showDate(s.publishedOn)) +
        " | **Registry accessed:** " + md(s.accessedOn),
      "**Evidence boundary (NOT physical event day):** " +
        md(s.evidenceBoundary.date) + " (" + md(s.evidenceBoundary.basis) + ")",
      "**Claim mode:** " + md(c.claimMode) +
        " | **Kind proposal:** `" + md(c.kind) + "`",
      "**Scope proposal:** `" + md(c.scope) + "`" +
        (c.scopeAsStated ? " — " + md(c.scopeAsStated) : " — whole-project scope requires special scrutiny"),
      "**Physical occurredOn:** " + md(showDate(c.occurredOn)) +
        " | **targetOn:** " + md(showDate(c.targetOn)),
      "**Exact source pinpoint to check:** " + md(c.locator),
      "**Proposed quoted passage (UNVERIFIED):**",
      "> " + md(c.originalStatement), "",
      "**English statement / translation provenance:** " +
        md(c.englishStatement) + " (" + md(c.translationBasis) + ")",
      "**Financing-row source cross-references (not money/causality):** " +
        (w.financingObservationReferences.length ?
          w.financingObservationReferences.map(id => "`" + md(id) + "`").join(", ") :
          "NONE — independent project-native observation"),
      "**Editorial limitations:** " + md(w.editorialCaution), "",
    );
    if (w.taxonomyQuestion) lines.push(
      "**STOP — unresolved taxonomy question:** " + md(w.taxonomyQuestion), "");
    lines.push("**Reviewer verification checklist — all unchecked:**", "");
    for (const question of w.reviewerChecks)
      lines.push("- [ ] " + md(question));
    lines.push("", "**Local decision:** PENDING — no approval recorded",
      "**Input metadata SHA-256:** `" + w.reviewInputDigestSha256 + "`" +
        " (NOT a source-file checksum)", "",
      "---", "");
  }
  lines.push("## Release limitations", "");
  for (const limit of report.limitations) lines.push("- " + md(limit));
  lines.push("", "**Reviewer workflow:** Use the existing gitignored " +
    "`.project-execution-review/adjudications.json` and " +
    "`npm run audit:project-execution-adjudications` after actual independent source inspection. " +
    "No packet output is a source approval or seed-write command.", "");
  return lines.join("\n");
}
