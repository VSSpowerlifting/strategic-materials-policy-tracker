/**
 * F5-4a: review-only comparative COVERAGE inventory, not outcome scoring.
 *
 * One project is one unit of account. Financing parts, envelopes and duplicate
 * material membership never create additional project observations. The public
 * /response denominator is imported, never independently reinterpreted.
 * No publication, historical physical state or monetary aggregation is done.
 */
import { auditEvidencePathways, type PathwayInputs } from "./evidence-pathway-contract";
import { buildIndustrialResponse } from "./industrial-response";
import type { FinancialStatusEntry, JurisdictionCode, SupplyChainStage, ValueRole } from "./types";

const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export type F5ComparisonFilters = {
  materialId?: string;
  stage?: SupplyChainStage;
  /** Includes both direct and nonallocative association references; not a funding claim. */
  providerJurisdiction?: JurisdictionCode;
};

export type F5FinanceReference = {
  id: string;
  relationship: "direct" | "nonallocative_association";
  providerJurisdiction: JurisdictionCode | null;
  valueRole: ValueRole;
  capitalSource: string;
  currentFinancialStatus: FinancialStatusEntry | null;
  /** Sources of the project link, not a claim that an amount was allocated. */
  projectLinkSourceIds: string[];
};

export type F5ComparisonProject = {
  projectId: string;
  projectName: string;
  materialIds: string[];
  stages: SupplyChainStage[];
  financing: F5FinanceReference[];
  designationIds: string[];
  nativeOccurredMilestoneIds: string[];
  nativePlannedMilestoneIds: string[];
  unreviewedLegacyPhysicalObservations: number;
  /** Only registry/relation sources. Not a certificate of industrial operation. */
  structuralSourceIds: string[];
  publicResponseAtCutoff: {
    eligibleGovernmentProject: boolean;
    bindingEvidenced: boolean;
    /** The public physical axis is FINANCE-REPORTED, not native-reviewed. */
    legacyReportedConstructionOrLater: boolean;
  };
  lackOfNativeMilestonesMeansInactivity: false;
};

export type F5ComparativeCoverage = {
  schemaVersion: "f5-4a";
  audience: "internal_methodology_and_editorial";
  view: "current_corpus_revision";
  publicReleaseAuthorized: false;
  historicalPhysicalAsOfAuthorized: false;
  capitalTotalsAuthorized: false;
  causalEffectAuthorized: false;
  /** Only the reused public response legal/finance eligibility is as-of. */
  publicResponseLegalAsOf: string;
  cohort: {
    definition: string;
    filters: F5ComparisonFilters;
    registryProjects: number;
    distinctSelectedProjects: number;
  };
  counts: {
    withDirectFinanceReference: number;
    withNonallocativeFinanceAssociation: number;
    withDirectGovernmentCommitmentReference: number;
    withDesignation: number;
    withNativeOccurredMilestone: number;
    withNativePlannedMilestone: number;
    withoutNativeReviewedMilestone: number;
    withUnreviewedLegacyPhysicalObservation: number;
    publicResponseEligibleGovernmentProjects: number;
    publicResponseBindingProjects: number;
    publicResponseLegacyReportedConstructionOrLater: number;
  };
  /** Nonadditive material memberships, each with the SAME unique-project unit. */
  byMaterial: { materialId: string; projectIds: string[]; projects: number; nativeOccurredProjects: number }[];
  projects: F5ComparisonProject[];
  limitations: string[];
};

export function buildF5ComparativeCoverage(
  input: PathwayInputs,
  legalAsOf: string,
  filters: F5ComparisonFilters = {},
): F5ComparativeCoverage {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(legalAsOf) ||
      Number.isNaN(Date.parse(legalAsOf + "T00:00:00Z")))
    throw new Error("F5-4a requires an ISO calendar date for public /response legal standing");
  if (filters.materialId !== undefined && !filters.materialId.trim())
    throw new Error("F5-4a material filter must be nonblank");

  // Full-corpus graph and source integrity before ANY filtering: a broken
  // hidden record may not be silently discarded by a narrow filter.
  const audit = auditEvidencePathways(input);
  const publicResponse = buildIndustrialResponse(legalAsOf, input.finances, input.projects);
  const knownSources = new Set(input.sources.map(s => s.id));
  const responseRows = new Map(publicResponse.rows.map(p => [p.id, p]));
  const coverage = new Map(audit.projects.map(p => [p.projectId, p]));
  const finances = new Map(input.finances.map(f => [f.id, f]));
  const milestones = new Map(input.milestones.map(m => [m.id, m]));
  const edgeKey = (kind: string, fromId: string, toId: string) =>
    JSON.stringify([kind, fromId, toId]);
  const edges = new Map(audit.edges.map(e => [edgeKey(e.kind, e.fromId, e.toId), e]));

  const allRows: F5ComparisonProject[] = input.projects.map(project => {
    const c = coverage.get(project.id);
    if (!c) throw new Error("F5-4a missing audited project " + project.id);
    const sourceSet = new Set<string>();
    for (const evidence of project.evidence) {
      if (!knownSources.has(evidence.sourceId))
        throw new Error("F5-4a unresolved project source " + evidence.sourceId);
      sourceSet.add(evidence.sourceId);
    }
    function financeRefs(ids: string[], relationship: F5FinanceReference["relationship"]) {
      return ids.map(id => {
        const f = finances.get(id);
        if (!f) throw new Error("F5-4a unresolved finance " + id);
        const kind = relationship === "direct"
          ? "allocative_finance_project" : "nonallocative_finance_project_association";
        const edge = edges.get(edgeKey(kind, id, project.id));
        if (!edge) throw new Error("F5-4a finance project edge missing " + id);
        const status = f.financialStatusHistory.at(-1) ?? null;
        if (status && !knownSources.has(status.sourceId))
          throw new Error("F5-4a unresolved current finance status source " + status.sourceId);
        const projectLinkSourceIds = [...new Set(edge.evidence.map(e => e.sourceId))].sort(lex);
        projectLinkSourceIds.forEach(id => sourceSet.add(id));
        if (status) sourceSet.add(status.sourceId);
        return {
          id,
          relationship,
          providerJurisdiction: f.providerJurisdiction,
          valueRole: f.valueRole,
          capitalSource: f.capitalSource,
          currentFinancialStatus: status ? { ...status } : null,
          projectLinkSourceIds,
        };
      });
    }
    const financing = [
      ...financeRefs(c.attributableFinanceIds, "direct"),
      ...financeRefs(c.associatedFinanceIds, "nonallocative_association"),
    ].sort((a, b) => lex(a.id, b.id) || lex(a.relationship, b.relationship));
    const nativeOccurredMilestoneIds: string[] = [];
    const nativePlannedMilestoneIds: string[] = [];
    for (const id of c.nativeMilestoneIds) {
      const milestone = milestones.get(id);
      if (!milestone) throw new Error("F5-4a unresolved milestone " + id);
      const edge = edges.get(edgeKey("reviewed_project_milestone", project.id, id));
      if (!edge) throw new Error("F5-4a missing milestone source edge " + id);
      edge.evidence.forEach(e => sourceSet.add(e.sourceId));
      if (milestone.claimMode === "occurred") nativeOccurredMilestoneIds.push(id);
      else nativePlannedMilestoneIds.push(id);
    }
    for (const id of c.designationIds) {
      const edge = edges.get(edgeKey("project_designation", id, project.id));
      if (!edge) throw new Error("F5-4a missing designation source edge " + id);
      edge.evidence.forEach(e => sourceSet.add(e.sourceId));
    }
    const response = responseRows.get(project.id);
    return {
      projectId: project.id,
      projectName: project.name,
      materialIds: [...new Set(project.materialIds)].sort(lex),
      stages: [...new Set(project.stages)].sort(lex),
      financing,
      designationIds: [...c.designationIds],
      nativeOccurredMilestoneIds,
      nativePlannedMilestoneIds,
      unreviewedLegacyPhysicalObservations: c.legacyUnreviewedObservations,
      structuralSourceIds: [...sourceSet].sort(lex),
      publicResponseAtCutoff: {
        eligibleGovernmentProject: !!response,
        bindingEvidenced: response?.finance === "binding",
        legacyReportedConstructionOrLater: response?.physical === "construction_or_later",
      },
      lackOfNativeMilestonesMeansInactivity: false as const,
    };
  }).sort((a, b) => lex(a.projectId, b.projectId));

  // Explicit parity: reusing /response's legal-as-of engine must not silently
  // lose eligible cases in the F5 registry-wide representation.
  if (publicResponse.governmentProjects !== responseRows.size ||
      publicResponse.rows.some(p => !allRows.some(r => r.projectId === p.id &&
        r.publicResponseAtCutoff.eligibleGovernmentProject)))
    throw new Error("F5-4a public /response cohort parity failure");

  const projects = allRows.filter(p =>
    (filters.materialId === undefined || p.materialIds.includes(filters.materialId)) &&
    (filters.stage === undefined || p.stages.includes(filters.stage)) &&
    (filters.providerJurisdiction === undefined || p.financing.some(f =>
      f.providerJurisdiction === filters.providerJurisdiction)));
  const count = (predicate: (p: F5ComparisonProject) => boolean) =>
    projects.filter(predicate).length;
  const byMaterial = [...new Set(projects.flatMap(p => p.materialIds))].sort(lex)
    .map(materialId => {
      const rows = projects.filter(p => p.materialIds.includes(materialId));
      return {
        materialId,
        projectIds: rows.map(p => p.projectId),
        projects: rows.length,
        nativeOccurredProjects: rows.filter(p => p.nativeOccurredMilestoneIds.length > 0).length,
      };
    });

  return {
    schemaVersion: "f5-4a",
    audience: "internal_methodology_and_editorial",
    view: "current_corpus_revision",
    publicReleaseAuthorized: false,
    historicalPhysicalAsOfAuthorized: false,
    capitalTotalsAuthorized: false,
    causalEffectAuthorized: false,
    publicResponseLegalAsOf: legalAsOf,
    cohort: {
      definition: "Unique published project IDs matching project material/stage tags and, if selected, any directly linked or nonallocatively associated finance provider. Not solely financed projects.",
      filters: { ...filters },
      registryProjects: input.projects.length,
      distinctSelectedProjects: projects.length,
    },
    counts: {
      withDirectFinanceReference: count(p => p.financing.some(f => f.relationship === "direct")),
      withNonallocativeFinanceAssociation: count(p => p.financing.some(f => f.relationship === "nonallocative_association")),
      withDirectGovernmentCommitmentReference: count(p => p.financing.some(f =>
        f.relationship === "direct" && f.valueRole === "commitment" && f.providerJurisdiction !== null)),
      withDesignation: count(p => p.designationIds.length > 0),
      withNativeOccurredMilestone: count(p => p.nativeOccurredMilestoneIds.length > 0),
      withNativePlannedMilestone: count(p => p.nativePlannedMilestoneIds.length > 0),
      withoutNativeReviewedMilestone: count(p =>
        !p.nativeOccurredMilestoneIds.length && !p.nativePlannedMilestoneIds.length),
      withUnreviewedLegacyPhysicalObservation: count(p => p.unreviewedLegacyPhysicalObservations > 0),
      publicResponseEligibleGovernmentProjects: count(p => p.publicResponseAtCutoff.eligibleGovernmentProject),
      publicResponseBindingProjects: count(p => p.publicResponseAtCutoff.bindingEvidenced),
      publicResponseLegacyReportedConstructionOrLater: count(p => p.publicResponseAtCutoff.legacyReportedConstructionOrLater),
    },
    byMaterial,
    projects,
    limitations: [
      "Denominator is distinct registered projects in the selected cohort. Material rows overlap and cannot be added for a unique-project total.",
      "Finance references are row counts, never money, confirmed disbursement, attribution of nonallocative amounts, or evidence of policy causality.",
      "Provider filter matches both direct financing and nonallocative association. Only direct rows with valueRole commitment enter the separate government-reference count.",
      "Public /response eligibility and binding standing reuse its source-bound legal-as-of calculation. Native milestones and finance-reported physical notes remain current corpus revision, NOT historical known-as-of states.",
      "Reviewed native milestone absence is an editorial coverage gap, never industrial inactivity. Legacy finance-reported activity is neither independent project-native confirmation nor a causal effect.",
      "Status source dates and research review dates are not interchangeable. No source-publication cutoff or historical physical state is inferred.",
      "Private source-review packets are excluded. Human source adjudication and separate release QA remain required before any public comparison.",
    ],
  };
}
