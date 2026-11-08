/**
 * Capital-to-execution comparison, layered on the Industrial Response matrix.
 *
 * This module never re-derives the matrix. It reads `buildIndustrialResponse`
 * rows and adds three source-linked views:
 *
 * 1. Physical evidence deduplicated by (source, status, date). Several
 *    financing rows can cite one physical observation; that is one
 *    observation, listed once with every financing row that cites it.
 * 2. An evidence tier per project: a human-reviewed project milestone, a
 *    usable implementation status carried on a financing row (not
 *    independently reviewed as a project milestone), or none.
 * 3. Conditionality: every directly linked government commitment that is not
 *    binding as of `asOf`, grouped by its recorded FINANCIAL_STATUSES value
 *    with the source's own note. No new categories are created.
 *
 * Everything here is a count or a list. No money is summed in this module.
 */
import { financialStatusEntryOn, legalStandingOn } from "./capital-control";
import { getAllFinancialCommitments, getAllProjectMilestones, getAllProjects } from "./data";
import { buildIndustrialResponse, type EvidenceLink, type ResponseProject } from "./industrial-response";
import {
  FINANCIAL_STATUSES,
  type FinancialCommitment,
  type FinancialStatus,
  type Project,
  type ProjectMilestone,
} from "./types";

export type PhysicalObservation = {
  sourceId: string;
  status: string;
  date: string | null;
  /** Every financing row whose latest implementation entry is this observation. */
  financialIds: string[];
};

export type ExecutionEvidenceTier = "reviewed_milestone" | "financing_row_status" | "none";

export type ExecutionProject = ResponseProject & {
  observations: PhysicalObservation[];
  milestones: ProjectMilestone[];
  tier: ExecutionEvidenceTier;
};

export type ConditionalCommitment = {
  financialId: string;
  projectId: string;
  projectName: string;
  instrument: FinancialCommitment["instrument"];
  provider: string | null;
  amountAsStated: string | null;
  status: FinancialStatus;
  date: string | null;
  sourceId: string;
  note: string | null;
  /** The same project also holds a binding government instrument. */
  projectHasBindingInstrument: boolean;
  /** The package this row is a component of, if any (never added to it). */
  partOf: string | null;
};

export type ConditionalGroup = { status: FinancialStatus; commitments: ConditionalCommitment[] };

/** Collapse identical (source, status, date) observations, keeping first-seen order. */
export function dedupePhysicalEvidence(entries: readonly EvidenceLink[]): PhysicalObservation[] {
  const byKey = new Map<string, PhysicalObservation>();
  for (const e of entries) {
    const key = `${e.sourceId}|${e.status}|${e.date ?? ""}`;
    const seen = byKey.get(key);
    if (seen) {
      if (!seen.financialIds.includes(e.financialId)) seen.financialIds.push(e.financialId);
    } else {
      byKey.set(key, { sourceId: e.sourceId, status: e.status, date: e.date, financialIds: [e.financialId] });
    }
  }
  return [...byKey.values()];
}

export function buildCapitalExecution(
  asOf: string,
  all: readonly FinancialCommitment[] = getAllFinancialCommitments(),
  projects: readonly Project[] = getAllProjects(),
  milestones: readonly ProjectMilestone[] = getAllProjectMilestones(),
) {
  const response = buildIndustrialResponse(asOf, all, projects);
  const byId = new Map(all.map((c) => [c.id, c]));

  const rows: ExecutionProject[] = response.rows.map((r) => {
    const observations = dedupePhysicalEvidence(r.physicalEvidence);
    const own = milestones.filter((m) => m.projectId === r.id);
    // "not_stated"/"not_applicable" entries are not physical evidence; the
    // matrix's physical axis already classes them as no usable record.
    const tier: ExecutionEvidenceTier = own.length
      ? "reviewed_milestone"
      : r.physical !== "no_record"
        ? "financing_row_status"
        : "none";
    return { ...r, observations, milestones: own, tier };
  });

  const conditional: ConditionalCommitment[] = [];
  for (const r of rows) {
    const hasBinding = r.finance === "binding";
    for (const link of r.financialEvidence) {
      const c = byId.get(link.financialId);
      if (!c || legalStandingOn(c, asOf) === "binding") continue;
      const entry = financialStatusEntryOn(c, asOf)!;
      conditional.push({
        financialId: c.id,
        projectId: r.id,
        projectName: r.name,
        instrument: c.instrument,
        provider: c.provider,
        amountAsStated: c.amount?.amountAsStated ?? null,
        status: entry.status,
        date: entry.date,
        sourceId: entry.sourceId,
        note: entry.note ?? null,
        projectHasBindingInstrument: hasBinding,
        partOf: c.relationships.find((x) => x.relationship === "part_of")?.commitmentId ?? null,
      });
    }
  }
  const conditionalGroups: ConditionalGroup[] = FINANCIAL_STATUSES.map((status) => ({
    status,
    commitments: conditional
      .filter((c) => c.status === status)
      .sort((a, b) => a.projectName.localeCompare(b.projectName) || a.financialId.localeCompare(b.financialId)),
  })).filter((g) => g.commitments.length);

  /** Binding or funded, yet no construction-or-later record: execution evidence to research. */
  const executionGaps = rows.filter(
    (r) => (r.finance === "binding" || r.funded) && r.physical !== "construction_or_later",
  );
  /** Construction or later reported while no binding public instrument is established. */
  const aheadOfBinding = rows.filter(
    (r) => r.finance === "binding_not_evidenced" && r.physical === "construction_or_later",
  );

  const tierCounts = {
    reviewed_milestone: rows.filter((r) => r.tier === "reviewed_milestone").length,
    financing_row_status: rows.filter((r) => r.tier === "financing_row_status").length,
    none: rows.filter((r) => r.tier === "none").length,
  } satisfies Record<ExecutionEvidenceTier, number>;

  return {
    response,
    rows,
    tierCounts,
    conditional,
    conditionalGroups,
    conditionalProjects: new Set(conditional.map((c) => c.projectId)).size,
    executionGaps,
    fundedGaps: executionGaps.filter((r) => r.funded),
    aheadOfBinding,
  };
}
