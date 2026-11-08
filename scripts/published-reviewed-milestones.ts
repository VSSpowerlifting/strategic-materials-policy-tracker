/**
 * The exact human-reviewed project milestones published in the seed, in seed
 * order: Wagerup and Narva (reviewed 17 October 2026) plus the six Phase III
 * records approved on 8 November 2026 (P3-01 to P3-06). Fail-closed guards in
 * the F5/M3 scripts compare the live seed against this list; promoting any
 * other milestone requires a new human review and an explicit update here.
 */
export const PUBLISHED_REVIEWED_MILESTONE_IDS = [
  "mil-au-alcoa-wagerup-groundbreaking-2026-08-24",
  "mil-au-nolans-construction-started",
  "mil-ca-marathon-early-works-construction-started",
  "mil-ee-neo-narva-commercial-production-reported-2026",
  "mil-us-stibnite-burntlog-construction-started-2026-05-30",
  "mil-us-stibnite-early-works-construction-started-2025-10-21",
  "mil-us-usac-thompson-falls-construction-progress-reported-2026",
  "mil-us-usar-stillwater-phase1a-commissioning-started",
] as const;

export const PUBLISHED_REVIEWED_MILESTONE_COUNT = PUBLISHED_REVIEWED_MILESTONE_IDS.length;
