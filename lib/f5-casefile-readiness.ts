/**
 * F5 casefile release readiness is a data-quality audit, NOT publication authority.
 *
 * Registered and syntactically validated reviewer fields do not replace human
 * verification of original-language source documents or casefile/browser QA.
 * This module never reads candidate research or changes the published corpus.
 */
import type { PathwayInputs } from "./evidence-pathway-contract";
import { buildProjectEvidencePathway } from "./project-evidence-pathway";
import { isMilestoneIsoDate, validateProjectMilestones } from "./project-milestones";

export const F5_PILOT_PROJECT_IDS = [
  "prj-au-alcoa-sojitz-gallium",
  "prj-ee-neo-rare-earth-magnet-project",
  "prj-us-stibnite",
] as const;

export type F5CasefilePilotGate = {
  projectId: string;
  projectName: string;
  registeredOccurredMilestones: number;
  registeredPlannedMilestones: number;
  occurredWithSourcePinpoint: number;
  legacyFinancePhysicalObservations: number;
  directFinanceReferences: number;
  nonallocativeFinanceAssociations: number;
  /** A candidate for additional human review, never permission to publish. */
  eligibleForManualQa: boolean;
  blockers: string[];
};

export type F5CasefileReadinessReport = {
  schemaVersion: "f5-casefile-gate-1";
  view: "current_corpus_revision";
  validationCorpusCutoff: string;
  /** Structural review fields cannot authorize production by themselves. */
  publicReleaseAuthorized: false;
  autonomousMilestoneApprovalAuthorized: false;
  inferredCausalityAuthorized: false;
  historicalFinancialTotalsAuthorized: false;
  allPilotsEligibleForManualQa: boolean;
  pilots: F5CasefilePilotGate[];
  nextGate: "milestone_evidence_review" | "manual_casefile_source_and_browser_qa";
  limitations: string[];
};

const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/**
 * Fail closed on malformed milestone dates/references BEFORE counting readiness.
 * A true eligibility flag means merely that structurally validated, pinpointed,
 * *registered* occurred claims exist; independent documentary verification and
 * maintainer release signoff remain mandatory.
 */
export function auditF5CasefileReadiness(
  input: PathwayInputs,
  corpusDate: string,
  projectIds: readonly string[] = F5_PILOT_PROJECT_IDS,
): F5CasefileReadinessReport {
  if (!isMilestoneIsoDate(corpusDate))
    throw new Error("F5 casefile gate: invalid corpus cutoff");
  if (!projectIds.length || new Set(projectIds).size !== projectIds.length ||
      projectIds.some(id => !id || !id.trim()))
    throw new Error("F5 casefile gate: pilot IDs must be nonempty and unique");

  const milestoneErrors = validateProjectMilestones(input.milestones, {
    projects: input.projects, sources: input.sources, corpusDate,
  });
  if (milestoneErrors.length)
    throw new Error("F5 casefile gate: invalid published milestone contract: " +
      milestoneErrors.join("; "));

  const pilots: F5CasefilePilotGate[] = [...projectIds].sort(lex).map(projectId => {
    // This projection first runs the typed evidence-reference audit; unresolved
    // event, project, finance or source relationships throw rather than degrade.
    const pathway = buildProjectEvidencePathway(projectId, input);
    const occurred = pathway.nativeMilestones.filter(m => m.claimMode === "occurred");
    const planned = pathway.nativeMilestones.filter(m => m.claimMode === "planned");
    const pinpointed = occurred.filter(m =>
      typeof m.evidence.locator === "string" && !!m.evidence.locator.trim()).length;
    const blockers: string[] = [];
    if (!occurred.length)
      blockers.push("no registered source-reviewed occurred project-native milestone");
    if (occurred.length && pinpointed !== occurred.length)
      blockers.push("one or more occurred milestones lack a precise source locator");
    if (!pathway.project.sources.length)
      blockers.push("project identity lacks source provenance in this projection");

    return {
      projectId, projectName: pathway.project.name,
      registeredOccurredMilestones: occurred.length,
      registeredPlannedMilestones: planned.length,
      occurredWithSourcePinpoint: pinpointed,
      legacyFinancePhysicalObservations: pathway.reviewGaps.legacyPhysicalObservationCount,
      directFinanceReferences: pathway.reviewGaps.directFinanceCount,
      nonallocativeFinanceAssociations: pathway.reviewGaps.nonallocativeFinanceAssociations,
      eligibleForManualQa: blockers.length === 0,
      blockers,
    };
  });

  const allPilotsEligibleForManualQa = pilots.every(p => p.eligibleForManualQa);
  return {
    schemaVersion: "f5-casefile-gate-1",
    view: "current_corpus_revision",
    validationCorpusCutoff: corpusDate,
    publicReleaseAuthorized: false,
    autonomousMilestoneApprovalAuthorized: false,
    inferredCausalityAuthorized: false,
    historicalFinancialTotalsAuthorized: false,
    allPilotsEligibleForManualQa,
    pilots,
    nextGate: allPilotsEligibleForManualQa
      ? "manual_casefile_source_and_browser_qa" : "milestone_evidence_review",
    limitations: [
      "Milestone review metadata is a declaration, not machine proof that the original source passage was independently checked.",
      "A missing project-native milestone is an evidence-review gap, not proof of stalled, failed or absent physical development.",
      "A finance-row implementation observation cannot substitute for an independently scoped project-native milestone.",
      "This is current-corpus data quality, not a historical known-as-of view, fiscal total or policy-impact assessment.",
      "Even complete pilot coverage never enables automatic publication: editorial source review, responsive and accessibility QA, and maintainer signoff remain separate.",
    ],
  };
}
