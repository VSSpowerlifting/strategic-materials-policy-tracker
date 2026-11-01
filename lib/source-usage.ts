/**
 * Source dossier loader: the pure explicit-citation index is shared with
 * /coverage so "uncited" means the same thing on both surfaces.
 * Only PUBLIC curated seed data is read; private F5/M3 notes stay isolated.
 */
import {
  getAllControlMeasures, getAllEvents, getAllFinancialCommitments,
  getAllFramingClaims, getAllJurisdictions, getAllMaterials,
  getAllOrganizations, getAllProgrammes, getAllProjectDesignations,
  getAllProjectMilestones, getAllProjects, getAllSources,
} from "./data";
import { buildSourceUseIndex } from "./source-citation-index";
import type { PublishedSourceRecords, SourceUse } from "./source-citation-index";
export { buildSourceUseIndex } from "./source-citation-index";
export type { PublishedSourceRecords, SourceUse } from "./source-citation-index";
export { SOURCE_USE_KINDS, SOURCE_USE_LABELS } from "./source-use-taxonomy";
export type { SourceUseKind } from "./source-use-taxonomy";

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


const publicIndex = buildSourceUseIndex(publishedSourceRecords());

export function getSourceUses(sourceId: string): SourceUse[] {
  return publicIndex.get(sourceId) ?? [];
}
