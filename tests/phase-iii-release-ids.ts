/**
 * Records admitted by the approved Phase III curated release (rulings P3-01 to
 * P3-06, reviewed and authorized 2026-11-08). Tests that pin an earlier
 * snapshot of the live corpus (an October or early-November cutoff) remove
 * exactly these records so their historical assertions keep meaning what
 * they meant; current-corpus tests assert the records directly.
 */
import type { ProjectMilestone, Source } from "@/lib/types";

export const PHASE_III_RELEASE_CUTOFF = "2026-11-08";
export const PRE_PHASE_III_CUTOFF = "2026-11-06";

export const PHASE_III_MILESTONE_IDS: ReadonlySet<string> = new Set([
  "mil-au-nolans-construction-started",
  "mil-ca-marathon-early-works-construction-started",
  "mil-us-stibnite-burntlog-construction-started-2026-05-30",
  "mil-us-stibnite-early-works-construction-started-2025-10-21",
  "mil-us-usac-thompson-falls-construction-progress-reported-2026",
  "mil-us-usar-stillwater-phase1a-commissioning-started",
]);

export const PHASE_III_SOURCE_IDS: ReadonlySet<string> = new Set([
  "src-usar-stillwater-phase1a-commissioning-2026",
]);

export const PHASE_III_IDS: ReadonlySet<string> = new Set([
  ...PHASE_III_MILESTONE_IDS, ...PHASE_III_SOURCE_IDS,
]);

export const prePhaseIiiMilestones = <T extends Pick<ProjectMilestone, "id">>(rows: readonly T[]): T[] =>
  rows.filter((m) => !PHASE_III_MILESTONE_IDS.has(m.id));

export const prePhaseIiiSources = <T extends Pick<Source, "id">>(rows: readonly T[]): T[] =>
  rows.filter((s) => !PHASE_III_SOURCE_IDS.has(s.id));

/** Every public milestone id after the 8 November 2026 release, in seed (id) order. */
export const PUBLIC_MILESTONE_IDS_AT_PHASE_III: readonly string[] = [
  "mil-au-alcoa-wagerup-groundbreaking-2026-08-24",
  "mil-au-nolans-construction-started",
  "mil-ca-marathon-early-works-construction-started",
  "mil-ee-neo-narva-commercial-production-reported-2026",
  "mil-us-stibnite-burntlog-construction-started-2026-05-30",
  "mil-us-stibnite-early-works-construction-started-2025-10-21",
  "mil-us-usac-thompson-falls-construction-progress-reported-2026",
  "mil-us-usar-stillwater-phase1a-commissioning-started",
];

/** Distinct projects carrying a published milestone after Phase III (Stibnite holds two). */
export const PUBLIC_MILESTONE_PROJECT_IDS_AT_PHASE_III = [
  "prj-au-alcoa-sojitz-gallium",
  "prj-au-nolans",
  "prj-ca-marathon-copper-palladium",
  "prj-ee-neo-rare-earth-magnet-project",
  "prj-us-stibnite",
  "prj-us-usac-thompson-falls-expansion",
  "prj-us-usar-stillwater-magnet",
] as const;
