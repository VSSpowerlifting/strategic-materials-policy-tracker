/**
 * Review-cohort inputs for the M3 project-execution CLIs.
 *
 * M3.2 stays the default and keeps its original queue, file paths and
 * worksheet fingerprints. M3.3 is a separate cohort: its own queue, its own
 * local adjudication file, and proposed sources that are merged into the
 * review context ONLY for M3.3 review — never into data/seed or any public path.
 */
import m32Queue from "../research/project-execution/m3-2-source-review-queue.json";
import m33Queue from "../research/project-execution/m3-3-source-review-queue.json";
import m33ProposedSources from "../research/project-execution/m3-3-proposed-sources.json";
import type { Source } from "../lib/types";
import { getAllSources } from "../lib/data";
import {
  PROJECT_EXECUTION_REVIEW_COHORTS, type ProjectExecutionReviewCohort,
} from "./review-project-execution-pilot";

export type CohortInputs = {
  cohort: ProjectExecutionReviewCohort;
  queue: unknown;
  sources: Source[];
  defaultAdjudicationPath: string;
  exampleAdjudicationPath: string;
};

export function isReviewCohort(v: string): v is ProjectExecutionReviewCohort {
  return Object.prototype.hasOwnProperty.call(PROJECT_EXECUTION_REVIEW_COHORTS, v);
}

/** Proposed sources may not shadow a seeded id; that would let review text replace a public record. */
export function mergeProposedSources(seeded: readonly Source[], proposed: readonly Source[]): Source[] {
  const ids = new Set(seeded.map((s) => s.id));
  for (const s of proposed)
    if (ids.has(s.id)) throw new Error("proposed source " + s.id + " duplicates a seeded source id");
  return [...seeded, ...proposed];
}

export function loadCohortInputs(cohort: ProjectExecutionReviewCohort): CohortInputs {
  if (cohort === "m3-3") return {
    cohort,
    queue: m33Queue,
    sources: mergeProposedSources(getAllSources(), m33ProposedSources as Source[]),
    defaultAdjudicationPath: ".project-execution-review/m3-3-adjudications.json",
    exampleAdjudicationPath: "research/project-execution/m3-3-adjudications.example.json",
  };
  return {
    cohort,
    queue: m32Queue,
    sources: getAllSources(),
    defaultAdjudicationPath: ".project-execution-review/adjudications.json",
    exampleAdjudicationPath: "research/project-execution/m3-2-adjudications.example.json",
  };
}
