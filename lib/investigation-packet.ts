/** Explicit public read model. Never serialize stacks, review packets or internal
 * pathway objects wholesale. Inputs must be the published corpus; injected inputs
 * exist for contract tests, not as another publication mechanism. */
import { currentFinancialStatus } from "./capital-control";
import type { PathwayInputs } from "./evidence-pathway-contract";
import { buildProjectEvidencePathway, type ProjectEvidencePathway } from "./project-evidence-pathway";
import type { EvidenceReference, MonetaryAmount, Organization, ProjectLocation, StatusEntry } from "./types";

const lex = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const locations = (rows: readonly ProjectLocation[]) => rows.map(l => ({ countryCode: l.countryCode, subnational: l.subnational, asStated: l.asStated }));
const evidence = <F extends string>(rows: readonly EvidenceReference<F>[]) => rows.map(e => ({ sourceId: e.sourceId, supports: [...e.supports], evidence: e.evidence, locator: e.locator ?? null, note: e.note ?? null }));
const statuses = <S extends string>(rows: readonly StatusEntry<S>[]) => rows.map(s => ({ status: s.status, date: s.date, sourceId: s.sourceId, note: s.note ?? null }));
const amount = (a: MonetaryAmount | null) => a ? ({ value: a.value, currency: a.currency, qualifier: a.qualifier, amountAsStated: a.amountAsStated, currencyBasis: a.currencyBasis, basisNote: a.basisNote ?? null, basisLabel: a.basisLabel ?? null }) : null;

export function buildPublicInvestigationPacket(id: string, input: PathwayInputs, organizations: readonly Organization[], corpusRevision: string, existingPathway?: ProjectEvidencePathway) {
  const p = input.projects.find(p => p.id === id);
  if (!p) return null;
  const pathway = existingPathway ?? buildProjectEvidencePathway(id, input);
  const finance = [...input.finances].filter(f => f.projectId === id || f.associatedProjectIds?.includes(id)).sort(lex).map(f => ({
    id: f.id, eventId: f.eventId, instrument: f.instrument, valueRole: f.valueRole, capitalSource: f.capitalSource,
    projectRelationship: f.projectId === id ? "directly_attributable" as const : "nonallocative_association" as const,
    projectId: f.projectId, associatedProjectIds: [...(f.associatedProjectIds ?? [])],
    amount: amount(f.amount), amountBasis: "current_recorded_terms_not_historical_totals" as const,
    provider: f.provider, providerJurisdiction: f.providerJurisdiction, providerOrgIds: [...f.providerOrgIds],
    recipient: f.recipient, recipientOrgIds: [...f.recipientOrgIds], programmeId: f.programmeId,
    legalAuthority: f.legalAuthority, facility: f.facility, locations: locations(f.locations),
    materialIds: [...f.materialIds], stages: [...f.stages],
    currentFinancialStatus: currentFinancialStatus(f), financialStatusHistory: statuses(f.financialStatusHistory),
    legacyPhysicalObservations: statuses(f.implementationStatusHistory),
    terms: f.terms.map(t => ({ kind: t.kind, value: t.value, qualifier: t.qualifier, currency: t.currency, unit: t.unit, asStated: t.asStated, sourceId: t.sourceId, note: t.note ?? null })),
    statedOutcomes: f.outcomes.map(o => ({ metric: o.metric, value: o.value, qualifier: o.qualifier, unit: o.unit, targetDate: o.targetDate, asStated: o.asStated, statedBy: o.statedBy, sourceId: o.sourceId, note: o.note ?? null })),
    relationships: f.relationships.map(r => ({ commitmentId: r.commitmentId, relationship: r.relationship, sourceId: r.sourceId, locator: r.locator ?? null, note: r.note ?? null })),
    evidence: evidence(f.evidence), notes: f.notes ?? null,
  }));
  const designations = [...input.designations].filter(d => d.projectId === id).sort(lex).map(d => ({
    id: d.id, eventId: d.eventId, programmeId: d.programmeId, projectId: d.projectId,
    relationship: "project_designation_standing_not_money" as const,
    projectNameAsStated: d.projectNameAsStated, holderOrgIds: [...d.holderOrgIds],
    statusHistory: statuses(d.statusHistory), evidence: evidence(d.evidence),
  }));
  const nativeMilestones = [...input.milestones].filter(m => m.projectId === id).sort(lex).map(m => ({
    id: m.id, projectId: m.projectId, kind: m.kind, claimMode: m.claimMode,
    evidenceCategory: "reviewed_project_native" as const,
    scope: m.scope, scopeAsStated: m.scopeAsStated, occurredOn: m.occurredOn, targetOn: m.targetOn,
    sourceId: m.sourceId, locator: m.locator, statementOriginal: m.statementOriginal,
    statementEn: m.statementEn, statementEnSource: m.statementEnSource,
    // Already public reviewer attribution in the milestone register; no adjudication or private evidence path.
    reviewedBy: m.reviewedBy, reviewedAt: m.reviewedAt, note: m.note ?? null,
  }));
  const eventIds = new Set([...finance, ...designations].map(r => r.eventId));
  const policyContexts = [...input.events].filter(e => eventIds.has(e.id)).sort(lex).map(e => ({
    id: e.id, relationship: "finance_or_designation_parent" as const, jurisdiction: e.jurisdiction,
    issuingBody: e.issuingBody, titleEn: e.titleEn, titleOriginal: e.titleOriginal,
    documentNumber: e.documentNumber, date: e.date, policyStatus: e.policyStatus, sourceIds: [...e.sourceIds],
  }));
  const coannouncedControls = [...input.controls].filter(c => eventIds.has(c.eventId)).sort(lex).map(c => ({
    id: c.id, eventId: c.eventId, relationship: "announcement_sibling_not_project_impact" as const,
    clause: c.clause, measureType: c.measureType, legalBasisAsStated: c.legalBasisAsStated,
    productScopeAsStated: c.productScopeAsStated, statusHistory: c.statusHistory.map(s => ({ ...statuses([s])[0], until: s.until ?? null })),
    evidence: evidence(c.evidence),
  }));
  const organizationRoles = [...new Set([...p.sponsorOrgIds, ...finance.flatMap(f => [...f.providerOrgIds, ...f.recipientOrgIds]), ...designations.flatMap(d => d.holderOrgIds)])].sort().map(id => {
    const o = organizations.find(o => o.id === id);
    if (!o) throw new Error("Public investigation has unresolved organization " + id);
    return { id: o.id, name: o.name, nameOriginal: o.nameOriginal, aliases: [...o.aliases], kind: o.kind,
      roles: [
        ...(p.sponsorOrgIds.includes(id) ? [{ role: "registered_sponsor" as const, recordId: p.id }] : []),
        ...finance.flatMap(f => [
          ...(f.providerOrgIds.includes(id) ? [{ role: "provider" as const, recordId: f.id }] : []),
          ...(f.recipientOrgIds.includes(id) ? [{ role: "recipient" as const, recordId: f.id }] : []),
        ]),
        ...designations.filter(d => d.holderOrgIds.includes(id)).map(d => ({ role: "designation_holder" as const, recordId: d.id })),
      ], evidence: evidence(o.evidence) };
  });
  const project = { id: p.id, name: p.name, sponsorOrgIds: [...p.sponsorOrgIds], locations: locations(p.locations), stages: [...p.stages], materialIds: [...p.materialIds], materialAttribution: p.materialAttribution, untrackedMaterialsAsStated: [...p.untrackedMaterialsAsStated], evidence: evidence(p.evidence), notes: p.notes ?? null };
  const financePackageReferences = pathway.financePackageReferences.map(r => ({
    childFinanceId: r.childFinanceId, parentFinanceId: r.parentFinanceId, relation: r.relation,
    projectMoneyAllocation: r.projectMoneyAllocation,
    evidence: r.evidence.map(e => ({ sourceId: e.id, locator: e.locator })),
  }));
  const direct = finance.filter(f => f.projectRelationship === "directly_attributable");
  const associations = finance.filter(f => f.projectRelationship === "nonallocative_association");
  const unknowns = [
    nativeMilestones.length ? "Reviewed observations establish only their stated scope. They do not by themselves establish sustained construction, capacity achieved, commercial output or a financing payout."
      : "No project-native source-reviewed industrial milestone is published. Attributed activity in financing histories remains a separate evidence class; no exact milestone date or facility-wide conclusion is inferred.",
    ...(direct.some(f => !f.amount) ? ["Some directly linked instruments have no stated amount. A missing value is not zero."] : []),
    ...(!p.sponsorOrgIds.length ? ["The project registry does not identify a sponsor organization. Providers and recipients are recorded separately."] : []),
    ...(pathway.reviewGaps.hasUnreviewedFinancialAmounts ? ["Historical amount review is incomplete. Current amounts cannot be read as a time series of earlier commitments."] : []),
    ...(associations.length ? ["Shared financing is not allocated among the named projects and is excluded from this project's stack and backers."] : []),
    "Structural links and shared materials do not demonstrate that a government measure caused an industrial outcome.",
  ];
  const body = { project, organizations: organizationRoles, financialInstruments: direct, nonallocativeAssociations: associations,
    designations, nativeMilestones, policyContexts, coannouncedControls, financePackageReferences, unknowns };
  const sourceIds = new Set<string>();
  const collect = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(collect); return; }
    if (!v || typeof v !== "object") return;
    for (const [key, val] of Object.entries(v)) {
      if (key === "sourceId" && typeof val === "string") sourceIds.add(val);
      else if (key === "sourceIds" && Array.isArray(val)) val.forEach(id => sourceIds.add(id));
      else collect(val);
    }
  };
  collect(body);
  const sources = [...sourceIds].sort().map(id => {
    const s = input.sources.find(s => s.id === id);
    if (!s) throw new Error("Public investigation has unresolved source " + id);
    return { id: s.id, title: s.title, publisher: s.publisher, url: s.url, language: s.language, sourceType: s.sourceType, confidence: s.confidence, publishedOn: s.datePublished ?? null, accessedOn: s.dateAccessed };
  });
  return {
    projectionVersion: "smpt-investigation-1" as const,
    projectId: id,
    corpus: { revision: corpusRevision, legalStatusCutoff: corpusRevision, view: "current_corpus_revision" as const, notice: "Curated corpus revision, not source freshness or historical known-as-of coverage. Financial histories retain their own status dates." },
    ...body, sources,
    limitations: [...pathway.limitations, "Amounts retain current source-stated terms, original currency and exact decimal strings. This packet computes no historical financial totals or project-wide monetary allocation.", "Published source review does not establish independent on-site verification. Source, financial-status, occurrence, target and review dates remain distinct."],
  };
}
export type PublicInvestigationPacket = NonNullable<ReturnType<typeof buildPublicInvestigationPacket>>;
