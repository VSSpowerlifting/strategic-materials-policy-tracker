/**
 * Corpus identity and public collection counts, shared by the full dataset
 * export (`/api/export/dataset.json`) and the dataset manifest
 * (`/api/v1/dataset-manifest`). It reads only the seed loaders and `site`, so
 * the manifest never serializes the full corpus or computes a financial
 * summary to report what the corpus contains.
 */
import { getDatasetSummary } from "./data";
import { site } from "./site";

export const DATASET_NOTICE =
  "Categorical, source-grounded labels only — no synthetic risk scores. Framing claims are anchored to quoted passages. Not legal or compliance advice.";

/** The identity block at the head of `dataset.json`, in its published key order. */
export function datasetIdentity() {
  return {
    name: site.name,
    version: site.version,
    generatedAt: site.lastUpdated,
    scopeFrom: site.scopeStart,
    notice: DATASET_NOTICE,
  };
}

/**
 * The `counts` block of `dataset.json`, in its published key order. Keys
 * match the collection keys of the export (`framing`, not `framingClaims`).
 */
export function datasetCounts() {
  const s = getDatasetSummary();
  return {
    events: s.events,
    framing: s.framingClaims,
    materials: s.materials,
    jurisdictions: s.jurisdictions,
    sources: s.sources,
    financialCommitments: s.financialCommitments,
    controlMeasures: s.controlMeasures,
    organizations: s.organizations,
    projects: s.projects,
    programmes: s.programmes,
    projectDesignations: s.projectDesignations,
    projectMilestones: s.projectMilestones,
  };
}

export type DatasetCollectionKey = keyof ReturnType<typeof datasetCounts>;
