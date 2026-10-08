/**
 * M3.1: read-only LEGACY physical-history inventory, NOT project milestones.
 *
 * A financing-row implementation note may describe a facility, funded activity
 * or whole undertaking; this function never chooses which. Repeated sources
 * across financiers remain visible but share an evidence group for review.
 */
import type { FinancialCommitment, Project, Source } from "./types";

export type LegacyExecutionObservation = {
  projectId: string;
  financialId: string;
  sourceId: string;
  status: string;
  statedStatusDate: string | null;
  sourcePublishedOn: string | null;
  note: string | null;
  evidenceGroup: string;
  scope: "not_adjudicated" | "known_funded_activity_exception";
  /** This is a request for review, never an assertion of facility-wide progress. */
  disposition: "needs_source_review";
};

export type LegacyExecutionGap = {
  financialId: string;
  projectId: string | null;
  associatedProjectIds: string[];
  sourceId: string;
  status: string;
  reason: "unallocated_project_association" | "no_attributable_project" |
    "unresolved_project" | "unresolved_source";
};

export type LegacyExecutionAudit = {
  label: "unreviewed_legacy_financing_row_evidence";
  countedFinanceRows: number;
  observations: LegacyExecutionObservation[];
  gaps: LegacyExecutionGap[];
  repeatedEvidenceGroups: { evidenceGroup: string; financialIds: string[] }[];
  /** Mixed reported statuses need source/scope review; not necessarily contradictions. */
  mixedStatusProjects: { projectId: string; statuses: string[] }[];
};

const byId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const KINGSTON_ID = "prj-ca-cyclic-kingston-demonstration-plant";
const KINGSTON_ACTIVITY_SOURCE_FINANCE_ID = "fin-ca-cmrdd-2024-cyclic-materials";

export function auditLegacyProjectExecution(
  commitments: readonly FinancialCommitment[],
  projects: readonly Pick<Project, "id">[],
  sources: readonly Pick<Source, "id" | "datePublished">[],
): LegacyExecutionAudit {
  const knownProjects = new Set(projects.map((p) => p.id));
  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const observations: LegacyExecutionObservation[] = [];
  const gaps: LegacyExecutionGap[] = [];

  for (const c of [...commitments].sort((a, b) => byId(a.id, b.id))) {
    for (const entry of c.implementationStatusHistory) {
      const base = {
        financialId: c.id,
        projectId: c.projectId,
        associatedProjectIds: [...(c.associatedProjectIds ?? [])].sort(byId),
        sourceId: entry.sourceId,
        status: entry.status,
      };
      if (!c.projectId) {
        gaps.push({
          ...base,
          reason: c.associatedProjectIds?.length
            ? "unallocated_project_association" : "no_attributable_project",
        });
        continue;
      }
      if (!knownProjects.has(c.projectId)) {
        gaps.push({ ...base, reason: "unresolved_project" });
        continue;
      }
      const source = sourcesById.get(entry.sourceId);
      if (!source) {
        gaps.push({ ...base, reason: "unresolved_source" });
        continue;
      }
      // Status+source+date identifies a repeated report for review, never a
      // canonical real-world event. Different sources reporting the same event
      // remain separate even if the stage label is the same.
      const evidenceGroup = JSON.stringify([c.projectId, entry.status, entry.date, entry.sourceId]);
      observations.push({
        projectId: c.projectId,
        financialId: c.id,
        sourceId: entry.sourceId,
        status: entry.status,
        statedStatusDate: entry.date,
        sourcePublishedOn: source.datePublished ?? null,
        note: entry.note ?? null,
        evidenceGroup,
        scope: c.projectId === KINGSTON_ID && c.id === KINGSTON_ACTIVITY_SOURCE_FINANCE_ID &&
          entry.status === "completed"
          ? "known_funded_activity_exception"
          : "not_adjudicated",
        disposition: "needs_source_review",
      });
    }
  }
  observations.sort((a, b) =>
    byId(a.projectId, b.projectId) || byId(a.sourceId, b.sourceId) ||
    byId(a.status, b.status) || byId(a.statedStatusDate ?? "", b.statedStatusDate ?? "") ||
    byId(a.financialId, b.financialId));
  gaps.sort((a, b) =>
    byId(a.financialId, b.financialId) || byId(a.sourceId, b.sourceId) ||
    byId(a.status, b.status) || byId(a.reason, b.reason));

  const grouped = new Map<string, string[]>();
  const statuses = new Map<string, Set<string>>();
  for (const obs of observations) {
    grouped.set(obs.evidenceGroup, [...(grouped.get(obs.evidenceGroup) ?? []), obs.financialId]);
    const set = statuses.get(obs.projectId) ?? new Set<string>();
    set.add(obs.status);
    statuses.set(obs.projectId, set);
  }
  return {
    label: "unreviewed_legacy_financing_row_evidence",
    countedFinanceRows: commitments.length,
    observations,
    gaps,
    repeatedEvidenceGroups: [...grouped.entries()]
      .filter(([, ids]) => new Set(ids).size > 1)
      .map(([evidenceGroup, ids]) => ({ evidenceGroup, financialIds: [...new Set(ids)].sort(byId) }))
      .sort((a, b) => byId(a.evidenceGroup, b.evidenceGroup)),
    mixedStatusProjects: [...statuses.entries()]
      .filter(([, set]) => set.size > 1)
      .map(([projectId, set]) => ({ projectId, statuses: [...set].sort(byId) }))
      .sort((a, b) => byId(a.projectId, b.projectId)),
  };
}

/** Deterministic read-only serialization. No timestamps or backfilled facts. */
export function formatLegacyExecutionAudit(report: LegacyExecutionAudit): string {
  return JSON.stringify(report, null, 2) + "\n";
}
