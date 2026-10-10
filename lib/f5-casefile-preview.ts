/**
 * F5-3a: internal editorial casefile presentation projection.
 *
 * This has no route, API, export, sitemap entry, network side effect or
 * publication switch. It only consumes the curated, validated seed corpus.
 * It does NOT import the human-review candidate queues.
 */
import type { PathwayInputs } from "./evidence-pathway-contract";
import {
  buildProjectEvidencePathway,
  type PathwayFinanceParent, type PathwayMilestone,
  type PathwayPolicyContext, type PathwaySourceReference,
  type PathwayStatus,
} from "./project-evidence-pathway";
import { auditF5CasefileReadiness } from "./f5-casefile-readiness";

export type F5EditorialCasefilePreview = {
  schemaVersion: "f5-editorial-casefile-preview-1";
  audience: "private_editorial_review_only";
  view: "current_corpus_revision";
  corpusCutoff: string;
  publicReleaseAuthorized: false;
  autonomouslyApprovedClaims: false;
  policyCausalityAsserted: false;
  historicalMoneyTotalsAuthorized: false;
  project: {
    id: string;
    name: string;
    materialIds: string[];
    stages: string[];
    evidence: PathwaySourceReference[];
  };
  lanes: {
    /** Recorded parent events only; an adjacent export control is not a cause. */
    policy: PathwayPolicyContext[];
    finance: {
      id: string;
      eventId: string;
      instrument: string;
      valueRole: string;
      provider: string | null;
      recipient: string | null;
      relationship: "directly_attributable" | "nonallocative_association";
      allocationOrProjectCashSumAuthorized: false;
      financialStatusHistory: PathwayStatus[];
      evidence: PathwaySourceReference[];
      /** Never promote this count into the physical lane. */
      unreviewedFinancierPhysicalReports: number;
    }[];
    financePackageReferences: PathwayFinanceParent[];
    designations: {
      id: string;
      eventId: string;
      recognitionNotMoney: true;
      statusHistory: PathwayStatus[];
      evidence: PathwaySourceReference[];
    }[];
    physical: {
      occurred: PathwayMilestone[];
      planned: PathwayMilestone[];
      /**
       * 'No approved occurred claim' means no such register entry; it is
       * NOT evidence of stalled or absent physical activity.
       */
      occurredEvidence: "registered_reviewed_claims" | "no_approved_occurred_claims";
      legacyFinanceObservationsAwaitingReview: number;
      absenceMeansInactivity: false;
    };
  };
  readiness: {
    eligibleForManualSourceAndBrowserQa: boolean;
    blockers: string[];
  };
  limitations: string[];
};

const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Unknown occurrence/target days belong AFTER dated claims, never at time zero. */
const byPhysicalClock = (clock: "occurredOn" | "targetOn") =>
  (a: PathwayMilestone, b: PathwayMilestone) => {
    const left = a[clock], right = b[clock];
    if (left === null && right !== null) return 1;
    if (left !== null && right === null) return -1;
    return lex(left ?? "", right ?? "") || lex(a.id, b.id);
  };

/**
 * A presentation-specific *private draft* for one registered project.
 * All native milestones must already exist in the independently reviewed
 * public seed; a reviewer queue entry is deliberately not an input.
 */
export function buildF5EditorialCasefilePreview(
  projectId: string,
  input: PathwayInputs,
  corpusCutoff: string,
): F5EditorialCasefilePreview {
  const receipt = auditF5CasefileReadiness(input, corpusCutoff, [projectId]);
  const readiness = receipt.pilots[0];
  const pathway = buildProjectEvidencePathway(projectId, input);
  const occurred = pathway.nativeMilestones
    .filter(m => m.claimMode === "occurred")
    .sort(byPhysicalClock("occurredOn"));
  const planned = pathway.nativeMilestones
    .filter(m => m.claimMode === "planned")
    .sort(byPhysicalClock("targetOn"));

  return {
    schemaVersion: "f5-editorial-casefile-preview-1",
    audience: "private_editorial_review_only",
    view: "current_corpus_revision",
    corpusCutoff,
    publicReleaseAuthorized: false,
    autonomouslyApprovedClaims: false,
    policyCausalityAsserted: false,
    historicalMoneyTotalsAuthorized: false,
    project: {
      id: pathway.project.id,
      name: pathway.project.name,
      materialIds: pathway.project.materialIds,
      stages: pathway.project.stages,
      evidence: pathway.project.sources,
    },
    lanes: {
      policy: pathway.policyContexts,
      finance: pathway.financing.map(f => ({
        id: f.id, eventId: f.eventId, instrument: f.instrument,
        valueRole: f.valueRole, provider: f.provider, recipient: f.recipient,
        relationship: f.projectRelationship,
        allocationOrProjectCashSumAuthorized: false,
        financialStatusHistory: f.financialStatuses,
        evidence: f.sourceEvidence,
        unreviewedFinancierPhysicalReports: f.legacyPhysicalObservations.length,
      })),
      financePackageReferences: pathway.financePackageReferences,
      designations: pathway.designations.map(d => ({
        id: d.id, eventId: d.eventId, recognitionNotMoney: true,
        statusHistory: d.statusHistory, evidence: d.sources,
      })),
      physical: {
        occurred, planned,
        occurredEvidence: occurred.length
          ? "registered_reviewed_claims" : "no_approved_occurred_claims",
        legacyFinanceObservationsAwaitingReview:
          pathway.reviewGaps.legacyPhysicalObservationCount,
        absenceMeansInactivity: false,
      },
    },
    readiness: {
      eligibleForManualSourceAndBrowserQa: readiness.eligibleForManualQa,
      blockers: [...readiness.blockers],
    },
    limitations: [
      "INTERNAL ONLY: source-review metadata and readiness do not authorize publishing a casefile.",
      "Government policy and physical progress are not causally linked by this structural projection.",
      "Finance records and package links cannot be summed or allocated from this view; financial status is not proof of cash disbursement.",
      "A designation is not a grant. Coannounced controls are deliberately excluded from project-outcome lanes.",
      "Financier implementation comments remain only counts requiring review, not asserted project-native physical milestones.",
      "Unknown occurrence dates remain null. Publication/access/reviewer dates never substitute for a physical start date.",
      "No registered occurred milestone does not imply an inactive, stalled or unsuccessful industrial project.",
      "Historical known-as-of physical and financial states are outside this current-corpus preview.",
    ],
  };
}
