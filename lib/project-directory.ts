/**
 * Published project directory projection. The unit of account is a unique
 * registered undertaking, not a finance instrument, associated package or
 * designation. Finance standing delegates to the existing /response engine.
 *
 * Pure, reviewable data model: never reads unpublished F5/M3 packets.
 */
import { buildIndustrialResponse } from "./industrial-response";
import { normalize } from "../lib/project-directory-text";
import type {
  FinancialCommitment, JurisdictionCode, Organization, Project,
  ProjectDesignation, SupplyChainStage,
} from "./types";

export type ProjectDirectoryRow = {
  id: string;
  name: string;
  descriptionSearchText: string;
  sponsors: { id: string; name: string }[];
  locations: { countryCode: string | null; subnational: string | null; asStated: string | null }[];
  countryCodes: string[];
  materialIds: string[];
  stages: SupplyChainStage[];
  untrackedMaterialsAsStated: string[];
  directFinanceIds: string[];
  sharedUnallocatedFinanceIds: string[];
  designationIds: string[];
  /** Only directly linked, non-ended government commitments evidenced at cutoff. */
  governmentCommitmentProviders: JurisdictionCode[];
  governmentCommitmentEvidenced: boolean;
};

export type ProjectDirectoryFilters = {
  q?: string;
  material?: string;
  stage?: string;
  country?: string;
  government?: string;
  relationship?: string;
};

export const PROJECT_RELATIONSHIP_FILTERS = [
  "direct", "shared", "designation", "no_finance_link",
] as const;
export const PROJECT_GOVERNMENT_FILTERS = ["yes", "no"] as const;
export const UNSTATED = "not_stated";
const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function buildProjectDirectory(
  projects: readonly Project[],
  finances: readonly FinancialCommitment[],
  designations: readonly ProjectDesignation[],
  organizations: readonly Organization[],
  legalAsOf: string,
): ProjectDirectoryRow[] {
  const current = buildIndustrialResponse(legalAsOf, finances, projects);
  const response = new Map(current.rows.map(p => [p.id, p]));
  const financed = new Map<string, Set<string>>();
  const shared = new Map<string, Set<string>>();
  const designated = new Map<string, Set<string>>();
  const names = new Map(organizations.map(o => [o.id, o.name]));
  const unique = <T>(values: T[]): T[] => [...new Set(values)];

  for (const f of finances) {
    if (f.projectId) {
      const ids = financed.get(f.projectId) ?? new Set<string>();
      ids.add(f.id);
      financed.set(f.projectId, ids);
    }
    for (const id of f.associatedProjectIds ?? []) {
      const ids = shared.get(id) ?? new Set<string>();
      ids.add(f.id);
      shared.set(id, ids);
    }
  }
  for (const d of designations) {
    const ids = designated.get(d.projectId) ?? new Set<string>();
    ids.add(d.id);
    designated.set(d.projectId, ids);
  }
  const financeById = new Map(finances.map(f => [f.id, f]));
  const rows = projects.map(p => {
    const status = response.get(p.id);
    const governmentCommitmentProviders = status
      ? unique(status.financialEvidence.map(e => {
        const row = financeById.get(e.financialId);
        if (!row?.providerJurisdiction) throw new Error("Project directory lost government provider " + e.financialId);
        return row.providerJurisdiction;
      })).sort(lex)
      : [];
    if (!!status !== (governmentCommitmentProviders.length > 0))
      throw new Error("Project directory /response eligibility mismatch: " + p.id);
    const sponsors = p.sponsorOrgIds.map(id => {
      const name = names.get(id);
      if (!name) throw new Error("Project directory unresolved sponsor " + id);
      return {id, name};
    });
    return {
      id: p.id, name: p.name,
      descriptionSearchText: [p.id, p.name, ...sponsors.map(s => s.name),
        ...p.locations.flatMap(l => [l.asStated, l.subnational, l.countryCode]),
        ...p.untrackedMaterialsAsStated, p.notes].filter(Boolean).join(" "),
      sponsors, locations: p.locations.map(l => ({...l})),
      countryCodes: unique(p.locations.flatMap(l => l.countryCode ? [l.countryCode] : [])).sort(lex),
      materialIds: unique([...p.materialIds]).sort(lex),
      stages: unique([...p.stages]).sort(lex),
      untrackedMaterialsAsStated: [...p.untrackedMaterialsAsStated],
      directFinanceIds: [...(financed.get(p.id) ?? [])].sort(lex),
      sharedUnallocatedFinanceIds: [...(shared.get(p.id) ?? [])].sort(lex),
      designationIds: [...(designated.get(p.id) ?? [])].sort(lex),
      governmentCommitmentProviders,
      governmentCommitmentEvidenced: !!status,
    };
  });
  if (new Set(rows.map(p => p.id)).size !== rows.length)
    throw new Error("Project directory duplicate project ID");
  return rows.sort((a,b) => lex(a.name,b.name) || lex(a.id,b.id));
}

/** AND across categories; OR within a project's multiple materials/countries. */
export function filterProjectDirectory(
  rows: readonly ProjectDirectoryRow[], filters: ProjectDirectoryFilters,
  materialNames: Readonly<Record<string, string>> = {},
): ProjectDirectoryRow[] {
  const terms = normalize(filters.q ?? "").trim().split(/\s+/).filter(Boolean);
  return rows.filter(r =>
    (!filters.material || filters.material === "all" ||
      (filters.material === UNSTATED ? r.materialIds.length === 0 : r.materialIds.includes(filters.material))) &&
    (!filters.stage || filters.stage === "all" ||
      (filters.stage === UNSTATED ? r.stages.length === 0 : r.stages.includes(filters.stage as SupplyChainStage))) &&
    (!filters.country || filters.country === "all" ||
      (filters.country === UNSTATED ? r.countryCodes.length === 0 : r.countryCodes.includes(filters.country))) &&
    (!filters.government || filters.government === "all" ||
      (filters.government === "yes" ? r.governmentCommitmentEvidenced : !r.governmentCommitmentEvidenced)) &&
    (!filters.relationship || filters.relationship === "all" ||
      (filters.relationship === "direct" ? r.directFinanceIds.length > 0
       : filters.relationship === "shared" ? r.sharedUnallocatedFinanceIds.length > 0
       : filters.relationship === "designation" ? r.designationIds.length > 0
       : r.directFinanceIds.length === 0 && r.sharedUnallocatedFinanceIds.length === 0)) &&
    terms.every(term => normalize([r.descriptionSearchText,
      ...r.materialIds.map(id => materialNames[id] ?? id),
      ...r.stages].join(" ")).includes(term)),
  );
}
