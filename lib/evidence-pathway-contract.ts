/**
 * F5-0: evidence pathway *contract*, not an impact or causal-inference graph.
 *
 * All links below are structural references already present in reviewed SMPT
 * records. In particular: project associations are nonallocative, recognition
 * is not finance, and a shared material/date/jurisdiction NEVER creates an edge.
 * This read-only audit is NOT imported by public pages or exports.
 */
import { auditLegacyProjectExecution } from "./project-execution-audit";
import type {
  ControlMeasure, FinancialCommitment, PolicyEvent, Project,
  ProjectDesignation, ProjectMilestone, Source,
} from "./types";

export type PathwayInputs = {
  events: readonly PolicyEvent[];
  finances: readonly FinancialCommitment[];
  controls: readonly ControlMeasure[];
  projects: readonly Project[];
  designations: readonly ProjectDesignation[];
  milestones: readonly ProjectMilestone[];
  sources: readonly Source[];
};

export const PATHWAY_EDGE_KINDS = [
  "event_finance",
  "event_control",
  "event_designation",
  "allocative_finance_project",
  "nonallocative_finance_project_association",
  "project_designation",
  "reviewed_project_milestone",
  "finance_part_of",
  "finance_drawn_from",
] as const;

export type PathwayEdgeKind = (typeof PATHWAY_EDGE_KINDS)[number];

export type PathwayEvidence = {
  sourceId: string;
  locator: string | null;
  sourcePublishedOn: string | null;
  sourceAccessedOn: string;
};

export type PathwayEdge = {
  kind: PathwayEdgeKind;
  fromId: string;
  toId: string;
  /** These support a recorded structural assertion, NOT an inferred cause. */
  evidence: PathwayEvidence[];
  causalEffect: "not_asserted";
  moneyAllocation: "attributable_reference_only" | "nonallocative" | "not_applicable";
};

export type PathwayProjectCoverage = {
  projectId: string;
  attributableFinanceIds: string[];
  associatedFinanceIds: string[];
  designationIds: string[];
  nativeMilestoneIds: string[];
  /** Every such observation still needs source/scope adjudication. */
  legacyUnreviewedObservations: number;
  physicalReview: "native_milestones_recorded" | "native_milestones_not_yet_recorded";
};

export type PathwayCoverageReport = {
  schemaVersion: "f5-0";
  readOnly: true;
  causalClaimsAuthorized: false;
  historicalCapitalTotalsAuthorized: false;
  physicalClock: "native_source_claims_not_current_revision_status";
  totals: {
    events: number;
    finances: number;
    controls: number;
    projects: number;
    designations: number;
    sources: number;
    nativeMilestones: number;
    nativeOccurred: number;
    nativePlanned: number;
    legacyObservationsNeedingReview: number;
    projectsWithoutNativeMilestones: number;
    edges: number;
  };
  edgeCounts: { kind: PathwayEdgeKind; count: number }[];
  edges: PathwayEdge[];
  projects: PathwayProjectCoverage[];
  limitations: string[];
};

const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Hard-stop for broken registry pointers or duplicate IDs, even on audit. */
function indexUnique<T extends { id: string }>(rows: readonly T[], label: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const record of rows) {
    if (!record.id || map.has(record.id))
      throw new Error("F5 invalid/duplicate " + label + " ID: " + record.id);
    map.set(record.id, record);
  }
  return map;
}

type Citation = { sourceId: string; locator?: string | null; supports?: readonly string[] };
const eventCitation = (row: { evidence: readonly Citation[] }) => row.evidence;
const projectCitation = (row: { evidence: readonly Citation[] }) =>
  row.evidence.filter(e => e.supports?.includes("project"));

export function auditEvidencePathways(input: PathwayInputs): PathwayCoverageReport {
  const events = indexUnique(input.events, "event");
  const finances = indexUnique(input.finances, "finance");
  indexUnique(input.controls, "control");
  const projects = indexUnique(input.projects, "project");
  indexUnique(input.designations, "designation");
  indexUnique(input.milestones, "milestone");
  const sources = indexUnique(input.sources, "source");
  const edgesByKey = new Map<string, PathwayEdge>();

  const requireTarget = (id: string, map: ReadonlyMap<string, unknown>, kind: string) => {
    if (!map.has(id)) throw new Error("F5 unresolved " + kind + ": " + id);
  };
  function add(
    kind: PathwayEdgeKind,
    fromId: string,
    toId: string,
    citations: readonly Citation[],
  ) {
    if (!citations.length)
      throw new Error("F5 uncited structural edge: " + kind + " / " + fromId + " / " + toId);
    const known = citations.map(c => {
      const source = sources.get(c.sourceId);
      if (!source) throw new Error("F5 unresolved source: " + c.sourceId + " / " + fromId);
      return {
        sourceId: c.sourceId,
        locator: c.locator ?? null,
        sourcePublishedOn: source.datePublished ?? null,
        sourceAccessedOn: source.dateAccessed,
      };
    });
    const key = JSON.stringify([kind, fromId, toId]);
    const allocation = kind === "allocative_finance_project" ? "attributable_reference_only"
      : kind === "nonallocative_finance_project_association" ? "nonallocative" : "not_applicable";
    const old = edgesByKey.get(key);
    if (old) old.evidence.push(...known);
    else edgesByKey.set(key, {
      kind, fromId, toId, evidence: known,
      causalEffect: "not_asserted", moneyAllocation: allocation,
    });
  }

  for (const finance of input.finances) {
    requireTarget(finance.eventId, events, "finance event");
    add("event_finance", finance.eventId, finance.id, eventCitation(finance));
    if (finance.projectId !== null) {
      requireTarget(finance.projectId, projects, "finance project");
      add("allocative_finance_project", finance.id, finance.projectId, projectCitation(finance));
    }
    for (const id of finance.associatedProjectIds ?? []) {
      requireTarget(id, projects, "associated project");
      if (finance.projectId === id)
        throw new Error("F5 one project cannot be both allocated and only associated: " + finance.id);
      add("nonallocative_finance_project_association", finance.id, id, projectCitation(finance));
    }
    for (const relationship of finance.relationships) {
      requireTarget(relationship.commitmentId, finances, "finance parent");
      if (finance.id === relationship.commitmentId)
        throw new Error("F5 self-referential finance relationship: " + finance.id);
      const kind = relationship.relationship === "part_of" ? "finance_part_of"
        : relationship.relationship === "drawn_from" ? "finance_drawn_from"
        : null;
      if (!kind) throw new Error("F5 unsupported finance relationship: " + relationship.relationship);
      add(kind, finance.id, relationship.commitmentId, [relationship]);
    }
  }
  for (const control of input.controls) {
    requireTarget(control.eventId, events, "control event");
    add("event_control", control.eventId, control.id, eventCitation(control));
  }
  for (const designation of input.designations) {
    requireTarget(designation.eventId, events, "designation event");
    requireTarget(designation.projectId, projects, "designation project");
    add("event_designation", designation.eventId, designation.id, eventCitation(designation));
    add("project_designation", designation.id, designation.projectId, projectCitation(designation));
  }
  for (const milestone of input.milestones) {
    requireTarget(milestone.projectId, projects, "milestone project");
    if (!milestone.reviewedBy.trim())
      throw new Error("F5 milestone lacks reviewer: " + milestone.id);
    if (milestone.claimMode === "occurred" && milestone.targetOn !== null ||
        milestone.claimMode === "planned" && milestone.occurredOn !== null)
      throw new Error("F5 milestone conflates occurred and target clocks: " + milestone.id);
    add("reviewed_project_milestone", milestone.projectId, milestone.id,
      [{ sourceId: milestone.sourceId, locator: milestone.locator }]);
  }

  const edges = [...edgesByKey.values()].map(e => {
    const byCitation = new Map<string, PathwayEvidence>();
    for (const citation of e.evidence)
      byCitation.set(JSON.stringify([citation.sourceId, citation.locator]), citation);
    return {
      ...e,
      evidence: [...byCitation.values()].sort((a, b) =>
        lex(a.sourceId, b.sourceId) || lex(a.locator ?? "", b.locator ?? "")),
    };
  }).sort((a, b) =>
    lex(a.kind, b.kind) || lex(a.fromId, b.fromId) || lex(a.toId, b.toId));

  const legacy = auditLegacyProjectExecution(input.finances, input.projects, input.sources);
  const projectRows: PathwayProjectCoverage[] = [...projects.keys()].sort(lex).map(projectId => {
    const forKind = (kind: PathwayEdgeKind, field: "fromId" | "toId") =>
      edges.filter(e => e.kind === kind && e.toId === projectId).map(e => e[field]).sort(lex);
    const native = edges.filter(e =>
      e.kind === "reviewed_project_milestone" && e.fromId === projectId)
      .map(e => e.toId).sort(lex);
    return {
      projectId,
      attributableFinanceIds: forKind("allocative_finance_project", "fromId"),
      associatedFinanceIds: forKind("nonallocative_finance_project_association", "fromId"),
      designationIds: forKind("project_designation", "fromId"),
      nativeMilestoneIds: native,
      legacyUnreviewedObservations: legacy.observations.filter(o => o.projectId === projectId).length,
      physicalReview: native.length ? "native_milestones_recorded" as const
        : "native_milestones_not_yet_recorded" as const,
    };
  });
  const counts = PATHWAY_EDGE_KINDS.map(kind => ({
    kind, count: edges.filter(edge => edge.kind === kind).length,
  }));
  return {
    schemaVersion: "f5-0",
    readOnly: true,
    causalClaimsAuthorized: false,
    historicalCapitalTotalsAuthorized: false,
    physicalClock: "native_source_claims_not_current_revision_status",
    totals: {
      events: input.events.length,
      finances: input.finances.length,
      controls: input.controls.length,
      projects: input.projects.length,
      designations: input.designations.length,
      sources: input.sources.length,
      nativeMilestones: input.milestones.length,
      nativeOccurred: input.milestones.filter(m => m.claimMode === "occurred").length,
      nativePlanned: input.milestones.filter(m => m.claimMode === "planned").length,
      legacyObservationsNeedingReview: legacy.observations.length,
      projectsWithoutNativeMilestones: projectRows.filter(p => !p.nativeMilestoneIds.length).length,
      edges: edges.length,
    },
    edgeCounts: counts,
    edges,
    projects: projectRows,
    limitations: [
      "Structural edges are documented record relationships, not evidence of policy causation or observed industrial impact.",
      "Amount values are deliberately absent. Associated projects are nonallocative; financing parentage never authorizes additive totals.",
      "A designation is recognition, not funding. Missing milestones are unreviewed data coverage, not stalled or nonexistent activity.",
      "Legacy financing-row implementation observations remain unreviewed and cannot be promoted automatically into project-native milestones.",
      "Legal, payment, physical occurred/target, source-publication/access and review clocks remain distinct; this audit makes no historical known-as-of claim.",
      "Private research candidates are excluded. No history-dependent or cross-currency capital totals are authorized.",
    ],
  };
}
