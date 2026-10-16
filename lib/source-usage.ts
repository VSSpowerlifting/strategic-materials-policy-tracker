/**
 * Reverse provenance for the PUBLIC curated corpus.
 *
 * Only explicit Source IDs generate a link. A shared event, project,
 * programme, material or financier NEVER implies that its source supports
 * another record. This is a navigation/read model, not source verification.
 * No private candidates, monitors or editorial drafts are imported.
 */
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllFramingClaims, getAllJurisdictions, getAllMaterials,
  getAllOrganizations, getAllProgrammes, getAllProjectDesignations,
  getAllProjectMilestones, getAllProjects, getAllSources,
} from "./data";
import type {
  ControlMeasure, FinancialCommitment, FramingClaim, Jurisdiction,
  Material, Organization, PolicyEvent, Programme, Project, ProjectDesignation,
  ProjectMilestone, Source,
} from "./types";

export const SOURCE_USE_KINDS = [
  "event", "capital", "control", "project", "milestone",
  "designation", "framing", "organization", "programme", "material", "actor",
] as const;
export type SourceUseKind = (typeof SOURCE_USE_KINDS)[number];

export const SOURCE_USE_LABELS: Record<SourceUseKind, string> = {
  event: "Policy events",
  capital: "Financial instruments",
  control: "Control clauses",
  project: "Projects",
  milestone: "Reviewed physical milestones",
  designation: "Project designations",
  framing: "Original-language framing",
  organization: "Organizations",
  programme: "Programmes",
  material: "Material profiles",
  actor: "Actor profiles",
};

export type SourceUse = {
  kind: SourceUseKind;
  id: string;
  title: string;
  href: string;
  /** Every value identifies an explicitly source-linked record field or role. */
  roles: string[];
};

export type PublishedSourceRecords = {
  sources: readonly Source[];
  events: readonly PolicyEvent[];
  finances: readonly FinancialCommitment[];
  controls: readonly ControlMeasure[];
  projects: readonly Project[];
  milestones: readonly ProjectMilestone[];
  designations: readonly ProjectDesignation[];
  framing: readonly FramingClaim[];
  organizations: readonly Organization[];
  programmes: readonly Programme[];
  materials: readonly Material[];
  actors: readonly Jurisdiction[];
};

export function publishedSourceRecords(): PublishedSourceRecords {
  return {
    sources: getAllSources(), events: getAllEvents(),
    finances: getAllFinancialCommitments(), controls: getAllControlMeasures(),
    projects: getAllProjects(), milestones: getAllProjectMilestones(),
    designations: getAllProjectDesignations(), framing: getAllFramingClaims(),
    organizations: getAllOrganizations(), programmes: getAllProgrammes(),
    materials: getAllMaterials(), actors: getAllJurisdictions(),
  };
}

/** Build once from the checked-out public seed; never walk private work. */
export function buildSourceUseIndex(corpus: PublishedSourceRecords): Map<string, SourceUse[]> {
  const known = new Set(corpus.sources.map(s => s.id));
  const uses = new Map<string, Map<string, {
    kind: SourceUseKind; id: string; title: string; href: string; roles: Set<string>;
  }>>();
  const add = (
    sourceId: string, kind: SourceUseKind, id: string,
    title: string, href: string, role: string,
  ) => {
    if (!known.has(sourceId))
      throw new Error("Reverse source citation does not resolve: " + sourceId + " at " + kind + ":" + id);
    const group = uses.get(sourceId) ?? new Map();
    const key = kind + ":" + id;
    const existing = group.get(key);
    if (existing) existing.roles.add(role);
    else group.set(key, {kind, id, title, href, roles: new Set([role])});
    uses.set(sourceId, group);
  };
  // The source ID on each record is explicit, rather than inherited from its parent.
  for (const e of corpus.events)
    for (const sid of e.sourceIds)
      add(sid, "event", e.id, e.titleEn, "/events/" + e.id, "Cited policy event");
  for (const f of corpus.framing)
    add(f.sourceId, "framing", f.id, f.quoteEn, "/events/" + f.eventId + "#" + f.id, "Original framing quotation");
  for (const m of corpus.materials)
    for (const sid of m.sourceIds)
      add(sid, "material", m.id, m.nameEn, "/materials/" + m.slug, "Material profile source");
  for (const a of corpus.actors)
    for (const sid of a.sourceIds)
      add(sid, "actor", a.id, a.name, "/actors/" + a.code.toLowerCase(), "Actor profile source");
  for (const o of corpus.organizations) {
    const href = "/organizations/" + o.id;
    for (const e of o.evidence)
      for (const field of e.supports)
        add(e.sourceId, "organization", o.id, o.name, href, "Field evidence: " + field);
    for (const relation of o.parents)
      add(relation.sourceId, "organization", o.id, o.name, href, "Organization relationship");
  }
  for (const p of corpus.programmes)
    for (const e of p.evidence)
      for (const field of e.supports)
        add(e.sourceId, "programme", p.id, p.name, "/programmes/" + p.id, "Field evidence: " + field);
  for (const p of corpus.projects)
    for (const e of p.evidence)
      for (const field of e.supports)
        add(e.sourceId, "project", p.id, p.name, "/projects/" + p.id, "Field evidence: " + field);

  for (const f of corpus.finances) {
    const title = f.project ?? f.recipient ?? f.provider ?? f.id;
    const href = "/capital/" + f.id;
    for (const e of f.evidence)
      for (const field of e.supports)
        add(e.sourceId, "capital", f.id, title, href, "Field evidence: " + field);
    for (const s of f.financialStatusHistory)
      add(s.sourceId, "capital", f.id, title, href, "Financial status report");
    for (const s of f.implementationStatusHistory)
      add(s.sourceId, "capital", f.id, title, href, "Issuer implementation-status observation");
    for (const t of f.terms)
      add(t.sourceId, "capital", f.id, title, href, "Instrument term");
    for (const o of f.outcomes)
      add(o.sourceId, "capital", f.id, title, href, "Stated or targeted outcome");
    for (const rel of f.relationships)
      add(rel.sourceId, "capital", f.id, title, href, "Instrument relationship");
    for (const v of f.financialAmountHistory ?? []) {
      add(v.sourceId, "capital", f.id, title, href, "Historical amount evidence");
      add(v.effectiveNotBeforeEvidence.sourceId, "capital", f.id, title, href, "Amount operative-date bound");
      add(v.effectiveNoLaterThanEvidence.sourceId, "capital", f.id, title, href, "Amount operative-date bound");
    }
  }
  for (const c of corpus.controls) {
    const title = c.clause ? c.measureType + " · " + c.clause : c.measureType;
    const href = "/controls/" + c.id;
    for (const e of c.evidence)
      for (const field of e.supports)
        add(e.sourceId, "control", c.id, title, href, "Field evidence: " + field);
    for (const status of c.statusHistory)
      add(status.sourceId, "control", c.id, title, href, "Control legal-status observation");
  }
  for (const d of corpus.designations) {
    const href = "/projects/" + d.projectId;
    for (const e of d.evidence)
      for (const field of e.supports)
        add(e.sourceId, "designation", d.id, d.projectNameAsStated, href, "Field evidence: " + field);
    for (const status of d.statusHistory)
      add(status.sourceId, "designation", d.id, d.projectNameAsStated, href, "Designation status observation");
  }
  for (const m of corpus.milestones)
    add(m.sourceId, "milestone", m.id, m.scopeAsStated ?? m.projectId,
      "/projects/" + m.projectId, "Human-reviewed physical milestone");

  const order = new Map(SOURCE_USE_KINDS.map((kind, i) => [kind, i]));
  const sorted = new Map<string, SourceUse[]>();
  for (const id of [...known].sort()) {
    const rows = [...(uses.get(id)?.values() ?? [])].map(row => ({
      kind: row.kind, id: row.id, title: row.title, href: row.href,
      roles: [...row.roles].sort(),
    }));
    rows.sort((a, b) => (order.get(a.kind)! - order.get(b.kind)!) ||
      a.id.localeCompare(b.id, "en"));
    sorted.set(id, rows);
  }
  return sorted;
}

const publicIndex = buildSourceUseIndex(publishedSourceRecords());

export function getSourceUses(sourceId: string): SourceUse[] {
  return publicIndex.get(sourceId) ?? [];
}
