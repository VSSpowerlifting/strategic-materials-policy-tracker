/**
 * F5-2: a PROJECT-SCOPED evidence pathway assembled only from typed F5-0
 * references. This does not claim any policy caused an industrial outcome.
 * Source publications, event dates, status dates, and milestone occurrence
 * dates are distinct clocks. All statuses describe the current corpus
 * revision; this function does not compute historical "known as of" states.
 *
 * Read-only library model. Not routed into a public page, API or export.
 */
import {
  auditEvidencePathways, type PathwayEdge, type PathwayInputs,
} from "./evidence-pathway-contract";
import type { PolicyEvent, Source } from "./types";

const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export type PathwaySourceReference = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  confidence: Source["confidence"];
  sourceType: Source["sourceType"];
  language: Source["language"];
  publishedOn: string | null;
  accessedOn: string;
  locator: string | null;
};

export type PathwayStatus = {
  status: string;
  statusDate: string | null;
  evidence: PathwaySourceReference;
  note: string | null;
};

export type PathwayFinance = {
  id: string;
  eventId: string;
  instrument: string;
  valueRole: string;
  projectRelationship: "directly_attributable" | "nonallocative_association";
  /** Must never be interpreted as an amount allocated to this project. */
  attributableAmountAuthorized: false;
  provider: string | null;
  recipient: string | null;
  financialStatuses: PathwayStatus[];
  /** Legacy issuer/financier reported physical notes: NOT native milestones. */
  legacyPhysicalObservations: PathwayStatus[];
  sourceEvidence: PathwaySourceReference[];
};

export type PathwayDesignation = {
  id: string;
  eventId: string;
  projectId: string;
  recognitionNotMoney: true;
  statusHistory: PathwayStatus[];
  sources: PathwaySourceReference[];
};

export type PathwayMilestone = {
  id: string;
  kind: string;
  claimMode: "occurred" | "planned";
  scope: string;
  scopeAsStated: string | null;
  occurredOn: string | null;
  targetOn: string | null;
  speakerStatementOriginal: string;
  speakerStatementEn: string;
  translationProvenance: string;
  evidence: PathwaySourceReference;
  reviewer: string;
  reviewedOn: string;
  /** Independently reviewed project assertion, never a financier status. */
  assertion: "reviewed_project_native";
};

export type PathwayPolicyContext = {
  id: string;
  jurisdiction: string;
  issuingBody: string;
  title: string;
  eventDate: string;
  eventStatus: string;
  context: "finance_or_designation_parent";
  sourceRecords: PathwaySourceReference[];
  /** Same announcement can contain control clauses, but they are not
   * source-evidenced project impacts or causal relations. */
  coannouncedControlIds: string[];
};

export type PathwayFinanceParent = {
  childFinanceId: string;
  parentFinanceId: string;
  relation: "part_of" | "drawn_from";
  projectMoneyAllocation: "not_asserted";
  evidence: PathwaySourceReference[];
};

export type ProjectEvidencePathway = {
  schemaVersion: "f5-2";
  view: "current_corpus_revision";
  verifiedCausality: "not_asserted";
  historicalCapitalTotals: "not_authorized";
  project: {
    id: string;
    name: string;
    materialIds: string[];
    stages: string[];
    sources: PathwaySourceReference[];
  };
  financing: PathwayFinance[];
  designations: PathwayDesignation[];
  nativeMilestones: PathwayMilestone[];
  policyContexts: PathwayPolicyContext[];
  financePackageReferences: PathwayFinanceParent[];
  /** Only edges used for the structural pathway. Financial amount absent. */
  typedEdges: PathwayEdge[];
  reviewGaps: {
    nativePhysical: "no_reviewed_milestones" | "reviewed_milestones_present";
    legacyPhysicalObservationCount: number;
    directFinanceCount: number;
    nonallocativeFinanceAssociations: number;
    /** Missing records never imply a negative real-world fact. */
    absenceMeansInactivity: false;
    hasUnreviewedFinancialAmounts: boolean;
  };
  limitations: string[];
};

function byId<T extends { id: string }>(rows: readonly T[]) {
  return new Map(rows.map(row => [row.id, row]));
}

export function buildProjectEvidencePathway(
  projectId: string,
  input: PathwayInputs,
): ProjectEvidencePathway {
  // Reference and citation integrity are enforced before any projection.
  const coverage = auditEvidencePathways(input);
  const p = byId(input.projects).get(projectId);
  if (!p) throw new Error("F5-2 unknown project ID: " + projectId);
  const finance = byId(input.finances);
  const designations = byId(input.designations);
  const milestones = byId(input.milestones);
  const events = byId(input.events);
  const sources = byId(input.sources);

  function sourceRef(sourceId: string, locator: string | null = null): PathwaySourceReference {
    const source = sources.get(sourceId);
    if (!source) throw new Error("F5-2 missing source: " + sourceId);
    return {
      id: source.id, title: source.title, publisher: source.publisher, url: source.url,
      confidence: source.confidence, sourceType: source.sourceType, language: source.language,
      publishedOn: source.datePublished ?? null, accessedOn: source.dateAccessed,
      locator,
    };
  }
  const compareSource = (a: PathwaySourceReference, b: PathwaySourceReference) =>
    lex(a.id, b.id) || lex(a.locator ?? "", b.locator ?? "");
  function refs(citations: readonly { sourceId: string; locator?: string | null }[]): PathwaySourceReference[] {
    const indexed = new Map<string, PathwaySourceReference>();
    for (const c of citations) {
      const ref = sourceRef(c.sourceId, c.locator ?? null);
      indexed.set(JSON.stringify([ref.id, ref.locator]), ref);
    }
    return [...indexed.values()].sort(compareSource);
  }
  function statuses(history: readonly { status: string; date: string | null; sourceId: string; note?: string | null }[]): PathwayStatus[] {
    return history.map(h => ({
      status: h.status, statusDate: h.date,
      evidence: sourceRef(h.sourceId), note: h.note ?? null,
    }));
    // Preserve source-validated chronology, including undated final states.
    // Null dates do not sort before earlier dated states by default.
  }
  const selected = coverage.edges.filter(e =>
    (e.toId === projectId &&
      ["allocative_finance_project", "nonallocative_finance_project_association",
       "project_designation"].includes(e.kind))
    || (e.fromId === projectId && e.kind === "reviewed_project_milestone"));

  const financeEdges = selected.filter(e =>
    e.kind === "allocative_finance_project" || e.kind === "nonallocative_finance_project_association");
  const financeIds = new Set(financeEdges.map(e => e.fromId));
  const designationIds = new Set(selected.filter(e => e.kind === "project_designation").map(e => e.fromId));
  const milestoneIds = new Set(selected.filter(e => e.kind === "reviewed_project_milestone").map(e => e.toId));

  const financing: PathwayFinance[] = [...financeIds].sort(lex).map(id => {
    const row = finance.get(id)!;
    const projectRelationship = financeEdges.some(e =>
      e.fromId === id && e.kind === "allocative_finance_project")
      ? "directly_attributable" as const : "nonallocative_association" as const;
    return {
      id, eventId: row.eventId, instrument: row.instrument, valueRole: row.valueRole,
      projectRelationship,
      attributableAmountAuthorized: false,
      provider: row.provider, recipient: row.recipient,
      financialStatuses: statuses(row.financialStatusHistory),
      legacyPhysicalObservations: statuses(row.implementationStatusHistory),
      sourceEvidence: refs(row.evidence),
    };
  });

  const selectedDesignations: PathwayDesignation[] = [...designationIds].sort(lex).map(id => {
    const d = designations.get(id)!;
    return {
      id, eventId: d.eventId, projectId: d.projectId, recognitionNotMoney: true,
      statusHistory: statuses(d.statusHistory),
      sources: refs(d.evidence),
    };
  });
  const nativeMilestones: PathwayMilestone[] = [...milestoneIds].sort(lex).map(id => {
    const m = milestones.get(id)!;
    return {
      id, kind: m.kind, claimMode: m.claimMode, scope: m.scope,
      scopeAsStated: m.scopeAsStated, occurredOn: m.occurredOn, targetOn: m.targetOn,
      speakerStatementOriginal: m.statementOriginal, speakerStatementEn: m.statementEn,
      translationProvenance: m.statementEnSource,
      evidence: sourceRef(m.sourceId, m.locator), reviewer: m.reviewedBy,
      reviewedOn: m.reviewedAt, assertion: "reviewed_project_native",
    };
  });

  const eventIds = new Set([
    ...financing.map(f => f.eventId), ...selectedDesignations.map(d => d.eventId),
  ]);
  const policyContexts: PathwayPolicyContext[] = [...eventIds].sort(lex).map(id => {
    const event: PolicyEvent = events.get(id)!;
    return {
      id, jurisdiction: event.jurisdiction, issuingBody: event.issuingBody,
      title: event.titleEn, eventDate: event.date, eventStatus: event.policyStatus,
      context: "finance_or_designation_parent",
      sourceRecords: refs(event.sourceIds.map(sourceId => ({ sourceId }))),
      coannouncedControlIds: input.controls.filter(c => c.eventId === id)
        .map(c => c.id).sort(lex),
    };
  });

  const packageEdges = coverage.edges.filter(e =>
    financeIds.has(e.fromId) && (e.kind === "finance_part_of" || e.kind === "finance_drawn_from"));
  const financePackageReferences: PathwayFinanceParent[] = packageEdges.map(e => ({
    childFinanceId: e.fromId, parentFinanceId: e.toId,
    relation: e.kind === "finance_part_of" ? "part_of" : "drawn_from",
    projectMoneyAllocation: "not_asserted", evidence: refs(e.evidence),
  }));

  const selectedEdges = coverage.edges.filter(e =>
    selected.some(link => link.kind === e.kind && link.fromId === e.fromId && link.toId === e.toId)
    || (e.kind === "event_finance" && financeIds.has(e.toId))
    || (e.kind === "event_designation" && designationIds.has(e.toId))
    || (e.kind === "event_control" &&
      input.controls.some(c => c.id === e.toId && eventIds.has(c.eventId)))
    || (financeIds.has(e.fromId) && (e.kind === "finance_part_of" || e.kind === "finance_drawn_from")));

  const old = coverage.projects.find(v => v.projectId === projectId)!;
  return {
    schemaVersion: "f5-2",
    view: "current_corpus_revision",
    verifiedCausality: "not_asserted",
    historicalCapitalTotals: "not_authorized",
    project: {
      id: p.id, name: p.name,
      materialIds: [...p.materialIds].sort(lex),
      stages: [...p.stages].sort(lex),
      sources: refs(p.evidence),
    },
    financing, designations: selectedDesignations, nativeMilestones,
    policyContexts, financePackageReferences, typedEdges: selectedEdges,
    reviewGaps: {
      nativePhysical: nativeMilestones.length ? "reviewed_milestones_present"
        : "no_reviewed_milestones",
      legacyPhysicalObservationCount: old.legacyUnreviewedObservations,
      directFinanceCount: financing.filter(f =>
        f.projectRelationship === "directly_attributable").length,
      nonallocativeFinanceAssociations: financing.filter(f =>
        f.projectRelationship === "nonallocative_association").length,
      absenceMeansInactivity: false,
      hasUnreviewedFinancialAmounts: financing.some(f =>
        !finance.get(f.id)!.financialAmountHistory?.length),
    },
    limitations: [
      "Policy contexts here parent existing finance or designation records; a shared material or date never creates a causal edge.",
      "Coannounced controls are announcement siblings only, not project-specific restrictions or effects.",
      "Direct project attribution and nonallocative association are different. No individual monetary allocation, financial sum or payment conclusion is authorized.",
      "Financing statuses describe the current corpus revision. Legacy implementation observations require scoped review and are not project-native milestones.",
      "A milestone's event/target date, publication/access horizon and reviewer date are separate. A planned target is not automatically occurred.",
      "An absent reviewed milestone means no approved entry in SMPT, not that the facility is inactive or failed.",
    ],
  };
}
