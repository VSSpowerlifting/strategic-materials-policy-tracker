/**
 * Public project-to-project research comparison.
 *
 * Uses the canonical project directory for finance and designation links and
 * the *published* project milestone loader only. Neither financial row counts
 * nor source counts constitute money, independent corroboration, progress, or
 * a score. This module never imports private F5/M3 review material.
 */
import type { ProjectDirectoryRow } from "./project-directory";
import type { Project, ProjectMilestone, Source } from "./types";

export type ProjectComparisonRow = {
  id: string;
  name: string;
  sponsors: { id: string; name: string }[];
  locations: { countryCode: string | null; subnational: string | null; asStated: string | null }[];
  countryCodes: string[];
  materialIds: string[];
  untrackedMaterialsAsStated: string[];
  stages: string[];
  governmentCommitmentProviders: string[];
  governmentCommitmentEvidenced: boolean;
  directFinanceIds: string[];
  sharedUnallocatedFinanceIds: string[];
  designationIds: string[];
  /** Source citations supporting facts on the project registry record itself. */
  projectSources: { id: string; title: string; publisher: string }[];
  /** Reviewed public milestone seed ONLY; excludes financier implementation status. */
  publishedMilestones: {
    id: string;
    kind: ProjectMilestone["kind"];
    claimMode: ProjectMilestone["claimMode"];
    scope: ProjectMilestone["scope"];
    scopeAsStated: string | null;
    occurredOn: string | null;
    targetOn: string | null;
    sourceId: string;
  }[];
};

const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function buildProjectComparison(
  directory: readonly ProjectDirectoryRow[],
  projects: readonly Project[],
  sources: readonly Source[],
  publishedMilestones: readonly ProjectMilestone[],
): ProjectComparisonRow[] {
  const projectsById = new Map(projects.map(p => [p.id, p]));
  const sourcesById = new Map(sources.map(s => [s.id, s]));
  if (projectsById.size !== projects.length) throw new Error("Duplicate project registry identity");
  if (sourcesById.size !== sources.length) throw new Error("Duplicate source registry identity");
  if (directory.length !== projects.length) throw new Error("Project comparison registry/directory mismatch");
  const milestoneIds = new Set<string>();
  const milestonesByProject = new Map<string, ProjectMilestone[]>();
  for (const m of publishedMilestones) {
    if (milestoneIds.has(m.id)) throw new Error("Duplicate published milestone " + m.id);
    milestoneIds.add(m.id);
    if (!projectsById.has(m.projectId)) throw new Error("Unresolved published milestone project " + m.projectId);
    if (!sourcesById.has(m.sourceId)) throw new Error("Unresolved published milestone source " + m.sourceId);
    const list = milestonesByProject.get(m.projectId) ?? [];
    list.push(m);
    milestonesByProject.set(m.projectId, list);
  }
  const seen = new Set<string>();
  return directory.map(row => {
    if (seen.has(row.id)) throw new Error("Duplicate project comparison row " + row.id);
    seen.add(row.id);
    const project = projectsById.get(row.id);
    if (!project || project.name !== row.name)
      throw new Error("Project comparison registry mismatch " + row.id);
    const direct = new Set(row.directFinanceIds);
    if (row.sharedUnallocatedFinanceIds.some(id => direct.has(id)))
      throw new Error("Project comparison cannot count shared finance as direct: " + row.id);
    const projectSources = [...new Set(project.evidence.map(e => e.sourceId))]
      .sort(lex).map(id => {
        const source = sourcesById.get(id);
        if (!source) throw new Error("Project comparison unresolved source " + id);
        return {id, title: source.title, publisher: source.publisher};
      });
    return {
      id: row.id,
      name: row.name,
      sponsors: row.sponsors.map(s => ({...s})),
      locations: row.locations.map(l => ({...l})),
      countryCodes: [...row.countryCodes],
      materialIds: [...row.materialIds],
      untrackedMaterialsAsStated: [...row.untrackedMaterialsAsStated],
      stages: [...row.stages],
      governmentCommitmentProviders: [...row.governmentCommitmentProviders],
      governmentCommitmentEvidenced: row.governmentCommitmentEvidenced,
      directFinanceIds: [...row.directFinanceIds],
      sharedUnallocatedFinanceIds: [...row.sharedUnallocatedFinanceIds],
      designationIds: [...row.designationIds],
      projectSources,
      publishedMilestones: [...(milestonesByProject.get(row.id) ?? [])]
        .sort((a,b) => lex(a.id,b.id))
        .map(m => ({
          id:m.id, kind:m.kind, claimMode:m.claimMode, scope:m.scope,
          scopeAsStated:m.scopeAsStated, occurredOn:m.occurredOn,
          targetOn:m.targetOn, sourceId:m.sourceId,
        })),
    };
  }).sort((a,b) => lex(a.name,b.name) || lex(a.id,b.id));
}
