/**
 * The public Industrial Response evidence matrix.
 *
 * The denominator is distinct registered projects with at least one DIRECTLY
 * attributable, non-ended government commitment evidenced by `asOf`.
 * Financial status uses F4's source-evidence boundary. Physical histories are
 * revision-current because this corpus has no historical physical as-of model.
 * The axes are independent: do not infer causality, contract execution from
 * site construction, or physical inactivity from missing status evidence.
 *
 * This is a project COUNT, never a monetary sum. Parts and their packages
 * cannot double-count a project. associatedProjectIds are intentionally not
 * allocative and never qualify a project for this denominator.
 */
import { financialStatusEntryOn, legalStandingOn } from "./capital-control";
import { getAllFinancialCommitments, getAllProjects } from "./data";
import type { FinancialCommitment, ImplementationStatus, Project } from "./types";

export type FinanceAxis = "binding" | "binding_not_evidenced";
export type PhysicalAxis = "construction_or_later" | "other_reported" | "no_record";

export type EvidenceLink = {
  financialId: string;
  sourceId: string;
  status: string;
  date: string | null;
};

export type ResponseProject = {
  id: string;
  name: string;
  materials: string[];
  finance: FinanceAxis;
  /** Within the non-binding cell, distinguish pre-binding from unknown. */
  financeDetail: "binding" | "not_yet_binding" | "status_not_stated";
  physical: PhysicalAxis;
  /** One project-specific completed funded activity does not establish construction. */
  strictConstruction: boolean;
  exceptionalActivityOnly: boolean;
  funded: boolean;
  financialEvidence: EvidenceLink[];
  physicalEvidence: EvidenceLink[];
  financialIds: string[];
};

const EXECUTION_STATUSES: readonly ImplementationStatus[] = [
  "construction", "commissioning", "operational", "completed",
];
const OTHER_REPORTED = new Set<ImplementationStatus>([
  "announced", "feasibility", "suspended", "cancelled",
]);

/**
 * NRCan's completion refers to the "Kingston Demonstration Plant — Extended
 * Operations" funded activity, not independently to mine/facility construction.
 * The historical 2026-10-03 analysis expressly excluded it from a strict
 * physical-construction reading. Preserve both broad and strict variants.
 */
export const FUNDED_ACTIVITY_ONLY_PROJECT_ID = "prj-ca-cyclic-kingston-demonstration-plant";
const isActivityOnly = (projectId: string, status: ImplementationStatus) =>
  projectId === FUNDED_ACTIVITY_ONLY_PROJECT_ID && status === "completed";

export const FINANCE_ROWS = ["binding", "binding_not_evidenced"] as const;
export const PHYSICAL_COLUMNS = ["construction_or_later", "other_reported", "no_record"] as const;
export const matrixKey = (finance: FinanceAxis, physical: PhysicalAxis) => `${finance}|${physical}`;

export function buildIndustrialResponse(
  asOf: string,
  all: readonly FinancialCommitment[] = getAllFinancialCommitments(),
  projects: readonly Project[] = getAllProjects(),
) {
  const direct = new Map<string, FinancialCommitment[]>();
  for (const c of all) {
    if (!c.projectId) continue;
    direct.set(c.projectId, [...(direct.get(c.projectId) ?? []), c]);
  }

  const rows: ResponseProject[] = [];
  for (const project of projects) {
    const linked = direct.get(project.id) ?? [];
    const government = linked.filter((c) => {
      if (c.valueRole !== "commitment" || !c.providerJurisdiction) return false;
      const standing = legalStandingOn(c, asOf);
      return standing !== null && standing !== "ended";
    });
    if (!government.length) continue;

    const binding = government.filter((c) => legalStandingOn(c, asOf) === "binding");
    const notYetBinding = government.some((c) => legalStandingOn(c, asOf) === "not_yet_binding");
    const financialEvidence = government.map((c) => {
      const entry = financialStatusEntryOn(c, asOf)!;
      return { financialId: c.id, sourceId: entry.sourceId, status: entry.status, date: entry.date };
    });
    // Implementation belongs to its own evidentiary axis. We do not take a
    // financial row's signed/disbursed state as evidence of a physical milestone.
    const physicalEntries = linked.flatMap((c) =>
      c.implementationStatusHistory.slice(-1).map((entry) => ({
        financialId: c.id,
        sourceId: entry.sourceId,
        status: entry.status,
        date: entry.date,
      })),
    );
    const execution = physicalEntries.filter((x) =>
      EXECUTION_STATUSES.includes(x.status as ImplementationStatus),
    );
    const strict = execution.filter((x) => !isActivityOnly(project.id, x.status as ImplementationStatus));
    const other = physicalEntries.filter((x) => OTHER_REPORTED.has(x.status as ImplementationStatus));

    const financeDetail = binding.length ? "binding" : notYetBinding ? "not_yet_binding" : "status_not_stated";
    const finance: FinanceAxis = binding.length ? "binding" : "binding_not_evidenced";
    const physical: PhysicalAxis = execution.length ? "construction_or_later" : other.length ? "other_reported" : "no_record";
    rows.push({
      id: project.id,
      name: project.name,
      materials: [...project.materialIds],
      finance,
      financeDetail,
      physical,
      strictConstruction: strict.length > 0,
      exceptionalActivityOnly: execution.length > 0 && strict.length === 0,
      funded: government.some((c) => {
        const status = financialStatusEntryOn(c, asOf)?.status;
        return status === "partially_disbursed" || status === "disbursed";
      }),
      financialEvidence,
      physicalEvidence: physicalEntries,
      financialIds: linked.map((c) => c.id),
    });
  }
  rows.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : a.id < b.id ? -1 : 1);

  const matrix = FINANCE_ROWS.flatMap((finance) =>
    PHYSICAL_COLUMNS.map((physical) => ({
      key: matrixKey(finance, physical),
      finance,
      physical,
      projects: rows.filter((p) => p.finance === finance && p.physical === physical),
    })),
  );

  const directProjectIds = new Set(direct.keys());
  return {
    asOf,
    registryProjects: projects.length,
    financialRows: all.length,
    directLinkedProjects: [...directProjectIds].filter((id) => projects.some((p) => p.id === id)).length,
    governmentProjects: rows.length,
    bindingProjects: rows.filter((p) => p.finance === "binding").length,
    fundedProjects: rows.filter((p) => p.funded).length,
    reportedExecutionProjects: rows.filter((p) => p.physical === "construction_or_later").length,
    strictExecutionProjects: rows.filter((p) => p.strictConstruction).length,
    exceptionalActivityProjects: rows.filter((p) => p.exceptionalActivityOnly).length,
    noPhysicalRecordProjects: rows.filter((p) => p.physical === "no_record").length,
    projectlessGovernmentRows: all.filter((c) =>
      !c.projectId && c.valueRole === "commitment" && !!c.providerJurisdiction &&
      legalStandingOn(c, asOf) !== null && legalStandingOn(c, asOf) !== "ended",
    ).length,
    associatedButNotAllocatedLinks: all.reduce((n, c) => n + (c.associatedProjectIds?.length ?? 0), 0),
    matrix,
    rows,
  };
}
