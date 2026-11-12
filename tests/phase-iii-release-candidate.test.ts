import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { site } from "@/lib/site";
import { PHASE_III_MILESTONE_IDS, PHASE_III_RELEASE_CUTOFF } from "./phase-iii-release-ids";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const candidate = read("research/project-execution/release-candidates/phase-iii-milestones-2026-11-08.json");
const seed: Array<{ id: string; [k: string]: unknown }> = read("data/seed/project-milestones.json");

test("each Phase III seed milestone equals its release-candidate proposal exactly", () => {
  const proposals: Array<{ id: string }> = candidate.proposedProjectMilestones;
  assert.deepEqual(proposals.map((p) => p.id).sort(), [...PHASE_III_MILESTONE_IDS].sort());
  for (const p of proposals) {
    const rows = seed.filter((m) => m.id === p.id);
    assert.equal(rows.length, 1, p.id);
    assert.deepEqual(rows[0], p, p.id);
  }
});

test("the Phase III release candidate preserves its cutoff and deferrals after subsequent corpus releases", () => {
  assert.equal(candidate.proposedCorpusCutoff, PHASE_III_RELEASE_CUTOFF);
  assert.equal(PHASE_III_RELEASE_CUTOFF,"2026-11-08");
  assert.equal(site.lastUpdated,"2026-11-12");
  assert.equal(candidate.publishedCorpusCutoffAtPreparation, "2026-11-06");
  assert.ok(candidate.finalMaintainerAuthorization.excluded.includes("Stibnite financing-row date changes"));
  for (const r of candidate.sourceReviews) {
    assert.equal(r.reviewedBy, "Benjamin Yang");
    assert.equal(r.reviewedAt, "2026-11-08");
  }
});
