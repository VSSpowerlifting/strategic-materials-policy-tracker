/**
 * F4-B source-corpus historical amount coverage inventory.
 *
 * Pure, deterministic, non-allocative and NOT a certification of historical
 * amounts. No amounts are added, converted, inferred, or backfilled here.
 */
import type { FinancialCommitment, Source } from "./types";

export type F4AmountReviewCandidate = {
  recordId: string;
  priority: number;
  reviewQuestion: string;
  evidenceSourceIds: string[];
  limitation: string;
};

export type F4AmountCoverageRow = {
  recordId: string;
  valueRole: FinancialCommitment["valueRole"];
  instrument: FinancialCommitment["instrument"];
  hasCurrentAmount: boolean;
  history: "versions_recorded" | "history_unreviewed";
  recordedVersions: number;
};

export type F4AmountCoverageReport = {
  schemaVersion: "f4-b1";
  totals: {
    records: number;
    withCurrentAmount: number;
    withoutCurrentAmount: number;
    versionsRecorded: number;
    historyUnreviewed: number;
    candidateReviews: number;
  };
  byValueRole: {
    role: FinancialCommitment["valueRole"];
    records: number;
    versionsRecorded: number;
    historyUnreviewed: number;
  }[];
  rows: F4AmountCoverageRow[];
  reviewCandidates: F4AmountReviewCandidate[];
  historicalTotals: "not_authorized";
  interpretation: string;
};

const lex = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

export function auditF4AmountCoverage(
  commitments: readonly FinancialCommitment[],
  sources: readonly Source[],
  candidates: readonly F4AmountReviewCandidate[],
): F4AmountCoverageReport {
  const ids = new Set<string>();
  for (const row of commitments) {
    if (ids.has(row.id)) throw new Error("duplicate financing record: " + row.id);
    ids.add(row.id);
    if (row.financialAmountHistory && row.financialAmountHistory.length === 0)
      throw new Error("empty historical amount history: " + row.id);
  }
  const sourcesById = new Set(sources.map(s => s.id));
  const byId = new Map(commitments.map(row => [row.id, row]));
  const candidateIds = new Set<string>();
  for (const candidate of candidates) {
    if (candidateIds.has(candidate.recordId))
      throw new Error("duplicate F4 review candidate: " + candidate.recordId);
    candidateIds.add(candidate.recordId);
    const row = byId.get(candidate.recordId);
    if (!row) throw new Error("F4 candidate not in corpus: " + candidate.recordId);
    if (row.financialAmountHistory?.length)
      throw new Error("F4 candidate already has amount versions: " + candidate.recordId);
    if (!Number.isInteger(candidate.priority) || candidate.priority < 1 ||
        !candidate.reviewQuestion.trim() || !candidate.limitation.trim() ||
        candidate.evidenceSourceIds.length === 0 ||
        new Set(candidate.evidenceSourceIds).size !== candidate.evidenceSourceIds.length)
      throw new Error("invalid F4 triage fields: " + candidate.recordId);
    for (const sourceId of candidate.evidenceSourceIds) {
      if (!sourcesById.has(sourceId))
        throw new Error("F4 triage source missing: " + candidate.recordId + " / " + sourceId);
      if (!row.evidence.some(reference => reference.sourceId === sourceId))
        throw new Error("F4 triage source not linked in row evidence: " + candidate.recordId + " / " + sourceId);
    }
  }

  const rows = commitments.map((row): F4AmountCoverageRow => ({
    recordId: row.id,
    valueRole: row.valueRole,
    instrument: row.instrument,
    hasCurrentAmount: row.amount !== null,
    history: row.financialAmountHistory?.length ? "versions_recorded" : "history_unreviewed",
    recordedVersions: row.financialAmountHistory?.length ?? 0,
  })).sort((a, b) => lex(a.recordId, b.recordId));

  const versionsRecorded = rows.filter(row => row.history === "versions_recorded").length;
  const roles = [...new Set(rows.map(row => row.valueRole))].sort(lex);
  const byValueRole = roles.map(role => {
    const scoped = rows.filter(row => row.valueRole === role);
    const known = scoped.filter(row => row.history === "versions_recorded").length;
    return {
      role,
      records: scoped.length,
      versionsRecorded: known,
      historyUnreviewed: scoped.length - known,
    };
  });
  return {
    schemaVersion: "f4-b1",
    totals: {
      records: rows.length,
      withCurrentAmount: rows.filter(row => row.hasCurrentAmount).length,
      withoutCurrentAmount: rows.filter(row => !row.hasCurrentAmount).length,
      versionsRecorded,
      historyUnreviewed: rows.length - versionsRecorded,
      candidateReviews: candidates.length,
    },
    byValueRole,
    rows,
    reviewCandidates: candidates.map(c => ({
      recordId: c.recordId,
      priority: c.priority,
      reviewQuestion: c.reviewQuestion,
      evidenceSourceIds: [...c.evidenceSourceIds],
      limitation: c.limitation,
    })).sort((a, b) => a.priority - b.priority || lex(a.recordId, b.recordId)),
    historicalTotals: "not_authorized",
    interpretation: "Structured versions recorded does not certify history completeness. Unreviewed does not mean unchanged. Candidates are research questions, not approved revisions. No historical sums, payments, currency conversions, or retrospective known-as-of claims are made.",
  };
}
